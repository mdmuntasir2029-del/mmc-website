import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../lib/db";
import type { Announcement, AnnouncementComment } from "../lib/types";
import { markAnnouncementRead } from "../lib/announcementReadTracking";
import { IconClose } from "./icons";

const LIKED_KEY = "mmc_liked_announcements";

function readLiked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function rememberLiked(id: string) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...readLiked(), id]));
  } catch {
    // Private browsing / storage disabled — the like still goes through
    // server-side, it just won't be remembered as "already liked" here.
  }
}

/**
 * The announcement detail popup — image left, description right, like
 * a social-media post — with a thumbs-up reaction and an open comments
 * section. No visitor-account system on this site, so likes are a
 * plain counter (soft-debounced per browser via localStorage, not a
 * hard per-user limit) and comments just take a display name.
 */
export default function AnnouncementDetailModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  const [likes, setLikes] = useState(announcement.likesCount);
  const [alreadyLiked, setAlreadyLiked] = useState(() =>
    readLiked().includes(announcement.id)
  );

  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    markAnnouncementRead(announcement.id);
  }, [announcement.id]);

  useEffect(() => {
    db.getAnnouncementComments(announcement.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setCommentsLoaded(true));
  }, [announcement.id]);

  async function handleLike() {
    if (alreadyLiked) return;
    setAlreadyLiked(true);
    rememberLiked(announcement.id);
    setLikes((n) => n + 1);
    try {
      await db.likeAnnouncement(announcement.id);
    } catch {
      // Non-critical — the optimistic UI already reflects the like.
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await db.addAnnouncementComment(announcement.id, {
        authorName: authorName.trim(),
        message: message.trim(),
      });
      setMessage("");
      const updated = await db.getAnnouncementComments(announcement.id);
      setComments(updated);
    } catch {
      // Non-critical for this small feature — the form just stays filled.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="announcement-modal-backdrop" onClick={onClose}>
      <div
        className="announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-label={announcement.caption ?? "Announcement"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="award-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <IconClose />
        </button>

        <div className="announcement-modal-body">
          <div className="announcement-modal-image-col">
            <img
              src={announcement.imageUrl}
              srcSet={announcement.imageSrcSet}
              alt={announcement.caption ?? "Announcement"}
            />
          </div>
          <div className="announcement-modal-text-col">
            {announcement.caption && <h2>{announcement.caption}</h2>}
            {announcement.description && (
              <p className="announcement-modal-desc">{announcement.description}</p>
            )}
            {announcement.embedUrl && (
              <a
                href={announcement.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Learn more &rarr;
              </a>
            )}

            <div className="announcement-modal-actions">
              <button
                type="button"
                className={`announcement-like-btn${alreadyLiked ? " is-active" : ""}`}
                onClick={handleLike}
                disabled={alreadyLiked}
              >
                &#128077; {likes}
              </button>
            </div>

            <div className="announcement-comments">
              <h3>Comments</h3>
              {!commentsLoaded ? (
                <p className="empty-state">Loading...</p>
              ) : comments.length === 0 ? (
                <p className="empty-state">No comments yet — be the first.</p>
              ) : (
                <ul className="announcement-comment-list">
                  {comments.map((c) => (
                    <li key={c.id}>
                      <span className="announcement-comment-author">{c.authorName}</span>
                      <p>{c.message}</p>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddComment} className="announcement-comment-form">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                  {submitting ? "Posting..." : "Post comment"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
