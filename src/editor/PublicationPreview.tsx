import { useT } from "../i18n/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Project, Shot } from "../core/model";
import { projectPurpose } from "../core/canvas-formats";
import { resolveExportProfile } from "../core/export-profiles";
import { Icon } from "../app/Icon";
import { Preview } from "./Preview";
import "./publication-preview.css";

function PublicationImage({
  project,
  shot,
  image,
  images,
}: {
  project: Project;
  shot: Shot;
  image?: HTMLImageElement;
  images: ReadonlyMap<string, HTMLImageElement>;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  const profile = resolveExportProfile(project);
  return (
    <div
      ref={ref}
      className="publication-image"
      style={{ aspectRatio: `${profile.width} / ${profile.height}` }}
    >
      {shot.assetId !== null && !image ? (
        <p className="publication-missing">
          {t(
            "Image unavailable. Replace this slide’s screenshot in the editor.",
          )}
        </p>
      ) : visible ? (
        <Preview
          project={project}
          shot={shot}
          image={image}
          images={images}
          showEmptyDevices={false}
        />
      ) : (
        <span
          className="publication-placeholder"
          aria-label={t("Preparing screenshot preview")}
        />
      )}
    </div>
  );
}

export function PublicationPreview({
  project,
  images,
  selectedId,
  onClose,
  onEdit,
}: {
  project: Project;
  images: Map<string, HTMLImageElement>;
  selectedId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(
    Math.max(
      0,
      project.shots.findIndex((shot) => shot.id === selectedId),
    ),
  );
  const profile = resolveExportProfile(project);
  const portfolio = projectPurpose(project) === "portfolio";
  const banners = projectPurpose(project) === "banners";
  const [viewport, setViewport] = useState(
    portfolio || profile.category !== "phone" ? 760 : 390,
  );
  const [width, setWidth] = useState(0);
  const destination = banners
    ? t("Google Play banners")
    : portfolio
      ? t("Portfolio")
      : profile.store === "apple"
        ? "App Store"
        : "Google Play";
  const ratio = profile.width / profile.height;
  const tileWidth = Math.max(
    1,
    Math.min(Math.max(1, width - 36) * 0.88, 360 * ratio),
  );
  const indexRef = useRef(active);
  useLayoutEffect(() => {
    indexRef.current = active;
  }, [active]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(viewportRef.current!);
    return () => observer.disconnect();
  }, []);

  function go(index: number) {
    const next = Math.max(0, Math.min(project.shots.length - 1, index));
    const carousel = carouselRef.current;
    const first = carousel?.querySelector<HTMLElement>(".publication-tile");
    const tile =
      carousel?.querySelectorAll<HTMLElement>(".publication-tile")[next];
    if (carousel && first && tile)
      carousel.scrollTo({
        left: tile.offsetLeft - first.offsetLeft,
        behavior: "instant",
      });
    setActive(next);
  }

  useLayoutEffect(() => {
    // Keep the current slide in view when changing the reading width or rotating a phone.
    if (!width) return;
    const carousel = carouselRef.current;
    const first = carousel?.querySelector<HTMLElement>(".publication-tile");
    const tile =
      carousel?.querySelectorAll<HTMLElement>(".publication-tile")[
        indexRef.current
      ];
    if (carousel && first && tile)
      carousel.scrollLeft = tile.offsetLeft - first.offsetLeft;
  }, [tileWidth, width]);

  function trackScroll() {
    if (!width) return;
    const carousel = carouselRef.current!;
    const tiles = [
      ...carousel.querySelectorAll<HTMLElement>(".publication-tile"),
    ];
    const origin = tiles[0]?.offsetLeft ?? 0;
    let nearest = 0;
    tiles.forEach((tile, index) => {
      if (
        Math.abs(tile.offsetLeft - origin - carousel.scrollLeft) <
        Math.abs(tiles[nearest].offsetLeft - origin - carousel.scrollLeft)
      )
        nearest = index;
    });
    setActive(nearest);
  }

  return (
    <dialog
      ref={dialogRef}
      className="publication-dialog"
      aria-labelledby="publication-heading"
      aria-describedby="publication-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="publication-heading">
        <div>
          <p className="eyebrow">{t("SEE IT BEFORE YOU SHARE IT")}</p>
          <h2 id="publication-heading">{t("Publication preview")}</h2>
        </div>
        <button
          className="icon-button"
          aria-label={t("Close publication preview")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="publication-controls">
        <p id="publication-description">
          {portfolio
            ? t("Check your project cards at website reading size.")
            : t("Check the headlines, pacing, and joins as you swipe.")}
        </p>
        <label>
          {t("Preview width")}
          <select
            value={viewport}
            onChange={(event) => setViewport(Number(event.target.value))}
          >
            <option value={320}>{t("Compact · 320 px")}</option>
            <option value={390}>{t("Phone · 390 px")}</option>
            <option value={760}>{t("Wide · 760 px")}</option>
          </select>
        </label>
      </div>
      <div className="publication-body">
        <div
          className={`publication-viewport ${portfolio ? "publication-portfolio" : "publication-store"}`}
          ref={viewportRef}
          style={
            {
              "--publication-width": `${viewport}px`,
              "--tile-width": `${tileWidth}px`,
            } as CSSProperties
          }
        >
          <div className="publication-sitebar">
            <Icon name={portfolio || banners ? "canvas" : "phone"} size={15} />
            <span>{t("{destination} preview", { destination })}</span>
          </div>
          <div className="publication-app">
            <h3>{project.name || t("Untitled app")}</h3>
            <p>
              {banners
                ? t("Banners")
                : portfolio
                  ? t("Project cards")
                  : t("Screenshots")}
              <span>{project.shots.length}</span>
            </p>
          </div>
          {portfolio ? (
            <div className="publication-grid">
              {project.shots.map((shot, index) => (
                <button
                  className="publication-card"
                  key={shot.id}
                  onClick={() => onEdit(shot.id)}
                  aria-label={t("Edit slide {number}: {title}", {
                    number: index + 1,
                    title: shot.title.replace(/\n/g, " "),
                  })}
                >
                  <PublicationImage
                    project={project}
                    shot={shot}
                    images={images}
                    image={images.get(shot.assetId ?? "")}
                  />
                  <span>
                    {t("Slide {number}", {
                      number: String(index + 1).padStart(2, "0"),
                    })}
                    <Icon name="arrow" size={16} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div
                className="publication-carousel"
                ref={carouselRef}
                role="region"
                aria-roledescription={t("carousel")}
                aria-label={t(
                  banners
                    ? "Banner designs. Use arrow keys or swipe to browse."
                    : "{destination} screenshots. Use arrow keys or swipe to browse.",
                  { destination },
                )}
                tabIndex={0}
                onScroll={trackScroll}
                onKeyDown={(event) => {
                  let next: number | undefined;
                  if (event.key === "ArrowRight") next = active + 1;
                  if (event.key === "ArrowLeft") next = active - 1;
                  if (event.key === "Home") next = 0;
                  if (event.key === "End") next = project.shots.length - 1;
                  if (next !== undefined) {
                    event.preventDefault();
                    go(next);
                  }
                }}
              >
                {project.shots.map((shot, index) => (
                  <div
                    key={shot.id}
                    className="publication-tile"
                    role="group"
                    aria-roledescription={t("slide")}
                    aria-label={t("{number} of {count}: {title}", {
                      number: index + 1,
                      count: project.shots.length,
                      title: shot.title.replace(/\n/g, " "),
                    })}
                  >
                    <PublicationImage
                      project={project}
                      shot={shot}
                      images={images}
                      image={images.get(shot.assetId ?? "")}
                    />
                  </div>
                ))}
                <div
                  aria-hidden="true"
                  style={{
                    flex: `0 0 ${Math.max(0, width - 36 - tileWidth - 10)}px`,
                  }}
                />
              </div>
              <p className="publication-swipe">
                {t("Swipe to see the story unfold")}
                <Icon name="right" size={13} />
              </p>
            </>
          )}
        </div>
        <p className="publication-note">
          {portfolio
            ? t("Preview how your exported cards look on a website.")
            : t(
                banners
                  ? "Check your banner at a smaller size. Google Play may crop or overlay parts of the artwork."
                  : "Check how your screenshots read. Store layouts and spacing vary by device.",
              )}{" "}
          {width < viewport - 2 && t("Scaled to fit your screen.")}
        </p>
        {profile.store !== "presentation" &&
          project.shots.length > profile.maxCount && (
            <p className="publication-limit">
              {t(
                banners
                  ? "Google Play uses one banner per format and language. Select the design you want and export it individually."
                  : "Showing all {count} slides. This store slot accepts up to {max} screenshots.",
                { count: project.shots.length, max: profile.maxCount },
              )}
            </p>
          )}
      </div>
      <footer className="publication-footer">
        {portfolio ? (
          <p>{t("Choose a card to return to its editor.")}</p>
        ) : (
          <div className="publication-navigation">
            <button
              className="icon-button"
              aria-label={t("Previous preview slide")}
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <Icon name="left" />
            </button>
            <span role="status" aria-live="polite">
              {String(active + 1).padStart(2, "0")}{" "}
              <span>/ {String(project.shots.length).padStart(2, "0")}</span>
            </span>
            <button
              className="icon-button"
              aria-label={t("Next preview slide")}
              disabled={active === project.shots.length - 1}
              onClick={() => go(active + 1)}
            >
              <Icon name="right" />
            </button>
          </div>
        )}
        <button
          className="button primary"
          onClick={() =>
            portfolio ? onClose() : onEdit(project.shots[active].id)
          }
        >
          {portfolio
            ? t("Back to editor")
            : t("Edit slide {number}", {
                number: String(active + 1).padStart(2, "0"),
              })}
          <Icon name="arrow" size={16} />
        </button>
      </footer>
    </dialog>
  );
}
