import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { VIEW_W, buildWavePath } from "../lib/piWave";

// 650 verified-correct decimal digits of pi (Chudnovsky algorithm,
// cross-checked against the previously-used 201-digit string — they
// match exactly). Long enough that the counter never runs out of digits
// before the arc is fully drawn, even at MAX_CYCLES.
const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912983367336244065664308602139494639522473719070217986094370277053921717629317675238467481846766940513200056812714526356082778577134275778960917363717872";

const MIN_DIGITS = 4;
const PI_PREFIX = "π = ";
// Leaves headroom past the curve's rendered end (beyond the 2%
// startOffset and normal font-metric slop) so the digit trail never
// visibly overruns past where the curve actually stops.
const PATH_BUDGET_RATIO = 0.94;
// A reasonable guess for the very first paint, before the calibration
// effect below has measured anything real yet.
const INITIAL_MAX_DIGITS = 40;

/**
 * The curved pi trail for the pinned scroll-scrub intro on the home
 * page: a real sine wave (see lib/piWave), so crests and troughs are
 * perfectly balanced. `progress` (0..1) drives how far it has drawn and
 * how many pi digits have rolled out along it. `cycles` sets how many
 * full periods the wave completes — driven by how many session photos
 * need a crest/trough slot beside it (see PiPhotoWave).
 *
 * The viewBox is re-sized to match the SVG's own rendered aspect ratio
 * (measured via ResizeObserver) before drawing the curve, so
 * preserveAspectRatio="none" never has to stretch it non-uniformly —
 * without that, the pi digits render squashed or elongated depending on
 * how different the container's shape is from a fixed guess.
 *
 * How many digits fit is *measured*, not guessed: since AMPLITUDE_RATIO
 * keeps the amplitude proportional to each cycle's own height, the
 * curve's total rendered arc length stays roughly the same regardless of
 * cycle count (more, tighter wiggles instead of a longer path) — so a
 * fixed "digits per cycle" constant goes stale the moment the geometry
 * changes. Instead, the actual rendered text length is compared against
 * the actual path length at runtime and the digit budget is corrected
 * to match.
 */
export default function CurvedPiTrail({
  progress,
  cycles,
}: {
  progress: number;
  cycles: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [maxDigits, setMaxDigits] = useState(INITIAL_MAX_DIGITS);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setAspect(rect.height / rect.width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { d, viewBoxHeight } = buildWavePath(cycles, aspect);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [d]);

  const dashOffset = pathLength * (1 - progress);
  const digitCount = Math.max(MIN_DIGITS, Math.floor(progress * maxDigits));
  const windowText = `${PI_PREFIX}${PI_DIGITS.slice(0, digitCount)}`;

  // Self-calibrate: measure the currently-rendered text against the
  // currently-known path length, and correct the digit budget so it
  // converges on "fills the curve without overrunning it" within a
  // render or two, at any screen size or cycle count.
  useEffect(() => {
    const el = textPathRef.current;
    if (!el || !pathLength || windowText.length === 0) return;
    const rendered = el.getComputedTextLength();
    if (rendered <= 0) return;
    const charWidth = rendered / windowText.length;
    const budgetChars = Math.floor((pathLength * PATH_BUDGET_RATIO) / charWidth);
    const nextMaxDigits = Math.max(MIN_DIGITS, budgetChars - PI_PREFIX.length);
    setMaxDigits((prev) => (Math.abs(prev - nextMaxDigits) > 1 ? nextMaxDigits : prev));
  }, [pathLength, windowText]);

  return (
    <svg
      ref={svgRef}
      className="pi-trail pi-trail--inline"
      viewBox={`0 0 ${VIEW_W} ${viewBoxHeight.toFixed(1)}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <path id="pi-trail-curve" d={d} />
      </defs>

      <path d={d} className="pi-trail-track" />

      <path
        ref={pathRef}
        d={d}
        className="pi-trail-progress"
        style={{
          strokeDasharray: pathLength || undefined,
          strokeDashoffset: dashOffset,
        }}
      />

      <text className="pi-trail-text">
        <textPath ref={textPathRef} href="#pi-trail-curve" startOffset="2%">
          {windowText}
        </textPath>
      </text>
    </svg>
  );
}
