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

/// Wiki는 카테고리가 있어서 다른 워크스페이스 항목과 다르게 트리를 아코디언으로
/// 펼친다. 토글은 CategoryLink와 같은 방식 — /wiki 아래 있으면 기본으로 열리지만
/// 그 뒤로는 사용자가 직접 접고 펼 수 있다. 본문은 별도 사이드바 없이 전체폭을 쓴다.
export function SidebarWikiItem() {
  const pathname = usePathname();
  const inWiki = pathname.startsWith("/wiki");
  const [tree, setTree] = useState<WikiCategoryNode[] | null>(null);
  /// null이면 아직 사용자가 손대지 않은 상태 — /wiki 아래 있는지로 정해진다.
  /// 한 번이라도 누르면 그 뒤로는 경로가 바뀌어도 사용자가 고른 값을 따른다.
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? inWiki;

  useEffect(() => {
    if (!open || tree) return;
    void wikiTreeAction().then(setTree);
  }, [open, tree]);

  const activePath = inWiki
    ? pathname.replace(/^\/wiki\/?/, "").split("/").filter(Boolean)
    : [];

  return (
    <div>
      <div
        className={
          pathname === "/wiki"
            ? "mb-[1px] flex items-center rounded-lg bg-accent-soft pr-2.5 text-[13.5px] font-semibold text-accent-deep"
            : "mb-[1px] flex items-center rounded-lg pr-2.5 text-[13.5px] font-medium text-text-2 hover:bg-surface-3 hover:text-text"
        }
      >
        <button
          type="button"
          onClick={() => setOpenOverride(!open)}
          aria-expanded={open}
          aria-label={open ? "Wiki 접기" : "Wiki 펼치기"}
          className="grid size-[26px] shrink-0 cursor-pointer place-items-center text-text-3 hover:text-text"
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={open ? "size-2.5 rotate-90" : "size-2.5"}
          >
            <path d="M4.5 2.5L8 6l-3.5 3.5" />
          </svg>
        </button>

        <Link
          href="/wiki"
          aria-current={pathname === "/wiki" ? "page" : undefined}
          className="flex flex-1 items-center gap-2.5 py-[7px] pl-0.5"
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
          Wiki
        </Link>
      </div>

      {open && (
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
  const isAncestor =
    activePath.length > node.path.length &&
    node.path.every((seg, i) => activePath[i] === seg);
  const hasChildren = node.children.length > 0;

  /// 현재 위치가 이 안에 있으면 열어서 보여주고, 아니면 접어서 시작한다.
  const [open, setOpen] = useState(isExact || isAncestor);

  return (
    <div>
      <div
        className={
          isExact
            ? "flex items-center rounded-md bg-accent-soft pr-2.5 text-[12.5px] font-semibold text-accent-deep"
            : "flex items-center rounded-md pr-2.5 text-[12.5px] text-text-2 hover:bg-surface-3 hover:text-text"
        }
        style={{ paddingLeft: `${10 + depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `${node.name} 접기` : `${node.name} 펼치기`}
            className="grid size-[18px] shrink-0 cursor-pointer place-items-center text-text-3 hover:text-text"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={open ? "size-2.5 rotate-90" : "size-2.5"}
            >
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </svg>
          </button>
        ) : (
          <span className="size-[18px] shrink-0" />
        )}

        <Link
          href={href}
          aria-current={isExact ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center justify-between py-[5px]"
        >
          <span className="truncate">{node.name}</span>
          <span className="ml-2 font-mono text-[11px] text-text-3">
            {node.docCount}
          </span>
        </Link>
      </div>

      {hasChildren && open && (
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
