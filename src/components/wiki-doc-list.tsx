import Link from "next/link";
import type { WikiDocSummary } from "@/lib/wiki";
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
}: {
  path: string[];
  docs: WikiDocSummary[];
}) {
  const basePath = path.map(encodeURIComponent).join("/");

  return (
    <div>
      <div className="mb-5">
        <div className="mb-1.5 text-[12.5px] text-text-3">
          {path.join(" / ")}
        </div>
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">
          문서 {docs.length}건
        </h2>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-7 py-10 text-center shadow-card-sm">
          <p className="text-[14.5px] text-text-3">
            아직 이 카테고리에 문서가 없습니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/wiki/${basePath}/${doc.slug}`}
              className="block rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm hover:border-gray-node-line"
            >
              <div className="mb-1.5 text-[15px] font-semibold text-text">
                {doc.title}
              </div>

              <p className="line-clamp-1 text-[13.5px] text-text-3">
                {summarize(doc.body)}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[12.5px] text-text-3">
                <span>{doc.author}</span>
                <span aria-hidden>·</span>
                <span className="font-mono">{formatDate(doc.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
