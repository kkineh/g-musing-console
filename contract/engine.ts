import { oc } from "@orpc/contract";
import * as z from "zod";

export const ChatType = z.enum(["LOGIC_REVIEW", "ERROR_CAUSE"]);

export const Reference = z.object({
  locator: z.string().meta({ example: "PKG_SU_CALC:412" }),
  description: z.string().meta({ example: "합산 기준 분기" }),
  source: z.enum(["repo", "db", "knowledge"]),
  usedInAnswer: z.boolean().optional(),
});

export const TraceStep = z.object({
  label: z.string().meta({ example: "저장소 탐색" }),
  detail: z.string().optional().meta({ example: "7개 파일" }),
  elapsedMs: z.number().int(),
});

export const PendingQuestion = z.object({
  question: z.string().meta({ example: "어느 화면에서 조회한 결과인가요?" }),
  header: z.string().meta({ example: "조회 화면" }),
  options: z.array(
    z.object({ label: z.string(), description: z.string() }),
  ),
  multiSelect: z.boolean(),
});

export const EngineUsage = z.object({
  elapsedMs: z.number().int(),
  tokens: z.number().int().optional(),
  filesRead: z.number().int().optional(),
  dbQueries: z.number().int().optional(),
});

const Done = z.object({
    status: z.literal("done"),
    sessionId: z.string(),
    answer: z.string(),
    references: z.array(Reference),
    trace: z.array(TraceStep),
    usage: EngineUsage,
  });

const WaitingInput = z.object({
    status: z.literal("waiting_input"),
    sessionId: z.string(),
    questions: z.array(PendingQuestion),
    trace: z.array(TraceStep),
  });

const Failed = z.object({
    status: z.literal("failed"),
    sessionId: z.string().optional(),
    error: z.string(),
  });

export const EngineResponse = z.discriminatedUnion("status", [
  Done,
  WaitingInput,
  Failed,
]);

export const process = oc
  .route({
    method: "POST",
    path: "/process",
    summary: "질의 처리",
    description:
      "새 대화를 시작하거나 기존 대화를 이어간다. 되묻기가 필요하면 waiting_input으로 돌려주고, 사용자 답을 받아 다시 호출된다.",
  })
  .input(
    z.object({
      question: z.string(),
      memberId: z.string().meta({ example: "hll" }),
      type: ChatType.optional().meta({
        description: "엔진이 스스로 판별하면 불필요. 협의 대상",
      }),
      sessionId: z.string().optional().meta({
        description: "이어가기일 때만. 첫 턴에는 없다",
      }),
      answers: z.record(z.string(), z.string()).optional().meta({
        description: "되묻기에 답할 때만. { 질문: 선택한 라벨 }",
      }),
    }),
  )
  .output(EngineResponse);

export const cancel = oc
  .route({
    method: "POST",
    path: "/cancel",
    summary: "처리 중단",
    description: "사용자가 취소를 눌렀을 때. 실행을 멈추고 저장소 사본을 정리한다.",
  })
  .input(z.object({ sessionId: z.string() }))
  .output(
    z.object({ canceled: z.boolean() }),
  );

export const health = oc
  .route({
    method: "GET",
    path: "/health",
    summary: "상태 확인",
    description: "엔진이 살아있는지, 지금 몇 건을 처리 중인지.",
  })
  .output(
    z.object({
      ok: z.boolean(),
      running: z.number().int(),
      queued: z.number().int(),
    }),
  );

export const contract = { process, cancel, health };
