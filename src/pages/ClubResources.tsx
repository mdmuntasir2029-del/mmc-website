import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { ResourceCategory, ResourceItem } from "../lib/types";
import SectionUnavailable from "../components/SectionUnavailable";
import { useSiteSections } from "../hooks/useSiteSections";

const CATEGORIES: { key: ResourceCategory; label: string }[] = [
  { key: "presentations", label: "Presentations" },
  { key: "quizzes", label: "Quizzes" },
  { key: "questions", label: "Questions" },
];

export default function ClubResources() {
  const { sections, loaded } = useSiteSections();
  const [items, setItems] = useState<Record<ResourceCategory, ResourceItem[]>>({
    presentations: [],
    quizzes: [],
    questions: [],
  });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [presentations, quizzes, questions] = await Promise.all([
        db.getResources("presentations"),
        db.getResources("quizzes"),
        db.getResources("questions"),
      ]);
      setItems({ presentations, quizzes, questions });
      setLoading(false);
    })();
  }, []);

  async function handleDownload(item: ResourceItem) {
    setDownloadingId(item.id);
    try {
      const url = await db.getFileUrl(item.filePath);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loaded && !sections.resources) {
    return <SectionUnavailable />;
  }

  const isEmpty = !loading && CATEGORIES.every((c) => items[c.key].length === 0);

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <h1>Resources</h1>
          <p>Presentations, quizzes, and question banks shared by the club.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : isEmpty ? (
          <div className="empty-state">No resources uploaded yet &mdash; check back soon.</div>
        ) : (
          CATEGORIES.map(
            (c) =>
              items[c.key].length > 0 && (
                <div className="resource-category-group" key={c.key}>
                  <h2 className="resource-category-title">{c.label}</h2>
                  <div className="resource-list">
                    {items[c.key].map((item) => (
                      <div className="pub-resource-item" key={item.id}>
                        <div>
                          <div className="name">{item.title}</div>
                          <div className="meta">
                            {item.fileName} &middot;{" "}
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={downloadingId === item.id}
                          onClick={() => handleDownload(item)}
                        >
                          {downloadingId === item.id ? "Preparing..." : "Download"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )
        )}
      </div>
    </section>
  );
}
