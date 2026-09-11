import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteSections } from "../hooks/useSiteSections";

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { sections } = useSiteSections();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/logowhite.png" alt="Manarat Mathletes Club logo" />
          <span className="navbar-brand-text">
            Manarat
            <br />
            Mathletes Club
          </span>
        </Link>

        <nav>
          <ul className="navbar-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            {sections.about && (
              <li>
                <Link to="/#about">About</Link>
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
            {isAdmin && (
              <li>
                <Link to="/admin">Admin Panel</Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="navbar-actions">
          {isAdmin ? (
            <button className="btn-ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link to="/register" className="btn-shine">
              Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
