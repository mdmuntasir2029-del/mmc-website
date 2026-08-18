import RevealOnScroll from "./RevealOnScroll";

interface Equation {
  text: string;
  top: string;
  left?: string;
  right?: string;
  size: string;
  rotate: string;
}

const EQUATIONS: Equation[] = [
  { text: "E = mc²", top: "5%", left: "2%", size: "1.6rem", rotate: "-8deg" },
  { text: "a² + b² = c²", top: "12%", right: "3%", size: "1.3rem", rotate: "6deg" },
  { text: "∫ f(x) dx", top: "20%", left: "1.5%", size: "2rem", rotate: "4deg" },
  { text: "e^{iπ} + 1 = 0", top: "29%", right: "2%", size: "1.4rem", rotate: "-5deg" },
  { text: "Σ nᵢ", top: "37%", left: "2%", size: "1.8rem", rotate: "7deg" },
  { text: "sin²θ + cos²θ = 1", top: "45%", right: "1.5%", size: "1.2rem", rotate: "-4deg" },
  { text: "√2 ≈ 1.41421", top: "53%", left: "2%", size: "1.3rem", rotate: "3deg" },
  { text: "φ = 1.618...", top: "61%", right: "2.5%", size: "1.5rem", rotate: "-6deg" },
  { text: "x = (-b ± √(b²-4ac)) / 2a", top: "69%", left: "1%", size: "1.1rem", rotate: "2deg" },
  { text: "∞", top: "77%", right: "4%", size: "3rem", rotate: "0deg" },
  { text: "d/dx", top: "85%", left: "3%", size: "1.6rem", rotate: "-5deg" },
  { text: "n!", top: "92%", right: "3%", size: "1.8rem", rotate: "5deg" },
];

export default function MathBackdrop() {
  return (
    <div className="math-backdrop" aria-hidden="true">
      {EQUATIONS.map((eq, i) => (
        <RevealOnScroll
          key={`eq-${i}`}
          className="math-eq"
          style={{
            top: eq.top,
            left: eq.left,
            right: eq.right,
            fontSize: eq.size,
            transform: `rotate(${eq.rotate})`,
          }}
        >
          {eq.text}
        </RevealOnScroll>
      ))}
    </div>
  );
}
