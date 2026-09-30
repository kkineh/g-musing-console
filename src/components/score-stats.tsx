import Link from "next/link";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo } from "@/lib/format";
import type { TypeStat } from "@/lib/scores";

type LowRow = {
  id: number;
  title: string | null;
  type: "LOGIC_REVIEW" | "ERROR_CAUSE" | null;
  scoreAvg: number | null;
  member: { name: string };
};

export function ScoreStats({
  stats,
  low,
}: {
  stats: TypeStat[];
  low: LowRow[];
}) {
  if (stats.length === 0) return null;

  return (
    <details className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-card-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 text-[13.5px] [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-3 text-text-3"
        >
          <path d="M4.5 2.5L8 6l-3.5 3.5" />
        </svg>
        <span className="font-semibold text-text">채점 집계</span>
        <span className="text-[12.5px] text-text-3">
          유형별로 나눠서 봅니다
        </span>
      </summary>

      <div className="border-t border-line px-5 py-4">
        <div className="flex flex-col gap-5">
          {stats.map((s) => (
            <div key={s.type ?? "none"}>
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <span className="text-[14px] font-semibold text-text">
                  {chatTypeLabel(s.type)}
                </span>
                <span className="font-mono text-[18px] font-bold tabular-nums text-accent-deep">
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

        {low.length > 0 && (
          <div className="mt-5 border-t border-dashed border-line pt-4">
            <h3 className="mb-2 text-[12.5px] font-semibold text-text-3">
              낮은 점수
            </h3>
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
          </div>
        )}
      </div>
    </details>
  );
}
