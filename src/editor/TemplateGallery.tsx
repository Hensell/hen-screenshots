import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Project, Shot, TemplateId } from "../core/model";
import { canonicalCanvas } from "../core/export-profiles";
import { resolveStyle } from "../core/model";
import {
  filterTemplates,
  getTemplate,
  templates,
  templateCategories,
  templatePreview,
  type Template,
  type TemplateCategory,
} from "../core/templates";
import { Preview } from "./Preview";
import { Icon } from "../app/Icon";

const TemplateCard = memo(function TemplateCard({
  template,
  project,
  shots,
  images,
  keepColors,
  selected,
  onSelect,
  series,
}: {
  template: Template;
  project: Project;
  shots: Shot[];
  images: Map<string, HTMLImageElement>;
  keepColors: boolean;
  selected: boolean;
  onSelect: (id: TemplateId) => void;
  series: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "180px" },
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  const previews = useMemo(
    () =>
      shots.map((shot) =>
        templatePreview(project, shot, template.id, keepColors),
      ),
    [project, shots, template.id, keepColors],
  );
  return (
    <button
      ref={ref}
      type="button"
      className="template-card"
      aria-pressed={selected}
      onClick={() => onSelect(template.id)}
      aria-label={`${template.name} template`}
    >
      <div className={`template-art ${series ? "template-art-series" : ""}`}>
        {previews.map((preview) => (
          <div className="template-preview-slot" key={preview.id}>
            {visible ? (
              <Preview
                project={project}
                shot={preview}
                image={images.get(preview.assetId)}
                small
              />
            ) : (
              <div
                className="template-preview-placeholder"
                style={{
                  aspectRatio: `1080 / ${canonicalCanvas(project).height}`,
                  background: resolveStyle(project, preview).background,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <span className="template-card-label">
        <strong>{template.name}</strong>
        <span className="template-category">{template.category}</span>
        <span className="template-check">
          {selected && <Icon name="check" size={14} />}
        </span>
      </span>
      <span className="template-description">{template.description}</span>
    </button>
  );
});

export function TemplateGallery({
  project,
  shot,
  images,
  onClose,
  onApply,
}: {
  project: Project;
  shot: Shot;
  images: Map<string, HTMLImageElement>;
  onClose: () => void;
  onApply: (id: TemplateId, all: boolean, keepColors: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<TemplateId>(
    resolveStyle(project, shot).template,
  );
  const [all, setAll] = useState(false);
  const [keepColors, setKeepColors] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("All");
  const [page, setPage] = useState(
    Math.floor(
      Math.max(
        0,
        project.shots.findIndex((item) => item.id === shot.id),
      ) / 3,
    ),
  );
  const matches = filterTemplates(query, category);
  const selectionVisible = matches.some((item) => item.id === selected);
  const start = page * 3;
  const shownShots = useMemo(
    () => (all ? project.shots.slice(start, start + 3) : [shot]),
    [all, project.shots, shot, start],
  );
  const ready = (all ? project.shots : [shot]).every((item) =>
    images.has(item.assetId),
  );
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
      className={`template-dialog ${canonicalCanvas(project).height <= 1080 ? "template-dialog-wide" : ""} ${all ? "template-dialog-series" : ""}`}
      style={
        {
          "--template-ratio": 1080 / canonicalCanvas(project).height,
        } as CSSProperties
      }
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
          <p>
            {templates.length} compositions. Your screenshots. Every frame and
            format.
          </p>
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
      <div className="template-browse-controls">
        <label className="template-search field">
          Find a template
          <input
            type="search"
            placeholder="Search by name or style"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="template-scope">
          <span>Preview & apply to</span>
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
        </div>
      </div>
      <div
        className="template-filters"
        role="group"
        aria-label="Template style"
      >
        {templateCategories.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
            <span>{filterTemplates("", item).length}</span>
          </button>
        ))}
      </div>
      <div className="template-results-bar">
        <p role="status">
          {matches.length} {matches.length === 1 ? "template" : "templates"}
        </p>
        {all && (
          <div
            className="template-series-navigation"
            role="group"
            aria-label="Series preview pages"
          >
            <button
              type="button"
              className="icon-button"
              aria-label="Previous preview screenshots"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <Icon name="left" size={16} />
            </button>
            <span aria-live="polite">
              {start + 1}–{Math.min(start + 3, project.shots.length)} of{" "}
              {project.shots.length}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next preview screenshots"
              disabled={start + 3 >= project.shots.length}
              onClick={() => setPage(page + 1)}
            >
              <Icon name="right" size={16} />
            </button>
          </div>
        )}
      </div>
      <div
        className="template-gallery"
        role="group"
        aria-label="Screenshot templates"
      >
        {matches.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            project={project}
            shots={shownShots}
            images={images}
            keepColors={keepColors}
            selected={selected === template.id}
            onSelect={setSelected}
            series={all}
          />
        ))}
        {matches.length === 0 && (
          <div className="template-empty">
            <h3>No matching templates.</h3>
            <p>Try a different name or explore all styles.</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <footer className="template-footer">
        <div className="template-settings">
          <p className="template-note">
            {selectionVisible
              ? `${getTemplate(selected).name} — ${getTemplate(selected).note}`
              : "Choose a template from these results."}
          </p>
          <label className="check-field">
            <input
              type="checkbox"
              checked={keepColors}
              onChange={(event) => setKeepColors(event.target.checked)}
            />
            Keep my colors
          </label>
          <p className="field-help">
            Layout resets. Words, images and frames stay. Undo anytime.
          </p>
        </div>
        <div className="template-apply">
          <p className="template-target">
            {all
              ? `Applies to all ${project.shots.length} screenshots`
              : "Applies to this screenshot"}
          </p>
          <button
            type="button"
            className="button primary"
            disabled={!ready || !selectionVisible}
            onClick={() => onApply(selected, all, keepColors)}
          >
            {selectionVisible
              ? `Apply ${getTemplate(selected).name}`
              : "Choose a template"}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
