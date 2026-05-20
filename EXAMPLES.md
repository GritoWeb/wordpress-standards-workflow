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
    BlockManager.php                 # blocks list + globalAttributes + $libs + render_block filter
  setup.php                          # bootstraps BlockManager on init

resources/
  blocks/
    testimonial-carousel/            # folder name = block slug
      block.json                     # metadata; `render` points to block.php
      block.php                      # data prep + \Roots\view(...)->render()
      block.jsx                      # editor (React, server-rendered save: null)
      block.js                       # frontend behavior (e.g. init Swiper)
      block.css                      # styles scoped under .testimonial-carousel
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
| Vendor libs (Swiper etc.): inventory + versions | `BlockManager::$libs` |
| Conditional enqueue of vendor libs (only when block is on page) | `BlockManager::enqueueBlockLibs()` via `render_block` filter |
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
  pre-built distributables. `BlockManager` registers them globally and only
  enqueues them when a block that declares them is rendered on the page.
- **Block-local assets (`block.js`/`block.css`) are NOT in `block.json`.**
  They are discovered by `vite.config.js` and wired by `@roots/vite-plugin`.
- **`block.json` uses `"render": "file:./block.php"`** — WP 6.1+ runs that PHP
  as the block's render. No `render_callback` is passed to `register_block_type`.
- **Every block has a unique root class** matching its slug
  (`.testimonial-carousel`) — encapsulation scope for the styles.

---

## `app/Blocks/BlockManager.php`

Manual list of blocks (explicit > implicit), global attributes merged at
registration, vendor libs registered globally + conditionally enqueued per
block on render. Adding a new block = create the folder + add the slug to the
`$blocks` array.

```php
<?php

namespace App\Blocks;

class BlockManager
{
    /**
     * Each block: optional `enqueue` listing handles from $libs.
     * Blocks with no external lib stay as `=> []`.
     */
    protected array $blocks = [
        'testimonial-carousel' => ['enqueue' => ['swiper']],
        // 'hero'              => [],
        // 'split-banner'      => [],
    ];

    /**
     * Block namespace (e.g., "sage/testimonial-carousel").
     */
    protected string $namespace = 'sage';

    /**
     * Vendor folders (relative to the theme root).
     */
    protected string $vendorJs  = 'resources/js/vendor';
    protected string $vendorCss = 'resources/css/vendor';

    /**
     * Vendored libs. `script`/`style` are filenames within $vendorJs/$vendorCss.
     * Omit either side if the lib doesn't have it.
     */
    protected array $libs = [
        'swiper' => [
            'script'  => 'swiper-bundle.min.js',
            'style'   => 'swiper-bundle.min.css',
            'version' => '11.0',
        ],
    ];

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
        $this->registerLibs();

        foreach (array_keys($this->blocks) as $blockName) {
            $this->registerSingleBlock($blockName);
        }

        // Conditional enqueue: fires only when a block is actually rendered.
        add_filter('render_block', [$this, 'enqueueBlockLibs'], 10, 2);
    }

    /**
     * Register vendored libs globally (registration ≠ enqueue — nothing loads yet).
     */
    protected function registerLibs(): void
    {
        foreach ($this->libs as $handle => $lib) {
            if (!empty($lib['script'])) {
                wp_register_script(
                    $handle,
                    get_theme_file_uri("{$this->vendorJs}/{$lib['script']}"),
                    [],
                    $lib['version'] ?? null,
                    true
                );
            }
            if (!empty($lib['style'])) {
                wp_register_style(
                    $handle,
                    get_theme_file_uri("{$this->vendorCss}/{$lib['style']}"),
                    [],
                    $lib['version'] ?? null
                );
            }
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

    /**
     * Hooked on `render_block` — fires only when WP is rendering this exact
     * block on the current request, so the lib only loads on pages that need it.
     */
    public function enqueueBlockLibs(string $content, array $block): string
    {
        $slug = str_replace("{$this->namespace}/", '', $block['blockName'] ?? '');
        $handles = $this->blocks[$slug]['enqueue'] ?? [];

        foreach ($handles as $handle) {
            if (!isset($this->libs[$handle])) {
                continue;
            }
            if (!empty($this->libs[$handle]['script'])) {
                wp_enqueue_script($handle);
            }
            if (!empty($this->libs[$handle]['style'])) {
                wp_enqueue_style($handle);
            }
        }

        return $content;
    }

    public function addBlock(string $blockName, array $config = []): void
    {
        if (!array_key_exists($blockName, $this->blocks)) {
            $this->blocks[$blockName] = $config;
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

## `app/setup.php` (bootstrap)

```php
// Bootstraps the manager. register_block_type must run on/after `init`.
add_action('init', function () {
    (new \App\Blocks\BlockManager())->register();
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
  "category": "design",
  "icon": "format-quote",
  "description": "A Swiper-based testimonials carousel.",
  "keywords": ["testimonial", "quote", "carousel"],
  "textdomain": "sage",
  "render": "file:./block.php",
  "attributes": {
    "heading": {
      "type": "string",
      "default": ""
    },
    "items": {
      "type": "array",
      "default": []
    }
  },
  "supports": {
    "html": false,
    "align": ["wide", "full"]
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

/**
 * Item shape (one entry of the `items` attribute):
 *   [ 'quote' => string, 'author' => string, 'role' => string, 'imageId' => int ]
 */
$attributes = $attributes ?? [];

$items = array_map(static function (array $item): array {
    return [
        'quote'    => $item['quote']  ?? '',
        'author'   => $item['author'] ?? '',
        'role'     => $item['role']   ?? '',
        // Editor input — coerce on the way in.
        'image_id' => isset($item['imageId']) ? absint($item['imageId']) : 0,
    ];
}, $attributes['items'] ?? []);

echo \Roots\view('blocks.testimonial-carousel', [
    'heading' => $attributes['heading'] ?? '',
    'items'   => $items,
    // Global padding attributes injected by BlockManager::globalAttributes().
    'paddingVertDesktop' => $attributes['paddingVertDesktop'] ?? 112,
    'paddingVertMobile'  => $attributes['paddingVertMobile']  ?? 56,
    'paddingXDesktop'    => $attributes['paddingXDesktop']    ?? true,
    'paddingXMobile'     => $attributes['paddingXMobile']     ?? true,
])->render();
```

### `resources/blocks/testimonial-carousel/block.jsx`

Editor side (Gutenberg). `save: () => null` because rendering is server-side.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

registerBlockType(metadata, {
    edit({ attributes, setAttributes }) {
        const { heading, items } = attributes;
        const blockProps = useBlockProps({ className: 'testimonial-carousel' });

        return (
            <div {...blockProps}>
                <InspectorControls>
                    <PanelBody title={__('Testimonials', 'sage')} />
                </InspectorControls>

                <RichText
                    tagName="h2"
                    className="testimonial-carousel__heading"
                    value={heading}
                    onChange={(value) => setAttributes({ heading: value })}
                    placeholder={__('Section heading…', 'sage')}
                />

                {/* Replace with a real repeater UI for `items` in production. */}
                <p>{(items || []).length} {__('testimonials configured', 'sage')}</p>
            </div>
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
