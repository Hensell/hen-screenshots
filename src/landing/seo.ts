import type { InterfaceLocale } from "../i18n/core.ts";
import { landingMessages } from "../i18n/landing-messages.ts";
import { agentMessages, agentSnippets } from "./agents-content.ts";
import pluginPackage from "../../plugins/hen-screenshots/package.json" with { type: "json" };
import { agentPaths, landingPaths } from "./locales.ts";

export const siteUrl = "https://screenshots.hensell.dev";
const pluginVersion = pluginPackage.version;
const title = "Hen Screenshots — Free app screenshot & mockup studio";
const description =
  "Free app screenshots, Google Play banners, and portfolio mockups. Make reusable templates and translate captions in your browser. No account or watermarks.";
const locales = Object.keys(landingPaths) as InterfaceLocale[];
const graphLocales = { en: "en_US", es: "es_ES", "pt-BR": "pt_BR" };
const imageDescriptions = {
  en: "Hen Screenshots: free app screenshots, portfolio mockups, and caption translations, with two real template examples.",
  es: "Hen Screenshots: capturas de apps, mockups para portafolios y traducciones gratis, con dos ejemplos reales de plantillas.",
  "pt-BR":
    "Hen Screenshots: capturas de apps, mockups para portfólios e traduções grátis, com dois exemplos reais de modelos.",
};

function translateFor(locale: InterfaceLocale, source: string) {
  const messages = Object.hasOwn(agentMessages, source)
    ? agentMessages
    : landingMessages;
  if (!Object.hasOwn(messages, source))
    throw new Error(`Missing public page translation: ${source}`);
  return locale === "en" ? source : messages[source][locale === "es" ? 0 : 1];
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
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function seoMarkup(
  locale: InterfaceLocale,
  page: "landing" | "agents" = "landing",
) {
  const paths = page === "agents" ? agentPaths : landingPaths;
  const url = siteUrl + paths[locale];
  const localizedTitle = translateFor(
    locale,
    page === "agents" ? "Use with AI agents — Hen Screenshots" : title,
  );
  const localizedDescription = translateFor(
    locale,
    page === "agents"
      ? "Download the local Hen Screenshots plugin. Set it up for Codex or Claude Code, create screenshot series, and keep editing in the web studio."
      : description,
  );
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
        description: translateFor(locale, description),
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser.",
        inLanguage: locales,
        isAccessibleForFree: true,
        license: "https://github.com/Hensell/hen-screenshots/blob/main/LICENSE",
        featureList: [
          "Your own templates",
          "Brand kits",
          "Free caption translations",
        ].map((feature) => translateFor(locale, feature)),
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
        `<link rel="alternate" hreflang="${language}" href="${siteUrl}${paths[language]}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${siteUrl}${paths.en}" />`,
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
export function renderLanding(
  html: string,
  locale: InterfaceLocale,
  page: "landing" | "agents" = "landing",
) {
  const t = (source: string) =>
    escapeHtml(translateFor(locale, decodeHtml(source)));
  let output = html.replace(
    /<([a-z][\w-]*)\b([^>]*\bdata-i18n=(["'])(.*?)\3[^>]*)>[^<]*<\/\1\s*>/gs,
    (_match, tag, attributes, _quote, source) =>
      `<${tag}${attributes}>${t(source)}</${tag}>`,
  );
  output = output.replace(/<[a-z][^>]*>/g, (tag) => {
    for (const attribute of ["aria-label", "alt", "content"]) {
      const source = tag.match(
        new RegExp(`data-i18n-${attribute}=(["'])(.*?)\\1`),
      );
      if (source)
        tag = tag.replace(
          new RegExp(`(\\s${attribute}=)(["'])(.*?)\\2`),
          (_match, prefix) => `${prefix}"${t(source[2])}"`,
        );
    }
    return tag;
  });
  return output
    .replace(/(<html\b[^>]*\blang=)"[^"]*"/, `$1"${locale}"`)
    .replace(
      /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/,
      `<!-- seo:start -->\n${seoMarkup(locale, page)}\n<!-- seo:end -->`,
    )
    .replace(
      /(<a\b[^>]*class="wordmark"[^>]*\bhref=)"[^"]*"/g,
      `$1"${landingPaths[locale]}"`,
    )
    .replace(
      /(<a\b[^>]*\bdata-agent-link\b[^>]*\bhref=)"[^"]*"/g,
      `$1"${agentPaths[locale]}"`,
    )
    .replaceAll("__PLUGIN_VERSION__", pluginVersion)
    .replace(
      /(<code\b[^>]*\bdata-guide-snippet="([^"]+)"[^>]*>)[\s\S]*?<\/code>/g,
      (_match, opening, key: string) => {
        const snippet = agentSnippets[key];
        if (!snippet) throw new Error(`Missing guide snippet: ${key}`);
        return `${opening}${escapeHtml(snippet[locale])}</code>`;
      },
    );
}

export function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[landingPaths, agentPaths].flatMap((paths) => locales.map((locale) => `<url><loc>${siteUrl}${paths[locale]}</loc></url>`)).join("\n")}\n</urlset>\n`;
}
