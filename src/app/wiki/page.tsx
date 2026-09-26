import { redirect } from "next/navigation";
import { firstCategoryPath } from "@/lib/wiki";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage() {
  const path = await firstCategoryPath();
  if (path) redirect(`/wiki/${path.map(encodeURIComponent).join("/")}`);

  return (
    <div className="rounded-2xl border border-line bg-surface px-9 py-10 shadow-card-sm">
      <p className="text-[14.5px] text-text-3">아직 문서가 없습니다.</p>
    </div>
  );
}
