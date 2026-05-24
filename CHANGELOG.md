# Changelog

Notable changes to the GritoWeb WordPress standards.

## 2026-05-20

### Added
- `skills/create-block/SKILL.md` — scaffolds a new Gutenberg block in the
  canonical layout. Phase 0 verifies and (with dev consent) bootstraps the
  block infrastructure: `BlockManager`, folders, `vite.config.js`
  `discoverBlockAssets()`, `editor.js` glob, `app.css` `@source`,
  React 18 deps, vendor folders, **custom block category filter**
  (`block_categories_all` — first-run asks for the name, default
  "Custom Blocks"). Phase 0 also runs a **global-enqueue smell detector**
  (warns when vendor-lib enqueues appear outside `block.php`). Phase 1
  pre-extracts info from the dev's request, auto-derives the slug from
  the title (WP convention: lowercase + hyphens), picks the Dashicon
  itself based on context, batches missing-info questions, and never
  asks about vendor libs. Phase 2–4 generates files, registers in
  `BlockManager::$blocks`, and hands off `npm run dev|build`.
  Validations are cheap-only (slug regex, folder existence, duplicate
  in `$blocks`) — clash with `core/*` is left to fail at build.

### Changed
- `EXAMPLES.md` rewritten around the canonical team layout:
  - `app/Blocks/BlockManager.php` owns the manual blocks list, global
    attributes (padding presets), and a `$libs` registry that registers
    vendored libs once and enqueues them per block via `render_block` —
    no global loads.
  - Block folder is `resources/blocks/<slug>/` with files literally named
    `block.json`, `block.php`, `block.jsx`, `block.js`, `block.css`.
  - `block.json` uses `"render": "file:./block.php"`; no `render_callback`
    is passed to `register_block_type`. `block.php` shapes data and calls
    `\Roots\view('blocks.<slug>', $data)->render()`.
  - Local block assets (`block.js`, `block.css`) are discovered by
    `vite.config.js` (`discoverBlockAssets()`); no `viewScript`/`style`
    keys in `block.json`.
  - Vendor libs live in `resources/{js,css}/vendor/` as pre-built
    distributables and are served directly via `get_theme_file_uri()` —
    not shipped through the Vite build.
- `BlockManager` simplified: no longer owns vendor libs.
  `wp_register_script`/`wp_register_style` moved to `app/setup.php`
  (single source for URL + version). Each `block.php` that needs a lib
  calls `wp_enqueue_script`/`wp_enqueue_style` directly. `$blocks`
  reverted to flat array of slugs; the `render_block` filter is gone.
- `BlockManager::$namespace` comment clarified — it's the Gutenberg
  block prefix, not the PHP namespace or text domain.
- `block.php` example switched to the global `view()` helper (instead
  of `\Roots\view()`) and applies `absint()` / `(bool)` / `sanitize_text_field()`
  consistently with `CLAUDE.md › PHP/Blade`.
- `EXAMPLES.md` `app/setup.php` example now registers a `custom-blocks`
  Gutenberg category via `block_categories_all`, so every scaffolded
  block lands in the same place in the inserter. The testimonial-carousel
  reference block's `block.json` `category` updated from `design` to
  `custom-blocks` to match.
- **Block category refactored to a class** (`app/Blocks/BlockCategories.php`)
  with consts `SLUG` / `TITLE` and static `register()` — replaces the
  inline `add_filter('block_categories_all', ...)` previously documented.
  Adds dedupe + priority 5. Called from `setup.php` as
  `\App\Blocks\BlockCategories::register();`.
- **Canonical `block.jsx` layout** documented in `EXAMPLES.md` and shipped
  as the Phase 2 template in the `create-block` skill:
  - `<PaddingControls />` (sidebar) rendered outside the wrapper.
  - Editor body wrapped in `<section>` with `mb-10 bg-gray-50 border-2
    border-dashed border-gray-600 rounded-lg p-6` — dashed border + light
    bg color + margin to visually separate blocks in the editor.
  - Header `"<Title> Preview"` in muted uppercase.
  - Each content field in a labeled white card
    (`<div className="p-3 border border-gray-300 rounded bg-white">`).
  - Inspector = configuration; body = content (split documented in skill).
- **Shared backend components** added under
  `skills/create-block/templates/components/backend/` and documented in
  `EXAMPLES.md`. Phase 0 of the `create-block` skill copies them into the
  project as part of bootstrap: `ImageUploadWithHover.jsx`, `LinkPicker.jsx`
  (wraps Gutenberg's `LinkControl` for internal/external + new-tab),
  `RemoveButton.jsx`, `TabSelector.jsx` (tab-based array repeater),
  `PaddingControls.jsx`, `padding-presets.js`, `ImagePositionControl.jsx`.
- `skills/create-block/templates/BlockCategories.php` added — class template
  copied during Phase 0 bootstrap when the category isn't registered yet.
- The reference testimonial-carousel block in `EXAMPLES.md` now demonstrates
  the full canonical pattern: bg image (`ImageUploadWithHover` +
  `ImagePositionControl`), heading (RichText in white card), slides
  (`TabSelector` repeater + `RemoveButton`).
- **Inserter-hover preview** (`preview.svg`) baked into the canonical
  block layout. Every block scaffolded by the `create-block` skill gets:
  a `preview.svg` in its folder (string-substituted from
  `<skill>/templates/preview.svg`, with `__BLOCK_TITLE__` replaced by the
  block's `<Title>`); an `isPreview` boolean attribute + an `example`
  field in `block.json`; and a short-circuit at the top of `edit()` that
  returns only the SVG when `isPreview === true`. Devs can swap the file
  for a real `.webp`/`.png` later — the wiring stays.
- **Block bootstrap centralized in `app/blocks.php`** — replaces putting
  `BlockCategories::register()` and the `BlockManager` `init` action in
  `setup.php`/`filters.php`. Loaded by `functions.php`'s
  `collect(['setup', 'filters', 'blocks'])` (Sage's "categorically named
  theme files" mechanism). `setup.php` and `filters.php` go back to their
  vanilla Sage roles. Vendor libs still live in `setup.php` since they're
  theme-level asset registration, not block bootstrap. The new
  `skills/create-block/templates/blocks.php` is copied during Phase 0
  bootstrap; Phase 0 also edits `functions.php` to add `'blocks'` to the
  `collect` array, or bails if `functions.php` doesn't use that pattern.
- **Phase 0 idempotency + per-file divergence heuristic** documented in
  `SKILL.md`. Each create/modify target (`app/blocks.php`,
  `functions.php`, `vite.config.js`, `editor.js`, `app.css`) has an
  explicit table of detected states → action (skip if already wired;
  apply if missing and stock-Sage shape; bail with diagnostic if shape
  diverges). Makes re-invocation safe (no duplicate code) and prevents
  silent breakage when the dev's files have unusual shapes.
- **`@wordpress/icons` added to required devDeps** (Phase 0 check 0.10).
  Surfaced during end-to-end test of the skill: `RemoveButton.jsx`
  (shared component) imports `trash` from `@wordpress/icons`, and
  `@roots/vite-plugin`'s `wordpressPlugin()` doesn't externalize the
  `icons` package (only `blocks`, `block-editor`, `components`, `element`,
  `i18n`, `dom-ready`, `hooks`). Build fails with `failed to resolve
  import "@wordpress/icons"` until installed. Templates section's
  `npm install` command updated; Group B description in Bootstrap UX
  updated; Phase 0 check 0.10 expanded with the rationale.
- **End-to-end skill validation** in `test-workflow` — created `hero`
  (heading, subtitle, bg image, CTA link) and `feature-list` (heading +
  array of items via TabSelector) blocks following the canonical
  pattern; inserted into the Sample Page via `wp post update`. All 3
  blocks (`hero`, `feature-list`, `test-block`) render server-side
  correctly; Chrome accessibility tree confirms markup; no console
  errors; inserter shows "Custom Blocks" category with preview SVGs on
  hover. Confirms the whole pipeline (Phase 0 infra → block files →
  BlockManager registration → Vite build → server render via Blade) is
  consistent end-to-end.
- **Attribute type inference** documented in Phase 1 of `SKILL.md`.
  New subsection "Attribute type inference (description → type +
  control)" with: (a) keyword lookup table covering string / number /
  boolean / array / image / link / color / video / alignment / layout
  attributes plus the editor control to render for each; (b) special
  expansion rules (image keyword → `Id`+`Url` pair; "bg image" → also
  `Position`; "button"/"cta" alone → `Text`+`Link` pair; array with
  sub-fields → recurse inference per sub-field); (c) ambiguity rule —
  ask before guessing when the description hits multiple categories or
  none; (d) "show the inferred plan" pre-write gate so the dev can
  override any inference without back-and-forth.

## 2026-05-18

### Added
- `README.md` — the start-a-project workflow (Pantheon + local-only) and how
  to consume this repo.
- `CLAUDE.md` — the dev standard (seeded verbatim from the team good-practices
  gist). This repo is now the source of truth.
- `skills/html-qa-smoketest/SKILL.md` — authoritative QA skill (table-based
  checklist with per-item severity).
- `EXAMPLES.md` — one complete reference block (code in fenced blocks)
  showing the `CLAUDE.md` rules composed in context, for AI grounding.
- `gitignore.example` — base ignore rules for WP + Sage 11 + Lando.

### Changed
- `CLAUDE.md` › Critical Rules: added "never make assumptions — ask when
  unsure" and "don't just agree — push back on flawed requests".
- `CLAUDE.md` › Critical Rules: replaced the generic "never push a database to
  production" with "never alter anything in production/remote without explicit
  request" (read-only remote commands free; writes and `lando pull` gated).
  PR checklist line aligned.

### Notes
- Standards source of truth moved from the gists to this repo.
- Dropped the earlier automation script approach in favor of a plain
  documentation/reference repo (the bring-up is interactive anyway).
