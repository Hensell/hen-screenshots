# Hen Screenshots — local plugin preview

Create screenshot series from a folder of app captures, using the templates and rendering logic from [Hen Screenshots](https://screenshots.hensell.dev/). Get PNGs, a contact-sheet preview, a ZIP organized by language, and an editable `.henscreenshots` project.

This is **v0.1, a local development preview**, prepared for Codex and Claude Code. It has not been submitted to either public plugin directory. There is no `.exe`, account, subscription, MCP server, or background service. Node.js runs the local tool when the agent invokes it.

## Setup

Requires **Node.js 22.12+** and npm. On a supported OS/architecture, npm installs prebuilt native canvas and image-processing libraries. Internet is needed for this one-time setup; rendering itself works offline.

From an extracted, built plugin ZIP:

```sh
cd /path/to/hen-screenshots
npm ci --omit=dev
node scripts/hen.mjs doctor
```

From this repository's source checkout, first run these in the repository root:

```sh
npm ci
npm run plugin:build
node plugins/hen-screenshots/scripts/hen.mjs doctor
```

The ZIP includes the built renderer and licensed fonts, but never `node_modules` or personal screenshots. `npm run plugin:pack` creates `artifacts/hen-screenshots-plugin-0.1.0.zip` in the repository root. Source edits to the renderer require rebuilding it.

## Use with an agent

The skill lives at `skills/create-screenshots/SKILL.md`. Codex and Claude Code have separate compatibility manifests alongside a portable root manifest. Follow the host's local-plugin installation workflow; installing from GitHub alone does not build the renderer or install npm dependencies automatically.

For a Claude Code development session, after setup:

```sh
claude --plugin-dir /absolute/path/to/hen-screenshots
```

For a Codex source-development session, ask it to read the skill at its absolute path, then give it your captures and desired store/portfolio format. The plugin is not registered in your personal marketplace automatically.

Example request:

> Use Hen Screenshots to create a three-slide series from ./captures for Google Play. Try a dark template, write concise English and Spanish captions, and show me the preview before I publish it.

See the [skill](skills/create-screenshots/SKILL.md) and [design spec](skills/create-screenshots/references/design-spec.md). Platform references: [Codex plugins](https://developers.openai.com/plugins/build/plugins) and [Claude Code plugins](https://code.claude.com/docs/en/plugins-reference).

## CLI

Run `node /absolute/path/to/plugin/scripts/hen.mjs` followed by:

```sh
templates --query dark
profiles
languages
create --config ./design.json --out ./output-v1
create --input ./captures --name "My app" --template halo --profile play-phone-portrait --out ./output-v1
inspect --project ./project.henscreenshots
render --project ./project.henscreenshots --out ./output-v2
```

Successful commands print JSON to stdout; failures print `{ "ok": false, "error": "…" }` to stderr and exit nonzero. Outputs always go to a **new directory**. Input files remain unchanged.

## Current boundaries

- Local PNG, JPEG and still WebP inputs, up to 50 MB each, 24 megapixels, 120 MB combined. The web studio supports additional import/conversion formats.
- Templates include panoramas, multiple-device scenes, portfolio layouts, and Play banners. Source-only Wear OS exports require the web studio.
- Agent-supplied captions and translations share one design. No translation model is installed by this plugin.
- Exact export dimensions and opaque RGB PNGs are checked. Review every preview and each store's content rules before uploading.
- Native font rasterization can differ slightly from a browser. Test the release package on each target operating system before public distribution.
- The small authoring config covers the main design controls; import a full project for other editor features.

## Before public distribution

Choose the repository's code license, complete platform installation and OS compatibility checks, and prepare release notes and directory metadata. The font licenses are included with the built assets; dependency licenses remain in their installed packages. No open-source code license has been selected in the repository yet. This preview does not establish a new one.

Read [privacy and local file access](PRIVACY.md). Feedback: [hensell@hensell.dev](mailto:hensell@hensell.dev). If Hen helps you, [give the repository a star](https://github.com/Hensell/hen-screenshots).
