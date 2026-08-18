import { useNavigate } from "react-router-dom";
import poster from "../assets/regposter.jpg";
import MathBackdrop from "../components/MathBackdrop";
import PiCounter from "../components/PiCounter";

const HIGHLIGHTS = [
  {
    icon: "∑",
    title: "Weekly Session- Thursdays are our birthdays!",
    desc: "Weekly Sessions every Thursday. Chime in, whether you like math or like fun or both. ",
  },
  {
    icon: "\u{1F3C6}",
    title: "Prepare and Participate",
    desc: "Prepare for team and individual contests and olympiads. Participate in inter-school meets and other competitive math events.",
  },
  {
    icon: "\u{1F4DA}",
    title: "Contribute and Contest",
    desc: "Presentations, quizzes, and question banks shared by the club and members alike, all in one place.",
  },
  {
    icon: "\u{1F91D}",
    title: "A Community of Mathletes",
    desc: "Work with peers who love numbers just as much as you do.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <MathBackdrop />
      <PiCounter />

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">Session 2026&ndash;2027</span>
            <h1 className="hero-title">
              Manarat <span>Mathletes</span> Club
            </h1>
            <p className="hero-tagline">to infinity unbound.</p>
            <p className="hero-desc">
              A student-run club for anyone who wants to think in numbers,
              patterns, and proofs &mdash; from casual puzzle-solvers to
              olympiad hopefuls. Member registrations for the 2026&ndash;2027
              session are open now.
            </p>
            <div className="hero-cta-row">
              <button
                className="btn-shine"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
              <button
                className="btn-ghost"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </button>
            </div>
          </div>

          <button
            className="hero-poster"
            onClick={() => navigate("/register")}
            aria-label="Click to register for Manarat Mathletes Club"
          >
            <img src={poster} alt="Manarat Mathletes Club member registrations are open" />
          </button>
        </div>
      </section>

      <section className="section section-green" id="about">
        <div className="container">
          <div className="section-heading">
            <h2>What We're About</h2>
            <p>
              Manarat Mathletes Club (MMC) brings together students who see
              math as more than a subject &mdash; a way of thinking. We run
              weekly sessions, prepare members for competitions, and build a
              shared library of resources for everyone in the club.
            </p>
          </div>

          <div className="card-grid">
            {HIGHLIGHTS.map((h) => (
              <div className="card" key={h.title}>
                <span className="card-icon">{h.icon}</span>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-green-deep">
        <div className="container">
          <div className="contact-card">
            <span className="label">Club In-Charge</span>
            <div className="value">Md. Shariful Islam</div>
            <p style={{ color: "var(--ink-soft)", marginBottom: "6px" }}>
              For questions about membership or club activities, reach out
              directly.
            </p>
            <a
              href="tel:01921044564"
              className="btn btn-primary"
              style={{ marginTop: "10px" }}
            >
              01921044564
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
