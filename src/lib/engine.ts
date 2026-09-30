// 계약: docs/engine-contract.md

export type ChatType = "LOGIC_REVIEW" | "ERROR_CAUSE";

export const CHAT_TYPES: { value: ChatType; label: string }[] = [
  { value: "LOGIC_REVIEW", label: "로직 문의" },
  { value: "ERROR_CAUSE", label: "오류 원인 확인" },
];

export function chatTypeLabel(type: ChatType | null) {
  if (!type) return "미분류";
  return CHAT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type EngineRequest = {
  /// 콘솔이 만든다. 취소와 재시도 중복 차단에 쓴다.
  requestId: string;
  memberId: string;
  question: string;
  sessionId?: string;
  answers?: Record<string, string>;
};

export type Reference = {
  locator: string;
  description: string;
};

export type TraceStep = {
  label: string;
  detail?: string;
  elapsedMs: number;
};

export type PendingQuestion = {
  question: string;
  header: string;
  options: { label: string; description: string }[];
  multiSelect: boolean;
};

export type EngineUsage = {
  elapsedMs: number;
  tokens?: number;
  filesRead?: number;
  dbQueries?: number;
};

export type EngineResponse =
  | {
      status: "done";
      sessionId: string;
      /// 엔진이 판별한 유형. 콘솔은 보내지 않는다.
      type?: ChatType;
      answer: string;
      references: Reference[];
      trace: TraceStep[];
      usage: EngineUsage;
    }
  | {
      status: "waiting_input";
      sessionId: string;
      type?: ChatType;
      questions: PendingQuestion[];
      trace: TraceStep[];
    }
  | {
      status: "failed";
      sessionId?: string;
      type?: ChatType;
      error: string;
    };

/// 엔진이 처리 중에 흘려보내는 것. SSE로 받는다.
export type EngineEvent =
  | { kind: "step"; step: TraceStep }
  | { kind: "delta"; text: string }
  | { kind: "result"; response: EngineResponse };

export class EngineError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

const TIMEOUT_MS = 5 * 60 * 1000;

export async function runEngine(
  req: EngineRequest,
  onEvent?: (event: EngineEvent) => void,
): Promise<EngineResponse> {
  const base = process.env.ENGINE_URL;
  if (!base) return mockEngine(req, onEvent);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/process`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: onEvent ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new EngineError(`엔진이 ${res.status}로 응답했습니다`, res.status);
    }

    if (onEvent && res.headers.get("content-type")?.includes("text/event-stream")) {
      return readEventStream(res, onEvent);
    }
    return (await res.json()) as EngineResponse;
  } catch (e) {
    if (e instanceof EngineError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new EngineError("엔진 응답이 5분을 넘었습니다");
    }
    throw new EngineError(
      e instanceof Error ? e.message : "엔진 호출에 실패했습니다",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function readEventStream(
  res: Response,
  onEvent: (event: EngineEvent) => void,
): Promise<EngineResponse> {
  const reader = res.body?.getReader();
  if (!reader) throw new EngineError("엔진 응답 본문이 비어 있습니다");

  const decoder = new TextDecoder();
  let buffer = "";
  let final: EngineResponse | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let split: number;
    while ((split = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);

      const data = raw
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!data) continue;

      const event = JSON.parse(data) as EngineEvent;
      onEvent(event);
      if (event.kind === "result") final = event.response;
    }
  }

  if (!final) throw new EngineError("엔진이 결과 없이 연결을 닫았습니다");
  return final;
}

export async function cancelEngine(req: {
  requestId: string;
  sessionId?: string;
}): Promise<boolean> {
  const base = process.env.ENGINE_URL;
  if (!base) return true;

  try {
    const res = await fetch(`${base}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { canceled: boolean };
    return body.canceled;
  } catch {
    return false;
  }
}

async function mockEngine(
  req: EngineRequest,
  onEvent?: (event: EngineEvent) => void,
): Promise<EngineResponse> {
  const sessionId = req.sessionId ?? `mock-${Date.now().toString(36)}`;
  const clarify = needsClarification(req);
  const type: ChatType = /오류|안 나|틀리|불일치|0원/.test(req.question)
    ? "ERROR_CAUSE"
    : "LOGIC_REVIEW";

  const steps: TraceStep[] = clarify
    ? [
        { label: "유형 판별", detail: chatTypeLabel(type), elapsedMs: 400 },
        { label: "질문 분석", detail: "조회 기준 불명확", elapsedMs: 2800 },
      ]
    : [
        { label: "유형 판별", detail: chatTypeLabel(type), elapsedMs: 400 },
        { label: "Wiki 라우팅", detail: "수수료 파이프라인", elapsedMs: 1100 },
        { label: "저장소 탐색", detail: "7개 파일", elapsedMs: 21700 },
        { label: "DB 조회", detail: "4건", elapsedMs: 31400 },
        { label: "응답 작성", elapsedMs: 52800 },
      ];

  for (const step of steps) {
    await sleep(onEvent ? 500 : 120);
    onEvent?.({ kind: "step", step });
  }

  if (clarify) {
    const response: EngineResponse = {
      status: "waiting_input",
      sessionId,
      type,
      questions: [
        {
          question: "어느 기준으로 조회한 결과인지 알려주세요.",
          header: "조회 기준",
          options: [
            { label: "지사 소계", description: "지사 단위로 합산한 화면 기준" },
            { label: "개인별 내역", description: "설계사 개인 단위 명세 기준" },
          ],
          multiSelect: false,
        },
      ],
      trace: steps,
    };
    onEvent?.({ kind: "result", response });
    return response;
  }

  const answer = mockAnswer(req);
  if (onEvent) {
    for (let at = 0; at < answer.length; at += 24) {
      await sleep(40);
      onEvent({ kind: "delta", text: answer.slice(at, at + 24) });
    }
  }

  const response: EngineResponse = {
    status: "done",
    sessionId,
    type,
    answer,
    references: [
      {
        locator: "PKG_SU_CALC:412",
        description: "SP_SU_JISA_CALC — 합산 기준 분기",
      },
      { locator: "TB_SU_JISA_RATE", description: "대상 지사 등록 행 없음" },
    ],
    trace: steps,
    usage: { elapsedMs: 107400, tokens: 38200, filesRead: 7, dbQueries: 4 },
  };
  onEvent?.({ kind: "result", response });
  return response;
}

function needsClarification(req: EngineRequest): boolean {
  if (req.answers) return false;
  return !/소계|개인별|명세|기준/.test(req.question);
}

function mockAnswer(req: EngineRequest): string {
  const note =
    "\n\n(목업 응답입니다. ENGINE_URL을 설정하면 실제 엔진이 응답합니다.)";

  if (req.answers) {
    const picked = Object.values(req.answers).join(", ");
    return `"${picked}" 기준으로 다시 확인했습니다. 해당 기준에서는 합산 대상이 달라지며, 산출 로직 자체는 정상 동작합니다.${note}`;
  }
  return `지급규정 개정이 원인입니다. 2026년 7월 31일 적용된 개정으로 산출 기준이 바뀌었고, 해당 건은 개정 후 기준값이 등록되어 있지 않아 0원으로 산출됩니다.${note}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
