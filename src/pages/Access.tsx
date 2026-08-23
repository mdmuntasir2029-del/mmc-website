import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as db from "../lib/db";
import * as auth from "../lib/auth";
import {
  STUDENT_CODE_MAX_YEAR,
  validateEmail,
  validatePhone,
  validateStudentCode,
} from "../lib/validation";

type Tab = "register" | "signin";

export default function Access() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTab: Tab = location.pathname === "/signin" ? "signin" : "register";
  const [tab, setTab] = useState<Tab>(initialTab);

  function switchTab(next: Tab) {
    setTab(next);
    navigate(next === "signin" ? "/signin" : "/register", { replace: true });
  }

  return (
    <section className="access-wrap">
      <div className="container">
        <div className="access-card">
          <div className="access-tabs">
            <button
              className={`access-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => switchTab("register")}
            >
              Register
            </button>
            <button
              className={`access-tab ${tab === "signin" ? "active" : ""}`}
              onClick={() => switchTab("signin")}
            >
              Sign In
            </button>
          </div>

          <div className="access-body">
            {tab === "register" ? (
              <RegisterForm />
            ) : (
              <SignInForm onSuccess={() => navigate("/admin")} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [roll, setRoll] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("idle");

    if (!name.trim() || !className.trim() || !section.trim() || !roll.trim() || !studentCode.trim()) {
      setError("All required fields must be filled in.");
      setStatus("error");
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      setStatus("error");
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setStatus("error");
      return;
    }

    const codeError = validateStudentCode(studentCode);
    if (codeError) {
      setError(codeError);
      setStatus("error");
      return;
    }

    if (!declared) {
      setError('You must confirm the declaration checkbox before submitting.');
      setStatus("error");
      return;
    }

    setSubmitting(true);
    try {
      await db.addMember({
        name: name.trim(),
        className: className.trim(),
        section: section.trim(),
        roll: roll.trim(),
        studentCode: studentCode.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
      });
      setStatus("success");
      setName("");
      setClassName("");
      setSection("");
      setRoll("");
      setStudentCode("");
      setPhone("");
      setEmail("");
      setDeclared(false);
    } catch (err) {
      setError(
        err instanceof db.DuplicateMemberError
          ? err.message
          : "Something went wrong. Please try again."
      );
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2>Member Registration</h2>
      <p className="access-subtitle">
        Session 2026&ndash;2027 &mdash; fields marked * are required.
      </p>

      {status === "success" && (
        <div className="form-msg success">
          You're registered! Welcome to Manarat Mathletes Club.
        </div>
      )}
      {status === "error" && <div className="form-msg error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>
              Class <span className="required">*</span>
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. 9"
            />
          </div>
          <div className="form-field">
            <label>
              Section <span className="required">*</span>
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. A"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>
              Roll <span className="required">*</span>
            </label>
            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="Roll number"
            />
          </div>
          <div className="form-field">
            <label>
              Student Code <span className="required">*</span>
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="e.g. 202600123"
              maxLength={9}
            />
          </div>
        </div>
        <p className="form-hint">
          9 digits total &mdash; first 4 are a year up to {STUDENT_CODE_MAX_YEAR}, followed by your 5-digit sequence.
        </p>

        <div className="form-row">
          <div className="form-field">
            <label>
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01XXXXXXXXX"
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
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
            />
            <span>
              I declare all information hereby are accurate and absolute
              <span className="required"> *</span>
            </span>
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </>
  );
}

type SignInMode = "signin" | "setup" | "forgot";

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
    } catch {
      setError(
        "Couldn't set up this account — it may already have a password. Try signing in instead, or ask another admin to reset it."
      );
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
        <h2>Check Your Email</h2>
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
        <h2>Reset Your Password</h2>
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
      <h2>{mode === "signin" ? "Sign In" : "Set Up Your Admin Account"}</h2>
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
