# WordPress — Development Best Practices

> Read before any PR.

---

## ⚠️ Critical Rules

- **Never `git push` without permission**.
- **Never write to production / a remote environment without explicit permission.** Read-only commands (Terminus, remote `wp-cli`) are free; writes (`lando push`, `terminus` deploy/clone/wipe, remote `wp db`/`search-replace`/import) and `lando pull` need explicit ask.
- **Never modify WordPress core or third-party plugin files** — only plugins we own. If unsure whether a plugin is ours, **stop and ask** (changes get wiped on the next update).
- **Always maintain a `CHANGELOG.md`** in every theme/plugin we own that we touch. Create if missing; append entries following [Keep a Changelog](https://keepachangelog.com): `## [version] - YYYY-MM-DD` header, `Added` / `Changed` / `Fixed` / `Removed` subsections.
- **Always version the theme and every plugin we own** using SemVer (`MAJOR.MINOR.PATCH`): MAJOR = breaking, MINOR = backwards-compatible feature, PATCH = fix. Version lives in the theme's `style.css` header and the plugin's main PHP file header. Every bump = one new `## [version] - YYYY-MM-DD` entry in `CHANGELOG.md`.
- **Never add `Co-authored-by`** in commit messages.
- **English** for all commit messages, comments, and variables.
- **Never assume** — when unclear, stop and ask.
- **Don't just agree** — push back on flawed requests with explanation.

---

## Stack

| Layer | Technology |
|---|---|
| Theme | [Sage (Roots)](https://roots.io/sage/) |
| Build | Vite |
| PHP | Blade + Acorn (Laravel) |
| CSS | Tailwind (via `@apply` for reusable patterns) |
| Blocks | Gutenberg via Acorn |
| Local env | [Lando](https://lando.dev/) |

---

## Git

```
[FEAT]: add testimonials block
[FIX]: fix mobile menu on Safari
[CHORE]: update theme dependencies
```

Types: `feat` `fix` `refactor` `chore` `docs` `style` — one subject per commit.

---

## Blocks

To create a new block, use the `create-block` SKILL. If it doesn't exist in the project, ask the user to add it before proceeding.

---

## CSS

Tailwind utilities for one-off styles; `@apply` in a dedicated class for reusable/semantic patterns.

- Stick to Tailwind's default scale (`rem` for fonts, spacing). Arbitrary values only when strictly needed.
- Every block has a **unique root class** named after the block (`.hero`, `.testimonials`) — scopes all its styles.
- Nest selectors under the root. BEM (`__element--modifier`) only for complex blocks with many nested states.

```css
/* Simple block — clean classes */
.hero { ... }
.hero .title { ... }
.hero .subtitle { ... }

/* Complex block — BEM */
.accordion__item { ... }
.accordion__item--active { ... }
.accordion__trigger { ... }
```

- Never reuse generic class names (`.card`, `.box`, `.wrapper`) across blocks.
- Global CSS variables in `resources/styles/variables.css`.

---

## PHP / Blade

**Blade is view-only.** No business logic, queries, or data fetching. Only render-control logic (conditionals, loops over already-prepared data).

- `wp_get_attachment_image($id, 'large')` — always include the size argument (enables native `srcset`); never omit it.
- Avoid nested `WP_Query` inside loops.

**Sanitize input, escape output:**

```php
// Input (saving data)
sanitize_text_field($_POST['name']);
sanitize_email($_POST['email']);
wp_kses_post($_POST['content']);  // safe HTML
absint($_POST['count']);

// Output (rendering data)
esc_html($value);        // plain text
esc_attr($value);        // HTML attributes
esc_url($url);           // URLs
wp_kses_post($content);  // trusted HTML
```

---

## Scripts & Styles

Third-party scripts/styles: **register globally** in `app/setup.php` (on `init`), then **enqueue per-block** inside that block's `block.php` render. Never enqueue vendor libs globally.

```php
add_action('init', function () {
    wp_register_script('swiper', 'https://cdn.example.com/swiper.min.js', [], '11.0', true);
});

// Inside the block render callback
wp_enqueue_script('swiper');
```

---

## Comments

Good code is self-explanatory. **Comment why, never what.**

```php
// ❌ $title = get_the_title($id); // gets the post title
// ✅ API returns null on private posts; fallback prevents fatal in template
$title = get_the_title($id) ?? get_bloginfo('name');
```

- If a comment seems necessary, try renaming a variable or function first.
- Stale comments are worse than no comments — delete when the code changes.
- TODOs require owner and date: `// TODO @name YYYY-MM-DD: remove after migration`
- Never commit commented-out code.

---

## PR Checklist

- [ ] Tested on mobile and desktop
- [ ] No `console.log` or `var_dump` left behind
- [ ] Unique block root class, scoped styles
- [ ] All inputs sanitized, all outputs escaped
- [ ] Commit in English, no co-author, one subject
- [ ] **`CHANGELOG.md` of the theme/plugin updated** with this PR's changes
- [ ] **Version bumped** in the theme's `style.css` / plugin header following SemVer (MAJOR / MINOR / PATCH per the rule above)
- [ ] Permission granted before pushing to `main`/`production`
- [ ] **Did not alter anything in production without explicit permission**
- [ ] **Did not alter WordPress core or third-party plugin files** (only plugins we own)
