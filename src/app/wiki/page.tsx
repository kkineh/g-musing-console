import { redirect } from "next/navigation";
import { firstWikiSlug } from "@/lib/wiki";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const slug = await firstWikiSlug();
  if (slug) redirect(`/wiki/${slug}`);

  return (
    <div className="rounded-2xl bg-surface px-9 py-10 shadow-card">
      <p className="text-[14.5px] text-text-3">아직 문서가 없습니다.</p>
    </div>
  );
}
