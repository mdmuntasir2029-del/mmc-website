import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import poster from "../assets/regposter.jpg";
import CurvedPiTrail from "../components/CurvedPiTrail";
import { IconTrophy, IconBook, IconUsers } from "../components/icons";

const HIGHLIGHTS = [
  {
    icon: <span aria-hidden="true">&Sigma;</span>,
    title: "Weekly Sessions",
    desc: "Weekly Sessions every Thursday. Chime in, whether you like math or like fun or both. ",
  },
  {
    icon: <IconTrophy size={26} />,
    title: "Prepare and Participate",
    desc: "Prepare for team and individual contests and olympiads. Participate in inter-school meets and other competitive math events.",
  },
  {
    icon: <IconBook size={26} />,
    title: "Contribute and Contest",
    desc: "Presentations, quizzes, and question banks shared by the club and members alike, all in one place.",
  },
  {
    icon: <IconUsers size={26} />,
    title: "A Community of Mathletes",
    desc: "Work with peers who love numbers just as much as you do.",
  },
];

// Vertical offset of each lineup card, sampled from one period of a sine
// wave across the four cards — so at rest they sit on a visible wave.
const waveRestY = (i: number, count: number) =>
  Math.round(18 * Math.sin((i / count) * Math.PI * 2));

export default function Home() {
  const navigate = useNavigate();
  const lineupRef = useRef<HTMLDivElement | null>(null);
  const [lineupIn, setLineupIn] = useState(false);

  useEffect(() => {
    const el = lineupRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLineupIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      <CurvedPiTrail />

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">Session 2026&ndash;2027</span>
            <h1 className="hero-title">
              Manarat <span>Mathletes</span> Club
            </h1>
            <p className="hero-desc">
              A student-run club for anyone who wants to think in numbers,
              patterns, and proofs &mdash; from casual puzzle-solvers to
              olympiad hopefuls. Member registrations for the
              2026&ndash;2027 session are open now. Boys from Classes 3-A2
              are welcome to register and find their love for math!
            </p>
            <div className="hero-cta-row">
              <button
                className="btn-shine"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
              <a href="#about" className="btn-ghost-light">
                Learn More
              </a>
            </div>
          </div>

          <button
            className="hero-poster"
            onClick={() => navigate("/register")}
            aria-label="Click to register for Manarat Mathletes Club"
          >
            <img src={poster} alt="Manarat Mathletes Club member registrations are open" />
          </button>
        </div>
      </section>

      <section className="section section-about" id="about">
        <div className="container about-grid">
          <div className="about-text">
            <span className="eyebrow">About the club</span>
            <h2>Where mathletes are made</h2>
            <p>
              Manarat Mathletes Club (MMC) brings together students who see
              math as more than a subject &mdash; a way of thinking. We run
              weekly sessions, prepare members for competitions, and build a
              shared library of resources for everyone in the club.
            </p>
            <a href="#lineup" className="text-link">
              See how the club runs &rarr;
            </a>
          </div>

          <div className="info-grid">
            <div className="info-cell">
              <div className="info-value">Thursdays</div>
              <div className="info-label">Weekly Sessions</div>
            </div>
            <div className="info-cell">
              <div className="info-value">Classes 3&ndash;A2</div>
              <div className="info-label">Open To</div>
            </div>
            <div className="info-cell">
              <div className="info-value">Team &amp; Solo</div>
              <div className="info-label">Contest Formats</div>
            </div>
            <div className="info-cell">
              <div className="info-value">2026&ndash;27</div>
              <div className="info-label">Current Session</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-lineup" id="lineup">
        <div className="container">
          <div className="lineup-head">
            <div>
              <span className="eyebrow">This year's program</span>
              <h2>How We Meet &amp; Compete</h2>
            </div>
            <Link to="/articles" className="text-link">
              Browse resources &rarr;
            </Link>
          </div>

          <div className="card-grid" ref={lineupRef}>
            {HIGHLIGHTS.map((h, i) => (
              <div
                className={`card lineup-card${lineupIn ? " is-in" : ""}`}
                key={h.title}
                style={
                  {
                    "--rest-y": `${waveRestY(i, HIGHLIGHTS.length)}px`,
                    transitionDelay: `${i * 120}ms`,
                  } as CSSProperties
                }
              >
                <span className="card-icon">{h.icon}</span>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container cta-banner-inner">
          <h2>Ready to find your love for math?</h2>
          <p>
            Member registrations for the 2026&ndash;2027 session are open
            now.
          </p>
          <button className="btn-shine" onClick={() => navigate("/register")}>
            Register Now
          </button>
        </div>
      </section>
    </div>
  );
}
