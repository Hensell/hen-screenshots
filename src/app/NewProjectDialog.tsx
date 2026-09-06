import { useEffect, useRef } from "react";
import type { ProjectPurpose } from "../core/canvas-formats";
import { Icon } from "./Icon";

export function NewProjectDialog({
  onCreate,
  onClose,
}: {
  onCreate: (purpose: ProjectPurpose) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="new-project-dialog"
      aria-labelledby="new-project-heading"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="dialog-heading">
        <p className="eyebrow">A SPACE FOR YOUR NEXT PROJECT</p>
        <button
          className="icon-button"
          aria-label="Close new project"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <h2 id="new-project-heading">Where will your work live?</h2>
      <p className="dialog-copy">
        Choose a workspace. Each one has its own canvas formats.
      </p>
      <div className="purpose-options">
        <button onClick={() => onCreate("stores")}>
          <div className="purpose-art purpose-art-stores" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <strong>
            App stores <Icon name="arrow" />
          </strong>
          <p>Tell your app’s story on the App Store and Google Play.</p>
          <small>Store sizes · Phones, tablets & desktop</small>
        </button>
        <button onClick={() => onCreate("portfolio")}>
          <div className="purpose-art purpose-art-portfolio" aria-hidden="true">
            <span />
            <span />
          </div>
          <strong>
            Portfolio <Icon name="arrow" />
          </strong>
          <p>Present your work in case studies, websites and social posts.</p>
          <small>Cards, square & wide · Custom sizes</small>
        </button>
      </div>
    </dialog>
  );
}
