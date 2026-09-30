"use server";

import {
  searchHistory,
  type HistoryFilter,
  type HistoryRow,
  type HistorySort,
  type TurnStatus,
} from "@/lib/chats";
import type { ChatType } from "@/lib/engine";

/// 무한 스크롤이 다음 장을 받아갈 때 쓴다. 필터는 URL 쿼리 그대로 넘어온다.
export async function loadMoreHistory(
  params: Record<string, string>,
  cursor: number,
): Promise<{ rows: HistoryRow[]; nextCursor: number | null }> {
  const filter: HistoryFilter = {
    query: params.q || undefined,
    memberId: params.member || undefined,
    type: (params.type as ChatType) || undefined,
    status: (params.status as TurnStatus) || undefined,
    from: params.from ? new Date(`${params.from}T00:00:00+09:00`) : undefined,
    to: params.to ? new Date(`${params.to}T23:59:59+09:00`) : undefined,
    scored: params.scored === "yes" ? true : params.scored === "no" ? false : undefined,
    userId: params.user || undefined,
    sort: (params.sort as HistorySort) || "recent",
    cursor,
  };

  const page = await searchHistory(filter);
  return { rows: page.rows, nextCursor: page.nextCursor };
}
