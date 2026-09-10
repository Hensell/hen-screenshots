import { version as pluginVersion } from "../../plugins/hen-screenshots/package.json";
import { parseArgs } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, rm } from "node:fs/promises";
import { templates, applyTemplate } from "../core/templates";
import { bannerTemplates } from "../core/banner-templates";
import { exportProfiles, isBannerProfile } from "../core/export-profiles";
import { languages } from "../core/localization";
import { LIMITS, createProject, createShot } from "../core/model";
import { importProject } from "../storage/backup";
import { importBrandKit } from "../storage/brand-backup";
import { parseDesignSpec, buildDesign, specImagePaths } from "./spec";
import {
  readLocalFile,
  readAssets,
  decodeNativeImages,
  localPath,
} from "./files";
import { writeDesign, loadNativeFonts } from "./render";

const help = `Hen Screenshots local plugin · ${pluginVersion}

hen templates [--query dark]       List template IDs and required images
hen profiles                      List export profiles and dimensions
hen languages                     List supported caption languages
hen doctor                        Check the local renderer and fonts
hen create --config design.json --out ./output
hen create --input ./captures --name "My app" --template halo --profile play-phone-portrait --out ./output
hen render --project app.henscreenshots --out ./output
hen inspect --project app.henscreenshots

Every create/render writes a NEW output directory: preview.png, project.henscreenshots,
screenshots.zip, report.json and PNGs in language folders. Existing directories are never overwritten.
Input folders accept PNG, JPEG and still WebP. Paths in design.json are relative to that file.
Use the design-spec reference in this plugin for captions, brand kits, panoramas and translations.`;
export async function main(argv = process.argv.slice(2)) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      query: { type: "string" },
      config: { type: "string" },
      input: { type: "string" },
      out: { type: "string" },
      name: { type: "string" },
      template: { type: "string" },
      profile: { type: "string" },
      device: { type: "string" },
      project: { type: "string" },
    },
  });
  const [command = "help", ...extra] = positionals;
  if (extra.length)
    throw new Error(
      "Unexpected arguments. Quote file paths and names that contain spaces.",
    );
  if (values.help || command === "help") {
    process.stdout.write(help + "\n");
    return;
  }
  const print = (value: unknown) =>
    process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  const fonts = fileURLToPath(
    new URL(/* @vite-ignore */ "../assets/fonts/", import.meta.url),
  );
  if (command === "templates") {
    const query = (values.query ?? "").toLowerCase();
    print(
      [...templates, ...bannerTemplates]
        .filter((t) => JSON.stringify(t).toLowerCase().includes(query))
        .map((t) => {
          const p = createProject();
          p.exportProfile = t.id.startsWith("banner-")
            ? "play-feature-graphic"
            : "play-phone-portrait";
          p.shots.push(createShot("example", 0));
          applyTemplate(p, p.shots[0].id, t.id);
          return {
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            appearance: t.appearance,
            workspace: t.id.startsWith("banner-") ? "banners" : "screenshots",
            slides: p.shots.length,
            companionImages: p.shots[0].companions?.length ?? 0,
          };
        }),
    );
    return;
  }
  if (command === "profiles") {
    print(
      exportProfiles.map((p) => ({
        ...p,
        pluginSupported: !("sourceOnly" in p && p.sourceOnly),
      })),
    );
    return;
  }
  if (command === "languages") {
    print(languages.map(([code, name]) => ({ code, name })));
    return;
  }
  if (command === "doctor") {
    loadNativeFonts(fonts);
    print({
      ok: true,
      version: pluginVersion,
      node: process.version,
      renderer: "Konva + Skia",
      fonts: ["Manrope", "Fraunces"],
      runtime: "local",
      networkRequiredForRendering: false,
    });
    return;
  }
  if (!["create", "render", "inspect"].includes(command))
    throw new Error(`Unknown command: ${command}. Run hen --help.`);
  if (command !== "inspect" && !values.out)
    throw new Error("Choose a new output directory with --out.");
  let loaded;
  if (command === "render" || command === "inspect") {
    if (!values.project)
      throw new Error("Choose a .henscreenshots file with --project.");
    const file = await readLocalFile(
      resolve(values.project),
      LIMITS.totalBytes + 4 * 1024 * 1024,
    );
    loaded = await importProject(file, decodeNativeImages);
    if (command === "inspect") {
      print({
        project: loaded.project,
        assets: loaded.assets.map(({ blob, ...info }) => ({
          ...info,
          bytes: blob.size,
        })),
      });
      return;
    }
  } else {
    if (Boolean(values.config) === Boolean(values.input))
      throw new Error(
        "Choose either --config design.json or --input captures-folder.",
      );
    if (
      values.config &&
      [values.name, values.template, values.profile, values.device].some(
        (v) => v !== undefined,
      )
    )
      throw new Error(
        "With --config, put the name, template, profile and device in the JSON file.",
      );
    let raw: unknown, directory: string;
    if (values.config) {
      const path = resolve(values.config);
      directory = dirname(path);
      const file = await readLocalFile(path, 1024 * 1024);
      try {
        raw = JSON.parse(await file.text());
      } catch {
        throw new Error("The design config is not valid JSON.");
      }
    } else {
      directory = resolve(values.input!);
      const entries = await readdir(directory, { withFileTypes: true });
      const paths = entries
        .filter((e) => e.isFile() && /\.(png|jpe?g|webp)$/i.test(e.name))
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
      const profile = values.profile ?? "play-phone-portrait";
      raw = {
        version: 1,
        name: values.name ?? "My app",
        profile,
        template:
          values.template ??
          (isBannerProfile(profile) ? "banner-signal" : "studio"),
        ...(values.device ? { device: values.device } : {}),
        slides: paths.map((image) => ({
          image,
          title: image.replace(/\.[^.]+$/, "").slice(0, 100),
          subtitle: "",
        })),
      };
    }
    const spec = parseDesignSpec(raw);
    const images = await readAssets(specImagePaths(spec), directory);
    const brand = spec.brandKit
      ? await importBrandKit(
          await readLocalFile(localPath(spec.brandKit, directory), 128 * 1024),
        )
      : undefined;
    loaded = {
      project: buildDesign(spec, images, brand),
      assets: [...new Map([...images.values()].map((a) => [a.id, a])).values()],
      revision: 0,
    };
  }
  const out = resolve(values.out!);
  await mkdir(dirname(out), { recursive: true });
  try {
    await mkdir(out);
  } catch (cause) {
    throw new Error(
      `Cannot create output directory “${out}”. Choose a new path; existing work is never overwritten.`,
      { cause },
    );
  }
  try {
    const report = await writeDesign(loaded.project, loaded.assets, out, fonts);
    print({ ok: true, output: out, ...report });
  } catch (error) {
    // Only remove the new directory that this invocation successfully reserved.
    await rm(out, { recursive: true, force: true });
    throw error;
  }
}
