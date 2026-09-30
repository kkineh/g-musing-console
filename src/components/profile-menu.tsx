"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function ProfileMenu() {
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
        한
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[34px] right-0 w-[180px] rounded-xl border border-line bg-surface p-1.5 shadow-card-lg"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-semibold">한상민</div>
            <div className="text-[12.5px] text-text-3">관리자</div>
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
        </div>
      )}
    </div>
  );
}
