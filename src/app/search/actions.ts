"use server";

import { searchHistory } from "@/lib/chats";
import { searchWikiDocs } from "@/lib/wiki";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo } from "@/lib/format";

export type GlobalSearchResult = {
  chats: { href: string; title: string; sub: string }[];
  docs: { href: string; title: string; sub: string; excerpt: string }[];
};

/// 헤더 검색 하나로 이력과 Wiki를 같이 뒤진다.
export async function globalSearchAction(
  query: string,
): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (!q) return { chats: [], docs: [] };

  const [history, wiki] = await Promise.all([
    searchHistory({ query: q, limit: 6 }),
    searchWikiDocs(q),
  ]);

  return {
    chats: history.rows.map((row) => ({
      href: `/c/${row.id}`,
      title: row.title,
      sub: `${chatNo(row.id)} · ${chatTypeLabel(row.type)} · ${row.memberName}`,
    })),
    docs: wiki.slice(0, 6).map((doc) => ({
      href: `/wiki/${doc.category
        .split("/")
        .filter(Boolean)
        .map(encodeURIComponent)
        .join("/")}/${doc.slug}`,
      title: doc.title,
      sub: doc.category,
      excerpt: doc.excerpt,
    })),
  };
}
