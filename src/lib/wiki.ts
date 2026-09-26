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

export async function searchWikiDocs(query: string) {
  const needle = query.trim();
  if (!needle) return [];
  return prisma.wikiDoc.findMany({
    where: {
      OR: [{ title: { contains: needle } }, { body: { contains: needle } }],
    },
    select: { slug: true, title: true, category: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    take: 20,
  });
}

export async function allDocRefs(): Promise<WikiDocRef[]> {
  return prisma.wikiDoc.findMany({
    select: { slug: true, title: true, category: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}
