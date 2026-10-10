import Link from "next/link";
import { categoryTree, wikiOverview } from "@/lib/wiki";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const [tree, overview] = await Promise.all([categoryTree(), wikiOverview()]);

  return (
    <div>
      {tree.length > 0 && (
        <section className="mb-7">
          <h3 className="mb-3 text-[13px] font-semibold text-text-3">분류</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {tree.map((node) => (
              <Link
                key={node.name}
                href={`/wiki/${encodeURIComponent(node.name)}`}
                className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm hover:border-gray-node-line"
              >
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold text-text">
                    {node.name}
                  </span>
                  <span className="font-mono text-[12.5px] text-text-3">
                    {node.docCount}
                  </span>
                </div>
                {node.children.length > 0 && (
                  <div className="line-clamp-1 text-[12.5px] text-text-3">
                    {node.children.map((c) => c.name).join(" · ")}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {overview.recent.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] font-semibold text-text-3">
            최근 수정
          </h3>
          <div className="flex flex-col gap-1.5">
            {overview.recent.map((doc) => (
              <Link
                key={doc.slug}
                href={`/wiki/${doc.category.split("/").map(encodeURIComponent).join("/")}/${doc.slug}`}
                className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 hover:border-gray-node-line"
              >
                <span className="text-[14px] text-text">{doc.title}</span>
                <span className="rounded bg-surface-3 px-2 py-0.5 text-[11.5px] text-text-2">
                  {doc.category}
                </span>
                <span className="ml-auto font-mono text-[12px] text-text-3">
                  {doc.author} · {formatDate(doc.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {overview.docCount === 0 && (
        <div className="rounded-2xl border border-line bg-surface px-9 py-10 text-center">
          <p className="text-[14.5px] text-text-3">아직 문서가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

