"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarWikiItem } from "./sidebar-wiki-item";
import { ThemeToggle } from "./theme-toggle";

const WORKSPACE = [
  {
    href: "/",
    label: "질의",
    icon: (
      <path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6c-.9 0-1.8-.2-2.5-.6L2 14l1-3.3C2.4 9.8 2 8.9 2 8z" />
    ),
  },
  {
    href: "/history",
    label: "처리 이력",
    icon: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.6 1.6" />
      </>
    ),
  },
];

const ADMIN = [
  {
    href: "/score",
    label: "채점 대기",
    icon: <path d="M3 13.5V9M8 13.5V4.5M13 13.5V7" />,
  },
  {
    href: "/admin/users",
    label: "계정 관리",
    icon: (
      <>
        <circle cx="6" cy="5.5" r="2.3" />
        <path d="M1.8 13.5c.5-2.6 2.2-4 4.2-4s3.7 1.4 4.2 4" />
        <circle cx="11.5" cy="5.8" r="1.7" />
        <path d="M10.5 9.7c1.6.2 2.9 1.5 3.3 3.8" />
      </>
    ),
  },
  {
    href: "/admin/members",
    label: "회원사 관리",
    icon: (
      <>
        <rect x="2" y="6.5" width="12" height="7.5" rx="1.2" />
        <path d="M5 6.5V4.2a3 3 0 016 0v2.3" />
      </>
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] shrink-0 flex-col border-r border-line-soft bg-surface">
      <Link
        href="/"
        className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-line-soft px-[18px]"
      >
        <Image
          src="/logo.svg"
          alt="musing"
          width={23}
          height={22}
          priority
          className="logo-light shrink-0"
        />
        <Image
          src="/logo-dark.svg"
          alt="musing"
          width={23}
          height={22}
          priority
          className="logo-dark shrink-0"
        />
        <span className="text-[14.5px] font-bold tracking-[-0.01em]">
          musing
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div>
          <div className="mb-1.5 px-2.5 text-[10.5px] font-bold tracking-[0.05em] text-text-3 uppercase">
            워크스페이스
          </div>
          <NavItems items={WORKSPACE} pathname={pathname} />
          <SidebarWikiItem />
        </div>
        <div className="mt-5">
          <NavGroup label="관리" items={ADMIN} pathname={pathname} />
        </div>
      </nav>

      <div className="flex shrink-0 items-center border-t border-line-soft px-3 py-2.5">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
  pathname: string;
}) {
  return (
    <div>
      <div className="mb-1.5 px-2.5 text-[10.5px] font-bold tracking-[0.05em] text-text-3 uppercase">
        {label}
      </div>
      <NavItems items={items} pathname={pathname} />
    </div>
  );
}

function NavItems({
  items,
  pathname,
}: {
  items: { href: string; label: string; icon: React.ReactNode }[];
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "mb-[1px] flex items-center gap-2.5 rounded-lg bg-accent-soft px-2.5 py-[7px] text-[13.5px] font-semibold text-accent-deep"
                : "mb-[1px] flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium text-text-2 hover:bg-surface-3 hover:text-text"
            }
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-[15px] shrink-0 opacity-85"
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
