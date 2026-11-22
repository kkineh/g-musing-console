"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

export type CompanyOption = { id: string; name: string };

const LAST_COMPANY_KEY = "lastCompanyId";

/// 저장값은 이 탭 밖에서 바뀌어도 따라가지 않는다. 읽는 시점만 하이드레이션 뒤로 미룬다.
const subscribeNothing = () => () => {};

function readSavedCompanyId() {
  try {
    return localStorage.getItem(LAST_COMPANY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function Composer({
  action,
  companies,
  hidden,
  placeholder = "SR 내용을 붙여넣으세요",
}: {
  action: (formData: FormData) => void;
  companies?: CompanyOption[];
  hidden?: Record<string, string | number>;
  placeholder?: string;
}) {
  /// 마지막으로 쓴 회원사를 복원한다. 없으면 빈 값 — 첫 회원사로 멋대로 채우지
  /// 않는다. 엉뚱한 회원사로 조회되는 것보다 안 고른 게 드러나는 편이 낫다.
  /// 서버와 하이드레이션은 빈 값으로 그리고, 그 뒤에 localStorage 값으로 바뀐다.
  /// 렌더 중에 localStorage를 바로 읽으면 서버(빈 값)와 브라우저(저장된 값)가 달라
  /// 하이드레이션이 깨진다.
  const savedId = useSyncExternalStore(
    subscribeNothing,
    readSavedCompanyId,
    () => "",
  );
  const [pickedId, setPickedId] = useState<string | null>(null);
  const companyId =
    pickedId ?? (companies?.some((c) => c.id === savedId) ? savedId : "");

  function pickCompany(id: string) {
    setPickedId(id);
    try {
      if (id) localStorage.setItem(LAST_COMPANY_KEY, id);
      else localStorage.removeItem(LAST_COMPANY_KEY);
    } catch {
      /* 무시 */
    }
  }

  /// 입력창이 fixed라 본문 흐름에서 빠져 있다. 본문이 그만큼 아래를 비우도록
  /// 실제 높이를 알려준다 — 글이 길어져 textarea가 늘어나면 같이 따라온다.
  const shellRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--composer-h",
        `${Math.round(entry.contentRect.height)}px`,
      );
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--composer-h");
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="pointer-events-none fixed right-0 bottom-0 left-[236px] z-10 flex justify-center px-6 pt-4.5 pb-5.5 [background:linear-gradient(to_top,var(--bg)_60%,transparent)]"
    >
      <form
        action={action}
        className="pointer-events-auto w-full max-w-[820px] rounded-2xl border border-line bg-surface shadow-card-lg"
      >
        {hidden &&
          Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

        {companies && companies.length > 0 && (
          <input type="hidden" name="companyId" value={companyId} />
        )}

        <Field placeholder={placeholder} />

        <div className="flex items-center gap-3 px-3 pb-3">
          {companies && companies.length > 0 && (
            <CompanyPicker
              companies={companies}
              value={companyId}
              onPick={pickCompany}
            />
          )}
          <div className="ml-auto">
            <Submit />
          </div>
        </div>
      </form>
    </div>
  );
}

/// 회원사가 계속 늘어나 태그 나열로는 감당이 안 된다. 검색 가능한 드롭다운으로
/// 받되, 목록이 입력창을 가리지 않도록 위로 띄운다.
function CompanyPicker({
  companies,
  value,
  onPick,
}: {
  companies: CompanyOption[];
  value: string;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = companies.find((c) => c.id === value);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? companies.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.id.toLowerCase().includes(needle),
      )
    : companies;

  /// 열 때마다 검색어를 비우고 선택된 항목에 커서를 둔다. 여는 쪽에서 직접
  /// 초기화해야 effect가 열림을 뒤늦게 따라가며 렌더를 한 번 더 돌지 않는다.
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery("");
    setActive(Math.max(0, companies.findIndex((c) => c.id === value)));
    setOpen(true);
  }

  /// 열린 직후에만 검색창으로 커서를 옮긴다.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(id: string) {
    onPick(id);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      {/* 선택을 지우는 버튼이 트리거 안에 들어가면 button 중첩이 되므로, 테두리를
          공유하는 한 덩어리로 보이게 두 버튼을 나란히 둔다. */}
      <div className="flex items-center rounded-lg border border-line text-[12.5px] font-semibold">
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={
            selected
              ? "flex cursor-pointer items-center gap-1.5 rounded-l-lg py-1.5 pr-2 pl-2.5 text-text hover:bg-surface-3"
              : "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-text-3 hover:bg-surface-3 hover:text-text-2"
          }
        >
          {selected?.name ?? "회원사"}
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={
              open
                ? "size-3 -rotate-180 text-text-3 transition-transform"
                : "size-3 text-text-3 transition-transform"
            }
          >
            <path d="M2.5 4.5L6 8l3.5-3.5" />
          </svg>
        </button>

        {selected && (
          <button
            type="button"
            onClick={() => {
              onPick("");
              setOpen(false);
            }}
            aria-label="회원사 선택 해제"
            className="flex cursor-pointer items-center rounded-r-lg py-1.5 pr-2 pl-1 text-text-3 hover:bg-surface-3 hover:text-text"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="size-3"
            >
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 z-20 w-[280px] overflow-hidden rounded-xl border border-line bg-surface shadow-card-lg">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const pick = matches[active];
                if (pick) choose(pick.id);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder="회원사 검색"
            className="block w-full border-b border-line bg-transparent px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-text-3"
          />

          <div role="listbox" className="max-h-[220px] overflow-y-auto py-1">
            {matches.length === 0 ? (
              <div className="px-3 py-2.5 text-[12.5px] text-text-3">
                검색 결과가 없습니다
              </div>
            ) : (
              matches.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={c.id === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(c.id)}
                  className={
                    i === active
                      ? "flex w-full cursor-pointer items-center justify-between gap-3 bg-surface-3 px-3 py-2 text-left text-[13px] text-text"
                      : "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-text-2"
                  }
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-text-3">
                    {c.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
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
      className="block min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1.5 text-[14.5px] leading-[1.7] text-text outline-none placeholder:text-text-3 disabled:opacity-60"
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
