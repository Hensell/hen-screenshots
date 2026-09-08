import { afterEach, describe, expect, it, vi } from "vitest";
import { createProject, createShot } from "../core/model";
import {
  detectInterfaceLocale,
  interpolate,
  messageCatalog,
  translateFor,
} from "./core";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("interface translation", () => {
  it("detects supported browser preferences, including regional variants", () => {
    expect(detectInterfaceLocale(["es-NI", "en"])).toBe("es");
    expect(detectInterfaceLocale(["fr", "pt-PT", "en"])).toBe("pt-BR");
    expect(detectInterfaceLocale(["en-GB", "es"])).toBe("en");
    expect(detectInterfaceLocale(["de"])).toBe("en");
    expect(detectInterfaceLocale([])).toBe("en");
  });
  it("provides both translations with the same interpolation fields", () => {
    const fields = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const [source, translations] of Object.entries(messageCatalog)) {
      expect(translations, source).toHaveLength(2);
      for (const target of translations) {
        expect(target.trim(), source).not.toBe("");
        expect(fields(target), source).toEqual(fields(source));
      }
    }
  });
  it("preserves dynamic user text verbatim and safely falls back for unknown messages", () => {
    const title = "Cancel {count} <b>my app</b> $&";
    expect(
      translateFor("es", "Select screenshot {number}: {title}", {
        number: 3,
        title,
      }),
    ).toContain(title);
    expect(interpolate("{name} / {count}", { name: "$&", count: 0 })).toBe(
      "$& / 0",
    );
    expect(translateFor("pt-BR", "Unknown engine detail")).toBe(
      "Unknown engine detail",
    );
    expect(translateFor("es", "constructor")).toBe("constructor");
  });
  it("translates full async messages without modifying their interpolated names", () => {
    expect(
      translateFor("es", "3 screenshots added. Start with the headline."),
    ).not.toContain("screenshots added");
    expect(translateFor("pt-BR", "Rendering 2 of 3…")).not.toContain(
      "Rendering",
    );
    expect(
      translateFor("es", "Translating slide 2 of 3 · pass 1 of 2…"),
    ).not.toContain("pass");
    expect(
      translateFor(
        "pt-BR",
        "Screenshot export failed. The browser did not create a valid PNG.",
      ),
    ).not.toContain("The browser");
    expect(
      translateFor("es", "Couldn't open local projects. Storage unavailable"),
    ).toBe("No se pudieron abrir los proyectos locales. Storage unavailable");
  });
});

function browser(preference: string | null, denied = false) {
  const values = new Map(
    preference ? [["hen.interface-language", preference]] : [],
  );
  const localStorage = {
    getItem: vi.fn((key: string) => {
      if (denied) throw new Error("denied");
      return values.get(key) ?? null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (denied) throw new Error("denied");
      values.set(key, value);
    }),
  };
  const window = Object.assign(new EventTarget(), { localStorage });
  const document = { documentElement: { lang: "en" } };
  vi.stubGlobal("window", window);
  vi.stubGlobal("document", document);
  vi.stubGlobal("navigator", { languages: ["pt-PT", "en"], language: "pt-PT" });
  return { window, document, localStorage };
}
describe("interface preference", () => {
  it("prefers saved selection, persists a change and leaves project languages/content untouched", async () => {
    const page = browser("es");
    const api = await import("./core");
    api.initializeInterfaceLocale();
    expect(api.getInterfaceLocale()).toBe("es");
    expect(page.document.documentElement.lang).toBe("es");
    const project = createProject("My English app");
    project.shots = [createShot("source", 0)];
    project.localization = { source: "en", targets: ["es"] };
    const before = JSON.stringify(project);
    const listener = vi.fn();
    const unsubscribe = api.subscribeInterfaceLocale(listener);
    api.setInterfaceLocale("pt-BR");
    expect(page.localStorage.setItem).toHaveBeenCalledWith(
      api.INTERFACE_LANGUAGE_KEY,
      "pt-BR",
    );
    expect(listener).toHaveBeenCalledOnce();
    expect(page.document.documentElement.lang).toBe("pt-BR");
    expect(JSON.stringify(project)).toBe(before);
    unsubscribe();
    api.setInterfaceLocale("en");
    expect(listener).toHaveBeenCalledOnce();
  });
  it("works with unavailable storage using the browser language and session selection", async () => {
    const page = browser(null, true);
    const api = await import("./core");
    api.initializeInterfaceLocale();
    expect(api.getInterfaceLocale()).toBe("pt-BR");
    expect(() => api.setInterfaceLocale("es")).not.toThrow();
    expect(page.document.documentElement.lang).toBe("es");
  });
  it("synchronizes explicit choices from other tabs and ignores invalid saved preferences", async () => {
    const page = browser("invalid");
    const api = await import("./core");
    api.initializeInterfaceLocale();
    expect(api.getInterfaceLocale()).toBe("pt-BR");
    page.window.dispatchEvent(
      Object.assign(new Event("storage"), {
        key: api.INTERFACE_LANGUAGE_KEY,
        newValue: "en",
      }),
    );
    expect(api.getInterfaceLocale()).toBe("en");
    expect(page.localStorage.setItem).not.toHaveBeenCalled();
  });
});
