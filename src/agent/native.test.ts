import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import sharp from "sharp";
import { unzipSync } from "fflate";
import { decodeNativeImages, localPath, readLocalFile } from "./files";
import { buildDesign, parseDesignSpec } from "./spec";
import { loadNativeFonts, renderNativeShot, writeDesign } from "./render";
import { importProject } from "../storage/backup";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((d) => rm(d, { recursive: true, force: true })),
  );
});
const png = async () =>
  new File(
    [
      new Uint8Array(
        await sharp({
          create: {
            width: 100,
            height: 180,
            channels: 4,
            background: "#427C60",
          },
        })
          .png()
          .toBuffer(),
      ),
    ],
    "capture.png",
  );
const fonts = resolve("brand/fonts");

describe("native image and project boundary", () => {
  it("keeps fine screenshot details smooth when a device is reduced and tilted", async () => {
    const stripes = Buffer.alloc(1024 * 1024 * 3);
    for (let i = 0; i < stripes.length; i++)
      stripes[i] = Math.floor(i / 3) % 2 ? 255 : 0;
    const bytes = await sharp(stripes, {
      raw: { width: 1024, height: 1024, channels: 3 },
    })
      .png()
      .toBuffer();
    const [asset] = await decodeNativeImages([
      new File([new Uint8Array(bytes)], "fine-detail.png"),
    ]);
    const project = buildDesign(
      parseDesignSpec({
        version: 1,
        name: "Sampling test",
        profile: "portfolio-custom",
        customSize: { width: 320, height: 320 },
        device: "card",
        slides: [
          {
            image: "fine-detail.png",
            title: "",
            style: { frame: false },
            placement: { x: 0, y: 0, width: 1080, rotation: 8 },
          },
        ],
      }),
      new Map([["fine-detail.png", asset]]),
    );
    loadNativeFonts(fonts);
    const output = await renderNativeShot(
      project,
      project.shots[0],
      new Map([[asset.id, asset]]),
    );
    const detail = await sharp(output)
      .extract({ left: 140, top: 75, width: 20, height: 20 })
      .toBuffer();
    const stats = await sharp(detail).stats();
    expect(stats.channels[0].mean).toBeGreaterThan(120);
    expect(stats.channels[0].mean).toBeLessThan(136);
    expect(stats.channels[0].stdev).toBeLessThan(5);
  });
  it("fully decodes image data, applies EXIF rotation, and rejects disguised formats", async () => {
    const jpeg = await sharp({
      create: { width: 100, height: 180, channels: 3, background: "#123456" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const [image] = await decodeNativeImages([
      new File([new Uint8Array(jpeg)], "rotated.jpg"),
    ]);
    expect(image).toMatchObject({
      width: 180,
      height: 100,
      mime: "image/jpeg",
    });
    await expect(
      decodeNativeImages([new File(["<svg/>"], "fake.png")]),
    ).rejects.toThrow(/fake.png/);
    const valid = new Uint8Array(await (await png()).arrayBuffer());
    await expect(
      decodeNativeImages([new File([valid.slice(0, 30)], "truncated.png")]),
    ).rejects.toThrow(/truncated.png/);
    expect(() => localPath("https://example.com/file.png", "/tmp")).toThrow(
      /local/,
    );
  });
  // Several native renders plus archive I/O can exceed 5s on shared CI workers.
  it("preserves native export pixels across a portable project round trip", async () => {
    const assets = await decodeNativeImages([await png()]);
    const project = buildDesign(
      parseDesignSpec({
        version: 1,
        name: "Native test",
        profile: "portfolio-custom",
        customSize: { width: 320, height: 400 },
        template: "panorama",
        slides: [
          {
            image: "capture.png",
            title: "Left",
            translations: { es: { title: "Izquierda" } },
            continuation: {
              title: "Right",
              translations: { es: { title: "Derecha" } },
            },
          },
        ],
      }),
      new Map([["capture.png", assets[0]]]),
    );
    const directory = await mkdtemp(join(tmpdir(), "hen-native-"));
    directories.push(directory);
    const report = await writeDesign(project, assets, directory, fonts);
    expect(report).toMatchObject({
      width: 320,
      height: 400,
      languages: ["en", "es"],
    });
    expect(report.files).toHaveLength(4);
    const original = await readFile(join(directory, "en/01.png"));
    // PNG IHDR color type 2 = RGB without an alpha channel.
    expect(original[25]).toBe(2);
    expect(await sharp(original).metadata()).toMatchObject({
      width: 320,
      height: 400,
      channels: 3,
    });
    expect(
      Object.keys(
        unzipSync(await readFile(join(directory, "screenshots.zip"))),
      ),
    ).toEqual(["en/01.png", "en/02.png", "es/01.png", "es/02.png"]);
    const restored = await importProject(
      await readLocalFile(
        join(directory, "project.henscreenshots"),
        1024 * 1024,
      ),
      decodeNativeImages,
    );
    expect(restored.project.shots[1].translations!.es.title).toBe("Derecha");
    loadNativeFonts(fonts);
    const rerendered = await renderNativeShot(
      restored.project,
      restored.project.shots[0],
      new Map(restored.assets.map((a) => [a.id, a])),
    );
    expect(await sharp(rerendered).raw().toBuffer()).toEqual(
      await sharp(original).raw().toBuffer(),
    );
  }, 15_000);
});
