import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as db from "../../lib/db";

export default function Dashboard() {
  const [counts, setCounts] = useState({
    olympiadRegistrations: 0,
    logEntries: 0,
    resources: 0,
    articles: 0,
    forumPosts: 0,
  });

  useEffect(() => {
    (async () => {
      const [registrations, log, pres, quizzes, questions, articles, posts] = await Promise.all([
        db.getOlympiadRegistrations(),
        db.getActivityLog(),
        db.getResources("presentations"),
        db.getResources("quizzes"),
        db.getResources("questions"),
        db.getArticles(),
        db.getForumPosts(),
      ]);
      setCounts({
        olympiadRegistrations: registrations.length,
        logEntries: log.length,
        resources: pres.length + quizzes.length + questions.length,
        articles: articles.length,
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
        <Link to="/admin/olympiad-registrations" className="stat-card">
          <div className="num">{counts.olympiadRegistrations}</div>
          <div className="label">Olympiad Registrations</div>
        </Link>
        <Link to="/admin/activity-log" className="stat-card">
          <div className="num">{counts.logEntries}</div>
          <div className="label">Activity Log Entries</div>
        </Link>
        <Link to="/admin/resources" className="stat-card">
          <div className="num">{counts.resources}</div>
          <div className="label">Resources Uploaded</div>
        </Link>
        <Link to="/admin/articles" className="stat-card">
          <div className="num">{counts.articles}</div>
          <div className="label">Articles Published</div>
        </Link>
        <Link to="/admin/forum" className="stat-card">
          <div className="num">{counts.forumPosts}</div>
          <div className="label">Forum Posts</div>
        </Link>
      </div>
    </>
  );
}
