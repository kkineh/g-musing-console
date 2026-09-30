"use client";

import { useState } from "react";
import { scoreAction } from "@/app/score/actions";
import { ScoreForm, type ScoreValues } from "./score-form";

export function ScorePanel({
  turnId,
  chatId,
  score,
}: {
  turnId: number;
  chatId: number;
  score: (ScoreValues & { average: number; scoredBy: string }) | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 border-t border-dashed border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 text-left"
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`size-3 text-text-3 ${open ? "rotate-90" : ""}`}
        >
          <path d="M4.5 2.5L8 6l-3.5 3.5" />
        </svg>
        <span className="text-[13px] font-semibold text-text-2">채점</span>
        <span className="ml-auto">
          {score ? (
            <span className="rounded-md bg-accent-soft px-2.5 py-0.5 font-mono text-[13px] font-bold tabular-nums text-accent-deep">
              {score.average.toFixed(1)}
            </span>
          ) : (
            <span className="text-[12.5px] text-text-3">미채점</span>
          )}
        </span>
      </button>

      {open && (
        <div className="mt-4">
          {score && (
            <p className="mb-3 text-[12.5px] text-text-3">
              {score.scoredBy}이 매김. 다시 저장하면 덮어씁니다.
            </p>
          )}
          <ScoreForm
            turnId={turnId}
            chatId={chatId}
            initial={score}
            action={scoreAction}
            submitLabel={score ? "채점 수정" : "채점 저장"}
          />
        </div>
      )}
    </div>
  );
}
