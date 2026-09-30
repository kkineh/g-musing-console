import { prisma } from "./db";

export async function currentUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("사용자가 없습니다. pnpm db:seed를 먼저 실행하세요");
  return user;
}

export async function listMembers() {
  return prisma.member.findMany({ orderBy: { name: "asc" } });
}

/// 화면이 보낸 회원사를 검증한다. 없거나 모르는 값이면 첫 회원사로 떨어진다.
export async function resolveMember(candidate: string) {
  if (candidate) {
    const found = await prisma.member.findUnique({ where: { id: candidate } });
    if (found) return found.id;
  }
  const first = await prisma.member.findFirst({ orderBy: { name: "asc" } });
  if (!first) throw new Error("회원사가 없습니다. pnpm db:seed를 먼저 실행하세요");
  return first.id;
}
