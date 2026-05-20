---
name: html-qa-smoketest
description: >
  Run a full QA and smoke test on HTML, pages, or component blocks. Use this skill whenever the user asks to review, audit, test, or QA any HTML snippet, component, full page, or template file (JSX/TSX/HTML/Blade/etc). Also use when the user asks "is this HTML correct?", "can you review this component?", "are there any accessibility issues?", "is the SEO ok?", or any variation of markup review. Generates a structured report with severity per item indicating what is ❌ wrong, ⚠️ needs attention, or ✅ correct, and suggests corrected code when applicable.
---

# HTML QA Smoke Test

Skill for auditing HTML (or JSX/TSX/Blade) focused on quality, performance, accessibility, and SEO. Generates a clear report with severity per item and inline fix suggestions.

---

## Execution Flow

1. **Receive the HTML/component** from the user (can be a snippet, block, full page, JSX, TSX, Blade, etc.)
2. **Run all checks** from the checklist below
3. **Build the report** in the format defined in the "Report Format" section
4. **Offer corrected code** at the end if there are ❌ or ⚠️ items
5. **Smoke test on site** — If the user provides a public or local URL (e.g. `http://localhost:3000`), use the available screenshot/navigation tool to open the page, capture the screen, and visually audit: broken layout, images not loading, clipped text, overlapping elements, responsiveness. Report as an additional section **🚬 Visual Smoke Test** in the report.

---

## QA Checklist

### 🖼️ Images

| # | Check | Default Severity |
|---|-------|-----------------|
| IMG-1 | Format: use only `.webp` or `.svg`. JPG/PNG/GIF are flags. | ❌ Critical |
| IMG-2 | `<img>` tag with `srcset` and `sizes` for responsive images | ❌ Critical |
| IMG-3 | Every `<img>` must have an `alt` attribute. Empty alt (`alt=""`) is acceptable only for decorative images | ❌ Critical |
| IMG-4 | Decorative images: use `alt=""` + `role="presentation"` or CSS background | ⚠️ Attention |
| IMG-5 | Images with explicit `width` and `height` to avoid layout shift (CLS) | ⚠️ Attention |
| IMG-6 | Above-the-fold images without `loading="lazy"` (don't lazy-load the LCP) | ⚠️ Attention |
| IMG-7 | Below-the-fold images with `loading="lazy"` | ⚠️ Attention |
| IMG-8 | Check for `fetchpriority="high"` on the LCP element (hero image) | ⚠️ Attention |

**Correct example:**
```html
<img
  src="/hero.webp"
  srcset="/hero-480.webp 480w, /hero-800.webp 800w, /hero-1200.webp 1200w"
  sizes="(max-width: 600px) 480px, (max-width: 900px) 800px, 1200px"
  alt="Meaningful image description"
  width="1200"
  height="600"
  fetchpriority="high"
/>
```

---

### 📐 Heading Hierarchy

| # | Check | Default Severity |
|---|-------|-----------------|
| HEAD-1 | Exactly one `<h1>` per page/main section | ❌ Critical |
| HEAD-2 | Hierarchy must not skip levels (e.g. h1 → h3 without h2) | ❌ Critical |
| HEAD-3 | Headings must not be used for visual styling only; use CSS for sizing | ⚠️ Attention |
| HEAD-4 | Heading must describe the content that follows, not be generic ("Section 1") | ⚠️ Attention |

**Expected hierarchy map:**
```
h1 (unique per page)
  └── h2
        └── h3
              └── h4 (rare, only when needed)
```

---

### 🏗️ HTML Semantics

| # | Check | Default Severity |
|---|-------|-----------------|
| SEM-1 | Use `<header>`, `<main>`, `<footer>`, `<nav>`, `<aside>`, `<section>`, `<article>` instead of generic `<div>` | ❌ Critical |
| SEM-2 | `<nav>` must contain a list of links (`<ul>/<li>/<a>`) | ⚠️ Attention |
| SEM-3 | Action buttons: use `<button>`, not a clickable `<div>` or `<span>` | ❌ Critical |
| SEM-4 | Navigation links: use `<a href>`, not `<button>` or `<div>` | ❌ Critical |
| SEM-5 | Item lists: use `<ul>/<ol>/<li>`, not repeated `<div>` | ⚠️ Attention |
| SEM-6 | Forms: use `<form>`, `<label>`, `<input>`, `<fieldset>` correctly | ❌ Critical |
| SEM-7 | `<section>` must have an associated heading (`aria-labelledby` or direct child heading) | ⚠️ Attention |
| SEM-8 | `<article>` for self-contained content (post, product card, etc.) | ⚠️ Attention |


### 🔍 Basic SEO (for full pages)

| # | Check | Default Severity |
|---|-------|-----------------|
| SEO-1 | `<title>` present and descriptive (ideally 50–60 characters) | ❌ Critical |
| SEO-2 | `<meta name="description">` present (120–160 characters) | ⚠️ Attention |
| SEO-3 | Open Graph: `og:title`, `og:description`, `og:image` | ⚠️ Attention |
| SEO-4 | `<link rel="canonical">` for pages with multiple URLs | ⚠️ Attention |
| SEO-5 | No more than one `<h1>` (duplicates HEAD-1, reinforce here) | ❌ Critical |

> **Note:** Check SEO only when the context is a full page, not isolated blocks/components.


### 🧹 Code Quality

| # | Check | Default Severity |
|---|-------|-----------------|
| CODE-1 | No inline style attributes (`style=""`) when classes are available | ⚠️ Attention |
| CODE-2 | Unique IDs on the page (no duplicate IDs) | ❌ Critical |
| CODE-3 | Tags correctly closed (no orphan tags) | ❌ Critical |
| CODE-4 | No forgotten debug comments in code | ⚠️ Attention |
| CODE-5 | Charset defined: `<meta charset="UTF-8">` | ❌ Critical |
| CODE-6 | Viewport meta tag present: `<meta name="viewport" content="width=device-width, initial-scale=1">` | ❌ Critical |

---

## 🚬 Visual Smoke Test (when URL is provided)

If the user provides a URL (public or local), run:

1. **Open the URL** using the available navigation/screenshot tool
2. **Capture screenshot** at desktop viewport (1280px) and mobile (375px)
3. **Visually audit:**

| # | Check | Default Severity |
|---|-------|-----------------|
| SMOKE-1 | Layout not broken at any breakpoint | ❌ Critical |
| SMOKE-2 | All images loading (no broken image icon) | ❌ Critical |
| SMOKE-3 | Text readable, no overflow or clipping | ⚠️ Attention |
| SMOKE-4 | Interactive elements visible and clickable (buttons, links, menus) | ❌ Critical |
| SMOKE-5 | No element overlapping (z-index, modals, overlays) | ⚠️ Attention |
| SMOKE-6 | Fonts loaded (no FOUT — Flash of Unstyled Text) | ⚠️ Attention |
| SMOKE-7 | Colors and contrast visually acceptable | ⚠️ Attention |
| SMOKE-8 | Console free of critical JS errors (if tool allows) | ⚠️ Attention |

Report in the **🚬 Visual Smoke Test** section of the report, with screenshot attached if available.

---

## Report Format

Always generate the report in this format:

```
## 🔍 QA Report — [component/page name]

### Summary
| Category      | ❌ Critical | ⚠️ Attention | ✅ OK |
|---------------|------------|--------------|------|
| Images        | X          | X            | X    |
| Headings      | X          | X            | X    |
| Semantics     | X          | X            | X    |
| A11y          | X          | X            | X    |
| SEO           | X          | X            | X    |
| Perf          | X          | X            | X    |
| Code          | X          | X            | X    |
| Smoke Test    | X          | X            | X    |

---

### Issues Found

#### ❌ Critical (block production)
- **[IMG-1]** Image `/photo.jpg` uses JPG format. Convert to `.webp`.
  ```html
  <!-- before -->
  <img src="/photo.jpg" />
  <!-- after -->
  <img src="/photo.webp" srcset="..." sizes="..." alt="..." />
  ```

#### ⚠️ Attention (fix before deploy)
- **[IMG-5]** `<img>` without explicit `width`/`height` — may cause CLS.

#### ✅ OK Points
- Heading hierarchy correct (h1 → h2 → h3)
- All `<button>` elements use correct semantic tag

---

### 🚬 Visual Smoke Test
[Include only if URL was provided]
- Desktop screenshot: [describe what was seen]
- Mobile screenshot: [describe what was seen]
- Visual issues found: ...

---

### Corrected Code
[Insert block with corrected HTML if there are critical or attention items]
```

---

## Behavior Rules

- **Always run all categories** even if the user mentions only one.
- **Adapt scope to context**: if it's a component/block, skip page-level checks (SEO, viewport, charset, skip-link).
- **Inline fix required** for every ❌ Critical item: show `before` and `after`.
- **Direct and technical tone**: the user is a developer. No unnecessary basic explanations.
- **JSX/TSX**: adapt checks for JSX (`className`, `htmlFor`, `onClick`, self-closing tags, etc.)
- **If HTML is empty or incomplete**, ask for the code before running the QA.
- **Don't invent problems**: if an item doesn't apply to the context (e.g. no images → skip IMG-*), mark as N/A in the summary.
- **Smoke test**: if the user provides a URL, run the visual smoke test without exception. If not provided, ask at the end: *"Would you like me to also run a visual smoke test? Please share the site URL."*