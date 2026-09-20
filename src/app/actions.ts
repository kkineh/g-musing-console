"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EngineError, runEngine } from "@/lib/engine";
import { applyEngineResult } from "@/lib/chats";
import { currentUser, defaultMember } from "@/lib/session";

function titleFrom(question: string) {
  const line = question.trim().split("\n")[0];
  return line.length > 60 ? `${line.slice(0, 60)}…` : line;
}

export async function askAction(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return;

  const [user, memberId] = await Promise.all([currentUser(), defaultMember()]);

  const chat = await prisma.chat.create({
    data: {
      type: "LOGIC_REVIEW",
      title: titleFrom(question),
      memberId,
      userId: user.id,
      turns: { create: { seq: 1, status: "RUNNING", question } },
    },
    include: { turns: true },
  });

  const turn = chat.turns[0];

  try {
    const result = await runEngine({
      type: "LOGIC_REVIEW",
      memberId,
      question,
    });
    await applyEngineResult(turn.id, chat.id, result);
  } catch (e) {
    await applyEngineResult(turn.id, chat.id, {
      status: "failed",
      error: e instanceof EngineError ? e.message : "엔진 호출에 실패했습니다",
    });
  }

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
    data: {
      status: "RUNNING",
      answeredInput: JSON.stringify(answers),
    },
  });

  try {
    const result = await runEngine({
      type: "LOGIC_REVIEW",
      memberId: turn.chat.memberId,
      question: turn.question,
      sessionId: turn.chat.sessionId ?? undefined,
      answers,
    });
    await applyEngineResult(turn.id, turn.chatId, result);
  } catch (e) {
    await applyEngineResult(turn.id, turn.chatId, {
      status: "failed",
      error: e instanceof EngineError ? e.message : "엔진 호출에 실패했습니다",
    });
  }

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
      status: "RUNNING",
      question,
    },
  });

  try {
    const result = await runEngine({
      type: "LOGIC_REVIEW",
      memberId: chat.memberId,
      question,
      sessionId: chat.sessionId ?? undefined,
    });
    await applyEngineResult(turn.id, chatId, result);
  } catch (e) {
    await applyEngineResult(turn.id, chatId, {
      status: "failed",
      error: e instanceof EngineError ? e.message : "엔진 호출에 실패했습니다",
    });
  }

  revalidatePath(`/c/${chatId}`);
}
