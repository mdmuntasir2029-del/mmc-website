import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "\u{1F4CA}", end: true },
  { to: "/admin/activity-log", label: "Club Activity Log", icon: "\u{1F4C5}", end: false },
  { to: "/admin/resources", label: "Resources", icon: "\u{1F4DA}", end: false },
  { to: "/admin/articles", label: "Articles", icon: "\u{1F4F0}", end: false },
  { to: "/admin/members", label: "Member Management", icon: "\u{1F465}", end: false },
  { to: "/admin/forum", label: "Executive Forum", icon: "\u{1F4AC}", end: false },
];

export default function AdminLayout() {
  const { email, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          Admin Panel
          <small>{email}</small>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}

        <div className="admin-sidebar-footer">
          <button className="btn btn-secondary btn-sm" onClick={handleSignOut} style={{ width: "100%" }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
