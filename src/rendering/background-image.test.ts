import "konva/skia-backend";
import Konva from "konva";
import { Canvas } from "skia-canvas";
import { describe, expect, it } from "vitest";
import { createProject } from "../core/model";
import { addEmptySlide } from "../core/slides";
import { applyTemplate } from "../core/templates";
import { createScene } from "./scene";

describe("background image artwork", () => {
  it("places the background behind the editable design and exports panorama crops as one continuous image", () => {
    const source = new Canvas(2160, 1920);
    const context = source.getContext("2d");
    context.fillStyle = "#fe0000";
    context.fillRect(0, 0, 1080, 1920);
    context.fillStyle = "#0000fe";
    context.fillRect(1080, 0, 1080, 1920);
    Object.assign(source, {
      complete: true,
      naturalWidth: 2160,
      naturalHeight: 1920,
    });
    const image = source as unknown as HTMLImageElement;
    const project = createProject();
    addEmptySlide(project);
    applyTemplate(project, project.shots[0].id, "panorama", false);
    project.shots.forEach((shot) => {
      shot.title = "";
      shot.subtitle = "";
      shot.backgroundImage = { assetId: "art", fit: "cover", opacity: 1 };
    });
    const colors = project.shots.map((shot, index) => {
      const layer = createScene(project, shot, undefined, {
        images: new Map([["art", image]]),
      });
      try {
        const background = layer.findOne<Konva.Image>(".background-image")!;
        expect(background.x()).toBe(index === 0 ? 0 : -1080);
        expect(background.width()).toBe(2160);
        const canvas = layer.toCanvas({
          x: 0,
          y: 0,
          width: 1080,
          height: 1920,
          pixelRatio: 0.1,
        });
        return Array.from(
          canvas.getContext("2d")!.getImageData(30, 30, 1, 1).data,
        );
      } finally {
        layer.destroy();
      }
    });
    expect(colors).toEqual([
      [254, 0, 0, 255],
      [0, 0, 254, 255],
    ]);
    expect(() => createScene(project, project.shots[0], undefined)).toThrow(
      /background image/,
    );
  });
});
