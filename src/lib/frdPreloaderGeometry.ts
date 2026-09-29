/**
 * Pure geometry builders for the FRD pre-loader's WebGL scene — kept
 * separate from the rendering component so the math (Fibonacci spiral,
 * damped sine wave, a hand-authored Descartes silhouette) is easy to
 * read and test independent of the GL boilerplate.
 *
 * Every line-based layer returns a flat Float32Array of
 * [x, y, arcLength, ...] triples in a -1..1 clip-space box — arcLength
 * is the cumulative distance from the first vertex, which the shader
 * compares against a uProgress uniform to draw the stroke progressively
 * (the WebGL equivalent of SVG's stroke-dashoffset trick already used
 * elsewhere in this codebase for the pi-wave/sine-wave/awards-track).
 */

export interface LineGeometry {
  vertices: Float32Array; // [x, y, arcLength] * n
  totalLength: number;
  vertexCount: number;
}

function withArcLength(points: [number, number][]): LineGeometry {
  const vertices = new Float32Array(points.length * 3);
  let acc = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (i > 0) {
      const [px, py] = points[i - 1];
      acc += Math.hypot(x - px, y - py);
    }
    vertices[i * 3] = x;
    vertices[i * 3 + 1] = y;
    vertices[i * 3 + 2] = acc;
  }
  return { vertices, totalLength: acc, vertexCount: points.length };
}

/** Fibonacci squares (1,1,2,3,5,8,13,21) arranged in the classic
 *  golden-rectangle spiral, each square's outline concatenated with the
 *  logarithmic spiral (theta = a*e^(b*phi)) traced through their
 *  corners — one continuous polyline so a single progressive reveal
 *  covers both, matching the brief's "Fibonacci Grid & Golden Spiral". */
export function buildFibonacciSpiral(): LineGeometry {
  const fib = [1, 1, 2, 3, 5, 8, 13, 21];
  const scale = 0.052; // fits the whole spiral inside the -1..1 box
  const points: [number, number][] = [];

  // Walk the squares counter-clockwise starting bottom-left of the unit
  // square, growing outward — standard Fibonacci-spiral construction.
  let x = 0;
  let y = 0;
  let dir = 0; // 0 = right, 1 = up, 2 = left, 3 = down
  for (const size of fib) {
    let sx = x;
    let sy = y;
    if (dir === 0) sx = x;
    else if (dir === 1) sy = y - size;
    else if (dir === 2) sx = x - size;
    else sy = y;

    // Square outline (closed loop).
    const corners: [number, number][] = [
      [sx, sy],
      [sx + size, sy],
      [sx + size, sy + size],
      [sx, sy + size],
      [sx, sy],
    ];
    for (const [cx, cy] of corners) points.push([cx * scale, cy * scale]);

    if (dir === 0) x += size;
    else if (dir === 1) y -= size;
    else if (dir === 2) x -= size;
    else y += size;
    dir = (dir + 1) % 4;
  }

  // The spiral itself, layered on top as its own set of segments
  // (appended so it reveals just after the squares given equal-ish arc
  // length per layer) — approximated as a smooth logarithmic curve
  // scaled to match the squares' bounding box.
  const steps = 200;
  const b = 0.30635; // golden-spiral growth rate (ln(phi) / (pi/2))
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 3.5;
    const r = 0.9 * Math.exp(b * theta) * (scale * 1.1);
    points.push([r * Math.cos(theta - Math.PI), r * Math.sin(theta - Math.PI)]);
  }

  return withArcLength(points);
}

/** y(x,t) = A * sin(kx - wt) * e^(-lambda*x), sampled at t=0 — the time
 *  term animates via a uniform in the shader rather than being baked in
 *  here, so the wave can keep drifting after it's fully drawn in. */
export function buildDampedSineWave(): LineGeometry {
  const steps = 260;
  const points: [number, number][] = [];
  const A = 0.5;
  const k = 10;
  const lambda = 0.6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = -0.95 + t * 1.9;
    const envelope = Math.exp(-lambda * (x + 0.95));
    const y = A * Math.sin(k * x) * envelope;
    points.push([x, y]);
  }
  return withArcLength(points);
}

/** A simplified vector-line "sketch" bust — not a photo, a stylised
 *  silhouette (head, 17th-century wig, shoulders/collar) built from a
 *  handful of smooth arcs, enough to read as a portrait sketch at the
 *  sizes this renders at. Coordinates are hand-tuned in a local
 *  -1..1 box, recentred/scaled by the caller. */
export function buildDescartesSketch(): LineGeometry {
  const points: [number, number][] = [];

  function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps: number) {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (a1 - a0) * (i / steps);
      points.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
  }

  // Wig: two large lobes flowing down past the shoulders.
  arc(-0.08, 0.15, 0.62, 0.7, Math.PI * 0.15, Math.PI * 1.05, 40);
  arc(0.08, 0.15, 0.62, 0.7, -Math.PI * 0.05, Math.PI * 0.85, 40);
  // Face oval.
  arc(0, 0.2, 0.3, 0.38, -Math.PI * 0.5, Math.PI * 0.5, 30);
  arc(0, 0.2, 0.3, 0.38, Math.PI * 0.5, Math.PI * 1.5, 30);
  // Collar.
  points.push([-0.4, -0.7]);
  points.push([0, -0.5]);
  points.push([0.4, -0.7]);
  // Shoulders.
  arc(0, -0.85, 0.75, 0.35, Math.PI * 1.1, Math.PI * 1.9, 30);

  return withArcLength(points);
}

/** Starfield particles — plain positions (no arc length needed, points
 *  don't reveal progressively the way lines do), each with a random
 *  depth (drives parallax strength + point size) and phase offset (so
 *  the slow drift isn't perfectly synchronized). */
export interface PointGeometry {
  vertices: Float32Array; // [x, y, depth, phase] * n
  count: number;
}

export function buildStarfield(count: number): PointGeometry {
  const vertices = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    vertices[i * 4] = Math.random() * 2 - 1;
    vertices[i * 4 + 1] = Math.random() * 2 - 1;
    vertices[i * 4 + 2] = Math.random(); // depth 0..1
    vertices[i * 4 + 3] = Math.random() * Math.PI * 2; // phase
  }
  return { vertices, count };
}
