import { notFound } from "next/navigation";
import { WikiDocView } from "@/components/wiki-doc";
import { WikiDocList } from "@/components/wiki-doc-list";
import { categoryDocs, findCategoryNode, getWikiDoc } from "@/lib/wiki";

export const dynamic = "force-dynamic";

export default async function WikiPathPage({
  params,
}: PageProps<"/wiki/[...path]">) {
  const { path: rawPath } = await params;
  const path = rawPath.map(decodeURIComponent);

  const categoryPath = path.slice(0, -1);
  const lastSegment = path[path.length - 1];

  // 마지막 세그먼트가 문서 slug인지 먼저 확인
  const doc = await getWikiDoc(lastSegment);
  if (doc && doc.category === categoryPath.join("/")) {
    return (
      <WikiDocView
        category={doc.category}
        title={doc.title}
        author={doc.author}
        body={doc.body}
        createdAt={doc.createdAt}
      />
    );
  }

  // 아니면 카테고리 노드로 처리
  const node = await findCategoryNode(path);
  if (!node) notFound();

  const docs = await categoryDocs(path);
  return <WikiDocList path={path} docs={docs} />;
}
