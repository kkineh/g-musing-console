import { prisma } from "./db";

export async function currentUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("사용자가 없습니다. pnpm db:seed를 먼저 실행하세요");
  return user;
}

export async function defaultMember() {
  const member = await prisma.member.findFirst({ orderBy: { id: "asc" } });
  if (!member) throw new Error("회원사가 없습니다. pnpm db:seed를 먼저 실행하세요");
  return member.id;
}

export async function listMembers() {
  return prisma.member.findMany({ orderBy: { name: "asc" } });
}
