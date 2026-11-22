import { prisma } from "./db";

export async function listCompanies() {
  return prisma.company.findMany({ orderBy: { name: "asc" } });
}

/// 화면이 보낸 회원사를 검증한다. 안 골랐거나 모르는 값이면 null — 회원사를
/// 특정하지 않는 공통 이슈 문의가 있으므로 임의의 회원사로 채우지 않는다.
export async function resolveCompany(candidate: string) {
  if (!candidate) return null;
  const found = await prisma.company.findUnique({ where: { id: candidate } });
  return found?.id ?? null;
}
