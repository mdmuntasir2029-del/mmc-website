/**
 * Shared geometry for the pinned pi-trail wave: a mathematically real
 * sine curve (not a hand-drawn bezier), so every crest and trough has
 * exactly the same amplitude — and a set of "slots" at each crest/trough
 * for the session photos to sit beside, alternating sides.
 *
 * The curve's viewBox is sized to match its *actual rendered container's*
 * aspect ratio (measured at runtime — see CurvedPiTrail), not a fixed
 * guess. That's what keeps the pi digits looking like normal text
 * instead of stretched: preserveAspectRatio="none" scales x and y
 * independently, so if the viewBox aspect doesn't match the container's,
 * glyphs get squashed or stretched. Matching them makes scaleX === scaleY
 * by construction, everywhere, at every screen size.
 */

export const VIEW_W = 600;
export const DEFAULT_CYCLES = 2;
// Caps how far the wave (and the pinned scroll distance) grows for a
// big photo count — beyond this, extra photos just don't get a slot.
export const MAX_CYCLES = 4;
// Amplitude as a fraction of one cycle's own height — keeps the
// period:amplitude ratio (and so how "spiral" vs. "gentle sine" it
// looks) constant no matter how tall/short a cycle ends up being.
const AMPLITUDE_RATIO = 0.32;

// .pi-wave-area's own top/bottom padding (px) — the wave/photo layer
// fills the *whole* padded box (padding included), but the SVG's
// content only fills what's inside the padding, so a slot's pixel
// position has to account for this offset explicitly (see
// waveSlotTopCss) rather than using a bare percentage.
export const WAVE_AREA_PAD_Y = 70;

/** Each full cycle has one crest + one trough = 2 photo slots. */
export function cyclesForPhotoCount(count: number): number {
  const needed = Math.ceil(count / 2);
  return Math.min(MAX_CYCLES, Math.max(DEFAULT_CYCLES, needed));
}

export interface WavePath {
  d: string;
  viewBoxHeight: number;
  amplitude: number;
}

/**
 * A smooth vertical sine path sized to fill a container of the given
 * aspect ratio (renderedHeight / renderedWidth) without any non-uniform
 * stretch once drawn with preserveAspectRatio="none".
 */
export function buildWavePath(cycles: number, containerAspect: number): WavePath {
  const aspect = Number.isFinite(containerAspect) && containerAspect > 0 ? containerAspect : 1;
  const viewBoxHeight = VIEW_W * aspect;
  const perCycle = viewBoxHeight / cycles;
  const amplitude = perCycle * AMPLITUDE_RATIO;
  const midX = VIEW_W / 2;
  const steps = Math.round(60 * cycles);
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * viewBoxHeight;
    const x = midX + amplitude * Math.sin(t * cycles * Math.PI * 2);
    parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return { d: parts.join(" "), viewBoxHeight, amplitude };
}

export interface WaveSlot {
  /** 0..1 fraction down the wave (and the matching scrub progress). */
  t: number;
  /** Which side of the curve a photo at this slot belongs on. */
  side: "left" | "right";
}

/**
 * Crest/trough positions, alternating: a crest bulges toward +x (right),
 * so its photo sits on the opposite (left) side to stay clear of the
 * curve, and vice versa for troughs — hence sides naturally alternate.
 */
export function waveSlots(cycles: number): WaveSlot[] {
  const count = cycles * 2;
  const slots: WaveSlot[] = [];
  for (let j = 0; j < count; j++) {
    const t = (2 * j + 1) / (4 * cycles);
    slots.push({ t, side: j % 2 === 0 ? "left" : "right" });
  }
  return slots;
}

/**
 * CSS `top` for a slot's `t` (0..1) inside .pi-wave-photos, which spans
 * .pi-wave-area's full padding box while the curve itself only occupies
 * the inner (padding-excluded) content box — so `t * 100%` alone would
 * land slightly off. This offsets by the fixed top padding and scales
 * against the remaining height instead.
 */
export function waveSlotTopCss(t: number): string {
  return `calc(${WAVE_AREA_PAD_Y}px + (100% - ${WAVE_AREA_PAD_Y * 2}px) * ${t})`;
}
