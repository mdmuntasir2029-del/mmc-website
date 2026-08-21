import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Manarat Mathletes Club logo" />
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
            <li>
              <Link to="/#about">About</Link>
            </li>
            <li>
              <Link to="/awards">Awards</Link>
            </li>
            <li>
              <Link to="/articles">Articles</Link>
            </li>
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
            <>
              <Link to="/signin" className="btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn-shine">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
