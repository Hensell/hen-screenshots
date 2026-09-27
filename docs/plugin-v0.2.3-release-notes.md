# Hen Screenshots plugin v0.2.3

This update adds supporting-text size control to the local renderer and preserves existing screenshot layouts when no size override is present.

- Accepts `style.subtitleSize` in design specifications and retains per-language size overrides in editable projects.
- Preserves template-specific subtitle defaults in previews and exports.
- Resets subtitle size when applying another template, including inherited series settings and linked panoramas.
- Uses the OpenAI directory's supported `Creativity` category in the Codex manifest.

Requires Node.js 22.12+ and one-time setup. Rendering remains local; the package adds no MCP server, account requirement, or API key. Run `doctor` after installation to verify version `0.2.3`.

The shared package includes Claude Code and Cursor manifests, but this release's official-directory submission targets OpenAI only. Their pending directory applications are separate.
