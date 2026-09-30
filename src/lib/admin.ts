import { prisma } from "./db";

export type Role = "admin" | "member";

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "admin", label: "관리자", hint: "채점·계정·회원사 관리까지" },
  { value: "member", label: "멤버", hint: "질의와 조회만" },
];

export function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export async function recordAudit(
  actorId: string,
  action: string,
  target: string,
  detail?: string,
) {
  await prisma.auditLog.create({
    data: { actorId, action, target, detail: detail ?? null },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { chats: true, scores: true } } },
  });
}

export async function listMembersWithCounts() {
  return prisma.member.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { chats: true } } },
  });
}

export async function recentAudit(limit = 30) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });
}
