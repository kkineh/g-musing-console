import { prisma } from "./db";
import { averageOf } from "./scores";
import type { ChatType } from "./engine";

/// 시각이 아니라 날짜로 자른다. 정시 기준으로 자르면 "14일 전"에 들어온 건이
/// 몇 시간 차이로 빠져 집계가 하루씩 밀린다.
function daysAgo(days: number) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type Outcome = {
  done: number;
  waitingInput: number;
  failed: number;
  canceled: number;
  running: number;
  total: number;
};

/// 되묻기 대기는 실패가 아니라 정상 흐름이라 성공률 분모에서 뺀다.
export async function outcomes(days: number): Promise<Outcome> {
  const rows = await prisma.turn.groupBy({
    by: ["status"],
    where: { createdAt: { gte: daysAgo(days) } },
    _count: { _all: true },
  });

  const at = (s: string) =>
    rows.find((r) => r.status === s)?._count._all ?? 0;

  const done = at("DONE");
  const failed = at("FAILED");
  const canceled = at("CANCELED");
  const waitingInput = at("WAITING_INPUT");
  const running = at("QUEUED") + at("RUNNING");

  return {
    done,
    waitingInput,
    failed,
    canceled,
    running,
    total: done + failed + canceled + waitingInput + running,
  };
}

export type DailyPoint = {
  date: string;
  label: string;
  done: number;
  failed: number;
  medianMs: number | null;
};

export async function dailyVolume(days: number): Promise<DailyPoint[]> {
  const turns = await prisma.turn.findMany({
    where: { createdAt: { gte: daysAgo(days) } },
    select: { createdAt: true, status: true, elapsedMs: true },
  });

  const buckets = new Map<
    string,
    { done: number; failed: number; durations: number[] }
  >();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dayKey(daysAgo(i)), { done: 0, failed: 0, durations: [] });
  }

  for (const t of turns) {
    const b = buckets.get(dayKey(t.createdAt));
    if (!b) continue;
    if (t.status === "DONE") {
      b.done += 1;
      if (t.elapsedMs !== null) b.durations.push(t.elapsedMs);
    } else if (t.status === "FAILED") b.failed += 1;
  }

  return [...buckets].map(([date, v]) => ({
    date,
    label: date.slice(5).replace("-", "/"),
    done: v.done,
    failed: v.failed,
    medianMs: quantile(
      v.durations.sort((a, b) => a - b),
      0.5,
    ),
  }));
}

function dayKey(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export type Cost = {
  medianMs: number | null;
  p90Ms: number | null;
  avgTokens: number | null;
  avgFilesRead: number | null;
  avgDbQueries: number | null;
};

/// 평균은 긴 꼬리에 끌려가므로 중앙값과 p90을 같이 본다.
export async function cost(days: number): Promise<Cost> {
  const turns = await prisma.turn.findMany({
    where: {
      status: "DONE",
      createdAt: { gte: daysAgo(days) },
      elapsedMs: { not: null },
    },
    select: {
      elapsedMs: true,
      tokens: true,
      filesRead: true,
      dbQueries: true,
    },
  });

  const ms = turns
    .map((t) => t.elapsedMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  return {
    medianMs: quantile(ms, 0.5),
    p90Ms: quantile(ms, 0.9),
    avgTokens: averageOrNull(turns.map((t) => t.tokens)),
    avgFilesRead: averageOrNull(turns.map((t) => t.filesRead)),
    avgDbQueries: averageOrNull(turns.map((t) => t.dbQueries)),
  };
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return null;
  const at = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[at];
}

function averageOrNull(values: (number | null)[]) {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? averageOf(present) : null;
}

export type AskBack = {
  turnsWithQuestion: number;
  answered: number;
  totalTurns: number;
};

/// 되묻기가 과하면 사용자가 지치고, 아예 없으면 틀린 가정을 그냥 밀어버린다.
export async function askBack(days: number): Promise<AskBack> {
  const since = daysAgo(days);
  const [turnsWithQuestion, answered, totalTurns] = await Promise.all([
    prisma.turn.count({
      where: { createdAt: { gte: since }, pendingQuestions: { not: null } },
    }),
    prisma.turn.count({
      where: { createdAt: { gte: since }, answeredInput: { not: null } },
    }),
    prisma.turn.count({ where: { createdAt: { gte: since } } }),
  ]);

  return { turnsWithQuestion, answered, totalTurns };
}

export type CompanyUsage = {
  id: string;
  name: string;
  chats: number;
  scoreAvg: number | null;
};

export async function companyUsage(days: number): Promise<CompanyUsage[]> {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      chats: {
        where: { createdAt: { gte: daysAgo(days) } },
        select: { scoreAvg: true },
      },
    },
  });

  return companies
    .map((c) => ({
      id: c.id,
      name: c.name,
      chats: c.chats.length,
      scoreAvg: averageOrNull(c.chats.map((ch) => ch.scoreAvg)),
    }))
    .sort((a, b) => b.chats - a.chats);
}

export type TypeMix = {
  type: ChatType | null;
  count: number;
};

export async function typeMix(days: number): Promise<TypeMix[]> {
  const rows = await prisma.chat.groupBy({
    by: ["type"],
    where: { createdAt: { gte: daysAgo(days) } },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({ type: r.type, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export type ScoreTrend = {
  bucket: string;
  average: number | null;
  count: number;
};

/// 주 단위로 묶어 품질이 오르는지 본다. 일별로는 채점 수가 적어 튄다.
export async function scoreTrend(weeks: number): Promise<ScoreTrend[]> {
  const scores = await prisma.score.findMany({
    where: { createdAt: { gte: daysAgo(weeks * 7) } },
    select: { createdAt: true, average: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<string, number[]>();
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.set(weekLabel(i), []);
  }

  for (const s of scores) {
    const weeksBack = Math.floor(
      (Date.now() - s.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const key = weekLabel(weeksBack);
    buckets.get(key)?.push(s.average);
  }

  return [...buckets].map(([bucket, values]) => ({
    bucket,
    average: values.length ? averageOf(values) : null,
    count: values.length,
  }));
}

function weekLabel(weeksBack: number) {
  if (weeksBack === 0) return "이번 주";
  if (weeksBack === 1) return "지난주";
  return `${weeksBack}주 전`;
}

export type Backlog = {
  unscored: number;
  waitingInput: number;
  stuck: number;
};

/// 사람이 손대야 하는 것들. 쌓이면 서비스가 멈춘 것처럼 보인다.
export async function backlog(): Promise<Backlog> {
  const [unscored, waitingInput, stuck] = await Promise.all([
    prisma.turn.count({ where: { status: "DONE", score: null } }),
    prisma.turn.count({ where: { status: "WAITING_INPUT" } }),
    prisma.turn.count({
      where: {
        status: { in: ["QUEUED", "RUNNING"] },
        createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    }),
  ]);

  return { unscored, waitingInput, stuck };
}
