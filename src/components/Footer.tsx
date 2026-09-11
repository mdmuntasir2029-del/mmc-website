import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <div className="footer-brand">
              <img src="/logowhite.png" alt="Manarat Mathletes Club logo" />
              Manarat Mathletes Club
            </div>
            <p className="footer-desc">
              A student-run club for anyone who wants to think in numbers,
              patterns, and proofs.
            </p>
            <p className="footer-address">
              Manarat Dhaka International School &amp; College, Gulshan,
              Dhaka-1212
            </p>
            <a
              className="footer-social"
              href="https://instagram.com/manaratmath.official"
              target="_blank"
              rel="noreferrer"
            >
              @manaratmath.official
            </a>
          </div>

          <div>
            <h3 className="footer-col-title">Quick Links</h3>
            <ul className="footer-quicklinks">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/#about">About</Link>
              </li>
              <li>
                <Link to="/awards">Awards</Link>
              </li>
              <li>
                <Link to="/articles">Articles</Link>
              </li>
              <li>
                <Link to="/leaderboard">Leaderboard</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-col-title">Contact Us</h3>
            <div className="footer-contact-item">
              <span className="footer-contact-label">Club In-Charge</span>
              <div className="footer-contact-name">Md. Shariful Islam</div>
              <a
                href="https://wa.me/8801921044564"
                target="_blank"
                rel="noreferrer"
                className="footer-contact-link"
              >
                01921044564
              </a>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-label">Developer</span>
              <div className="footer-contact-name">Muntasir Zaman</div>
              <a
                href="https://wa.me/8801402455560"
                target="_blank"
                rel="noreferrer"
                className="footer-contact-link"
              >
                01402455560
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Manarat Mathletes Club &mdash;
            to infinity unbound.
          </span>
          <span>
            Developed by <a href="#">Muntasir B28</a>
          </span>
          <Link to="/signin" className="footer-admin-link">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
