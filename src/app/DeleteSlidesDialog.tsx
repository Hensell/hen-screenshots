import { useT } from "../i18n/react";
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
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const panorama = slides.length === 2;

  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const fallback = fallbackFocus.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    cancelButton.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      // Deleting the last slide removes its trigger; keep Undo within reach.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else if (fallback?.isConnected) fallback.focus({ preventScroll: true });
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
          aria-label={t("Cancel deletion")}
          onClick={onCancel}
        >
          <Icon name="close" />
        </button>
      </header>
      <h2 id="delete-slides-heading">
        {panorama ? t("Delete both slides?") : t("Delete this slide?")}
      </h2>
      <p className="dialog-copy" id="delete-slides-description">
        {panorama
          ? t(
              "These slides are linked in a panorama and will be removed together.",
            )
          : t("This slide will be removed from your project.")}{" "}
        {t("You can undo this change.")}
      </p>
      <ul className="deletion-slides" aria-label={t("Slides to delete")}>
        {slides.map((slide) => (
          <li key={slide.number}>
            <span>{String(slide.number).padStart(2, "0")}</span>
            <strong>{slide.title.trim() || t("Untitled slide")}</strong>
          </li>
        ))}
      </ul>
      <div className="deletion-actions">
        <button
          ref={cancelButton}
          className="button secondary"
          onClick={onCancel}
        >
          {t("Cancel")}
        </button>
        <button className="button primary" onClick={onConfirm}>
          {panorama ? t("Delete 2 slides") : t("Delete slide")}
        </button>
      </div>
    </dialog>
  );
}
