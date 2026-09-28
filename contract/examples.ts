const done = {
  status: "done",
  sessionId: "5b3f2c1a-8d4e-4f91-a0c7-2e1b9d3f6a84",
  answer:
    "지급규정 개정이 원인입니다. 2026년 7월 31일 적용된 개정으로 산출 기준이 조직육성지급율 합산 방식으로 바뀌었고, 해당 지사는 개정 후 기준값이 등록되어 있지 않아 합산 대상이 없는 상태로 계산됩니다.",
  references: [
    {
      locator: "PKG_SU_CALC:412",
      description: "합산 기준 분기",
      source: "repo",
      usedInAnswer: true,
    },
    {
      locator: "TB_SU_JISA_RATE",
      description: "대상 지사 등록 행 없음",
      source: "db",
      usedInAnswer: true,
    },
    {
      locator: "수수료 처리 파이프라인",
      description: "0원 산출 시 확인 순서",
      source: "knowledge",
      usedInAnswer: true,
    },
  ],
  trace: [
    { label: "유형 판별", detail: "로직 문의", elapsedMs: 400 },
    { label: "저장소 탐색", detail: "7개 파일", elapsedMs: 21700 },
    { label: "DB 조회", detail: "4건", elapsedMs: 31400 },
    { label: "응답 작성", elapsedMs: 52800 },
  ],
  usage: { elapsedMs: 107400, tokens: 38200, filesRead: 7, dbQueries: 4 },
};

const waitingInput = {
  status: "waiting_input",
  sessionId: "5b3f2c1a-8d4e-4f91-a0c7-2e1b9d3f6a84",
  questions: [
    {
      question: "어느 화면에서 조회한 결과인가요?",
      header: "조회 화면",
      options: [
        { label: "지사 소계", description: "지사 단위로 합산한 화면" },
        { label: "개인별 명세", description: "설계사 단위 내역 화면" },
      ],
      multiSelect: false,
    },
  ],
  trace: [
    { label: "유형 판별", detail: "로직 문의", elapsedMs: 400 },
    { label: "질문 분석", detail: "조회 기준 불명확", elapsedMs: 2800 },
  ],
};

const failed = {
  status: "failed",
  error: "저장소 사본 최신화 실패: 인증 오류",
};

export const RESPONSE_EXAMPLES: [
  string,
  string,
  Record<string, { summary: string; value: unknown }>,
][] = [
  [
    "/process",
    "post",
    {
      done: { summary: "답변 완료", value: done },
      waiting_input: { summary: "되묻기 — 사용자 답을 기다림", value: waitingInput },
      failed: { summary: "실패", value: failed },
    },
  ],
  [
    "/cancel",
    "post",
    { canceled: { summary: "중단됨", value: { canceled: true } } },
  ],
  [
    "/health",
    "get",
    {
      ok: {
        summary: "1건 처리 중",
        value: { ok: true, running: 1, queued: 0 },
      },
    },
  ],
];
