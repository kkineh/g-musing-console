"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(_: string | null, form: FormData) {
  const loginId = String(form.get("loginId") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!loginId || !password) return "아이디와 비밀번호를 입력하세요.";

  const member = await login(loginId, password);
  if (!member) return "아이디 또는 비밀번호가 맞지 않습니다.";

  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
