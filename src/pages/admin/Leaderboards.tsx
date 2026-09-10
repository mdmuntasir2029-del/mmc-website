import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { Leaderboard } from "../../lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_DRAFT = { name: "", score: "" };

export default function Leaderboards() {
  const [boards, setBoards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  const [game, setGame] = useState("");
  const [playedOn, setPlayedOn] = useState(todayISO());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Per-board "add entry" form state, keyed by board id.
  const [entryDrafts, setEntryDrafts] = useState<
    Record<string, { name: string; score: string }>
  >({});

  async function load() {
    setLoading(true);
    setBoards(await db.getLeaderboards());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddBoard(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!game.trim() || !playedOn) {
      setError("A game name and a date are required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addLeaderboard({ game: game.trim(), playedOn });
      setGame("");
      load();
    } catch {
      setError("Could not create this leaderboard.");
    } finally {
      setSubmitting(false);
    }
  }

  function setDraft(boardId: string, patch: Partial<{ name: string; score: string }>) {
    setEntryDrafts((d) => ({
      ...d,
      [boardId]: { ...EMPTY_DRAFT, ...d[boardId], ...patch },
    }));
  }

  async function handleAddEntry(boardId: string) {
    const draft = entryDrafts[boardId];
    if (!draft?.name.trim()) return;
    const scoreNum = draft.score.trim() === "" ? null : Number(draft.score);
    await db.addLeaderboardEntry(boardId, {
      playerName: draft.name.trim(),
      score: Number.isFinite(scoreNum as number) ? (scoreNum as number) : null,
    });
    setEntryDrafts((d) => ({ ...d, [boardId]: { name: "", score: "" } }));
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Leaderboards</h2>
          <p>Results from games played during club activities.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>New leaderboard</h3>
        </div>
        {error && <div className="form-msg error">{error}</div>}
        <form onSubmit={handleAddBoard}>
          <div className="form-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Game <span className="required">*</span>
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g. 24 Game, Set, Chess blitz"
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label>
                Played on <span className="required">*</span>
              </label>
              <input
                type="date"
                value={playedOn}
                onChange={(e) => setPlayedOn(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Creating..." : "Create leaderboard"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="panel">
          <p>Loading...</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="panel">
          <div className="empty-state">No leaderboards yet.</div>
        </div>
      ) : (
        boards.map((b) => {
          const draft = entryDrafts[b.id] ?? EMPTY_DRAFT;
          return (
            <div className="panel" key={b.id}>
              <div className="panel-title-row">
                <h3 style={{ margin: 0 }}>
                  {b.game}{" "}
                  <span style={{ fontWeight: 400, opacity: 0.6 }}>
                    &middot;{" "}
                    {new Date(b.playedOn + "T00:00:00").toLocaleDateString()}
                  </span>
                </h3>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    await db.deleteLeaderboard(b.id);
                    load();
                  }}
                >
                  Delete leaderboard
                </button>
              </div>

              {b.entries.length === 0 ? (
                <div className="empty-state">No entries yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>Player</th>
                      <th style={{ width: 100 }}>Score</th>
                      <th style={{ width: 90 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {b.entries.map((e, i) => (
                      <tr key={e.id}>
                        <td>{i + 1}</td>
                        <td>{e.playerName}</td>
                        <td>{e.score ?? "—"}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              await db.deleteLeaderboardEntry(e.id);
                              load();
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Player name"
                  value={draft.name}
                  onChange={(e) => setDraft(b.id, { name: e.target.value })}
                  style={{ flex: "1 1 160px", padding: "9px 12px" }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Score"
                  value={draft.score}
                  onChange={(e) => setDraft(b.id, { score: e.target.value })}
                  style={{ width: 110, padding: "9px 12px" }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddEntry(b.id)}
                >
                  Add entry
                </button>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
