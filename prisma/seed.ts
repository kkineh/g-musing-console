import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

async function main() {
  await prisma.chat.deleteMany();
  await prisma.member.deleteMany();

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

  await prisma.member.create({
    data: { id: "hll", name: "한화라이프랩" },
  });

  const chats: Prisma.ChatCreateInput[] = [
    {
      type: "LOGIC_REVIEW",
      title: "지사수수료계 0원 산출 사유",
      sessionId: "seed-session-a",
      member: { connect: { id: "hll" } },
      user: { connect: { id: sangmin.id } },
      createdAt: ago(1),
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
            { label: "유형 판별", detail: "로직 문의", elapsedMs: 400 },
            { label: "저장소 탐색", detail: "7개 파일", elapsedMs: 21700 },
            { label: "DB 조회", detail: "4건", elapsedMs: 31400 },
          ]),
          elapsedMs: 107400,
          tokens: 38200,
          filesRead: 7,
          dbQueries: 4,
          completedAt: ago(1),
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
    {
      type: "LOGIC_REVIEW",
      title: "성과수수료 미산출 사유",
      sessionId: "seed-session-b",
      member: { connect: { id: "hll" } },
      user: { connect: { id: jimin.id } },
      createdAt: ago(3),
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
            references: JSON.stringify([
              { locator: "TB_HR_WICHOK_HIST", description: "평가 기간 중 상태 변경" },
              { locator: "PKG_SU_CALC:880", description: "성과 산출 대상 필터" },
            ]),
            trace: JSON.stringify([
              { label: "유형 판별", detail: "로직 문의", elapsedMs: 400 },
              { label: "질문 분석", detail: "조회 화면 불명확", elapsedMs: 2400 },
              { label: "저장소 탐색", detail: "5개 파일", elapsedMs: 18600 },
              { label: "DB 조회", detail: "6건", elapsedMs: 27200 },
            ]),
            filesRead: 5,
            dbQueries: 6,
            tokens: 41700,
            elapsedMs: 94000,
            completedAt: ago(3),
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
            references: JSON.stringify([
              { locator: "TB_HR_WICHOK_HIST", description: "26.06.18 상태 변경 행" },
            ]),
            trace: JSON.stringify([
              { label: "DB 조회", detail: "2건", elapsedMs: 9800 },
              { label: "응답 작성", elapsedMs: 28400 },
            ]),
            filesRead: 0,
            dbQueries: 2,
            tokens: 12400,
            elapsedMs: 41000,
            completedAt: ago(3),
          },
        ],
      },
    },
    {
      type: "ERROR_CAUSE",
      title: "모집수수료율 산출 기준",
      sessionId: "seed-session-c",
      member: { connect: { id: "hll" } },
      user: { connect: { id: sangmin.id } },
      createdAt: ago(5),
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
            { label: "유형 판별", detail: "오류 원인 확인", elapsedMs: 400 },
            { label: "질문 분석", detail: "채널 구분 불명확", elapsedMs: 2600 },
          ]),
        },
      },
    },
    {
      type: "ERROR_CAUSE",
      title: "시책금 반영 후 합계 불일치",
      sessionId: "seed-session-d",
      member: { connect: { id: "hll" } },
      user: { connect: { id: jimin.id } },
      createdAt: ago(9),
      turns: {
        create: {
          seq: 1,
          status: "FAILED",
          question: "시책금을 반영했는데 합계가 안 맞습니다. 확인 부탁드립니다.",
          error: "저장소 사본 최신화 실패: origin에 연결할 수 없습니다",
          trace: JSON.stringify([
            { label: "유형 판별", detail: "오류 원인 확인", elapsedMs: 400 },
          ]),
          elapsedMs: 3200,
          completedAt: ago(9),
        },
      },
    },
    {
      title: "해촉 설계사 수수료 환수 기준",
      member: { connect: { id: "hll" } },
      user: { connect: { id: sangmin.id } },
      createdAt: ago(12),
      turns: {
        create: {
          seq: 1,
          status: "CANCELED",
          question: "해촉된 설계사의 기지급 수수료 환수 기준이 어떻게 되나요?",
          trace: JSON.stringify([
            { label: "유형 판별", elapsedMs: 400 },
          ]),
          elapsedMs: 8100,
          completedAt: ago(12),
        },
      },
    },
    {
      type: "LOGIC_REVIEW",
      title: "지점장수수료 조직육성지급율 합산",
      sessionId: "seed-session-f",
      member: { connect: { id: "hll" } },
      user: { connect: { id: jimin.id } },
      createdAt: ago(18),
      turns: {
        create: {
          seq: 1,
          status: "DONE",
          question: "지점장수수료의 조직육성지급율 합산 기준이 궁금합니다.",
          answer:
            "조직육성지급율은 하위 조직의 실적 합계에 단계별 지급율을 곱해 합산합니다. 최대 560%까지 누적되며, 그 이상은 절사됩니다.",
          references: JSON.stringify([
            { locator: "PKG_SU_CALC:1120", description: "조직육성 합산 루프" },
          ]),
          trace: JSON.stringify([
            { label: "유형 판별", detail: "로직 문의", elapsedMs: 400 },
            { label: "저장소 탐색", detail: "5개 파일", elapsedMs: 15300 },
          ]),
          elapsedMs: 123000,
          tokens: 44100,
          filesRead: 5,
          dbQueries: 6,
          completedAt: ago(18),
        },
      },
    },
  ];

  for (const data of chats) {
    const chat = await prisma.chat.create({
      data,
      include: { turns: { orderBy: { seq: "asc" }, include: { score: true } } },
    });

    const averages = chat.turns
      .map((t) => t.score?.average)
      .filter((a): a is number => a !== undefined && a !== null);

    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        lastStatus: chat.turns.at(-1)?.status ?? "QUEUED",
        totalMs:
          chat.turns.reduce((sum, t) => sum + (t.elapsedMs ?? 0), 0) || null,
        scoreAvg: averages.length
          ? averages.reduce((a, b) => a + b, 0) / averages.length
          : null,
      },
    });
  }

  const docs = [
    {
      slug: "commission-pipeline",
      title: "수수료 처리 파이프라인",
      category: "수수료/산출",
      author: "김지민",
      body: [
        "수수료 산출은 마감 확정부터 지급 확정까지 다섯 단계를 순서대로 거친다. 각 단계는 앞 단계 결과 테이블을 입력으로 받으며, 중간 단계를 건너뛰면 이후 산출값이 전부 어긋난다.",
        "",
        "## 단계별 프로시저",
        "",
        "프로시저 코드는 회원사와 버전에 따라 다르다. 아래는 `gist-v2` 기준이며, v1은 `SP_SU_*_OLD` 계열을 쓴다.",
        "",
        "| 단계 | 프로시저 | 산출 대상 | 결과 테이블 |",
        "| --- | --- | --- | --- |",
        "| 1 | `SP_SU_MAGAM` | 마감 확정 | `TB_SU_MAGAM` |",
        "| 2 | `SP_SU_MOJIP_CALC` | 모집수수료 | `TB_SU_MOJIP` |",
        "| 3 | `SP_SU_JISA_CALC` | 지사수수료 | `TB_SU_JISA` |",
        "| 4 | `SP_SU_SEONGGWA` | 성과수수료 | `TB_SU_SEONGGWA` |",
        "| 5 | `SP_SU_JIGUP_FIX` | 지급 확정 | `TB_SU_JIGUP` |",
        "",
        "> **0원 산출을 만났을 때** — 대부분 로직 결함이 아니라 마스터 데이터 누락이다. 먼저 해당 단계의 기준율 테이블(`TB_SU_*_RATE`)에 대상 행이 있는지 확인한다.",
        "",
        "## 추적 순서",
        "",
        "값이 이상할 때는 결과 테이블에서 거슬러 올라가는 편이 빠르다. 프로시저 내부의 `INSERT INTO` 대상 테이블명을 먼저 찾고, 그 테이블을 채우는 분기 조건을 확인하면 대부분 한 번에 원인이 잡힌다.",
        "",
        "- 결과 테이블에 대상 건이 아예 없는지, 값만 0인지 구분",
        "- 기준율 테이블에 해당 조직·기간 행이 등록되어 있는지 확인",
        "- 지급규정 개정일 전후로 분기가 갈리는지 확인",
        "- 앞 단계 결과가 정상인지 역순으로 점검",
        "",
        "## 주의할 점",
        "",
        "지급규정이 개정되면 산출 기준 자체가 바뀐다. 개정일 이전 데이터와 이후 데이터를 같은 기준으로 비교하면 안 된다.",
      ].join("\n"),
    },
    {
      slug: "cms-process",
      title: "CMS 수수료 프로세스",
      category: "수수료/연동",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "commission-glossary",
      title: "수수료 용어 사전",
      category: "수수료",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "issue-patterns",
      title: "이슈 처리 패턴",
      category: "이슈처리/처리",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "issue-triage",
      title: "SR 접수 시 유형 분류 기준",
      category: "이슈처리/접수",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "issue-escalation",
      title: "에스컬레이션이 필요한 경우",
      category: "이슈처리/처리",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "payment-rule-history",
      title: "지급규정 개정 이력",
      category: "규정/지급규정",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "payment-rule-glossary",
      title: "지급규정 조항 용어 정리",
      category: "규정/지급규정",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "org-structure",
      title: "조직·직급 체계",
      category: "조직·인사",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "member-lifecycle",
      title: "설계사 위촉·해촉 처리",
      category: "조직·인사/설계사",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "member-onboarding",
      title: "신규 설계사 등록 절차",
      category: "조직·인사/설계사",
      author: "한상민",
      body: "작성 예정.",
    },
    {
      slug: "gitlab-repo-map",
      title: "회원사별 GitLab 저장소 매핑",
      category: "시스템·연동",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "member-db-access",
      title: "회원사 DB 접속 정보와 권한",
      category: "시스템·연동",
      author: "김지민",
      body: "작성 예정.",
    },
    {
      slug: "onboarding-checklist",
      title: "신규 팀원 온보딩 체크리스트",
      category: "온보딩",
      author: "한상민",
      body: "작성 예정.",
    },
  ];

  for (const doc of docs) {
    await prisma.wikiDoc.upsert({
      where: { slug: doc.slug },
      update: doc,
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
