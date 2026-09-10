import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

// Test the installed package, not imports from src/ or this checkout's libraries.
const plugin = resolve(process.argv[2] ?? "plugins/hen-screenshots");
const require = createRequire(join(plugin, "package.json"));
const sharp = require("sharp");
const { unzipSync } = require("fflate");
const version = JSON.parse(
  await readFile(join(plugin, "package.json"), "utf8"),
).version;
const work = process.argv[3]
  ? resolve(process.argv[3])
  : await mkdtemp(join(tmpdir(), "hen-plugin-release-"));
if (process.argv[3]) await mkdir(work);
const cli = join(plugin, "scripts/hen.mjs");
const run = (args, fails = false) => {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: work,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 180000,
  });
  assert.ifError(result.error);
  if (fails) {
    assert.notEqual(result.status, 0, `Expected failure: ${args.join(" ")}`);
    const error = JSON.parse(result.stderr.trim());
    assert.equal(error.ok, false);
    assert.ok(error.error.length > 15);
    return error;
  }
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const capture = join(work, "capture with spaces.png");
const desktop = join(work, "desktop.png");
const svg = (width, height) =>
  Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f5f3ed"/><rect x="30" y="45" width="${width - 60}" height="90" rx="12" fill="#275c49"/><text x="50" y="102" fill="white" font-size="30">A little progress</text><rect x="30" y="180" width="${width - 60}" height="100" rx="12" fill="#dae4d7"/><rect x="30" y="310" width="${width - 60}" height="100" rx="12" fill="#e8c4a8"/><rect x="30" y="440" width="${width - 60}" height="100" rx="12" fill="#c7d8e3"/></svg>`,
  );
await sharp(svg(480, 960)).png().toFile(capture);
await sharp(svg(1200, 750)).png().toFile(desktop);
const originalHash = digest(await readFile(capture));
assert.equal(run(["doctor"]).version, version);
const templates = run(["templates"]);
for (const id of ["halo", "atrium", "obsidian", "offset", "ecosystem"])
  assert.ok(
    templates.some((t) => t.id === id),
    id,
  );
assert.ok(run(["profiles"]).some((p) => p.id === "play-phone-portrait"));
assert.ok(run(["languages"]).some((p) => p.code === "es"));

const verify = async (out, width, height, count) => {
  const archive = unzipSync(await readFile(join(out, "screenshots.zip")));
  assert.equal(Object.keys(archive).length, count);
  for (const [name, bytes] of Object.entries(archive)) {
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, width, name);
    assert.equal(metadata.height, height, name);
    assert.equal(bytes[24], 8, "8-bit PNG");
    assert.equal(bytes[25], 2, "opaque RGB PNG");
    assert.equal(digest(bytes), digest(await readFile(join(out, name))));
  }
  const loaded = run([
    "inspect",
    "--project",
    join(out, "project.henscreenshots"),
  ]);
  assert.ok(loaded.project.shots.length > 0);
  assert.ok((await readFile(join(out, "preview.png"))).length > 500);
  return { out, loaded, archive };
};
const create = async (name, changes, slides, width, height, count) => {
  const config = join(work, `${name}.json`);
  await writeFile(
    config,
    JSON.stringify({
      version: 1,
      name,
      profile: "play-phone-portrait",
      template: "halo",
      slides,
      ...changes,
    }),
  );
  const out = join(work, name);
  run(["create", "--config", config, "--out", out]);
  return verify(out, width, height, count);
};
const slide = {
  image: capture,
  title: "Small steps. Real progress.",
  subtitle: "A little more, every day.",
};
const store = await create("store", {}, [slide, slide, slide], 1080, 1920, 3);
for (const template of ["atrium", "obsidian", "offset"]) {
  const panorama = await create(
    template,
    { template, device: "ios" },
    [{ ...slide, continuation: { title: "Make room for what matters." } }],
    1080,
    1920,
    2,
  );
  assert.equal(panorama.loaded.project.shots.length, 2);
}
await create(
  "portfolio",
  {
    template: "ecosystem",
    profile: "portfolio-custom",
    customSize: { width: 1600, height: 1200 },
  },
  [{ ...slide, image: desktop, companions: [capture, capture] }],
  1600,
  1200,
  1,
);
const localized = await create(
  "languages",
  {},
  [
    {
      ...slide,
      translations: {
        es: {
          title: "Un poco cada día.",
          subtitle: "Haz espacio para lo que importa.",
        },
      },
    },
  ],
  1080,
  1920,
  2,
);
assert.deepEqual(Object.keys(localized.archive).sort(), [
  "en/01.png",
  "es/01.png",
]);
const replay = join(work, "reopened");
run([
  "render",
  "--project",
  join(store.out, "project.henscreenshots"),
  "--out",
  replay,
]);
const replayed = await verify(replay, 1080, 1920, 3);
for (const [name, bytes] of Object.entries(store.archive))
  assert.equal(
    digest(bytes),
    digest(replayed.archive[name]),
    "project round trip",
  );

const badConfig = join(work, "invalid.json");
await writeFile(
  badConfig,
  JSON.stringify({
    version: 1,
    name: "bad",
    profile: "unknown-store",
    slides: [slide],
  }),
);
run(
  ["create", "--config", badConfig, "--out", join(work, "invalid-output")],
  true,
);
const corrupt = join(work, "corrupt.png");
await writeFile(corrupt, "Not an image");
await writeFile(
  badConfig,
  JSON.stringify({
    version: 1,
    name: "bad",
    profile: "play-phone-portrait",
    slides: [{ ...slide, image: corrupt }],
  }),
);
run(
  ["create", "--config", badConfig, "--out", join(work, "corrupt-output")],
  true,
);
const before = digest(
  await readFile(join(store.out, "project.henscreenshots")),
);
assert.match(
  run(
    [
      "render",
      "--project",
      join(store.out, "project.henscreenshots"),
      "--out",
      store.out,
    ],
    true,
  ).error,
  /new path|never overwritten/,
);
assert.equal(
  digest(await readFile(join(store.out, "project.henscreenshots"))),
  before,
);
assert.equal(digest(await readFile(capture)), originalHash);
assert.ok(!(await readdir(work)).includes("corrupt-output"));
const report = {
  ok: true,
  version,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  checks: [
    "doctor and catalog",
    "store series",
    "three isometric panoramas",
    "multiple-device portfolio",
    "language folders",
    "project round trip",
    "invalid config",
    "corrupt image",
    "no overwrites",
    "unchanged source",
  ],
};
await writeFile(join(work, "qa-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, artifacts: work }, null, 2));
