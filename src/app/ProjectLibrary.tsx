import type { Project } from "../core/model";
import { projectPurpose, type ProjectPurpose } from "../core/canvas-formats";
import { Icon } from "./Icon";

function Footer() {
  return (
    <footer className="site-footer">
      <span>Made for the apps you care about.</span>
      <a href="https://hensell.dev" target="_blank" rel="noopener noreferrer">
        By Hensell <Icon name="arrow" size={14} />
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
  const visibleProjects = projects.filter(
    (item) => projectPurpose(item) === libraryPurpose,
  );
  return (
    <main className="library">
      <div className="library-intro">
        <p className="eyebrow">YOUR APPS, IN THEIR BEST LIGHT</p>
        <h1>
          A good app deserves
          <br />
          <span>a great first impression.</span>
        </h1>
        <p className="intro-copy">
          Turn your screenshots into a story worth downloading.
          <br className="desktop-break" /> A little framing. The right words.
          All yours.
        </p>
        <div className="library-actions">
          <button
            className="button primary"
            disabled={!!busy}
            onClick={() => onNew()}
          >
            <Icon name="plus" />
            New project
          </button>
          <button
            className="button secondary"
            disabled={!!busy}
            onClick={() => onImport()}
          >
            <Icon name="upload" />
            Open project file
          </button>
          <button
            className="button secondary"
            disabled={!!busy}
            onClick={() => onBrandKits()}
          >
            <Icon name="brand" />
            Brand kits
          </button>
        </div>
        <p className="local-note">
          Your screenshots stay in your browser. No account needed.
        </p>
      </div>
      <section className="projects-section" aria-label="Saved projects">
        <div className="section-heading">
          <h2>Your projects</h2>
          <span className="muted">
            {visibleProjects.length} in this workspace
          </span>
        </div>
        <div
          className="library-purpose"
          role="group"
          aria-label="Project workspace"
        >
          {(["stores", "portfolio"] as const).map((purpose) => (
            <button
              key={purpose}
              aria-pressed={libraryPurpose === purpose}
              onClick={() => setLibraryPurpose(purpose)}
            >
              {purpose === "stores" ? "App stores" : "Portfolio"}
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
                  <span>{item.name || "Untitled app"}</span>
                  <Icon name="phone" size={70} />
                  <span className="cover-rule" />
                </div>
                <div className="project-card-details">
                  <span>
                    <strong>{item.name || "Untitled app"}</strong>
                    <small>
                      {item.shots.length} screenshot
                      {item.shots.length === 1 ? "" : "s"} ·{" "}
                      {new Date(item.updatedAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
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
                  ? "A place for your next launch."
                  : "A place for your best work."}
              </h3>
              <p>
                Your projects will appear here, ready to pick up where you left
                off.
              </p>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
