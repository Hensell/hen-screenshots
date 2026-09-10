# Hen Screenshots plugin v0.2.0

Create app-store screenshots and portfolio mockups from local captures in Codex or Claude Code. This release adds GitHub marketplace installation, a ready-to-run renderer, and a setup command to the earlier local preview.

## Install

Follow the [installation guide](https://github.com/Hensell/hen-screenshots/blob/plugin-v0.2.0/plugins/hen-screenshots/README.md). Download the ZIP and `.sha256` file below for a standalone installation, or add `Hensell/hen-screenshots` as a marketplace in your agent.

Requires Node.js 22.12+ and npm. Run `node scripts/setup.mjs` inside an extracted ZIP. For marketplace installs, ask the agent to run doctor and complete setup in its installed plugin folder. Setup downloads dependencies; subsequent rendering is local and works offline.

## Included

- 57 screenshot templates, including 11 linked panoramas and three isometric panorama designs, plus Play banner templates.
- Phone, tablet, desktop, and multiple-device compositions.
- Captions and language versions supplied by you or your agent.
- Full-size opaque RGB PNGs, a contact-sheet preview, language-organized ZIPs, and an editable `.henscreenshots` project.
- MIT license, bundled font licenses, and third-party notices.

## Checks and limitations

The package-check workflow installs the release ZIP on Ubuntu, Windows, and macOS and records each runner's actual platform and architecture. Its tests cover dimensions, PNG format, panoramas, language folders, project round trips, invalid inputs, and overwrite protection. See the workflow attached to the tagged commit for results.

Inputs: PNG, JPEG, and still WebP; 50 MB and 24 megapixels per image, 120 MB combined. Other import formats and source-only Wear OS exports require the web studio. Native typography can differ from the browser. Review captions, crops, and store content requirements before publication.

The plugin is available from GitHub, not the official OpenAI or Anthropic directories. It does not include an AI subscription or translation model. Files shared with your agent follow that provider's policies.

[Privacy](https://github.com/Hensell/hen-screenshots/blob/plugin-v0.2.0/plugins/hen-screenshots/PRIVACY.md) · [Feedback](https://github.com/Hensell/hen-screenshots/issues) · [Hen Screenshots](https://screenshots.hensell.dev/)
