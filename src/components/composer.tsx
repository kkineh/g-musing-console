"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CHAT_TYPES, type ChatType } from "@/lib/engine";

export function Composer({
  action,
  memberName,
  hidden,
  placeholder = "SR 내용을 붙여넣으세요",
  pickType,
}: {
  action: (formData: FormData) => void;
  memberName: string;
  hidden?: Record<string, string | number>;
  placeholder?: string;
  pickType?: boolean;
}) {
  const [type, setType] = useState<ChatType>("LOGIC_REVIEW");
  const hint = CHAT_TYPES.find((t) => t.value === type)?.hint;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-6 pt-4.5 pb-5.5 [background:linear-gradient(to_top,var(--bg)_60%,transparent)]">
      <form
        action={action}
        className="pointer-events-auto w-full max-w-[820px] rounded-2xl border border-line bg-surface shadow-card-lg"
      >
        {hidden &&
          Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

        {pickType && (
          <>
            <input type="hidden" name="type" value={type} />
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5">
              {CHAT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  aria-pressed={type === t.value}
                  className={
                    type === t.value
                      ? "cursor-pointer rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent-deep"
                      : "cursor-pointer rounded-lg bg-surface-3 px-3 py-1.5 text-[12.5px] font-semibold text-text-2 hover:bg-line"
                  }
                >
                  {t.label}
                </button>
              ))}
              <span className="text-[12.5px] text-text-3">{hint}</span>
            </div>
          </>
        )}

        <Field placeholder={placeholder} />
        <div className="flex items-center gap-3 border-t border-line px-4 pt-2.5 pb-3">
          <span className="mr-auto text-[11.5px] text-text-3">
            <span className="font-mono">{memberName}</span> · 읽기 전용 DB로 조회합니다
          </span>
          <Submit />
        </div>
      </form>
    </div>
  );
}

function Field({ placeholder }: { placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { pending } = useFormStatus();

  return (
    <textarea
      ref={ref}
      name="question"
      rows={2}
      required
      disabled={pending}
      placeholder={placeholder}
      onInput={() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
      }}
      className="block min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-[14.5px] leading-[1.7] text-text outline-none placeholder:text-text-3 disabled:opacity-60"
    />
  );
}

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "엔진 처리 중…" : "보내기"}
    </button>
  );
}
