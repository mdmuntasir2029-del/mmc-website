import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { Leaderboard } from "../lib/types";

export default function LeaderboardSection() {
  const [boards, setBoards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getLeaderboards()
      .then(setBoards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section section-leaderboard" id="leaderboard">
      <div className="container">
        <div className="lineup-head">
          <div>
            <span className="eyebrow">Club games</span>
            <h2>Leaderboard</h2>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-on-dark-soft)" }}>
            Loading...
          </p>
        ) : boards.length === 0 ? (
          <div className="empty-state" style={{ color: "var(--text-on-dark-soft)" }}>
            No game results posted yet &mdash; check back after the next session.
          </div>
        ) : (
          <div className="leaderboard-grid">
            {boards.map((b) => (
              <div className="leaderboard-card" key={b.id}>
                <div className="leaderboard-card-head">
                  <h3>{b.game}</h3>
                  <span>
                    {new Date(b.playedOn + "T00:00:00").toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
                {b.entries.length === 0 ? (
                  <p className="leaderboard-empty">Results coming soon.</p>
                ) : (
                  <ol className="leaderboard-list">
                    {b.entries.map((e, i) => (
                      <li key={e.id} data-rank={i + 1}>
                        <span className="rank">{i + 1}</span>
                        <span className="who">{e.playerName}</span>
                        {e.score != null && (
                          <span className="score">{e.score}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
