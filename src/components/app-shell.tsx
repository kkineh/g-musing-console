"use client";

import { usePathname } from "next/navigation";
import { AccountSidebar } from "./account-sidebar";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  name,
  role,
  isAdmin,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const inAccount = pathname.startsWith("/settings");

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-full">
      {inAccount ? <AccountSidebar /> : <Sidebar isAdmin={isAdmin} />}
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <Header name={name} role={role} />
        {/* 입력창은 fixed라 흐름에서 빠져 있다. 제 높이를 --composer-h로
            알려주면 그만큼만 비운다 — 고정값으로 잡아두면 입력창이 커질 때
            마지막 카드가 가려진다. */}
        <main className="mx-auto w-full max-w-[900px] flex-1 px-6 pt-11 pb-[calc(var(--composer-h,0px)+40px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
