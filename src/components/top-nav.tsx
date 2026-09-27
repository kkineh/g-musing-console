"use client";

import Image from "next/image";
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
    <nav className="sticky top-0 z-10 border-b border-line-soft bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-[62px] max-w-[1080px] items-center gap-8 px-7">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.svg"
            alt="musing"
            width={34}
            height={32}
            priority
            className="logo-light shrink-0"
          />
          <Image
            src="/logo-dark.svg"
            alt="musing"
            width={34}
            height={32}
            priority
            className="logo-dark shrink-0"
          />
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
                    ? "rounded-lg bg-accent-soft px-3.5 py-[7px] text-[13.5px] font-semibold text-accent-deep"
                    : "rounded-lg px-3.5 py-[7px] text-[13.5px] font-semibold text-text-3 hover:bg-surface-3 hover:text-text"
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
