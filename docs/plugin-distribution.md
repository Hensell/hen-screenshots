# Plugin distribution

Hen Screenshots [v0.2.0](https://github.com/Hensell/hen-screenshots/releases/tag/plugin-v0.2.0) is the first packaged GitHub release of the local plugin. It is distributed under MIT through the repository marketplaces and a downloadable ZIP. Official OpenAI and Anthropic directory submissions remain pending.

## Install

See the [plugin README](../plugins/hen-screenshots/README.md) for Codex, Claude Code, ZIP installation, updates, requirements, and troubleshooting. The [website guide](https://screenshots.hensell.dev/agents/) provides translated instructions.

The repository contains `.agents/plugins/marketplace.json` for Codex and `.claude-plugin/marketplace.json` for Claude Code. Both point to `plugins/hen-screenshots`, which includes the built renderer, icon, and fonts. The user or agent runs `scripts/setup.mjs` once in the installed plugin directory to download the locked dependencies and run doctor.

No `node_modules`, personal captures, or project files belong in the release archive. Setup does not require a source build, administrator privileges, or a Hen service.

## Verification

Release v0.2.0 passed [run 34533266931](https://github.com/Hensell/hen-screenshots/actions/runs/34533266931) at commit `78208aaea522479d0b549583c9326cb230c4f4e5` on September 10, 2026:

| Runner   | Platform / architecture | Node.js | Installation and rendering |
| -------- | ----------------------- | ------- | -------------------------- |
| Ubuntu   | Linux x64               | 22.23.2 | Passed                     |
| Windows  | Windows x64             | 22.23.2 | Passed                     |
| macOS 14 | macOS arm64             | 22.23.2 | Passed                     |

The published ZIP came from that run. Its SHA-256 is `cd2b31a4f45e62ef4324f9e841cebd42e161da05da6316be0df7c9e944be5511`. Two local builds produced the same bytes as CI. Preview images were also inspected visually.

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

Hen has no MCP server, so a skills-only submission is the starting point. OpenAI's migration guide asks developers whose core workflow relies on local execution or offline operation to contact their OpenAI partner before submission. Confirm that review path for Hen. [Official guidance](https://developers.openai.com/plugins/guides/submit-claude-plugin).

The public submission also needs a verified publisher identity, Apps Management write access, required listing and policy URLs, starter prompts, release notes, and five positive plus three negative test cases. Submit through the [plugin portal](https://platform.openai.com/plugins) and complete its review. [Submission requirements](https://developers.openai.com/plugins/deploy/submission).

### Anthropic

Validate the package with `claude plugin validate`, then submit its public GitHub repository or ZIP through [Claude](https://claude.ai/settings/plugins/submit) or the [Console](https://platform.claude.com/plugins/submit). Inclusion and verified status are subject to Anthropic's review. [Official submission guide](https://claude.com/docs/plugins/submit).

The repository marketplace provides direct distribution while official-directory work remains pending. [Marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces).

### Still pending for official listings

- Publisher verification and OpenAI's local-execution review path.
- Final public listing fields and policy/terms URLs required by each portal.
- Submission of the package and test cases; neither official directory has approved this release.

See the [roadmap](../ROADMAP.md) for the wider project priorities.
