import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** 되묻기가 섞인 대화를 포함해, 화면 개발에 필요한 최소한의 예시를 넣는다. */
async function main() {
  // 여러 번 돌려도 같은 상태가 되도록 대화부터 비운다. 턴과 채점은 cascade로 함께 지워진다.
  await prisma.chat.deleteMany();

  const [sangmin, jimin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "sangmin@example.com" },
      update: {},
      create: { email: "sangmin@example.com", name: "한상민", role: "admin" },
    }),
    prisma.user.upsert({
      where: { email: "jimin@example.com" },
      update: {},
      create: { email: "jimin@example.com", name: "김지민", role: "admin" },
    }),
  ]);

  await Promise.all([
    prisma.member.upsert({
      where: { id: "gist-v2" },
      update: {},
      create: { id: "gist-v2", name: "GIST V2" },
    }),
    prisma.member.upsert({
      where: { id: "gist-v1" },
      update: {},
      create: { id: "gist-v1", name: "GIST V1" },
    }),
  ]);

  // 한 번에 끝난 대화
  await prisma.chat.create({
    data: {
      type: "LOGIC_REVIEW",
      title: "지사수수료계 0원 산출 사유",
      sessionId: "seed-session-a",
      memberId: "gist-v2",
      userId: sangmin.id,
      turns: {
        create: {
          seq: 1,
          status: "DONE",
          question:
            "지사수수료계가 0원으로 산출됩니다. 2026년 7월 지급분이고, 해당 지사는 소속 설계사 12명 전원 실적이 있는데도 합계가 0으로 찍힙니다.",
          answer:
            "지급규정 개정이 원인입니다. 2026년 7월 31일 적용된 개정으로 산출 기준이 조직육성지급율 합산 방식으로 바뀌었고, 해당 지사는 개정 후 기준값이 등록되어 있지 않아 합산 대상이 없는 상태로 계산됩니다.",
          references: JSON.stringify([
            { locator: "PKG_SU_CALC:412", description: "합산 기준 분기" },
            { locator: "TB_SU_JISA_RATE", description: "대상 지사 등록 행 없음" },
          ]),
          trace: JSON.stringify([
            { label: "유형 판별", detail: "로직 확인", elapsedMs: 400 },
            { label: "저장소 탐색", detail: "7개 파일", elapsedMs: 21700 },
            { label: "DB 조회", detail: "4건", elapsedMs: 31400 },
          ]),
          elapsedMs: 107400,
          tokens: 38200,
          filesRead: 7,
          dbQueries: 4,
          completedAt: new Date(),
          score: {
            create: {
              pathAccuracy: 9,
              scopeMatch: 10,
              convention: 7,
              contentAccuracy: 9,
              askBackSafety: 8,
              average: 8.6,
              scoredById: sangmin.id,
            },
          },
        },
      },
    },
  });

  // 되묻기를 거쳐 두 턴으로 끝난 대화
  await prisma.chat.create({
    data: {
      type: "FORCE_DML",
      title: "시책 처리보류 147건 삭제",
      sessionId: "seed-session-b",
      memberId: "gist-v2",
      userId: jimin.id,
      turns: {
        create: [
          {
            seq: 1,
            status: "DONE",
            question: "시책 처리보류 상태인 147건을 삭제해주세요.",
            answer:
              "삭제 범위를 확인한 뒤 진행했습니다. 연결된 직접비 데이터까지 포함해 DML을 정리했습니다.",
            pendingQuestions: JSON.stringify([
              {
                question: "삭제 범위를 어디까지 잡을까요?",
                header: "삭제 범위",
                options: [
                  { label: "해당 테이블만", description: "명시된 테이블만" },
                  { label: "연결 테이블까지", description: "직접비 포함" },
                ],
                multiSelect: false,
              },
            ]),
            answeredInput: JSON.stringify({
              "삭제 범위를 어디까지 잡을까요?": "연결 테이블까지",
            }),
            elapsedMs: 94000,
            completedAt: new Date(),
            score: {
              create: {
                pathAccuracy: 8,
                scopeMatch: 9,
                convention: 8,
                contentAccuracy: 8,
                askBackSafety: 10,
                average: 8.6,
                scoredById: jimin.id,
              },
            },
          },
          {
            seq: 2,
            status: "DONE",
            question: "검증 SELECT도 같이 만들어주세요.",
            answer: "삭제 전후를 대조할 수 있는 확인 쿼리를 추가했습니다.",
            elapsedMs: 41000,
            completedAt: new Date(),
          },
        ],
      },
    },
  });

  // 되묻고 답을 기다리는 중인 대화
  await prisma.chat.create({
    data: {
      type: "FORCE_DML",
      title: "후보자리스트 정리",
      sessionId: "seed-session-c",
      memberId: "gist-v1",
      userId: sangmin.id,
      turns: {
        create: {
          seq: 1,
          status: "WAITING_INPUT",
          question: "후보자리스트에서 중복 등록된 건을 지워주세요.",
          pendingQuestions: JSON.stringify([
            {
              question: "대상 회원사를 알려주세요.",
              header: "회원사",
              options: [
                { label: "GIST V1", description: "gist-v1" },
                { label: "GIST V2", description: "gist-v2" },
              ],
              multiSelect: false,
            },
          ]),
          trace: JSON.stringify([
            { label: "유형 판별", detail: "데이터 강제 반영", elapsedMs: 400 },
          ]),
        },
      },
    },
  });

  const docs = [
    {
      slug: "commission-pipeline",
      title: "수수료 처리 파이프라인",
      category: "수수료",
      body: "## 개요\n\n수수료 산출은 접수 → 검증 → 산출 → 확정 네 단계로 나뉜다.\n\n각 단계는 별도 프로시저로 구현되어 있으며, 단계 사이의 중간 결과는 임시 테이블에 남는다.",
    },
    {
      slug: "cms-process",
      title: "CMS 수수료 프로세스",
      category: "수수료",
      body: "작성 예정.",
    },
    {
      slug: "issue-patterns",
      title: "이슈 처리 패턴",
      category: "이슈처리",
      body: "작성 예정.",
    },
  ];

  for (const doc of docs) {
    await prisma.wikiDoc.upsert({
      where: { slug: doc.slug },
      update: {},
      create: doc,
    });
  }

  console.log("시드 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
