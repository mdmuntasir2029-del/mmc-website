import { useEffect, useState } from "react";
import * as db from "../lib/db";
import type { Testimonial } from "../lib/types";

export default function TestimonialsPanel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.getTestimonials()
      .then(setTestimonials)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && testimonials.length === 0) return null;

  return (
    <section className="section section-testimonials">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">In their own words</span>
          <h2>What People Say About the Club</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((t) => (
            <blockquote className="testimonial-card" key={t.id}>
              <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <span className="testimonial-name">{t.personName}</span>
                <span className="testimonial-role">{t.personRole}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
