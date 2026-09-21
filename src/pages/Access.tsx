import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as auth from "../lib/auth";

/**
 * The admin sign-in page — reachable only by direct URL (no visible link
 * anywhere on the public site), never gated by site_sections since
 * admins still need to be able to sign in regardless of what's toggled.
 */
export default function Access() {
  const navigate = useNavigate();

  return (
    <section className="access-wrap">
      <div className="container">
        <div className="access-card">
          <div className="access-body">
            <SignInForm onSuccess={() => navigate("/admin")} />
          </div>
        </div>
      </div>
    </section>
  );
}

type SignInMode = "signin" | "setup" | "forgot";

/**
 * Turns a signUp() failure into a message that actually says what went
 * wrong, instead of always guessing "this account already exists" — a
 * rate-limited default mailer (Supabase's own, before Brevo is wired up)
 * fails the same call and needs a completely different fix.
 */
function describeSetupError(err: unknown): string {
  const status = (err as { status?: number } | null)?.status;
  const code = (err as { code?: string } | null)?.code;
  const message = err instanceof Error ? err.message : String(err);

  if (status === 429 || code === "over_email_send_rate_limit") {
    return "Supabase's email sender is temporarily rate-limited (this isn't about your account). Wait a few minutes and try again, or finish routing email through Brevo (see the README) to fix this for good.";
  }
  if (code === "user_already_exists" || /already registered/i.test(message)) {
    return "This email already has a password set. Try signing in instead, or use \"Forgot your password?\" to reset it.";
  }
  return `Couldn't set up this account: ${message}`;
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<SignInMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function switchMode(next: SignInMode) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setPendingConfirmation(false);
    setResetSent(false);
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.signIn(email.trim(), password);
      const isAdmin = await auth.checkIsAdmin();
      if (!isAdmin) {
        await auth.signOut();
        setError("This account doesn't have admin access.");
        return;
      }
      onSuccess();
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
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
      const allowed = await auth.checkEmailIsAdmin(email.trim());
      if (!allowed) {
        setError(
          "This email hasn't been added as an admin. Ask an existing admin to add it first — no account will be created until then."
        );
        return;
      }

      const signedIn = await auth.claimAccount(email.trim(), password);
      if (!signedIn) {
        // Email confirmation is enabled — there's no session yet until
        // they click the link Supabase just sent.
        setPendingConfirmation(true);
        return;
      }
      const isAdmin = await auth.checkIsAdmin();
      if (!isAdmin) {
        await auth.signOut();
        setError(
          "Account created, but this email doesn't have admin access. Ask an existing admin to add it first."
        );
        return;
      }
      onSuccess();
    } catch (err) {
      setError(describeSetupError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setSubmitting(true);
    try {
      await auth.requestPasswordReset(email.trim());
    } finally {
      // Same message whether or not the account exists — Supabase itself
      // avoids revealing that, and so should this form.
      setResetSent(true);
      setSubmitting(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <>
        <h1>Check Your Email</h1>
        <div className="form-msg success">
          We've sent a confirmation link to {email.trim()}. Click it, then come back and sign in.
        </div>
        <button type="button" className="link-toggle" onClick={() => switchMode("signin")}>
          Back to Sign In
        </button>
      </>
    );
  }

  if (mode === "forgot") {
    return (
      <>
        <h1>Reset Your Password</h1>
        <p className="access-subtitle">Enter your admin email and we'll send you a reset link.</p>

        {error && <div className="form-msg error">{error}</div>}
        {resetSent && (
          <div className="form-msg success">
            If that email has an admin account, a reset link is on its way &mdash; check your inbox.
          </div>
        )}

        {!resetSent && (
          <form onSubmit={handleForgot}>
            <div className="form-field">
              <label>
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <button type="button" className="link-toggle" onClick={() => switchMode("signin")}>
          Back to Sign In
        </button>
      </>
    );
  }

  return (
    <>
      <h1>{mode === "signin" ? "Sign In" : "Set Up Your Admin Account"}</h1>
      <p className="access-subtitle">
        {mode === "signin"
          ? "Admin panel access only — member sign-in is on the way."
          : "For an email that's already been added as an admin but hasn't set a password yet."}
      </p>

      {error && <div className="form-msg error">{error}</div>}

      <form onSubmit={mode === "signin" ? handleSignIn : handleSetup}>
        <div className="form-field">
          <label>
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="form-field">
          <label>
            {mode === "signin" ? "Password" : "Choose a Password"} <span className="required">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {mode === "setup" && (
          <div className="form-field">
            <label>
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting
            ? "Please wait..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account & Sign In"}
        </button>
      </form>

      {mode === "signin" && (
        <button type="button" className="link-toggle" onClick={() => switchMode("forgot")}>
          Forgot your password?
        </button>
      )}
      <button type="button" className="link-toggle" onClick={() => switchMode(mode === "signin" ? "setup" : "signin")}>
        {mode === "signin"
          ? "First time signing in with this email? Set your password"
          : "Already have a password? Sign in instead"}
      </button>
    </>
  );
}
