import { useEffect, useRef, useState } from "react";

const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";

// The number always starts from "3.14159..." and simply grows longer as
// the user scrolls (an accumulating counter), rather than showing a
// fixed-length window that slides through the digit string — that read
// as the whole number "traveling" instead of the digit count increasing.
// Capped well under the full ~205-digit string so laying the text out
// along the path each update stays cheap.
const MIN_DIGITS = 4;
const MAX_DIGITS = 130;

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
    // Re-laying-out the <textPath> and repainting a ~3000-unit-tall SVG
    // on every animation frame (up to 60x/sec) during a real scroll is
    // still expensive enough on real GPUs to cause visible stutter, even
    // with rAF-throttling alone (which only caps updates to once *per
    // frame*, not to a lower rate). This adds a wall-clock throttle on
    // top: real updates happen at most ~12x/sec while actively
    // scrolling, plus a short trailing debounce so the trail still
    // snaps to the exact final position shortly after scrolling stops.
    const THROTTLE_MS = 80;
    let ticking = false;
    let lastRun = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    function update() {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
      setProgress(next);
      lastRun = performance.now();
    }

    function handleScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (performance.now() - lastRun >= THROTTLE_MS) update();
          ticking = false;
        });
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(update, 120);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(debounceTimer);
    };
  }, []);

  const dashOffset = pathLength * (1 - progress);
  const digitCount = Math.max(MIN_DIGITS, Math.floor(progress * MAX_DIGITS));
  const windowText = `π = ${PI_DIGITS.slice(0, digitCount)}`;
  // Fixed near the start of the curve — only the digit count grows with
  // scroll, so the number visually extends further down the path over
  // time instead of its starting point sliding along it.
  const startOffset = "2%";

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
