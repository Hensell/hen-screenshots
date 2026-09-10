import { build } from "vite";
import { mkdir, cp, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const plugin = resolve(root, "plugins/hen-screenshots");
const { version } = JSON.parse(
  await readFile(join(plugin, "package.json"), "utf8"),
);
for (const file of [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "package-lock.json",
]) {
  const manifest = JSON.parse(await readFile(join(plugin, file), "utf8"));
  if (manifest.version !== version)
    throw new Error(`Plugin version mismatch in ${file}.`);
}
await cp(join(root, "LICENSE"), join(plugin, "LICENSE"));
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
    for (const entry of (
      await readdir(join(plugin, path), {
        withFileTypes: true,
      })
    ).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
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
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    // Include only the known public assets, never stale or private files.
    "assets/icon.png",
    "assets/fonts/Manrope.ttf",
    "assets/fonts/Fraunces-Semibold.ttf",
    "assets/fonts/OFL.txt",
    "assets/fonts/OFL-Fraunces.txt",
  ])
    entries[`hen-screenshots/${name}`] = new Uint8Array(
      await readFile(join(plugin, name)),
    );
  await mkdir(join(root, "artifacts"), { recursive: true });
  const target = join(root, `artifacts/hen-screenshots-plugin-${version}.zip`);
  // Fixed ZIP timestamps make repeated builds of the same package comparable.
  const archive = zipSync(
    Object.fromEntries(
      Object.entries(entries).map(([name, bytes]) => [
        name,
        [bytes, { mtime: new Date(2020, 0, 1) }],
      ]),
    ),
    { level: 6 },
  );
  await writeFile(target, archive);
  const checksum = `${createHash("sha256").update(archive).digest("hex")}  hen-screenshots-plugin-${version}.zip\n`;
  await writeFile(`${target}.sha256`, checksum);
  console.log(`Plugin package: ${target}`);
  if (process.argv.includes("--web")) {
    const downloads = join(root, "public/downloads");
    await mkdir(downloads, { recursive: true });
    await cp(target, join(downloads, `hen-screenshots-plugin-${version}.zip`));
    await cp(
      `${target}.sha256`,
      join(downloads, `hen-screenshots-plugin-${version}.zip.sha256`),
    );
  }
}
