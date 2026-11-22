"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveScore, SCORE_CRITERIA, type ScoreInput } from "@/lib/scores";
import { requireAdmin } from "@/lib/auth";

function readScores(formData: FormData): ScoreInput {
  const input: ScoreInput = { note: String(formData.get("note") ?? "") };

  for (const c of SCORE_CRITERIA) {
    const raw = String(formData.get(c.key) ?? "");
    if (raw === "") {
      input[c.key] = null;
      continue;
    }
    const n = Number(raw);
    input[c.key] = Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : null;
  }
  return input;
}

export async function scoreAction(formData: FormData) {
  const turnId = Number(formData.get("turnId"));
  if (!Number.isInteger(turnId)) return;

  const user = await requireAdmin();
  await saveScore(turnId, user.id, readScores(formData));

  const chatId = Number(formData.get("chatId"));
  if (Number.isInteger(chatId)) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { publicId: true },
    });
    if (chat) revalidatePath(`/c/${chat.publicId}`);
  }
  revalidatePath("/history");
  revalidatePath("/score");
}
