import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { Article } from "../lib/types";

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setArticles(await db.getArticles());
      setLoading(false);
    })();
  }, []);

  async function handleDownload(article: Article) {
    if (!article.filePath) return;
    setDownloadingId(article.id);
    try {
      const url = await db.getFileUrl(article.filePath);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="articles-page">
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <h2>Research Articles</h2>
            <p>Write-ups and research from the club, published by the admin.</p>
          </div>

          {loading ? (
            <p style={{ textAlign: "center" }}>Loading...</p>
          ) : articles.length === 0 ? (
            <div className="empty-state">No articles published yet &mdash; check back soon.</div>
          ) : (
            <div className="article-list">
              {articles.map((a) => (
                <article className="article-card" key={a.id}>
                  <div className="article-card-head">
                    <h3>{a.title}</h3>
                    <span className="article-meta">
                      {a.author} &middot;{" "}
                      {new Date(a.publishedDate + "T00:00:00").toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="article-abstract">{a.abstract}</p>
                  <div className="row">
                    {a.filePath && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={downloadingId === a.id}
                        onClick={() => handleDownload(a)}
                      >
                        {downloadingId === a.id ? "Preparing..." : `Download ${a.fileName ?? "attachment"}`}
                      </button>
                    )}
                    {a.link && (
                      <a
                        className="btn btn-secondary btn-sm"
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit Link
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
