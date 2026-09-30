"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { WikiCategoryNode } from "@/lib/wiki";
import { wikiTreeAction } from "@/app/wiki/tree-action";

const ICON = (
  <>
    <path d="M3 2.8h6.5L13 6.3V13a.7.7 0 01-.7.7H3.7a.7.7 0 01-.7-.7V2.8z" />
    <path d="M9.3 2.8V6h3.4M5.5 8.7h5M5.5 11h5" />
  </>
);

/// 지식베이스는 카테고리가 있어서 다른 워크스페이스 항목과 다르게, /wiki 아래
/// 있을 때 트리를 아코디언으로 펼친다. 본문은 별도 사이드바 없이 전체폭을 쓴다.
export function SidebarWikiItem() {
  const pathname = usePathname();
  const inWiki = pathname.startsWith("/wiki");
  const [tree, setTree] = useState<WikiCategoryNode[] | null>(null);

  useEffect(() => {
    if (!inWiki || tree) return;
    void wikiTreeAction().then(setTree);
  }, [inWiki, tree]);

  const activePath = inWiki
    ? pathname.replace(/^\/wiki\/?/, "").split("/").filter(Boolean)
    : [];

  return (
    <div>
      <Link
        href="/wiki"
        aria-current={pathname === "/wiki" ? "page" : undefined}
        className={
          inWiki
            ? "mb-[1px] flex items-center gap-2.5 rounded-lg bg-accent-soft px-2.5 py-[7px] text-[13.5px] font-semibold text-accent-deep"
            : "mb-[1px] flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium text-text-2 hover:bg-surface-3 hover:text-text"
        }
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-[15px] shrink-0 opacity-85"
        >
          {ICON}
        </svg>
        지식베이스
      </Link>

      {inWiki && (
        <div className="mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-line-soft pl-2.5">
          {!tree ? (
            <div className="px-2.5 py-1.5 text-[12px] text-text-3">
              불러오는 중…
            </div>
          ) : (
            tree.map((node) => (
              <CategoryLink key={node.name} node={node} activePath={activePath} depth={0} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryLink({
  node,
  activePath,
  depth,
}: {
  node: WikiCategoryNode;
  activePath: string[];
  depth: number;
}) {
  const href = `/wiki/${node.path.map(encodeURIComponent).join("/")}`;
  const isExact =
    activePath.length === node.path.length &&
    node.path.every((seg, i) => activePath[i] === seg);

  return (
    <div>
      <Link
        href={href}
        aria-current={isExact ? "true" : undefined}
        style={{ paddingLeft: `${10 + depth * 12}px` }}
        className={
          isExact
            ? "flex items-center justify-between rounded-md bg-accent-soft py-[5px] pr-2.5 text-[12.5px] font-semibold text-accent-deep"
            : "flex items-center justify-between rounded-md py-[5px] pr-2.5 text-[12.5px] text-text-2 hover:bg-surface-3 hover:text-text"
        }
      >
        <span className="truncate">{node.name}</span>
        <span className="ml-2 font-mono text-[11px] text-text-3">
          {node.docCount}
        </span>
      </Link>

      {node.children.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {node.children.map((child) => (
            <CategoryLink
              key={child.name}
              node={child}
              activePath={activePath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
