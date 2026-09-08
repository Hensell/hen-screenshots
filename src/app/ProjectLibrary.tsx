import { useInterfaceLocale, useT } from "../i18n/react";
import type { Project } from "../core/model";
import { projectPurpose, type ProjectPurpose } from "../core/canvas-formats";
import { Icon } from "./Icon";

function Footer() {
  const t = useT();
  return (
    <footer className="site-footer">
      <span>{t("Made for the apps you care about.")}</span>
      <a href="https://hensell.dev" target="_blank" rel="noopener noreferrer">
        {t("By Hensell")}
        <Icon name="arrow" size={14} />
      </a>
    </footer>
  );
}

export function ProjectLibrary({
  projects,
  libraryPurpose,
  setLibraryPurpose,
  busy,
  onNew,
  onImport,
  onBrandKits,
  onOpen,
}: {
  projects: Project[];
  libraryPurpose: ProjectPurpose;
  setLibraryPurpose: (purpose: ProjectPurpose) => void;
  busy: string | null;
  onNew: () => void;
  onImport: () => void;
  onBrandKits: () => void;
  onOpen: (id: string) => Promise<void>;
}) {
  const t = useT();
  const interfaceLocale = useInterfaceLocale();
  const visibleProjects = projects.filter(
    (item) => projectPurpose(item) === libraryPurpose,
  );
  return (
    <main className="library">
      <div className="library-intro">
        <p className="eyebrow">{t("YOUR APPS, IN THEIR BEST LIGHT")}</p>
        <h1>
          {t("A good app deserves")}
          <br />
          <span>{t("a great first impression.")}</span>
        </h1>
        <p className="intro-copy">
          {t(
            "Turn your screenshots into a story that makes people want to try your app.",
          )}
          <br className="desktop-break" />
          {t("A little framing. The right words. All yours.")}
        </p>
        <div className="library-actions">
          <button
            className="button primary"
            disabled={!!busy}
            onClick={() => onNew()}
          >
            <Icon name="plus" />
            {t("New project")}
          </button>
          <button
            className="button secondary"
            disabled={!!busy}
            onClick={() => onImport()}
          >
            <Icon name="upload" />
            {t("Open project file")}
          </button>
          <button
            className="button secondary"
            disabled={!!busy}
            onClick={() => onBrandKits()}
          >
            <Icon name="brand" />
            {t("Brand kits")}
          </button>
        </div>
        <p className="local-note">
          {t("Your screenshots stay in your browser. No account needed.")}
        </p>
      </div>
      <section className="projects-section" aria-label={t("Saved projects")}>
        <div className="section-heading">
          <h2>{t("Your projects")}</h2>
          <span className="muted">
            {t("{count} in this workspace", { count: visibleProjects.length })}
          </span>
        </div>
        <div
          className="library-purpose"
          role="group"
          aria-label={t("Project workspace")}
        >
          {(["stores", "portfolio"] as const).map((purpose) => (
            <button
              key={purpose}
              aria-pressed={libraryPurpose === purpose}
              onClick={() => setLibraryPurpose(purpose)}
            >
              {t(purpose === "stores" ? "App stores" : "Portfolio")}
              <span>
                {
                  projects.filter((item) => projectPurpose(item) === purpose)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        {visibleProjects.length ? (
          <div className="project-grid">
            {visibleProjects.map((item) => (
              <button
                className="project-card"
                key={item.id}
                disabled={!!busy}
                onClick={() => void onOpen(item.id)}
              >
                <div
                  className="project-cover"
                  style={{
                    background: item.style.background,
                    color: item.style.textColor,
                  }}
                >
                  <span>{item.name || t("Untitled app")}</span>
                  <Icon name="phone" size={70} />
                  <span className="cover-rule" />
                </div>
                <div className="project-card-details">
                  <span>
                    <strong>{item.name || t("Untitled app")}</strong>
                    <small>
                      {t(
                        item.shots.length === 1
                          ? "{count} screenshot"
                          : "{count} screenshots",
                        { count: item.shots.length },
                      )}{" "}
                      ·{" "}
                      {new Date(item.updatedAt).toLocaleDateString(
                        interfaceLocale,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </small>
                  </span>
                  <Icon name="arrow" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-library">
            <Icon name="folder" size={28} />
            <div>
              <h3>
                {libraryPurpose === "stores"
                  ? t("A place for your next launch.")
                  : t("A place for your best work.")}
              </h3>
              <p>
                {t(
                  "Your projects will appear here, ready to pick up where you left off.",
                )}
              </p>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
