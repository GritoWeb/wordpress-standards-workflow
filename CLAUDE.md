# WordPress — Development Best Practices

> Read before any PR.

---

## ⚠️ Critical Rules

- **Never `git push` without permission** from the project owner.
- **Never alter anything in production / a remote environment without me explicitly asking.** Read-only remote commands (Terminus, remote `wp-cli`) may be run freely; any write — `lando push`, `terminus` deploy/clone/wipe, remote `wp db` / `search-replace` / import — needs explicit permission. Run `lando pull` only when explicitly requested.
- **Never add `Co-authored-by`** in commit messages.
- **All commit messages, comments and variables must be in English.**
- **Never make assumptions** — if anything is unclear or you are not sure, stop and ask for direction before acting.
- **Don't just agree** — if a request or suggestion is flawed, push back and explain why instead of complying silently.

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

Use Tailwind utility classes directly for one-off styles. For reusable or semantic patterns, use `@apply` in a dedicated CSS class.

```css
.card-title {
  @apply text-2xl font-bold leading-tight;
}
```

- Always use Tailwind's default scale — `rem` for font sizes, spacing, etc. Avoid arbitrary values unless strictly necessary.
- Every block must have a **unique root class** named after the block (e.g. `.hero`, `.testimonials`). This class acts as the encapsulation scope.
- Nest selectors under the root class. BEM (`__element--modifier`) is only required for complex blocks with many nested states.

```css
/* Simple block — clean classes are fine */
.hero { ... }
.hero .title { ... }
.hero .subtitle { ... }

/* Complex block — use BEM */
.accordion__item { ... }
.accordion__item--active { ... }
.accordion__trigger { ... }
```

- Never reuse generic class names (`.card`, `.box`, `.wrapper`) across different blocks.
- Global CSS variables live in `resources/styles/variables.css`.

---

## PHP / Blade

**Blade is view-only.** No business logic, no queries, no data fetching. Only logic that directly controls what is rendered (conditionals, loops over already-prepared data).

```php
// Always declare the image size explicitly
echo wp_get_attachment_image($image_id, 'large');   // ✅
echo wp_get_attachment_image($image_id);            // ❌ never omit the size
```

**Sanitization — always sanitize input and escape output:**

```php
// Input (saving data)
sanitize_text_field($_POST['name']);
sanitize_email($_POST['email']);
wp_kses_post($_POST['content']);  // allows safe HTML
absint($_POST['count']);

// Output (rendering data)
esc_html($value);        // plain text
esc_attr($value);        // HTML attributes
esc_url($url);           // URLs
wp_kses_post($content);  // trusted HTML content
```

---

## Scripts & Styles

All third-party scripts/styles must use `wp_register_script` / `wp_register_style` and be enqueued **at block level**, not globally.

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
// ❌ $title = get_the_title($post->ID); // gets the post title

// ✅ API returns null on private posts; fallback prevents fatal in template
$title = get_the_title($post->ID) ?? get_bloginfo('name');
```

- If a comment seems necessary, try renaming the variable or function first.
- Stale comments are worse than no comments — delete when the code changes.
- TODOs require owner and date: `// TODO @name YYYY-MM-DD: remove after migration`
- Never commit commented-out code — that's what git is for.

---

## Performance

- Avoid nested `WP_Query` inside loops.
- Always use `wp_get_attachment_image()` with an explicit size for native `srcset` support.

---

## PR Checklist

- [ ] Tested on mobile and desktop
- [ ] No `console.log` or `var_dump` left behind
- [ ] Unique block root class, scoped styles
- [ ] All inputs sanitized, all outputs escaped
- [ ] Commit in English, no co-author, one subject
- [ ] Permission granted before pushing to `main`/`production`
- [ ] **Did not alter anything in production without explicit permission**
