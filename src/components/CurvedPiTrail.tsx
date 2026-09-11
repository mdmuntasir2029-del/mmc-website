import { useEffect, useRef, useState } from "react";
import { VIEW_W, buildWavePath, waveHeight } from "../lib/piWave";

// 650 verified-correct decimal digits of pi (Chudnovsky algorithm,
// cross-checked against the previously-used 201-digit string — they
// match exactly). Long enough that the counter never runs out of digits
// before the arc is fully drawn, even at MAX_CYCLES.
const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912983367336244065664308602139494639522473719070217986094370277053921717629317675238467481846766940513200056812714526356082778577134275778960917363717872";

const MIN_DIGITS = 4;
// Calibrated against the actual rendered path length (see git history):
// enough that the digits keep pace with a fully-drawn curve without
// running out early or overshooting past the end of the path.
const DIGITS_PER_CYCLE = 56;

/**
 * The curved pi trail for the pinned scroll-scrub intro on the home
 * page: a real sine wave (see lib/piWave), so crests and troughs are
 * perfectly balanced. `progress` (0..1) drives how far it has drawn and
 * how many pi digits have rolled out along it. `cycles` sets how many
 * full periods the wave completes — driven by how many session photos
 * need a crest/trough slot beside it (see PiPhotoWave).
 */
export default function CurvedPiTrail({
  progress,
  cycles,
}: {
  progress: number;
  cycles: number;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const d = buildWavePath(cycles);
  const height = waveHeight(cycles);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [d]);

  const dashOffset = pathLength * (1 - progress);
  const maxDigits = Math.round(DIGITS_PER_CYCLE * cycles);
  const digitCount = Math.max(MIN_DIGITS, Math.floor(progress * maxDigits));
  const windowText = `π = ${PI_DIGITS.slice(0, digitCount)}`;

  return (
    <svg
      className="pi-trail pi-trail--inline"
      viewBox={`0 0 ${VIEW_W} ${height}`}
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
        <textPath href="#pi-trail-curve" startOffset="2%">
          {windowText}
        </textPath>
      </text>
    </svg>
  );
}
