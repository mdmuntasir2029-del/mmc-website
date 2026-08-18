import { useEffect, useState } from "react";

const PI_DIGITS =
  "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";

const MAX_VISIBLE_DIGITS = 40;

export default function PiCounter() {
  const [digitCount, setDigitCount] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
      setDigitCount(Math.floor(progress * MAX_VISIBLE_DIGITS));
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="pi-counter" aria-hidden="true">
      <span className="pi-symbol">π</span>
      {digitCount > 0 && <span className="pi-value"> = {PI_DIGITS.slice(0, digitCount)}</span>}
    </div>
  );
}
