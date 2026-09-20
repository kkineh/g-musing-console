import { historySummary, searchHistory } from "@/lib/chats";
import { HistoryRowCard } from "@/components/history-row";
import { HistorySearch } from "@/components/history-search";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: PageProps<"/history">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  const [summary, rows] = await Promise.all([
    historySummary(),
    searchHistory(query),
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
        />
        <SummaryCard label="최근 7일" value={summary.weekCount} note="질의 건수" />
        <SummaryCard
          label="채점 대기"
          value={summary.unscored}
          note="완료된 턴 중"
          alert={summary.unscored > 0}
        />
      </div>

      <HistorySearch defaultValue={query} />

      {rows.length === 0 ? (
        <p className="mt-6 text-[14.5px] text-text-3">
          {query
            ? `"${query}"에 해당하는 질의가 없습니다.`
            : "아직 질의가 없습니다."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((row) => (
            <HistoryRowCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  alert,
}: {
  label: string;
  value: string | number;
  note: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface px-5 py-4.5 shadow-card-sm">
      <div className="mb-1.5 text-[13.5px] text-text-3">{label}</div>
      <div className="text-[28px] leading-[1.15] font-bold tracking-[-0.03em] tabular-nums">
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
