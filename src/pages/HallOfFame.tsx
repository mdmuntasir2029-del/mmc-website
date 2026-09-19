import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

export default function HallOfFame() {
  const { sections, loaded } = useSiteSections();

  if (loaded && !sections.hall_of_fame) {
    return <SectionUnavailable />;
  }

  return (
    <div className="hall-of-fame-page">
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <h2>Hall of Fame</h2>
            <p>Content coming soon.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
