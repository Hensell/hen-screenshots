// Rebuild the share cards from the same fonts, mark, and real exports as the landing.
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
await mkdir("public/social", { recursive: true });
const fontfile = "brand/fonts/Manrope.ttf";
const paper = "#F6F4ED",
  ink = "#202725",
  clay = "#B64C35";
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const svg = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${body}</svg>`,
  );
const text = async (value, x, y, size, color = ink, weight = 500) => ({
  input: await sharp({
    text: {
      text: `<span foreground="${color}" weight="${weight}">${escape(value)}</span>`,
      font: `Manrope ${size}`,
      fontfile,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer(),
  left: x,
  top: y,
});
const dark = await sharp("public/examples/halo.webp")
  .resize(224)
  .rotate(-7, { background: "#00000000" })
  .png()
  .toBuffer();
const light = await sharp("public/examples/studio.webp")
  .resize(224)
  .rotate(7, { background: "#00000000" })
  .png()
  .toBuffer();
const mark = await sharp(await readFile("brand/mark.svg"))
  .resize(48, 48)
  .png()
  .toBuffer();
for (const [locale, lines, description, free] of [
  [
    "en",
    ["Your app.", "Beautifully", "presented."],
    "App screenshots. Portfolio mockups.\nFree caption translations.",
    "Free forever. No watermarks.",
  ],
  [
    "es",
    ["Tu app.", "Presentada", "con estilo."],
    "Capturas de apps. Mockups para portafolios.\nTraducción de textos gratis.",
    "Gratis para siempre. Sin marcas de agua.",
  ],
  [
    "pt-br",
    ["Seu app.", "Apresentado", "com estilo."],
    "Capturas de apps. Mockups para portfólios.\nTradução de textos grátis.",
    "Grátis para sempre. Sem marcas-d’água.",
  ],
]) {
  const layers = [
    {
      input: svg(
        `<rect width="1200" height="630" fill="${paper}"/><rect x="600" y="24" width="576" height="582" rx="8" fill="#E3E8DD"/><path d="M56 558H554" stroke="#D5D9CF"/>`,
      ),
      left: 0,
      top: 0,
    },
    { input: mark, left: 51, top: 51 },
    await text("hen screenshots", 113, 59, 25, ink, 750),
  ];
  for (const [i, line] of lines.entries())
    layers.push(
      await text(line, 56, 158 + i * 71, 62, i === 1 ? clay : ink, 700),
    );
  layers.push(
    await text(description, 58, 402, 19, ink, 500),
    await text(free, 58, 502, 17, clay, 750),
    await text("screenshots.hensell.dev", 58, 582, 16, ink, 650),
    { input: dark, left: 620, top: 112 },
    { input: light, left: 872, top: 161 },
  );
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: paper },
  })
    .composite(layers)
    .flatten({ background: paper })
    .png({ compressionLevel: 9 })
    .toFile(`public/social/hen-screenshots-${locale}.png`);
}
for (const [size, name] of [
  [32, "favicon-32.png"],
  [180, "apple-touch-icon.png"],
  [512, "icon-512.png"],
])
  await sharp("brand/icon.svg")
    .resize(size, size)
    .png()
    .toFile("public/" + name);
console.log("Created three 1200 × 630 share cards and three app icons.");
