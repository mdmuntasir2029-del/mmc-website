import RevealOnScroll from "./RevealOnScroll";

interface AwardSlot {
  name: string;
  achievement: string;
  initials: string;
  left: number;
  bottom: number;
}

// Placeholder slots — swap name/achievement/initials with real winners as
// results come in. Positions sit on the y = x line drawn below.
const AWARDS: AwardSlot[] = [
  { name: "Add a Winner", achievement: "National Olympiad — Gold", initials: "★", left: 12, bottom: 10 },
  { name: "Add a Winner", achievement: "Regional Meet — 1st Place", initials: "★", left: 28, bottom: 28 },
  { name: "Add a Winner", achievement: "Inter-School Contest", initials: "★", left: 44, bottom: 46 },
  { name: "Add a Winner", achievement: "Club Championship", initials: "★", left: 60, bottom: 64 },
  { name: "Add a Winner", achievement: "Rising Mathlete Award", initials: "★", left: 76, bottom: 82 },
];

export default function AwardsPanel() {
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

            {AWARDS.map((a, i) => (
              <circle
                key={i}
                cx={a.left * 10}
                cy={(100 - a.bottom) * 5.6}
                r="7"
                className="point-marker"
              />
            ))}
          </svg>

          {AWARDS.map((a, i) => (
            <RevealOnScroll
              key={i}
              className="award-slot"
              style={{ left: `${a.left}%`, top: `${100 - a.bottom}%` }}
            >
              <div className="award-avatar">{a.initials}</div>
              <div className="award-name">{a.name}</div>
              <div className="award-achievement">{a.achievement}</div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
