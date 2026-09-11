import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  agentPaths,
  landingLocale,
  landingPaths,
  publicPagePaths,
} from "./locales";
import { version } from "../../plugins/hen-screenshots/package.json";
import { renderLanding, siteUrl, sitemap } from "./seo";

const template = readFileSync("index.html", "utf8");

describe("public landing SEO", () => {
  it.each([
    ["en", "Your app.", "en_US"],
    ["es", "Tu app.", "es_ES"],
    ["pt-BR", "Seu app.", "pt_BR"],
  ] as const)(
    "renders complete %s content and metadata without JavaScript",
    (locale, heading, graphLocale) => {
      const html = renderLanding(template, locale);
      const url = siteUrl + landingPaths[locale];
      expect(html).toContain(`<html lang="${locale}">`);
      expect(html).toContain(`>${heading}</span>`);
      expect(html).toContain(`<link rel="canonical" href="${url}" />`);
      expect(html).toContain(`<meta property="og:url" content="${url}" />`);
      expect(html).toContain(
        `<meta property="og:locale" content="${graphLocale}" />`,
      );
      expect(html).toContain(
        `content="${siteUrl}/social/hen-screenshots-${locale.toLowerCase()}.png"`,
      );
      expect(html).toContain(
        'name="twitter:card" content="summary_large_image"',
      );
      for (const [language, path] of Object.entries(landingPaths)) {
        expect(html).toContain(
          `hreflang="${language}" href="${siteUrl}${path}"`,
        );
        expect(html).toContain(`href="${path}" hreflang="${language}"`);
      }
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html.match(/rel="canonical"/g)).toHaveLength(1);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html.match(/<figure\b/g)).toHaveLength(
        template.match(/<figure\b/g)!.length,
      );
      expect(html.match(/<section\b/g)).toHaveLength(
        template.match(/<section\b/g)!.length,
      );
      const data = JSON.parse(
        html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1],
      );
      expect(data["@graph"][1]).toMatchObject({ url, inLanguage: locale });
      expect(data["@graph"][2]).toMatchObject({
        "@type": "WebApplication",
        offers: { price: "0" },
      });
      expect(data["@graph"][2]).not.toHaveProperty("aggregateRating");
      expect(renderLanding(renderLanding(template, "en"), locale)).toBe(html);
    },
  );

  it("preserves source keys and markup when translating escaped text and attributes", () => {
    const input =
      '<span data-i18n="iPhone &amp; Android">iPhone &amp; Android</span\n><a aria-label="Open studio" data-i18n-aria-label="Open studio"><svg></svg></a>';
    const html = renderLanding(input, "es");
    expect(html).toContain(
      'data-i18n="iPhone &amp; Android">iPhone y Android</span>',
    );
    expect(html).toContain(
      'aria-label="Abrir estudio" data-i18n-aria-label="Open studio"',
    );
    expect(html).toContain("<svg></svg>");
  });

  it("keeps private editor pages out of the sitemap and allows crawlers to see noindex", () => {
    const xml = sitemap();
    expect(xml.match(/<url>/g)).toHaveLength(6);
    for (const path of [
      ...Object.values(landingPaths),
      ...Object.values(agentPaths),
    ])
      expect(xml).toContain(`<loc>${siteUrl}${path}</loc>`);
    expect(xml).not.toContain("/studio/");
    expect(readFileSync("public/robots.txt", "utf8")).toContain(
      `Sitemap: ${siteUrl}/sitemap.xml`,
    );
    expect(readFileSync("public/robots.txt", "utf8")).not.toContain(
      "Disallow: /studio",
    );
    expect(readFileSync("studio/index.html", "utf8")).toContain(
      'name="robots" content="noindex"',
    );
  });

  it("retains project bookmarks and maps explicit language URLs", () => {
    expect(renderLanding(template, "es")).toContain(
      'projectUrl.pathname = "/studio/"',
    );
    expect(landingLocale("/")).toBe("en");
    expect(landingLocale("/es/")).toBe("es");
    expect(landingLocale("/pt-br/")).toBe("pt-BR");
    expect(landingLocale("/es-not-a-locale/")).toBe("en");
  });

  it.each(["en", "es", "pt-br"])(
    "ships a correctly sized %s share image",
    (locale) => {
      const image = readFileSync(`public/social/hen-screenshots-${locale}.png`);
      expect(image.subarray(1, 4).toString()).toBe("PNG");
      expect(image.readUInt32BE(16)).toBe(1200);
      expect(image.readUInt32BE(20)).toBe(630);
      expect(image.length).toBeLessThan(1_000_000);
    },
  );
});

describe("AI agent guide", () => {
  const guide = readFileSync("agents/index.html", "utf8");
  it.each([
    ["en", "Use with AI agents.", "Create a three-slide"],
    ["es", "Usar con agentes de IA.", "Crea una serie de tres slides"],
    ["pt-BR", "Usar com agentes de IA.", "Crie uma série de três slides"],
  ] as const)(
    "ships complete %s instructions, localized links, and a real versioned download",
    (locale, heading, prompt) => {
      const html = renderLanding(guide, locale, "agents");
      expect(html).toContain(`>${heading}</h1>`);
      expect(html).toContain(prompt);
      expect(html).toContain(
        `rel="canonical" href="${siteUrl}${agentPaths[locale]}"`,
      );
      expect(html).toContain(`hen-screenshots-plugin-${version}.zip`);
      expect(html).not.toContain("__PLUGIN_VERSION__");
      expect(html).toContain("node scripts/setup.mjs");
      expect(html).toContain(
        "codex plugin marketplace add Hensell/hen-screenshots",
      );
      expect(html).toContain(
        "codex plugin add hen-screenshots@hen-screenshots",
      );
      expect(html).toContain("/plugin marketplace add Hensell/hen-screenshots");
      expect(html).toContain("/plugin install hen-screenshots@hen-screenshots");
      expect(html).toContain("claude --plugin-dir &quot;PLUGIN_FOLDER&quot;");
      expect(html).toContain("/hen-screenshots:create-screenshots");
      for (const [language, path] of Object.entries(agentPaths)) {
        expect(html).toContain(
          `hreflang="${language}" href="${siteUrl}${path}"`,
        );
        expect(html).toContain(`href="${path}" hreflang="${language}"`);
      }
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const match of html.matchAll(/\bdata-copy="([^"]+)"/g))
        expect(ids).toContain(match[1]);
      for (const match of html.matchAll(/\bhref="#([^"]+)"/g))
        expect(ids).toContain(match[1]);
      expect(
        renderLanding(renderLanding(guide, "en", "agents"), locale, "agents"),
      ).toBe(html);
      expect(renderLanding(template, locale)).toContain(
        `data-agent-link href="${agentPaths[locale]}"`,
      );
    },
  );
  it("keeps visitors on the guide when changing website language", () => {
    for (const path of Object.values(agentPaths)) {
      expect(publicPagePaths(path)).toBe(agentPaths);
      expect(publicPagePaths(path.slice(0, -1))).toBe(agentPaths);
    }
    expect(publicPagePaths("/es/")).toBe(landingPaths);
    expect(publicPagePaths("/not-agents/")).toBe(landingPaths);
  });
  it("translates instructions containing literal quotes after HTML formatting", () => {
    const html = renderLanding(guide, "es", "agents");
    expect(html).toContain(
      ">El comando doctor debe indicar &quot;ok&quot;: true.",
    );
    expect(html).not.toMatch(/>\s*The doctor command should report/);
    const portuguese = renderLanding(guide, "pt-BR", "agents");
    expect(portuguese).toContain(
      ">O comando doctor deve informar &quot;ok&quot;: true.",
    );
  });
});
