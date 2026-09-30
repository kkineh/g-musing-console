"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { SCORE_CRITERIA, averageOf, type ScoreKey } from "@/lib/scores";

export type ScoreValues = Partial<Record<ScoreKey, number | null>> & {
  note?: string | null;
};

export function ScoreForm({
  turnId,
  chatId,
  initial,
  action,
  submitLabel = "채점 저장",
}: {
  turnId: number;
  chatId?: number;
  initial?: ScoreValues | null;
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(
      SCORE_CRITERIA.map((c) => [c.key, initial?.[c.key] ?? 5]),
    ),
  );

  const average = averageOf(SCORE_CRITERIA.map((c) => values[c.key]));
  const scoredCount = SCORE_CRITERIA.filter(
    (c) => typeof values[c.key] === "number",
  ).length;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="turnId" value={turnId} />
      {chatId !== undefined && (
        <input type="hidden" name="chatId" value={chatId} />
      )}

      <div className="flex flex-col gap-3.5">
        {SCORE_CRITERIA.map((c) => {
          const value = values[c.key];
          const off = value === null;

          return (
            <div key={c.key}>
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-[13.5px] font-medium text-text">
                  {c.label}
                </span>
                <span className="text-[12px] text-text-3">{c.hint}</span>
                <span className="ml-auto font-mono text-[13px] font-bold tabular-nums text-accent-deep">
                  {off ? "—" : value}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={off ? 5 : value}
                  disabled={off}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [c.key]: Number(e.target.value) }))
                  }
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-[var(--accent)] disabled:opacity-40"
                />
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-text-3">
                  <input
                    type="checkbox"
                    checked={off}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [c.key]: e.target.checked ? null : 5,
                      }))
                    }
                    className="accent-[var(--accent)]"
                  />
                  해당 없음
                </label>
              </div>

              <input
                type="hidden"
                name={c.key}
                value={off ? "" : String(value)}
              />
            </div>
          );
        })}
      </div>

      <textarea
        name="note"
        rows={2}
        defaultValue={initial?.note ?? ""}
        placeholder="채점 사유 (선택)"
        className="w-full resize-none rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none placeholder:text-text-3 focus:outline-2 focus:outline-accent-line"
      />

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-text-3">
          평균{" "}
          <span className="font-mono text-[15px] font-bold text-accent-deep">
            {scoredCount ? average.toFixed(1) : "—"}
          </span>
          {scoredCount < SCORE_CRITERIA.length && (
            <span className="ml-1.5 text-[12px]">
              {SCORE_CRITERIA.length - scoredCount}개 제외
            </span>
          )}
        </span>
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="ml-auto rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep disabled:opacity-60"
    >
      {pending ? "저장 중…" : label}
    </button>
  );
}
