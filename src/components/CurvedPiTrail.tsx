import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// 650 verified-correct decimal digits of pi (Chudnovsky algorithm,
// cross-checked against the previously-used 201-digit string — they
// match exactly). Long enough that the counter never runs out of digits
// before the arc is fully drawn.
const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196442881097566593344612847564823378678316527120190914564856692346034861045432664821339360726024914127372458700660631558817488152092096282925409171536436789259036001133053054882046652138414695194151160943305727036575959195309218611738193261179310511854807446237996274956735188575272489122793818301194912983367336244065664308602139494639522473719070217986094370277053921717629317675238467481846766940513200056812714526356082778577134275778960917363717872";

const MIN_DIGITS = 4;
const MAX_DIGITS = 115;

// Vertical wave: descends top-to-bottom of the pinned viewport, weaving
// left and right, with the pi digits rolling down it as you scrub.
const CURVE_D =
  "M 300 8 C 470 175, 130 345, 300 510 " +
  "C 470 675, 130 845, 300 1012";
const VIEWBOX = "0 0 600 1020";

/**
 * The curved pi trail for the pinned scroll-scrub intro on the home page.
 * `progress` (0..1) drives how far the arc has drawn and how many pi
 * digits have rolled out along it.
 */
export default function CurvedPiTrail({ progress }: { progress: number }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, []);

  const dashOffset = pathLength * (1 - progress);
  const digitCount = Math.max(MIN_DIGITS, Math.floor(progress * MAX_DIGITS));
  const windowText = `π = ${PI_DIGITS.slice(0, digitCount)}`;

  // Slight upward drift over the pinned scrub so it doesn't feel frozen.
  const style: CSSProperties = {
    transform: `translateY(${(4 - progress * 8).toFixed(2)}vh)`,
  };

  return (
    <svg
      className="pi-trail pi-trail--inline"
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <path id="pi-trail-curve" d={CURVE_D} />
      </defs>

      <path d={CURVE_D} className="pi-trail-track" />

      <path
        ref={pathRef}
        d={CURVE_D}
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
