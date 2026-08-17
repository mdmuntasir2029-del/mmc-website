import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { ForumPost } from "../../lib/types";

export default function Forum() {
  const { email } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setPosts(await db.getForumPosts());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await db.addForumPost({ author: email ?? "Admin", message: message.trim() });
      setMessage("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteForumPost(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Executive Committee Forum</h2>
          <p>A private space for exec committee members to communicate.</p>
        </div>
      </div>

      <div className="panel">
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginBottom: "18px" }}>
          Only the admin account exists right now. Once member accounts go
          live, every exec committee member will be able to post here under
          their own name.
        </p>

        <form onSubmit={handlePost}>
          <div className="form-field">
            <textarea
              rows={3}
              placeholder="Share an update with the committee..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting || !message.trim()}>
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <div className="empty-state">No messages yet. Start the conversation.</div>
        ) : (
          [...posts].reverse().map((post) => (
            <div className="forum-post" key={post.id}>
              <div className="forum-post-head">
                <span className="author">{post.author}</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0 }}>{post.message}</p>
              <button
                className="btn btn-danger btn-sm"
                style={{ marginTop: "10px" }}
                onClick={() => handleDelete(post.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
