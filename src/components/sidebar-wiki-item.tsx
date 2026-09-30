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

function nodeKey(node: WikiCategoryNode) {
  return node.path.join("/");
}

function allKeys(nodes: WikiCategoryNode[]): string[] {
  return nodes.flatMap((n) => [nodeKey(n), ...allKeys(n.children)]);
}

function ancestorKeys(nodes: WikiCategoryNode[], activePath: string[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    const isAncestor =
      activePath.length > node.path.length &&
      node.path.every((seg, i) => activePath[i] === seg);
    if (isAncestor) {
      keys.push(nodeKey(node));
      keys.push(...ancestorKeys(node.children, activePath));
    }
  }
  return keys;
}

/// Wiki는 카테고리가 있어서 다른 워크스페이스 항목과 다르게 트리를 아코디언으로
/// 펼친다. 펼침 상태는 노드 경로 집합 하나로 관리한다 — Wiki 자체를 누르면
/// 전체 트리를 한 번에 펼치거나 접어야 하는데, 각 노드가 따로 useState를 들고
/// 있으면 부모가 자식들 상태에 손댈 방법이 없다.
export function SidebarWikiItem() {
  const pathname = usePathname();
  const inWiki = pathname.startsWith("/wiki");
  const [tree, setTree] = useState<WikiCategoryNode[] | null>(null);
  /// null이면 아직 사용자가 손대지 않은 상태 — /wiki 아래 있는지로 정해진다.
  /// 한 번이라도 누르면 그 뒤로는 경로가 바뀌어도 사용자가 고른 값을 따른다.
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? inWiki;

  const activePath = inWiki
    ? pathname.replace(/^\/wiki\/?/, "").split("/").filter(Boolean)
    : [];

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  /// Wiki 링크를 눌러 트리가 아직 없는 상태에서도 "전체 펼치기"가 걸리도록,
  /// fetch가 끝난 뒤 무엇으로 채울지를 미리 정해둔다.
  const [pendingExpand, setPendingExpand] = useState(false);

  useEffect(() => {
    if (!open || tree) return;
    void wikiTreeAction().then((t) => {
      setTree(t);
      setOpenKeys(
        new Set(pendingExpand ? allKeys(t) : ancestorKeys(t, activePath)),
      );
    });
    // activePath·pendingExpand는 트리를 처음 받아올 때 한 번만 초기값으로 쓰면
    // 된다 — 이후 경로 이동은 아래 CategoryLink의 자체 네비게이션으로 처리됨.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tree]);

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
          onClick={() => {
            setOpenOverride(true);
            if (tree) setOpenKeys(new Set(allKeys(tree)));
            else setPendingExpand(true);
          }}
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
              <CategoryLink
                key={node.name}
                node={node}
                activePath={activePath}
                depth={0}
                openKeys={openKeys}
                setOpenKeys={setOpenKeys}
              />
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
  openKeys,
  setOpenKeys,
}: {
  node: WikiCategoryNode;
  activePath: string[];
  depth: number;
  openKeys: Set<string>;
  setOpenKeys: (fn: (prev: Set<string>) => Set<string>) => void;
}) {
  const href = `/wiki/${node.path.map(encodeURIComponent).join("/")}`;
  const isExact =
    activePath.length === node.path.length &&
    node.path.every((seg, i) => activePath[i] === seg);
  const hasChildren = node.children.length > 0;
  const key = nodeKey(node);
  const open = openKeys.has(key);

  function toggle() {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
            onClick={toggle}
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
              openKeys={openKeys}
              setOpenKeys={setOpenKeys}
            />
          ))}
        </div>
      )}
    </div>
  );
}
