import { isPanoramaTemplate } from "./panorama-families";
import { templates } from "./templates";

export const catalogPageSizes = [12, 24, 48] as const;
export type CatalogPageSize = (typeof catalogPageSizes)[number];
export type CatalogLayout = "all" | "single" | "panorama";
export type CatalogBackground = "all" | "solid" | "gradient";
export type CatalogAppearance = "all" | "light" | "dark" | "colorful";
export type CatalogSort = "recommended" | "name-asc" | "name-desc";
export interface CatalogFilters {
  favoritesOnly: boolean;
  query: string;
  category: string;
  layout: CatalogLayout;
  background: CatalogBackground;
  appearance: CatalogAppearance;
  sort: CatalogSort;
}
export const defaultCatalogFilters: CatalogFilters = {
  favoritesOnly: false,
  query: "",
  category: "All",
  layout: "all",
  background: "all",
  appearance: "all",
  sort: "recommended",
};
const nameCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

/** Metadata only: indexing and filtering never create preview canvases. */
export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  note: string;
  layout: Exclude<CatalogLayout, "all">;
  background: Exclude<CatalogBackground, "all">;
  appearance?: Exclude<CatalogAppearance, "all">;
  keywords?: readonly string[];
  surfaceLabel?: string;
}
export function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function createCatalogIndex<T extends CatalogItem>(items: readonly T[]) {
  return items.map((item) => ({
    item,
    name: normalizeSearch(item.name),
    text: normalizeSearch(
      [
        item.name,
        item.category,
        item.description,
        item.note,
        item.surfaceLabel,
        item.background,
        item.appearance,
        item.layout === "panorama"
          ? "panorama panoramic connected 2 slides"
          : "single slide",
        ...(item.keywords ?? []),
      ].join(" "),
    ),
  }));
}
export function queryCatalog<T extends CatalogItem>(
  index: ReturnType<typeof createCatalogIndex<T>>,
  filters: CatalogFilters,
  favorites: ReadonlySet<string> = new Set(),
) {
  const query = normalizeSearch(filters.query);
  const words = query.split(" ").filter(Boolean);
  const counts: Record<string, number> = Object.fromEntries([
    ["All", 0],
    ...index.map(({ item }) => [item.category, 0]),
  ]);
  const candidates = index.filter(
    ({ item, text }) =>
      (!filters.favoritesOnly || favorites.has(item.id)) &&
      (filters.layout === "all" || item.layout === filters.layout) &&
      (filters.background === "all" ||
        item.background === filters.background) &&
      (filters.appearance === "all" ||
        item.appearance === filters.appearance) &&
      words.every((word) => text.includes(word)),
  );
  for (const { item } of candidates) {
    counts.All++;
    counts[item.category]++;
  }
  const matches = candidates.filter(
    ({ item }) =>
      filters.category === "All" || item.category === filters.category,
  );
  // Preserve the curated catalog order on ties, and favor name matches in search.
  const score = (name: string) =>
    name === query ? 2 : name.startsWith(query) ? 1 : 0;
  if (filters.sort === "recommended" && query)
    matches.sort((a, b) => score(b.name) - score(a.name));
  else if (filters.sort !== "recommended")
    matches.sort(
      (a, b) =>
        nameCollator.compare(a.item.name, b.item.name) *
        (filters.sort === "name-desc" ? -1 : 1),
    );
  return { items: matches.map(({ item }) => item), counts };
}
export function paginateCatalog<T>(
  items: readonly T[],
  requestedPage: number,
  requestedSize: number,
) {
  const size: CatalogPageSize = catalogPageSizes.includes(
    requestedSize as CatalogPageSize,
  )
    ? (requestedSize as CatalogPageSize)
    : 12;
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(
    1,
    Math.min(
      pages,
      Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1,
    ),
  );
  const offset = (page - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    page,
    pages,
    size,
    total: items.length,
    from: items.length ? offset + 1 : 0,
    to: Math.min(offset + size, items.length),
  };
}
export function catalogPageNumbers(
  page: number,
  pages: number,
): (number | "gap")[] {
  const numbers = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) {
    numbers.add(2);
    numbers.add(3);
    numbers.add(4);
  }
  if (page >= pages - 2) {
    numbers.add(pages - 3);
    numbers.add(pages - 2);
    numbers.add(pages - 1);
  }
  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const value of [...numbers]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b)) {
    if (value - previous > 1) result.push("gap");
    result.push(value);
    previous = value;
  }
  return result;
}

const catalogItems = templates.map((template) => ({
  ...template,
  layout: isPanoramaTemplate(template.id)
    ? ("panorama" as const)
    : ("single" as const),
  background: template.style.backgroundMode,
  appearance:
    template.appearance ??
    (template.keywords?.includes("dark")
      ? "dark"
      : template.keywords?.includes("colorful") || template.id === "split"
        ? "colorful"
        : "light"),
}));
export const templateCatalogIndex = createCatalogIndex(catalogItems);
