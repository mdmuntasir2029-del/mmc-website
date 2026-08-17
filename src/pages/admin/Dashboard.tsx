import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as db from "../../lib/db";

export default function Dashboard() {
  const [counts, setCounts] = useState({
    members: 0,
    logEntries: 0,
    resources: 0,
    forumPosts: 0,
  });

  useEffect(() => {
    (async () => {
      const [members, log, pres, quizzes, questions, posts] = await Promise.all([
        db.getMembers(),
        db.getActivityLog(),
        db.getResources("presentations"),
        db.getResources("quizzes"),
        db.getResources("questions"),
        db.getForumPosts(),
      ]);
      setCounts({
        members: members.length,
        logEntries: log.length,
        resources: pres.length + quizzes.length + questions.length,
        forumPosts: posts.length,
      });
    })();
  }, []);

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Dashboard</h2>
          <p>Quick overview of the club's data.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Link to="/admin/members" className="stat-card">
          <div className="num">{counts.members}</div>
          <div className="label">Registered Members</div>
        </Link>
        <Link to="/admin/activity-log" className="stat-card">
          <div className="num">{counts.logEntries}</div>
          <div className="label">Activity Log Entries</div>
        </Link>
        <Link to="/admin/resources" className="stat-card">
          <div className="num">{counts.resources}</div>
          <div className="label">Resources Uploaded</div>
        </Link>
        <Link to="/admin/forum" className="stat-card">
          <div className="num">{counts.forumPosts}</div>
          <div className="label">Forum Posts</div>
        </Link>
      </div>

      <div className="panel">
        <h3>Storage note</h3>
        <p style={{ marginBottom: 0 }}>
          This admin panel currently runs on browser-local storage as a
          working prototype &mdash; data lives on this device/browser only.
          It's built with a clean data layer so it can be swapped for a real
          backend (Supabase) without changing any of these screens.
        </p>
      </div>
    </>
  );
}
