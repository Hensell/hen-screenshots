import { afterEach, describe, expect, it, vi } from "vitest";

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function browser() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
  const window = Object.assign(new EventTarget(), { localStorage });
  vi.stubGlobal("window", window);
  const api = await import("./template-favorites");
  const key = (id: string) => `${api.TEMPLATE_FAVORITE_PREFIX}${id}`;
  const storageEvent = (key: string | null) =>
    window.dispatchEvent(Object.assign(new Event("storage"), { key }));
  const subscribe = (listener = vi.fn()) => {
    const stop = api.subscribeTemplateFavorites(listener);
    cleanups.push(stop);
    return stop;
  };
  return { api, values, localStorage, window, key, storageEvent, subscribe };
}

describe("template favorites", () => {
  it("persists individual favorites across fresh sessions without touching projects or preferences", async () => {
    const { api, values, key, subscribe } = await browser();
    values.set("hen.interface-language", "es");
    const stop = subscribe();
    api.setTemplateFavorite("boo", true);
    api.setTemplateFavorite("moonlight", true);
    expect(values.get(key("boo"))).toBe("1");
    expect(api.getTemplateFavorites().ids).toEqual(
      new Set(["boo", "moonlight"]),
    );
    api.setTemplateFavorite("boo", false);
    expect(values.has(key("boo"))).toBe(false);
    expect(values.get("hen.interface-language")).toBe("es");
    stop();
    vi.resetModules();
    const reopened = await import("./template-favorites");
    cleanups.push(reopened.subscribeTemplateFavorites(vi.fn()));
    expect(reopened.getTemplateFavorites()).toEqual({
      ids: new Set(["moonlight"]),
      sessionOnly: false,
    });
  });

  it("ignores unknown IDs, panorama ends and malformed stored values", async () => {
    const { api, values, key, subscribe } = await browser();
    values.set(key("not-a-template"), "1");
    values.set(key("moonlight-end"), "1");
    values.set(key("boo"), "true");
    values.set(key("cobweb"), "1");
    subscribe();
    expect(api.getTemplateFavorites().ids).toEqual(new Set(["cobweb"]));
    api.setTemplateFavorite("moonlight-end", false);
    expect(values.get(key("moonlight-end"))).toBe("1");
  });

  it("keeps changes from other tabs, responds to clearing storage, and maintains stable snapshots", async () => {
    const { api, values, key, storageEvent, subscribe } = await browser();
    const changed = vi.fn();
    subscribe(changed);
    api.setTemplateFavorite("boo", true);
    values.set(key("cobweb"), "1");
    // A separate key preserves a remote edit even before its storage event arrives.
    api.setTemplateFavorite("moonlight", true);
    expect(api.getTemplateFavorites().ids).toEqual(
      new Set(["boo", "cobweb", "moonlight"]),
    );
    const before = api.getTemplateFavorites();
    const calls = changed.mock.calls.length;
    storageEvent(key("cobweb"));
    expect(api.getTemplateFavorites()).toBe(before);
    expect(changed).toHaveBeenCalledTimes(calls);
    values.delete(key("boo"));
    storageEvent(key("boo"));
    expect(api.getTemplateFavorites().ids.has("boo")).toBe(false);
    values.clear();
    storageEvent(null);
    expect(api.getTemplateFavorites().ids.size).toBe(0);
  });

  it("retains session favorites when browser storage is denied and the library is reopened", async () => {
    const { api, window, subscribe } = await browser();
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("denied");
      },
    });
    const stop = subscribe();
    api.setTemplateFavorite("boo", true);
    expect(api.getTemplateFavorites()).toEqual({
      ids: new Set(["boo"]),
      sessionOnly: true,
    });
    stop();
    subscribe();
    expect(api.getTemplateFavorites().ids.has("boo")).toBe(true);
    api.setTemplateFavorite("boo", false);
    expect(api.getTemplateFavorites().ids.size).toBe(0);
  });

  it("shows write failures without losing stored favorites or undoing session removals", async () => {
    const { api, values, key, localStorage, storageEvent, subscribe } =
      await browser();
    values.set(key("cobweb"), "1");
    subscribe();
    localStorage.setItem.mockImplementation(() => {
      throw new Error("quota");
    });
    localStorage.removeItem.mockImplementation(() => {
      throw new Error("denied");
    });
    api.setTemplateFavorite("boo", true);
    api.setTemplateFavorite("cobweb", false);
    storageEvent(key("cobweb"));
    expect(api.getTemplateFavorites()).toEqual({
      ids: new Set(["boo"]),
      sessionOnly: true,
    });
    expect(values.get(key("cobweb"))).toBe("1");
  });
});
