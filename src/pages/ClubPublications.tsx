import { NavLink, Outlet } from "react-router-dom";

/**
 * Umbrella page for the club's written output — Articles and Resources
 * live here as tabs (/club-publications/articles,
 * /club-publications/resources) rather than as separate top-level pages.
 * Each tab is independently toggleable from Site Sections; this layout
 * itself has no visibility gate of its own.
 */
export default function ClubPublications() {
  return (
    <div className="club-publications-page">
      <div className="container pub-tabs">
        <NavLink
          to="/club-publications/articles"
          className={({ isActive }) => `pub-tab${isActive ? " active" : ""}`}
        >
          Articles
        </NavLink>
        <NavLink
          to="/club-publications/resources"
          className={({ isActive }) => `pub-tab${isActive ? " active" : ""}`}
        >
          Resources
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
