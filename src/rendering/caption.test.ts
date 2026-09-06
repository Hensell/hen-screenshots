import { describe, expect, it } from "vitest";
import { captionWords } from "./scene";

describe("caption word fitting", () => {
  it("measures a long word together with punctuation so its period cannot wrap alone", () => {
    expect(captionWords("Your app.\nA wider perspective.")).toEqual([
      "Your",
      "app.",
      "A",
      "wider",
      "perspective.",
    ]);
  });
  it("keeps contractions intact and handles multiple caption lines", () => {
    expect(captionWords("Your app’s story!\nBeautifully presented.")).toEqual([
      "Your",
      "app’s",
      "story!",
      "Beautifully",
      "presented.",
    ]);
  });
  it("allows natural word boundaries in text without spaces", () => {
    const words = captionWords("美しい写真を共有する");
    expect(words.length).toBeGreaterThan(1);
    expect(words.join("")).toBe("美しい写真を共有する");
  });
});
