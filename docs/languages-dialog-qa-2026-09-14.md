# Languages dialog and AI translation QA

The Languages dialog now exposes **Translate with AI** as a series-level action. Users select added languages before downloading models; the queue processes one language at a time, using the existing worker to translate each slide's title and supporting text separately.

Edited, reviewed, and outdated translations are preserved by default. Replacement requires an explicit checkbox. A completed language becomes one editor history entry; cancellation or failure leaves the unfinished language unchanged and retains completed languages. Unsupported routes remain available for manual editing.

## Validation

- 695 tests passed. The five new batch tests cover route selection, protection of existing captions, shared download packs, sequential execution, retry after a partial failure, and cancellation before late results can apply.
- The focused translation/localization/i18n suite passed again after the final cache-refresh adjustment: 35 tests.
- TypeScript, lint, formatting, and production build passed.
- Structured `autoreview --mode local` reported no actionable findings.

## Browser checks

Used a disposable in-memory fixture with the real Languages dialog and real OPUS-MT worker. No production project was changed.

- Inspected the modal at 1018 × 987, 360 × 800, and 844 × 390. The AI action remains visible; setup and progress actions stay outside the scrolling content. In landscape, the setup actions share a row to leave more room for language choices.
- Verified the language selector has 42 px of right padding and a chevron positioned 14 px from the edge. Regional language codes remain on one line.
- Translated a three-slide English series into Spanish and French, with two eligible slides per language. The Spanish reviewed title and French manual draft remained unchanged. Portuguese (Brazil) remained marked for manual editing.
- Confirmed original captions and device geometry stayed unchanged. Undo reverted only the last completed language.
- Stopped a real translation run, then continued successfully. Cached packs were recognized on reopening; no new pack download was required.
- Confirmed a fully translated series cannot be rerun until replacement is explicitly enabled. The replacement warning and counts update before starting.
- Checked the empty-language setup and adding a language, English/Spanish/Portuguese interface copy, and focus returning to the AI action after closing setup.

Local AI currently supports English, Spanish, French, and German. Translated captions remain drafts for human review; the model does not translate text embedded in uploaded images.
