import { describe, expect, it } from "vitest";
import { collectionPanoramaTemplates } from "./panorama-collection";
import {
  defaultCatalogFilters,
  normalizeSearch,
  queryCatalog,
  templateCatalogIndex,
} from "./template-catalog";
import { messageCatalog, translateFor } from "../i18n/core";

describe("panorama collection discovery", () => {
  it("finds the isometric scenes and combines perspective with appearance and favorites", () => {
    const filters = {
      ...defaultCatalogFilters,
      layout: "panorama" as const,
      query: "3D",
    };
    expect(
      queryCatalog(templateCatalogIndex, filters).items.map((t) => t.id),
    ).toEqual(["atrium", "obsidian", "offset"]);
    expect(
      queryCatalog(templateCatalogIndex, {
        ...filters,
        appearance: "dark",
      }).items.map((t) => t.id),
    ).toEqual(["obsidian"]);
    expect(
      queryCatalog(
        templateCatalogIndex,
        { ...filters, favoritesOnly: true },
        new Set(["offset", "folio"]),
      ).items.map((t) => t.id),
    ).toEqual(["offset"]);
  });
  it("provides Spanish and Portuguese descriptions and labels for every new scene", () => {
    for (const template of collectionPanoramaTemplates)
      for (const source of [
        template.description,
        template.note,
        template.surfaceLabel!,
      ]) {
        expect(
          messageCatalog[source],
          `${template.name}: ${source}`,
        ).toHaveLength(2);
        for (const locale of ["es", "pt-BR"] as const)
          expect(translateFor(locale, source)).not.toBe(source);
      }
  });
  it.each(["es", "pt-BR"] as const)(
    "discovers perspective in the %s gallery",
    (locale) => {
      const index = templateCatalogIndex.map((entry) => ({
        ...entry,
        text: `${entry.text} ${normalizeSearch((entry.item.keywords ?? []).map((key) => translateFor(locale, key)).join(" "))}`,
      }));
      expect(
        queryCatalog(index, {
          ...defaultCatalogFilters,
          query: "perspectiva",
          layout: "panorama",
        }).items.map((t) => t.id),
      ).toEqual(["atrium", "obsidian", "offset"]);
    },
  );
});
