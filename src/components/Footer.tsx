import { Link } from "react-router-dom";
import logoMark from "../assets/logo-mark.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={logoMark} alt="Manarat Mathletes Club logo" />
            Manarat Mathletes Club
          </div>

          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/signin">Sign In</Link>
            </li>
            <li>
              <a
                href="https://instagram.com/manaratmath.official"
                target="_blank"
                rel="noreferrer"
              >
                @manaratmath.official
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} Manarat Mathletes Club &mdash;
            to infinity unbound.
          </span>
          <span>
            Developed by <a href="#">Muntasir B28</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
