# Code Examples — AI Context

Concrete, canonical patterns that put the [`CLAUDE.md`](./CLAUDE.md) rules
together **in context**. Point the AI here + at `CLAUDE.md` before generating
code. The rule-level snippets live in `CLAUDE.md`; this file is the *composed*
reference: one complete Gutenberg block (Sage 11 + Acorn + Vite) plus the
theme-level glue that registers blocks and loads vendored libs on demand.

This is the **canonical layout** — the team's `create-block` skill should
generate folders that match this shape.

## Folder layout

```
app/
  Blocks/
    BlockManager.php                 # blocks list + globalAttributes (minimal)
    BlockCategories.php              # registers the custom block category in Gutenberg
  blocks.php                         # block bootstrap (BlockCategories::register + BlockManager init action)
  setup.php                          # theme supports + vendor libs (vanilla Sage role; no block code here)
  filters.php                        # WP filters (vanilla Sage role)

resources/
  blocks/
    testimonial-carousel/            # folder name = block slug
      block.json                     # metadata; `render` points to block.php
      block.php                      # data prep + view(...)->render()
      block.jsx                      # editor (React, server-rendered save: null)
      block.js                       # frontend behavior (e.g. init Swiper)
      block.css                      # styles scoped under .testimonial-carousel
      preview.svg                    # inserter-hover preview (placeholder; swap for .webp/.png if you want)
    components/
      backend/                       # shared JSX components used across blocks
        ImageUploadWithHover.jsx
        LinkPicker.jsx
        RemoveButton.jsx
        TabSelector.jsx
        PaddingControls.jsx
        padding-presets.js
        ImagePositionControl.jsx
  views/
    blocks/
      testimonial-carousel.blade.php # view-only Blade
  js/
    vendor/
      swiper-bundle.min.js           # pre-built distributable
  css/
    vendor/
      swiper-bundle.min.css

vite.config.js                       # discoverBlockAssets() makes block.js/.css Vite entries
```

## Responsibilities

| Concern | Owned by |
|---|---|
| List of blocks the theme exposes | `BlockManager::$blocks` (manual list, on purpose) |
| Attributes injected into every block (e.g. padding presets) | `BlockManager::globalAttributes()` |
| Calling `register_block_type` for each block | `BlockManager::registerSingleBlock()` |
| Block bootstrap (centralizes block-related wiring) | `app/blocks.php` — calls `BlockCategories::register()` and the BlockManager `init` action. Loaded by `functions.php` via `collect(['setup', 'filters', 'blocks'])` (Sage's "categorically named theme files" mechanism). |
| Custom block category (so the team's blocks group together in the inserter) | `app/Blocks/BlockCategories.php` (class with consts `SLUG`/`TITLE` + static `register()` that hooks `block_categories_all`). Called from `app/blocks.php`. |
| Shared editor components (image picker, link picker, repeater tabs, delete button, padding panel, etc.) | `resources/blocks/components/backend/` (re-used by every `block.jsx`) |
| Vendor libs registration (URL + version) | `app/setup.php` (`wp_register_script`/`wp_register_style` on `init`) |
| Vendor libs enqueue (per-block, conditional) | `block.php` of each block that needs the lib (`wp_enqueue_script`/`wp_enqueue_style`) |
| Per-block local assets (`block.js`, `block.css`) | Vite (`discoverBlockAssets()` in `vite.config.js`) + `@roots/vite-plugin` |
| Data preparation/sanitization for a block | `<block>/block.php` |
| Rendering markup | `resources/views/blocks/<slug>.blade.php` (Blade is view-only) |
| Editor UI (Gutenberg) | `<block>/block.jsx` |

## How to read this reference

- **Blade is view-only.** Data is shaped/sanitized in `block.php`; the Blade
  view loops over already-prepared data and only decides *how* it looks.
- **`{{ }}` auto-escapes** (≈ `esc_html`). The one raw output is
  `{!! wp_get_attachment_image(...) !!}` — trusted HTML from WP core.
- **Vendor libs are downloaded into `resources/{js,css}/vendor/`** as
  pre-built distributables. `wp_register_script`/`wp_register_style` lives
  in `app/setup.php` (centralized inventory of URL + version). Each
  `block.php` that needs a lib calls `wp_enqueue_script`/`wp_enqueue_style`
  for the handle, so libs only load on pages that have those blocks.
- **Block-local assets (`block.js`/`block.css`) are NOT in `block.json`.**
  They are discovered by `vite.config.js` and wired by `@roots/vite-plugin`.
- **`block.json` uses `"render": "file:./block.php"`** — WP 6.1+ runs that PHP
  as the block's render. No `render_callback` is passed to `register_block_type`.
- **Every block has a unique root class** matching its slug
  (`.testimonial-carousel`) — encapsulation scope for the styles.
- **Shared editor components live in `resources/blocks/components/backend/`** — every
  `block.jsx` imports `PaddingControls` from there (renders the spacing panel in
  the sidebar); blocks with images use `ImageUploadWithHover` +
  `ImagePositionControl`, blocks with internal/external links use `LinkPicker`
  (which wraps Gutenberg's `LinkControl`), blocks with array attributes use
  `TabSelector` + `RemoveButton` for the tab-style repeater. These ship with
  the team's `create-block` skill — see `skills/create-block/templates/`.
- **Editor layout pattern**: every block.jsx renders `<PaddingControls />`
  (sidebar config) outside the wrapper, then a `<section>` with the dashed
  border + bg color + `mb-10` margin to separate blocks visually. Inside the
  section, content fields go in labeled white cards
  (`<div className="p-3 border border-gray-300 rounded bg-white">`).

---

## `app/Blocks/BlockManager.php`

Minimal manager: a flat list of block slugs, global attributes merged into
each block at registration, nothing else. Vendor libs and their enqueue
behavior live elsewhere (`app/setup.php` registers; `block.php` enqueues).
Adding a new block = create the folder + add the slug to the `$blocks` array.

```php
<?php

namespace App\Blocks;

class BlockManager
{
    /**
     * Folders under resources/blocks/ (each must contain a block.json).
     */
    protected array $blocks = [
        'testimonial-carousel',
        // 'hero',
        // 'split-banner',
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

    /**
     * Global attributes injected into every block at registration time.
     * Change defaults here; per-block attributes (in block.json) take precedence.
     */
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

        // Global attributes are the base; block-level attributes take precedence.
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

## `app/blocks.php` (block bootstrap)

Central block-bootstrap file. Loaded by `functions.php` via Sage's
`collect([...])` mechanism — keeps `setup.php`/`filters.php` vanilla
and makes the block lifecycle discoverable in one place.

```php
<?php

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

For this file to load, `functions.php` must include `'blocks'` in its
`collect([...])` array:

```diff
-collect(['setup', 'filters'])
+collect(['setup', 'filters', 'blocks'])
     ->each(function ($file) {
         if (! locate_template($file = "app/{$file}.php", true, true)) {
             // ...
         }
     });
```

Without `'blocks'` in the array, the file is never required and no
blocks register.

## `app/setup.php` (vendor libs — vanilla Sage role)

`setup.php` keeps its stock Sage role: theme supports, nav menus,
sidebars, and theme-level asset registration. **No block-related code
here** — block bootstrap moved to `app/blocks.php`. Vendor libs still
live in `setup.php` since they're theme-level (registered globally,
enqueued per-block):

```php
/**
 * Register vendor libs. Registration != enqueue — nothing loads here.
 * Each block's block.php that needs a lib calls wp_enqueue_script/style
 * for the handle when it renders, so libs only load on pages that have
 * those blocks.
 */
add_action('init', function () {
    wp_register_script('swiper',
        get_theme_file_uri('resources/js/vendor/swiper-bundle.min.js'),
        [], '11.0', true);
    wp_register_style('swiper',
        get_theme_file_uri('resources/css/vendor/swiper-bundle.min.css'),
        [], '11.0');
});
```

## `vite.config.js` — block asset discovery

`block.js` / `block.css` for each block become Vite entries automatically by
folder convention — no manual list to keep in sync.

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { wordpressPlugin } from '@roots/vite-plugin';
import fs from 'fs';
import path from 'path';

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

export default defineConfig({
  plugins: [
    laravel({
      input: [
        'resources/css/app.css',
        'resources/js/app.js',
        ...discoverBlockAssets(),
      ],
      refresh: true,
    }),
    wordpressPlugin(),
  ],
});
```

---

## Reference block: `testimonial-carousel`

A Swiper-based carousel. Demonstrates conditional vendor enqueue, view-only
Blade, sanitization at the boundary, and BEM-scoped styles.

### `resources/blocks/testimonial-carousel/block.json`

No `viewScript`/`style`/`editorScript` keys — those local assets are wired
by Vite + `@roots/vite-plugin`. `render` points to the per-block PHP.

```json
{
  "apiVersion": 3,
  "name": "sage/testimonial-carousel",
  "title": "Testimonial Carousel",
  "category": "custom-blocks",
  "icon": "format-quote",
  "description": "A Swiper-based testimonials carousel.",
  "keywords": ["testimonial", "quote", "carousel"],
  "textdomain": "sage",
  "render": "file:./block.php",
  "attributes": {
    "isPreview": {
      "type": "boolean",
      "default": false
    },
    "heading": {
      "type": "string",
      "default": ""
    },
    "bgImageId": {
      "type": "number",
      "default": 0
    },
    "bgImageUrl": {
      "type": "string",
      "default": ""
    },
    "bgImagePosition": {
      "type": "string",
      "default": "center"
    },
    "items": {
      "type": "array",
      "default": []
    }
  },
  "supports": {
    "html": false,
    "align": ["wide", "full"]
  },
  "example": {
    "attributes": {
      "isPreview": true
    }
  }
}
```

### `resources/blocks/testimonial-carousel/block.php`

Runs as the block's render (via `block.json` `render` key). Shapes/sanitizes
data, then hands off to Blade. Blade never touches raw attributes.

```php
<?php

if (!defined('ABSPATH')) {
    exit;
}

// Swiper was registered in app/setup.php; enqueue it here so it only loads
// on pages where this block is actually rendered.
wp_enqueue_script('swiper');
wp_enqueue_style('swiper');

/**
 * Item shape (one entry of the `items` attribute):
 *   [ 'quote' => string, 'author' => string, 'role' => string, 'imageId' => int ]
 */
$attributes = $attributes ?? [];

$items = array_map(static function (array $item): array {
    return [
        'quote'    => sanitize_text_field($item['quote']  ?? ''),
        'author'   => sanitize_text_field($item['author'] ?? ''),
        'role'     => sanitize_text_field($item['role']   ?? ''),
        // Editor input — coerce on the way in.
        'image_id' => isset($item['imageId']) ? absint($item['imageId']) : 0,
    ];
}, $attributes['items'] ?? []);

echo view('blocks.testimonial-carousel', [
    'heading'         => sanitize_text_field($attributes['heading'] ?? ''),
    'bgImageId'       => absint($attributes['bgImageId'] ?? 0),
    'bgImageUrl'      => esc_url_raw($attributes['bgImageUrl'] ?? ''),
    'bgImagePosition' => sanitize_text_field($attributes['bgImagePosition'] ?? 'center'),
    'items'           => $items,
    // Global padding attributes injected by BlockManager::globalAttributes().
    'paddingVertDesktop' => absint($attributes['paddingVertDesktop'] ?? 112),
    'paddingVertMobile'  => absint($attributes['paddingVertMobile']  ?? 56),
    'paddingXDesktop'    => (bool) ($attributes['paddingXDesktop']   ?? true),
    'paddingXMobile'     => (bool) ($attributes['paddingXMobile']    ?? true),
])->render();
```

### `resources/blocks/testimonial-carousel/block.jsx`

Editor side (Gutenberg). `save: () => null` because rendering is server-side.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    MediaUpload,
    MediaUploadCheck,
    RichText,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PaddingControls }       from '../components/backend/PaddingControls.jsx';
import { ImageUploadWithHover }  from '../components/backend/ImageUploadWithHover.jsx';
import { ImagePositionControl }  from '../components/backend/ImagePositionControl.jsx';
import { TabSelector }           from '../components/backend/TabSelector.jsx';
import { RemoveButton }          from '../components/backend/RemoveButton.jsx';
import previewImage from './preview.svg';
import metadata from './block.json';

registerBlockType(metadata, {
    edit({ attributes, setAttributes }) {
        const blockProps = useBlockProps();
        const { isPreview, heading, bgImageId, bgImageUrl, bgImagePosition, items } = attributes;

        // Static preview for the Gutenberg inserter hover panel.
        if (isPreview) {
            return (
                <div {...blockProps}>
                    <img
                        src={previewImage}
                        alt={__('Testimonial Carousel preview', 'sage')}
                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
                    />
                </div>
            );
        }

        // Repeater helpers — see Phase 2 of the create-block skill for the canonical pattern.
        const [activeIdx, setActiveIdx] = useState(0);
        const safeItems = items || [];
        const updateItem = (index, patch) =>
            setAttributes({ items: safeItems.map((it, i) => i === index ? { ...it, ...patch } : it) });
        const removeItem = (index) => {
            setAttributes({ items: safeItems.filter((_, i) => i !== index) });
            setActiveIdx(Math.max(0, index - 1));
        };
        const addItem = () => {
            const next = [...safeItems, { quote: '', author: '', role: '', imageId: 0, imageUrl: '' }];
            setAttributes({ items: next });
            setActiveIdx(next.length - 1);
        };

        const active = safeItems[activeIdx];

        return (
            <>
                {/* Sidebar (InspectorControls) — config only. */}
                <PaddingControls attributes={attributes} setAttributes={setAttributes} />

                {/* Editor body — content in the dashed wrapper. */}
                <section
                    {...blockProps}
                    className={`${blockProps.className} mb-10 bg-gray-50 border-2 border-dashed border-gray-600 rounded-lg p-6 relative overflow-hidden`}
                >
                    <h3 className="text-base font-sans! font-bold mb-8 uppercase tracking-widest text-gray-500 relative z-10">
                        Testimonial Carousel Preview
                    </h3>

                    <div className="space-y-6 relative z-10">
                        {/* Heading */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Heading</label>
                            <div className="p-3 border border-gray-300 rounded bg-white">
                                <RichText
                                    tagName="h2"
                                    value={heading}
                                    onChange={(value) => setAttributes({ heading: value })}
                                    className="!m-0"
                                    placeholder={__('Section heading…', 'sage')}
                                />
                            </div>
                        </div>

                        {/* Background image (optional) */}
                        <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Background</label>
                            <MediaUploadCheck>
                                <ImageUploadWithHover
                                    imageId={bgImageId}
                                    imageUrl={bgImageUrl}
                                    MediaUpload={MediaUpload}
                                    onSelect={(media) => setAttributes({ bgImageId: media.id, bgImageUrl: media.url })}
                                    onRemove={() => setAttributes({ bgImageId: 0, bgImageUrl: '' })}
                                    height="200px"
                                />
                            </MediaUploadCheck>
                            <ImagePositionControl
                                value={bgImagePosition}
                                onChange={(val) => setAttributes({ bgImagePosition: val })}
                            />
                        </div>

                        {/* Slides repeater — tabs pattern */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <TabSelector
                                items={safeItems}
                                activeItem={activeIdx}
                                setActiveItem={setActiveIdx}
                                addItem={addItem}
                                itemLabelPrefix={__('Slide', 'sage')}
                            />

                            {active && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Quote</label>
                                        <div className="p-3 border border-gray-300 rounded bg-white">
                                            <RichText
                                                tagName="p"
                                                value={active.quote}
                                                onChange={(value) => updateItem(activeIdx, { quote: value })}
                                                className="!m-0 min-h-[80px]"
                                                placeholder={__('Enter testimonial quote…', 'sage')}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Author</label>
                                            <div className="p-2 border border-gray-300 rounded bg-white">
                                                <RichText
                                                    tagName="p"
                                                    value={active.author}
                                                    onChange={(value) => updateItem(activeIdx, { author: value })}
                                                    className="!m-0"
                                                    placeholder={__('Author name…', 'sage')}
                                                />
                                            </div>
                                        </div>
                                        {safeItems.length > 1 && (
                                            <RemoveButton
                                                label={__('Remove this slide', 'sage')}
                                                onClick={() => removeItem(activeIdx)}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </>
        );
    },

    // Server-rendered via block.php — no client save.
    save: () => null,
});
```

### `resources/blocks/testimonial-carousel/block.js`

Frontend behavior. Swiper is registered by `BlockManager` and enqueued only
when this block renders, so `window.Swiper` is available here.

```js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Swiper === 'undefined') return;

    document.querySelectorAll('.testimonial-carousel__viewport').forEach((el) => {
        new Swiper(el, {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 24,
            navigation: {
                nextEl: el.querySelector('.testimonial-carousel__next'),
                prevEl: el.querySelector('.testimonial-carousel__prev'),
            },
        });
    });
});
```

### `resources/blocks/testimonial-carousel/block.css`

Scoped under the block root class. Tailwind default scale via `@apply`. BEM
because this block has nested states (track/item/person/role).

```css
.testimonial-carousel {
    @apply py-16;
}

.testimonial-carousel__heading {
    @apply mb-8 text-3xl font-bold leading-tight;
}

.testimonial-carousel__viewport {
    @apply relative overflow-hidden;
}

.testimonial-carousel__track {
    @apply flex;
}

.testimonial-carousel__item {
    @apply flex flex-col gap-4 rounded-lg bg-gray-50 p-6;
}

.testimonial-carousel__quote {
    @apply text-lg italic text-gray-800;
}

.testimonial-carousel__person {
    @apply flex items-center gap-3;
}

.testimonial-carousel__avatar {
    @apply h-12 w-12 rounded-full object-cover;
}

.testimonial-carousel__author {
    @apply font-semibold;
}

.testimonial-carousel__role {
    @apply text-sm text-gray-500;
}

.testimonial-carousel__prev,
.testimonial-carousel__next {
    @apply absolute top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2;
}
```

### `resources/views/blocks/testimonial-carousel.blade.php`

View-only. Data was prepared in `block.php`. `{{ }}` auto-escapes; the only
raw output is `wp_get_attachment_image()` — trusted HTML from WP core, called
with an **explicit image size** (CLAUDE.md › Performance).

```blade
{{--
    View-only (CLAUDE.md › PHP/Blade): no queries, no business logic, no
    fetching. `.testimonial-carousel` is the block's unique root class —
    encapsulation scope for the styles (CLAUDE.md › CSS).
--}}
@unless (empty($items))
    <section class="testimonial-carousel" aria-label="{{ $heading ?: __('Testimonials', 'sage') }}">
        @if ($heading)
            <h2 class="testimonial-carousel__heading">{{ $heading }}</h2>
        @endif

        <div class="testimonial-carousel__viewport swiper">
            <ul class="testimonial-carousel__track swiper-wrapper">
                @foreach ($items as $item)
                    <li class="testimonial-carousel__item swiper-slide">
                        <blockquote class="testimonial-carousel__quote">{{ $item['quote'] }}</blockquote>

                        <div class="testimonial-carousel__person">
                            @if ($item['image_id'])
                                {{-- Explicit size — CLAUDE.md › Performance --}}
                                {!! wp_get_attachment_image($item['image_id'], 'thumbnail', false, [
                                    'class' => 'testimonial-carousel__avatar',
                                    'alt'   => $item['author'],
                                ]) !!}
                            @endif

                            <p class="testimonial-carousel__author">{{ $item['author'] }}</p>

                            @if ($item['role'])
                                <p class="testimonial-carousel__role">{{ $item['role'] }}</p>
                            @endif
                        </div>
                    </li>
                @endforeach
            </ul>

            <button type="button" class="testimonial-carousel__prev" aria-label="{{ __('Previous', 'sage') }}">‹</button>
            <button type="button" class="testimonial-carousel__next" aria-label="{{ __('Next', 'sage') }}">›</button>
        </div>
    </section>
@endunless
```
