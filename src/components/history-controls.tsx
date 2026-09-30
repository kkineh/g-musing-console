"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CHAT_TYPES } from "@/lib/engine";

const STATUS_OPTIONS = [
  { value: "DONE", label: "완료" },
  { value: "WAITING_INPUT", label: "답변 대기" },
  { value: "RUNNING", label: "처리 중" },
  { value: "FAILED", label: "실패" },
  { value: "CANCELED", label: "취소" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "최신순" },
  { value: "score", label: "점수순" },
  { value: "duration", label: "소요시간순" },
];

export function HistoryControls({
  members,
  users,
  total,
}: {
  members: { id: string; name: string }[];
  users: { id: string; name: string }[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [text, setText] = useState(params.get("q") ?? "");

  function apply(next: URLSearchParams) {
    next.delete("cursor");
    startTransition(() => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (text === current) return;
    const timer = setTimeout(() => setParam("q", text || undefined), 250);
    return () => clearTimeout(timer);
    // setParam은 매 렌더 새로 만들어지므로 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, params]);

  const active = ["member", "type", "status", "from", "to", "scored", "user"]
    .filter((k) => params.get(k));

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative max-w-[340px] flex-1">
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="질문, 답변 내용 검색"
            className="w-full rounded-lg border border-line bg-surface py-2.5 pr-4 pl-9 text-sm text-text outline-none placeholder:text-text-3 focus:outline-2 focus:outline-accent-line"
          />
        </div>

        <span className="font-mono text-[13px] text-text-3">
          {total.toLocaleString("ko-KR")}건
        </span>

        <div className="ml-auto flex items-center gap-1">
          {SORT_OPTIONS.map((s) => {
            const on = (params.get("sort") ?? "recent") === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setParam("sort", s.value === "recent" ? undefined : s.value)}
                aria-pressed={on}
                className={
                  on
                    ? "cursor-pointer rounded-lg bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent-deep"
                    : "cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-text-3 hover:bg-surface-3 hover:text-text"
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {members.length > 1 && (
          <Select
            label="회원사"
            value={params.get("member") ?? ""}
            onChange={(v) => setParam("member", v)}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
        )}
        <Select
          label="유형"
          value={params.get("type") ?? ""}
          onChange={(v) => setParam("type", v)}
          options={CHAT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <Select
          label="상태"
          value={params.get("status") ?? ""}
          onChange={(v) => setParam("status", v)}
          options={STATUS_OPTIONS}
        />
        <Select
          label="채점"
          value={params.get("scored") ?? ""}
          onChange={(v) => setParam("scored", v)}
          options={[
            { value: "yes", label: "채점됨" },
            { value: "no", label: "미채점" },
          ]}
        />
        <Select
          label="질의자"
          value={params.get("user") ?? ""}
          onChange={(v) => setParam("user", v)}
          options={users.map((u) => ({ value: u.id, label: u.name }))}
        />

        <input
          type="date"
          value={params.get("from") ?? ""}
          onChange={(e) => setParam("from", e.target.value || undefined)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-text-2 outline-none focus:outline-2 focus:outline-accent-line"
        />
        <span className="text-[12.5px] text-text-3">~</span>
        <input
          type="date"
          value={params.get("to") ?? ""}
          onChange={(e) => setParam("to", e.target.value || undefined)}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-text-2 outline-none focus:outline-2 focus:outline-accent-line"
        />

        {active.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams();
              const q = params.get("q");
              if (q) next.set("q", q);
              apply(next);
            }}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-text-3 hover:bg-surface-3 hover:text-text"
          >
            필터 지우기
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value || undefined)}
      aria-label={label}
      className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[12.5px] outline-none focus:outline-2 focus:outline-accent-line ${
        value
          ? "border-accent-line bg-accent-soft font-semibold text-accent-deep"
          : "border-line bg-surface text-text-2"
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
