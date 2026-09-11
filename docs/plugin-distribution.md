# Plugin distribution

Hen Screenshots **v0.2.1** is published in the [GitHub Release](https://github.com/Hensell/hen-screenshots/releases/tag/plugin-v0.2.1) and the [OpenAI Plugins Directory](https://chatgpt.com/plugins/plugins_6aa32bb05be881918e9fa402a5a1cde6), verified on September 10, 2026. The MIT-licensed package is also available through the repository marketplaces and website ZIP. Anthropic's submission remains pending review.

Version 0.2.1 adds schema 11 project imports and background-image rendering. See the [release notes](plugin-v0.2.1-release-notes.md). A website deployment does not update an installed plugin or an official directory listing.

## Install

See the [plugin README](../plugins/hen-screenshots/README.md) for Codex, Claude Code, ZIP installation, updates, requirements, and troubleshooting. The [website guide](https://screenshots.hensell.dev/agents/) provides translated instructions.

The repository contains `.agents/plugins/marketplace.json` for Codex and `.claude-plugin/marketplace.json` for Claude Code. Both point to `plugins/hen-screenshots`, which includes the built renderer, icon, and fonts. The user or agent runs `scripts/setup.mjs` once in the installed plugin directory to download the locked dependencies and run doctor.

No `node_modules`, personal captures, or project files belong in the release archive. Setup does not require a source build, administrator privileges, or a Hen service.

## Verification

Release v0.2.1 passed [run 34544076299](https://github.com/Hensell/hen-screenshots/actions/runs/34544076299) at commit `6f800c633ae6c1dbb2d15ecbf1ce45c59603f793` on September 10, 2026:

| Runner   | Platform / architecture | Node.js | Installation and rendering |
| -------- | ----------------------- | ------- | -------------------------- |
| Ubuntu   | Linux x64               | 22.23.2 | Passed                     |
| Windows  | Windows x64             | 22.23.2 | Passed                     |
| macOS 14 | macOS arm64             | 22.23.2 | Passed                     |

The published ZIP came from that run. Its SHA-256 is `7664c3af86170ff1d038b3733b013de75deeb18d402c98fce92167fdbe291c24`. The GitHub download and website ZIP were checked against the CI archive. A Windows panorama preview was also inspected visually. Release archives are immutable; their bundled README reflects the publication state at build time. This document and the website guide track subsequent directory publication.

The [package-check workflow](../.github/workflows/plugin-release-check.yml) builds the ZIP once, validates the Claude manifests, and verifies the archive checksum before installing and testing the same ZIP on Ubuntu, Windows, and macOS runners. Inspect [workflow results](https://github.com/Hensell/hen-screenshots/actions/workflows/plugin-release-check.yml) and each `qa-report.json` for the actual OS, architecture, Node version, and outcome.

The installed-package test checks store output, three isometric panoramas, a multiple-device portfolio, language folders, editable project round trips, invalid configs, corrupt images, original-image preservation, and refusal to overwrite existing outputs. It checks PNG dimensions, bit depth, color type, and ZIP contents. Native rendering can differ visually between operating systems and from the web canvas.

Local release preparation also tests the Codex and Claude Code marketplace installation commands. This proves package discovery and installation, not the quality of every model-generated caption or design.

## Publish a plugin update

1. Update the plugin version together in `package.json`, `package-lock.json`, `plugin.json`, `.codex-plugin/plugin.json`, and `.claude-plugin/plugin.json`. The web guide and CLI read the package version.
2. Run `npm ci`, `npm run check`, and `npm run plugin:pack` from the source root. Include the regenerated renderer, public assets, and license in the commit.
3. Extract the ZIP outside the repository, run its setup command, then run `node scripts/test-plugin-package.mjs /absolute/path/to/extracted/hen-screenshots`. Inspect `preview.png` and full-size PNGs in the reported output folder.
4. Push the reviewed commit and wait for the package-check workflow for that exact commit. Investigate any failing platform before advertising support.
5. Download the `hen-plugin-package` artifact from that passing workflow. Use that ZIP and checksum for the release so the published archive is the one tested on all runners.
6. Create an immutable version tag such as `plugin-v0.2.0` at the tested commit, and publish a GitHub Release containing the ZIP, checksum, release notes, supported systems, and limitations. Do not replace an existing version's files; publish a new version instead.
7. Verify the public download and checksum. Keep the website guide and roadmap accurate. Official directory updates are a separate step.

`npm run plugin:pack` uses fixed ZIP timestamps and produces a `.sha256` companion file. This makes repeated packaging of identical inputs comparable. Node/build-tool changes can still change the bundle; retain the CI artifact used for a release.

## Official directory readiness

Last documentation check: September 10, 2026. Recheck the official requirements before submitting.

### OpenAI

Version **0.2.1** was submitted, approved, and published on September 10, 2026 as an update to the existing listing. The automated skill scan passed. After the publisher reaffirmed the required terms and compliance declarations, the portal marked the version **Approved**. Publication then completed, and the portal confirmed **Published** with a [View in Directory link](https://chatgpt.com/plugins/plugins_6aa32bb05be881918e9fa402a5a1cde6).

The upload passed package validation after changing the Codex manifest's category from `Design` to the supported `Creativity` value in a separate submission ZIP. Its renderer, skill, dependencies, fonts, and other files are identical to the tested v0.2.1 GitHub package; the published GitHub release archive remains unchanged. The OpenAI upload ZIP has SHA-256 `5bbf8f0a24caa0dc3067bf4397fa3b5a9e7d35fe19c3b18a81b68f96bca72ec3`.

Hen has no MCP server and uses the skills-only submission path. OpenAI's migration guide asks developers whose core workflow relies on local execution or offline operation to contact their OpenAI partner before submission. A review-path inquiry describing Hen's local CLI, setup, permissions, and offline rendering was sent to OpenAI support before submission and escalated to a specialist. Any follow-up will be addressed separately; the confirmed publication status comes from the plugin portal. [Official guidance](https://developers.openai.com/plugins/guides/submit-claude-plugin).

The public submission needs a verified publisher identity, Apps Management write access, required listing and policy URLs, and compliance declarations. Keep release notes and five positive plus three negative reviewer scenarios ready as described in the [submission requirements](https://developers.openai.com/plugins/deploy/submission). The skills-only v0.2.1 update flow requested Plugin Info, Prompts, Skills, and the final declarations; it did not expose separate release-note or test-case fields. Submit through the [plugin portal](https://platform.openai.com/plugins) and complete the fields required by the actual flow.

### Anthropic

Submitted for Claude Code through the Console on September 10, 2026. The Console confirmed receipt and shows **Submitted and pending review**. Cowork was not selected because it has not been tested. This is a review request, not a public listing or endorsement.

Validate the package with `claude plugin validate`, then submit its public GitHub repository or ZIP through [Claude](https://claude.ai/settings/plugins/submit) or the [Console](https://platform.claude.com/plugins/submit). Inclusion and verified status are subject to Anthropic's review. [Official submission guide](https://claude.com/docs/plugins/submit).

The repository marketplace provides direct distribution while official-directory work remains pending. [Marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces).

### Still pending for official listings

- Anthropic's review and any requested follow-up.
- Any OpenAI support follow-up about the local-execution review path.
- Keep future directory versions and their metadata aligned with the tested release packages. Publication does not imply endorsement by either platform.

See the [roadmap](../ROADMAP.md) for the wider project priorities.
