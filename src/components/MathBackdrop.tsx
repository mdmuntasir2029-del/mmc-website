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

const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";

function splitChunks(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

const PI_CHUNKS = splitChunks(PI_DIGITS, 12);

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

      {PI_CHUNKS.map((chunk, i) => (
        <RevealOnScroll
          key={`pi-${i}`}
          className="pi-chunk"
          style={{
            top: `${3 + i * (94 / PI_CHUNKS.length)}%`,
            left: i % 2 === 0 ? "0.5%" : undefined,
            right: i % 2 === 1 ? "0.5%" : undefined,
          }}
        >
          {chunk}
        </RevealOnScroll>
      ))}
    </div>
  );
}
