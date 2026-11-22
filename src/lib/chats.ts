import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type {
  ChatType,
  EngineResponse,
  PendingQuestion,
  Reference,
  TraceStep,
} from "./engine";

export type TurnStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING_INPUT"
  | "DONE"
  | "FAILED"
  | "CANCELED";

export type TurnView = {
  id: number;
  seq: number;
  status: TurnStatus;
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
  score: {
    pathAccuracy: number | null;
    scopeMatch: number | null;
    convention: number | null;
    contentAccuracy: number | null;
    askBackSafety: number | null;
    note: string | null;
    average: number;
    scoredBy: string;
  } | null;
};

export type ChatView = {
  id: number;
  publicId: string;
  type: ChatType | null;
  title: string | null;
  companyId: string | null;
  companyName: string | null;
  memberName: string;
  sessionId: string | null;
  deletedAt: Date | null;
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

export async function getChat(publicId: string): Promise<ChatView | null> {
  const chat = await prisma.chat.findUnique({
    where: { publicId },
    include: {
      company: true,
      member: true,
      turns: {
        orderBy: { seq: "asc" },
        include: { score: { include: { scoredBy: true } } },
      },
    },
  });
  if (!chat) return null;

  return {
    id: chat.id,
    publicId: chat.publicId,
    type: chat.type,
    title: chat.title,
    companyId: chat.companyId,
    companyName: chat.company?.name ?? null,
    memberName: chat.member.name,
    sessionId: chat.sessionId,
    deletedAt: chat.deletedAt,
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
      score: t.score
        ? {
            pathAccuracy: t.score.pathAccuracy,
            scopeMatch: t.score.scopeMatch,
            convention: t.score.convention,
            contentAccuracy: t.score.contentAccuracy,
            askBackSafety: t.score.askBackSafety,
            note: t.score.note,
            average: t.score.average,
            scoredBy: t.score.scoredBy.name,
          }
        : null,
    })),
  };
}

export async function listChats(limit = 30) {
  return prisma.chat.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      company: true,
      turns: { orderBy: { seq: "asc" }, take: 1 },
    },
  });
}

export type HistoryRow = {
  id: number;
  publicId: string;
  type: ChatType | null;
  title: string;
  companyId: string | null;
  companyName: string | null;
  memberId: string;
  memberName: string;
  createdAt: Date;
  deleted: boolean;
  turnCount: number;
  status: TurnStatus;
  askedBack: boolean;
  answer: string | null;
  elapsedMs: number | null;
  filesRead: number | null;
  dbQueries: number | null;
  tokens: number | null;
  average: number | null;
  scoredBy: string | null;
};

export type HistorySort = "recent" | "score" | "duration";

export type HistoryFilter = {
  query?: string;
  companyId?: string;
  type?: ChatType;
  status?: TurnStatus;
  from?: Date;
  to?: Date;
  scored?: boolean;
  memberId?: string;
  sort?: HistorySort;
  /// 관리자만 true. 삭제(숨김)된 대화도 채점 재료로 본다.
  includeDeleted?: boolean;
  cursor?: number;
  limit?: number;
};

export const HISTORY_PAGE_SIZE = 20;

function historyWhere(f: HistoryFilter) {
  const q = f.query?.trim();

  return {
    ...(!f.includeDeleted && { deletedAt: null }),
    ...(q && {
      OR: [
        { title: { contains: q } },
        { turns: { some: { question: { contains: q } } } },
        { turns: { some: { answer: { contains: q } } } },
      ],
    }),
    ...(f.companyId && { companyId: f.companyId }),
    ...(f.type && { type: f.type }),
    ...(f.status && { lastStatus: f.status }),
    ...(f.memberId && { memberId: f.memberId }),
    ...(f.scored !== undefined && {
      scoreAvg: f.scored ? { not: null } : null,
    }),
    ...((f.from || f.to) && {
      createdAt: { ...(f.from && { gte: f.from }), ...(f.to && { lte: f.to }) },
    }),
  };
}

const SORT_ORDER: Record<HistorySort, Prisma.ChatOrderByWithRelationInput[]> = {
  recent: [{ createdAt: "desc" }, { id: "desc" }],
  score: [{ scoreAvg: { sort: "desc", nulls: "last" } }, { id: "desc" }],
  duration: [{ totalMs: { sort: "desc", nulls: "last" } }, { id: "desc" }],
};

export async function searchHistory(filter: HistoryFilter = {}): Promise<{
  rows: HistoryRow[];
  total: number;
  nextCursor: number | null;
}> {
  const take = filter.limit ?? HISTORY_PAGE_SIZE;
  const where = historyWhere(filter);

  const [total, chats] = await Promise.all([
    prisma.chat.count({ where }),
    prisma.chat.findMany({
      where,
      orderBy: SORT_ORDER[filter.sort ?? "recent"],
      take: take + 1,
      ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
      include: {
        company: true,
        member: true,
        turns: {
          orderBy: { seq: "asc" },
          include: { score: { include: { scoredBy: true } } },
        },
      },
    }),
  ]);

  const hasMore = chats.length > take;
  const page = hasMore ? chats.slice(0, take) : chats;

  return {
    total,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    rows: page.map((chat) => {
      const first = chat.turns[0];
      const last = chat.turns.at(-1);
      const scored = chat.turns.find((t) => t.score);

      return {
        id: chat.id,
        publicId: chat.publicId,
        type: chat.type,
        title: chat.title ?? first?.question ?? "제목 없음",
        companyId: chat.companyId,
        companyName: chat.company?.name ?? null,
        memberId: chat.memberId,
        memberName: chat.member.name,
        createdAt: chat.createdAt,
        deleted: chat.deletedAt != null,
        turnCount: chat.turns.length,
        status: chat.lastStatus,
        askedBack: chat.turns.some(
          (t) => t.pendingQuestions !== null || t.answeredInput !== null,
        ),
        answer: last?.answer ?? null,
        elapsedMs: chat.totalMs,
        filesRead: sumOrNull(chat.turns.map((t) => t.filesRead)),
        dbQueries: sumOrNull(chat.turns.map((t) => t.dbQueries)),
        tokens: sumOrNull(chat.turns.map((t) => t.tokens)),
        average: chat.scoreAvg,
        scoredBy: scored?.score?.scoredBy.name ?? null,
      };
    }),
  };
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

/// Chat의 lastStatus·totalMs·scoreAvg를 턴에서 다시 계산한다.
/// 턴 상태나 채점이 바뀐 뒤 반드시 부른다.
export async function refreshChatRollup(chatId: number) {
  const turns = await prisma.turn.findMany({
    where: { chatId },
    orderBy: { seq: "asc" },
    select: { status: true, elapsedMs: true, score: { select: { average: true } } },
  });

  const averages = turns
    .map((t) => t.score?.average)
    .filter((a): a is number => a !== undefined && a !== null);

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      lastStatus: turns.at(-1)?.status ?? "QUEUED",
      totalMs: turns.reduce((sum, t) => sum + (t.elapsedMs ?? 0), 0) || null,
      scoreAvg: averages.length
        ? averages.reduce((a, b) => a + b, 0) / averages.length
        : null,
    },
  });
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
    await refreshChatRollup(chatId);
    return;
  }

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      sessionId: result.sessionId,
      ...(result.type && { type: result.type }),
    },
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
    await refreshChatRollup(chatId);
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
  await refreshChatRollup(chatId);
}
