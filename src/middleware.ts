import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/// Edge에서는 Prisma를 못 쓰므로 쿠키 유무만 본다. 역할 판정은 (admin) 레이아웃이
/// DB를 읽어서 한다 — 여기서 쿠키 내용을 믿고 권한을 정하면 조작할 수 있다.
export function middleware(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const to = new URL("/login", req.url);
  to.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(to);
}

export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|logo).*)",
  ],
};
