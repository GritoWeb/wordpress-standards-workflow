# Changelog

Notable changes to the GritoWeb WordPress standards.

## 2026-05-24

### Changed
- **`skills/create-block/SKILL.md` trimmed 962 → ~620 lines** without
  losing semantics, after a context-efficiency review:
  - Fixed 3 stale references to `@wordpress/icons` — the package is no
    longer required (RemoveButton was refactored to a plain `<button>`
    pill). Removed from check 0.10, `npm install` command, and the
    package.json notes. Memory `project-init-kit.md` aligned.
  - Deleted Phase 3.2 ("no longer applicable" placeholder section).
  - Deduped infra templates: `BlockManager.php` moved out of the
    inline SKILL.md doc to `<skill>/templates/BlockManager.php`; the
    `blocks.php` inline duplicate removed (template is the single
    source of truth). SKILL.md just references `<skill>/templates/<file>`.
  - Consolidated 5 idempotency tables into one decision table.
  - Trimmed verbose "how to ask" / "show the plan" / "vendor libs"
    duplications down to one mention each.
  - Trimmed Behavior Rules to only the skill-specific items; the rules
    that duplicate `CLAUDE.md` (English, no co-author, no production
    writes, no assumptions, push back) are now referenced as a
    one-line "live in CLAUDE.md and apply automatically".
- **`skills/create-block/templates/BlockManager.php`** added (new file).
  Moved out of the SKILL.md doc body to live alongside the other infra
  templates — matches the pattern already used for `BlockCategories.php`,
  `blocks.php`, `preview.svg`, and the 7 shared components.

- **`LinkPicker` switched to native Gutenberg `LinkControl` shape.**
  Dropped the `#opensInNewTab` URL-marker hack — the link attribute is
  now declared as `"type": "object"` (default `{ "url": "",
  "opensInNewTab": false }`) and the component passes `value`/`onChange`
  straight through to `<LinkControl>`. `settings` prop forwarded
  unchanged (default = WP's built-in `[opensInNewTab]`; callers can
  pass `[{id:'nofollow',title:'Mark as nofollow'},...]` to extend).
  Render side now emits **only `target="_blank"`** when the flag is
  true — `rel="noopener"` is no longer hardcoded because WP core's
  `wp_targeted_link_rel()` filter (priority 15 on `the_content`)
  injects it automatically into any rendered link with `target="_blank"`.
  Removes the stringly-typed flag bag, aligns the attribute with what
  Gutenberg natively expects, and opens the door to `nofollow` / other
  toggles without growing the URL. `block.php` reads
  `$attributes['ctaLink']['url']` + `['opensInNewTab']` directly;
  inference tables in `SKILL.md` + per-attr generation rules updated;
  `EXAMPLES.md` description aligned.
- **`RemoveButton` reworked** — now a red pill button matching the
  exact visual style of the `ImageUploadWithHover` "Remove image"
  button (white text on `#dc2626`, 4×8 padding, 4px radius, 12px /
  weight 500 font), so the destructive surfaces in the editor share
  one consistent look. Default label "Delete Item". Replaces the
  earlier trash-icon button. Caller no longer fights the component's
  sizing/positioning. Canonical placement for repeater items is the
  **top-right of the active item's panel**
  (`<div className="flex justify-end"><RemoveButton .../></div>`,
  gated by `items.length > 1`), not inline with the field row. Reason:
  the trash icon was visually noisy and competed with field controls
  for attention; a pill-styled "Delete Item" pinned to the top-right
  reads as a panel-level action and frees up the bottom of the form
  for content fields.
- **`LinkPicker` button sized to match the white-card input height**
  (`!min-h-[46px] !px-3 !bg-white !border !border-gray-300 !rounded`).
  A `CTA text` (plain input) + `CTA link` (LinkPicker) pair sitting
  in a `flex gap-3` row now lines up at exactly the same height,
  instead of the LinkPicker's WP-default ~36px sitting visibly
  shorter than the wrapped input.
- **Field control rule documented** in `SKILL.md` (Phase 1 attribute
  inference) and `EXAMPLES.md` (editor layout pattern): **long copy
  uses `<RichText>`**, **headings / labels / simple short text use a
  plain `<input type="text">`** inside the same white-card wrapper.
  Inline bold/italic/link in a heading or button label is almost
  always wrong, and a single-line `<input>` has better placeholder
  and accidental-newline behavior than `RichText`. The keyword
  lookup table now routes `title`/`heading`/`subtitle`/`label` and
  the button-pair text → plain input; only
  `description`/`body`/`content`/`paragraph`/`quote`/`copy` keeps
  `RichText`. Per-attribute-type table split `string` into two rows
  (heading-style vs description-style) so the generated `block.jsx`
  picks the right control per field.
- The reference `testimonial-carousel` block in `EXAMPLES.md` updated
  to demonstrate the new pattern end-to-end: heading + author as
  plain inputs, quote as RichText, delete button at the top-right of
  the active slide's panel.
- End-to-end validated in `test-workflow` — `hero` (heading, subtitle,
  cta text as plain inputs; cta link via LinkPicker aligned at same
  height) and `feature-list` (heading + item title as plain inputs,
  item description as RichText, "Delete" button top-right of the
  active feature's panel) rebuilt and visually checked in the
  Gutenberg editor.

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
