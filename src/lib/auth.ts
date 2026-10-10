import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword } from "./password";
import { SESSION_COOKIE } from "./session-cookie";

const SESSION_DAYS = 14;

export async function login(loginId: string, password: string) {
  const member = await prisma.member.findUnique({ where: { loginId } });
  /// 아이디가 없을 때도 해시 검증을 돌려 응답 시간으로 계정 존재가 드러나지 않게 한다.
  const ok = await verifyPassword(
    password,
    member?.passwordHash ?? "0".repeat(32) + ":" + "0".repeat(128),
  );
  if (!member || !ok) return null;

  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: { memberId: member.id, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return member;
}

export async function logout() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.session.deleteMany({ where: { id } });
    jar.delete(SESSION_COOKIE);
  }
}

export async function currentMember() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { member: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }

  return session.member;
}

export async function requireMember() {
  const member = await currentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireAdmin() {
  const member = await requireMember();
  if (member.role !== "admin") redirect("/");
  return member;
}
