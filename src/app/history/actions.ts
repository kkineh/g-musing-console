"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { recordAudit } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { cancelTurn } from "@/lib/runner";
import {
  searchHistory,
  type HistoryFilter,
  type HistoryRow,
  type HistorySort,
  type TurnStatus,
} from "@/lib/chats";
import type { ChatType } from "@/lib/engine";

/// 무한 스크롤이 다음 장을 받아갈 때 쓴다. 필터는 URL 쿼리 그대로 넘어온다.
export async function loadMoreHistory(
  params: Record<string, string>,
  cursor: number,
): Promise<{ rows: HistoryRow[]; nextCursor: number | null }> {
  const me = await requireMember();
  const filter: HistoryFilter = {
    query: params.q || undefined,
    companyId: params.company || undefined,
    type: (params.type as ChatType) || undefined,
    status: (params.status as TurnStatus) || undefined,
    from: params.from ? new Date(`${params.from}T00:00:00+09:00`) : undefined,
    to: params.to ? new Date(`${params.to}T23:59:59+09:00`) : undefined,
    scored: params.scored === "yes" ? true : params.scored === "no" ? false : undefined,
    memberId: params.member || undefined,
    sort: (params.sort as HistorySort) || "recent",
    includeDeleted: me.role === "admin",
    cursor,
  };

  const page = await searchHistory(filter);
  return { rows: page.rows, nextCursor: page.nextCursor };
}

/// 숨김 처리만 한다. 행은 지우지 않는다 — 질의·답변·채점은 엔진 개선 재료다.
/// 본인 대화는 본인이, 나머지는 관리자만 지운다.
export async function deleteChatAction(chatId: number): Promise<boolean> {
  const me = await requireMember();
  if (!Number.isInteger(chatId)) return false;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      publicId: true,
      memberId: true,
      title: true,
      deletedAt: true,
      turns: {
        where: { status: { in: ["QUEUED", "RUNNING"] } },
        select: { id: true },
      },
    },
  });
  if (!chat || chat.deletedAt) return false;
  if (chat.memberId !== me.id && me.role !== "admin") return false;

  /// 처리 중인 질의가 남아 있으면 엔진이 계속 돈다. 먼저 멈춘다.
  for (const t of chat.turns) await cancelTurn(t.id);

  await prisma.chat.update({
    where: { id: chatId },
    data: { deletedAt: new Date() },
  });
  await recordAudit(me.id, "chat.delete", chat.publicId, chat.title ?? undefined);

  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath(`/c/${chat.publicId}`);
  return true;
}
