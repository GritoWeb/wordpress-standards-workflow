---
name: create-block
description: >
  Scaffold a new Gutenberg block for a Sage 11 + Acorn theme following the
  team's canonical layout. Use this skill whenever the user asks to create,
  add, scaffold, or generate a new block — variations include "create a hero
  block", "new block for X", "add a testimonials section as a block",
  "scaffold a custom block", etc. Handles the full lifecycle: verifies the
  theme has the block infrastructure (BlockManager, folders, Vite config,
  editor.js glob, React 18 deps, Tailwind `@source`), bootstraps any missing
  pieces with explicit dev confirmation, then generates the block folder
  (`block.json`/`block.php`/`block.jsx`/`block.js`/`block.css`), the Blade
  view, and wires the block into `BlockManager` and `app/setup.php`.
---

# create-block — Sage 11 Gutenberg block scaffolder

Generates a new block folder under `resources/blocks/<slug>/` plus a Blade
view, following the canonical layout. Before generating, verifies that the
theme has the block infrastructure in place; bootstraps it if missing, with
the dev's explicit consent (two confirmation gates — one for safe creations,
one for modifications of existing files).

This skill **never runs `npm` / `composer` / `lando` commands or pushes to
git**. The dev does that themselves so they see the output.

---

## Pre-conditions

- Current working directory must be the **active Sage 11 theme root** (the
  folder that contains `vite.config.js`, `app/setup.php`, `composer.json`,
  and `resources/`). If you're not sure, **ask the user** before doing
  anything else — don't guess based on `pwd`.
- Composer and Node already run on the host (Lando only serves WordPress).
- The user follows the standards in `CLAUDE.md` / `EXAMPLES.md`. If those
  files aren't in the project, treat this skill as the standard.

---

## Execution Flow

1. **Phase 0** — Verify the theme has the block infrastructure; bootstrap
   any missing pieces (with dev consent).
2. **Phase 1** — Collect block requirements from the dev.
3. **Phase 2** — Generate the 5 block files + the Blade view.
4. **Phase 3** — Register the block in `BlockManager`; if a new vendor lib
   was declared, register it in `app/setup.php`.
5. **Phase 4** — Hand off to the dev with the next steps to test.

---

## Phase 0 — Infrastructure check

Run every check below against the current theme. Build a status table and
show it to the dev **before doing anything else**.

### Required infra (skill bootstraps if missing)

| # | Check |
|---|-------|
| 0.1 | `app/Blocks/BlockManager.php` exists |
| 0.2 | `resources/blocks/` exists |
| 0.3 | `resources/views/blocks/` exists |
| 0.4 | `resources/js/vendor/` exists |
| 0.5 | `resources/css/vendor/` exists |
| 0.6 | `app/blocks.php` is the **central block-bootstrap file** — must (a) exist, (b) contain top-level `BlockCategories::register();` call (it's just an `add_filter` registration, safe at file load), (c) contain `add_action('init', function () { (new BlockManager())->register(); });` (register_block_type needs `init`), (d) be loaded by `functions.php`'s `collect([...])` array (see 0.6.1). Template at `<skill>/templates/blocks.php`. Conceptually replaces putting block bootstrap in `setup.php`/`filters.php`; aligns with Sage's "categorically named theme files" mechanism. |
| 0.6.1 | `functions.php`'s `collect([...])` array includes `'blocks'`. Sage uses `collect(['setup', 'filters', ...])` to `require` each `app/<name>.php` during boot. Without `'blocks'` in the array, `app/blocks.php` won't load and no blocks will register. If `functions.php` doesn't use the `collect([...])` pattern at all (heavily-customized theme), **bail out** — needs manual wiring. |
| 0.7 | `vite.config.js` declares a `discoverBlockAssets()` function AND spreads `...discoverBlockAssets()` into the `laravel({ input: [...] })` plugin args |
| 0.8 | `resources/js/editor.js` calls `import.meta.glob('../blocks/*/block.jsx', { eager: true });` |
| 0.9 | `resources/css/app.css` has `@source "../blocks/**/*.{php,jsx}";` (so Tailwind scans block markup for utility class usage) |
| 0.10 | `package.json` has these `devDependencies`: `react@^18`, `react-dom@^18`, AND `@wordpress/icons`. **React pinned to ^18, not ^19** — React 19 breaks Gutenberg (element-symbol mismatch with WP's React 18). **`@wordpress/icons`** is needed because `RemoveButton.jsx` (shared component) imports `trash` from it, and `@roots/vite-plugin`'s `wordpressPlugin()` does **not** externalize the `icons` package (it only externalizes `blocks`, `block-editor`, `components`, `element`, `i18n`, `dom-ready`, `hooks`). Without it installed, Rolldown fails with `failed to resolve import "@wordpress/icons"`. Once installed, Rolldown tree-shakes — only the icons actually used get bundled (small). |
| 0.11 | `app/Blocks/BlockCategories.php` class file exists. Template at `<skill>/templates/BlockCategories.php`. **First-time bootstrap moment**: ask `"Vou criar uma categoria pros seus blocos. Quer chamar de 'Custom Blocks' (default) ou outro nome?"`. Copy the template; if the dev picked a different name, edit `BlockCategories.php` to set `TITLE` and derive `SLUG` (lowercase + hyphens). The actual `BlockCategories::register();` call lives in `app/blocks.php` (covered by check 0.6). Subsequent invocations: grep `const SLUG = '...'` from the existing file to know the slug. |
| 0.12 | `resources/blocks/components/backend/` exists with the canonical shared components: `ImageUploadWithHover.jsx`, `LinkPicker.jsx`, `RemoveButton.jsx`, `TabSelector.jsx`, `PaddingControls.jsx`, `padding-presets.js`, `ImagePositionControl.jsx`. These are reused by every block — image inputs, link inputs, repeater tabs, delete buttons, spacing panel. If missing: copy all 7 from `<skill>/templates/components/backend/*` in one batch under Group A (creations). |

### Compatibility warnings (do NOT auto-fix)

| # | Check |
|---|-------|
| 0.13 | `vite.config.js` `base:` value matches the theme's actual path (e.g. `/wp-content/themes/<active-theme>/public/build/`). Sage's default scaffold ships with `/app/themes/sage/public/build/` (Bedrock convention) which **breaks asset URLs** in standard WP layouts. If the value looks wrong: **warn the dev** with the actual theme dir vs the `base:` value and suggest they fix it. **Do not edit** `base:` automatically — it's a project-level decision outside this skill's scope. |
| 0.14 | **Global-enqueue smell detector.** Scan `app/**.php` and `functions.php` for `wp_enqueue_script(` / `wp_enqueue_style(` calls *outside* `resources/blocks/*/block.php`. Theme-level handles (`app`, `editor`, things tied to the Vite manifest) are expected and fine — ignore those. Vendor-lib looking handles (`swiper`, `gsap`, `splide`, anything that resembles a third-party lib name) loaded globally are a smell: warn the dev with the file:line and recommend the canonical pattern (`wp_register_*` in `setup.php`, `wp_enqueue_*` inside the relevant `block.php`). **Do not auto-fix** — the dev decides. |

### Bootstrap UX

If any required check (0.1–0.12, including 0.6.1) fails:

1. Tell the dev which checks failed, in a table.
2. Split the fix list into two groups:
   - **A. Creations** — new files / new folders. Low risk, reversible by `rm`.
   - **B. Modifications** — edits to existing files (`functions.php`,
     `vite.config.js`, `resources/js/editor.js`, `resources/css/app.css`).
     `package.json` is **not** edited — the skill tells the dev to run
     `npm install --save-dev react@^18.0.0 react-dom@^18.0.0 @wordpress/icons`
     themselves. Higher risk than Group A.
3. **Group A confirmation**: list every file/folder to be created. Ask
   "Posso criar essas Y entradas?" Y/N.
4. **Group B confirmation**: for each file to be modified, show the diff
   inline (before/after for the affected hunks only — not the whole file).
   Ask "Posso aplicar essas N modificações?" Y/N.
5. **If the dev says no to either group: stop**. Explain politely that the
   skill needs the infra in place to continue, and the dev can run those
   edits manually before re-invoking the skill.
### Idempotency and divergence (per-file heuristic)

Phase 0 must be **re-runnable without duplicating work or breaking
existing setup**. Before each create/modify, Read the target file and
check the expected shape. Skip if the change is already there; bail
with a clear diagnostic if the shape doesn't match what the skill
knows how to edit.

**`app/blocks.php`** (creation — Group A)

| Detected state | Action |
|---|---|
| File doesn't exist | Create from `<skill>/templates/blocks.php` |
| Exists AND contains both `BlockCategories::register()` and `add_action('init', ...)` referencing `BlockManager` | **Skip** — "already wired" |
| Exists AND contains one of the two calls but not the other | **Bail** — "Partial wiring detected in `app/blocks.php` (found X, missing Y). Please reconcile manually before re-invoking." |
| Exists with unrelated content (no recognizable block bootstrap) | **Bail** — "An `app/blocks.php` already exists with content I don't recognize. Move/rename it before re-invoking." |

**`functions.php`** (modification — Group B)

| Detected state | Action |
|---|---|
| `collect([...])->each(...)` pattern not found at all | **Bail** — "`functions.php` doesn't use Sage's `collect([...])` bootstrap pattern. Manual wiring needed — add `require app/blocks.php` somewhere after Acorn boots." |
| Pattern found AND array already contains `'blocks'` | **Skip** — "already wired" |
| Pattern found AND array missing `'blocks'` | Edit the array literal: insert `'blocks'` before the closing bracket. Preserve original formatting (single-line vs multi-line, quote style). |
| Pattern found but uses dynamic generation (e.g., `collect($files)` where `$files` is built elsewhere) | **Bail** — "Dynamic `collect` array detected. Manual wiring needed." |

**`vite.config.js`** / **`resources/js/editor.js`** / **`resources/css/app.css`** (modification — Group B)

For each, grep for the expected pattern:
- `vite.config.js` → `function discoverBlockAssets` and `...discoverBlockAssets()` inside `laravel({ input: [...] })`
- `editor.js` → `import.meta.glob('../blocks/*/block.jsx'`
- `app.css` → `@source "../blocks/**`

| Detected state | Action |
|---|---|
| Pattern found | **Skip** — "already wired" |
| Pattern not found AND file matches stock Sage shape | Apply the documented edit (see Templates section) |
| Pattern not found AND file diverges from stock shape (custom build config, unusual plugin order, no anchor to insert) | **Bail** with a diagnostic naming the divergence |

**General rule**: bailing is always better than guessing. The dev can
fix the divergence in 30 seconds; a wrong edit can break the build
silently for hours. Every bail message must say (a) which file, (b)
what shape was expected, (c) what was found, (d) what the dev needs to
do (the manual edit they would apply themselves).

The infra templates to apply during bootstrap are in the **Templates**
section at the bottom of this doc.

---

## Phase 1 — Collect block requirements

### How the skill asks (UX)

1. **Pre-extract from the user's initial request.** If the user said something
   like *"create a hero block with title, subtitle, and background image"*,
   pull out: title (`Hero`), slug (`hero`), and the attribute names
   (`title`, `subtitle`, `backgroundImage`). The user's words come first;
   the skill fills the gaps.
2. **Slug auto-derived from title.** WordPress convention: lowercase,
   hyphen-separated, ASCII (e.g. `Hero` → `hero`, `Testimonial Carousel`
   → `testimonial-carousel`). Don't ask if you can derive it.
3. **Title suggestion when missing.** If the user just said "create a block"
   with no name, ask what the block is *for* (one-line description) and
   propose a name based on the intent. Don't proceed with a generic
   `new-block`.
4. **Batch the gaps.** Send a single round of questions covering everything
   still missing — use `AskUserQuestion` for closed lists, plain text for
   open-ended items. Don't drip-feed questions one per turn.
5. **Free text for attributes** (see below) — let the dev describe the
   fields naturally. Infer types. Ask only on genuinely ambiguous fields.
6. **Show the inferred plan before generating.** A compact summary (slug,
   title, category, icon, attributes list) with one final "ajustar algo?"
   gate.

### What the skill asks for

| Item | How |
|---|---|
| **Title** | Required. If not derivable from the request, ask. |
| **Slug** | Auto-derive from title (lowercase + hyphens). Show it in the inferred summary; dev can override. |
| **Attributes** | **Free text** — let the dev describe fields naturally (with Figma context / image attachments / prose). Skill parses, **infers types from keywords** (see "Attribute type inference" below), expands special pair patterns (image, button), and asks only when truly ambiguous. |

### Attribute type inference (description → type + control)

When the dev describes attributes in natural language ("hero with a
heading, subtitle, background image and CTA button"), map each described
field to a concrete attribute using the table below. The output of this
step feeds Phase 2 directly (block.json schema, block.php sanitization,
block.jsx editor control).

#### Keyword lookup table

| Dev's wording contains | Inferred type | Generated attribute(s) | Editor control |
|---|---|---|---|
| `title`, `heading`, `headline`, `name`, `label` | string | `<name>` | `<RichText tagName="h1\|h2">` |
| `subtitle`, `subheading`, `tagline`, `eyebrow` | string | `<name>` | `<RichText tagName="p">` |
| `description`, `body`, `content`, `text`, `paragraph`, `quote` | string (multi-line ok) | `<name>` | `<RichText tagName="p" min-h-[80px]>` |
| `image`, `photo`, `picture`, `thumbnail`, `cover`, `bg`/`background image` | image **PAIR** | `<name>Id` (number) + `<name>Url` (string) | `<MediaUploadCheck><ImageUploadWithHover .../></MediaUploadCheck>`. If wording contains "background" / "bg" → also add `<name>Position` (string, default `"center"`) + render `<ImagePositionControl />` |
| `icon` | string (Dashicon slug or arbitrary name) | `<name>` | `<TextControl>` (or `<IconPicker>` if the project ships one) |
| `link`, `url`, `cta link`, `href` | link (string with `#opensInNewTab` marker) | `<name>` | `<LinkPicker label="..." />` |
| `button`, `cta` (alone, no "link") | button **PAIR** | `<name>Text` (string) + `<name>Link` (string with marker) | `<RichText>` for text + `<LinkPicker>` for link |
| `color`, `bg color`, `text color` | string (hex / palette slug) | `<name>` | `<ColorPalette>` or `<PanelColorSettings>` |
| `size`, `width`, `height`, `count`, `amount`, plain `number` | number (unsigned) | `<name>` | `<TextControl type="number">` or `<RangeControl>` |
| `show X`, `enable X`, `visible`, `active`, `toggle`, "is X" boolean | boolean | `<name>` | `<ToggleControl>` |
| `list of X`, `X list`, `items`, `slides`, `cards`, `testimonials`, `features`, `points`, `steps`, `accordion items` | array | `<name>` (`items` is the conventional default for the array attr) | `<TabSelector>` + `useState(0)` for active index + per-item form (recurse: infer sub-field types from the same table) |
| `video` + url/embed | string (URL) | `<name>Url` | `<TextControl type="url">` |
| `alignment`, `align`, `text alignment` | string enum | `<name>` (default `"left"`) | `<AlignmentToolbar>` or `<SelectControl>` |
| `layout`, `variant`, `style` + descriptor (e.g. "compact/full") | string enum | `<name>` | `<SelectControl options={...}>` (config — put in `InspectorControls`) |

#### Special expansion rules (apply BEFORE the keyword lookup)

1. **Image pair**: any image-like mention generates **two attributes** —
   `<name>Id` (number) + `<name>Url` (string). Render via
   `ImageUploadWithHover`. WordPress's media library gives back both
   pieces in one call; storing the URL alongside the ID avoids hitting
   `wp_get_attachment_url()` at render time. If the wording mentions
   "background" or "bg", add a third attribute `<name>Position` (string,
   default `"center"`) and render `<ImagePositionControl />` alongside.

2. **Button pair**: "button" / "CTA" alone (without "link") generates
   **two attributes** — `<name>Text` (string) + `<name>Link` (string with
   `#opensInNewTab` marker). Render via `RichText` (text) +
   `LinkPicker` (link).

3. **Array recursion**: when the dev says "list of X with title, image,
   and description", recurse the inference for each sub-field
   (`title` → string, `image` → pair, `description` → string). The
   final shape is one array attribute whose items are objects with
   typed sub-fields. Sanitize per-sub-field in `block.php`'s
   `array_map(...)`.

#### Ambiguity → ask

If the dev's wording is ambiguous, **ask before generating** rather than
guess. Examples that need asking:
- "image link" — is it a linked image (image pair + link) or the URL of
  an image (single string)?
- "X" with no matching keyword — describe what it should do, then
  pick (or default to string).
- An attribute named like a verb ("highlight", "feature") — likely a
  boolean toggle, but confirm.

Batch the ambiguity questions with the rest of Phase 1's gap-filling
round (B1 from the UX section) — don't drip-feed.

#### Show the inferred plan before generating

After running inference on every described attribute, surface a compact
plan to the dev:

```
Slug:     hero
Title:    Hero
Icon:     format-image
Category: custom-blocks
Attributes:
  - heading           string             → RichText (h1)
  - subtitle          string             → RichText (p)
  - bgImageId/Url     image pair         → ImageUploadWithHover + ImagePositionControl
  - ctaText/Link      button pair        → RichText + LinkPicker
```

Ask "ajustar algo (nome, tipo, controle)?" before writing files. The
dev gets to override any inference at this gate without a back-and-forth.

### What the skill picks itself (no question)

| Item | How the skill decides |
|---|---|
| **Category** | The custom category established in Phase 0 check #11 (default `custom-blocks`). Never ask per-block. |
| **Icon** | Pick a [Dashicon](https://developer.wordpress.org/resource/dashicons/) that fits the block's intent — use the title, description, and any visual context (Figma frame, screenshot, mockup) the dev shared. Examples: testimonial → `format-quote`, hero with image → `format-image`, steps list → `editor-ol`, CTA → `megaphone`. If genuinely unclear, default to `smiley`. **Tell the dev which icon you chose** in the inferred summary so they can change `block.json` later if they don't like it. Never ask. |

### What goes where in the editor (Inspector vs body)

When designing the `block.jsx`, split attributes between two regions:

- **InspectorControls (sidebar)** = block **configuration** — always
  `<PaddingControls />`; plus toggles for layout variants, color
  switchers, breakpoint controls, anything visual/structural the user
  picks rarely. Hidden by default.
- **Editor body** (the dashed-border preview wrapper) = block
  **content** — `RichText` fields in labeled white cards,
  `<ImageUploadWithHover />` for images, `<LinkPicker />` for links,
  `<TabSelector />` + per-item edit form for array repeaters. What the
  dev actively composes.

When uncertain, prefer the body. Inspector is hidden by default and
loses visibility.

### What the skill does NOT ask

- **External library / vendor lib.** Vendor libs are a deliberate dev
  decision, not block scaffolding. The skill generates blocks without
  lib boilerplate. If the dev needs to add Swiper etc. afterward, they
  follow the pattern in `EXAMPLES.md` (`wp_register_*` in `setup.php` +
  `wp_enqueue_*` in `block.php`). The smell detector in Phase 0 keeps
  watch for the wrong pattern over time.

### Validations (cheap, fail fast — see Behavior Rules for the cost rationale)

Before generating, check:

- Slug matches `/^[a-z][a-z0-9-]*$/` (kebab-case, starts with a letter).
- `resources/blocks/<slug>/` does **not** already exist (don't overwrite).
- `<slug>` is **not** already in `BlockManager::$blocks` (no duplicate registration).

If any check fails, stop and ask the dev for an alternative — don't proceed.

### Read the existing block namespace

Look at `app/Blocks/BlockManager.php` and read `$namespace` (exposed by
`getNamespace()`). Use that as the prefix for `block.json`'s `name`
field (`<namespace>/<slug>`). Sage's default is `sage`; teams may have
changed it.

---

## Phase 2 — Generate the block files

Create the folder `resources/blocks/<slug>/` and the 5 files inside, plus
the Blade view. Use the templates at the bottom of this doc. Substitute the
placeholders `<slug>`, `<Title>`, `<category>`, `<icon>`, `<namespace>` with
the values from Phase 1.

**Files:**

1. `resources/blocks/<slug>/block.json`
2. `resources/blocks/<slug>/block.php`
3. `resources/blocks/<slug>/block.jsx`
4. `resources/blocks/<slug>/block.js`
5. `resources/blocks/<slug>/block.css`
6. `resources/blocks/<slug>/preview.svg`
7. `resources/views/blocks/<slug>.blade.php`

**`preview.svg`** is the static image Gutenberg shows on the right-side
panel when the dev **hovers** the block card in the `+` inserter. The skill
generates it from `<skill>/templates/preview.svg` by string-substituting
`__BLOCK_TITLE__` with the block's `<Title>` (e.g. `Test Block`,
`Testimonial Carousel`). The block.json gets an `isPreview` attribute and
an `example` field; the block.jsx adds a short-circuit at the top of
`edit()` to return only the SVG when `isPreview === true` (see templates
below). Devs can swap the file later for a real `.webp`/`.png` if they
want a richer preview — the rest of the wiring stays.

**Per-attribute generation rules** (apply when expanding the templates):

| Attribute type | `block.json` schema | `block.php` sanitization | `block.jsx` editor control |
|---|---|---|---|
| `string` | `{"type":"string","default":""}` | `sanitize_text_field($attributes['<name>'] ?? '')` | `<RichText tagName="..." value={...} onChange={...} />` |
| `number` | `{"type":"number","default":0}` | `absint($attributes['<name>'] ?? 0)` (unsigned) — use `(int)` only if negatives are valid for that field | `<TextControl type="number" ... />` or `<NumberControl ... />` |
| `boolean` | `{"type":"boolean","default":false}` | `(bool) ($attributes['<name>'] ?? false)` | `<ToggleControl ... />` |
| `array` | `{"type":"array","default":[]}` | `array_map(...)` with per-item sanitization | **Tabs repeater**: `<TabSelector items={items} activeItem={activeIdx} setActiveItem={setActiveIdx} addItem={addItem} itemLabelPrefix="Slide" />` at top + `useState(0)` for active index + edit form below scoped to `items[activeIdx]` + `<RemoveButton onClick={() => removeItem(activeIdx)} />` for delete |
| image (id + url) | `{"<name>Id":{"type":"number","default":0},"<name>Url":{"type":"string","default":""}}` (two attrs — id + url) | `absint($attributes['<name>Id'] ?? 0)` + `esc_url_raw($attributes['<name>Url'] ?? '')` | `<MediaUploadCheck><ImageUploadWithHover imageId={...Id} imageUrl={...Url} MediaUpload={MediaUpload} onSelect={(media) => setAttributes({ <name>Id: media.id, <name>Url: media.url })} onRemove={() => setAttributes({ <name>Id: 0, <name>Url: '' })} /></MediaUploadCheck>` |
| link (string with new-tab marker) | `{"type":"string","default":""}` | strip `#opensInNewTab` marker; emit `target="_blank" rel="noopener noreferrer"` when present; pass the clean URL through `esc_url()` | `<LinkPicker label="..." url={attributes.<name>} onChange={(value) => setAttributes({ <name>: value })} />` |

**Always include the 4 global padding attrs** in the `block.php` `view(...)`
data array, even if the block doesn't use them visually — they exist on
every block because `BlockManager::globalAttributes()` injects them, and
they should be available to the Blade view:

```php
'paddingVertDesktop' => absint($attributes['paddingVertDesktop'] ?? 112),
'paddingVertMobile'  => absint($attributes['paddingVertMobile']  ?? 56),
'paddingXDesktop'    => (bool) ($attributes['paddingXDesktop']   ?? true),
'paddingXMobile'     => (bool) ($attributes['paddingXMobile']    ?? true),
```

**Vendor libs:** the skill does **not** scaffold `wp_enqueue_*` lines in
`block.php` because it never asks about libs (see Phase 1). If the dev
needs a lib later, they add the register in `app/setup.php` and the
enqueue at the top of `block.php` themselves — both shapes are in
`EXAMPLES.md`. The Phase 0 smell detector keeps watch for the wrong
pattern (global enqueue of a vendor lib).

---

## Phase 3 — Wire up

### 3.1 — Register the block in `BlockManager`

Edit `app/Blocks/BlockManager.php`: add `'<slug>',` to the `$blocks` array.
Keep the existing entries; add at the bottom (or alphabetically — match the
existing style).

### 3.2 — (no longer applicable)

The skill no longer asks about vendor libs in Phase 1, so there's nothing
to register here. If the dev introduces a vendor lib later, they follow
the canonical pattern (register in `setup.php`, enqueue in `block.php`)
themselves — `EXAMPLES.md` documents the shape.

---

## Phase 4 — Hand off to the dev

Tell the dev, in this order:

1. **Build the assets**: `npm run dev` (HMR) or `npm run build` (production).
   They need to run this themselves so they see the output.
2. **Activate the theme** if it isn't yet: `lando wp theme activate <theme-slug>`.
3. **Hard-refresh the editor** (`Cmd+Shift+R`) if it was already open.
4. **Insert the block**: in the Gutenberg `+` inserter, search by the
   block title or browse the `<category>` category.
5. **If a vendor lib was added**: confirm the `.min.js`/`.min.css` files
   are in `resources/{js,css}/vendor/` before reloading.

Show a summary table at the end:

| File | Action |
|---|---|
| `resources/blocks/<slug>/block.json` | created |
| `resources/blocks/<slug>/block.php` | created |
| (…) | (…) |
| `app/Blocks/BlockManager.php` | `$blocks[]` updated |
| `app/setup.php` | vendor libs init action updated |

---

## Behavior Rules

- **All comments, code, and commit messages in English** (CLAUDE.md).
- **Use `view()`**, not `\Roots\view()` — global Acorn helper.
- **Sanitization**: `absint()` for unsigned numerics (IDs, pixel paddings),
  `(bool)` for booleans, `sanitize_text_field()` for plain strings. Use
  `wp_kses_post()` only for explicitly trusted HTML content.
- **Don't reformat existing files** during edits — keep diffs minimal.
- **Don't touch `composer.json`**.
- **Don't run shell commands** (`npm`, `composer`, `lando`, `git`). The dev
  runs those themselves.
- **Don't modify `vite.config.js`'s `base:` value** automatically — flag it,
  let the dev decide.
- **Don't push to git** or create commits — out of scope.
- **Cheap validations only**: validate what costs ~zero tokens (slug regex,
  folder already exists, slug already in `$blocks`) — the data is already
  loaded. Skip validations that need extra exploration (e.g. clash with
  `core/*` block names — the chance is low and the lookup is expensive).
  Rationale: prevention is ~1 cheap check; repair after a duplicate
  scaffold or broken build costs 5–10× more in tokens.
- **Don't make assumptions**: if the dev gave incomplete info in Phase 1
  (e.g. didn't list attributes), stop and ask. Empty blocks are useless.
- **Don't just agree**: if the dev's request is structurally weird (e.g.
  "create a block called `core/paragraph`" — collides with a WP core block),
  push back and explain why before complying.
- **Bail on divergence**: when modifying existing infra files, if the file
  doesn't match the expected shape, stop and ask. Better to halt than to
  silently break the build.

---

## Templates

### Templates directory

The skill ships with `templates/` containing real files (PHP/JSX/JS)
that get copied into the project during Phase 0 bootstrap. Defaults
work as-is — the dev can edit `BlockCategories.php` (`SLUG`/`TITLE`)
afterward if they want a different category name. Structure:

```
<skill>/templates/
├── BlockCategories.php           → copied to app/Blocks/BlockCategories.php
├── blocks.php                    → copied to app/blocks.php (central block bootstrap)
├── preview.svg                   → copied per block (with __BLOCK_TITLE__ substituted)
└── components/backend/           → copied to resources/blocks/components/backend/
    ├── ImageUploadWithHover.jsx
    ├── LinkPicker.jsx
    ├── RemoveButton.jsx
    ├── TabSelector.jsx
    ├── PaddingControls.jsx
    ├── padding-presets.js
    └── ImagePositionControl.jsx
```

The `preview.svg` template uses `__BLOCK_TITLE__` as a placeholder
(intentional non-XML token so the file parses cleanly if opened
directly). The skill string-replaces it with the block's `<Title>` when
writing to `resources/blocks/<slug>/preview.svg`.

Every generated `block.jsx` imports `PaddingControls` from
`../components/backend/`; image / link / array blocks add the matching
imports as needed.

### Block file placeholders

All block-file templates below use these placeholders — substitute throughout:

- `<slug>` — block slug, kebab-case (e.g. `testimonial-carousel`)
- `<Title>` — human-readable title (e.g. `Testimonial Carousel`)
- `<category>` — the custom category slug from Phase 0 check #11 (default `custom-blocks`)
- `<icon>` — Dashicon name the skill picked based on context (e.g. `format-quote`)
- `<namespace>` — value of `BlockManager::$namespace` (e.g. `sage`)

### Block files (Phase 2)

#### `resources/blocks/<slug>/block.json`

```json
{
    "apiVersion": 3,
    "name": "<namespace>/<slug>",
    "title": "<Title>",
    "category": "<category>",
    "icon": "<icon>",
    "description": "<one-line description>",
    "textdomain": "sage",
    "render": "file:./block.php",
    "attributes": {
        "isPreview": {
            "type": "boolean",
            "default": false
        }
        // Expand from Phase 1 attributes. Examples:
        // "heading": { "type": "string", "default": "" },
        // "items":   { "type": "array",  "default": [] }
    },
    "example": {
        "attributes": {
            "isPreview": true
        }
    }
}
```

#### `resources/blocks/<slug>/block.php`

```php
<?php

if (!defined('ABSPATH')) {
    exit;
}

// If a vendor lib was declared, enqueue here (registered in app/setup.php).
// Otherwise omit these two lines.
// wp_enqueue_script('<handle>');
// wp_enqueue_style('<handle>');

$attributes = $attributes ?? [];

echo view('blocks.<slug>', [
    // Per-attribute sanitization (see Phase 2 table).
    // 'heading' => sanitize_text_field($attributes['heading'] ?? ''),

    // Always include the global padding attrs.
    'paddingVertDesktop' => absint($attributes['paddingVertDesktop'] ?? 112),
    'paddingVertMobile'  => absint($attributes['paddingVertMobile']  ?? 56),
    'paddingXDesktop'    => (bool) ($attributes['paddingXDesktop']   ?? true),
    'paddingXMobile'     => (bool) ($attributes['paddingXMobile']    ?? true),
])->render();
```

#### `resources/blocks/<slug>/block.jsx`

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, MediaUpload, MediaUploadCheck, RichText } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PaddingControls } from '../components/backend/PaddingControls.jsx';
// Uncomment the imports your attributes actually need:
// import { ImageUploadWithHover } from '../components/backend/ImageUploadWithHover.jsx';
// import { LinkPicker }           from '../components/backend/LinkPicker.jsx';
// import { TabSelector }          from '../components/backend/TabSelector.jsx';
// import { RemoveButton }         from '../components/backend/RemoveButton.jsx';
// import { ImagePositionControl } from '../components/backend/ImagePositionControl.jsx';
import previewImage from './preview.svg';
import metadata from './block.json';

registerBlockType(metadata, {
    edit({ attributes, setAttributes }) {
        const blockProps = useBlockProps();
        const { isPreview } = attributes;
        // Destructure your block's other attributes here.
        // Example: const { heading, items } = attributes;

        // Static preview for the Gutenberg inserter hover panel.
        if (isPreview) {
            return (
                <div {...blockProps}>
                    <img
                        src={previewImage}
                        alt={__('<Title> preview', 'sage')}
                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
                    />
                </div>
            );
        }

        return (
            <>
                {/* Sidebar (InspectorControls) — config attrs only. */}
                <PaddingControls attributes={attributes} setAttributes={setAttributes} />

                {/* Editor body — content attrs in the dashed wrapper. */}
                <section
                    {...blockProps}
                    className={`${blockProps.className} mb-10 bg-gray-50 border-2 border-dashed border-gray-600 rounded-lg p-6 relative overflow-hidden`}
                >
                    <h3 className="text-base font-sans! font-bold mb-8 uppercase tracking-widest text-gray-500 relative z-10">
                        <Title> Preview
                    </h3>

                    <div className="space-y-6 relative z-10">
                        {/* Each content field gets a labeled white card. Example for a string attr:
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Heading</label>
                            <div className="p-3 border border-gray-300 rounded bg-white">
                                <RichText
                                    tagName="h2"
                                    value={attributes.heading}
                                    onChange={(value) => setAttributes({ heading: value })}
                                    className="!m-0"
                                    placeholder={__('Enter heading…', 'sage')}
                                />
                            </div>
                        </div>
                        */}
                    </div>
                </section>
            </>
        );
    },

    // Server-rendered via block.php; nothing to save on the client.
    save: () => null,
});
```

#### `resources/blocks/<slug>/block.js`

```js
// No frontend behavior yet.
// If the block uses a vendor lib (e.g. Swiper), init it here on DOMContentLoaded.
```

#### `resources/blocks/<slug>/block.css`

```css
@reference "../../css/app.css";

.<slug> {
    @apply py-16;
}
```

#### `resources/views/blocks/<slug>.blade.php`

```blade
{{-- View-only. Data prepared in block.php. --}}
<section class="<slug>">
    {{-- Render with the data passed from block.php. Example:
        @if ($heading)
            <h2 class="<slug>__heading">{{ $heading }}</h2>
        @endif
    --}}
</section>
```

---

### Infra bootstrap templates (Phase 0)

#### `app/Blocks/BlockManager.php` — create if missing

```php
<?php

namespace App\Blocks;

class BlockManager
{
    /**
     * Folders under resources/blocks/ (each must contain a block.json).
     */
    protected array $blocks = [
        // Add slugs here as blocks are scaffolded.
    ];

    /**
     * Gutenberg block namespace — the prefix used in each block's `block.json`
     * `name` field (e.g., "sage/<slug>"). Not used internally by BlockManager;
     * exposed via getNamespace() so external tooling (the `create-block` skill)
     * knows what prefix to put in new block.json files.
     *
     * Not the same as:
     *   - PHP namespace `App\` (composer PSR-4 autoload, in composer.json)
     *   - Text domain `sage` (used by __('...', 'sage') for translations)
     */
    protected string $namespace = 'sage';

    protected function globalAttributes(): array
    {
        return [
            'paddingVertDesktop' => ['type' => 'number',  'default' => 112],
            'paddingVertMobile'  => ['type' => 'number',  'default' => 56],
            'paddingXDesktop'    => ['type' => 'boolean', 'default' => true],
            'paddingXMobile'     => ['type' => 'boolean', 'default' => true],
        ];
    }

    public function register(): void
    {
        foreach ($this->blocks as $blockName) {
            $this->registerSingleBlock($blockName);
        }
    }

    protected function registerSingleBlock(string $blockName): void
    {
        $blockPath = get_template_directory() . "/resources/blocks/{$blockName}";
        $blockJson = "{$blockPath}/block.json";

        if (!is_dir($blockPath) || !file_exists($blockJson)) {
            return;
        }

        $metadata   = json_decode(file_get_contents($blockJson), true);
        $blockAttrs = $metadata['attributes'] ?? [];

        $mergedAttributes = array_merge($this->globalAttributes(), $blockAttrs);

        register_block_type($blockPath, ['attributes' => $mergedAttributes]);
    }

    public function addBlock(string $blockName): void
    {
        if (!in_array($blockName, $this->blocks, true)) {
            $this->blocks[] = $blockName;
        }
    }

    public function getBlocks(): array
    {
        return $this->blocks;
    }

    public function getNamespace(): string
    {
        return $this->namespace;
    }
}
```

#### `app/blocks.php` — create with this content

Block bootstrap lives in its own file (loaded by `functions.php`'s
`collect([...])` array). Keeps `setup.php` / `filters.php` vanilla and
makes the block lifecycle discoverable in one place.

```php
<?php

/**
 * Block bootstrap.
 *
 * Loaded by functions.php via collect(['setup', 'filters', 'blocks']).
 * All block-related wiring lives here:
 *   - Custom Gutenberg category (BlockCategories)
 *   - Per-block register_block_type calls (BlockManager)
 */

namespace App;

use App\Blocks\BlockCategories;
use App\Blocks\BlockManager;

// Register the custom block category (filter — fires before init).
BlockCategories::register();

// Register all blocks once WP is ready.
add_action('init', function () {
    (new BlockManager())->register();
});
```

#### `functions.php` — add `'blocks'` to the collect array

Sage's `collect([...])` mechanism requires each named theme file
(`app/<name>.php`) during boot. Add `'blocks'` so `app/blocks.php`
actually loads:

```diff
-collect(['setup', 'filters'])
+collect(['setup', 'filters', 'blocks'])
     ->each(function ($file) {
         if (! locate_template($file = "app/{$file}.php", true, true)) {
             // ...
         }
     });
```

If `functions.php` doesn't use the `collect([...])` pattern (heavily
customized theme), **bail out** — the dev needs to wire it manually.

#### `app/setup.php` — vendor libs only (no block bootstrap)

No block-related code goes here anymore — `setup.php` keeps its stock
Sage role (theme supports, nav menus, sidebars). Vendor libs still
live here when introduced, since they're theme-level asset registration
and not block-bootstrap per se:

```php
/**
 * Register vendor libs. Registration != enqueue — nothing loads here.
 * Each block's block.php that needs a lib calls wp_enqueue_script/style
 * for the handle when it renders, so libs only load on pages that have
 * those blocks.
 */
add_action('init', function () {
    // Add wp_register_script / wp_register_style calls here as vendor libs
    // are introduced. Example (Swiper):
    //
    // wp_register_script('swiper',
    //     get_theme_file_uri('resources/js/vendor/swiper-bundle.min.js'),
    //     [], '11.0', true);
    // wp_register_style('swiper',
    //     get_theme_file_uri('resources/css/vendor/swiper-bundle.min.css'),
    //     [], '11.0');
});
```

#### `vite.config.js` — additions

Add these imports below the existing ones:

```js
import fs from 'fs';
import path from 'path';
```

Add this function before `export default defineConfig({...})`:

```js
function discoverBlockAssets() {
  const entries = [];
  const blocksDir = 'resources/blocks';
  if (!fs.existsSync(blocksDir)) return entries;

  for (const dirent of fs.readdirSync(blocksDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const blockPath = path.join(blocksDir, dirent.name);
    for (const file of ['block.js', 'block.css']) {
      const p = path.join(blockPath, file);
      if (fs.existsSync(p)) entries.push(p);
    }
  }
  return entries;
}
```

Spread the discovery into the `laravel({ input: [...] })` plugin call:

```js
laravel({
  input: [
    'resources/css/app.css',
    'resources/js/app.js',
    'resources/css/editor.css',
    'resources/js/editor.js',
    ...discoverBlockAssets(),  // add this line
  ],
  // ...
}),
```

#### `resources/js/editor.js` — add the glob

```js
// Auto-register every block.jsx under resources/blocks/<slug>/.
import.meta.glob('../blocks/*/block.jsx', { eager: true });
```

Place it near the top, alongside other imports. The eager glob ensures every
block's `registerBlockType()` runs when the editor JS loads.

#### `resources/css/app.css` — extend `@source`

Add this line to the existing `@source` declarations:

```css
@source "../blocks/**/*.{php,jsx}";
```

#### `package.json` — install required deps

If `react` / `react-dom` / `@wordpress/icons` aren't in `devDependencies`,
tell the dev to run:

```bash
npm install --save-dev react@^18.0.0 react-dom@^18.0.0 @wordpress/icons
```

(Skill does **not** run `npm` itself — see Behavior Rules.)

Notes:
- **React pinned to `^18`**, not the latest. `^19` resolves to React 19
  which breaks Gutenberg via element-symbol mismatch (WP ships React 18;
  React 19's `Symbol.for("react.transitional.element")` ≠ React 18's
  `Symbol.for("react.element")`).
- **`@wordpress/icons`** is needed because `RemoveButton.jsx` (shared
  component) imports `trash` from it. `wordpressPlugin()` doesn't
  externalize the `icons` package — without it installed, Rolldown errors
  with `failed to resolve import "@wordpress/icons"`. Installed, it gets
  tree-shaken (only used icons bundled).
