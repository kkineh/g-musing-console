"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAudit, ROLES, type Role } from "@/lib/admin";
import { currentUser } from "@/lib/session";

function toRole(value: FormDataEntryValue | null): Role {
  return ROLES.find((r) => r.value === value)?.value ?? "member";
}

export async function createUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email || !name) return;

  const actor = await currentUser();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const user = await prisma.user.create({
    data: { email, name, role: toRole(formData.get("role")) },
  });
  await recordAudit(actor.id, "user.create", user.email, user.role);
  revalidatePath("/admin/users");
}

export async function updateUserRoleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const actor = await currentUser();
  const role = toRole(formData.get("role"));
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before || before.role === role) return;

  await prisma.user.update({ where: { id }, data: { role } });
  await recordAudit(
    actor.id,
    "user.role",
    before.email,
    `${before.role} → ${role}`,
  );
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const actor = await currentUser();
  if (actor.id === id) return;

  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { chats: true, scores: true } } },
  });
  if (!target) return;
  /// 대화나 채점이 달린 계정은 지우지 않는다. 이력이 끊긴다.
  if (target._count.chats > 0 || target._count.scores > 0) return;

  await prisma.user.delete({ where: { id } });
  await recordAudit(actor.id, "user.delete", target.email);
  revalidatePath("/admin/users");
}

export async function createMemberAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name || !/^[a-z0-9-]+$/.test(id)) return;

  const actor = await currentUser();
  const existing = await prisma.member.findUnique({ where: { id } });
  if (existing) return;

  await prisma.member.create({ data: { id, name } });
  await recordAudit(actor.id, "member.create", id, name);
  revalidatePath("/admin/members");
}

export async function renameMemberAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const actor = await currentUser();
  const before = await prisma.member.findUnique({ where: { id } });
  if (!before || before.name === name) return;

  await prisma.member.update({ where: { id }, data: { name } });
  await recordAudit(actor.id, "member.rename", id, `${before.name} → ${name}`);
  revalidatePath("/admin/members");
}

export async function deleteMemberAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const actor = await currentUser();
  const target = await prisma.member.findUnique({
    where: { id },
    include: { _count: { select: { chats: true } } },
  });
  if (!target || target._count.chats > 0) return;

  await prisma.member.delete({ where: { id } });
  await recordAudit(actor.id, "member.delete", id, target.name);
  revalidatePath("/admin/members");
}

export async function updateProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const user = await currentUser();
  if (user.name === name) return;

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  await recordAudit(user.id, "profile.rename", user.email, `${user.name} → ${name}`);
  revalidatePath("/settings");
}
