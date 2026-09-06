import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strToU8, unzipSync, zipSync } from "fflate";
import { createProject, createShot, defaultStyle, LIMITS } from "../core/model";
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
    original.exportProfile = "apple-mac";
    original.style = {
      ...original.style,
      device: "laptop",
      deviceOrientation: "landscape",
      template: "spotlight",
      backgroundMode: "gradient",
      backgroundEnd: "#ABCDEF",
      accentColor: "#123456",
      texture: "dots",
      accentTitle: true,
      titleSize: 108,
    };
    original.shots[1].style = {
      device: "ipad",
      deviceOrientation: "portrait",
      fit: "cover",
      template: "tilt",
      backgroundMode: "solid",
      backgroundEnd: "#FEDCBA",
      accentColor: "#654321",
      texture: "none",
      accentTitle: false,
      titleSize: 60,
    };
    original.shots[0].phone.rotation = -11.5;
    original.shots[1].phone.rotation = 18;
    const blob = await exportProject(original, [
      image(),
      { ...image(), id: "unused-image" },
    ]);
    const restored = await importProject(
      new File([blob], "app.henscreenshots"),
    );
    expect(restored.revision).toBe(0);
    const archived = JSON.parse(
      new TextDecoder().decode(
        unzipSync(new Uint8Array(await blob.arrayBuffer()))["project.json"],
      ),
    );
    expect(archived.schemaVersion).toBe(4);
    expect(archived.project.schemaVersion).toBe(4);
    expect(restored.project.schemaVersion).toBe(4);
    expect(restored.project.style).toEqual(original.style);
    expect(restored.project.exportProfile).toBe("apple-mac");
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
    expect(restored.project.shots[1].style).toEqual(original.shots[1].style);
    expect(restored.project.shots.map((shot) => shot.phone)).toEqual(
      original.shots.map((shot) => shot.phone),
    );
    expect(new Uint8Array(await restored.assets[0].blob.arrayBuffer())).toEqual(
      imageBytes,
    );
    expect(restored.project.name).toBe(original.name);
  });
  it("restores a version 1 backup with classic defaults while preserving its original composition and image bytes", async () => {
    const file = await changedBackup((value) => {
      value.schemaVersion = value.project.schemaVersion = 1;
      delete value.project.exportProfile;
      delete value.project.customSize;
      delete value.project.style.deviceOrientation;
      for (const key of [
        "template",
        "backgroundMode",
        "backgroundEnd",
        "accentColor",
        "texture",
        "accentTitle",
        "titleSize",
      ])
        delete value.project.style[key];
      value.project.style.background = "#ACBD12";
      value.project.style.textColor = "#192837";
      value.project.style.align = "left";
      value.project.shots[0].title = "Keep my exact\noriginal headline";
      value.project.shots[0].subtitle = "Keep my original subtitle.";
      value.project.shots[0].style = { device: "ios", background: "#765432" };
      value.project.shots[0].phone = { x: 317, y: 603, width: 701 };
      delete value.project.shots[1].phone.rotation;
    });
    const restored = await importProject(file);
    expect(restored.project.schemaVersion).toBe(4);
    expect(restored.project.style).toEqual({
      ...defaultStyle,
      background: "#ACBD12",
      textColor: "#192837",
      align: "left",
    });
    expect(restored.project.shots[0]).toMatchObject({
      title: "Keep my exact\noriginal headline",
      subtitle: "Keep my original subtitle.",
      style: { device: "ios", background: "#765432" },
      phone: { x: 317, y: 603, width: 701, rotation: 0 },
    });
    expect(restored.project.shots[1].phone.rotation).toBe(0);
    expect(new Uint8Array(await restored.assets[0].blob.arrayBuffer())).toEqual(
      imageBytes,
    );
    const upgraded = await exportProject(restored.project, restored.assets);
    const upgradedMetadata = JSON.parse(
      new TextDecoder().decode(
        unzipSync(new Uint8Array(await upgraded.arrayBuffer()))["project.json"],
      ),
    );
    expect(upgradedMetadata.schemaVersion).toBe(4);
    expect(upgradedMetadata.project).toEqual(restored.project);
  });
  it("round-trips portfolio cards and custom dimensions, including a saved size while another preset is selected", async () => {
    const original = document();
    original.style.device = "card";
    original.customSize = { width: 3840, height: 960 };
    original.shots[0].phone.width = 32;
    for (const profile of [
      "portfolio-custom",
      "portfolio-card",
      "portfolio-square",
      "portfolio-portrait",
      "apple-mac",
    ] as const) {
      original.exportProfile = profile;
      const file = new File(
        [await exportProject(original, [image()])],
        "portfolio.henscreenshots",
      );
      const restored = await importProject(file);
      expect(restored.project.schemaVersion).toBe(4);
      expect(restored.project.exportProfile).toBe(profile);
      expect(restored.project.customSize).toEqual(original.customSize);
      expect(restored.project.style).toEqual(original.style);
      expect(restored.project.shots.map(({ phone }) => phone)).toEqual(
        original.shots.map(({ phone }) => phone),
      );
      expect(
        new Uint8Array(await restored.assets[0].blob.arrayBuffer()),
      ).toEqual(imageBytes);
    }
  });
  it("restores a version 3 backup with its tablet preset and composition intact", async () => {
    const file = await changedBackup((value) => {
      value.schemaVersion = value.project.schemaVersion = 3;
      delete value.project.customSize;
      value.project.exportProfile = "apple-ipad13-landscape";
      value.project.style.device = "ipad";
      value.project.style.deviceOrientation = "landscape";
      value.project.shots[0].phone = {
        x: -400,
        y: -200,
        width: 160,
        rotation: -15,
      };
    });
    const restored = await importProject(file);
    expect(restored.project.schemaVersion).toBe(4);
    expect(restored.project.exportProfile).toBe("apple-ipad13-landscape");
    expect(restored.project.customSize).toEqual({ width: 1600, height: 1200 });
    expect(restored.project.style).toMatchObject({
      device: "ipad",
      deviceOrientation: "landscape",
    });
    expect(restored.project.shots[0].phone).toEqual({
      x: -400,
      y: -200,
      width: 160,
      rotation: -15,
    });
  });
  it("validates the original schema 3 limits before migrating its backups", async () => {
    for (const mutate of [
      ...[
        "portfolio-custom",
        "portfolio-card",
        "portfolio-square",
        "portfolio-portrait",
      ].map((profile) => (project: any) => {
        project.exportProfile = profile;
      }),
      (project: any) => {
        project.style.device = "card";
      },
      (project: any) => {
        project.shots[0].style.device = "card";
      },
      (project: any) => {
        project.customSize = { width: 1600, height: 1200 };
      },
      (project: any) => {
        project.shots[0].phone.width = 159;
      },
    ]) {
      const file = await changedBackup((value) => {
        value.schemaVersion = value.project.schemaVersion = 3;
        delete value.project.customSize;
        mutate(value.project);
      });
      await expect(importProject(file)).rejects.toThrow();
    }
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    null,
    {},
    { width: 1600 },
    { width: 1600, height: 1200, depth: 1 },
    { width: 255, height: 1024 },
    { width: 1024, height: 255 },
    { width: 4097, height: 2048 },
    { width: 2048, height: 4097 },
    { width: 1000.5, height: 1000 },
    { width: "1600", height: 1200 },
    { width: 1025, height: 256 },
    { width: 256, height: 1025 },
  ])(
    "rejects malformed custom size %j before image decoding",
    async (customSize) => {
      await expect(
        importProject(
          await changedBackup((value) => {
            value.project.customSize = customSize;
          }),
        ),
      ).rejects.toThrow();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it("migrates a version 2 backup without changing templates, rotation, text, overrides or image bytes", async () => {
    let original: any;
    const file = await changedBackup((value) => {
      value.schemaVersion = value.project.schemaVersion = 2;
      delete value.project.exportProfile;
      delete value.project.customSize;
      delete value.project.style.deviceOrientation;
      value.project.style.template = "editorial";
      value.project.style.backgroundMode = "gradient";
      value.project.shots[0].style = {
        device: "ios",
        template: "tilt",
        titleSize: 112,
      };
      value.project.shots[0].phone = {
        x: 179,
        y: 638,
        width: 741,
        rotation: -9.25,
      };
      original = structuredClone(value.project);
    });
    const restored = await importProject(file);
    expect(restored.project.schemaVersion).toBe(4);
    expect(restored.project.exportProfile).toBe("play-phone-portrait");
    expect(restored.project.style).toEqual({
      ...original.style,
      deviceOrientation: "portrait",
    });
    expect(
      restored.project.shots.map(
        ({ id: _id, assetId: _asset, ...shot }) => shot,
      ),
    ).toEqual(
      original.shots.map(({ id: _id, assetId: _asset, ...shot }: any) => shot),
    );
    expect(new Uint8Array(await restored.assets[0].blob.arrayBuffer())).toEqual(
      imageBytes,
    );
    const updated = await exportProject(restored.project, restored.assets);
    const reopened = await importProject(
      new File([updated], "migrated.henscreenshots"),
    );
    expect(reopened.project.exportProfile).toBe("play-phone-portrait");
    expect(reopened.project.style).toEqual(restored.project.style);
  });
  it.each([1, 2])(
    "retains schema %s device and placement limits before migration",
    async (version) => {
      for (const mutate of [
        (value: any) => {
          value.style.device = "ipad";
        },
        (value: any) => {
          value.style.deviceOrientation = "landscape";
        },
        (value: any) => {
          value.exportProfile = "apple-mac";
        },
        (value: any) => {
          value.shots[0].phone.width = 901;
        },
        (value: any) => {
          value.shots[0].phone.width = 319;
        },
        (value: any) => {
          value.shots[0].phone.x = -201;
        },
        (value: any) => {
          value.shots[0].phone.x = 901;
        },
        (value: any) => {
          value.shots[0].phone.y = 99;
        },
        (value: any) => {
          value.shots[0].phone.y = 1501;
        },
      ]) {
        const file = await changedBackup((value) => {
          value.schemaVersion = value.project.schemaVersion = version;
          delete value.project.exportProfile;
          delete value.project.customSize;
          delete value.project.style.deviceOrientation;
          if (version === 1) {
            for (const key of [
              "template",
              "backgroundMode",
              "backgroundEnd",
              "accentColor",
              "texture",
              "accentTitle",
              "titleSize",
            ])
              delete value.project.style[key];
            for (const shot of value.project.shots) delete shot.phone.rotation;
          }
          mutate(value.project);
        });
        await expect(importProject(file)).rejects.toThrow();
      }
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it.each([undefined, "", "apple-watch", { width: 2880, height: 1800 }])(
    "rejects missing or unsupported export preset %j",
    async (exportProfile) => {
      const file = await changedBackup((value) => {
        value.project.exportProfile = exportProfile;
      });
      await expect(importProject(file)).rejects.toThrow();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it.each(["template", "rotation", "missing background"])(
    "still validates the original schema before migrating version 1 backups: %s",
    async (problem) => {
      const file = await changedBackup((value) => {
        value.schemaVersion = value.project.schemaVersion = 1;
        delete value.project.exportProfile;
        delete value.project.customSize;
        delete value.project.style.deviceOrientation;
        for (const key of [
          "template",
          "backgroundMode",
          "backgroundEnd",
          "accentColor",
          "texture",
          "accentTitle",
          "titleSize",
        ])
          delete value.project.style[key];
        for (const shot of value.project.shots) delete shot.phone.rotation;
        if (problem === "template")
          value.project.shots[0].style.template = "spotlight";
        else if (problem === "rotation")
          value.project.shots[0].phone.rotation = 0;
        else delete value.project.style.background;
      });
      await expect(importProject(file)).rejects.toThrow();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it.each([
    [
      "unsupported version",
      (value: any) => {
        value.schemaVersion = 5;
      },
    ],
    [
      "future project version",
      (value: any) => {
        value.project.schemaVersion = 5;
      },
    ],
    [
      "mismatched envelope and project versions",
      (value: any) => {
        value.schemaVersion = 1;
      },
    ],
    [
      "legacy project under a version 4 envelope",
      (value: any) => {
        value.project.schemaVersion = 1;
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
      "empty project name",
      (value: any) => {
        value.project.name = "";
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
        value.project.shots[0].phone.width = 31;
      },
    ],
    [
      "phone above width slider range",
      (value: any) => {
        value.project.shots[0].phone.width = 2161;
      },
    ],
    [
      "phone left of position slider range",
      (value: any) => {
        value.project.shots[0].phone.x = -1081;
      },
    ],
    [
      "phone right of position slider range",
      (value: any) => {
        value.project.shots[0].phone.x = 2161;
      },
    ],
    [
      "phone above vertical slider range",
      (value: any) => {
        value.project.shots[0].phone.y = -2161;
      },
    ],
    [
      "phone below vertical slider range",
      (value: any) => {
        value.project.shots[0].phone.y = 4097;
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
  it.each([
    ["device", "watch"],
    ["deviceOrientation", "diagonal"],
    ["deviceOrientation", null],
    ["template", "unrecognized"],
    ["template", ""],
    ["backgroundMode", "radial"],
    ["backgroundEnd", "#FFF"],
    ["backgroundEnd", "red"],
    ["accentColor", "#12345678"],
    ["accentColor", "#GGGGGG"],
    ["texture", "noise"],
    ["accentTitle", 1],
    ["accentTitle", "true"],
    ["titleSize", 47.9],
    ["titleSize", 132.1],
    ["titleSize", "84"],
    ["titleSize", null],
  ])(
    "rejects invalid template field %s = %j in full styles and overrides",
    async (key, invalid) => {
      for (const target of ["project", "shot"]) {
        const file = await changedBackup((value) => {
          const style =
            target === "project"
              ? value.project.style
              : value.project.shots[0].style;
          style[String(key)] = invalid;
        });
        await expect(importProject(file)).rejects.toThrow();
      }
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it.each([
    "template",
    "backgroundMode",
    "backgroundEnd",
    "accentColor",
    "texture",
    "accentTitle",
    "titleSize",
    "deviceOrientation",
  ])("requires %s in version 4 project styles", async (key) => {
    const file = await changedBackup((value) => {
      delete value.project.style[key];
    });
    await expect(importProject(file)).rejects.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it.each([-20.1, 20.1, "0", null, undefined])(
    "rejects invalid or missing rotation %j",
    async (rotation) => {
      const file = await changedBackup((value) => {
        value.project.shots[0].phone.rotation = rotation;
      });
      await expect(importProject(file)).rejects.toThrow();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    },
  );
  it("accepts the exact text and phone bounds exposed by the editor", async () => {
    const original = document();
    original.name = "N".repeat(80);
    original.shots[0].title = "T".repeat(100);
    original.shots[0].subtitle = "S".repeat(150);
    original.shots[0].phone = { width: 32, x: -1080, y: -2160, rotation: -20 };
    original.shots[1].phone = { width: 2160, x: 2160, y: 4096, rotation: 20 };
    original.style.titleSize = 48;
    original.shots[1].style.titleSize = 132;
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
