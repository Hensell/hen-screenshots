import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { landingLocale, landingPaths } from "./locales.ts";
import { renderLanding, sitemap } from "./seo.ts";

/** Emit translated HTML after Vite has rewritten shared scripts, CSS, and fonts. */
export function landingSeo(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "hen-landing-seo",
    configResolved(value) {
      config = value;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        return context.filename === resolve(config.root, "index.html")
          ? renderLanding(html, "en")
          : html;
      },
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (url.pathname === "/sitemap.xml") {
          response.setHeader("Content-Type", "application/xml; charset=utf-8");
          response.end(sitemap());
          return;
        }
        if (!["/es", "/es/", "/pt-br", "/pt-br/"].includes(url.pathname)) {
          next();
          return;
        }
        if (!url.pathname.endsWith("/")) {
          response.writeHead(301, {
            Location: url.pathname + "/" + url.search,
          });
          response.end();
          return;
        }
        try {
          const template = await readFile(
            resolve(config.root, "index.html"),
            "utf8",
          );
          const html = await server.transformIndexHtml("/index.html", template);
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(renderLanding(html, landingLocale(url.pathname)));
        } catch (error) {
          next(error);
        }
      });
    },
    async writeBundle(options, bundle) {
      const landing = bundle["index.html"];
      if (landing?.type !== "asset" || typeof landing.source !== "string")
        return;
      const directory = resolve(
        config.root,
        options.dir ?? config.build.outDir,
      );
      for (const locale of ["es", "pt-BR"] as const) {
        const target = resolve(directory, landingPaths[locale].slice(1));
        await mkdir(target, { recursive: true });
        await writeFile(
          resolve(target, "index.html"),
          renderLanding(landing.source, locale),
        );
      }
      await writeFile(resolve(directory, "sitemap.xml"), sitemap());
    },
  };
}
