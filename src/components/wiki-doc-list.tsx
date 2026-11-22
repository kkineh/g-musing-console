import Link from "next/link";
import type { WikiCategoryNode, WikiDocSummary } from "@/lib/wiki";
import { formatDate } from "@/lib/format";

function summarize(body: string) {
  const plain = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\|/g, " ")
    .replace(/\n+/g, " ")
    .trim();
  return plain || "작성 예정.";
}

export function WikiDocList({
  path,
  docs,
  node,
}: {
  path: string[];
  docs: WikiDocSummary[];
  node: WikiCategoryNode;
}) {
  const basePath = path.map(encodeURIComponent).join("/");

  return (
    <div>
      <div className="mb-5">
        {path.length > 1 && (
          <div className="mb-1.5 text-caption text-text-3">
            {path.slice(0, -1).join(" / ")}
          </div>
        )}
        <h2 className="flex items-baseline gap-2.5 text-title-sm font-bold tracking-[-0.02em]">
          {path[path.length - 1]}
          <span className="font-mono text-caption font-normal tracking-normal text-text-3 tabular-nums">
            문서 {node.docCount}건
          </span>
        </h2>
      </div>

      {node.children.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-label font-semibold text-text-3">
            하위 카테고리
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {node.children.map((child) => (
              <Link
                key={child.name}
                href={`/wiki/${child.path.map(encodeURIComponent).join("/")}`}
                className="flex items-baseline gap-2 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm hover:border-gray-node-line"
              >
                <span className="text-lead font-semibold text-text">
                  {child.name}
                </span>
                <span className="font-mono text-caption tabular-nums text-text-3">
                  {child.docCount}건
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {docs.length === 0 ? (
        node.children.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface px-7 py-10 text-center shadow-card-sm">
            <p className="text-body text-text-3">
              아직 이 카테고리에 문서가 없습니다.
            </p>
          </div>
        )
      ) : (
        <section>
          {node.children.length > 0 && (
            <h3 className="mb-3 text-label font-semibold text-text-3">
              이 카테고리 문서
            </h3>
          )}
          <div className="flex flex-col gap-2.5">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/wiki/${basePath}/${doc.slug}`}
                className="block rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm hover:border-gray-node-line"
              >
                <div className="mb-1.5 text-lead font-semibold text-text">
                  {doc.title}
                </div>

                <p className="line-clamp-1 text-body-sm text-text-3">
                  {summarize(doc.body)}
                </p>

                <div className="mt-2 flex items-center gap-2 text-caption text-text-3">
                  <span>{doc.author}</span>
                  <span aria-hidden>·</span>
                  <span className="font-mono">{formatDate(doc.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
