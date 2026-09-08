import { useEffect, useRef, type RefObject } from "react";
import { Icon } from "./Icon";

export function DeleteSlidesDialog({
  slides,
  fallbackFocus,
  onCancel,
  onConfirm,
}: {
  slides: { number: number; title: string }[];
  fallbackFocus: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const panorama = slides.length === 2;

  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const fallback = fallbackFocus.current;
    dialog.showModal();
    cancelButton.current?.focus();
    return () => {
      dialog.close();
      // Deleting the last slide removes its trigger; keep Undo within reach.
      if (opener?.isConnected) opener.focus();
      else if (fallback?.isConnected) fallback.focus();
    };
  }, [fallbackFocus]);

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      className="delete-slides-dialog"
      aria-labelledby="delete-slides-heading"
      aria-describedby="delete-slides-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <header className="dialog-heading">
        <Icon name="trash" size={24} />
        <button
          className="icon-button"
          aria-label="Cancel deletion"
          onClick={onCancel}
        >
          <Icon name="close" />
        </button>
      </header>
      <h2 id="delete-slides-heading">
        {panorama ? "Delete both slides?" : "Delete this slide?"}
      </h2>
      <p className="dialog-copy" id="delete-slides-description">
        {panorama
          ? "These slides are linked in a panorama and will be removed together."
          : "This slide will be removed from your project."}{" "}
        You can undo this change.
      </p>
      <ul className="deletion-slides" aria-label="Slides to delete">
        {slides.map((slide) => (
          <li key={slide.number}>
            <span>{String(slide.number).padStart(2, "0")}</span>
            <strong>{slide.title.trim() || "Untitled slide"}</strong>
          </li>
        ))}
      </ul>
      <div className="deletion-actions">
        <button
          ref={cancelButton}
          className="button secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className="button primary" onClick={onConfirm}>
          {panorama ? "Delete 2 slides" : "Delete slide"}
        </button>
      </div>
    </dialog>
  );
}
