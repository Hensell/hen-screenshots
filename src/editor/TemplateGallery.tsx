import { useEffect, useRef, useState } from "react";
import type { Project, Shot, TemplateId } from "../core/model";
import { resolveStyle } from "../core/model";
import { getTemplate, templates, templatePreview } from "../core/templates";
import { Preview } from "./Preview";
import { Icon } from "../app/Icon";

export function TemplateGallery({
  project,
  shot,
  image,
  onClose,
  onApply,
}: {
  project: Project;
  shot: Shot;
  image?: HTMLImageElement;
  onClose: () => void;
  onApply: (id: TemplateId, all: boolean, keepColors: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<TemplateId>(
    resolveStyle(project, shot).template,
  );
  const [all, setAll] = useState(false);
  const [keepColors, setKeepColors] = useState(false);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="template-dialog"
      aria-labelledby="template-heading"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="template-header">
        <div>
          <p className="eyebrow">A NEW POINT OF VIEW</p>
          <h2 id="template-heading">Find your app’s look.</h2>
          <p>Four compositions. Your screenshots, already in the picture.</p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close templates"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div
        className="template-gallery"
        role="group"
        aria-label="Screenshot templates"
      >
        {templates.map((template) => (
          <button
            type="button"
            key={template.id}
            className="template-card"
            aria-pressed={selected === template.id}
            onClick={() => setSelected(template.id)}
            aria-label={`${template.name} template`}
          >
            <div className="template-art">
              <Preview
                project={project}
                shot={templatePreview(project, shot, template.id, keepColors)}
                image={image}
                small
              />
            </div>
            <span className="template-card-label">
              <strong>{template.name}</strong>
              <span className="template-check">
                {selected === template.id && <Icon name="check" size={14} />}
              </span>
            </span>
            <span className="template-description">{template.description}</span>
          </button>
        ))}
      </div>
      <footer className="template-footer">
        <div className="template-settings">
          <p className="template-note">{getTemplate(selected).note}</p>
          <label className="check-field">
            <input
              type="checkbox"
              checked={keepColors}
              onChange={(event) => setKeepColors(event.target.checked)}
            />
            Keep my colors
          </label>
          <p className="field-help">
            Layout resets. Words, images and device family stay. Undo anytime.
          </p>
        </div>
        <div className="template-apply">
          <div
            className="segmented"
            role="group"
            aria-label="Apply template to"
          >
            <button
              type="button"
              aria-pressed={!all}
              onClick={() => setAll(false)}
            >
              This screenshot
            </button>
            <button
              type="button"
              aria-pressed={all}
              onClick={() => setAll(true)}
            >
              Whole series ({project.shots.length})
            </button>
          </div>
          <button
            type="button"
            className="button primary"
            disabled={!image}
            onClick={() => onApply(selected, all, keepColors)}
          >
            Apply {getTemplate(selected).name}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
