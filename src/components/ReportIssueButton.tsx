import { useState } from "react";
import type { FormEvent } from "react";
import * as db from "../lib/db";
import { validateEmail } from "../lib/validation";
import { IconClose } from "./icons";

/**
 * Sitewide floating entry point for bug reports / suggestions — visible
 * on every page (mounted once in App.tsx), public and admin. Submissions
 * go straight to the super admin's Issue Reports page, no one else's.
 */
export default function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"bug" | "suggestion">("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setKind("bug");
    setMessage("");
    setEmail("");
    setStatus("idle");
    setError("");
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Please describe the issue or suggestion.");
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    try {
      await db.addIssueReport({
        kind,
        message: message.trim(),
        reporterEmail: email.trim() || null,
      });
      setStatus("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="report-issue-fab"
        onClick={() => setOpen(true)}
      >
        Report an issue
      </button>

      {open && (
        <div className="report-issue-backdrop" onClick={handleClose}>
          <div
            className="report-issue-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Report an issue or suggest an improvement"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="award-modal-close"
              aria-label="Close"
              onClick={handleClose}
            >
              <IconClose />
            </button>

            {status === "success" ? (
              <>
                <h2>Thanks!</h2>
                <p className="access-subtitle">
                  Your {kind === "bug" ? "bug report" : "suggestion"} has been
                  sent.
                </p>
              </>
            ) : (
              <>
                <h2>Report an Issue</h2>
                <p className="access-subtitle">
                  Found a bug, or have an idea to improve the site?
                </p>

                {error && <div className="form-msg error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <div className="report-issue-kind-toggle" role="group" aria-label="Report type">
                      <button
                        type="button"
                        className={kind === "bug" ? "is-active" : ""}
                        onClick={() => setKind("bug")}
                      >
                        Bug
                      </button>
                      <button
                        type="button"
                        className={kind === "suggestion" ? "is-active" : ""}
                        onClick={() => setKind("suggestion")}
                      >
                        Suggestion
                      </button>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>
                      Description <span className="required">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        kind === "bug"
                          ? "What went wrong, and where?"
                          : "What would you like to see improved?"
                      }
                      rows={4}
                    />
                  </div>

                  <div className="form-field">
                    <label>Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={submitting}
                    style={{ width: "100%" }}
                  >
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
