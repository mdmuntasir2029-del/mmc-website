import ParametricCurveCanvas from "./ParametricCurveCanvas";

/**
 * The FRD mode homepage hero — an asymmetric editorial layout (left:
 * headline + dual CTAs, right: an interactive parametric-curve canvas),
 * per "Core Page Architecture" §1 of the supplied design brief.
 */
export default function FrdHero() {
  return (
    <section className="frd-hero">
      <div className="container frd-hero-grid">
        <div className="frd-hero-copy">
          <span className="frd-eyebrow">MMC Math Club</span>
          <h1 className="frd-hero-title">Logic. Rigor. Elegance.</h1>
          <p className="frd-hero-subtitle">
            The official platform for the MMC Math Club. Competition
            archives, daily proof challenges, and Olympiad training.
          </p>
          <div className="frd-hero-cta-row">
            <a href="#frd-problem-of-the-day" className="frd-btn frd-btn-emerald">
              Solve Problem of the Day
            </a>
            <a href="#frd-competition-archive" className="frd-btn frd-btn-outline">
              Explore Olympiad Archive
            </a>
          </div>
          <p className="frd-hero-sidenote">
            <span className="frd-sidenote-mark">note —</span> named contests
            referenced throughout: AMC 10/12, AIME, HMMT, USAMO, IMO.
          </p>
        </div>

        <div className="frd-hero-canvas-wrap">
          <ParametricCurveCanvas />
          <span className="frd-hero-canvas-caption">
            x(t) = A·sin(at+δ), y(t) = B·sin(bt) — hover to reparametrize
          </span>
        </div>
      </div>
    </section>
  );
}
