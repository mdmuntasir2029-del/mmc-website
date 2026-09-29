import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

let uid = 0;

/** A golden-ratio logarithmic spiral (theta = a * e^(b*theta)), sampled
 *  into an SVG path string once at module load — the same curve family
 *  as the WebGL pre-loader's spiral, just traced with an SVG path
 *  instead of a GL line strip since this overlay is plain DOM/CSS. */
function buildSpiralPath(): string {
  const steps = 90;
  const b = 0.2757; // ln(phi) / (pi/2)
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2.5;
    const r = 0.055 * Math.exp(b * theta);
    points.push([r * Math.cos(theta), r * Math.sin(theta)]);
  }
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(4)},${y.toFixed(4)}`).join(" ");
}

const SPIRAL_PATH = buildSpiralPath();

interface GlobalGoldenBufferProps {
  /** Whether the overlay is showing. */
  active: boolean;
  /** Optional caption under the spiral. */
  label?: string;
  /** Covers the viewport instead of the nearest positioned ancestor. */
  fullscreen?: boolean;
}

/**
 * The FRD's "golden ratio continuous buffering" overlay — a
 * never-ending logarithmic-spiral spinner over a
 * `backdrop-filter: blur(8px) brightness(0.6)` scrim, for real async
 * gaps within FRD mode (data still loading, a file download in
 * flight, a route transition). Non-destructive: it sits on top of
 * whatever's already rendered underneath rather than replacing it.
 */
export default function GlobalGoldenBuffer({
  active,
  label,
  fullscreen = false,
}: GlobalGoldenBufferProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState<number | null>(null);
  const gradientId = useRef(`golden-buffer-gradient-${uid++}`);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className={`golden-buffer${fullscreen ? " golden-buffer--fullscreen" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <svg className="golden-buffer-spiral" viewBox="-1 -1 2 2">
            <defs>
              <linearGradient id={gradientId.current} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--frd-cyan, #00e5ff)" />
                <stop offset="100%" stopColor="var(--frd-emerald, #00ff88)" />
              </linearGradient>
            </defs>
            <motion.path
              ref={pathRef}
              d={SPIRAL_PATH}
              fill="none"
              stroke={`url(#${gradientId.current})`}
              strokeWidth={0.035}
              strokeLinecap="round"
              style={
                pathLength
                  ? { strokeDasharray: `${pathLength * 0.28} ${pathLength}` }
                  : undefined
              }
              animate={pathLength ? { strokeDashoffset: [0, -pathLength] } : undefined}
              transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            />
          </svg>
          {label && <span className="golden-buffer-label">{label}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
