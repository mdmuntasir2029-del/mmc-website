import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import * as auth from "../lib/auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase processes the recovery link's token before this component
    // mounts, so also check for an already-active session as a fallback
    // in case the PASSWORD_RECOVERY event fired before we subscribed.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.updatePassword(password);
      setSuccess(true);
    } catch {
      setError("Could not update your password — the reset link may have expired. Request a new one from the sign-in page.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="access-wrap">
      <div className="container">
        <div className="access-card">
          <div className="access-body">
            <h2>Reset Your Password</h2>

            {success ? (
              <>
                <div className="form-msg success">Your password has been updated.</div>
                <button className="btn btn-primary" onClick={() => navigate("/admin")} style={{ width: "100%" }}>
                  Continue to Admin Panel
                </button>
              </>
            ) : !ready ? (
              <p className="access-subtitle">
                Open this page from the link in your password reset email. If you got here another way,
                go to <Link to="/signin">Sign In</Link> and use "Forgot your password?" first.
              </p>
            ) : (
              <>
                <p className="access-subtitle">Choose a new password below.</p>
                {error && <div className="form-msg error">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label>
                      New Password <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="form-field">
                    <label>
                      Confirm New Password <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                    {submitting ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
