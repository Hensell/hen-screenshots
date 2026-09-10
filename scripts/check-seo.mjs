// Read the actual HTTP responses as a crawler would; never execute page JavaScript.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
const { version: pluginVersion } = JSON.parse(
  await readFile(
    new URL("../plugins/hen-screenshots/package.json", import.meta.url),
    "utf8",
  ),
);
const base = new URL(process.argv[2] || "https://screenshots.hensell.dev/");
const canonicalOrigin = "https://screenshots.hensell.dev";
async function request(path) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  return response;
}
for (const [path, language] of [
  ["/", "en"],
  ["/es/", "es"],
  ["/pt-br/", "pt-BR"],
  ["/agents/", "en"],
  ["/es/agents/", "es"],
  ["/pt-br/agents/", "pt-BR"],
]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.ok(html.includes(`<html lang="${language}">`));
  assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin}${path}"`));
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/hreflang=/g) || []).length, 7); // Four head alternates + three crawlable footer links.
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(!html.includes('content="noindex"'));
  if (path.includes("/agents/")) {
    assert.ok(
      html.includes(`/downloads/hen-screenshots-plugin-${pluginVersion}.zip`),
    );
    assert.ok(html.includes("npm ci --omit=dev"));
    assert.ok(html.includes("/hen-screenshots:create-screenshots"));
  }
  const schema = JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  );
  assert.equal(schema["@graph"][1].inLanguage, language);
  const image = html.match(/property="og:image" content="([^"]+)"/)[1];
  const preview = await request(new URL(image).pathname);
  assert.equal(preview.status, 200, image);
  assert.match(preview.headers.get("content-type"), /^image\/png/);
  const png = Buffer.from(await preview.arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length < 1000000);
  const assets = [
    ...html.matchAll(
      /<(?:script|img|link)\b[^>]*(?:src|href)="(\/(?:assets|examples|icons|social)\/[^"?#]+|\/[^"?#]+\.png)"/g,
    ),
  ].map((m) => m[1]);
  for (const asset of new Set(assets))
    assert.equal((await request(asset)).status, 200, asset);
  console.log(
    `PASS ${path}: static ${language} content, canonical, hreflang, JSON-LD, social card, assets`,
  );
}
const robots = await request("/robots.txt");
assert.equal(robots.status, 200);
assert.ok((await robots.text()).includes(`${canonicalOrigin}/sitemap.xml`));
const map = await request("/sitemap.xml");
assert.equal(map.status, 200);
const xml = await map.text();
assert.equal((xml.match(/<url>/g) || []).length, 6);
assert.ok(!xml.includes("/studio/"));
const studio = await request("/studio/");
assert.equal(studio.status, 200);
assert.match(studio.headers.get("x-robots-tag"), /noindex/);
assert.ok((await studio.text()).includes('name="robots" content="noindex"'));
const missing = await request("/seo-check-page-does-not-exist");
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('name="robots" content="noindex"'));
const redirect = await request("/es?utm_source=seo-check");
assert.ok([301, 302, 307, 308].includes(redirect.status));
const target = new URL(redirect.headers.get("location"), base);
assert.equal(target.pathname, "/es/");
assert.equal(target.searchParams.get("utm_source"), "seo-check");
console.log(
  "PASS robots.txt, sitemap.xml, studio noindex, real 404 and canonical redirect",
);
const download = await request(
  `/downloads/hen-screenshots-plugin-${pluginVersion}.zip`,
);
assert.equal(download.status, 200);
assert.match(
  download.headers.get("content-type"),
  /application\/(?:zip|octet-stream|x-zip-compressed)/,
);
const archive = unzipSync(new Uint8Array(await download.arrayBuffer()));
for (const file of [
  "package.json",
  "package-lock.json",
  "README.md",
  "PRIVACY.md",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "skills/create-screenshots/SKILL.md",
  "scripts/hen.mjs",
  "dist/cli.mjs",
  "assets/fonts/Manrope.ttf",
  "assets/fonts/OFL.txt",
])
  assert.ok(
    archive[`hen-screenshots/${file}`]?.length,
    `Missing plugin file: ${file}`,
  );
assert.equal(
  JSON.parse(strFromU8(archive["hen-screenshots/package.json"])).version,
  pluginVersion,
);
assert.ok(
  Object.keys(archive).every(
    (path) =>
      path.startsWith("hen-screenshots/") &&
      !/(?:\.env|node_modules|\.henscreenshots$)/.test(path),
  ),
);
console.log(
  `PASS downloadable plugin v${pluginVersion}: valid ZIP, renderer, fonts, skill and manifests`,
);
