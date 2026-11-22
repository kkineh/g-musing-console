"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAudit, ROLES, type Role } from "@/lib/admin";
import { requireAdmin, requireMember } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

function toRole(value: FormDataEntryValue | null): Role {
  return ROLES.find((r) => r.value === value)?.value ?? "user";
}

export async function createUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const loginId = String(formData.get("loginId") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !name || !loginId || !password) return;

  const actor = await requireAdmin();
  const existing = await prisma.member.findFirst({
    where: { OR: [{ email }, { loginId }] },
  });
  if (existing) return;

  const member = await prisma.member.create({
    data: {
      email,
      name,
      role: toRole(formData.get("role")),
      loginId,
      passwordHash: await hashPassword(password),
    },
  });
  await recordAudit(actor.id, "user.create", member.email, member.role);
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || !password) return;

  const actor = await requireAdmin();
  const target = await prisma.member.findUnique({ where: { id } });
  if (!target) return;

  await prisma.member.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });
  /// 비밀번호가 바뀌면 기존 세션은 끊는다. 유출됐을 때 되돌리는 수단이 이것뿐이다.
  await prisma.session.deleteMany({ where: { memberId: id } });

  await recordAudit(actor.id, "user.password", target.email);
  revalidatePath("/admin/users");
}

export async function updateUserRoleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const actor = await requireAdmin();
  const role = toRole(formData.get("role"));
  const before = await prisma.member.findUnique({ where: { id } });
  if (!before || before.role === role) return;

  await prisma.member.update({ where: { id }, data: { role } });
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

  const actor = await requireAdmin();
  if (actor.id === id) return;

  const target = await prisma.member.findUnique({
    where: { id },
    include: { _count: { select: { chats: true, scores: true } } },
  });
  if (!target) return;
  /// 대화나 채점이 달린 계정은 지우지 않는다. 이력이 끊긴다.
  if (target._count.chats > 0 || target._count.scores > 0) return;

  /// Session은 onDelete: Cascade라 계정과 함께 사라진다 — 지우는 순간 로그아웃된다.
  await prisma.member.delete({ where: { id } });
  await recordAudit(actor.id, "user.delete", target.email);
  revalidatePath("/admin/users");
}

export async function createCompanyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name || !/^[a-z0-9-]+$/.test(id)) return;

  const actor = await requireAdmin();
  const existing = await prisma.company.findUnique({ where: { id } });
  if (existing) return;

  await prisma.company.create({ data: { id, name } });
  await recordAudit(actor.id, "company.create", id, name);
  revalidatePath("/admin/companies");
}

export async function renameCompanyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const actor = await requireAdmin();
  const before = await prisma.company.findUnique({ where: { id } });
  if (!before || before.name === name) return;

  await prisma.company.update({ where: { id }, data: { name } });
  await recordAudit(actor.id, "company.rename", id, `${before.name} → ${name}`);
  revalidatePath("/admin/companies");
}

export async function deleteCompanyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const actor = await requireAdmin();
  const target = await prisma.company.findUnique({
    where: { id },
    include: { _count: { select: { chats: true } } },
  });
  if (!target || target._count.chats > 0) return;

  await prisma.company.delete({ where: { id } });
  await recordAudit(actor.id, "company.delete", id, target.name);
  revalidatePath("/admin/companies");
}

export async function updateProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  /// 자기 이름을 바꾸는 것이라 관리자가 아니어도 된다.
  const member = await requireMember();
  if (member.name === name) return;

  await prisma.member.update({ where: { id: member.id }, data: { name } });
  await recordAudit(
    member.id,
    "profile.rename",
    member.email,
    `${member.name} → ${name}`,
  );
  revalidatePath("/settings");
}
