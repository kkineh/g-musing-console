import { prisma } from "./db";
import type {
  EngineResponse,
  PendingQuestion,
  Reference,
  TraceStep,
} from "./engine";

export type TurnView = {
  id: number;
  seq: number;
  status: "QUEUED" | "RUNNING" | "WAITING_INPUT" | "DONE" | "FAILED";
  question: string;
  answer: string | null;
  references: Reference[];
  trace: TraceStep[];
  pendingQuestions: PendingQuestion[];
  answeredInput: Record<string, string> | null;
  elapsedMs: number | null;
  tokens: number | null;
  filesRead: number | null;
  dbQueries: number | null;
  error: string | null;
  createdAt: Date;
};

export type ChatView = {
  id: number;
  title: string | null;
  memberId: string;
  memberName: string;
  userName: string;
  sessionId: string | null;
  turns: TurnView[];
};

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getChat(id: number): Promise<ChatView | null> {
  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      member: true,
      user: true,
      turns: { orderBy: { seq: "asc" } },
    },
  });
  if (!chat) return null;

  return {
    id: chat.id,
    title: chat.title,
    memberId: chat.memberId,
    memberName: chat.member.name,
    userName: chat.user.name,
    sessionId: chat.sessionId,
    turns: chat.turns.map((t) => ({
      id: t.id,
      seq: t.seq,
      status: t.status,
      question: t.question,
      answer: t.answer,
      references: parse<Reference[]>(t.references, []),
      trace: parse<TraceStep[]>(t.trace, []),
      pendingQuestions: parse<PendingQuestion[]>(t.pendingQuestions, []),
      answeredInput: parse<Record<string, string> | null>(
        t.answeredInput,
        null,
      ),
      elapsedMs: t.elapsedMs,
      tokens: t.tokens,
      filesRead: t.filesRead,
      dbQueries: t.dbQueries,
      error: t.error,
      createdAt: t.createdAt,
    })),
  };
}

export async function listChats(limit = 30) {
  return prisma.chat.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      member: true,
      turns: { orderBy: { seq: "asc" }, take: 1 },
    },
  });
}

export type HistoryRow = {
  id: number;
  title: string;
  memberName: string;
  userName: string;
  createdAt: Date;
  turnCount: number;
  status: TurnView["status"];
  askedBack: boolean;
  answer: string | null;
  elapsedMs: number | null;
  filesRead: number | null;
  dbQueries: number | null;
  tokens: number | null;
  average: number | null;
  scoredBy: string | null;
};

export async function searchHistory(
  query: string,
  limit = 50,
): Promise<HistoryRow[]> {
  const q = query.trim();

  const chats = await prisma.chat.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { turns: { some: { question: { contains: q } } } },
            { turns: { some: { answer: { contains: q } } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      member: true,
      user: true,
      turns: {
        orderBy: { seq: "asc" },
        include: { score: { include: { scoredBy: true } } },
      },
    },
  });

  return chats.map((chat) => {
    const first = chat.turns[0];
    const last = chat.turns.at(-1);
    const scored = chat.turns.find((t) => t.score);

    return {
      id: chat.id,
      title: chat.title ?? first?.question ?? "제목 없음",
      memberName: chat.member.name,
      userName: chat.user.name,
      createdAt: chat.createdAt,
      turnCount: chat.turns.length,
      status: last?.status ?? "QUEUED",
      askedBack: chat.turns.some(
        (t) => t.pendingQuestions !== null || t.answeredInput !== null,
      ),
      answer: last?.answer ?? null,
      elapsedMs: chat.turns.reduce((sum, t) => sum + (t.elapsedMs ?? 0), 0) || null,
      filesRead: sumOrNull(chat.turns.map((t) => t.filesRead)),
      dbQueries: sumOrNull(chat.turns.map((t) => t.dbQueries)),
      tokens: sumOrNull(chat.turns.map((t) => t.tokens)),
      average: scored?.score?.average ?? null,
      scoredBy: scored?.score?.scoredBy.name ?? null,
    };
  });
}

function sumOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

export async function historySummary() {
  const [chatCount, weekCount, unscored, scores] = await Promise.all([
    prisma.chat.count(),
    prisma.chat.count({
      where: { createdAt: { gte: daysAgo(7) } },
    }),
    prisma.turn.count({ where: { status: "DONE", score: null } }),
    prisma.score.aggregate({ _avg: { average: true } }),
  ]);

  return {
    chatCount,
    weekCount,
    unscored,
    averageScore: scores._avg.average,
  };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function applyEngineResult(
  turnId: number,
  chatId: number,
  result: EngineResponse,
) {
  if (result.status === "failed") {
    await prisma.turn.update({
      where: { id: turnId },
      data: {
        status: "FAILED",
        error: result.error,
        rawResult: JSON.stringify(result),
        completedAt: new Date(),
      },
    });
    if (result.sessionId) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { sessionId: result.sessionId },
      });
    }
    return;
  }

  await prisma.chat.update({
    where: { id: chatId },
    data: { sessionId: result.sessionId },
  });

  if (result.status === "waiting_input") {
    await prisma.turn.update({
      where: { id: turnId },
      data: {
        status: "WAITING_INPUT",
        pendingQuestions: JSON.stringify(result.questions),
        trace: JSON.stringify(result.trace),
        rawResult: JSON.stringify(result),
      },
    });
    return;
  }

  await prisma.turn.update({
    where: { id: turnId },
    data: {
      status: "DONE",
      answer: result.answer,
      references: JSON.stringify(result.references),
      trace: JSON.stringify(result.trace),
      rawResult: JSON.stringify(result),
      elapsedMs: result.usage.elapsedMs,
      tokens: result.usage.tokens ?? null,
      filesRead: result.usage.filesRead ?? null,
      dbQueries: result.usage.dbQueries ?? null,
      completedAt: new Date(),
    },
  });
}
