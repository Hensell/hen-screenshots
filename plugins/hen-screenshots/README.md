# Hen Screenshots — local agent plugin

Create screenshot series from local captures with the same templates and scene engine as [Hen Screenshots](https://screenshots.hensell.dev/). Export PNGs, a contact-sheet preview, a ZIP organized by language, and an editable `.henscreenshots` project.

**Version 0.2.2 · MIT · Local rendering.** Available from GitHub and the website. The OpenAI directory lists v0.2.1. Version 0.2.2 adds Cursor packaging and keeps support for project background images (schema 11). Anthropic review is pending. Cursor is available by local installation; it is not yet listed in the Cursor Marketplace. No Hen account, API key, MCP server, background service, or `.exe` is required. Your agent provider's plan and data policies still apply.

## Requirements

- Node.js **22.12+**, including npm, available in your agent's terminal.
- Codex, Claude Code, or Cursor with local file and terminal access.
- Internet for installation of pinned npm packages and native rendering libraries. Rendering works offline after setup.

The release checks exercise clean ZIP installation and rendering on GitHub's Ubuntu, Windows, and macOS runners. See the [package checks](https://github.com/Hensell/hen-screenshots/actions/workflows/plugin-release-check.yml) for the actual results and OS/architecture reports. Other systems and architectures are not certified by that matrix.

## Install in Codex

Run in a terminal with the Codex CLI:

```sh
codex plugin marketplace add Hensell/hen-screenshots
codex plugin add hen-screenshots@hen-screenshots
```

Start a new local task after installation. Ask Codex:

> Use Hen Screenshots. Run its doctor command, and complete the one-time setup if dependencies are missing. Then create a three-slide Google Play series from my captures, and show me the preview before exporting.

The skill resolves its own installed folder. Dependencies must be installed there, not in your app's repository or another copy of the plugin. The setup command is `node "PLUGIN_FOLDER/scripts/setup.mjs"`, where `PLUGIN_FOLDER` is the actual installed plugin directory.

## Install in Claude Code

Inside Claude Code:

```text
/plugin marketplace add Hensell/hen-screenshots
/plugin install hen-screenshots@hen-screenshots
```

Start a new session and invoke `/hen-screenshots:create-screenshots`. Ask it to run doctor and complete setup before the first render, as in the Codex example above.

These commands install from the Hen repository marketplace. They do not install from either platform's official directory.

## Install in Cursor

Download and verify the v0.2.2 ZIP from [GitHub Releases](https://github.com/Hensell/hen-screenshots/releases), then extract it. Copy the **whole** `hen-screenshots` directory, including hidden manifest folders, into Cursor's local plugin directory:

- macOS / Linux: `~/.cursor/plugins/local/hen-screenshots`
- Windows: `%USERPROFILE%\.cursor\plugins\local\hen-screenshots`

The final folder must contain `plugin.json`, `.cursor-plugin/plugin.json`, `skills`, `scripts`, `dist`, and `assets` directly. Do not nest a second `hen-screenshots` folder inside it, and do not copy only the skill file.

Run setup from that final folder:

```sh
node scripts/setup.mjs
```

Restart Cursor, then open **Customize → Plugins → Hen Screenshots** and confirm that `create-screenshots` appears under Skills. Start a new agent chat in your app project and ask:

> Use the Hen Screenshots create-screenshots skill. Run doctor and complete setup if needed. Create a two-slide panorama from my local captures, with English and Spanish captions. Export to a new folder named cursor-launch-v1 and show me the preview and editable project.

This uses [Cursor's documented local plugin loader](https://cursor.com/docs/plugins#test-plugins-locally), without waiting for a marketplace listing. Teams and Enterprise policies may block local plugin imports; ask your administrator if the skill does not appear. An installed marketplace plugin with the same name takes precedence over a local copy.

For development, the repository's `.cursor-plugin/marketplace.json` points to `plugins/hen-screenshots`; all three agents share the same skill and renderer. No MCP connection or VS Code extension is needed.

## Download a ZIP instead

Download the ZIP and matching `.sha256` file from [GitHub Releases](https://github.com/Hensell/hen-screenshots/releases), or use the [website setup guide](https://screenshots.hensell.dev/agents/). Keep the extracted `hen-screenshots` directory somewhere permanent.

From the extracted directory:

```sh
node scripts/setup.mjs
```

Setup installs the locked dependencies in that directory and runs `doctor`. It does not install Node globally or alter your source images. A successful check reports `"ok": true` and version `0.2.2`.

To verify the archive before extracting it:

```sh
# macOS
shasum -a 256 -c hen-screenshots-plugin-0.2.2.zip.sha256
# Linux
sha256sum -c hen-screenshots-plugin-0.2.2.zip.sha256
```

On Windows, use `Get-FileHash .\hen-screenshots-plugin-0.2.2.zip -Algorithm SHA256` in PowerShell and compare the hash with the `.sha256` file.

For a Claude Code session using the extracted ZIP:

```sh
claude --plugin-dir "PLUGIN_FOLDER"
```

For Codex without a marketplace installation, ask it to read `PLUGIN_FOLDER/skills/create-screenshots/SKILL.md` and use its CLI. Use an absolute path and replace the placeholder with your actual directory.

## Update

For Codex, refresh the repository and reinstall the plugin:

```sh
codex plugin marketplace upgrade hen-screenshots
codex plugin add hen-screenshots@hen-screenshots
```

For Claude Code:

```text
/plugin marketplace update hen-screenshots
/plugin update hen-screenshots@hen-screenshots
```

For Cursor local installation, move the previous `hen-screenshots` folder out of `~/.cursor/plugins/local` (keep it as a backup), put the new extracted folder in its place, run setup there, and reload Cursor. Keep only one local copy with this plugin name. A website deployment does not refresh that folder.

For a ZIP installation, extract the new release to a new directory and run setup there. Keep your captures and outputs outside the plugin folder. After any update, start a new agent session and run doctor; a new cache directory may need setup again.

## CLI

Run `node "PLUGIN_FOLDER/scripts/hen.mjs"` followed by:

```sh
templates --query dark
profiles
languages
doctor
create --config ./design.json --out ./output-v1
create --input ./captures --name "My app" --template halo --profile play-phone-portrait --out ./output-v1
inspect --project ./project.henscreenshots
render --project ./project.henscreenshots --out ./output-v2
```

Successful commands return JSON; failures return `{ "ok": false, "error": "…" }` on stderr with a nonzero exit code. Outputs go to a **new directory**. Inputs are unchanged. Read the [design spec](skills/create-screenshots/references/design-spec.md) for captions, panoramas, device placement, brand kits, and language versions.

## Boundaries

- Local PNG, JPEG, and still WebP inputs: up to 50 MB per file, 24 megapixels per image, and 120 MB combined. Use the web studio for additional import formats.
- Templates include panoramas, multiple-device scenes, portfolio layouts, and Play banners. Source-only Wear OS exports require the web studio.
- Translations are supplied by you or your agent. This plugin does not download a translation model or call an AI API.
- Export dimensions and opaque RGB PNGs are checked. Review the preview and store content rules before uploading.
- Native and browser font rendering can differ. Compare typography before publication.
- Design spec v1 covers the main authoring controls; import a full project for other editor features.

## Development and releases

The Git marketplace includes the built renderer, fonts, and icon so a source install does not depend on web build tools. Changes to shared rendering code require `npm run plugin:build` in the repository root. Commit the regenerated bundle when releasing an updated plugin.

`npm run plugin:pack` builds a ZIP and SHA-256 checksum in `artifacts/`. Packaging uses fixed ZIP timestamps. Bump the plugin version consistently in all manifests and its lockfile when publishing changes. Website builds also refresh their plugin download. See [release instructions](https://github.com/Hensell/hen-screenshots/blob/main/docs/plugin-distribution.md).

## License and privacy

[MIT](LICENSE). Fonts and dependencies retain their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md). Read [privacy and local file access](PRIVACY.md).

Feedback: [hensell@hensell.dev](mailto:hensell@hensell.dev). If Hen helps you, [star the repository](https://github.com/Hensell/hen-screenshots) or [support development](https://ko-fi.com/hensell).
