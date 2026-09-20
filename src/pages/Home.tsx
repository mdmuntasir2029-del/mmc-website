import { Link, useNavigate } from "react-router-dom";
import CurvedPiTrail from "../components/CurvedPiTrail";
import SessionPhotoPanel from "../components/SessionPhotoPanel";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";
import { useSiteSections } from "../hooks/useSiteSections";

export default function Home() {
  const navigate = useNavigate();
  const pinned = usePinnedScrollEnabled();
  const { sections } = useSiteSections();

  const piScrub = useScrollScrub(pinned);

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
                <Link
                  to="/about"
                  className="btn-ghost-light"
                  aria-label="Learn more about Manarat Mathletes Club"
                >
                  Learn More
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

          {sections.articles && (
            <div className="container pi-articles-link">
              <Link to="/articles" className="text-link">
                Read some of our articles &rarr;
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
