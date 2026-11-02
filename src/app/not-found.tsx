import Link from "next/link";

/// 로고처럼 회색 점·선이 배경 그물을 이루고, 파란 점들이 이어져 글자가 된다.
/// 가운데 0은 한 변이 끊겨 있다 — 길이 이어지지 않은 곳.
const grayNodes: [number, number][] = [
  [-10, 6], [-4, 208], [175, 38], [182, 168], [250, 100],
  [322, 28], [330, 176], [506, -8], [516, 198], [300, 108],
  [-18, 92], [60, 105], [165, 105], [340, 100], [420, 100],
  [508, 112], [130, 198], [258, 210], [404, 196], [238, 4],
  [388, -12], [98, -10],
];
const grayLines =
  "M-10 6L175 38L250 100L182 168L-4 208 M250 100L322 28L506 -8 M250 100L330 176L516 198 M322 28L300 108L330 176" +
  " M-18 92L-10 6 M-18 92L-4 208 M-18 92L60 105L175 38 M60 105L182 168 M165 105L250 100 M165 105L175 38 M165 105L182 168" +
  " M300 108L340 100L420 100L508 112L506 -8 M508 112L516 198 M340 100L322 28 M420 100L506 -8 M420 100L516 198 M340 100L330 176" +
  " M-4 208L130 198L182 168 M130 198L258 210L330 176 M258 210L404 196L516 198 M404 196L330 176" +
  " M98 -10L-10 6 M98 -10L175 38 M98 -10L238 4L322 28 M238 4L175 38 M238 4L388 -12L322 28 M388 -12L506 -8";

const four = (dx: number): [number, number][] => [
  [95 + dx, 185], [95 + dx, 15], [15 + dx, 135], [145 + dx, 135],
];
const zero: [number, number][] = [
  [230, 15], [270, 15], [300, 50], [300, 150], [270, 185], [230, 185], [200, 150], [200, 50],
];

const d = (pts: [number, number][]) =>
  "M" + pts.map((p) => p.join(" ")).join("L");

export default function NotFound() {
  const blue = [four(0), zero, four(340)];
  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center py-20 text-center">
      <svg
        viewBox="0 0 500 200"
        className="w-full max-w-[340px] overflow-visible"
        role="img"
        aria-label="404"
        fill="none"
      >
        <path d={grayLines} stroke="var(--net)" strokeWidth="3" />
        {grayNodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="var(--net)" />
        ))}
        {blue.map((pts, i) => (
          <g key={i}>
            <path
              d={d(pts)}
              stroke="var(--accent)"
              strokeWidth="8"
              strokeLinejoin="bevel"
              strokeLinecap="round"
            />
            {pts.map(([x, y]) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="5"
                stroke="var(--accent)"
                strokeWidth="9"
                fill="none"
              />
            ))}
          </g>
        ))}
      </svg>

      <h1 className="mt-10 text-[22px] font-bold tracking-[-0.02em]">
        여기엔 아무것도 없어요
      </h1>
      <p className="mt-2 text-[14px] text-text-2">
        주소가 잘못되었거나, 사라진 페이지입니다.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-deep"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
