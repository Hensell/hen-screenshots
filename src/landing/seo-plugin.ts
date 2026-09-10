import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { agentPaths, landingLocale, landingPaths } from "./locales.ts";
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
        if (context.filename === resolve(config.root, "agents/index.html"))
          return renderLanding(html, "en", "agents");
        if (context.filename === resolve(config.root, "index.html"))
          return renderLanding(html, "en");
        return html;
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
        const isGuide = Object.values(agentPaths).some(
          (path) => url.pathname === path || url.pathname === path.slice(0, -1),
        );
        if (
          !isGuide &&
          !["/es", "/es/", "/pt-br", "/pt-br/"].includes(url.pathname)
        ) {
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
            resolve(config.root, isGuide ? "agents/index.html" : "index.html"),
            "utf8",
          );
          const html = await server.transformIndexHtml(
            isGuide ? "/agents/index.html" : "/index.html",
            template,
          );
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(
            renderLanding(
              html,
              landingLocale(url.pathname),
              isGuide ? "agents" : "landing",
            ),
          );
        } catch (error) {
          next(error);
        }
      });
    },
    async writeBundle(options, bundle) {
      const directory = resolve(
        config.root,
        options.dir ?? config.build.outDir,
      );
      for (const [page, file, paths] of [
        ["landing", "index.html", landingPaths],
        ["agents", "agents/index.html", agentPaths],
      ] as const) {
        const entry = bundle[file];
        if (entry?.type !== "asset" || typeof entry.source !== "string")
          throw new Error(`Missing public page build: ${file}`);
        for (const locale of ["es", "pt-BR"] as const) {
          const target = resolve(directory, paths[locale].slice(1));
          await mkdir(target, { recursive: true });
          await writeFile(
            resolve(target, "index.html"),
            renderLanding(entry.source, locale, page),
          );
        }
      }
      await writeFile(resolve(directory, "sitemap.xml"), sitemap());
    },
  };
}
