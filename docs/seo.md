# Search and sharing

The public landing page is built as three static HTML documents:

| Language             | Canonical URL                            |
| -------------------- | ---------------------------------------- |
| English              | `https://screenshots.hensell.dev/`       |
| Spanish              | `https://screenshots.hensell.dev/es/`    |
| Brazilian Portuguese | `https://screenshots.hensell.dev/pt-br/` |

Each URL delivers translated content, a title and description, canonical and reciprocal `hreflang` links, Open Graph metadata, a Twitter large-image card, and JSON-LD describing the website and free web application. Crawlers do not need JavaScript to read them. The language selector navigates between these URLs and remembers the choice for the editor. It preserves the current query string and section anchor. The footer also provides ordinary language links.

`src/landing/seo.ts` owns the metadata and structured data. The Vite plugin in `src/landing/seo-plugin.ts` renders the existing landing translations at build time, after Vite has resolved scripts, styles, and fonts. Add new translatable copy to `src/i18n/landing-messages.ts` and mark text-only elements with `data-i18n`, as elsewhere in the landing template. Keep the visible product claims and structured data consistent.

## Social images and icons

The three sharing images in `public/social/` are 1200 × 630 opaque PNGs. They use the brand's Manrope font, original logo, and actual example exports. The generator also produces the PNG favicon, Apple touch icon, and 512-pixel brand icon.

```sh
npm run social:images
```

Review all three images visually and commit the generated files with any generator changes. Generation uses the pinned Sharp development dependency; deployment serves the committed images without generating them on demand.

## Indexing and routes

- `/sitemap.xml` lists only the three public landing URLs. It is generated from the same locale map used by the metadata.
- `/robots.txt` points crawlers to that sitemap. The editor remains crawlable so search engines can read its `noindex` directive.
- `/studio/` has both a `noindex` meta tag and an `X-Robots-Tag` response header. Project IDs and private editor views are absent from the sitemap. `noindex` is an indexing instruction, not an access-control mechanism; projects remain stored locally in the browser.
- Cloudflare serves missing routes with a real HTTP 404 and `public/404.html`, instead of returning the landing page with status 200. Existing project bookmarks still redirect to `/studio/?project=…`.
- `/es` and `/pt-br` redirect to their canonical trailing-slash paths.

## Verify a release

```sh
npm run check
npm run seo:check
```

The second command checks the deployed site by default. To check a locally served production build, pass its origin:

```sh
npm run seo:check -- http://127.0.0.1:5175/
```

The HTTP check verifies translated HTML, metadata, structured data, social-image dimensions, referenced assets, the sitemap, robots rules, editor indexing headers, redirects, and a genuine 404. Use a Cloudflare preview for this check: Vite's development server is not the authority for production status codes or headers.

Search Console ownership verification and sitemap submission are separate account tasks. This implementation does not claim that Google has indexed the site or that a social network has refreshed a cached preview. Check those services after deployment when needed.

## References

- [Google: multilingual and multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Open Graph protocol](https://ogp.me/)
- [Schema.org: WebApplication](https://schema.org/WebApplication)
- [Cloudflare: static-site routing and 404 pages](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
