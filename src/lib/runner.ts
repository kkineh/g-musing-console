import { prisma } from "./db";
import { applyEngineResult, refreshChatRollup } from "./chats";
import {
  cancelEngine,
  EngineError,
  runEngine,
  type EngineEvent,
  type EngineRequest,
  type TraceStep,
} from "./engine";

/// 진행 중인 턴의 중간 출력. 프로세스 메모리에만 있고 재시작하면 사라진다.
/// 최종 결과는 DB에 있으므로 없어져도 화면은 복구된다.
type Live = {
  steps: TraceStep[];
  answer: string;
  listeners: Set<(event: EngineEvent) => void>;
  canceled: boolean;
};

/// 개발 중 핫리로드로 모듈이 다시 평가돼도 진행 중인 턴을 잃지 않도록 전역에 둔다.
const globalForRunner = globalThis as unknown as {
  musingLive?: Map<number, Live>;
};
const registry = (globalForRunner.musingLive ??= new Map<number, Live>());

export function isRunning(turnId: number) {
  return registry.has(turnId);
}

export function subscribe(
  turnId: number,
  listener: (event: EngineEvent) => void,
): () => void {
  const entry = registry.get(turnId);
  if (!entry) return () => {};

  for (const step of entry.steps) listener({ kind: "step", step });
  if (entry.answer) listener({ kind: "delta", text: entry.answer });

  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

/// 요청과 분리해서 돌린다. 브라우저가 떠나도 계속된다.
export function startTurn(turnId: number, chatId: number, req: EngineRequest) {
  if (registry.has(turnId)) return;

  const entry: Live = {
    steps: [],
    answer: "",
    listeners: new Set(),
    canceled: false,
  };
  registry.set(turnId, entry);

  void (async () => {
    try {
      await prisma.turn.update({
        where: { id: turnId },
        data: { status: "RUNNING" },
      });
      await refreshChatRollup(chatId);

      const result = await runEngine(req, (event) => {
        if (event.kind === "step") entry.steps.push(event.step);
        if (event.kind === "delta") entry.answer += event.text;
        for (const listener of entry.listeners) listener(event);
      });

      if (entry.canceled) return;
      await applyEngineResult(turnId, chatId, result);
    } catch (e) {
      if (entry.canceled) return;
      await applyEngineResult(turnId, chatId, {
        status: "failed",
        error: e instanceof EngineError ? e.message : "엔진 호출에 실패했습니다",
      });
    } finally {
      registry.delete(turnId);
    }
  })();
}

export async function cancelTurn(turnId: number) {
  const turn = await prisma.turn.findUnique({
    where: { id: turnId },
    include: { chat: true },
  });
  if (!turn) return;
  if (turn.status !== "RUNNING" && turn.status !== "QUEUED") return;

  const entry = registry.get(turnId);
  if (entry) {
    entry.canceled = true;
    registry.delete(turnId);
  }

  await cancelEngine({
    requestId: turn.requestId,
    sessionId: turn.chat.sessionId ?? undefined,
  });

  await prisma.turn.update({
    where: { id: turnId },
    data: { status: "CANCELED", completedAt: new Date() },
  });
  await refreshChatRollup(turn.chatId);
}

/// 프로세스가 죽으면 RUNNING인 턴이 남는다. 다시 뜰 때 실패로 정리한다.
export async function reapStaleTurns() {
  const stale = await prisma.turn.findMany({
    where: { status: { in: ["RUNNING", "QUEUED"] } },
    select: { id: true, chatId: true },
  });

  const orphans = stale.filter((t) => !registry.has(t.id));
  if (orphans.length === 0) return 0;

  await prisma.turn.updateMany({
    where: { id: { in: orphans.map((t) => t.id) } },
    data: {
      status: "FAILED",
      error: "서버가 재시작되어 처리가 중단되었습니다",
      completedAt: new Date(),
    },
  });

  for (const chatId of new Set(orphans.map((t) => t.chatId))) {
    await refreshChatRollup(chatId);
  }
  return orphans.length;
}
