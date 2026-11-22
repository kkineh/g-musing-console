"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteChatAction } from "@/app/history/actions";
import type { HistoryRow } from "@/lib/chats";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo, formatDateTime, formatDuration } from "@/lib/format";

const STATUS_LABEL: Record<HistoryRow["status"], string> = {
  QUEUED: "대기",
  RUNNING: "처리 중",
  WAITING_INPUT: "답변 대기",
  DONE: "완료",
  FAILED: "실패",
  CANCELED: "취소",
};

export function HistoryRowCard({
  row,
  highlight = "",
  isAdmin,
  canDelete,
  onDeleted,
}: {
  row: HistoryRow;
  highlight?: string;
  isAdmin: boolean;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const ok = await deleteChatAction(row.id);
      setFailed(!ok);
      if (ok) {
        setConfirming(false);
        onDeleted();
      }
    });

  const stats = [
    row.filesRead !== null && ["참조 파일", `${row.filesRead}개`],
    row.dbQueries !== null && ["DB 조회", `${row.dbQueries}건`],
    row.tokens !== null && ["토큰", `${(row.tokens / 1000).toFixed(1)}k`],
    row.scoredBy !== null && ["채점자", row.scoredBy],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-label text-text-3">
          {chatNo(row.id)}
        </span>
        <Tag>{chatTypeLabel(row.type)}</Tag>
        <Tag>{row.companyName ?? "공통"}</Tag>
        {row.askedBack && <Tag accent>되묻기</Tag>}
        {row.turnCount > 1 && <Tag>질의 {row.turnCount}건</Tag>}
        {row.status !== "DONE" && (
          <Tag
            warn={row.status === "WAITING_INPUT"}
            danger={row.status === "FAILED"}
          >
            {STATUS_LABEL[row.status]}
          </Tag>
        )}
        {row.deleted && <Tag>삭제됨</Tag>}
        <span className="ml-auto">
          {row.average !== null ? (
            <Score value={row.average} />
          ) : (
            <span className="text-caption text-text-3">미채점</span>
          )}
        </span>
      </div>

      <div className="mb-2 flex items-start gap-3">
        <Link
          href={`/c/${row.publicId}`}
          className="line-clamp-1 flex-1 text-lead leading-[1.55] text-text hover:text-accent"
        >
          <Highlight text={row.title} needle={highlight} />
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

      <div className="flex flex-wrap gap-4 text-caption text-text-3">
        <span>{row.memberName}</span>
        {row.elapsedMs !== null && (
          <span className="font-mono text-caption">{formatDuration(row.elapsedMs)}</span>
        )}
        <span className="font-mono text-caption">{formatDateTime(row.createdAt)}</span>
      </div>

      {open && (
        <div className="mt-3.5 border-t border-line-soft pt-3.5">
          {row.answer ? (
            <p className="line-clamp-3 text-body-sm leading-[1.7] text-text-2">
              <Highlight text={excerpt(row.answer, highlight)} needle={highlight} />
            </p>
          ) : (
            <p className="text-body-sm text-text-3">아직 답변이 없습니다.</p>
          )}

          {stats.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-5.5">
              {stats.map(([label, value]) => (
                <div key={label} className="text-body-sm">
                  <span className="mb-0.5 block text-caption text-text-3">
                    {label}
                  </span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/c/${row.publicId}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-4 py-2 text-body-sm font-medium text-text-2 hover:border-gray-node-line hover:text-text"
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

          {canDelete && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {confirming ? (
                <>
                  <span className="text-body-sm text-text-2">
                    {isAdmin
                      ? "다른 사람에게는 보이지 않게 됩니다. 관리자 화면에는 남습니다. 되돌릴 수 없습니다."
                      : "이 대화를 처리 이력과 대화 화면에서 지웁니다. 되돌릴 수 없습니다."}
                  </span>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="rounded-lg bg-danger-soft px-3 py-1.5 text-caption font-medium text-danger disabled:opacity-60"
                  >
                    {pending ? "삭제 중…" : "삭제"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      setFailed(false);
                    }}
                    disabled={pending}
                    className="rounded-lg px-3 py-1.5 text-caption text-text-3 hover:bg-surface-3 hover:text-text"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-lg px-2.5 py-1.5 text-caption text-text-3 hover:bg-danger-soft hover:text-danger"
                >
                  대화 삭제
                </button>
              )}
              {failed && (
                <span className="w-full text-body-sm text-danger">
                  삭제하지 못했습니다. 새로고침 후 다시 시도해 주세요.
                </span>
              )}
            </div>
          )}
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
    <span className={`rounded-md px-2.5 py-0.5 text-caption ${tone}`}>
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
      className={`rounded-md px-2.5 py-0.5 font-mono text-caption font-bold tabular-nums ${tone}`}
    >
      {value.toFixed(1)}점
    </span>
  );
}


/// 검색어가 답변 뒤쪽에 있으면 앞 3줄만 잘라선 안 보인다. 매칭 지점 주변을 꺼낸다.
function excerpt(text: string, needle: string, radius = 90) {
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return text;

  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + needle.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function Highlight({ text, needle }: { text: string; needle: string }) {
  const term = needle.trim();
  if (!term) return <>{text}</>;

  const lower = text.toLowerCase();
  const target = term.toLowerCase();
  const parts: React.ReactNode[] = [];
  let at = 0;

  for (;;) {
    const found = lower.indexOf(target, at);
    if (found < 0) break;
    if (found > at) parts.push(text.slice(at, found));
    parts.push(
      <mark
        key={found}
        className="rounded-[3px] bg-accent-soft px-0.5 text-accent-deep"
      >
        {text.slice(found, found + term.length)}
      </mark>,
    );
    at = found + term.length;
  }

  if (at === 0) return <>{text}</>;
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}
