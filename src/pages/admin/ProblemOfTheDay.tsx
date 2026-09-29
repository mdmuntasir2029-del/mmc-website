import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { ProblemOfTheDay } from "../../lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminProblemOfTheDay() {
  const [problems, setProblems] = useState<ProblemOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [problemDate, setProblemDate] = useState(todayISO());
  const [latexProblem, setLatexProblem] = useState("");
  const [hintsText, setHintsText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setProblems(await db.getProblemsOfTheDay());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!latexProblem.trim() || !answerText.trim() || !solutionText.trim()) {
      setError("A problem, an answer, and a solution are all required.");
      return;
    }
    setSubmitting(true);
    try {
      await db.addProblemOfTheDay({
        problemDate,
        latexProblem: latexProblem.trim(),
        hints: hintsText
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean),
        answerText: answerText.trim(),
        solutionText: solutionText.trim(),
      });
      setLatexProblem("");
      setHintsText("");
      setAnswerText("");
      setSolutionText("");
      load();
    } catch {
      setError("Could not save this problem (is the date already used?).");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteProblemOfTheDay(id);
    load();
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Problem of the Day (FRD mode)</h2>
          <p>
            The most recently dated entry is shown as "today's" problem in
            the FRD preview's terminal. Wrap math in single dollar signs
            (e.g. "Prove that $\sqrt{2}$ is irrational.") — everything
            outside $...$ renders as plain text, everything inside
            renders with KaTeX.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Add a problem</h3>
        </div>
        {error && <div className="form-msg error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-field">
            <label>
              Date <span className="required">*</span>
            </label>
            <input
              type="date"
              value={problemDate}
              onChange={(e) => setProblemDate(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>
              Problem <span className="required">*</span>
            </label>
            <textarea
              value={latexProblem}
              onChange={(e) => setLatexProblem(e.target.value)}
              placeholder="e.g. Prove that $\sqrt{2}$ is irrational."
              rows={3}
            />
          </div>
          <div className="form-field">
            <label>Hints (one per line, revealed one at a time)</label>
            <textarea
              value={hintsText}
              onChange={(e) => setHintsText(e.target.value)}
              placeholder={"Assume the opposite is true.\nWrite $\\sqrt{2} = a/b$ in lowest terms."}
              rows={3}
            />
          </div>
          <div className="form-field">
            <label>
              Answer (plain text, checked against the visitor's input)
              <span className="required"> *</span>
            </label>
            <input
              type="text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="e.g. irrational"
            />
          </div>
          <div className="form-field">
            <label>
              Step-by-step solution <span className="required">*</span>
            </label>
            <textarea
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              placeholder="Revealed once the visitor answers correctly (or runs out of hints). Wrap math in $...$ here too."
              rows={4}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: 14 }}
          >
            {submitting ? "Adding..." : "Add problem"}
          </button>
        </form>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading...</p>
        ) : problems.length === 0 ? (
          <div className="empty-state">No problems added yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 110 }}>Date</th>
                <th>Problem</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id}>
                  <td>{p.problemDate}</td>
                  <td>{p.latexProblem}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
