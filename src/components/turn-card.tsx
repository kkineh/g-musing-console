import type { TurnView } from "@/lib/chats";
import { chatTypeLabel, type ChatType } from "@/lib/engine";
import { formatDuration, formatTime } from "@/lib/format";
import { AskBackForm } from "./ask-back-form";
import { EvidenceMap } from "./evidence-map";
import { LiveTurn } from "./live-turn";
import { ScorePanel } from "./score-panel";

export function TurnCard({
  turn,
  userName,
  chatId,
  chatType,
}: {
  turn: TurnView;
  userName: string;
  chatId: number;
  chatType: ChatType | null;
}) {
  return (
    <div className="flex flex-col gap-4.5">
      <section className="rounded-2xl border border-line bg-surface px-6 py-5.5 shadow-card-sm">
        <Head
          avatar={userName.charAt(0)}
          who={userName}
          meta={
            <>
              <Pill>{chatTypeLabel(chatType)}</Pill>
              <Pill plain>{formatTime(turn.createdAt)}</Pill>
            </>
          }
        />
        <p className="text-[15.5px] leading-[1.68] whitespace-pre-wrap text-text">
          {turn.question}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card-sm">
        <div className="flex items-center gap-2.5 border-b border-dashed border-line px-6 py-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-text">
            <svg viewBox="0 0 24 24" fill="none" className="size-4">
              <path
                d="M12 2L4 6V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V6L12 2Z"
                stroke="white"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[14.5px] font-bold">에이전트</span>
          {turn.elapsedMs && (
            <span className="ml-1 font-mono text-[12px] text-text-3">
              {formatTime(turn.createdAt)} · {formatDuration(turn.elapsedMs)} 소요
            </span>
          )}
        </div>

        <div className="px-6 py-5">
          {turn.trace.length > 0 && <Trace turn={turn} />}

          {(turn.status === "RUNNING" || turn.status === "QUEUED") && (
            <LiveTurn turnId={turn.id} chatId={chatId} />
          )}

          {turn.status === "FAILED" && (
            <div className="rounded-xl bg-danger-soft px-4 py-3.5 text-sm text-danger">
              {turn.error ?? "처리에 실패했습니다"}
            </div>
          )}

          {turn.status === "CANCELED" && (
            <p className="text-[15px] text-text-3">취소된 질의입니다.</p>
          )}

          {turn.status === "WAITING_INPUT" && (
            <AskBackForm turnId={turn.id} questions={turn.pendingQuestions} />
          )}

          {turn.answeredInput && <Answered answered={turn.answeredInput} />}

          {turn.answer && (
            <div className="text-[15.5px] leading-[1.75] whitespace-pre-wrap text-text">
              {turn.answer}
            </div>
          )}

          {turn.references.length > 0 && <EvidenceMap references={turn.references} />}

          {turn.references.length > 0 && (
            <div className="mt-4.5 flex flex-col gap-2">
              <div className="text-[12px] font-bold text-text-3">
                근거 {turn.references.length}건 상세
              </div>
              {turn.references.map((ref) => (
                <div
                  key={ref.locator}
                  className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line bg-bg px-3 py-2.5"
                >
                  <span className="size-[7px] shrink-0 rounded-full bg-gray-node-line" />
                  <span className="font-mono text-[12.5px] font-semibold text-text">
                    {ref.locator}
                  </span>
                  <span className="ml-auto text-right text-[12px] text-text-3">
                    {ref.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {turn.status === "DONE" && <Usage turn={turn} />}

          {turn.status === "DONE" && (
            <ScorePanel turnId={turn.id} chatId={chatId} score={turn.score} />
          )}
        </div>
      </section>
    </div>
  );
}

function Head({
  avatar,
  who,
  meta,
}: {
  avatar: string;
  who: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-text text-[13px] font-bold text-surface">
        {avatar}
      </span>
      <span className="text-[14.5px] font-bold">{who}</span>
      <span className="ml-auto flex items-center gap-2">{meta}</span>
    </div>
  );
}

function Pill({
  children,
  plain,
}: {
  children: React.ReactNode;
  plain?: boolean;
}) {
  return (
    <span
      className={
        plain
          ? "text-[12px] text-text-3"
          : "rounded-md bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-deep"
      }
    >
      {children}
    </span>
  );
}

function Answered({ answered }: { answered: Record<string, string> }) {
  return (
    <div className="mb-4 rounded-xl border border-line bg-bg px-4 py-3.5">
      <div className="mb-2 text-[12.5px] font-semibold text-text-3">
        되물어 확인한 것
      </div>
      <div className="flex flex-col gap-1.5">
        {Object.entries(answered).map(([q, a]) => (
          <div key={q} className="text-[13.5px] text-text-2">
            {q}{" "}
            <span className="font-medium text-accent-deep">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trace({ turn }: { turn: TurnView }) {
  const total = turn.trace.reduce((sum, s) => sum + s.elapsedMs, 0);

  return (
    <details className="group mb-4">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 py-3 text-[13px] font-semibold text-text-2 [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-4 text-text-3 transition-transform duration-200 group-open:rotate-90"
        >
          <path d="M6 9l6 6 6-6" transform="rotate(-90 12 12)" />
        </svg>
        <span>처리 단계 {turn.trace.length}개</span>
        <span className="ml-auto rounded-md border border-line bg-bg px-2.5 py-1 font-mono text-[12px] font-bold text-text-2">
          {formatDuration(total)}
        </span>
      </summary>
      <div className="relative pt-1 pb-3 pl-0.5">
        <div
          aria-hidden
          className="absolute top-1.5 bottom-1.5 left-[15px] w-px"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 60%, transparent 0%)",
            backgroundSize: "1px 6px",
            backgroundRepeat: "repeat-y",
          }}
        />
        {turn.trace.map((step, i) => (
          <div
            key={`${step.label}-${i}`}
            className="relative grid grid-cols-[32px_1fr_auto] items-center gap-3 py-[7px]"
          >
            <span className="z-[1] grid size-[31px] place-items-center rounded-full border-[1.5px] border-gray-node-line bg-surface text-[11px] font-extrabold text-text-2">
              {i + 1}
            </span>
            <span className="text-[13.5px] font-medium text-text">
              {step.label}
              {step.detail ? ` · ${step.detail}` : ""}
            </span>
            <span className="font-mono text-[12px] text-text-3">
              {formatDuration(step.elapsedMs)}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

function Usage({ turn }: { turn: TurnView }) {
  const items = [
    turn.filesRead !== null && ["참조 파일", `${turn.filesRead}개`],
    turn.dbQueries !== null && ["DB 조회", `${turn.dbQueries}건`],
    turn.tokens !== null && ["토큰", `${(turn.tokens / 1000).toFixed(1)}k`],
  ].filter(Boolean) as [string, string][];

  if (items.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-6 border-t border-line pt-4">
      {items.map(([label, value]) => (
        <div key={label} className="font-mono text-[13px] font-semibold text-text">
          <span className="mb-0.5 block font-sans text-[11.5px] font-semibold text-text-3">
            {label}
          </span>
          {value}
        </div>
      ))}
    </div>
  );
}

