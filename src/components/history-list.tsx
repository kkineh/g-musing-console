"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HistoryRow } from "@/lib/chats";
import { loadMoreHistory } from "@/app/history/actions";
import { HistoryRowCard } from "./history-row";

export function HistoryList({
  initialRows,
  initialCursor,
  query,
}: {
  initialRows: HistoryRow[];
  initialCursor: number | null;
  query: string;
}) {
  const params = useSearchParams();
  const key = params.toString();

  const [rows, setRows] = useState(initialRows);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    try {
      const next = await loadMoreHistory(
        Object.fromEntries(new URLSearchParams(key)),
        cursor,
      );
      setRows((prev) => [...prev, ...next.rows]);
      setCursor(next.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, key, loading]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || cursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (rows.length === 0) {
    return (
      <p className="mt-6 text-[14.5px] text-text-3">
        {query
          ? `"${query}"에 해당하는 질의가 없습니다.`
          : "조건에 맞는 질의가 없습니다."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <HistoryRowCard key={row.id} row={row} highlight={query} />
      ))}

      {cursor !== null && (
        <div ref={sentinel} className="py-4 text-center text-[13px] text-text-3">
          {loading ? "불러오는 중…" : ""}
        </div>
      )}
    </div>
  );
}
