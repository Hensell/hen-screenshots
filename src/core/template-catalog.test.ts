import { describe, expect, it } from "vitest";
import {
  catalogPageNumbers,
  createCatalogIndex,
  defaultCatalogFilters,
  normalizeSearch,
  paginateCatalog,
  queryCatalog,
  templateCatalogIndex,
  type CatalogFilters,
  type CatalogItem,
} from "./template-catalog";
import { templates } from "./templates";

const browse = (filters: Partial<CatalogFilters> = {}) =>
  queryCatalog(templateCatalogIndex, { ...defaultCatalogFilters, ...filters });
const ids = (filters: Partial<CatalogFilters>) =>
  browse(filters).items.map((item) => item.id);

describe("template discovery", () => {
  it("preserves curated order and indexes every real composition exactly once", () => {
    expect(ids({})).toEqual(templates.map((item) => item.id));
    expect(new Set(ids({})).size).toBe(templates.length);
    expect(browse().counts).toEqual({
      All: 13,
      Minimal: 2,
      Bold: 6,
      Editorial: 5,
    });
  });
  it("combines case, accents, whitespace, punctuation, style and descriptive keywords", () => {
    expect(ids({ query: "  stÚDIO  ", category: "Minimal" })).toEqual([
      "studio",
    ]);
    expect(ids({ query: "studio", category: "Bold" })).toEqual([]);
    expect(ids({ query: "circular-stage" })).toEqual(["halo"]);
    expect(ids({ query: "  BLUE  waves " })).toEqual(["tidal"]);
    expect(ids({ query: "botanical green" })).toEqual(["bloom"]);
    expect(ids({ query: "2-slide" })).toEqual([
      "daybreak",
      "tidal",
      "panorama",
    ]);
    expect(ids({ query: "no-such-template" })).toEqual([]);
    expect(normalizeSearch("  Café / ÉDITORIAL  ")).toBe("cafe editorial");
  });
  it("combines composition, background, category and query without filtering by the user's frame", () => {
    expect(ids({ layout: "panorama" })).toEqual([
      "daybreak",
      "tidal",
      "panorama",
    ]);
    expect(ids({ layout: "panorama", category: "Bold" })).toEqual(["daybreak"]);
    expect(
      ids({ layout: "single", background: "gradient", category: "Bold" }),
    ).toEqual(["spotlight", "tilt"]);
    expect(ids({ layout: "panorama", background: "gradient" })).toEqual([]);
    expect(
      ids({ query: "dark", layout: "single", background: "solid" }),
    ).toEqual(["halo"]);
  });
  it("shows category counts for the current query and other filters, independent of the selected category", () => {
    const { counts, items } = browse({ layout: "panorama", category: "Bold" });
    expect(counts).toEqual({ All: 3, Minimal: 0, Bold: 1, Editorial: 2 });
    expect(items).toHaveLength(1);
    expect(browse({ query: "missing" }).counts).toEqual({
      All: 0,
      Minimal: 0,
      Bold: 0,
      Editorial: 0,
    });
  });
  it("ranks exact name matches first and sorts without changing the underlying catalog", () => {
    expect(ids({ query: "editorial" })[0]).toBe("editorial");
    expect(ids({ sort: "name-asc" }).slice(0, 3)).toEqual([
      "bloom",
      "classic",
      "daybreak",
    ]);
    expect(ids({ sort: "name-desc" })[0]).toBe("tilt");
    expect(ids({})).toEqual(templates.map((item) => item.id));
  });
});

describe("catalog pagination", () => {
  it("slices pages without repeats or omissions and clamps after the result set shrinks", () => {
    const items = browse().items;
    const first = paginateCatalog(items, 1, 12);
    const last = paginateCatalog(items, 2, 12);
    expect(first).toMatchObject({
      page: 1,
      pages: 2,
      from: 1,
      to: 12,
      total: 13,
    });
    expect(last).toMatchObject({ page: 2, from: 13, to: 13 });
    expect([...first.items, ...last.items]).toEqual(items);
    expect(
      paginateCatalog(browse({ layout: "panorama" }).items, 2, 12),
    ).toMatchObject({ page: 1, pages: 1, total: 3 });
  });
  it("handles empty results and prevents unbounded page sizes", () => {
    expect(paginateCatalog([], 20, 12)).toMatchObject({
      page: 1,
      pages: 1,
      items: [],
      from: 0,
      to: 0,
    });
    expect(paginateCatalog(browse().items, -10, 1_000_000)).toMatchObject({
      page: 1,
      size: 12,
    });
    expect(paginateCatalog(browse().items, NaN, 24)).toMatchObject({
      page: 1,
      size: 24,
      total: 13,
    });
  });
  it("keeps navigation bounded and exposes both ends of a large catalog", () => {
    expect(catalogPageNumbers(1, 2)).toEqual([1, 2]);
    expect(catalogPageNumbers(42, 834)).toEqual([
      1,
      "gap",
      41,
      42,
      43,
      "gap",
      834,
    ]);
    expect(catalogPageNumbers(834, 834)).toEqual([
      1,
      "gap",
      831,
      832,
      833,
      834,
    ]);
  });
  it("filters and paginates 10,000 metadata entries with bounded page payloads", () => {
    const catalog: CatalogItem[] = Array.from({ length: 10_000 }, (_, i) => ({
      id: `design-${i}`,
      name: `Design ${i}`,
      description: "A blue ocean scene",
      note: "Editable",
      category: i % 2 ? "Editorial" : "Bold",
      layout: i % 4 ? "single" : "panorama",
      background: "solid",
      keywords: ["waves"],
    }));
    const index = createCatalogIndex(catalog);
    const result = queryCatalog(index, {
      ...defaultCatalogFilters,
      query: "blue waves",
      layout: "panorama",
      sort: "name-asc",
    });
    expect(result.items).toHaveLength(2500);
    expect(result.counts.All).toBe(2500);
    const pages = paginateCatalog(result.items, 1, 48).pages;
    const found = Array.from({ length: pages }, (_, i) => {
      const page = paginateCatalog(result.items, i + 1, 48);
      expect(page.items.length).toBeLessThanOrEqual(48);
      return page.items.map((item) => item.id);
    }).flat();
    expect(found).toEqual(
      catalog
        .filter((item) => item.layout === "panorama")
        .map((item) => item.id),
    );
    expect(new Set(found).size).toBe(2500);
  });
});
