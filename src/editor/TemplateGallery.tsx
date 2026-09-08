import { bannerTemplates } from "../core/banner-templates";
import { isBannerProfile } from "../core/export-profiles";
import { compositionId } from "../core/device-composition-spec";
import { useT } from "../i18n/react";
import { panoramaStart } from "../core/panorama-families";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import type { Project, Shot, TemplateId } from "../core/model";
import { canonicalCanvas } from "../core/export-profiles";
import {
  isPanoramaTemplate,
  linkedShots,
  panoramaPair,
  panoramaPreview,
  shotCapacity,
} from "../core/panorama";
import { resolveStyle } from "../core/model";
import {
  getTemplate,
  templates,
  templatePreview,
  type Template,
} from "../core/templates";
import {
  catalogPageNumbers,
  catalogPageSizes,
  defaultCatalogFilters,
  paginateCatalog,
  queryCatalog,
  templateCatalogIndex,
  bannerCatalogIndex,
  normalizeSearch,
  type CatalogFilters,
  type CatalogPageSize,
} from "../core/template-catalog";
import "./template-library.css";
import { Preview } from "./Preview";
import { Icon } from "../app/Icon";
import {
  getTemplateFavorites,
  subscribeTemplateFavorites,
  setTemplateFavorite,
} from "../storage/template-favorites";

const TemplateCard = memo(function TemplateCard({
  template,
  project,
  shots,
  focusShot,
  images,
  keepColors,
  selected,
  favorite,
  onFavorite,
  onSelect,
  series,
}: {
  template: Template;
  project: Project;
  shots: Shot[];
  focusShot: Shot;
  images: Map<string, HTMLImageElement>;
  keepColors: boolean;
  selected: boolean;
  favorite: boolean;
  onFavorite: (id: TemplateId) => void;
  onSelect: (id: TemplateId) => void;
  series: boolean;
}) {
  const t = useT();
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
  const family = panoramaStart(template.id);
  const previews = useMemo(
    () =>
      family
        ? panoramaPreview(project, focusShot, keepColors, family)
        : shots.map((shot) =>
            templatePreview(project, shot, template.id, keepColors),
          ),
    [project, shots, focusShot, template.id, keepColors, family],
  );
  const previewProject = useMemo(
    () => ({ ...project, shots: previews }),
    [project, previews],
  );
  return (
    <div className="template-card-shell">
      <button
        ref={ref}
        type="button"
        className="template-card"
        aria-pressed={selected}
        onClick={() => onSelect(template.id)}
        aria-label={t("{name} template", { name: template.name })}
      >
        <span className="template-card-label">
          <strong>{template.name}</strong>
          <span className="template-category">
            {isPanoramaTemplate(template.id)
              ? t("2-slide panorama")
              : compositionId(template.id)
                ? t("Multiple devices")
                : t(template.category)}
          </span>
          <span className="template-check">
            {selected && <Icon name="check" size={14} />}
          </span>
        </span>
        <div
          className={`template-art ${isPanoramaTemplate(template.id) ? "template-art-panorama" : series || previews.length > 1 ? "template-art-series" : ""}`}
          style={{ "--template-count": previews.length } as CSSProperties}
        >
          {previews.map((preview) => (
            <div className="template-preview-slot" key={preview.id}>
              {visible ? (
                <Preview
                  project={previewProject}
                  shot={preview}
                  images={images}
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
        <span className="template-description">{t(template.description)}</span>
      </button>
      <button
        type="button"
        className="template-favorite"
        aria-pressed={favorite}
        aria-label={t(
          favorite ? "Remove {name} from favorites" : "Add {name} to favorites",
          { name: template.name },
        )}
        title={t(favorite ? "Remove from favorites" : "Add to favorites")}
        onClick={() => onFavorite(template.id)}
      >
        <Icon name="star" size={20} />
      </button>
    </div>
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
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const banners = isBannerProfile(project.exportProfile);
  const availableTemplates = banners ? bannerTemplates : templates;
  const catalogIndex = isBannerProfile(project.exportProfile)
    ? bannerCatalogIndex
    : templateCatalogIndex;
  const favorites = useSyncExternalStore(
    subscribeTemplateFavorites,
    getTemplateFavorites,
  );
  const [selected, setSelected] = useState<TemplateId>(
    getTemplate(resolveStyle(project, shot).template).id,
  );
  const [all, setAll] = useState(false);
  const [keepColors, setKeepColors] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(defaultCatalogFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [pageSize, setPageSize] = useState<CatalogPageSize>(12);
  const [previewPage, setPreviewPage] = useState(
    Math.floor(
      Math.max(
        0,
        project.shots.findIndex((item) => item.id === shot.id),
      ) / 3,
    ),
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const revealSelected = useRef(false);
  const localizedIndex = useMemo(
    () =>
      catalogIndex.map((entry) => ({
        ...entry,
        text: `${entry.text} ${normalizeSearch(
          [
            t(entry.item.category),
            t(entry.item.description),
            t(entry.item.note),
            entry.item.surfaceLabel ? t(entry.item.surfaceLabel) : "",
            t(entry.item.background === "solid" ? "Solid" : "Gradient"),
            t(
              entry.item.appearance === "dark"
                ? "Dark"
                : entry.item.appearance === "colorful"
                  ? "Colorful"
                  : "Light",
            ),
            t(
              entry.item.layout === "panorama"
                ? "2-slide panorama"
                : entry.item.layout === "multi-device"
                  ? "Multiple devices"
                  : "Single slide",
            ),
            ...(entry.item.keywords ?? []).map((keyword) => t(keyword)),
          ].join(" "),
        )}`,
      })),
    [t, catalogIndex],
  );
  const results = useMemo(
    () => queryCatalog(localizedIndex, filters, favorites.ids),
    [localizedIndex, filters, favorites.ids],
  );
  const favoriteCount = catalogIndex.filter(({ item }) =>
    favorites.ids.has(item.id),
  ).length;
  const pagination = useMemo(
    () => paginateCatalog(results.items, catalogPage, pageSize),
    [results.items, catalogPage, pageSize],
  );
  const selectedTemplate = getTemplate(selected);
  const selectedOnPage = pagination.items.some((item) => item.id === selected);
  const selectedInResults = results.items.some((item) => item.id === selected);
  const activeFilters =
    Number(filters.favoritesOnly) +
    Number(filters.category !== "All") +
    Number(filters.layout !== "all") +
    Number(filters.background !== "all") +
    Number(filters.appearance !== "all");
  const hasFilters = activeFilters > 0 || filters.query.trim().length > 0;
  const updateFilters = (patch: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setCatalogPage(1);
  };
  const clearFilters = () => {
    setFilters(defaultCatalogFilters);
    setCatalogPage(1);
  };
  const selectTemplate = useCallback((id: TemplateId) => {
    setSelected(id);
    if (isPanoramaTemplate(id)) setAll(false);
  }, []);
  const toggleFavorite = useCallback(
    (id: TemplateId) => {
      const wasFavorite = getTemplateFavorites().ids.has(id);
      if (filters.favoritesOnly && wasFavorite) resultsRef.current?.focus();
      setTemplateFavorite(id, !wasFavorite);
    },
    [filters.favoritesOnly],
  );
  const changePage = (next: number) => {
    setCatalogPage(next);
    resultsRef.current?.focus();
  };
  const showSelected = () => {
    revealSelected.current = true;
    const items = selectedInResults ? results.items : availableTemplates;
    if (!selectedInResults) setFilters(defaultCatalogFilters);
    setCatalogPage(
      Math.floor(items.findIndex((item) => item.id === selected) / pageSize) +
        1,
    );
    resultsRef.current?.focus();
  };
  useEffect(() => {
    galleryRef.current?.scrollTo({ top: 0 });
    if (revealSelected.current) {
      galleryRef.current
        ?.querySelector<HTMLButtonElement>(
          '.template-card[aria-pressed="true"]',
        )
        ?.focus();
      revealSelected.current = false;
    }
  }, [filters, pagination.page, pageSize]);
  const pair = panoramaPair(project, shot.id);
  const panoramic = isPanoramaTemplate(selected);
  const full =
    panoramic && !pair && project.shots.length >= shotCapacity(project);
  const start = previewPage * 3;
  const shownShots = useMemo(
    () =>
      all
        ? project.shots.slice(start, start + 3)
        : linkedShots(project, shot.id),
    [all, project, shot, start],
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
          <h2 id="template-heading">{t("Template library")}</h2>
          <p>
            {t(
              banners
                ? "{count} banner designs. Previewed with your image and canvas."
                : "{count} designs. Previewed with your screenshots and canvas.",
              {
                count: availableTemplates.length,
              },
            )}
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Close templates")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="catalog-searchbar">
        <div className="catalog-search-control">
          <label className="catalog-search">
            <span className="visually-hidden">{t("Search templates")}</span>
            <Icon name="search" size={19} />
            <input
              ref={searchRef}
              type="search"
              placeholder={t("Search names, colors, or ideas…")}
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
            />
          </label>
          {filters.query && (
            <button
              type="button"
              className="icon-button"
              aria-label={t("Clear search")}
              onClick={() => {
                updateFilters({ query: "" });
                searchRef.current?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <label className="catalog-sort">
          <span>{t("Sort by")}</span>
          <select
            aria-label={t("Sort by")}
            value={filters.sort}
            onChange={(event) =>
              updateFilters({
                sort: event.target.value as CatalogFilters["sort"],
              })
            }
          >
            <option value="recommended">
              {t(filters.query.trim() ? "Best match" : "Curated order")}
            </option>
            <option value="name-asc">{t("Name A–Z")}</option>
            <option value="name-desc">{t("Name Z–A")}</option>
          </select>
        </label>
        <button
          type="button"
          className="catalog-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Icon name="filter" size={17} />
          {t("Filters")}
          {activeFilters > 0 && <span>{activeFilters}</span>}
        </button>
      </div>
      <div className="catalog-body">
        <aside
          id="catalog-filters"
          className={`catalog-filters ${filtersOpen ? "is-open" : ""}`}
          aria-label={t("Template filters")}
        >
          <label className="catalog-filter-field">
            {t("Appearance")}
            <select
              value={filters.appearance}
              onChange={(event) =>
                updateFilters({
                  appearance: event.target
                    .value as CatalogFilters["appearance"],
                })
              }
            >
              <option value="all">{t("Any appearance")}</option>
              <option value="light">{t("Light")}</option>
              <option value="dark">{t("Dark")}</option>
              <option value="colorful">{t("Colorful")}</option>
            </select>
          </label>
          <fieldset className="catalog-categories">
            <legend>{t("Style")}</legend>
            {Object.entries(results.counts).map(([category, count]) => (
              <button
                type="button"
                key={category}
                aria-pressed={filters.category === category}
                onClick={() => updateFilters({ category })}
              >
                <span>{t(category === "All" ? "All styles" : category)}</span>
                <span>{count}</span>
              </button>
            ))}
          </fieldset>
          {!banners && (
            <label className="catalog-filter-field">
              {t("Composition")}
              <select
                value={filters.layout}
                onChange={(event) =>
                  updateFilters({
                    layout: event.target.value as CatalogFilters["layout"],
                  })
                }
              >
                <option value="all">{t("Any composition")}</option>
                <option value="single">{t("Single slide")}</option>
                <option value="multi-device">{t("Multiple devices")}</option>
                <option value="panorama">{t("2-slide panorama")}</option>
              </select>
            </label>
          )}
          <label className="catalog-filter-field">
            {t("Background")}
            <select
              value={filters.background}
              onChange={(event) =>
                updateFilters({
                  background: event.target
                    .value as CatalogFilters["background"],
                })
              }
            >
              <option value="all">{t("Any background")}</option>
              <option value="solid">{t("Solid")}</option>
              <option value="gradient">{t("Gradient")}</option>
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              className="catalog-reset"
              onClick={clearFilters}
            >
              <Icon name="reset" size={15} />
              {t("Clear filters")}
            </button>
          )}
          <p className="catalog-filter-note">
            {t(
              banners
                ? "Every banner design adapts to the selected Google Play format."
                : "Every template adapts to your project’s device and format.",
            )}
          </p>
        </aside>
        <section className="catalog-results" aria-label={t("Template results")}>
          <div className="catalog-results-bar" ref={resultsRef} tabIndex={-1}>
            <div
              className="catalog-collections"
              role="group"
              aria-label={t("Template collection")}
            >
              <button
                type="button"
                aria-pressed={!filters.favoritesOnly}
                onClick={() => updateFilters({ favoritesOnly: false })}
              >
                {t("All templates")}
              </button>
              <button
                type="button"
                aria-pressed={filters.favoritesOnly}
                onClick={() => updateFilters({ favoritesOnly: true })}
              >
                <Icon name="star" size={16} />
                {t("Favorites")}
                <span>{favoriteCount}</span>
              </button>
            </div>
            <p role="status" aria-live="polite" aria-atomic="true">
              {pagination.total > 0
                ? t(
                    pagination.total === 1
                      ? "{range} of {count} template"
                      : "{range} of {count} templates",
                    {
                      range:
                        pagination.from === pagination.to
                          ? pagination.from
                          : `${pagination.from}–${pagination.to}`,
                      count: pagination.total,
                    },
                  )
                : t("No matching templates")}
            </p>
            <label>
              {t("Per page")}
              <select
                aria-label={t("Templates per page")}
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as CatalogPageSize);
                  setCatalogPage(1);
                }}
              >
                {catalogPageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p
            className="catalog-favorites-note"
            role={favorites.sessionOnly ? "status" : undefined}
          >
            {t(
              favorites.sessionOnly
                ? "Browser storage is unavailable. Favorites will last for this session."
                : "Favorites stay in this browser, across all your projects.",
            )}
          </p>
          {all && (
            <div
              className="template-series-navigation"
              role="group"
              aria-label={t("Series preview pages")}
            >
              <span>
                {t("Previewing slides {from}–{to} of {count}", {
                  from: start + 1,
                  to: Math.min(start + 3, project.shots.length),
                  count: project.shots.length,
                })}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Previous preview screenshots")}
                disabled={previewPage === 0}
                onClick={() => setPreviewPage(previewPage - 1)}
              >
                <Icon name="left" size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Next preview screenshots")}
                disabled={start + 3 >= project.shots.length}
                onClick={() => setPreviewPage(previewPage + 1)}
              >
                <Icon name="right" size={16} />
              </button>
            </div>
          )}
          <div
            className="template-gallery"
            ref={galleryRef}
            role="group"
            aria-label={t(
              banners ? "Banner templates" : "Screenshot templates",
            )}
          >
            {pagination.items.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                project={project}
                shots={shownShots}
                focusShot={shot}
                images={images}
                keepColors={keepColors}
                selected={selected === template.id}
                favorite={favorites.ids.has(template.id)}
                onFavorite={toggleFavorite}
                onSelect={selectTemplate}
                series={all || !!pair}
              />
            ))}
            {pagination.total === 0 && (
              <div className="template-empty">
                <Icon
                  name={filters.favoritesOnly ? "star" : "search"}
                  size={28}
                />
                <h3>
                  {t(
                    filters.favoritesOnly
                      ? favoriteCount === 0
                        ? "No favorites yet."
                        : "No favorites match these filters."
                      : "A different search might do it.",
                  )}
                </h3>
                <p>
                  {t(
                    filters.favoritesOnly
                      ? favoriteCount === 0
                        ? "Tap the star on any template to keep it here."
                        : "Try another search or clear your filters to see all your favorites."
                      : "Try a name, a color like “blue”, or an idea like “waves”. You can also broaden your filters.",
                  )}
                </p>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setFilters({
                      ...defaultCatalogFilters,
                      favoritesOnly: filters.favoritesOnly && favoriteCount > 0,
                    });
                    setCatalogPage(1);
                  }}
                >
                  {t(
                    filters.favoritesOnly
                      ? favoriteCount === 0
                        ? "Explore templates"
                        : "Show all favorites"
                      : "Clear search & filters",
                  )}
                </button>
              </div>
            )}
          </div>
          {pagination.pages > 1 && (
            <nav
              className="catalog-pagination"
              aria-label={t("Template pages")}
            >
              <button
                type="button"
                className="icon-button"
                aria-label={t("Previous template page")}
                disabled={pagination.page === 1}
                onClick={() => changePage(pagination.page - 1)}
              >
                <Icon name="left" size={16} />
              </button>
              <span className="catalog-page-summary">
                {t("Page {page} of {count}", {
                  page: pagination.page,
                  count: pagination.pages,
                })}
              </span>
              <div className="catalog-page-numbers">
                {catalogPageNumbers(pagination.page, pagination.pages).map(
                  (number, index) =>
                    number === "gap" ? (
                      <span key={`gap-${index}`} aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={number}
                        type="button"
                        aria-label={t("Template page {number}", { number })}
                        aria-current={
                          number === pagination.page ? "page" : undefined
                        }
                        onClick={() => changePage(number)}
                      >
                        {number}
                      </button>
                    ),
                )}
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Next template page")}
                disabled={pagination.page === pagination.pages}
                onClick={() => changePage(pagination.page + 1)}
              >
                <Icon name="right" size={16} />
              </button>
            </nav>
          )}
        </section>
      </div>
      <footer className="template-footer">
        <div className="template-selection">
          <div>
            <span>{t("Selected")}</span>
            <strong>{selectedTemplate.name}</strong>
            {!selectedOnPage && (
              <button
                type="button"
                className="catalog-show-selected"
                onClick={showSelected}
              >
                {t("Show selected")}
              </button>
            )}
          </div>
          <p className="template-target">
            {full
              ? t("Needs room for one more slide · Limit: {count}", {
                  count: shotCapacity(project),
                })
              : panoramic
                ? pair
                  ? t("Updates this panorama")
                  : t("Adds one slide to create a linked pair")
                : pair && !all
                  ? t("Both slides become independent. Undo anytime.")
                  : t(
                      compositionId(selected)
                        ? "The template sets up each device. Your text and matching screenshots are preserved."
                        : banners
                          ? "The layout resets. Your text and images are preserved."
                          : "The layout resets. Your text, images, and frames are preserved.",
                    )}
          </p>
          {!selectedInResults && (
            <p className="catalog-selection-note">
              {t("Your selection is outside these results.")}
            </p>
          )}
        </div>
        <div className="template-settings">
          <label className="catalog-scope">
            {t("Apply to")}
            <select
              aria-label={t("Apply template to")}
              value={all ? "all" : "selected"}
              onChange={(event) => setAll(event.target.value === "all")}
            >
              <option value="selected">
                {pair
                  ? t("This pair (2 slides)")
                  : t(banners ? "This banner" : "This screenshot")}
              </option>
              <option value="all" disabled={panoramic}>
                {t("Whole series ({count})", { count: project.shots.length })}
              </option>
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={keepColors}
              onChange={(event) => setKeepColors(event.target.checked)}
            />{" "}
            {t("Keep my colors")}
          </label>
        </div>
        <div className="template-apply">
          {!ready && (
            <p className="template-target" role="status">
              {t("Loading your screenshots…")}
            </p>
          )}
          <button
            type="button"
            className="button primary"
            disabled={!ready || full}
            onClick={() => onApply(selected, all, keepColors)}
          >
            {panoramic && !pair
              ? t("Create 2-slide panorama")
              : t("Apply {name}", { name: selectedTemplate.name })}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
