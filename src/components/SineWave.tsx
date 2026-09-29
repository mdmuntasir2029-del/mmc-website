import { useEffect, useMemo, useRef, useState } from "react";

const VIEW_LONG = 1000;
const VIEW_SHORT = 300;
const CYCLES = 1.5;
const AMPLITUDE = 96;

function buildSinePath(vertical: boolean) {
  const steps = 160;
  const mid = VIEW_SHORT / 2;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const long = t * VIEW_LONG;
    const short = mid - AMPLITUDE * Math.sin(t * CYCLES * Math.PI * 2);
    // Horizontal: x runs along the long axis, y oscillates. Vertical:
    // y runs along the long axis (top to bottom), x oscillates instead —
    // same curve, just swapped so it fits a tall narrow stacked-card
    // column instead of a wide short one.
    const [x, y] = vertical ? [short, long] : [long, short];
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

/**
 * Sine curve that draws itself as `progress` goes 0 → 1, sitting behind
 * the lineup cards (the cards are offset onto points of the same wave
 * in Home.tsx, desktop-only). Horizontal on desktop; on mobile the
 * cards stack vertically instead of sitting side by side, so a wide
 * horizontal wave just gets squashed into an illegible band — pass
 * `vertical` there instead to weave top-to-bottom behind the stack.
 */
export default function SineWave({
  progress,
  vertical = false,
}: {
  progress: number;
  vertical?: boolean;
}) {
  const drawRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(0);
  const d = useMemo(() => buildSinePath(vertical), [vertical]);

  useEffect(() => {
    if (drawRef.current) setLength(drawRef.current.getTotalLength());
  }, [d]);

  const viewBox = vertical
    ? `0 0 ${VIEW_SHORT} ${VIEW_LONG}`
    : `0 0 ${VIEW_LONG} ${VIEW_SHORT}`;

  return (
    <svg
      className={`sine-wave${vertical ? " sine-wave--vertical" : ""}`}
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={d} className="sine-wave-track" />
      <path
        ref={drawRef}
        d={d}
        className="sine-wave-draw"
        style={{
          strokeDasharray: length || undefined,
          strokeDashoffset: length * (1 - progress),
        }}
      />
    </svg>
  );
}
