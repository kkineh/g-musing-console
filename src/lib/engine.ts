/**
 * 엔진(엔진팀 영역) 호출부. 계약은 docs/engine-contract.md 참고.
 *
 * 이 파일 바깥에서는 엔진이 HTTP인지 큐인지, Agent SDK를 어떻게 부르는지 모른다.
 * ENGINE_URL이 없으면 목업으로 동작해서 엔진 없이도 콘솔을 개발할 수 있다.
 */

export type ChatType = "LOGIC_REVIEW";

export type EngineRequest = {
  type: ChatType;
  memberId: string;
  question: string;
  /** 이어가기일 때만. 첫 턴에는 없다. */
  sessionId?: string;
  /** 되묻기에 답할 때만. { 질문: 선택한 라벨 } */
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
      answer: string;
      references: Reference[];
      trace: TraceStep[];
      usage: EngineUsage;
    }
  | {
      status: "waiting_input";
      sessionId: string;
      questions: PendingQuestion[];
      trace: TraceStep[];
    }
  | {
      status: "failed";
      sessionId?: string;
      error: string;
    };

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

export async function runEngine(req: EngineRequest): Promise<EngineResponse> {
  const base = process.env.ENGINE_URL;
  if (!base) return mockEngine(req);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/process`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new EngineError(`엔진이 ${res.status}로 응답했습니다`, res.status);
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

/** 되묻기 왕복을 재현해서 엔진 없이도 콘솔 흐름을 검증할 수 있게 한다. */
async function mockEngine(req: EngineRequest): Promise<EngineResponse> {
  await sleep(600);

  const sessionId = req.sessionId ?? `mock-${Date.now().toString(36)}`;

  if (needsClarification(req)) {
    return {
      status: "waiting_input",
      sessionId,
      questions: [
        {
          question: "어느 기준으로 조회한 결과인지 알려주세요.",
          header: "조회 기준",
          options: [
            {
              label: "지사 소계",
              description: "지사 단위로 합산한 화면 기준",
            },
            {
              label: "개인별 내역",
              description: "설계사 개인 단위 명세 기준",
            },
          ],
          multiSelect: false,
        },
      ],
      trace: [
        { label: "유형 판별", detail: "로직 확인", elapsedMs: 400 },
        { label: "질문 분석", detail: "조회 기준 불명확", elapsedMs: 2800 },
      ],
    };
  }

  return {
    status: "done",
    sessionId,
    answer: mockAnswer(req),
    references: [
      {
        locator: "PKG_SU_CALC:412",
        description: "SP_SU_JISA_CALC — 합산 기준 분기",
      },
      { locator: "TB_SU_JISA_RATE", description: "대상 지사 등록 행 없음" },
    ],
    trace: [
      { label: "유형 판별", detail: "로직 확인", elapsedMs: 400 },
      { label: "지식베이스 라우팅", detail: "수수료 파이프라인", elapsedMs: 1100 },
      { label: "저장소 탐색", detail: "7개 파일", elapsedMs: 21700 },
      { label: "DB 조회", detail: "4건", elapsedMs: 31400 },
      { label: "응답 작성", elapsedMs: 52800 },
    ],
    usage: { elapsedMs: 107400, tokens: 38200, filesRead: 7, dbQueries: 4 },
  };
}

/** 질문에 조회 기준이 안 적혀 있으면 되묻는다. 목업의 되묻기 발동 조건. */
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
