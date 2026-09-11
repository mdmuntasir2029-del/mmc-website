import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { Award } from "../lib/types";
import RevealOnScroll from "./RevealOnScroll";

// The diagonal drawn in the chart runs from (60,520) to (940,70) in the
// 1000x560 viewBox — these percentages (of the chart's own box) are
// chosen to sit right on that same line, so winners always plot along
// y = x no matter how many there are.
const DIAGONAL_START = { left: 10, bottom: 8 };
const DIAGONAL_END = { left: 82, bottom: 86 };

function slotPosition(i: number, count: number) {
  const t = count <= 1 ? 0.5 : i / (count - 1);
  return {
    left: DIAGONAL_START.left + t * (DIAGONAL_END.left - DIAGONAL_START.left),
    bottom: DIAGONAL_START.bottom + t * (DIAGONAL_END.bottom - DIAGONAL_START.bottom),
  };
}

function autoInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "★";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function AwardsPanel() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getAwards()
      .then(setAwards)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const slots = awards.map((a, i) => ({ award: a, ...slotPosition(i, awards.length) }));

  return (
    <section className="section section-awards" id="awards">
      <div className="container">
        <div className="section-heading">
          <h2>Award-Winning Mathletes</h2>
          <p>
            Every point on this line is a member who made the club proud
            &mdash; hover to take a closer look.
          </p>
        </div>

        <div className="cartesian-frame">
          <svg
            className="cartesian-svg"
            viewBox="0 0 1000 560"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 21 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="560" className="grid-line" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} className="grid-line" />
            ))}

            <line x1="60" y1="520" x2="970" y2="520" className="axis-line" />
            <polygon points="970,520 952,511 952,529" className="axis-arrow" />
            <line x1="60" y1="520" x2="60" y2="30" className="axis-line" />
            <polygon points="60,30 51,48 69,48" className="axis-arrow" />
            <text x="978" y="530" className="axis-label">x</text>
            <text x="42" y="32" className="axis-label">y</text>
            <text x="34" y="542" className="axis-label">O</text>

            <line x1="60" y1="520" x2="940" y2="70" className="diagonal-line" />
            <text x="815" y="60" className="diagonal-label">y = x</text>

            {slots.map((s) => (
              <circle
                key={s.award.id}
                cx={s.left * 10}
                cy={(100 - s.bottom) * 5.6}
                r="7"
                className="point-marker"
              />
            ))}
          </svg>

          {slots.map((s) => (
            <RevealOnScroll
              key={s.award.id}
              className="award-slot"
              style={{ left: `${s.left}%`, top: `${100 - s.bottom}%` }}
            >
              <div className="award-avatar">{s.award.initials || autoInitials(s.award.name)}</div>
              <div className="award-name">{s.award.name}</div>
              <div className="award-achievement">{s.award.achievement}</div>
            </RevealOnScroll>
          ))}

          {loaded && awards.length === 0 && (
            <p className="empty-state awards-empty">No award winners added yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
