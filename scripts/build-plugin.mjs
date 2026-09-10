import { build } from "vite";
import { mkdir, cp, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
const root = fileURLToPath(new URL("../", import.meta.url));
const plugin = resolve(root, "plugins/hen-screenshots");
await build({
  configFile: false,
  root,
  publicDir: false,
  build: {
    outDir: join(plugin, "dist"),
    emptyOutDir: true,
    minify: false,
    target: "node22",
    lib: {
      entry: resolve(root, "src/agent/cli.ts"),
      formats: ["es"],
      fileName: () => "cli.mjs",
    },
    rollupOptions: {
      external: [/^node:/, /^konva(?:\/|$)/, "skia-canvas", "sharp", "fflate"],
    },
  },
});
await mkdir(join(plugin, "assets/fonts"), { recursive: true });
for (const name of [
  "Manrope.ttf",
  "Fraunces-Semibold.ttf",
  "OFL.txt",
  "OFL-Fraunces.txt",
])
  await cp(join(root, "brand/fonts", name), join(plugin, "assets/fonts", name));
await cp(join(root, "public/icon-512.png"), join(plugin, "assets/icon.png"));
if (process.argv.includes("--zip")) {
  const entries = {};
  async function include(path) {
    for (const entry of await readdir(join(plugin, path), {
      withFileTypes: true,
    })) {
      const relative = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await include(relative);
      else if (entry.isFile())
        entries[`hen-screenshots/${relative}`] = new Uint8Array(
          await readFile(join(plugin, relative)),
        );
    }
  }
  for (const directory of [
    ".codex-plugin",
    ".claude-plugin",
    "skills",
    "scripts",
    "dist",
  ])
    await include(directory);
  for (const name of [
    "plugin.json",
    "package.json",
    "package-lock.json",
    "README.md",
    "PRIVACY.md",
    // Generated assets are ignored by git; never include stale/private files.
    "assets/icon.png",
    "assets/fonts/Manrope.ttf",
    "assets/fonts/Fraunces-Semibold.ttf",
    "assets/fonts/OFL.txt",
    "assets/fonts/OFL-Fraunces.txt",
  ])
    entries[`hen-screenshots/${name}`] = new Uint8Array(
      await readFile(join(plugin, name)),
    );
  const version = JSON.parse(
    await readFile(join(plugin, "package.json"), "utf8"),
  ).version;
  await mkdir(join(root, "artifacts"), { recursive: true });
  const target = join(root, `artifacts/hen-screenshots-plugin-${version}.zip`);
  await writeFile(target, zipSync(entries, { level: 6 }));
  console.log(`Plugin package: ${target}`);
}
