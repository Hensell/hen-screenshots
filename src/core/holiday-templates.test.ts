import { describe, expect, it } from "vitest";
import { holidayTemplates } from "./holiday-templates";
import {
  defaultCatalogFilters,
  normalizeSearch,
  queryCatalog,
  templateCatalogIndex,
} from "./template-catalog";
import { messageCatalog, translateFor } from "../i18n/core";

const christmas = ["evergreen", "snowfall", "gift-wrap", "gingerbread"];
const newYear = ["midnight", "firework", "countdown", "first-light"];

describe("holiday template discovery", () => {
  it("finds both collections independently and combines them with appearance and favorites", () => {
    const find = (
      query: string,
      appearance = "all" as typeof defaultCatalogFilters.appearance,
    ) =>
      queryCatalog(templateCatalogIndex, {
        ...defaultCatalogFilters,
        query,
        appearance,
      }).items.map((item) => item.id);
    expect(find("Christmas")).toEqual(christmas);
    expect(find("December")).toEqual(christmas);
    expect(find("New Year")).toEqual(newYear);
    expect(find("January")).toEqual(newYear);
    expect(find("Christmas", "dark")).toEqual(["evergreen"]);
    expect(find("New Year", "dark")).toEqual(["midnight", "firework"]);
    expect(
      queryCatalog(
        templateCatalogIndex,
        { ...defaultCatalogFilters, query: "new year", favoritesOnly: true },
        new Set(["midnight", "snowfall"]),
      ).items.map((item) => item.id),
    ).toEqual(["midnight"]);
  });
  it("provides complete Spanish and Portuguese descriptions and motif labels", () => {
    for (const template of holidayTemplates) {
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
    }
  });
  it.each([
    ["es", "Navidad", christmas],
    ["es", "año nuevo", newYear],
    ["pt-BR", "Natal", christmas],
    ["pt-BR", "Ano Novo", newYear],
  ] as const)(
    "discovers %s seasonal keywords with the localized gallery index: %s",
    (locale, query, expected) => {
      const index = templateCatalogIndex.map((entry) => ({
        ...entry,
        text: `${entry.text} ${normalizeSearch((entry.item.keywords ?? []).map((key) => translateFor(locale, key)).join(" "))}`,
      }));
      expect(
        queryCatalog(index, { ...defaultCatalogFilters, query }).items.map(
          (item) => item.id,
        ),
      ).toEqual(expected);
    },
  );
});
