# Cursor plugin verification — September 14, 2026

Target: Hen Screenshots plugin v0.2.2. Scope: packaging, local discovery, rendering, website instructions, and publication readiness.

## Local package

- `npm run check`: lint, formatting, 690 tests in 52 files, TypeScript, and production build passed.
- Codex plugin manifest validation passed using the plugin-creator validator.
- Extracted the release ZIP into `~/.cursor/plugins/local/hen-screenshots`, without copying dependencies from the source checkout.
- Ran the extracted package's setup and installed-package checks on macOS arm64, Node v22.21.1. Doctor, store series, three isometric panoramas, multiple-device portfolio, language folders, project round trips, invalid configs, corrupt images, overwrite refusal, and source preservation passed.
- The extracted-package checks verify the Cursor manifest, its version, logo, skill frontmatter, and matching versions for the other hosts.

## Actual Cursor application

Cursor 3.20.17 recognized **Hen Screenshots / Local / 0.2.2** in **Customize → Plugins**. Its detail page showed one skill, `create-screenshots`.

A Cursor agent read the installed skill, ran doctor, and rendered the synthetic `atrium` test project to a new directory. It created two 1080 × 1920 PNGs, `preview.png`, `screenshots.zip`, `report.json`, and an editable project. Both PNG hashes matched the corresponding installed-package test outputs. The panorama preview was inspected visually. No personal captures were used for this render.

The first generic “Try in Chat” request attempted a broad file search and was stopped. The successful run used explicit synthetic input and output paths. The public guide therefore asks users to name their captures folder and start inside their app project.

Cursor's one-command health-check approval was used. Its persistent automatic-run policy was not changed.

## Website

- Inspected the new guide section on desktop in English and at 390 px in Spanish and Portuguese.
- Confirmed the Cursor section link, readable wrapping without horizontal page overflow, and the copyable localized prompt.
- All six public routes passed the SEO check, including localized content, canonical/hreflang, social metadata, sitemap, and downloadable plugin checks.
- Corrected installation instructions after observing Cursor: open the plugin detail under Customize → Plugins to find its skill.
- Structured autoreview found no actionable issues; the final UI wording was checked again before commit.

## Directory status

- OpenAI: existing v0.2.1 listing retained; this work does not publish a new OpenAI version.
- Anthropic: **Submitted and pending review**, shown in Henselldev's Console on September 14, four days after submission. The submissions page was opened for the publisher.
- Cursor: local installation works. After explicit authorization to accept Cursor's Publisher Terms, the application was submitted from the Henselldev profile on September 14, 2026. The portal confirmed receipt with **Thanks for applying**. Review is pending. No marketplace approval is claimed.

The [v0.2.2 GitHub Release](https://github.com/Hensell/hen-screenshots/releases/tag/plugin-v0.2.2) contains the exact ZIP from passing [run 34835601082](https://github.com/Hensell/hen-screenshots/actions/runs/34835601082), tested on Ubuntu, Windows, and macOS 14. GitHub and website downloads both match SHA-256 `b2648ae29529c767feaedae7a393b8534ea25af6584b882090b173e7eb486167`. Local Cursor testing on macOS does not establish application-level testing on Windows or Linux.
