import { addOverlay } from "../core/overlays";
import { setDeviceImage } from "../core/device-composition";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unzipSync } from "fflate";
import { createProject, createShot, type Asset } from "../core/model";
import { addLanguage, localContent } from "../core/localization";
import { applyTemplate } from "../core/templates";
import { loadImage } from "../assets/import";
import { renderShot } from "./images";
import { buildScreenshotExport } from "./screenshots";

vi.mock("./images", () => ({ renderShot: vi.fn() }));
vi.mock("../assets/import", () => ({ loadImage: vi.fn() }));
const image = { naturalWidth: 100, naturalHeight: 200 } as HTMLImageElement;
const asset = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 100,
  height: 200,
  blob: new Blob([id]),
});
const fixture = () => {
  const project = createProject("Export QA");
  project.shots = [createShot("a", 0), createShot("b", 1)];
  return {
    project,
    assets: [asset("a"), asset("b")],
    images: new Map([
      ["a", image],
      ["b", image],
    ]),
    shotId: project.shots[0].id,
    all: false,
    locale: null,
    signal: new AbortController().signal,
    onProgress: vi.fn(),
  };
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadImage).mockResolvedValue(image);
  vi.mocked(renderShot).mockImplementation(
    async (_project, shot) =>
      new Blob([`${shot.title}|${shot.assetId}`], { type: "image/png" }),
  );
});

describe("screenshot export workflow", () => {
  it("decodes overlays from both panorama halves in every language and rejects missing logos", async () => {
    const input = fixture();
    applyTemplate(input.project, input.shotId, "panorama");
    addLanguage(input.project, "en", "es");
    const logo = asset("logo"),
      badge = asset("badge");
    input.assets.push(logo, badge);
    addOverlay(input.project, input.project.shots[0], logo);
    addOverlay(input.project, input.project.shots[1], badge);
    await buildScreenshotExport({ ...input, languageCodes: ["en", "es"] });
    expect(renderShot).toHaveBeenCalledTimes(4);
    for (const call of vi.mocked(renderShot).mock.calls) {
      expect(call[3]?.get("logo")).toBe(image);
      expect(call[3]?.get("badge")).toBe(image);
    }
    input.assets = input.assets.filter((a) => a.id !== "badge");
    await expect(buildScreenshotExport(input)).rejects.toThrow(
      "screenshot 1 is missing",
    );
  });

  it("decodes every device and renders each language with its own companion image", async () => {
    const input = fixture(),
      shot = input.project.shots[0];
    applyTemplate(input.project, shot.id, "ecosystem");
    addLanguage(input.project, "en", "es");
    setDeviceImage(shot, "device:secondary", "tablet", null);
    setDeviceImage(shot, "device:tertiary", "phone", null);
    setDeviceImage(shot, "device:secondary", "tablet-es", "es");
    input.assets.push(...["tablet", "phone", "tablet-es"].map(asset));
    await buildScreenshotExport({ ...input, languageCodes: ["en", "es"] });
    const calls = vi.mocked(renderShot).mock.calls;
    expect(calls).toHaveLength(2);
    expect(
      calls.map((call) => call[1].companions!.map((device) => device.assetId)),
    ).toEqual([
      ["tablet", "phone"],
      ["tablet-es", "phone"],
    ]);
    for (const call of calls)
      for (const device of call[1].companions!)
        expect(call[3]?.get(device.assetId)).toBe(image);
    expect(loadImage).toHaveBeenCalledTimes(4);
    expect(calls[0][3]).not.toBe(calls[1][3]);
    expect(calls[0][3]?.size).toBe(3);
    expect(calls[0][3]?.has("tablet-es")).toBe(false);
    input.assets = input.assets.filter((asset) => asset.id !== "phone");
    await expect(buildScreenshotExport(input)).rejects.toThrow(
      "screenshot 1 is missing",
    );
  });
  it("exports the selected original PNG with its series position", async () => {
    const input = fixture();
    input.shotId = input.project.shots[1].id;
    const result = await buildScreenshotExport(input);
    expect(result.name).toBe("Export-QA-play-phone-portrait-02.png");
    expect(result.blob.type).toBe("image/png");
    expect(await result.blob.text()).toBe(`${input.project.shots[1].title}|b`);
    expect(renderShot).toHaveBeenCalledTimes(1);
    expect(loadImage).not.toHaveBeenCalled();
  });
  it("exports both panorama halves in one folder per language, with localized captures", async () => {
    const input = fixture();
    applyTemplate(input.project, input.shotId, "panorama");
    addLanguage(input.project, "en", "es");
    input.assets.push(asset("spanish"));
    input.project.shots.forEach((shot, index) => {
      Object.assign(localContent(shot, "es"), {
        title: `Hábitos ${index + 1}`,
        assetId: "spanish",
      });
    });
    const original = structuredClone(input.project);
    const result = await buildScreenshotExport({
      ...input,
      languageCodes: ["en", "es"],
    });
    const files = unzipSync(new Uint8Array(await result.blob.arrayBuffer()));
    expect(result.name).toBe(
      "Export-QA-play-phone-portrait-selection-languages.zip",
    );
    expect(Object.keys(files)).toHaveLength(4);
    expect(
      Object.keys(files).filter((name) => name.startsWith("en/")),
    ).toHaveLength(2);
    expect(new TextDecoder().decode(files["es/01-Habitos-1.png"])).toBe(
      "Hábitos 1|spanish",
    );
    expect(new TextDecoder().decode(files["es/02-Habitos-2.png"])).toBe(
      "Hábitos 2|spanish",
    );
    expect(input.project).toEqual(original);
  });
  it("keeps one revision if the live project changes while rendering", async () => {
    const input = fixture();
    const title = input.project.shots[0].title;
    input.onProgress.mockImplementationOnce(() => {
      input.project.name = "Changed";
      input.project.shots[0].title = "Changed caption";
      input.project.shots[0].phone.x += 100;
    });
    const result = await buildScreenshotExport(input);
    expect(result.name).toBe("Export-QA-play-phone-portrait-01.png");
    expect(await result.blob.text()).toBe(`${title}|a`);
  });
  it("does not render when canceled during image decoding", async () => {
    const input = fixture();
    input.images.clear();
    const controller = new AbortController();
    vi.mocked(loadImage).mockImplementationOnce(async () => {
      controller.abort();
      return image;
    });
    await expect(
      buildScreenshotExport({ ...input, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(renderShot).not.toHaveBeenCalled();
  });
  it("does not package or return a partial file after cancellation during rendering", async () => {
    const input = fixture();
    const controller = new AbortController();
    vi.mocked(renderShot).mockImplementationOnce(async () => {
      controller.abort();
      return new Blob(["PNG"]);
    });
    await expect(
      buildScreenshotExport({ ...input, all: true, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(renderShot).toHaveBeenCalledTimes(1);
    expect(input.onProgress).not.toHaveBeenCalledWith("Packaging screenshots…");
  });
  it("enforces the store series cap before decoding or rendering", async () => {
    const input = fixture();
    input.project.shots = Array.from({ length: 9 }, (_, i) =>
      createShot("a", i),
    );
    await expect(
      buildScreenshotExport({ ...input, all: true }),
    ).rejects.toThrow("at most 8");
    expect(renderShot).not.toHaveBeenCalled();
    expect(loadImage).not.toHaveBeenCalled();
  });
  it("reports missing source images without returning a partial archive", async () => {
    const input = fixture();
    input.assets = [asset("a")];
    await expect(
      buildScreenshotExport({ ...input, all: true }),
    ).rejects.toThrow("screenshot 2 is missing");
  });
  it("enforces the archive memory budget", async () => {
    const oversized = new Blob(["PNG"]);
    Object.defineProperty(oversized, "size", { value: 251 * 1024 * 1024 });
    vi.mocked(renderShot).mockResolvedValue(oversized);
    await expect(
      buildScreenshotExport({ ...fixture(), all: true }),
    ).rejects.toThrow("too large");
  });
});
