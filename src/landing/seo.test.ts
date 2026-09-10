import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingLocale, landingPaths } from "./locales";
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
    expect(xml.match(/<url>/g)).toHaveLength(3);
    for (const path of Object.values(landingPaths))
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
