"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WikiDocRef, WikiSearchHit } from "@/lib/wiki";
import { searchWikiAction } from "@/app/wiki/actions";

function docHref(doc: WikiDocRef) {
  const segments = doc.category.split("/").filter(Boolean).map(encodeURIComponent);
  return `/wiki/${[...segments, doc.slug].join("/")}`;
}

export function WikiSearchButton({ docs }: { docs: WikiDocRef[] }) {
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
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-[13.5px] text-text-3 hover:border-gray-node-line hover:text-text-2"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-[15px] shrink-0"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
        <span className="flex-1">문서 검색</span>
        <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10.5px] text-text-3">
          ⌘K
        </kbd>
      </button>

      {open && (
        <WikiSearchDialog docs={docs} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function WikiSearchDialog({
  docs,
  onClose,
}: {
  docs: WikiDocRef[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastQuery, setLastQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /// { 검색어: 결과 }로 들고 있으면 검색어가 비었을 때 지우지 않아도 된다.
  const [hits, setHits] = useState<{ q: string; found: WikiSearchHit[] }>({
    q: "",
    found: [],
  });

  /// 제목만 거르면 본문에 있는 말로 못 찾는다. 서버에서 본문까지 뒤진다.
  useEffect(() => {
    const needle = query.trim();
    if (!needle) return;

    let live = true;
    const timer = setTimeout(() => {
      void searchWikiAction(needle).then((found) => {
        if (live) setHits({ q: needle, found });
      });
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const needle = query.trim();
  const results: (WikiDocRef & { excerpt?: string })[] = useMemo(
    () => (!needle ? docs : hits.q === needle ? hits.found : []),
    [needle, docs, hits],
  );

  if (query !== lastQuery) {
    setLastQuery(query);
    if (activeIndex !== 0) setActiveIndex(0);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const doc = results[activeIndex];
        if (doc) {
          onClose();
          router.push(docHref(doc));
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [results, activeIndex, onClose, router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[14vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-line bg-surface shadow-card-lg"
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
            placeholder="제목과 본문 검색"
            className="flex-1 bg-transparent text-[14.5px] text-text outline-none placeholder:text-text-3"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-text-3">
            esc
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-text-3">
              해당하는 문서가 없습니다.
            </p>
          ) : (
            results.map((doc, i) => (
              <Link
                key={doc.slug}
                href={docHref(doc)}
                onClick={onClose}
                onMouseEnter={() => setActiveIndex(i)}
                className={
                  i === activeIndex
                    ? "flex items-start justify-between rounded-lg bg-accent-soft px-3 py-2.5 text-accent-deep"
                    : "flex items-start justify-between rounded-lg px-3 py-2.5 text-text-2 hover:bg-surface-2"
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">
                    {doc.title}
                  </span>
                  {doc.excerpt && (
                    <span className="mt-0.5 line-clamp-1 block text-[12px] text-text-3">
                      {doc.excerpt}
                    </span>
                  )}
                </span>
                <span className="ml-3 shrink-0 text-[12px] text-text-3">
                  {doc.category}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
