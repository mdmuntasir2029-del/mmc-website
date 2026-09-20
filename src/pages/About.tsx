import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import SineWave from "../components/SineWave";
import ActivitySlideshow from "../components/ActivitySlideshow";
import SectionUnavailable from "../components/SectionUnavailable";
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

export default function About() {
  const navigate = useNavigate();
  const pinned = usePinnedScrollEnabled();
  const { sections, loaded } = useSiteSections();

  const lineupScrub = useScrollScrub(pinned);

  // When the pinned scrub is off (mobile / reduced motion) the lineup
  // cards are simply shown — no scroll-reveal gate, so they can't get
  // stuck invisible if an observer never fires.
  const lineupProgress = pinned ? lineupScrub.progress : 1;

  if (loaded && !sections.about) {
    return <SectionUnavailable />;
  }

  return (
    <div className={pinned ? "about-page about-page--pinned" : "about-page"}>
      <section className="section section-about" id="about">
        <div className="container about-grid">
          <div className="about-text">
            <span className="eyebrow">About the club</span>
            <h1>Where mathletes are made</h1>
            <p>
              Manarat Mathletes Club (MMC) brings together students who see
              math as more than a subject &mdash; a way of thinking. We run
              weekly sessions, prepare members for competitions, and build a
              shared library of resources for everyone in the club.
            </p>
            {sections.lineup && (
              <a href="#lineup" className="text-link">
                See how the club runs &rarr;
              </a>
            )}
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

      {sections.activity_slideshow && <ActivitySlideshow />}

      {sections.register && (
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
      )}
    </div>
  );
}
