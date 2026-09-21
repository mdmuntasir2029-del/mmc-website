import { useState } from "react";
import type { FormEvent } from "react";
import * as db from "../lib/db";
import { validateEmail, validatePhone } from "../lib/validation";

/**
 * Intra Math Olympiad registration — deliberately not linked from
 * anywhere in the UI (no nav/footer/hero entry point), reachable only
 * by whoever is given this exact URL. Stores to its own
 * olympiad_registrations table, independent of the (removed) general
 * member registration system.
 */
export default function OlympiadRegister() {
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("idle");

    if (!fullName.trim() || !school.trim() || !className.trim() || !gender.trim()) {
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

    setSubmitting(true);
    try {
      await db.addOlympiadRegistration({
        fullName: fullName.trim(),
        school: school.trim(),
        className: className.trim(),
        gender: gender.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
      });
      setStatus("success");
      setFullName("");
      setSchool("");
      setClassName("");
      setGender("");
      setPhone("");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <section className="olympiad-register">
        <div className="container olympiad-register-inner">
          <span className="olympiad-register-step">01</span>
          <h1>You're registered.</h1>
          <p className="olympiad-register-subtitle">
            Thanks for signing up for the Intra Math Olympiad &mdash;
            we'll be in touch with next steps.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="olympiad-register">
      <div className="container olympiad-register-inner">
        <span className="olympiad-register-step">01</span>
        <h1>Who is registering</h1>
        <p className="olympiad-register-subtitle">
          Intra Math Olympiad &mdash; fields marked * are required.
        </p>

        {status === "error" && <div className="form-msg error">{error}</div>}

        <form onSubmit={handleSubmit} className="olympiad-register-form">
          <div className="olympiad-field">
            <label>
              Full name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <p className="olympiad-field-hint">As it should appear on a certificate.</p>
          </div>

          <div className="olympiad-field">
            <label>
              School / college <span className="required">*</span>
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Manarat Dhaka International School & College"
            />
            <p className="olympiad-field-hint">Your current institution.</p>
          </div>

          <div className="olympiad-field">
            <label>
              Class <span className="required">*</span>
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. 9"
            />
            <p className="olympiad-field-hint">The class you're currently in.</p>
          </div>

          <div className="olympiad-field">
            <label>
              Gender <span className="required">*</span>
            </label>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g. Male"
            />
            <p className="olympiad-field-hint">Used for seating/event logistics only.</p>
          </div>

          <div className="olympiad-field">
            <label>
              Phone number <span className="required">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01XXXXXXXXX"
            />
            <p className="olympiad-field-hint">We'll reach you here about the event.</p>
          </div>

          <div className="olympiad-field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <p className="olympiad-field-hint">Optional, for written updates.</p>
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </section>
  );
}
