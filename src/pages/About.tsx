import { Link } from "react-router-dom";
import ActivitySlideshow from "../components/ActivitySlideshow";
import CurrentLineup from "../components/CurrentLineup";
import TestimonialsPanel from "../components/TestimonialsPanel";
import SectionUnavailable from "../components/SectionUnavailable";
import { usePinnedScrollEnabled } from "../hooks/useScrollScrub";
import { useSiteSections } from "../hooks/useSiteSections";

export default function About() {
  const pinned = usePinnedScrollEnabled();
  const { sections, loaded } = useSiteSections();

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
              <Link to="/#lineup" className="text-link">
                See how the club runs &rarr;
              </Link>
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

      {sections.activity_slideshow && <ActivitySlideshow />}
      {sections.current_lineup && <CurrentLineup />}
      {sections.testimonials && <TestimonialsPanel />}
    </div>
  );
}
