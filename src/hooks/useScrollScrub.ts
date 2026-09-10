import { useEffect, useRef, useState } from "react";

/**
 * Drives a 0..1 progress value from how far the user has scrolled through
 * a "pinned" region — an outer element taller than the viewport whose
 * child is `position: sticky`. While the sticky child is pinned in view,
 * progress runs 0 → 1. The page keeps scrolling normally the whole time
 * (this is a sticky scrub, not scroll-event hijacking), so momentum,
 * keyboard scrolling and accessibility are unaffected.
 *
 * When `enabled` is false the hook does nothing and progress stays at
 * `disabledValue` (1 = "treat the animation as already finished"), which
 * is how small screens / reduced-motion fall back to plain layout.
 */
export function useScrollScrub(enabled: boolean, disabledValue = 1) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(enabled ? 0 : disabledValue);

  useEffect(() => {
    if (!enabled) {
      setProgress(disabledValue);
      return;
    }
    const outer = outerRef.current;
    if (!outer) return;

    let ticking = false;

    function update() {
      ticking = false;
      const el = outerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrubDistance = el.offsetHeight - window.innerHeight;
      const scrolledIntoRegion = -rect.top;
      const p =
        scrubDistance > 0
          ? Math.min(1, Math.max(0, scrolledIntoRegion / scrubDistance))
          : 0;
      setProgress(p);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, disabledValue]);

  return { outerRef, progress };
}

/**
 * True only where the pinned scroll animations should run: wide enough
 * viewports (the pi trail is already hidden below 900px) and no
 * reduced-motion preference. Read synchronously on first render so there
 * is no layout flash between the plain and pinned trees.
 */
export function usePinnedScrollEnabled() {
  const query = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";
  const [enabled, setEnabled] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setEnabled(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return enabled;
}
