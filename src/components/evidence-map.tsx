import type { Reference } from "@/lib/engine";

const WIDTH = 500;
const Q_Y = 44;
const Q_R = 26;
const EV_Y = 220;
const EV_R = 20;
const A_Y = 400;
const A_R = 32;
const HEIGHT = 460;

function evidenceX(index: number, count: number) {
  if (count === 1) return WIDTH / 2;
  const margin = 90;
  const span = WIDTH - margin * 2;
  return margin + (span * index) / (count - 1);
}

function splitLabel(locator: string): [string, string | null] {
  if (locator.length <= 12) return [locator, null];
  const mid = Math.ceil(locator.length / 2);
  const breakAt = locator.lastIndexOf("_", mid) > 2 ? locator.lastIndexOf("_", mid) + 1 : mid;
  return [locator.slice(0, breakAt), locator.slice(breakAt)];
}

export function EvidenceMap({ references }: { references: Reference[] }) {
  if (references.length === 0) return null;
  const cx = WIDTH / 2;

  return (
    <div className="mt-5.5 border-t border-dashed border-line-soft pt-5">
      <div className="mb-4 text-[12px] font-bold text-text-3">
        근거 지도 — 위에서 아래로: 질문 → 근거 {references.length}건 → 답변
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height="auto"
        style={{ display: "block", maxWidth: 420, margin: "0 auto" }}
      >
        <g className="stroke-gray-node-line" strokeWidth={1.5} fill="none">
          {references.map((_, i) => {
            const x = evidenceX(i, references.length);
            return (
              <path
                key={`qe-${i}`}
                d={`M ${cx} ${Q_Y + Q_R} C ${cx} ${Q_Y + 76}, ${x} ${EV_Y - 84}, ${x} ${EV_Y - EV_R}`}
                strokeDasharray="1 6"
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <g className="stroke-accent" strokeWidth={1.8} fill="none">
          {references.map((_, i) => {
            const x = evidenceX(i, references.length);
            return (
              <path
                key={`ea-${i}`}
                d={`M ${x} ${EV_Y + EV_R} C ${x} ${EV_Y + 80}, ${cx} ${A_Y - 84}, ${cx} ${A_Y - A_R}`}
                strokeDasharray="1 6"
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* question node */}
        <circle cx={cx} cy={Q_Y} r={Q_R} className="fill-text" />
        <text
          x={cx}
          y={Q_Y + 5}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          className="fill-surface"
        >
          질문
        </text>

        {/* evidence nodes */}
        {references.map((ref, i) => {
          const x = evidenceX(i, references.length);
          const [line1, line2] = splitLabel(ref.locator);
          return (
            <g key={ref.locator}>
              <circle
                cx={x}
                cy={EV_Y}
                r={EV_R}
                className="fill-surface stroke-gray-node-line"
                strokeWidth={2}
              />
              <circle cx={x} cy={EV_Y} r={4} className="fill-gray-node-line" />
              <text
                x={x}
                y={EV_Y - 32}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fontFamily="var(--font-mono)"
                className="fill-text"
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={x}
                  y={EV_Y - 20}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="var(--font-mono)"
                  className="fill-text"
                >
                  {line2}
                </text>
              )}
            </g>
          );
        })}

        {/* answer node — sole point color */}
        <circle cx={cx} cy={A_Y} r={A_R} className="fill-accent" />
        <circle
          cx={cx}
          cy={A_Y}
          r={A_R}
          fill="none"
          className="stroke-accent-soft"
          strokeWidth={7}
        />
        <text
          x={cx}
          y={A_Y + 6}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          className="fill-on-accent"
        >
          답변
        </text>
      </svg>
    </div>
  );
}
