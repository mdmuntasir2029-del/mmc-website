import { useEffect } from "react";
import type { Award } from "../lib/types";
import { autoInitials } from "../lib/awardInitials";
import { IconClose } from "./icons";

export default function AwardDetailModal({
  award,
  onClose,
}: {
  award: Award;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="award-modal-backdrop" onClick={onClose}>
      <div
        className="award-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${award.name} — ${award.achievement}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="award-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <IconClose />
        </button>

        {award.imageUrl ? (
          <img
            className="award-modal-image"
            src={award.imageUrl}
            srcSet={award.imageSrcSet ?? undefined}
            sizes="(max-width: 700px) 90vw, 420px"
            alt={award.name}
          />
        ) : (
          <div className="award-modal-avatar">
            {award.initials || autoInitials(award.name)}
          </div>
        )}

        <h2>{award.name}</h2>
        <p className="award-modal-achievement">{award.achievement}</p>
      </div>
    </div>
  );
}
