"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuration } from "@/lib/format";

const AXIS = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: "var(--color-text-3)", fontSize: 11 },
};

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="h-[168px] w-full">{children}</div>;
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-caption shadow-card-lg">
      {children}
    </div>
  );
}

export function VolumeChart({
  points,
}: {
  points: { label: string; done: number; failed: number }[];
}) {
  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="doneFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" interval="preserveStartEnd" {...AXIS} />
          <YAxis allowDecimals={false} width={44} {...AXIS} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as {
                done: number;
                failed: number;
              };
              return (
                <TipBox>
                  <div className="mb-1 font-mono text-text-3">{label}</div>
                  <div className="text-text">완료 {p.done}건</div>
                  {p.failed > 0 && (
                    <div className="text-danger">실패 {p.failed}건</div>
                  )}
                </TipBox>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="done"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#doneFill)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            stroke="var(--color-danger)"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function DurationChart({
  points,
}: {
  points: { label: string; medianMs: number | null }[];
}) {
  const hasData = points.some((p) => p.medianMs !== null);
  if (!hasData) {
    return (
      <Frame>
        <div className="grid h-full place-items-center text-label text-text-3">
          완료된 질의가 없습니다
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" interval="preserveStartEnd" {...AXIS} />
          <YAxis
            width={48}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}초`}
            {...AXIS}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].value as number | null;
              return (
                <TipBox>
                  <div className="mb-1 font-mono text-text-3">{label}</div>
                  <div className="text-text">
                    중앙값 {v === null ? "—" : formatDuration(v)}
                  </div>
                </TipBox>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="medianMs"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--color-accent)", strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function ScoreTrendChart({
  trend,
}: {
  trend: { bucket: string; average: number | null; count: number }[];
}) {
  if (trend.every((t) => t.count === 0)) {
    return (
      <Frame>
        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-label text-text-3">
          채점 이력이 없습니다
          <Link href="/score" className="text-caption font-medium text-accent-deep hover:underline">
            채점 대기로 이동
          </Link>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="bucket" {...AXIS} />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} width={44} {...AXIS} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as {
                average: number | null;
                count: number;
              };
              return (
                <TipBox>
                  <div className="mb-1 font-mono text-text-3">{label}</div>
                  <div className="text-text">
                    평균 {p.average === null ? "—" : p.average.toFixed(1)}점
                  </div>
                  <div className="text-text-3">채점 {p.count}건</div>
                </TipBox>
              );
            }}
          />
          <Bar dataKey="average" radius={[4, 4, 0, 0]} maxBarSize={38}>
            {trend.map((t) => (
              <Cell
                key={t.bucket}
                fill={
                  t.average !== null && t.average < 6
                    ? "var(--color-danger)"
                    : "var(--color-accent)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}
