import Link from "next/link";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo } from "@/lib/format";
import type { TypeStat } from "@/lib/scores";

type LowRow = {
  id: number;
  title: string | null;
  type: "LOGIC_REVIEW" | "ERROR_CAUSE" | null;
  scoreAvg: number | null;
  company: { name: string };
};

export function ScoreCriteria({ stats }: { stats: TypeStat[] }) {
  if (stats.length === 0) {
    return <p className="py-2 text-[13px] text-text-3">채점 이력이 없습니다</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {stats.map((s) => (
        <div key={s.type ?? "none"}>
          <div className="mb-2.5 flex items-baseline gap-2.5">
            <span className="text-[13.5px] font-semibold text-text">
              {chatTypeLabel(s.type)}
            </span>
            <span className="font-mono text-[17px] font-bold tabular-nums text-accent-deep">
              {s.average?.toFixed(1) ?? "—"}
            </span>
            <span className="text-[12.5px] text-text-3">{s.count}건</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {s.criteria.map((c) => (
              <div
                key={c.key}
                className="grid grid-cols-[92px_1fr_34px] items-center gap-2.5"
              >
                <span className="text-[12.5px] text-text-2">{c.label}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <span
                    className={`block h-full rounded-full ${
                      (c.average ?? 0) < 6 ? "bg-danger" : "bg-accent"
                    }`}
                    style={{ width: `${((c.average ?? 0) / 10) * 100}%` }}
                  />
                </span>
                <span className="text-right font-mono text-[12.5px] tabular-nums text-text-2">
                  {c.average?.toFixed(1) ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LowScored({ low }: { low: LowRow[] }) {
  if (low.length === 0) {
    return (
      <p className="py-2 text-[13px] text-text-3">
        기준선 아래 대화가 없습니다
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {low.map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.id}`}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2"
        >
          <span className="rounded-md bg-danger-soft px-2 py-0.5 font-mono text-[12.5px] font-bold tabular-nums text-danger">
            {c.scoreAvg?.toFixed(1)}
          </span>
          <span className="font-mono text-[12px] text-text-3">
            {chatNo(c.id)}
          </span>
          <span className="line-clamp-1 text-text-2">{c.title}</span>
        </Link>
      ))}
    </div>
  );
}
