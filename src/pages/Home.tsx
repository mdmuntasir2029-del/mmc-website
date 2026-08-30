import { useNavigate } from "react-router-dom";
import poster from "../assets/regposter.jpg";
import MathBackdrop from "../components/MathBackdrop";
import PiCounter from "../components/PiCounter";
import { IconTrophy, IconBook, IconUsers } from "../components/icons";

const HIGHLIGHTS = [
  {
    icon: <span aria-hidden="true">&Sigma;</span>,
    title: "Weekly Sessions",
    desc: "Weekly Sessions every Thursday. Chime in, whether you like math or like fun or both. ",
  },
  {
    icon: <IconTrophy size={26} />,
    title: "Prepare and Participate",
    desc: "Prepare for team and individual contests and olympiads. Participate in inter-school meets and other competitive math events.",
  },
  {
    icon: <IconBook size={26} />,
    title: "Contribute and Contest",
    desc: "Presentations, quizzes, and question banks shared by the club and members alike, all in one place.",
  },
  {
    icon: <IconUsers size={26} />,
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
            <p className="hero-desc">
              A student-run club for anyone who wants to think in numbers,
              patterns, and proofs &mdash; from casual puzzle-solvers to
              olympiad hopefuls. Member registrations for the
              2026&ndash;2027 session are open now. Boys from Classes 3-A2
              are welcome to register and find their love for math!
            </p>
            <div className="hero-cta-row">
              <button
                className="btn-shine"
                onClick={() => navigate("/register")}
              >
                Register
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
          <div className="section-heading">
            <h2>Contact Us</h2>
          </div>

          <div className="card-grid contact-grid">
            <div className="contact-card">
              <span className="label">Club In-Charge</span>
              <div className="value">Md. Shariful Islam</div>
              <a
                href="https://wa.me/8801921044564"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                01921044564
              </a>
            </div>

            <div className="contact-card">
              <span className="label">Developer</span>
              <div className="value">Muntasir Zaman</div>
              <a
                href="https://wa.me/8801916921252"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                01916921252
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
