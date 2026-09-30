"use client";

import { usePathname } from "next/navigation";
import { AccountSidebar } from "./account-sidebar";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inAccount = pathname.startsWith("/settings");

  return (
    <div className="flex min-h-full">
      {inAccount ? <AccountSidebar /> : <Sidebar />}
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
