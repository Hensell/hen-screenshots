import type { ReactNode } from "react";
import type { Project } from "../core/model";
import { appliedBrand } from "../core/brand-application";
import { Icon } from "../app/Icon";
import { useT } from "../i18n/react";

function AppIdentity({ project }: { project: Project }) {
  const brand =
    appliedBrand(project) ?? appliedBrand(project, project.shots[0]);
  return (
    <span className="publication-app-icon" aria-hidden="true">
      {brand?.logo ? (
        <img src={brand.logo} alt="" />
      ) : (
        (project.name.trim() || "App").slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

/** Illustrative surrounding UI; the artwork remains the actual export preview.
 * Store actions are decorative, and unknown listing metadata is left blank. */
export function PublicationContext({
  project,
  portfolio,
  apple,
  banners,
  children,
}: {
  project: Project;
  portfolio: boolean;
  apple: boolean;
  banners: boolean;
  children: ReactNode;
}) {
  const t = useT();
  const name = project.name || t("Untitled app");
  const subtitle = project.shots[0]?.subtitle;
  if (portfolio)
    return (
      <>
        <div className="publication-browserbar" aria-hidden="true">
          <span className="publication-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>portfolio.example</span>
          <Icon name="plus" size={14} />
        </div>
        <div className="publication-webnav" aria-hidden="true">
          <span>
            <AppIdentity project={project} />
            {t("Portfolio")}
          </span>
          <span>
            {t("Work")}
            <span>{t("About")}</span>
          </span>
        </div>
        <div className="publication-webhero">
          <p>{t("Selected work")}</p>
          <h3>{name}</h3>
          <p>
            {subtitle || t("A collection of projects, ideas, and details.")}
          </p>
        </div>
        {children}
        <div className="publication-webfooter" aria-hidden="true">
          <span>{name}</span>
          <span>{t("Portfolio")}</span>
        </div>
      </>
    );
  return (
    <>
      <div className="publication-storebar" aria-hidden="true">
        <span>
          <Icon name="left" size={19} />
          {apple ? "App Store" : "Google Play"}
        </span>
        <span>
          <Icon name={apple ? "upload" : "search"} size={19} />
          {!apple && <Icon name="more" size={19} />}
        </span>
      </div>
      <div className="publication-listing-identity">
        <AppIdentity project={project} />
        <div>
          <h3>{name}</h3>
          <p>{t("Developer name")}</p>
          {apple && (
            <span className="publication-install" aria-hidden="true">
              {t("Get")}
            </span>
          )}
        </div>
      </div>
      <dl
        className="publication-listing-facts"
        aria-label={t("Illustrative app details")}
      >
        <div>
          <dt>{t("Ratings")}</dt>
          <dd>
            — <Icon name="star" size={13} />
          </dd>
        </div>
        <div>
          <dt>{t(apple ? "Age rating" : "Downloads")}</dt>
          <dd>—</dd>
        </div>
        <div>
          <dt>{t(apple ? "Category" : "Content rating")}</dt>
          <dd>—</dd>
        </div>
      </dl>
      {!apple && (
        <div className="publication-install-row" aria-hidden="true">
          <span className="publication-install">{t("Install")}</span>
          <Icon name="upload" size={19} />
        </div>
      )}
      <div className="publication-screenshots-heading">
        <h4>{t(banners ? "Banners" : "Screenshots")}</h4>
        <span>{project.shots.length}</span>
      </div>
      {children}
      <div className="publication-listing-about">
        <h4>
          {t(apple ? "Description" : "About this app")}
          <Icon name="arrow" size={18} />
        </h4>
        <p>{subtitle || t("Your app description appears here.")}</p>
      </div>
    </>
  );
}
