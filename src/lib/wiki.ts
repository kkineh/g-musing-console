import { prisma } from "./db";

export type WikiCategoryNode = {
  name: string;
  path: string[];
  docCount: number;
  children: WikiCategoryNode[];
};

export type WikiDocSummary = {
  slug: string;
  title: string;
  author: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WikiDocRef = { slug: string; title: string; category: string };

function categoryPath(category: string): string[] {
  return category.split("/").filter(Boolean);
}

/** 전체 카테고리를 트리로 묶는다. docCount는 해당 노드 이하 전체 문서 수. */
export async function categoryTree(): Promise<WikiCategoryNode[]> {
  const docs = await prisma.wikiDoc.findMany({
    select: { category: true },
  });

  const root: WikiCategoryNode[] = [];

  function ensure(nodes: WikiCategoryNode[], path: string[]): WikiCategoryNode {
    const name = path[path.length - 1];
    let node = nodes.find((n) => n.name === name);
    if (!node) {
      node = { name, path, docCount: 0, children: [] };
      nodes.push(node);
    }
    return node;
  }

  for (const doc of docs) {
    const parts = categoryPath(doc.category);
    let level = root;
    let acc: string[] = [];
    let node: WikiCategoryNode | null = null;
    for (const part of parts) {
      acc = [...acc, part];
      node = ensure(level, acc);
      node.docCount += 1;
      level = node.children;
    }
  }

  function sortTree(nodes: WikiCategoryNode[]) {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    for (const n of nodes) sortTree(n.children);
  }
  sortTree(root);

  return root;
}

/** 이 경로에 직접 속한(하위 카테고리는 제외) 문서만 반환한다. */
export async function categoryDocs(
  path: string[],
): Promise<WikiDocSummary[]> {
  const category = path.join("/");
  return prisma.wikiDoc.findMany({
    where: { category },
    select: {
      slug: true,
      title: true,
      author: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { title: "asc" },
  });
}

export async function getWikiDoc(slug: string) {
  return prisma.wikiDoc.findUnique({ where: { slug } });
}

export async function firstCategoryPath(): Promise<string[] | null> {
  const tree = await categoryTree();
  return tree[0]?.path ?? null;
}

export async function findCategoryNode(
  path: string[],
): Promise<WikiCategoryNode | null> {
  const tree = await categoryTree();
  let nodes = tree;
  let node: WikiCategoryNode | null = null;
  for (const part of path) {
    node = nodes.find((n) => n.name === part) ?? null;
    if (!node) return null;
    nodes = node.children;
  }
  return node;
}

export type WikiSearchHit = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
};

/// 본문에서 찾았으면 매칭 주변을 잘라서 같이 준다. 제목만 보여주면
/// 왜 걸렸는지 알 수 없다.
export async function searchWikiDocs(query: string): Promise<WikiSearchHit[]> {
  const needle = query.trim();
  if (!needle) return [];

  const docs = await prisma.wikiDoc.findMany({
    where: {
      OR: [{ title: { contains: needle } }, { body: { contains: needle } }],
    },
    select: { slug: true, title: true, category: true, body: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    take: 20,
  });

  return docs.map(({ body, ...doc }) => ({
    ...doc,
    excerpt: excerptAround(body, needle),
  }));
}

function excerptAround(body: string, needle: string, radius = 70) {
  const flat = body.replace(/[#*`>|\n]+/g, " ").replace(/\s+/g, " ").trim();
  const at = flat.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return flat.slice(0, radius * 2);

  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + needle.length + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

export async function saveWikiDoc(
  slug: string,
  editedById: string,
  next: { title: string; category: string; body: string },
) {
  const doc = await prisma.wikiDoc.findUnique({ where: { slug } });
  if (!doc) return null;

  /// 고치기 전 내용을 먼저 남긴다.
  await prisma.wikiRevision.create({
    data: {
      docId: doc.id,
      title: doc.title,
      category: doc.category,
      body: doc.body,
      editedById,
    },
  });

  return prisma.wikiDoc.update({
    where: { slug },
    data: { title: next.title, category: next.category, body: next.body },
  });
}

export async function docRevisions(slug: string) {
  const doc = await prisma.wikiDoc.findUnique({ where: { slug } });
  if (!doc) return [];

  return prisma.wikiRevision.findMany({
    where: { docId: doc.id },
    orderBy: { createdAt: "desc" },
    include: { editedBy: { select: { name: true } } },
  });
}

export async function restoreRevision(revisionId: number, editedById: string) {
  const revision = await prisma.wikiRevision.findUnique({
    where: { id: revisionId },
    include: { doc: true },
  });
  if (!revision) return null;

  return saveWikiDoc(revision.doc.slug, editedById, {
    title: revision.title,
    category: revision.category,
    body: revision.body,
  });
}

export async function wikiOverview() {
  const [docCount, categories, recent] = await Promise.all([
    prisma.wikiDoc.count(),
    prisma.wikiDoc.findMany({ select: { category: true }, distinct: ["category"] }),
    prisma.wikiDoc.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { slug: true, title: true, category: true, author: true, updatedAt: true },
    }),
  ]);

  return {
    docCount,
    categoryCount: new Set(categories.map((c) => c.category.split("/")[0])).size,
    recent,
  };
}

export async function allDocRefs(): Promise<WikiDocRef[]> {
  return prisma.wikiDoc.findMany({
    select: { slug: true, title: true, category: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}
