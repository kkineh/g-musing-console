import {
  searchHistory,
  type HistoryFilter,
  type HistorySort,
  type TurnStatus,
} from "@/lib/chats";
import { HistoryList } from "@/components/history-list";
import { HistoryControls } from "@/components/history-controls";
import { listCompanies } from "@/lib/session";
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
    companyId: one(sp.company),
    type: (type as ChatType | undefined) ?? undefined,
    status: STATUSES.includes(status as TurnStatus)
      ? (status as TurnStatus)
      : undefined,
    from: one(sp.from) ? new Date(`${one(sp.from)}T00:00:00+09:00`) : undefined,
    to: one(sp.to) ? new Date(`${one(sp.to)}T23:59:59+09:00`) : undefined,
    scored: scored === "yes" ? true : scored === "no" ? false : undefined,
    memberId: one(sp.member),
    sort: SORTS.includes(sort as HistorySort) ? (sort as HistorySort) : "recent",
  };

  const [page, companies, members] = await Promise.all([
    searchHistory(filter),
    listCompanies(),
    prisma.member.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1.5 text-title leading-[1.25] font-bold tracking-[-0.03em]">
          처리 이력
        </h1>
        <p className="text-body text-text-3">
          지금까지 실행한 질의와 채점 결과입니다.
        </p>
      </div>

      <HistoryControls
        companies={companies}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
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
