import { useEffect, useMemo, useRef, useState } from "react";

const VIEW_W = 1000;
const VIEW_H = 300;
const MID_Y = VIEW_H / 2;
const CYCLES = 1.5;
const AMPLITUDE = 96;

function buildSinePath() {
  const steps = 160;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * VIEW_W;
    const y = MID_Y - AMPLITUDE * Math.sin(t * CYCLES * Math.PI * 2);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

/**
 * Horizontal sine curve that draws itself left-to-right as `progress`
 * goes 0 → 1. Sits behind the lineup cards; the cards are offset onto
 * points of the same wave in Home.tsx.
 */
export default function SineWave({ progress }: { progress: number }) {
  const drawRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(0);
  const d = useMemo(buildSinePath, []);

  useEffect(() => {
    if (drawRef.current) setLength(drawRef.current.getTotalLength());
  }, [d]);

  return (
    <svg
      className="sine-wave"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
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
