import { prisma } from "./db";
import { refreshChatRollup } from "./chats";
import type { ChatType } from "./engine";

/// 항목은 evaluation-draft.md 기준 5개. 6번째(의존성 처리)는 엔진팀과 확정 후 추가한다.
export const SCORE_CRITERIA = [
  {
    key: "pathAccuracy",
    label: "경로 정확도",
    hint: "화면 → 조회 로직 → 매퍼 → 테이블까지, 근거로 댄 경로가 실제와 맞는가",
  },
  {
    key: "scopeMatch",
    label: "범위 일치",
    hint: "SR에 적힌 범위 안에서만 처리했는가",
  },
  {
    key: "convention",
    label: "컨벤션",
    hint: "레포의 기존 네이밍·구현 패턴과 같은가",
  },
  {
    key: "contentAccuracy",
    label: "내용 정확도",
    hint: "요청한 결과가 실제로 나오는가",
  },
  {
    key: "askBackSafety",
    label: "되물음 안전성",
    hint: "위험한 지점에서 되물었는가, 유추했다면 그 사실을 밝혔는가",
  },
] as const;

export type ScoreKey = (typeof SCORE_CRITERIA)[number]["key"];

export type ScoreInput = Partial<Record<ScoreKey, number | null>> & {
  note?: string | null;
};

/// 매긴 항목만으로 평균을 낸다. "해당 없음"은 분모에서 빠진다.
export function averageOf(values: (number | null | undefined)[]) {
  const scored = values.filter((v): v is number => typeof v === "number");
  if (scored.length === 0) return 0;
  return scored.reduce((a, b) => a + b, 0) / scored.length;
}

export async function saveScore(
  turnId: number,
  scoredById: string,
  input: ScoreInput,
) {
  const values = SCORE_CRITERIA.map((c) => input[c.key] ?? null);
  const average = averageOf(values);

  const data = {
    pathAccuracy: input.pathAccuracy ?? null,
    scopeMatch: input.scopeMatch ?? null,
    convention: input.convention ?? null,
    contentAccuracy: input.contentAccuracy ?? null,
    askBackSafety: input.askBackSafety ?? null,
    note: input.note?.trim() || null,
    average,
    scoredById,
  };

  const turn = await prisma.turn.findUnique({
    where: { id: turnId },
    select: { chatId: true },
  });
  if (!turn) return null;

  const score = await prisma.score.upsert({
    where: { turnId },
    update: data,
    create: { turnId, ...data },
  });

  await refreshChatRollup(turn.chatId);
  return score;
}

export async function deleteScore(turnId: number) {
  const turn = await prisma.turn.findUnique({
    where: { id: turnId },
    select: { chatId: true, score: { select: { id: true } } },
  });
  if (!turn?.score) return;

  await prisma.score.delete({ where: { turnId } });
  await refreshChatRollup(turn.chatId);
}

export type TypeStat = {
  type: ChatType | null;
  count: number;
  average: number | null;
  criteria: { key: ScoreKey; label: string; average: number | null }[];
};

/// 유형별로 나눠서 낸다. 유형이 다르면 점수 체계가 다르므로 섞지 않는다.
export async function scoreStats(): Promise<TypeStat[]> {
  const scored = await prisma.score.findMany({
    select: {
      pathAccuracy: true,
      scopeMatch: true,
      convention: true,
      contentAccuracy: true,
      askBackSafety: true,
      average: true,
      turn: { select: { chat: { select: { type: true } } } },
    },
  });

  const groups = new Map<string, typeof scored>();
  for (const row of scored) {
    const key = row.turn.chat.type ?? "";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups].map(([key, rows]) => ({
    type: (key || null) as ChatType | null,
    count: rows.length,
    average: rows.length ? averageOf(rows.map((r) => r.average)) : null,
    criteria: SCORE_CRITERIA.map((c) => {
      const values = rows.map((r) => r[c.key]);
      const present = values.filter((v): v is number => typeof v === "number");
      return {
        key: c.key,
        label: c.label,
        average: present.length ? averageOf(present) : null,
      };
    }),
  }));
}

/// 기준선 아래 대화. 개선 재료는 잘 된 것보다 안 된 것에서 나온다.
export async function lowScored(threshold = 6, limit = 10) {
  return prisma.chat.findMany({
    where: { scoreAvg: { not: null, lt: threshold } },
    orderBy: { scoreAvg: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      type: true,
      scoreAvg: true,
      member: { select: { name: true } },
    },
  });
}

export async function unscoredTurns(limit = 50) {
  return prisma.turn.findMany({
    where: { status: "DONE", score: null },
    orderBy: { completedAt: "asc" },
    take: limit,
    select: {
      id: true,
      question: true,
      chat: {
        select: {
          id: true,
          title: true,
          type: true,
          member: { select: { name: true } },
        },
      },
    },
  });
}
