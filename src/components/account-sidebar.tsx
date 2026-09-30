"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [{ href: "/settings", label: "내 설정" }];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sticky top-0 flex h-screen w-[236px] shrink-0 flex-col border-r border-line-soft bg-surface">
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line-soft px-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="콘솔로 돌아가기"
          className="grid size-7 cursor-pointer place-items-center rounded-lg text-text-3 hover:bg-surface-3 hover:text-text"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="size-3.5"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <span className="text-[13.5px] font-semibold text-text-2">
          마이페이지
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "mb-[1px] flex items-center rounded-lg bg-accent-soft px-2.5 py-[7px] text-[13.5px] font-semibold text-accent-deep"
                  : "mb-[1px] flex items-center rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium text-text-2 hover:bg-surface-3 hover:text-text"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
