import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  IconDashboard,
  IconCalendar,
  IconBook,
  IconNewspaper,
  IconUsers,
  IconChat,
} from "../../components/icons";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", Icon: IconDashboard, end: true },
  { to: "/admin/activity-log", label: "Club Activity Log", Icon: IconCalendar, end: false },
  { to: "/admin/resources", label: "Resources", Icon: IconBook, end: false },
  { to: "/admin/articles", label: "Articles", Icon: IconNewspaper, end: false },
  { to: "/admin/members", label: "Member Management", Icon: IconUsers, end: false },
  { to: "/admin/forum", label: "Executive Forum", Icon: IconChat, end: false },
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
            <item.Icon /> {item.label}
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
