# Plugin distribution readiness

Checked on September 10, 2026. Platform requirements can change; recheck the official links before submitting.

Hen Screenshots currently provides a **v0.1.0 local development preview**, downloadable through the [AI agents guide](https://screenshots.hensell.dev/agents/). It is not listed in either official plugin directory. The [roadmap](../ROADMAP.md#agent-plugin-prepare-a-distributable-release) tracks the remaining work.

## What is already in the repository

- A portable manifest plus separate Codex and Claude Code compatibility manifests.
- A screenshot-creation skill, design reference, and local CLI.
- A build and packaging script that includes the renderer, icon, and licensed fonts in the ZIP.
- Pinned npm dependencies and a `doctor` command for runtime checks.
- Installation instructions, example prompts, and a [privacy and file-access explanation](../plugins/hen-screenshots/PRIVACY.md).

The plugin uses Node.js 22.12+ with native rendering dependencies. It does not contain an MCP server. Rendering works locally after dependency installation; users do not need a Hen account or an `.exe` installer.

## Gaps before a release

| Area                 | Current state                                                    | Next step                                                                                                  |
| -------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Code license         | No application or plugin code license selected                   | Choose a license and include it with the source and release package. Preserve dependency and font notices. |
| Release              | The website builds a preview ZIP; no GitHub Release is published | Create a tested, versioned release with a checksum and release notes.                                      |
| Installation         | Setup requires npm and the built package                         | Test from a clean extraction in each agent host and document supported OS/architecture combinations.       |
| Marketplace catalogs | No repository catalogs for Codex or Claude Code                  | Add the host-specific catalogs and test installation, updates, and package completeness.                   |
| Listing              | Name, descriptions, icon, website, and support contact exist     | Complete the required public links and test examples for each directory.                                   |
| Official directories | No submission completed                                          | Follow each platform's process below and record the outcome.                                               |

The source checkout alone is not an installable release: generated `dist/`, fonts, and the icon are ignored by Git. A marketplace entry pointing at the source directory must not imply that those files or npm dependencies will be installed automatically. The tested distribution path must provide them.

## Codex and OpenAI

The appropriate starting point is a **skills-only plugin** because Hen has no MCP server. OpenAI accepts a packaged skill with its helpers and assets. Its migration guidance asks developers whose core workflow depends on local execution or offline operation to contact their OpenAI partner before submission; Hen fits that description, so confirm this review path before promising a public listing. [Official guidance](https://developers.openai.com/plugins/guides/submit-claude-plugin).

Public submission also requires a verified individual or business publisher identity, organization access with **Apps Management: Write**, listing and policy URLs, starter prompts, release notes, and five positive plus three negative test cases. Submission is through the [OpenAI plugin portal](https://platform.openai.com/plugins), followed by review. [Submission requirements](https://developers.openai.com/plugins/deploy/submission).

Direct distribution through a repository marketplace is a separate option. Codex documents a repository catalog at `.agents/plugins/marketplace.json`; this catalog still needs to be added and tested for Hen. [Packaging and marketplace documentation](https://developers.openai.com/plugins/build/plugins).

## Claude Code and Anthropic

Anthropic accepts a public GitHub repository or a plugin ZIP for its directory. Validate the package with `claude plugin validate` before submitting through [Claude's submission form](https://claude.ai/settings/plugins/submit) or the [Console form](https://platform.claude.com/plugins/submit). The listing is subject to review; a submission does not guarantee a verified badge. [Official submission guide](https://claude.com/docs/plugins/submit).

For direct distribution, a repository marketplace uses `.claude-plugin/marketplace.json`. Users add the marketplace and then install a plugin from it. Hen does not yet provide that catalog. [Official marketplace guide](https://code.claude.com/docs/en/plugin-marketplaces).

## Suggested release checks

Use non-private fixture images and a fresh output directory for each check:

- Create a three-slide store series and inspect the preview and PNG dimensions.
- Create a linked panorama and check the seam in the two exported images.
- Render a portfolio scene with multiple devices.
- Export two language versions and inspect the language folders.
- Reopen the generated `.henscreenshots` project in the web studio and edit it.
- Check that invalid images and invalid design settings produce useful errors.
- Check that an existing output directory and original source images are never overwritten.
- Verify that missing runtime dependencies produce actionable setup instructions.

These are proposed release checks, not a claim that fresh installations or directory submissions have already passed. Once they are run, record the package version, host, operating system, results, and any limitations.
