type Pt = [number, number];
type Mesh = { nodes: Pt[]; lines: string };
export type ErrorCode = "403" | "404" | "500" | "503";

/// 로고처럼 회색 점·선이 배경 그물을 이루고, 파란 점들이 이어져 글자가 된다.
/// 글자는 세 자리 모두 가운데 x가 80·250·420이고, 404의 0만 한 변이 끊겨 있다 — 길이 이어지지 않은 곳.
const W = 45;
const glyph: Record<string, Pt[][]> = {
  "0": [[[-20, 15], [20, 15], [50, 50], [50, 150], [20, 185], [-20, 185], [-50, 150], [-50, 50], [-20, 15]]],
  "3": [
    [[-W, 15], [W, 15], [W, 100], [W, 185], [-W, 185]],
    [[W, 100], [-5, 100]],
  ],
  "4": [[[15, 185], [15, 15], [-65, 135], [65, 135]]],
  "5": [[[W, 15], [-W, 15], [-W, 100], [W, 100], [W, 185], [-W, 185]]],
};
const centers = [80, 250, 420];

function strokesOf(code: ErrorCode): Pt[][] {
  return [...code].flatMap((digit, i) =>
    glyph[digit].map((stroke) => {
      const open = code === "404" && digit === "0";
      return (open ? stroke.slice(0, -1) : stroke).map(
        ([x, y]): Pt => [x + centers[i], y],
      );
    }),
  );
}

const path = (pts: Pt[]) => "M" + pts.map((p) => p.join(" ")).join("L");

const meshes: Record<ErrorCode, Mesh> = {
  403:
  {
    nodes: [
      [-10, 6],
      [98, -10],
      [238, 4],
      [388, -12],
      [506, -8],
      [508, 112],
      [516, 198],
      [404, 196],
      [258, 210],
      [130, 198],
      [-4, 208],
      [-18, 92],
      [57, 160],
      [332, 165],
      [140, 71],
      [410, 117],
      [317, 55],
      [218, 73],
      [440, 36],
    ],
    lines:
      "M-10 6L98 -10L238 4L388 -12L506 -8L508 112L516 198L404 196L258 210L130 198L-4 208L-18 92Z " +
      "M-4 208L57 160 M130 198L57 160 M-18 92L57 160 M258 210L332 165 M404 196L332 165 M238 4L140 71 " +
      "M98 -10L140 71 M57 160L140 71 M130 198L140 71 M516 198L410 117 M508 112L410 117 M404 196L410 117 " +
      "M332 165L410 117 M388 -12L317 55 M238 4L317 55 M410 117L317 55 M332 165L317 55 M258 210L218 73 " +
      "M140 71L218 73 M332 165L218 73 M317 55L218 73 M238 4L218 73 M506 -8L440 36 M388 -12L440 36 " +
      "M508 112L440 36 M410 117L440 36 M317 55L440 36 ",
  },
  404:
  {
    nodes: [
      [-10, 6],
      [98, -10],
      [238, 4],
      [388, -12],
      [506, -8],
      [508, 112],
      [516, 198],
      [404, 196],
      [258, 210],
      [130, 198],
      [-4, 208],
      [-18, 92],
      [162, 107],
      [64, 105],
      [180, 45],
      [350, 164],
      [414, 84],
      [236, 82],
      [360, 33],
    ],
    lines:
      "M-10 6L98 -10L238 4L388 -12L506 -8L508 112L516 198L404 196L258 210L130 198L-4 208L-18 92Z " +
      "M130 198L162 107 M258 210L162 107 M98 -10L64 105 M-10 6L64 105 M-18 92L64 105 M-4 208L64 105 " +
      "M130 198L64 105 M162 107L64 105 M238 4L180 45 M98 -10L180 45 M64 105L180 45 M162 107L180 45 " +
      "M258 210L350 164 M404 196L350 164 M506 -8L414 84 M388 -12L414 84 M508 112L414 84 M404 196L414 84 " +
      "M350 164L414 84 M180 45L236 82 M162 107L236 82 M238 4L236 82 M258 210L236 82 M350 164L236 82 " +
      "M388 -12L360 33 M238 4L360 33 M236 82L360 33 M414 84L360 33 M350 164L360 33 ",
  },
  500:
  {
    nodes: [
      [-10, 6],
      [98, -10],
      [238, 4],
      [388, -12],
      [506, -8],
      [508, 112],
      [516, 198],
      [404, 196],
      [258, 210],
      [130, 198],
      [-4, 208],
      [-18, 92],
      [313, 34],
      [154, 56],
      [328, 139],
      [236, 127],
      [432, 122],
      [54, 138],
      [57, 60],
    ],
    lines:
      "M-10 6L98 -10L238 4L388 -12L506 -8L508 112L516 198L404 196L258 210L130 198L-4 208L-18 92Z " +
      "M388 -12L313 34 M238 4L313 34 M238 4L154 56 M98 -10L154 56 M258 210L328 139 M404 196L328 139 " +
      "M130 198L236 127 M258 210L236 127 M130 198L154 56 M154 56L236 127 M328 139L236 127 M313 34L236 127 " +
      "M238 4L236 127 M313 34L328 139 M506 -8L432 122 M388 -12L432 122 M508 112L432 122 M516 198L432 122 " +
      "M404 196L432 122 M328 139L432 122 M313 34L432 122 M-4 208L54 138 M130 198L54 138 M-18 92L54 138 " +
      "M154 56L54 138 M98 -10L57 60 M-10 6L57 60 M-18 92L57 60 M54 138L57 60 M154 56L57 60 ",
  },
  503:
  {
    nodes: [
      [-10, 6],
      [98, -10],
      [238, 4],
      [388, -12],
      [506, -8],
      [508, 112],
      [516, 198],
      [404, 196],
      [258, 210],
      [130, 198],
      [-4, 208],
      [-18, 92],
      [313, 34],
      [154, 56],
      [328, 139],
      [236, 127],
      [432, 122],
      [54, 138],
      [57, 60],
    ],
    lines:
      "M-10 6L98 -10L238 4L388 -12L506 -8L508 112L516 198L404 196L258 210L130 198L-4 208L-18 92Z " +
      "M388 -12L313 34 M238 4L313 34 M238 4L154 56 M98 -10L154 56 M258 210L328 139 M404 196L328 139 " +
      "M130 198L236 127 M258 210L236 127 M130 198L154 56 M154 56L236 127 M328 139L236 127 M313 34L236 127 " +
      "M238 4L236 127 M313 34L328 139 M506 -8L432 122 M388 -12L432 122 M508 112L432 122 M516 198L432 122 " +
      "M404 196L432 122 M328 139L432 122 M313 34L432 122 M-4 208L54 138 M130 198L54 138 M-18 92L54 138 " +
      "M154 56L54 138 M98 -10L57 60 M-10 6L57 60 M-18 92L57 60 M54 138L57 60 M154 56L57 60 ",
  },
};

export const primaryButton =
  "rounded-lg bg-accent px-3.5 py-2 text-label font-semibold text-on-accent hover:bg-accent-deep";
export const secondaryButton =
  "rounded-lg border border-line bg-surface px-3.5 py-2 text-label text-text-2 hover:bg-surface-3";

export function ErrorScreen({
  code,
  title,
  description,
  children,
}: {
  code: ErrorCode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const strokes = strokesOf(code);
  const blueNodes = new Map(strokes.flat().map((p) => [p.join(","), p]));
  const { nodes, lines } = meshes[code];

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center py-20 text-center">
      <svg
        viewBox="0 0 500 200"
        className="w-full max-w-[340px] overflow-visible"
        role="img"
        aria-label={code}
        fill="none"
      >
        <path d={lines} stroke="var(--net)" strokeWidth="3" />
        {nodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="var(--net)" />
        ))}
        {strokes.map((pts, i) => (
          <path
            key={i}
            d={path(pts)}
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinejoin="bevel"
            strokeLinecap="round"
          />
        ))}
        {[...blueNodes.values()].map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="5"
            stroke="var(--accent)"
            strokeWidth="9"
          />
        ))}
      </svg>

      <h1 className="mt-10 text-title-sm font-bold tracking-[-0.02em]">
        {title}
      </h1>
      <p className="mt-2 text-body-sm text-text-2">{description}</p>
      <div className="mt-7 flex items-center gap-2">{children}</div>
    </div>
  );
}
