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
      type: "LOGIC_REVIEW",
      title: "성과수수료 미산출 사유",
      sessionId: "seed-session-b",
      memberId: "gist-v2",
      userId: jimin.id,
      turns: {
        create: [
          {
            seq: 1,
            status: "DONE",
            question:
              "특정 설계사의 성과수수료가 안 나옵니다. 실적은 등록되어 있는데 지급 내역에 안 보입니다.",
            answer:
              "개인별 명세 기준으로 확인한 결과, 해당 설계사는 평가 기간 중 위촉 상태가 변경되어 성과 산출 대상에서 제외되었습니다. 실적 자체는 정상 등록되어 있습니다.",
            pendingQuestions: JSON.stringify([
              {
                question: "어느 화면에서 조회한 결과인가요?",
                header: "조회 화면",
                options: [
                  { label: "지사 소계", description: "지사 단위 합산" },
                  { label: "개인별 명세", description: "설계사 단위 내역" },
                ],
                multiSelect: false,
              },
            ]),
            answeredInput: JSON.stringify({
              "어느 화면에서 조회한 결과인가요?": "개인별 명세",
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
            question: "그러면 위촉 상태가 언제 바뀐 건지도 알 수 있나요?",
            answer:
              "위촉 이력 테이블 기준으로 2026년 6월 18일에 변경되었습니다. 평가 기간이 6월 전체라 산출 시점에는 이미 제외 대상이었습니다.",
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
      type: "LOGIC_REVIEW",
      title: "모집수수료율 산출 기준",
      sessionId: "seed-session-c",
      memberId: "gist-v1",
      userId: sangmin.id,
      turns: {
        create: {
          seq: 1,
          status: "WAITING_INPUT",
          question: "모집수수료율이 예상과 다르게 나옵니다. 어떤 기준으로 정해지나요?",
          pendingQuestions: JSON.stringify([
            {
              question: "어느 채널의 수수료율을 보고 계신가요?",
              header: "채널",
              options: [
                { label: "직영", description: "본사 직영 조직" },
                { label: "대리점", description: "위탁 대리점" },
              ],
              multiSelect: false,
            },
          ]),
          trace: JSON.stringify([
            { label: "유형 판별", detail: "로직 확인", elapsedMs: 400 },
            { label: "질문 분석", detail: "채널 구분 불명확", elapsedMs: 2600 },
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
