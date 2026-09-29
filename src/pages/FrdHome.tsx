import FrdHero from "../components/FrdHero";

/**
 * The FRD-mode variant of the homepage — only ever mounted when the
 * admin's own FRD Mode preview toggle is on (see FrdModeContext /
 * Home.tsx). Built up section by section: Hero now, Problem of the Day
 * / Competition Archive & Leaderboard Bento / Executive Board follow in
 * later stages of the same plan.
 */
export default function FrdHome() {
  return (
    <div className="frd-home-page">
      <FrdHero />
    </div>
  );
}
