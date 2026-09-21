import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import CurvedPiTrail from "../components/CurvedPiTrail";
import SessionPhotoPanel from "../components/SessionPhotoPanel";
import SineWave from "../components/SineWave";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";
import { useSiteSections } from "../hooks/useSiteSections";
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
  const { sections } = useSiteSections();

  const piScrub = useScrollScrub(pinned);
  const lineupScrub = useScrollScrub(pinned);

  // When the pinned scrub is off (mobile / reduced motion) the lineup
  // cards are simply shown — no scroll-reveal gate, so they can't get
  // stuck invisible if an observer never fires.
  const lineupProgress = pinned ? lineupScrub.progress : 1;

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
              olympiad hopefuls.
              {sections.register &&
                " Member registrations for the 2026–2027 session are open now. Boys from Classes 3-A2 are welcome to register and find their love for math!"}
            </p>
            <div className="hero-cta-row">
              {sections.register && (
                <button
                  className="btn-shine"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              )}
              {sections.about && (
                <Link to="/about" className="btn-ghost-light">
                  About the Club
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {sections.session_photos && (
        <>
          {pinned ? (
            <div className="pin-outer pi-intro-outer" ref={piScrub.outerRef}>
              <div className="pin-sticky">
                <div className="pi-intro-row">
                  <SessionPhotoPanel variant="left" progress={piScrub.progress} />
                  <CurvedPiTrail progress={piScrub.progress} />
                  <SessionPhotoPanel variant="right" progress={piScrub.progress} />
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
        </>
      )}

      {sections.lineup && (
        <div className="pin-outer lineup-outer" ref={lineupScrub.outerRef}>
          <div className="pin-sticky">
            <section className="section section-lineup" id="lineup">
              <div className="container">
                <div className="lineup-head">
                  <div>
                    <span className="eyebrow">This year's program</span>
                    <h2>How We Meet &amp; Compete</h2>
                  </div>
                  {sections.articles && (
                    <Link to="/articles" className="text-link">
                      Browse resources &rarr;
                    </Link>
                  )}
                </div>

                <div className="lineup-stage">
                  <SineWave progress={lineupProgress} />
                  <div className="card-grid">
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
      )}

      {sections.articles && (
        <div className="container pi-articles-link">
          <Link to="/articles" className="text-link">
            Read some of our articles &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
