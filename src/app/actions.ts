"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { cancelTurn, startTurn } from "@/lib/runner";
import { currentUser, resolveMember } from "@/lib/session";

function titleFrom(question: string) {
  const line = question.trim().split("\n")[0];
  return line.length > 60 ? `${line.slice(0, 60)}…` : line;
}

export async function askAction(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return;

  const [user, memberId] = await Promise.all([
    currentUser(),
    resolveMember(String(formData.get("memberId") ?? "")),
  ]);

  const chat = await prisma.chat.create({
    data: {
      title: titleFrom(question),
      memberId,
      userId: user.id,
      lastStatus: "QUEUED",
      turns: { create: { seq: 1, status: "QUEUED", question } },
    },
    include: { turns: true },
  });

  const turn = chat.turns[0];
  startTurn(turn.id, chat.id, {
    requestId: turn.requestId,
    memberId,
    question,
  });

  redirect(`/c/${chat.id}`);
}

export async function answerAction(formData: FormData) {
  const turnId = Number(formData.get("turnId"));
  if (!Number.isInteger(turnId)) return;

  const turn = await prisma.turn.findUnique({
    where: { id: turnId },
    include: { chat: true },
  });
  if (!turn || turn.status !== "WAITING_INPUT") return;

  const pending = JSON.parse(turn.pendingQuestions ?? "[]") as {
    question: string;
  }[];

  const answers: Record<string, string> = {};
  for (const [i, q] of pending.entries()) {
    const picked = formData.getAll(`q${i}`).map(String).filter(Boolean);
    if (picked.length) answers[q.question] = picked.join(", ");
  }
  if (Object.keys(answers).length !== pending.length) return;

  await prisma.turn.update({
    where: { id: turnId },
    data: { status: "QUEUED", answeredInput: JSON.stringify(answers) },
  });

  startTurn(turn.id, turn.chatId, {
    requestId: turn.requestId,
    memberId: turn.chat.memberId,
    question: turn.question,
    sessionId: turn.chat.sessionId ?? undefined,
    answers,
  });

  revalidatePath(`/c/${turn.chatId}`);
}

export async function followUpAction(formData: FormData) {
  const chatId = Number(formData.get("chatId"));
  const question = String(formData.get("question") ?? "").trim();
  if (!Number.isInteger(chatId) || !question) return;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { turns: { orderBy: { seq: "desc" }, take: 1 } },
  });
  if (!chat) return;

  const turn = await prisma.turn.create({
    data: {
      chatId,
      seq: (chat.turns[0]?.seq ?? 0) + 1,
      status: "QUEUED",
      question,
    },
  });

  startTurn(turn.id, chatId, {
    requestId: turn.requestId,
    memberId: chat.memberId,
    question,
    sessionId: chat.sessionId ?? undefined,
  });

  revalidatePath(`/c/${chatId}`);
}

export async function cancelAction(formData: FormData) {
  const turnId = Number(formData.get("turnId"));
  const chatId = Number(formData.get("chatId"));
  if (!Number.isInteger(turnId)) return;

  await cancelTurn(turnId);
  if (Number.isInteger(chatId)) revalidatePath(`/c/${chatId}`);
}
