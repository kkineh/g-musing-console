"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function HistorySearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (value === defaultValue) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(value ? `/history?q=${encodeURIComponent(value)}` : "/history");
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [value, defaultValue, router]);

  return (
    <div className="relative max-w-[340px]">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="pointer-events-none absolute top-1/2 left-3.5 size-[15px] -translate-y-1/2 text-text-3"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="질문, 답변 내용 검색"
        aria-busy={pending}
        className="w-full rounded-lg border border-line bg-surface py-2.5 pr-4 pl-9 text-sm text-text outline-none placeholder:text-text-3 focus:outline-2 focus:outline-accent-line"
      />
    </div>
  );
}
