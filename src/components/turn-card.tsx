import type { TurnView } from "@/lib/chats";
import { formatDuration, formatTime } from "@/lib/format";
import { AskBackForm } from "./ask-back-form";

export function TurnCard({
  turn,
  userName,
}: {
  turn: TurnView;
  userName: string;
}) {
  return (
    <div className="flex flex-col gap-4.5">
      <section className="rounded-2xl bg-surface px-5.5 py-5 shadow-card">
        <Head
          avatar={userName.charAt(0)}
          who={userName}
          meta={
            <>
              <Pill>로직 확인</Pill>
              <Pill plain>{formatTime(turn.createdAt)}</Pill>
            </>
          }
        />
        <p className="text-[15px] leading-[1.75] whitespace-pre-wrap text-text-2">
          {turn.question}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="px-5.5 py-5">
          <Head
            avatar="M"
            who="Musing"
            agent
            meta={
              turn.elapsedMs ? (
                <Pill plain>{formatDuration(turn.elapsedMs)}</Pill>
              ) : null
            }
          />

          {turn.trace.length > 0 && <Trace turn={turn} />}

          {turn.status === "RUNNING" && (
            <p className="text-[15px] text-text-3">엔진이 처리하고 있습니다…</p>
          )}

          {turn.status === "FAILED" && (
            <div className="rounded-xl bg-danger-soft px-4 py-3.5 text-sm text-danger">
              {turn.error ?? "처리에 실패했습니다"}
            </div>
          )}

          {turn.status === "WAITING_INPUT" && (
            <AskBackForm turnId={turn.id} questions={turn.pendingQuestions} />
          )}

          {turn.answeredInput && <Answered answered={turn.answeredInput} />}

          {turn.answer && (
            <div className="text-[15.5px] leading-[1.85] whitespace-pre-wrap text-text-2">
              {turn.answer}
            </div>
          )}

          {turn.references.length > 0 && (
            <div className="mt-5 flex flex-col gap-1.5">
              <h4 className="mb-0.5 text-[13px] font-semibold text-text-3">
                근거
              </h4>
              {turn.references.map((ref) => (
                <div
                  key={ref.locator}
                  className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 px-3.5 py-2.5"
                >
                  <span className="font-mono text-[13px] font-medium whitespace-nowrap text-accent">
                    {ref.locator}
                  </span>
                  <span className="text-[13.5px] text-text-3">
                    {ref.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {turn.status === "DONE" && <Usage turn={turn} />}
        </div>
      </section>
    </div>
  );
}

function Head({
  avatar,
  who,
  agent,
  meta,
}: {
  avatar: string;
  who: string;
  agent?: boolean;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={
          agent
            ? "grid size-[30px] shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-on-accent"
            : "grid size-[30px] shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-text-2"
        }
      >
        {avatar}
      </span>
      <span className="text-sm font-semibold">{who}</span>
      <span className="ml-auto flex items-center gap-2.5">{meta}</span>
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
          ? "rounded-full bg-surface-3 px-2.5 py-0.5 text-[12.5px] text-text-3"
          : "rounded-full bg-accent-soft px-2.5 py-0.5 text-[12.5px] font-medium text-accent"
      }
    >
      {children}
    </span>
  );
}

function Answered({ answered }: { answered: Record<string, string> }) {
  return (
    <div className="mb-4 rounded-xl bg-surface-2 px-4 py-3.5">
      <div className="mb-2 text-[12.5px] font-semibold text-text-3">
        되물어 확인한 것
      </div>
      <div className="flex flex-col gap-1.5">
        {Object.entries(answered).map(([q, a]) => (
          <div key={q} className="text-[13.5px] text-text-2">
            {q}{" "}
            <span className="font-medium text-accent">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trace({ turn }: { turn: TurnView }) {
  const total = turn.trace.reduce((sum, s) => sum + s.elapsedMs, 0);

  return (
    <details className="mb-4 overflow-hidden rounded-xl bg-surface-2">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-text-2 [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-3 text-text-3"
        >
          <path d="M4.5 2.5L8 6l-3.5 3.5" />
        </svg>
        <span>
          <b className="font-semibold text-text">{turn.trace.length}단계</b>를
          거쳤습니다
        </span>
        <span className="ml-auto font-[tabular-nums] text-[13px] text-text-3">
          {formatDuration(total)}
        </span>
      </summary>
      <div className="pt-0.5 pb-2">
        {turn.trace.map((step, i) => (
          <div
            key={`${step.label}-${i}`}
            className="grid grid-cols-[20px_1fr_auto] items-center gap-2.5 px-4 py-1.5 text-[13.5px] text-text-2"
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-[15px] text-good"
            >
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
            <span>
              {step.label}
              {step.detail ? ` — ${step.detail}` : ""}
            </span>
            <span className="font-[tabular-nums] text-[12.5px] text-text-3">
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
    <div className="mt-5 flex flex-wrap gap-6 border-t border-line-soft pt-4">
      {items.map(([label, value]) => (
        <div key={label} className="text-[13.5px]">
          <span className="mb-0.5 block text-[12.5px] text-text-3">
            {label}
          </span>
          {value}
        </div>
      ))}
    </div>
  );
}

