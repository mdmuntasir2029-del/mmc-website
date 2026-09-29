import { useEffect, useRef } from "react";

/**
 * A Lissajous curve — x(t) = A·sin(a·t + δ), y(t) = B·sin(b·t) — drawn
 * on a plain 2D canvas and continuously re-drawn as the frequency
 * ratio (a, b) and phase (δ) drift toward whatever the pointer's
 * position implies, so hovering around the canvas visibly reshapes the
 * curve instead of just replaying a fixed animation.
 */
export default function ParametricCurveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Current (eased) and target curve parameters live in refs, not state —
  // this redraws every animation frame, so re-rendering the component on
  // every pointer move would be wasted work.
  const target = useRef({ a: 3, b: 2, delta: Math.PI / 2 });
  const current = useRef({ a: 3, b: 2, delta: Math.PI / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width; // 0..1
      const ny = (e.clientY - rect.top) / rect.height; // 0..1
      // Map pointer position to a pleasant range of frequency ratios and
      // phase — whole numbers for a/b keep the curve a closed Lissajous
      // figure instead of an ever-drifting scribble.
      target.current = {
        a: 2 + Math.round(nx * 5),
        b: 2 + Math.round((1 - ny) * 5),
        delta: nx * Math.PI,
      };
    }
    canvas.addEventListener("pointermove", onPointerMove);

    function draw() {
      raf = requestAnimationFrame(draw);
      time += 0.008;

      // Ease current params toward target — a snap would look jumpy.
      const c = current.current;
      const t = target.current;
      c.a += (t.a - c.a) * 0.04;
      c.b += (t.b - c.b) * 0.04;
      c.delta += (t.delta - c.delta) * 0.04;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.38;

      ctx!.beginPath();
      const steps = 500;
      for (let i = 0; i <= steps; i++) {
        const t2 = (i / steps) * Math.PI * 2;
        const x = cx + radius * Math.sin(c.a * t2 + c.delta + time);
        const y = cy + radius * Math.sin(c.b * t2);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(0, 229, 255, 0.85)";
      ctx!.lineWidth = 2;
      ctx!.shadowColor = "rgba(0, 229, 255, 0.6)";
      ctx!.shadowBlur = 10;
      ctx!.stroke();

      // A faint emerald trace one frame of phase behind, for a little
      // depth without a second full glow pass.
      ctx!.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t2 = (i / steps) * Math.PI * 2;
        const x = cx + radius * Math.sin(c.a * t2 + c.delta + time - 0.3);
        const y = cy + radius * Math.sin(c.b * t2);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = "rgba(0, 255, 136, 0.25)";
      ctx!.shadowBlur = 0;
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="parametric-curve-canvas"
      aria-hidden="true"
    />
  );
}
