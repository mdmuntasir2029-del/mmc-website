import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import poster from "../assets/regposter.jpg";
import CurvedPiTrail from "../components/CurvedPiTrail";
import SineWave from "../components/SineWave";
import SessionPhotoPanel from "../components/SessionPhotoPanel";
import LeaderboardSection from "../components/LeaderboardSection";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";
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

// Vertical offset of each lineup card, taken from the same 1.5-period
// sine curve SineWave draws (sampled at the card's horizontal centre),
// so the cards sit along the wave. Kept a little inside its amplitude so
// they don't crowd the heading / CTA.
const waveRestY = (i: number, count: number) =>
  Math.round(-60 * Math.sin(((i + 0.5) / count) * Math.PI * 3));

// Fraction of the pinned scrub each card waits for before it reveals —
// spaced so a card pops in roughly as the drawn wavefront reaches it.
const revealAt = (i: number, count: number) => (i + 0.35) / count;

export default function Home() {
  const navigate = useNavigate();
  const pinned = usePinnedScrollEnabled();

  const piScrub = useScrollScrub(pinned);
  const lineupScrub = useScrollScrub(pinned);

  // Fallback reveal for when the pinned scrub is off (mobile / reduced
  // motion): a one-shot IntersectionObserver on the card grid.
  const lineupRef = useRef<HTMLDivElement | null>(null);
  const [lineupInView, setLineupInView] = useState(false);
  useEffect(() => {
    if (pinned) return;
    const el = lineupRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLineupInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinned]);

  const lineupProgress = pinned ? lineupScrub.progress : lineupInView ? 1 : 0;

  return (
    <div className={pinned ? "home-page home-page--pinned" : "home-page"}>
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

      {pinned ? (
        <div className="pin-outer pi-intro-outer" ref={piScrub.outerRef}>
          <div className="pin-sticky">
            <div className="pi-intro-row">
              <SessionPhotoPanel variant="left" />
              <CurvedPiTrail progress={piScrub.progress} />
              <SessionPhotoPanel variant="right" />
            </div>
          </div>
        </div>
      ) : (
        <section className="section pi-intro-static">
          <div className="container">
            <SessionPhotoPanel variant="full" />
            <div className="pi-intro-wave-mobile" aria-hidden="true">
              <CurvedPiTrail progress={1} />
            </div>
          </div>
        </section>
      )}

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

      <div className="pin-outer lineup-outer" ref={lineupScrub.outerRef}>
        <div className="pin-sticky">
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

              <div className="lineup-stage">
                <SineWave progress={lineupProgress} />
                <div className="card-grid" ref={lineupRef}>
                  {HIGHLIGHTS.map((h, i) => {
                    const shown =
                      lineupProgress >= revealAt(i, HIGHLIGHTS.length);
                    return (
                      <div
                        className={`card lineup-card${shown ? " is-in" : ""}`}
                        key={h.title}
                        style={
                          {
                            "--rest-y": `${waveRestY(i, HIGHLIGHTS.length)}px`,
                            transitionDelay: pinned ? "0ms" : `${i * 120}ms`,
                          } as CSSProperties
                        }
                      >
                        <span className="card-icon">{h.icon}</span>
                        <h3>{h.title}</h3>
                        <p>{h.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <LeaderboardSection />

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
