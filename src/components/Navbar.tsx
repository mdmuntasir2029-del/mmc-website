import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
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
              <Link to="/signin">Sign In</Link>
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
            <Link to="/register" className="btn-shine">
              Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
