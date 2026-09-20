import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteSections } from "../hooks/useSiteSections";
import { IconMenu, IconClose } from "./icons";

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sections } = useSiteSections();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on every navigation (including clicking a link
  // inside it) instead of leaving it open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/logowhite.png" alt="Manarat Mathletes Club logo" width={68} height={46} />
          <span className="navbar-brand-text">
            Manarat
            <br />
            Mathletes Club
          </span>
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>

        <nav id="navbar-menu" className={`navbar-menu${menuOpen ? " is-open" : ""}`}>
          <ul className="navbar-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            {sections.about && (
              <li>
                <Link to="/about">About</Link>
              </li>
            )}
            {sections.awards && (
              <li>
                <Link to="/awards">Awards</Link>
              </li>
            )}
            {sections.articles && (
              <li>
                <Link to="/articles">Articles</Link>
              </li>
            )}
            {sections.leaderboard && (
              <li>
                <Link to="/leaderboard">Leaderboard</Link>
              </li>
            )}
            {sections.hall_of_fame && (
              <li>
                <Link to="/hall-of-fame">Hall of Fame</Link>
              </li>
            )}
            {isAdmin && (
              <li>
                <Link to="/admin">Admin Panel</Link>
              </li>
            )}
          </ul>

          <div className="navbar-menu-actions">
            {isAdmin ? (
              <button className="btn-ghost" onClick={handleSignOut}>
                Sign Out
              </button>
            ) : (
              sections.register && (
                <Link to="/register" className="btn-shine">
                  Register
                </Link>
              )
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {isAdmin ? (
            <button className="btn-ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            sections.register && (
              <Link to="/register" className="btn-shine">
                Register
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
