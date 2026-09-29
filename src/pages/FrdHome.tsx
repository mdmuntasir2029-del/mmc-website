import FrdHero from "../components/FrdHero";
import FrdProblemOfTheDay from "../components/FrdProblemOfTheDay";
import FrdCompetitionBento from "../components/FrdCompetitionBento";
import FrdExecutiveBoard from "../components/FrdExecutiveBoard";

/**
 * The FRD-mode variant of the homepage — only ever mounted when the
 * admin's own FRD Mode preview toggle is on (see FrdModeContext /
 * Home.tsx). All five "Core Page Architecture" modules now: Hero,
 * Problem of the Day, Competition Bento, Executive Board — the WebGL
 * pre-loader and the golden-ratio buffering overlay are separate,
 * global pieces (not part of this page tree) that land in the plan's
 * final two stages.
 */
export default function FrdHome() {
  return (
    <div className="frd-home-page">
      <FrdHero />
      <FrdProblemOfTheDay />
      <FrdCompetitionBento />
      <FrdExecutiveBoard />
    </div>
  );
}
