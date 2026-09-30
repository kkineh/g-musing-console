import {
  historySummary,
  searchHistory,
  type HistoryFilter,
  type HistorySort,
  type TurnStatus,
} from "@/lib/chats";
import { HistoryList } from "@/components/history-list";
import { HistoryControls } from "@/components/history-controls";
import { listMembers } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { ChatType } from "@/lib/engine";

export const dynamic = "force-dynamic";

const SORTS: HistorySort[] = ["recent", "score", "duration"];
const STATUSES: TurnStatus[] = [
  "QUEUED",
  "RUNNING",
  "WAITING_INPUT",
  "DONE",
  "FAILED",
  "CANCELED",
];

function one(v: string | string[] | undefined) {
  return typeof v === "string" && v ? v : undefined;
}

export default async function HistoryPage({
  searchParams,
}: PageProps<"/history">) {
  const sp = await searchParams;

  const type = one(sp.type);
  const status = one(sp.status);
  const sort = one(sp.sort);
  const scored = one(sp.scored);

  const filter: HistoryFilter = {
    query: one(sp.q),
    memberId: one(sp.member),
    type: (type as ChatType | undefined) ?? undefined,
    status: STATUSES.includes(status as TurnStatus)
      ? (status as TurnStatus)
      : undefined,
    from: one(sp.from) ? new Date(`${one(sp.from)}T00:00:00+09:00`) : undefined,
    to: one(sp.to) ? new Date(`${one(sp.to)}T23:59:59+09:00`) : undefined,
    scored: scored === "yes" ? true : scored === "no" ? false : undefined,
    userId: one(sp.user),
    sort: SORTS.includes(sort as HistorySort) ? (sort as HistorySort) : "recent",
  };

  const [summary, page, members, users] = await Promise.all([
    historySummary(),
    searchHistory(filter),
    listMembers(),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          처리 이력
        </h1>
        <p className="text-[14.5px] text-text-3">
          지금까지 실행한 질의와 채점 결과입니다.
        </p>
      </div>

      <div className="mb-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="전체 처리" value={summary.chatCount} note="누적 질의" />
        <SummaryCard
          label="평균 점수"
          value={summary.averageScore?.toFixed(1) ?? "—"}
          note={summary.averageScore === null ? "채점 없음" : "채점된 턴 기준"}
          accent
        />
        <SummaryCard label="최근 7일" value={summary.weekCount} note="질의 건수" />
        <SummaryCard
          label="채점 대기"
          value={summary.unscored}
          note="완료된 턴 중"
          alert={summary.unscored > 0}
        />
      </div>

      <HistoryControls
        members={members}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        total={page.total}
      />

      <HistoryList
        key={new URLSearchParams(
          Object.entries(sp).flatMap(([k, v]) =>
            typeof v === "string" ? [[k, v] as [string, string]] : [],
          ),
        ).toString()}
        initialRows={page.rows}
        initialCursor={page.nextCursor}
        query={filter.query ?? ""}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  alert,
  accent,
}: {
  label: string;
  value: string | number;
  note: string;
  alert?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4.5 shadow-card-sm">
      <div className="mb-1.5 text-[13.5px] text-text-3">{label}</div>
      <div
        className={`font-mono text-[28px] leading-[1.15] font-bold tracking-[-0.03em] tabular-nums ${accent ? "text-accent-deep" : "text-text"}`}
      >
        {value}
      </div>
      <div
        className={
          alert
            ? "mt-1 text-[12.5px] font-medium text-warn"
            : "mt-1 text-[12.5px] text-text-3"
        }
      >
        {note}
      </div>
    </div>
  );
}
