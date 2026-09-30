"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EngineEvent, TraceStep } from "@/lib/engine";
import { cancelAction } from "@/app/actions";
import { formatDuration } from "@/lib/format";

export function LiveTurn({
  turnId,
  chatId,
}: {
  turnId: number;
  chatId: number;
}) {
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [answer, setAnswer] = useState("");
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource(`/api/turns/${turnId}/stream`);

    source.onmessage = (e) => {
      const event = JSON.parse(e.data) as EngineEvent;
      if (event.kind === "step") setSteps((prev) => [...prev, event.step]);
      if (event.kind === "delta") setAnswer((prev) => prev + event.text);
    };

    source.addEventListener("done", () => {
      source.close();
      router.refresh();
    });

    source.onerror = () => {
      source.close();
      router.refresh();
    };

    return () => source.close();
  }, [turnId, router]);

  return (
    <div>
      {steps.length > 0 && (
        <div className="mb-4 flex flex-col gap-1.5 rounded-xl border border-line bg-surface-2 px-4 py-3">
          {steps.map((step, i) => (
            <div
              key={`${step.label}-${i}`}
              className="flex items-center gap-2.5 text-[13.5px] text-text-2"
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-[15px] shrink-0 text-good"
              >
                <path d="M2.5 7.5l3 3 6-7" />
              </svg>
              <span>
                {step.label}
                {step.detail ? ` — ${step.detail}` : ""}
              </span>
              <span className="ml-auto font-mono text-[12.5px] text-text-3">
                {formatDuration(step.elapsedMs)}
              </span>
            </div>
          ))}
        </div>
      )}

      {answer ? (
        <div className="text-[15.5px] leading-[1.85] whitespace-pre-wrap text-text-2">
          {answer}
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-accent" />
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[15px] text-text-3">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-accent" />
          엔진이 처리하고 있습니다…
        </p>
      )}

      <form action={cancelAction} className="mt-4">
        <input type="hidden" name="turnId" value={turnId} />
        <input type="hidden" name="chatId" value={chatId} />
        <button
          type="submit"
          className="rounded-lg bg-surface-3 px-3.5 py-1.5 text-[13px] font-medium text-text-2 hover:bg-line hover:text-text"
        >
          취소
        </button>
      </form>
    </div>
  );
}
