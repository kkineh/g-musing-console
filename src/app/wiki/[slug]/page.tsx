import { notFound } from "next/navigation";
import { WikiDocView } from "@/components/wiki-doc";
import { getWikiDoc } from "@/lib/wiki";

export const dynamic = "force-dynamic";

export default async function WikiDocPage({
  params,
}: PageProps<"/wiki/[slug]">) {
  const { slug } = await params;
  const doc = await getWikiDoc(slug);
  if (!doc) notFound();

  return (
    <WikiDocView
      category={doc.category}
      title={doc.title}
      body={doc.body}
      updatedAt={doc.updatedAt}
    />
  );
}
