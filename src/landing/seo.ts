import type { InterfaceLocale } from "../i18n/core.ts";
import { landingMessages } from "../i18n/landing-messages.ts";
import { landingPaths } from "./locales.ts";

export const siteUrl = "https://screenshots.hensell.dev";
const title = "Hen Screenshots — Free app screenshot & mockup studio";
const description =
  "Free app store screenshots, Google Play banners, portfolio mockups, and caption translations. Create in your browser, with no account or watermarks.";
const locales = Object.keys(landingPaths) as InterfaceLocale[];
const graphLocales = { en: "en_US", es: "es_ES", "pt-BR": "pt_BR" };
const imageDescriptions = {
  en: "Hen Screenshots: free app screenshots, portfolio mockups, and caption translations, with two real template examples.",
  es: "Hen Screenshots: capturas de apps, mockups para portafolios y traducciones gratis, con dos ejemplos reales de plantillas.",
  "pt-BR":
    "Hen Screenshots: capturas de apps, mockups para portfólios e traduções grátis, com dois exemplos reais de modelos.",
};

function translateFor(locale: InterfaceLocale, source: string) {
  if (!Object.hasOwn(landingMessages, source))
    throw new Error(`Missing landing translation: ${source}`);
  return locale === "en"
    ? source
    : landingMessages[source][locale === "es" ? 0 : 1];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function decodeHtml(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function seoMarkup(locale: InterfaceLocale) {
  const url = siteUrl + landingPaths[locale];
  const localizedTitle = translateFor(locale, title);
  const localizedDescription = translateFor(locale, description);
  const image = `${siteUrl}/social/hen-screenshots-${locale.toLowerCase()}.png`;
  const meta = (name: string, content: string, attribute = "property") =>
    `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Hen Screenshots",
        url: siteUrl + "/",
        inLanguage: locales,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: localizedTitle,
        description: localizedDescription,
        inLanguage: locale,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: image,
          width: 1200,
          height: 630,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: "Hen Screenshots",
        url: siteUrl + "/studio/",
        description: localizedDescription,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser.",
        inLanguage: locales,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: {
          "@type": "Person",
          name: "Hensell",
          url: "https://hensell.dev/",
        },
        image,
        screenshot: ["halo", "ecosystem", "banner"].map(
          (name) => `${siteUrl}/examples/${name}.webp`,
        ),
        sameAs: "https://github.com/Hensell/hen-screenshots",
      },
    ],
  };
  return [
    `<title>${escapeHtml(localizedTitle)}</title>`,
    meta("description", localizedDescription, "name"),
    meta("robots", "index, follow, max-image-preview:large", "name"),
    `<link rel="canonical" href="${url}" />`,
    ...locales.map(
      (language) =>
        `<link rel="alternate" hreflang="${language}" href="${siteUrl}${landingPaths[language]}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`,
    meta("og:type", "website"),
    meta("og:site_name", "Hen Screenshots"),
    meta("og:title", localizedTitle),
    meta("og:description", localizedDescription),
    meta("og:url", url),
    meta("og:locale", graphLocales[locale]),
    ...locales
      .filter((language) => language !== locale)
      .map((language) => meta("og:locale:alternate", graphLocales[language])),
    meta("og:image", image),
    meta("og:image:type", "image/png"),
    meta("og:image:width", "1200"),
    meta("og:image:height", "630"),
    meta("og:image:alt", imageDescriptions[locale]),
    meta("twitter:card", "summary_large_image", "name"),
    meta("twitter:title", localizedTitle, "name"),
    meta("twitter:description", localizedDescription, "name"),
    meta("twitter:image", image, "name"),
    meta("twitter:image:alt", imageDescriptions[locale], "name"),
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`,
  ].join("\n");
}

/** Translate only the explicitly marked, text-only elements in our static template.
 * Keep source keys so dev rendering and build rendering can safely run twice. */
export function renderLanding(html: string, locale: InterfaceLocale) {
  const t = (source: string) =>
    escapeHtml(translateFor(locale, decodeHtml(source)));
  let output = html.replace(
    /<([a-z][\w-]*)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>[^<]*<\/\1\s*>/g,
    (_match, tag, attributes, source) =>
      `<${tag}${attributes}>${t(source)}</${tag}>`,
  );
  output = output.replace(/<[a-z][^>]*>/g, (tag) => {
    for (const attribute of ["aria-label", "alt", "content"]) {
      const source = tag.match(new RegExp(`data-i18n-${attribute}="([^"]+)"`));
      if (source)
        tag = tag.replace(
          new RegExp(`(\\s${attribute}=)"[^"]*"`),
          (_match, prefix) => `${prefix}"${t(source[1])}"`,
        );
    }
    return tag;
  });
  return output
    .replace(/(<html\b[^>]*\blang=)"[^"]*"/, `$1"${locale}"`)
    .replace(
      /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/,
      `<!-- seo:start -->\n${seoMarkup(locale)}\n<!-- seo:end -->`,
    )
    .replace(
      /(<a\b[^>]*class="wordmark"[^>]*\bhref=)"[^"]*"/g,
      `$1"${landingPaths[locale]}"`,
    );
}

export function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locales.map((locale) => `<url><loc>${siteUrl}${landingPaths[locale]}</loc></url>`).join("\n")}\n</urlset>\n`;
}
