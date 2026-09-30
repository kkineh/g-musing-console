"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { restoreRevisionAction, saveDocAction } from "@/app/wiki/actions";
import { formatDateTime } from "@/lib/format";

export type Revision = {
  id: number;
  title: string;
  createdAt: Date;
  editedBy: { name: string };
};

export function WikiEditor({
  slug,
  title,
  category,
  body,
  categories,
  revisions,
}: {
  slug: string;
  title: string;
  category: string;
  body: string;
  categories: string[];
  revisions: Revision[];
}) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!editing) {
    return (
      <div className="mt-6 flex items-center gap-2 border-t border-dashed border-line pt-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer rounded-lg bg-surface-3 px-3.5 py-1.5 text-[13px] font-medium text-text-2 hover:bg-line hover:text-text"
        >
          편집
        </button>

        {revisions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] text-text-3 hover:bg-surface-2 hover:text-text"
          >
            수정 이력 {revisions.length}
          </button>
        )}

        {showHistory && (
          <div className="w-full">
            <div className="mt-2 flex w-full flex-col gap-1">
              {revisions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12.5px]"
                >
                  <span className="font-mono text-text-3">
                    {formatDateTime(r.createdAt)}
                  </span>
                  <span className="text-text-2">{r.editedBy.name}</span>
                  <span className="line-clamp-1 text-text-3">{r.title}</span>
                  <form action={restoreRevisionAction} className="ml-auto">
                    <input type="hidden" name="revisionId" value={r.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded px-2 py-0.5 text-[12px] text-text-3 hover:bg-surface-3 hover:text-text"
                    >
                      되돌리기
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      action={saveDocAction}
      className="mt-6 flex flex-col gap-3 border-t border-dashed border-line pt-4"
    >
      <input type="hidden" name="slug" value={slug} />

      <div className="flex flex-wrap gap-2">
        <input
          name="title"
          defaultValue={title}
          required
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[15px] font-semibold outline-none focus:outline-2 focus:outline-accent-line"
        />
        <input
          name="category"
          defaultValue={category}
          required
          list="wiki-categories"
          placeholder="분류"
          className="w-[200px] rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[13px] outline-none focus:outline-2 focus:outline-accent-line"
        />
        <datalist id="wiki-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <textarea
        name="body"
        defaultValue={body}
        rows={20}
        className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3.5 py-3 font-mono text-[13px] leading-[1.7] outline-none focus:outline-2 focus:outline-accent-line"
      />

      <div className="flex items-center gap-2">
        <span className="mr-auto text-[12px] text-text-3">
          저장하면 이전 내용이 수정 이력에 남습니다. 마크다운으로 씁니다.
        </span>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="cursor-pointer rounded-lg px-3 py-2 text-[13px] text-text-3 hover:bg-surface-2 hover:text-text"
        >
          취소
        </button>
        <Save />
      </div>
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-on-accent hover:bg-accent-deep disabled:opacity-60"
    >
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}
