import Link from "next/link";
import { scoreAction } from "./actions";
import { ScoreForm } from "@/components/score-form";
import { unscoredTurns } from "@/lib/scores";
import { chatTypeLabel } from "@/lib/engine";
import { chatNo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ScoreQueuePage() {
  const queue = await unscoredTurns();
  const current = queue[0];

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-[27px] leading-[1.25] font-bold tracking-[-0.03em]">
          채점 대기
        </h1>
        <span className="font-mono text-[14px] text-text-3">
          {queue.length}건
        </span>
      </div>

      {!current ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center">
          <p className="text-[14.5px] text-text-3">채점할 답변이 없습니다.</p>
          <Link
            href="/history"
            className="mt-3 inline-block text-[13.5px] text-accent-deep hover:underline"
          >
            처리 이력 보기
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface shadow-card-sm">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-6 py-4">
            <span className="font-mono text-[13px] text-text-3">
              {chatNo(current.chat.id)}
            </span>
            <span className="rounded-md bg-surface-3 px-2.5 py-0.5 text-[12.5px] text-text-2">
              {chatTypeLabel(current.chat.type)}
            </span>
            <span className="rounded-md bg-surface-3 px-2.5 py-0.5 text-[12.5px] text-text-2">
              {current.chat.member.name}
            </span>
            <Link
              href={`/c/${current.chat.id}`}
              className="ml-auto text-[13px] text-accent-deep hover:underline"
            >
              대화 열기 →
            </Link>
          </div>

          <div className="border-b border-dashed border-line px-6 py-4">
            <p className="line-clamp-3 text-[14.5px] leading-[1.7] text-text-2">
              {current.question}
            </p>
            <p className="mt-2 text-[12.5px] text-text-3">
              근거를 확인하려면 대화를 열어 보세요.
            </p>
          </div>

          <div className="px-6 py-5">
            <ScoreForm
              turnId={current.id}
              action={scoreAction}
              submitLabel={queue.length > 1 ? "저장하고 다음" : "저장"}
            />
          </div>
        </div>
      )}

      {queue.length > 1 && (
        <div className="mt-6">
          <h2 className="mb-2.5 text-[13px] font-semibold text-text-3">
            다음 대기 {queue.length - 1}건
          </h2>
          <div className="flex flex-col gap-1.5">
            {queue.slice(1, 11).map((t) => (
              <Link
                key={t.id}
                href={`/c/${t.chat.id}`}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-[13.5px] hover:border-gray-node-line"
              >
                <span className="font-mono text-[12.5px] text-text-3">
                  {chatNo(t.chat.id)}
                </span>
                <span className="line-clamp-1 text-text-2">
                  {t.chat.title ?? t.question}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
