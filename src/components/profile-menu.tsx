"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/login/actions";

export function ProfileMenu({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-[26px] cursor-pointer place-items-center rounded-lg bg-text text-[11px] font-bold text-surface"
      >
        {name.charAt(0)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[34px] right-0 w-[180px] rounded-xl border border-line bg-surface p-1.5 shadow-card-lg"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-[12.5px] text-text-3">{role}</div>
          </div>
          <div className="my-1 h-px bg-line-soft" />
          <Link
            role="menuitem"
            href="/settings"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-text-2 hover:bg-surface-2 hover:text-text"
          >
            마이페이지
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-text-2 hover:bg-surface-2 hover:text-text"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
