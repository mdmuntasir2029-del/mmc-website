import AwardsPanel from "../components/AwardsPanel";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

export default function Awards() {
  const { sections, loaded } = useSiteSections();

  if (loaded && !sections.awards) {
    return <SectionUnavailable />;
  }

  return (
    <div className="awards-page">
      <AwardsPanel />
    </div>
  );
}
