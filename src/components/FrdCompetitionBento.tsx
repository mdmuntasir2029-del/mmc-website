import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type {
  Leaderboard,
  CompetitionArchiveEntry,
  UpcomingCompetition,
} from "../lib/types";

function useCountdown(targetISODate: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetISODate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetISODate]);

  if (!targetISODate) return null;
  const target = new Date(targetISODate + "T00:00:00").getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function FrdCompetitionBento() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [archive, setArchive] = useState<CompetitionArchiveEntry[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingCompetition[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      db.getLeaderboards(),
      db.getCompetitionArchive(),
      db.getUpcomingCompetitions(),
    ])
      .then(([boards, arch, up]) => {
        setLeaderboard(boards[0] ?? null);
        setArchive(arch);
        setUpcoming(up);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const nextEvent = upcoming[0] ?? null;
  const countdown = useCountdown(nextEvent?.eventDate ?? null);

  async function handleDownload(path: string, id: string) {
    setDownloadingId(id);
    try {
      const url = await db.getFileUrl(path);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!loaded) return null;
  const isEmpty = !leaderboard && archive.length === 0 && !nextEvent;
  if (isEmpty) return null;

  return (
    <section className="frd-bento-section" id="frd-competition-archive">
      <div className="container">
        <span className="frd-eyebrow">Competition Archive &amp; Leaderboard</span>
        <div className="frd-bento-grid">
          {nextEvent && countdown && (
            <div className="frd-bento-card frd-bento-countdown">
              <span className="frd-bento-label">Upcoming</span>
              <h3>{nextEvent.name}</h3>
              <div className="frd-countdown-row">
                <div>
                  <span className="frd-countdown-num">{countdown.days}</span>
                  <span className="frd-countdown-unit">d</span>
                </div>
                <div>
                  <span className="frd-countdown-num">{countdown.hours}</span>
                  <span className="frd-countdown-unit">h</span>
                </div>
                <div>
                  <span className="frd-countdown-num">{countdown.minutes}</span>
                  <span className="frd-countdown-unit">m</span>
                </div>
                <div>
                  <span className="frd-countdown-num">{countdown.seconds}</span>
                  <span className="frd-countdown-unit">s</span>
                </div>
              </div>
            </div>
          )}

          {leaderboard && (
            <div className="frd-bento-card frd-bento-rankings">
              <span className="frd-bento-label">Rankings — {leaderboard.game}</span>
              <ol className="frd-rankings-list">
                {leaderboard.entries.slice(0, 6).map((e, i) => (
                  <li key={e.id}>
                    <span className="frd-rankings-place">{i + 1}</span>
                    <span className="frd-rankings-name">{e.playerName}</span>
                    <span className="frd-rankings-score">{e.score ?? "—"}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {archive.length > 0 && (
            <div className="frd-bento-card frd-bento-archive">
              <span className="frd-bento-label">Contest Archive</span>
              <div className="frd-archive-list">
                {archive.map((a) => (
                  <div className="frd-archive-item" key={a.id}>
                    <div>
                      <div className="frd-archive-name">{a.contestName}</div>
                      <div className="frd-archive-year">{a.contestYear}</div>
                    </div>
                    <div className="frd-archive-actions">
                      <button
                        className="frd-btn frd-btn-outline"
                        disabled={downloadingId === a.id}
                        onClick={() => handleDownload(a.paperPath, a.id)}
                      >
                        Paper
                      </button>
                      {a.solutionPath && (
                        <button
                          className="frd-btn frd-btn-outline"
                          disabled={downloadingId === a.id}
                          onClick={() => handleDownload(a.solutionPath!, a.id)}
                        >
                          Solutions
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
