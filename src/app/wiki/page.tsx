import Link from "next/link";
import { categoryTree, wikiOverview } from "@/lib/wiki";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const [tree, overview] = await Promise.all([categoryTree(), wikiOverview()]);

  return (
    <div>
      <section className="mb-7 rounded-2xl border border-line bg-surface px-7 py-6 shadow-card-sm">
        <h2 className="mb-2 text-[19px] font-bold tracking-[-0.02em]">
          사람이 쓰고, 엔진이 읽습니다
        </h2>
        <p className="max-w-[540px] text-[14.5px] leading-[1.75] text-text-2">
          질의에 답할 때 코드와 DB만으로는 알 수 없는 것들이 있습니다. 왜 이렇게
          동작하는지, 업체마다 무엇이 다른지, 지난번엔 어떻게 처리했는지.
          그 판단 기준을 여기 모읍니다.
        </p>

        <div className="mt-5 flex flex-wrap gap-6 border-t border-dashed border-line pt-4">
          <Stat label="문서" value={overview.docCount} />
          <Stat label="분류" value={overview.categoryCount} />
        </div>
      </section>

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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-mono text-[22px] font-bold tabular-nums text-accent-deep">
        {value}
      </div>
      <div className="text-[12.5px] text-text-3">{label}</div>
    </div>
  );
}
