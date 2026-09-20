"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { WikiNavGroup } from "@/lib/wiki";

export function WikiNav({ groups }: { groups: WikiNavGroup[] }) {
  const [filter, setFilter] = useState("");
  const pathname = usePathname();

  const needle = filter.trim().toLowerCase();
  const shown = groups
    .map((group) => ({
      ...group,
      docs: needle
        ? group.docs.filter((d) => d.title.toLowerCase().includes(needle))
        : group.docs,
    }))
    .filter((group) => group.docs.length > 0);

  return (
    <aside className="rounded-xl bg-surface px-3 py-4 shadow-card-sm lg:sticky lg:top-[86px]">
      <div className="px-1 pb-2.5">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="문서 검색"
          className="w-full rounded-full bg-surface-2 px-3 py-2 text-[13.5px] text-text outline-none placeholder:text-text-3 focus:outline-2 focus:outline-accent-line"
        />
      </div>

      {shown.length === 0 ? (
        <p className="px-2.5 py-2 text-[13px] text-text-3">
          해당하는 문서가 없습니다.
        </p>
      ) : (
        shown.map((group) => (
          <div key={group.category}>
            <div className="px-2.5 pt-3.5 pb-1.5 text-[12.5px] font-semibold text-text-3">
              {group.category}
            </div>
            {group.docs.map((doc) => {
              const active = pathname === `/wiki/${doc.slug}`;
              return (
                <Link
                  key={doc.slug}
                  href={`/wiki/${doc.slug}`}
                  aria-current={active ? "true" : undefined}
                  className={
                    active
                      ? "block rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent"
                      : "block rounded-lg px-3 py-2 text-sm text-text-2 hover:bg-surface-2 hover:text-text"
                  }
                >
                  {doc.title}
                </Link>
              );
            })}
          </div>
        ))
      )}
    </aside>
  );
}
