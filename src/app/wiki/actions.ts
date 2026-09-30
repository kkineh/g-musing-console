"use server";

import { revalidatePath } from "next/cache";
import {
  restoreRevision,
  saveWikiDoc,
  searchWikiDocs,
  type WikiSearchHit,
} from "@/lib/wiki";
import { recordAudit } from "@/lib/admin";
import { currentUser } from "@/lib/session";

export async function searchWikiAction(query: string): Promise<WikiSearchHit[]> {
  return searchWikiDocs(query);
}

export async function saveDocAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!slug || !title || !category) return;

  const user = await currentUser();
  const saved = await saveWikiDoc(slug, user.id, { title, category, body });
  if (!saved) return;

  await recordAudit(user.id, "wiki.edit", slug, title);
  revalidatePath("/wiki", "layout");
}

export async function restoreRevisionAction(formData: FormData) {
  const id = Number(formData.get("revisionId"));
  if (!Number.isInteger(id)) return;

  const user = await currentUser();
  const restored = await restoreRevision(id, user.id);
  if (!restored) return;

  await recordAudit(user.id, "wiki.restore", restored.slug, restored.title);
  revalidatePath("/wiki", "layout");
}
