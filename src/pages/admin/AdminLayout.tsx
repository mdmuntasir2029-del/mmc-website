import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { AdminSection } from "../../lib/types";
import {
  IconDashboard,
  IconCalendar,
  IconBook,
  IconNewspaper,
  IconImage,
  IconTrophy,
  IconStar,
  IconEye,
  IconUsers,
  IconChat,
} from "../../components/icons";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof IconDashboard;
  end?: boolean;
  section?: AdminSection;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// Grouped by which page of the site each admin page manages, rather
// than one flat list — makes it obvious at a glance where a given
// control's effect actually shows up (see item 5 of the redesign brief).
const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ to: "/admin", label: "Dashboard", Icon: IconDashboard, end: true }] },
  {
    label: "Home",
    items: [
      { to: "/admin/session-photos", label: "Session Photos (Hero)", Icon: IconImage, section: "session_photos" },
    ],
  },
  {
    label: "About",
    items: [
      { to: "/admin/activity-slideshow", label: "Activity Slideshow", Icon: IconImage, section: "activity_slideshow" },
      { to: "/admin/testimonials", label: "Testimonials", Icon: IconChat, section: "testimonials" },
    ],
  },
  {
    label: "Hall of Fame",
    items: [
      { to: "/admin/hall-of-fame", label: "Hall of Fame Roster", Icon: IconStar, section: "hall_of_fame_entries" },
    ],
  },
  {
    label: "Awards",
    items: [{ to: "/admin/awards", label: "Awards", Icon: IconStar, section: "awards" }],
  },
  {
    label: "Articles",
    items: [{ to: "/admin/articles", label: "Articles", Icon: IconNewspaper, section: "articles" }],
  },
  {
    label: "Leaderboards",
    items: [{ to: "/admin/leaderboards", label: "Leaderboards", Icon: IconTrophy, section: "leaderboards" }],
  },
  {
    label: "Site-wide",
    items: [
      { to: "/admin/activity-log", label: "Club Activity Log", Icon: IconCalendar, section: "activity_log" },
      { to: "/admin/resources", label: "Resources", Icon: IconBook, section: "resources" },
      { to: "/admin/forum", label: "Executive Forum", Icon: IconChat, section: "forum" },
      { to: "/admin/olympiad-registrations", label: "Olympiad Registrations", Icon: IconUsers, section: "olympiad_registrations" },
      { to: "/admin/site-sections", label: "Site Sections", Icon: IconEye, section: "site_sections" },
    ],
  },
  {
    label: "Super Admin",
    items: [{ to: "/admin/roles", label: "Admin Roles", Icon: IconUsers, superAdminOnly: true }],
  },
];

export default function AdminLayout() {
  const { email, isSuperAdmin, canAccess, signOut } = useAuth();
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

        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.superAdminOnly) return isSuperAdmin;
            if (item.section) return canAccess(item.section);
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div className="admin-nav-group" key={group.label ?? "root"}>
              {group.label && <div className="admin-nav-group-label">{group.label}</div>}
              {visibleItems.map((item) => (
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
            </div>
          );
        })}

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
