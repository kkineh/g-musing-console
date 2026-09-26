"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WikiCategoryNode, WikiDocRef } from "@/lib/wiki";
import { WikiSearchButton } from "./wiki-search-modal";

export function WikiNav({
  tree,
  docs,
}: {
  tree: WikiCategoryNode[];
  docs: WikiDocRef[];
}) {
  const pathname = usePathname();
  const activePath = pathname.replace(/^\/wiki\/?/, "").split("/").filter(Boolean);

  return (
    <aside className="rounded-2xl border border-line bg-surface p-3 shadow-card-sm lg:sticky lg:top-[86px]">
      <WikiSearchButton docs={docs} />

      <nav className="mt-2.5 flex flex-col gap-0.5">
        {tree.map((node) => (
          <CategoryItem key={node.name} node={node} activePath={activePath} depth={0} />
        ))}
      </nav>
    </aside>
  );
}

function CategoryItem({
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
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        className={
          isExact
            ? "flex items-center justify-between rounded-lg bg-accent-soft py-2.5 pr-3 text-sm font-semibold text-accent-deep"
            : "flex items-center justify-between rounded-lg py-2.5 pr-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text"
        }
      >
        <span className="truncate">{node.name}</span>
        <span className="ml-2 font-mono text-[12px] text-text-3">
          {node.docCount}
        </span>
      </Link>

      {node.children.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {node.children.map((child) => (
            <CategoryItem
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
