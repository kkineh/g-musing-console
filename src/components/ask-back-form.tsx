"use client";

import { useFormStatus } from "react-dom";
import type { PendingQuestion } from "@/lib/engine";
import { answerAction } from "@/app/actions";

export function AskBackForm({
  turnId,
  questions,
}: {
  turnId: number;
  questions: PendingQuestion[];
}) {
  return (
    <form action={answerAction} className="rounded-xl border border-line bg-warn-soft p-4.5">
      <input type="hidden" name="turnId" value={turnId} />

      <div className="mb-3.5 flex items-center gap-2">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-4 text-warn"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M6.2 6a1.9 1.9 0 113.1 1.5c-.6.4-1.3.8-1.3 1.6M8 11.5v.2" />
        </svg>
        <span className="text-sm font-semibold text-warn">
          확인이 필요합니다
        </span>
      </div>

      <div className="flex flex-col gap-4.5">
        {questions.map((q, qi) => (
          <fieldset key={q.question} className="border-0 p-0">
            <legend className="mb-2.5 text-[15px] leading-[1.6] text-text">
              {q.question}
            </legend>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt.label}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 hover:border-gray-node-line has-checked:ring-2 has-checked:ring-accent-line"
                >
                  <input
                    type={q.multiSelect ? "checkbox" : "radio"}
                    name={`q${qi}`}
                    value={opt.label}
                    required={!q.multiSelect}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-text">
                      {opt.label}
                    </span>
                    <span className="block text-[13px] text-text-3">
                      {opt.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 rounded-lg bg-accent px-4 py-2 text-[13.5px] font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "엔진 처리 중…" : "답하고 이어가기"}
    </button>
  );
}
