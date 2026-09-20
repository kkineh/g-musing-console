"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

export function Composer({
  action,
  memberName,
  hidden,
  placeholder = "SR 내용을 붙여넣으세요",
}: {
  action: (formData: FormData) => void;
  memberName: string;
  hidden?: Record<string, string | number>;
  placeholder?: string;
}) {
  return (
    <form
      action={action}
      className="mt-6 overflow-hidden rounded-2xl bg-surface shadow-card-lg"
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <Field placeholder={placeholder} />
      <div className="flex items-center gap-3 px-4 pt-3 pb-3.5">
        <span className="mr-auto text-[13px] text-text-3">
          회원사 {memberName} · 읽기 전용 DB로 조회합니다
        </span>
        <Submit />
      </div>
    </form>
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
      className="block min-h-[58px] w-full resize-none bg-transparent px-4.5 py-3.5 text-[15.5px] leading-[1.7] text-text outline-none placeholder:text-text-3 disabled:opacity-60"
    />
  );
}

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13.5px] font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "엔진 처리 중…" : "보내기"}
    </button>
  );
}
