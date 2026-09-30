"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { globalSearchAction, type GlobalSearchResult } from "@/app/search/actions";

const EMPTY: GlobalSearchResult = { chats: [], docs: [] };

export function HeaderSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex w-full max-w-[420px] cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-left text-[13px] text-text-3 hover:border-gray-node-line hover:text-text-2"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-[14px] shrink-0"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <span className="flex-1">전체 검색</span>
        <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-3">
          ⌘K
        </kbd>
      </button>

      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ q: string; data: GlobalSearchResult }>({
    q: "",
    data: EMPTY,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) return;

    let live = true;
    const timer = setTimeout(() => {
      void globalSearchAction(needle).then((data) => {
        if (live) setResult({ q: needle, data });
      });
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const needle = query.trim();
  const loading = needle !== "" && result.q !== needle;
  const data = needle && result.q === needle ? result.data : EMPTY;
  const hasResults = data.chats.length > 0 || data.docs.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[14vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-card-lg"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="size-4 shrink-0 text-text-3"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="처리 이력, 지식베이스 검색"
            className="flex-1 bg-transparent text-[14.5px] text-text outline-none placeholder:text-text-3"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-text-3">
            esc
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {!needle ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-text-3">
              검색어를 입력하세요.
            </p>
          ) : loading ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-text-3">
              검색 중…
            </p>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-text-3">
              해당하는 결과가 없습니다.
            </p>
          ) : (
            <>
              {data.chats.length > 0 && (
                <ResultGroup label="처리 이력">
                  {data.chats.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={onClose}
                      className="flex items-start justify-between rounded-lg px-3 py-2.5 text-text-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-[14px] font-medium">
                          {c.title}
                        </span>
                      </span>
                      <span className="ml-3 shrink-0 font-mono text-[11.5px] text-text-3">
                        {c.sub}
                      </span>
                    </Link>
                  ))}
                </ResultGroup>
              )}

              {data.docs.length > 0 && (
                <ResultGroup label="지식베이스">
                  {data.docs.map((d) => (
                    <Link
                      key={d.href}
                      href={d.href}
                      onClick={onClose}
                      className="flex items-start justify-between rounded-lg px-3 py-2.5 text-text-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium">
                          {d.title}
                        </span>
                        {d.excerpt && (
                          <span className="mt-0.5 line-clamp-1 block text-[12px] text-text-3">
                            {d.excerpt}
                          </span>
                        )}
                      </span>
                      <span className="ml-3 shrink-0 text-[12px] text-text-3">
                        {d.sub}
                      </span>
                    </Link>
                  ))}
                </ResultGroup>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-[0.04em] text-text-3 uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}
