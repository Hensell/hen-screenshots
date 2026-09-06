import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strToU8, unzipSync, zipSync } from "fflate";
import { createProject, createShot, LIMITS } from "../core/model";
import type { Asset } from "../core/model";
import { exportProject, importProject } from "./backup";

const imageBytes = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  ),
  (char) => char.charCodeAt(0),
);
const image = (): Asset => ({
  id: "original-asset",
  name: "screen.png",
  mime: "image/png",
  width: 1,
  height: 1,
  blob: new Blob([imageBytes], { type: "image/png" }),
});
const document = () => ({
  ...createProject("My app"),
  shots: [createShot("original-asset", 0), createShot("original-asset", 1)],
});
class FakeImage {
  naturalWidth = 1;
  naturalHeight = 1;
  decoding = "";
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.(new Event("load")));
  }
}
beforeEach(() => {
  vi.stubGlobal("Image", FakeImage);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function changedBackup(
  change: (metadata: any, files: Record<string, Uint8Array>) => void,
): Promise<File> {
  const blob = await exportProject(document(), [image()]);
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const metadata = JSON.parse(new TextDecoder().decode(files["project.json"]));
  change(metadata, files);
  files["project.json"] = strToU8(JSON.stringify(metadata));
  return new File(
    [new Uint8Array(zipSync(files, { level: 0 }))],
    "test.henscreenshots",
  );
}

describe("portable project backups", () => {
  it("round-trips original image bytes and styles, remaps every ID, and omits undo-only assets", async () => {
    const original = document();
    original.shots[1].style = { device: "ios", fit: "cover" };
    const blob = await exportProject(original, [
      image(),
      { ...image(), id: "unused-image" },
    ]);
    const restored = await importProject(
      new File([blob], "app.henscreenshots"),
    );
    expect(restored.revision).toBe(0);
    expect(restored.project.id).not.toBe(original.id);
    expect(restored.assets).toHaveLength(1);
    expect(restored.assets[0].id).not.toBe("original-asset");
    expect(restored.project.shots.map((shot) => shot.assetId)).toEqual([
      restored.assets[0].id,
      restored.assets[0].id,
    ]);
    expect(
      restored.project.shots.every(
        (shot, index) => shot.id !== original.shots[index].id,
      ),
    ).toBe(true);
    expect(restored.project.shots[1].style).toEqual({
      device: "ios",
      fit: "cover",
    });
    expect(new Uint8Array(await restored.assets[0].blob.arrayBuffer())).toEqual(
      imageBytes,
    );
    expect(restored.project.name).toBe(original.name);
  });
  it.each([
    [
      "unsupported version",
      (value: any) => {
        value.schemaVersion = 2;
      },
    ],
    [
      "unknown fields",
      (value: any) => {
        value.project.remoteUrl = "https://example.invalid";
      },
    ],
    [
      "malformed styles",
      (value: any) => {
        value.project.style.frame = "false";
      },
    ],
    [
      "invalid coordinates",
      (value: any) => {
        value.project.shots[0].phone.width = -1;
      },
    ],
    [
      "oversized project name",
      (value: any) => {
        value.project.name = "x".repeat(81);
      },
    ],
    [
      "oversized headline",
      (value: any) => {
        value.project.shots[0].title = "x".repeat(101);
      },
    ],
    [
      "oversized supporting text",
      (value: any) => {
        value.project.shots[0].subtitle = "x".repeat(151);
      },
    ],
    [
      "phone below width slider range",
      (value: any) => {
        value.project.shots[0].phone.width = 319;
      },
    ],
    [
      "phone above width slider range",
      (value: any) => {
        value.project.shots[0].phone.width = 901;
      },
    ],
    [
      "phone left of position slider range",
      (value: any) => {
        value.project.shots[0].phone.x = -201;
      },
    ],
    [
      "phone right of position slider range",
      (value: any) => {
        value.project.shots[0].phone.x = 901;
      },
    ],
    [
      "phone above vertical slider range",
      (value: any) => {
        value.project.shots[0].phone.y = 99;
      },
    ],
    [
      "phone below vertical slider range",
      (value: any) => {
        value.project.shots[0].phone.y = 1501;
      },
    ],
    [
      "missing image references",
      (value: any) => {
        value.project.shots[0].assetId = "missing";
      },
    ],
    [
      "duplicate shot IDs",
      (value: any) => {
        value.project.shots[1].id = value.project.shots[0].id;
      },
    ],
  ])("rejects %s before image decoding", async (_label, mutate) => {
    await expect(importProject(await changedBackup(mutate))).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("accepts the exact text and phone bounds exposed by the editor", async () => {
    const original = document();
    original.name = "N".repeat(80);
    original.shots[0].title = "T".repeat(100);
    original.shots[0].subtitle = "S".repeat(150);
    original.shots[0].phone = { width: 320, x: -200, y: 100 };
    original.shots[1].phone = { width: 900, x: 900, y: 1500 };
    const restored = await importProject(
      new File(
        [await exportProject(original, [image()])],
        "bounds.henscreenshots",
      ),
    );
    expect(restored.project.name).toBe(original.name);
    expect(
      restored.project.shots.map((shot) => ({
        title: shot.title,
        subtitle: shot.subtitle,
        phone: shot.phone,
      })),
    ).toEqual(
      original.shots.map((shot) => ({
        title: shot.title,
        subtitle: shot.subtitle,
        phone: shot.phone,
      })),
    );
  });
  it("rejects images whose real dimensions differ from the manifest", async () => {
    const file = await changedBackup((value) => {
      value.assets[0].width = 2;
    });
    await expect(importProject(file)).rejects.toThrow("do not match");
  });
  it("rejects unexpected paths and missing image bytes", async () => {
    const traversal = await changedBackup((_value, files) => {
      files["../secret"] = strToU8("not allowed");
    });
    await expect(importProject(traversal)).rejects.toThrow(
      "unsupported file path",
    );
    const missing = await changedBackup((value, files) => {
      delete files[value.assets[0].path];
    });
    await expect(importProject(missing)).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("rejects compressed bombs and forged oversized entries before extraction", async () => {
    const compressed = zipSync(
      { "project.json": new Uint8Array(1024 * 1024) },
      { level: 9 },
    );
    await expect(
      importProject(
        new File([new Uint8Array(compressed)], "bomb.henscreenshots"),
      ),
    ).rejects.toThrow("unsupported compression");
    const bytes = zipSync({ "project.json": strToU8("{}") }, { level: 0 });
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < bytes.length - 46; index++) {
      if (view.getUint32(index, true) === 0x02014b50) {
        view.setUint32(index + 20, LIMITS.assetBytes + 1, true);
        view.setUint32(index + 24, LIMITS.assetBytes + 1, true);
      }
    }
    await expect(
      importProject(
        new File([new Uint8Array(bytes)], "oversize.henscreenshots"),
      ),
    ).rejects.toThrow("size limit");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
