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
  it("combines favorites with search, appearance, categories and sorting without hiding category counts", () => {
    const favorites = new Set(["cobweb", "boo", "moonlight", "stale-id"]);
    const filtered = queryCatalog(
      templateCatalogIndex,
      {
        ...defaultCatalogFilters,
        favoritesOnly: true,
        query: "halloween",
        appearance: "dark",
        category: "Editorial",
        sort: "name-desc",
      },
      favorites,
    );
    expect(filtered.items.map((item) => item.id)).toEqual([
      "moonlight",
      "cobweb",
    ]);
    expect(filtered.counts).toEqual({
      All: 2,
      Bold: 0,
      Editorial: 2,
      Minimal: 0,
    });
    expect(
      queryCatalog(templateCatalogIndex, {
        ...defaultCatalogFilters,
        favoritesOnly: true,
      }).items,
    ).toEqual([]);
    expect(
      queryCatalog(templateCatalogIndex, defaultCatalogFilters, favorites)
        .items,
    ).toHaveLength(templates.length);
  });
  it("clamps a favorites page after its final item is removed", () => {
    const favorites = new Set(
      templates.slice(0, 13).map((template) => template.id),
    );
    const filters = { ...defaultCatalogFilters, favoritesOnly: true };
    const before = paginateCatalog(
      queryCatalog(templateCatalogIndex, filters, favorites).items,
      2,
      12,
    );
    expect(before).toMatchObject({ page: 2, pages: 2, total: 13 });
    favorites.delete(before.items[0].id);
    const after = paginateCatalog(
      queryCatalog(templateCatalogIndex, filters, favorites).items,
      2,
      12,
    );
    expect(after).toMatchObject({ page: 1, pages: 1, total: 12 });
    expect(after.items).toHaveLength(12);
  });
  it("finds the Halloween collection and combines seasonal searches with appearance and layout", () => {
    expect(ids({ query: "halloween" })).toEqual([
      "jack-o-lantern",
      "cobweb",
      "boo",
      "witching-hour",
      "candy-club",
      "moonlight",
    ]);
    expect(ids({ query: "october", appearance: "dark" })).toEqual([
      "cobweb",
      "witching-hour",
      "moonlight",
    ]);
    expect(ids({ query: "halloween", layout: "panorama" })).toEqual([
      "moonlight",
    ]);
  });
  it("finds patterns, colors and device positions in the new collection", () => {
    expect(ids({ query: "checker pink" })).toEqual(["mosaic", "cherry"]);
    expect(ids({ query: "stripes" })).toEqual(["zest", "cabana"]);
    expect(ids({ query: "left", appearance: "dark" })).toEqual([
      "contour",
      "blueprint",
    ]);
    expect(ids({ query: "diagonal clay", appearance: "light" })).toEqual([
      "terracotta",
    ]);
    expect(ids({ query: "pattern" })).toEqual([
      "mosaic",
      "zest",
      "cabana",
      "contour",
      "cherry",
      "terracotta",
      "blueprint",
      "stitch",
      "parade",
    ]);
  });
  it("combines dark appearance with composition, category, query and pagination", () => {
    expect(ids({ appearance: "dark" })).toEqual([
      "obsidian",
      "evergreen",
      "midnight",
      "firework",
      "handoff",
      "desktop-suite",
      "constellation",
      "cobweb",
      "witching-hour",
      "moonlight",
      "contour",
      "blueprint",
      "parade",
      "nocturne",
      "orbit",
      "carbon",
      "ember",
      "tidal",
      "spotlight",
      "halo",
    ]);
    expect(ids({ appearance: "dark", layout: "panorama" })).toEqual([
      "obsidian",
      "moonlight",
      "orbit",
      "tidal",
    ]);
    expect(ids({ appearance: "dark", category: "Minimal" })).toEqual([
      "carbon",
    ]);
    expect(ids({ appearance: "light", query: "orbit" })).toEqual([]);
    expect(
      paginateCatalog(browse({ appearance: "dark" }).items, 2, 12),
    ).toMatchObject({ page: 2, total: 20 });
    expect(ids({ appearance: "colorful", query: "peach" })).toEqual([
      "confetti",
    ]);
  });
  it("preserves curated order and indexes every real composition exactly once", () => {
    expect(ids({})).toEqual(templates.map((item) => item.id));
    expect(new Set(ids({})).size).toBe(templates.length);
    expect(browse().counts).toEqual({
      All: 57,
      Minimal: 12,
      Bold: 26,
      Editorial: 19,
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
      "atrium",
      "obsidian",
      "offset",
      "signal",
      "mosaic",
      "folio",
      "moonlight",
      "orbit",
      "daybreak",
      "tidal",
      "panorama",
    ]);
    expect(ids({ query: "no-such-template" })).toEqual([]);
    expect(normalizeSearch("  Café / ÉDITORIAL  ")).toBe("cafe editorial");
  });
  it("combines composition, background, category and query without filtering by the user's frame", () => {
    expect(ids({ layout: "panorama" })).toEqual([
      "atrium",
      "obsidian",
      "offset",
      "signal",
      "mosaic",
      "folio",
      "moonlight",
      "orbit",
      "daybreak",
      "tidal",
      "panorama",
    ]);
    expect(ids({ layout: "panorama", category: "Bold" })).toEqual([
      "offset",
      "signal",
      "mosaic",
      "orbit",
      "daybreak",
    ]);
    expect(
      ids({ layout: "single", background: "gradient", category: "Bold" }),
    ).toEqual(["prism", "spotlight", "tilt"]);
    expect(ids({ layout: "panorama", background: "gradient" })).toEqual([]);
    expect(
      ids({ query: "dark", layout: "single", background: "solid" }),
    ).toEqual([
      "evergreen",
      "midnight",
      "firework",
      "cobweb",
      "witching-hour",
      "contour",
      "blueprint",
      "parade",
      "nocturne",
      "carbon",
      "ember",
      "halo",
    ]);
  });
  it("shows category counts for the current query and other filters, independent of the selected category", () => {
    const { counts, items } = browse({ layout: "panorama", category: "Bold" });
    expect(counts).toEqual({ All: 11, Minimal: 1, Bold: 5, Editorial: 5 });
    expect(items).toHaveLength(5);
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
      "atrium",
      "bloom",
      "blueprint",
    ]);
    expect(ids({ sort: "name-desc" })[0]).toBe("zest");
    expect(ids({})).toEqual(templates.map((item) => item.id));
  });
});

describe("multi-device discovery", () => {
  it("finds exactly the eight combinations, independently of other compositions", () => {
    expect(ids({ layout: "multi-device" })).toEqual([
      "sidekick",
      "handoff",
      "companion",
      "duet",
      "workspace",
      "desktop-suite",
      "ecosystem",
      "constellation",
    ]);
    expect(
      ids({ layout: "multi-device", query: "desktop tablet mobile" }),
    ).toEqual(["ecosystem", "constellation"]);
    expect(
      ids({ layout: "multi-device", query: "tablet", appearance: "dark" }),
    ).toEqual(["desktop-suite", "constellation"]);
  });
});
describe("catalog pagination", () => {
  it("slices pages without repeats or omissions and clamps after the result set shrinks", () => {
    const items = browse().items;
    const first = paginateCatalog(items, 1, 12);
    const middle = paginateCatalog(items, 2, 12);
    const third = paginateCatalog(items, 3, 12);
    const fourth = paginateCatalog(items, 4, 12);
    const last = paginateCatalog(items, 5, 12);
    expect(first).toMatchObject({
      page: 1,
      pages: 5,
      from: 1,
      to: 12,
      total: 57,
    });
    expect(middle).toMatchObject({ page: 2, from: 13, to: 24 });
    expect(last).toMatchObject({ page: 5, from: 49, to: 57 });
    expect([
      ...first.items,
      ...middle.items,
      ...third.items,
      ...fourth.items,
      ...last.items,
    ]).toEqual(items);
    expect(
      paginateCatalog(browse({ layout: "panorama" }).items, 2, 12),
    ).toMatchObject({ page: 1, pages: 1, total: 11 });
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
      total: 57,
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
