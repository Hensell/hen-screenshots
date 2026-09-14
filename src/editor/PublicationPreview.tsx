import { Select } from "../ui/Select";
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
import { PublicationContext } from "./PublicationContext";
import { sceneAssetIds } from "../core/overlays";
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
      {sceneAssetIds(project, shot).some((id) => !images.has(id)) ? (
        <p className="publication-missing">
          {t(
            "An image is unavailable. Check this slide’s images in the editor.",
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
  const emptySlots = project.shots.some(
    (shot) =>
      shot.assetId === null ||
      shot.companions?.some((device) => device.assetId === null),
  );
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
          <p className="publication-destination">
            {destination} <span>· {t("Simulated page")}</span>
          </p>
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
            : t(
                project.shots.length === 1
                  ? "Check your headline and composition at publishing size."
                  : "Check the headlines, pacing, and joins as you swipe.",
              )}
        </p>
        <label>
          {t("Preview width")}
          <Select
            value={viewport}
            onChange={(event) => setViewport(Number(event.target.value))}
          >
            <option value={320}>{t("Compact · 320 px")}</option>
            <option value={390}>{t("Phone · 390 px")}</option>
            <option value={760}>{t("Wide · 760 px")}</option>
          </Select>
        </label>
      </div>
      <div className="publication-body">
        {emptySlots && (
          <p className="publication-empty-notice">
            <Icon name="image" size={18} />
            <span>
              {t(
                "Some image slots are empty. Devices without screenshots do not appear in exports. Add images in the editor to see them here.",
              )}
            </span>
          </p>
        )}
        <div
          className={`publication-viewport ${portfolio ? "publication-portfolio" : profile.store === "apple" ? "publication-store publication-apple" : "publication-store publication-google"}`}
          ref={viewportRef}
          style={
            {
              "--publication-width": `${viewport}px`,
              "--tile-width": `${tileWidth}px`,
            } as CSSProperties
          }
        >
          <PublicationContext
            project={project}
            portfolio={portfolio}
            apple={profile.store === "apple"}
            banners={banners}
          >
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
                    <span className="publication-card-caption">
                      <span>
                        <small>
                          {t("Project {number}", {
                            number: String(index + 1).padStart(2, "0"),
                          })}
                        </small>
                        <strong>
                          {shot.title.replace(/\n/g, " ") ||
                            project.name ||
                            t("Untitled app")}
                        </strong>
                      </span>
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
                  aria-roledescription={
                    project.shots.length > 1 ? t("carousel") : undefined
                  }
                  aria-label={t(
                    project.shots.length === 1
                      ? "Publication preview"
                      : banners
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
                  {project.shots.length > 1 && (
                    <div
                      aria-hidden="true"
                      style={{
                        flex: `0 0 ${Math.max(0, width - 36 - tileWidth - 10)}px`,
                      }}
                    />
                  )}
                </div>
                {project.shots.length > 1 && (
                  <p className="publication-swipe">
                    {t("Swipe to see the story unfold")}
                    <Icon name="right" size={13} />
                  </p>
                )}
              </>
            )}
          </PublicationContext>
        </div>
        <p className="publication-note">
          {portfolio
            ? t(
                "Example website. Your images and their proportions are preserved.",
              )
            : t(
                banners
                  ? "Check your banner at a smaller size. Google Play may crop or overlay parts of the artwork."
                  : "Illustrative store layout. App details are placeholders; the screenshots are yours. Actual listings vary by device.",
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
