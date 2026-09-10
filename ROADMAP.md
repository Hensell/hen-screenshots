# Hen Screenshots roadmap

Last updated: September 10, 2026.

The next priority is helping new users create and export a series without needing a walkthrough. This roadmap sets a direction; it does not promise release dates. Priorities can change as people use the app and share feedback.

The hosted editor will remain free, with no account or watermarks. The application and plugin code are available under the [MIT license](LICENSE).

## Available today

- App Store and Google Play screenshots, Google Play banners, and portfolio mockups.
- 57 templates, including 11 linked panoramas and three panoramas with fixed isometric device poses.
- Phone, tablet, desktop, and multiple-device layouts, with movable text, device resizing, and 360° rotation.
- Template search, filters, pagination, and favorites.
- Personal templates with editable captions, background images, and artwork. Save slides or panoramas, reuse them with new captures, and import/export `.hentemplate` files.
- Reusable brand kits, language versions, and optional on-device translation packs.
- Local project storage, portable backups, publication previews, and exports checked for the selected format and dimensions.
- English, Spanish, and Brazilian Portuguese interfaces.
- A downloadable local agent plugin, [setup guide](https://screenshots.hensell.dev/agents/), and [published OpenAI directory listing](https://chatgpt.com/plugins/plugins_6aa32bb05be881918e9fa402a5a1cde6). The Anthropic directory submission is pending review.

## Next: make the first export easier

Status: planned. This is the first priority.

- [ ] Observe five new users creating and exporting a series without live guidance. Record where they hesitate or need help.
- [ ] Turn reproducible upload, template-selection, canvas-editing, and export problems into focused issues.
- [ ] Fix the most common blockers and check the affected flows with keyboard input and small screens.
- [ ] Recheck the complete journey: create a project, add slides and images, customize, preview, export, and reopen a backup.

Success means those users can finish a series independently and the observed blockers have fixes verified in both the preview and exported files. Feedback sessions are voluntary; this plan does not introduce background analytics or screenshot collection.

## After that: collections shaped by real apps

Status: planned, with the order guided by requests.

- [ ] Gather examples and needs from productivity, finance, and game developers.
- [ ] Build small collections with distinct compositions, readable captions, and useful device positions.
- [ ] Include real, permissioned example captures so users can judge the result before choosing a design.
- [ ] Check each new design across its supported canvas sizes, devices, language versions, and exports.

A collection is ready when it solves a specific presentation need and works with users' own images. Template count alone is not a release target.

## Agent plugin: available; directory versions tracked separately

Current website and repository download: **v0.2.1**, with background-image rendering and schema 11 project support. [Personal-template workflow](README.md#your-own-reusable-templates).

Directory/release status: [v0.2.0 published on GitHub](https://github.com/Hensell/hen-screenshots/releases/tag/plugin-v0.2.0) and in the [OpenAI Plugins Directory](https://chatgpt.com/plugins/plugins_6aa32bb05be881918e9fa402a5a1cde6). Submitted to Anthropic for review on September 10, 2026.

- [x] Choose and add the code license, and include the required license notices in the release archive.
- [x] Test the extracted release package outside the source checkout, plus GitHub marketplace installation in Codex and an isolated Claude Code configuration.
- [x] Verify native rendering on Linux x64, Windows x64, and macOS arm64. Record the exact systems in the [release verification](docs/plugin-distribution.md#verification).
- [x] Publish a versioned GitHub Release with a built ZIP, checksum, release notes, and a reproducible build process.
- [x] Add and test repository marketplace catalogs for direct installation in each host. Include the built renderer, fonts, and dependency setup.
- [x] Prepare listing assets, public support/privacy links, and repeatable success and failure examples. Complete each portal's required fields and attestations.
- [x] Validate the Claude Code package and repository marketplace.
- [x] Submit the package to the Anthropic plugin directory for Claude Code. Awaiting review; not yet listed or approved.
- [x] Complete OpenAI publisher verification and create the skills-only draft.
- [x] Pass OpenAI's package validation and automated skill scan.
- [x] Submit to OpenAI, receive approval in the portal, and publish the approved version in its directory.
- [ ] Publish v0.2.1 as an immutable GitHub Release and submit the corresponding OpenAI directory update. The current website ZIP and repository marketplace already provide v0.2.1.
- [ ] Address any follow-up from Anthropic review or OpenAI support about local execution.
- [x] Update the website guide with verified GitHub and ZIP installation instructions in English, Spanish, and Brazilian Portuguese.

See [plugin distribution readiness](docs/plugin-distribution.md) for the current gaps and official submission references. Direct distribution and inclusion in an official directory are separate milestones; directory approval is handled by each platform.

## Help choose what comes next

[Open an issue](https://github.com/Hensell/hen-screenshots/issues/new) with the task you were trying to complete, what got in the way, and an example if you can share one. For a template request, include the destination, device combination, and visual style you need.

Only share images or project files you are comfortable making public. Private feedback can go to [hensell@hensell.dev](mailto:hensell@hensell.dev?subject=Hen%20Screenshots%20feedback).

Implementation work will be tracked in issues as it is scheduled. This document will be updated as milestones ship.
