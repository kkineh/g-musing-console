"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export type MemberOption = { id: string; name: string };

const LAST_MEMBER_KEY = "lastMemberId";

export function Composer({
  action,
  memberName,
  members,
  hidden,
  placeholder = "SR 내용을 붙여넣으세요",
}: {
  action: (formData: FormData) => void;
  memberName?: string;
  members?: MemberOption[];
  hidden?: Record<string, string | number>;
  placeholder?: string;
}) {
  /// 마지막으로 쓴 회원사를 기본값으로. useState 초기화 함수는 브라우저에서만
  /// 도는 첫 렌더에 한 번 불리므로 effect로 덮어쓸 필요가 없다.
  const [memberId, setMemberId] = useState(() => {
    const fallback = members?.[0]?.id ?? "";
    if (typeof window === "undefined" || !members?.length) return fallback;
    try {
      const saved = localStorage.getItem(LAST_MEMBER_KEY);
      return saved && members.some((m) => m.id === saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  function pickMember(id: string) {
    setMemberId(id);
    try {
      localStorage.setItem(LAST_MEMBER_KEY, id);
    } catch {
      /* 무시 */
    }
  }

  const activeName =
    members?.find((m) => m.id === memberId)?.name ?? memberName ?? "";

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-[236px] z-10 flex justify-center px-6 pt-4.5 pb-5.5 [background:linear-gradient(to_top,var(--bg)_60%,transparent)]">
      <form
        action={action}
        className="pointer-events-auto w-full max-w-[820px] rounded-2xl border border-line bg-surface shadow-card-lg"
      >
        {hidden &&
          Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

        {members && members.length > 0 && (
          <>
            <input type="hidden" name="memberId" value={memberId} />
            {members.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickMember(m.id)}
                    aria-pressed={memberId === m.id}
                    className={
                      memberId === m.id
                        ? "cursor-pointer rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent-deep"
                        : "cursor-pointer rounded-lg bg-surface-3 px-3 py-1.5 text-[12.5px] font-semibold text-text-2 hover:bg-line"
                    }
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <Field placeholder={placeholder} />
        <div className="flex items-center gap-3 border-t border-line px-4 pt-2.5 pb-3">
          <span className="mr-auto text-[11.5px] text-text-3">
            <span className="font-mono" suppressHydrationWarning>
              {activeName}
            </span> · 읽기 전용 DB로 조회합니다
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
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          ref.current?.form?.requestSubmit();
        }
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
