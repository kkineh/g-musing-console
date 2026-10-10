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
        <main className="mx-auto w-full max-w-[900px] flex-1 px-6 pt-11 pb-[140px]">
          {children}
        </main>
      </div>
    </div>
  );
}
