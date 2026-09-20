"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { ProfileMenu } from "./profile-menu";

const TABS = [
  { href: "/", label: "질의" },
  { href: "/history", label: "처리 이력" },
  { href: "/wiki", label: "지식베이스" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-line-soft bg-surface">
      <div className="mx-auto flex h-[62px] max-w-[1080px] items-center gap-8 px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-accent text-sm font-bold text-on-accent">
            M
          </span>
          <span className="hidden text-[16.5px] font-semibold tracking-[-0.015em] sm:block">
            Musing
          </span>
        </Link>

        <div className="flex gap-1">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-full bg-accent-soft px-3.5 py-[7px] text-sm font-semibold text-accent"
                    : "rounded-full px-3.5 py-[7px] text-sm font-medium text-text-2 hover:bg-surface-3 hover:text-text"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
}
