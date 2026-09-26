"use client";

import Link from "next/link";
import { useState } from "react";
import type { HistoryRow } from "@/lib/chats";
import { chatNo, formatDateTime, formatDuration } from "@/lib/format";

const STATUS_LABEL: Record<HistoryRow["status"], string> = {
  QUEUED: "대기",
  RUNNING: "처리 중",
  WAITING_INPUT: "답변 대기",
  DONE: "완료",
  FAILED: "실패",
};

export function HistoryRowCard({ row }: { row: HistoryRow }) {
  const [open, setOpen] = useState(false);

  const stats = [
    row.filesRead !== null && ["참조 파일", `${row.filesRead}개`],
    row.dbQueries !== null && ["DB 조회", `${row.dbQueries}건`],
    row.tokens !== null && ["토큰", `${(row.tokens / 1000).toFixed(1)}k`],
    row.scoredBy !== null && ["채점자", row.scoredBy],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[13px] text-text-3">
          {chatNo(row.id)}
        </span>
        <Tag>로직 확인</Tag>
        <Tag>{row.memberName}</Tag>
        {row.askedBack && <Tag accent>되묻기</Tag>}
        {row.turnCount > 1 && <Tag>{row.turnCount}턴</Tag>}
        {row.status !== "DONE" && (
          <Tag
            warn={row.status === "WAITING_INPUT"}
            danger={row.status === "FAILED"}
          >
            {STATUS_LABEL[row.status]}
          </Tag>
        )}
        <span className="ml-auto">
          {row.average !== null ? (
            <Score value={row.average} />
          ) : (
            <span className="text-[12.5px] text-text-3">미채점</span>
          )}
        </span>
      </div>

      <div className="mb-2 flex items-start gap-3">
        <Link
          href={`/c/${row.id}`}
          className="line-clamp-1 flex-1 text-[15px] leading-[1.55] text-text hover:text-accent"
        >
          {row.title}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "요약 접기" : "요약 펼치기"}
          className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-text-3 hover:bg-surface-3 hover:text-text"
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={open ? "size-3 rotate-90" : "size-3"}
          >
            <path d="M4.5 2.5L8 6l-3.5 3.5" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-[13px] text-text-3">
        <span>{row.userName}</span>
        {row.elapsedMs !== null && (
          <span className="font-mono text-[12.5px]">{formatDuration(row.elapsedMs)}</span>
        )}
        <span className="font-mono text-[12.5px]">{formatDateTime(row.createdAt)}</span>
      </div>

      {open && (
        <div className="mt-3.5 border-t border-line-soft pt-3.5">
          {row.answer ? (
            <p className="line-clamp-3 text-sm leading-[1.7] text-text-2">
              {row.answer}
            </p>
          ) : (
            <p className="text-sm text-text-3">아직 답변이 없습니다.</p>
          )}

          {stats.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-5.5">
              {stats.map(([label, value]) => (
                <div key={label} className="text-[13.5px]">
                  <span className="mb-0.5 block text-[12.5px] text-text-3">
                    {label}
                  </span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/c/${row.id}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-4 py-2 text-[13.5px] font-medium text-text-2 hover:border-gray-node-line hover:text-text"
          >
            대화 열기
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
            >
              <path d="M5 2.5L9.5 7 5 11.5" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function Tag({
  children,
  accent,
  warn,
  danger,
}: {
  children: React.ReactNode;
  accent?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  const tone = danger
    ? "bg-danger-soft text-danger"
    : warn
      ? "bg-warn-soft text-warn"
      : accent
        ? "bg-accent-soft text-accent-deep"
        : "bg-surface-3 text-text-2";

  return (
    <span className={`rounded-md px-2.5 py-0.5 text-[12.5px] ${tone}`}>
      {children}
    </span>
  );
}

function Score({ value }: { value: number }) {
  const tone =
    value >= 8
      ? "bg-accent-soft text-accent-deep"
      : value >= 5.5
        ? "bg-surface-3 text-text-2"
        : "bg-danger-soft text-danger";

  return (
    <span
      className={`rounded-md px-2.5 py-0.5 font-mono text-sm font-bold tabular-nums ${tone}`}
    >
      {value.toFixed(1)}
    </span>
  );
}

