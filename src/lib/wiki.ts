import { prisma } from "./db";

export type WikiNavGroup = {
  category: string;
  docs: { slug: string; title: string }[];
};

export async function wikiNav(): Promise<WikiNavGroup[]> {
  const docs = await prisma.wikiDoc.findMany({
    select: { slug: true, title: true, category: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  const groups = new Map<string, WikiNavGroup["docs"]>();
  for (const doc of docs) {
    const list = groups.get(doc.category) ?? [];
    list.push({ slug: doc.slug, title: doc.title });
    groups.set(doc.category, list);
  }

  return [...groups].map(([category, docs]) => ({ category, docs }));
}

export async function getWikiDoc(slug: string) {
  return prisma.wikiDoc.findUnique({ where: { slug } });
}

export async function firstWikiSlug() {
  const groups = await wikiNav();
  return groups[0]?.docs[0]?.slug ?? null;
}
