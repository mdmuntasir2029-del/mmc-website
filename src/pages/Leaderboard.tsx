import LeaderboardSection from "../components/LeaderboardSection";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

export default function Leaderboard() {
  const { sections, loaded } = useSiteSections();

  if (loaded && !sections.leaderboard) {
    return <SectionUnavailable />;
  }

  return (
    <div className="leaderboard-page">
      <LeaderboardSection />
    </div>
  );
}
