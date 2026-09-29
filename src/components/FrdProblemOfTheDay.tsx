import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import * as db from "../lib/db";
import type { ProblemOfTheDay } from "../lib/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders mixed prose + inline math (admin writes math wrapped in
 * $...$, e.g. "Prove that $\sqrt{2}$ is irrational.") — passing the
 * whole string straight to katex.renderToString would treat every
 * character as math mode, which collapses ordinary word spacing since
 * math typesetting doesn't preserve literal whitespace the way text
 * does. Splitting on $...$ and only handing the math segments to KaTeX
 * keeps the surrounding prose as plain, normally-spaced text.
 */
function renderLatex(text: string): { __html: string } {
  const parts = text.split(/\$([^$]+)\$/g);
  const html = parts
    .map((part, i) => {
      // Odd indices are the captured $...$ groups.
      if (i % 2 === 1) {
        try {
          return katex.renderToString(part, { throwOnError: false, displayMode: false });
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join("");
  return { __html: html };
}

/**
 * "Problem of the Day Terminal" — Core Page Architecture §2 of the
 * brief: a KaTeX-rendered challenge, a hints accordion (one hint at a
 * time), and a live answer-check box that reveals the stored
 * step-by-step solution once solved (or once every hint is spent).
 */
export default function FrdProblemOfTheDay() {
  const [problem, setProblem] = useState<ProblemOfTheDay | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [hintsShown, setHintsShown] = useState(0);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [solutionShown, setSolutionShown] = useState(false);

  useEffect(() => {
    db.getLatestProblemOfTheDay()
      .then(setProblem)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const problemHtml = useMemo(
    () => (problem ? renderLatex(problem.latexProblem) : null),
    [problem]
  );
  const solutionHtml = useMemo(
    () => (problem ? renderLatex(problem.solutionText) : null),
    [problem]
  );

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!problem) return;
    const correct =
      guess.trim().toLowerCase() === problem.answerText.trim().toLowerCase();
    setStatus(correct ? "correct" : "incorrect");
    if (correct) setSolutionShown(true);
  }

  function revealNextHint() {
    if (!problem) return;
    setHintsShown((n) => {
      const next = Math.min(n + 1, problem.hints.length);
      if (next >= problem.hints.length) setSolutionShown(true);
      return next;
    });
  }

  if (!loaded || !problem) return null;

  return (
    <section className="frd-potd" id="frd-problem-of-the-day">
      <div className="container">
        <div className="frd-potd-frame">
          <div className="frd-potd-head">
            <span className="frd-eyebrow">Problem of the Day</span>
            <span className="frd-potd-date">{problem.problemDate}</span>
          </div>

          <div
            className="frd-potd-statement"
            dangerouslySetInnerHTML={problemHtml ?? undefined}
          />

          {problem.hints.length > 0 && (
            <div className="frd-potd-hints">
              {problem.hints.slice(0, hintsShown).map((hint, i) => (
                <p className="frd-potd-hint" key={i}>
                  <span className="frd-sidenote-mark">hint {i + 1} —</span>{" "}
                  <span dangerouslySetInnerHTML={renderLatex(hint)} />
                </p>
              ))}
              {hintsShown < problem.hints.length && (
                <button
                  type="button"
                  className="frd-btn frd-btn-outline frd-potd-hint-btn"
                  onClick={revealNextHint}
                >
                  Reveal a hint ({hintsShown}/{problem.hints.length})
                </button>
              )}
            </div>
          )}

          <form className="frd-potd-check" onSubmit={handleCheck}>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Your answer"
              className="frd-potd-input"
            />
            <button type="submit" className="frd-btn frd-btn-emerald">
              Check
            </button>
          </form>

          {status === "correct" && (
            <p className="frd-potd-status frd-potd-status--correct">
              Correct — see the full solution below.
            </p>
          )}
          {status === "incorrect" && (
            <p className="frd-potd-status frd-potd-status--incorrect">
              Not quite. Try a hint, or keep going.
            </p>
          )}

          {solutionShown && (
            <div className="frd-potd-solution">
              <span className="frd-potd-solution-label">Solution</span>
              <div dangerouslySetInnerHTML={solutionHtml ?? undefined} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
