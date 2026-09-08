import { describe, expect, it } from "vitest";
import { filename } from "./download";

describe("portable download filenames", () => {
  it.each([
    ["Pequeños hábitos", "Pequenos-habitos"],
    ["Crème brûlée", "Creme-brulee"],
    ["Cafe\u0301", "Cafe"],
    ["../ My app / title", "My-app-title"],
    ["✨", "hen-screenshots"],
  ])("normalizes %s without splitting accented words", (name, expected) => {
    expect(filename(name)).toBe(expected);
  });
});
