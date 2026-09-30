"use server";

import { categoryTree } from "@/lib/wiki";

/// 좌측 앱 사이드바의 위키 아코디언이 펼쳐질 때 부른다.
export async function wikiTreeAction() {
  return categoryTree();
}
