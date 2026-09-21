import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import * as db from "../lib/db";
import type { Award } from "../lib/types";
import { autoInitials } from "../lib/awardInitials";
import AwardDetailModal from "./AwardDetailModal";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";

// A boustrophedon ("as the ox ploughs") track: two columns, alternating
// direction each row — left to right, down, right to left, down, left
// to right again — like the pi-wave but zig-zagging across the page
// instead of weaving down a single column.
const VIEWBOX_WIDTH = 600;
const COL_X = [160, 440];
const ROW_HEIGHT = 280;
const PADDING_TOP = 110;
const PADDING_BOTTOM = 110;
// How much scroll distance the reveal plays out over, scaled by how
// tall the track's own viewBox is (more rows = more scroll to scrub
// through) — same idea as the pi-wave's fixed 260vh, just data-driven.
const SCRUB_VH_PER_VIEWBOX_UNIT = 0.5;
const MIN_SCRUB_VH = 180;

function pointFor(i: number) {
  const row = Math.floor(i / COL_X.length);
  const posInRow = i % COL_X.length;
  const col = row % 2 === 0 ? posInRow : COL_X.length - 1 - posInRow;
  return { x: COL_X[col], y: PADDING_TOP + row * ROW_HEIGHT };
}

function buildTrack(count: number) {
  if (count === 0) return { d: "", height: PADDING_TOP + PADDING_BOTTOM };
  const points = Array.from({ length: count }, (_, i) => pointFor(i));
  const rows = Math.ceil(count / COL_X.length);
  const height = PADDING_TOP + (rows - 1) * ROW_HEIGHT + PADDING_BOTTOM;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  return { d, height };
}

// Fraction of the pinned scrub each award waits for before it reveals —
// spaced across the whole track, same pacing idea as the pi-wave digits.
const revealAt = (i: number, count: number) => (i + 0.5) / count;

export default function AwardsPanel() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Award | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);

  const pinned = usePinnedScrollEnabled();
  const scrub = useScrollScrub(pinned);
  const progress = pinned ? scrub.progress : 1;

  useEffect(() => {
    db.getAwards()
      .then(setAwards)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const track = useMemo(() => buildTrack(awards.length), [awards.length]);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [track.d]);

  const dashOffset = pathLength * (1 - progress);
  const outerStyle: CSSProperties | undefined = pinned
    ? {
        height: `${Math.max(MIN_SCRUB_VH, track.height * SCRUB_VH_PER_VIEWBOX_UNIT)}vh`,
      }
    : undefined;

  return (
    <section className="section section-awards" id="awards">
      <div className="container">
        <div className="section-heading">
          <h1>Award-Winning Mathletes</h1>
          <p>
            Every stop on this track is a member who made the club proud
            &mdash; hover for a closer look, click for the full story.
          </p>
        </div>

        {loaded && awards.length === 0 ? (
          <p className="empty-state awards-empty-static">No award winners added yet.</p>
        ) : (
          <div className="award-track-outer" ref={scrub.outerRef} style={outerStyle}>
            <div className="award-track-sticky">
              <div
                className="award-track-frame"
                style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${track.height}` }}
              >
                <svg
                  className="award-track-svg"
                  viewBox={`0 0 ${VIEWBOX_WIDTH} ${track.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  <path d={track.d} className="award-track-line" />
                  <path
                    ref={pathRef}
                    d={track.d}
                    className="award-track-line-progress"
                    style={{
                      strokeDasharray: pathLength || undefined,
                      strokeDashoffset: dashOffset,
                    }}
                  />
                </svg>

                {awards.map((a, i) => {
                  const p = pointFor(i);
                  const revealed = progress >= revealAt(i, awards.length);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`award-stop${revealed ? " is-in" : ""}`}
                      style={{
                        left: `${(p.x / VIEWBOX_WIDTH) * 100}%`,
                        top: `${(p.y / track.height) * 100}%`,
                      }}
                      onClick={() => setSelected(a)}
                    >
                      {a.imageUrl ? (
                        <img
                          className="award-stop-image"
                          src={a.imageUrl}
                          srcSet={a.imageSrcSet ?? undefined}
                          sizes="140px"
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <div className="award-avatar">
                          {a.initials || autoInitials(a.name)}
                        </div>
                      )}
                      <div className="award-name">{a.name}</div>
                      <div className="award-achievement">{a.achievement}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AwardDetailModal award={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
