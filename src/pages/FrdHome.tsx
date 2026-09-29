import FrdHero from "../components/FrdHero";
import FrdProblemOfTheDay from "../components/FrdProblemOfTheDay";
import FrdCompetitionBento from "../components/FrdCompetitionBento";

/**
 * The FRD-mode variant of the homepage — only ever mounted when the
 * admin's own FRD Mode preview toggle is on (see FrdModeContext /
 * Home.tsx). Built up section by section: Hero, Problem of the Day, and
 * the Competition Bento now — Executive Board follows in the next
 * stage of the same plan.
 */
export default function FrdHome() {
  return (
    <div className="frd-home-page">
      <FrdHero />
      <FrdProblemOfTheDay />
      <FrdCompetitionBento />
    </div>
  );
}
