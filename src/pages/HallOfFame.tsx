import CurvedPiTrail from "../components/CurvedPiTrail";
import SectionUnavailable from "../components/SectionUnavailable";
import { useScrollScrub, usePinnedScrollEnabled } from "../hooks/useScrollScrub";
import { useSiteSections } from "../hooks/useSiteSections";

export default function HallOfFame() {
  const { sections, loaded } = useSiteSections();
  const pinned = usePinnedScrollEnabled();
  const piScrub = useScrollScrub(pinned);

  if (loaded && !sections.hall_of_fame) {
    return <SectionUnavailable />;
  }

  return (
    <div className={pinned ? "hall-of-fame-page hall-of-fame-page--pinned" : "hall-of-fame-page"}>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">The club, in numbers</span>
            <h1>Hall of Fame</h1>
            <p>Content coming soon.</p>
          </div>
        </div>
      </section>

      {pinned ? (
        <div className="pin-outer pi-intro-outer" ref={piScrub.outerRef}>
          <div className="pin-sticky">
            <div className="pi-intro-row">
              <CurvedPiTrail progress={piScrub.progress} />
            </div>
          </div>
        </div>
      ) : (
        <section className="section pi-intro-static">
          <div className="container">
            <div className="pi-intro-wave-mobile" aria-hidden="true">
              <CurvedPiTrail progress={1} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
