import { useEffect, useRef, useState } from "react";

const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";

// Only a short window of digits is laid out along the path at once —
// re-running SVG textPath glyph layout for a ~200 char string on every
// scroll tick is what was causing the scroll jank/jumpiness; a ~55 char
// window is far cheaper to re-lay-out each frame.
const WINDOW_SIZE = 55;
const MAX_START = PI_DIGITS.length - WINDOW_SIZE;

// One winding curve, reused for the always-visible dashed track, the
// solid "drawn as you scroll" progress line, and the path the pi
// digits themselves flow along.
const CURVE_D =
  "M 500 0 C 850 150, 850 450, 500 600 " +
  "C 150 750, 150 1050, 500 1200 " +
  "C 850 1350, 850 1650, 500 1800 " +
  "C 150 1950, 150 2250, 500 2400 " +
  "C 850 2550, 850 2850, 500 3000";

export default function CurvedPiTrail() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    function update() {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
      setProgress(next);
      ticking = false;
    }

    // requestAnimationFrame-throttled: scroll (and especially inertial /
    // high-polling-rate trackpad scroll) can fire far more often than the
    // display can paint, so without this the state update — and the SVG
    // textPath relayout it triggers — was running many times per frame.
    function handleScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const dashOffset = pathLength * (1 - progress);
  const startIndex = Math.floor(progress * MAX_START);
  const windowText = `π = ${PI_DIGITS.slice(startIndex, startIndex + WINDOW_SIZE)}`;
  // Slides the digit window's position along the curve as the user
  // scrolls, so it rolls out following the line instead of only
  // growing in place from the top.
  const startOffset = `${progress * 82}%`;

  return (
    <svg
      className="pi-trail"
      viewBox="0 0 1000 3000"
      preserveAspectRatio="none"
      aria-hidden="true"
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
        <textPath href="#pi-trail-curve" startOffset={startOffset}>
          {windowText}
        </textPath>
      </text>
    </svg>
  );
}
