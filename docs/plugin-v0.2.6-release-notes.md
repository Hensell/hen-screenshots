# Hen Screenshots plugin 0.2.6

Create app-store screenshots and portfolio mockups from local captures in Codex, Claude Code, Cursor, and Gemini CLI.

- Adds Gemini CLI manifests for repository and extracted ZIP installation, using the shared screenshot skill and renderer.
- Adds Apple device export sizes, including iPad 11-inch, with matching frame variants and landscape orientation.
- Adds Google Play large-screen presets up to 7680 px.
- Makes editing capacity consistent at 50 slides for adding, duplicating, and panoramas. Store publication limits still apply to store exports.
- Preserves imported typography and exports editable `.henscreenshots` projects alongside PNGs, previews, and language ZIPs.

Requires Node.js 22.12+ and npm. Setup downloads pinned rendering dependencies; rendering then works locally. Platform checks and official-directory publication status are recorded in `docs/plugin-distribution.md`.
