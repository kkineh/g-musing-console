import Link from "next/link";
import {
  DurationChart,
  ScoreTrendChart,
  VolumeChart,
} from "@/components/dashboard-charts";
import { LowScored, ScoreCriteria } from "@/components/score-summary";
import { historySummary } from "@/lib/chats";
import { chatTypeLabel, healthEngine, type EngineHealth } from "@/lib/engine";
import { lowScored, scoreStats } from "@/lib/scores";
import {
  askBack,
  backlog,
  companyUsage,
  cost,
  dailyVolume,
  outcomes,
  scoreTrend,
  typeMix,
  type Outcome,
} from "@/lib/dashboard";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 14;

export default async function DashboardPage() {
  const [
    health,
    pending,
    result,
    daily,
    load,
    asked,
    companies,
    mix,
    trend,
    summary,
    stats,
    low,
  ] = await Promise.all([
    healthEngine(),
    backlog(),
    outcomes(WINDOW_DAYS),
    dailyVolume(WINDOW_DAYS),
    cost(WINDOW_DAYS),
    askBack(WINDOW_DAYS),
    companyUsage(WINDOW_DAYS),
    typeMix(WINDOW_DAYS),
    scoreTrend(6),
    historySummary(),
    scoreStats(),
    lowScored(),
  ]);

  const settled = result.done + result.failed;
  const successRate = settled > 0 ? (result.done / settled) * 100 : null;
  const askRate =
    asked.totalTurns > 0
      ? (asked.turnsWithQuestion / asked.totalTurns) * 100
      : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1.5 text-title leading-[1.25] font-bold tracking-[-0.03em]">
            대시보드
          </h1>
          <p className="text-body text-text-3">
            엔진 상태와 처리 현황, 답변 품질을 함께 봅니다.
          </p>
        </div>
        <span className="rounded-lg bg-surface-3 px-2.5 py-1 text-caption font-medium text-text-2">
          최근 {WINDOW_DAYS}일 기준
        </span>
      </div>

      <EngineStatus health={health} />

      <div className="mb-7 grid gap-3.5 sm:grid-cols-3">
        <Action
          href="/score"
          label="채점 대기"
          value={pending.unscored}
          warn={pending.unscored > 0}
        />
        <Action
          href="/history?status=WAITING_INPUT"
          label="사용자 답변 대기"
          value={pending.waitingInput}
        />
        <Action
          href="/history?status=RUNNING"
          label="10분 넘게 진행 중"
          value={pending.stuck}
          warn={pending.stuck > 0}
        />
      </div>

      <Section title="처리 현황">
        <div className="grid gap-3.5 lg:grid-cols-[1fr_1.5fr]">
          <Card>
            <CardLabel>성공률</CardLabel>
            <div className="mb-4 flex items-baseline gap-2.5">
              <Metric
                value={successRate === null ? "—" : `${successRate.toFixed(0)}%`}
                accent
              />
              {settled > 0 && (
                <span className="text-caption text-text-3">
                  완료 {result.done}건 / 실패 {result.failed}건
                </span>
              )}
            </div>
            <OutcomeBar result={result} />
          </Card>

          <Card>
            <CardLabel>일별 처리량</CardLabel>
            <VolumeChart points={daily} />
          </Card>
        </div>
      </Section>

      <Section title="처리 비용">
        <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="소요 시간 중앙값"
            value={load.medianMs === null ? "—" : formatDuration(load.medianMs)}
            note={
              load.p90Ms === null
                ? "완료된 질의 없음"
                : `p90 ${formatDuration(load.p90Ms)}`
            }
          />
          <Stat
            label="평균 토큰"
            value={load.avgTokens === null ? "—" : `${fmt(Math.round(load.avgTokens))}개`}
            note="질의당"
          />
          <Stat
            label="평균 파일 읽기"
            value={load.avgFilesRead === null ? "—" : `${load.avgFilesRead.toFixed(1)}개`}
            note="질의당"
          />
          <Stat
            label="평균 DB 조회"
            value={load.avgDbQueries === null ? "—" : `${load.avgDbQueries.toFixed(1)}건`}
            note="질의당"
          />
        </div>
        <Card>
          <CardLabel>소요 시간 추이 (중앙값)</CardLabel>
          <DurationChart points={daily} />
        </Card>
      </Section>

      <Section title="질의 성격">
        <div className="grid gap-3.5 lg:grid-cols-2">
          <Card>
            <CardLabel>되묻기</CardLabel>
            <div className="flex items-baseline gap-2.5">
              <Metric value={askRate === null ? "—" : `${askRate.toFixed(0)}%`} />
              <span className="text-caption text-text-3">
                되물은 질의 {asked.turnsWithQuestion} / {asked.totalTurns}건 · 답변받음{" "}
                {asked.answered}건
              </span>
            </div>
            <p className="mt-3 text-caption leading-[1.65] text-text-3">
              너무 잦으면 쓰기 번거롭고, 아예 없으면 엔진이 틀린 가정을 그대로
              밀고 갑니다.
            </p>
          </Card>

          <Card>
            <CardLabel>유형 분포</CardLabel>
            {mix.length === 0 ? (
              <Empty>아직 질의가 없습니다</Empty>
            ) : (
              <div className="flex flex-col gap-2.5">
                {mix.map((m) => (
                  <Bar
                    key={m.type ?? "none"}
                    label={m.type ? chatTypeLabel(m.type) : "미분류"}
                    value={m.count}
                    max={Math.max(...mix.map((x) => x.count))}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </Section>

      <Section title="답변 품질">
        <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
          <Card>
            <CardLabel>주별 평균 점수</CardLabel>
            <ScoreTrendChart trend={trend} />
          </Card>
          <Card>
            <CardLabel>항목별 평균</CardLabel>
            <ScoreCriteria stats={stats} />
          </Card>
        </div>

        <div className="grid gap-3.5 lg:grid-cols-2">
          <Card>
            <CardLabel>기준선 아래 대화</CardLabel>
            <LowScored low={low} />
          </Card>
          <Card>
            <CardLabel>회원사별</CardLabel>
            {companies.length === 0 ? (
              <Empty>등록된 회원사가 없습니다</Empty>
            ) : (
              <div className="flex flex-col gap-2">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 text-label"
                  >
                    <span className="truncate text-text-2">{c.name}</span>
                    <span className="shrink-0 font-mono text-text-3 tabular-nums">
                      {c.chats}건
                      {c.scoreAvg !== null && (
                        <span className="ml-2 font-semibold text-text">
                          {c.scoreAvg.toFixed(1)}점
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Section>

      <Section title="누적">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Stat label="전체 처리" value={`${fmt(summary.chatCount)}건`} note="누적 질의" />
          <Stat
            label="전체 평균 점수"
            value={summary.averageScore == null ? "—" : `${summary.averageScore.toFixed(1)}점`}
            note={summary.averageScore === null ? "채점 없음" : "채점된 질의 기준"}
          />
          <Stat label="최근 7일" value={`${fmt(summary.weekCount)}건`} note="질의 건수" />
        </div>
      </Section>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 text-label font-semibold text-text-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4.5 shadow-card-sm">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 text-label font-semibold text-text-2">
      {children}
    </div>
  );
}

function Metric({ value, accent }: { value: string; accent?: boolean }) {
  return (
    <span
      className={`font-mono text-display leading-none font-bold tracking-[-0.03em] tabular-nums ${
        accent ? "text-accent-deep" : "text-text"
      }`}
    >
      {value}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-label text-text-3">{children}</p>;
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm">
      <div className="mb-1.5 text-caption text-text-3">{label}</div>
      <div className="font-mono text-title-sm leading-[1.2] font-bold tracking-[-0.02em] text-text tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-caption text-text-3">{note}</div>
    </div>
  );
}

function Action({
  href,
  label,
  value,
  warn,
}: {
  href: string;
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-card-sm hover:border-gray-node-line"
    >
      <div className="mb-1.5 text-caption text-text-3">{label}</div>
      <div
        className={`font-mono text-title-sm leading-[1.2] font-bold tabular-nums ${
          warn ? "text-warn" : "text-text"
        }`}
      >
        {value}건
      </div>
    </Link>
  );
}

const OUTCOME_PARTS = [
  { key: "done", label: "완료", className: "bg-good" },
  { key: "waitingInput", label: "되묻기", className: "bg-warn" },
  { key: "running", label: "진행 중", className: "bg-accent-line" },
  { key: "failed", label: "실패", className: "bg-danger" },
  { key: "canceled", label: "취소", className: "bg-text-3" },
] as const;

function OutcomeBar({ result }: { result: Outcome }) {
  if (result.total === 0) return <Empty>최근 처리된 질의가 없습니다</Empty>;

  return (
    <div>
      <div className="mb-2.5 flex h-2.5 overflow-hidden rounded-full bg-surface-3">
        {OUTCOME_PARTS.map((p) => {
          const n = result[p.key];
          if (n === 0) return null;
          return (
            <div
              key={p.key}
              className={p.className}
              style={{ width: `${(n / result.total) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {OUTCOME_PARTS.map((p) => {
          const n = result[p.key];
          if (n === 0) return null;
          return (
            <span
              key={p.key}
              className="flex items-center gap-1.5 text-caption text-text-2"
            >
              <span className={`size-2 rounded-full ${p.className}`} />
              {p.label}
              <span className="font-mono font-semibold tabular-nums">{n}건</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-caption">
        <span className="text-text-2">{label}</span>
        <span className="font-mono text-text-3 tabular-nums">{value}건</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function EngineStatus({ health }: { health: EngineHealth }) {
  const tone =
    health.state === "down"
      ? "border-danger-soft bg-danger-soft"
      : health.state === "mock"
        ? "border-line bg-surface-2"
        : "border-line bg-surface";

  return (
    <div
      className={`mb-3.5 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4 shadow-card-sm ${tone}`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${
          health.state === "ok"
            ? "bg-good"
            : health.state === "mock"
              ? "bg-text-3"
              : "bg-danger"
        }`}
      />
      <span className="text-body-sm font-semibold text-text">엔진</span>

      {health.state === "ok" && (
        <>
          <span className="text-body-sm text-text-2">정상</span>
          <span className="ml-auto flex items-center gap-4 font-mono text-label text-text-2 tabular-nums">
            <span>
              처리 중 <span className="font-bold text-text">{health.running}건</span>
            </span>
            <span>
              대기 <span className="font-bold text-text">{health.queued}건</span>
            </span>
          </span>
        </>
      )}

      {health.state === "mock" && (
        <span className="text-body-sm text-text-3">
          목업으로 동작 중 — ENGINE_URL이 설정되지 않았습니다
        </span>
      )}

      {health.state === "down" && (
        <span className="text-body-sm text-danger">
          응답 없음 · {health.reason}
        </span>
      )}
    </div>
  );
}
