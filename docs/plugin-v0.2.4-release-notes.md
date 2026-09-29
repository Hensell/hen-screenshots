# Hen Screenshots plugin v0.2.4

This update preserves typography copied in the Hen web studio when importing and rendering editable projects.

- Retains title and supporting-text font weights, title scale, line height, and supporting-text opacity.
- Accepts these attributes as explicit style overrides in agent design specifications.
- Preserves template defaults when overrides are absent, with validation for supported values.
- Verifies styled project import and deterministic re-rendering in the installed-package checks.

The web studio provides Copy style, Paste style, Paste only colors, and Paste only typography. The CLI uses explicit style overrides and does not add clipboard commands.

Requires Node.js 22.12+ and one-time setup. Run `doctor` after updating to verify version `0.2.4`. Rendering remains local. Includes Codex, Claude Code, and Cursor manifests; official-directory updates are separate from this release.
