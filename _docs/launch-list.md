# Launch Checklist

Pre-launch verification for WordPress sites built on the GritoWeb standards.
Run through this before any production go-live. Copy this file into each new
project's `_docs/` folder and tick items as you go.

**Severity legend:**

- 🚫 **Blocker** — must be fixed before launch
- ⚠️ **Important** — fix as soon as possible after launch
- 💡 **Nice to have** — improves quality, not strictly required

---

## 🧹 Content cleanup

- [ ] 🚫 Delete all draft pages and posts
- [ ] 🚫 Delete the "Hello World" sample post
- [ ] 🚫 Delete the default "Sample Page"
- [ ] 🚫 Delete the "Mr WordPress" sample comment
- [ ] 🚫 Empty the WordPress trash (posts, pages, comments, media)
- [ ] 🚫 Replace every `Lorem ipsum` / placeholder text with real content
- [ ] 🚫 Replace every placeholder / dummy image with the real asset
- [ ] ⚠️ Rename or delete the default `Uncategorized` category
- [ ] ⚠️ Delete unused themes (twentytwentythree, twentytwentyfour, etc.) — attack surface
- [ ] ⚠️ Delete unused plugins — attack surface

## ⚙️ WordPress core settings

- [ ] 🚫 `Settings → General → Timezone` set to the correct region (UTC by default — almost never what you want)
- [ ] 🚫 `Settings → General → Site Title` and `Tagline` reflect the real brand (not "Just another WordPress site")
- [ ] 🚫 `Settings → Reading → Front page` configured (static page or latest posts — whichever the project needs)
- [ ] 🚫 `Settings → Permalinks` is **not** set to "Plain" (`?p=123`) — use `/post-name/` or similar
- [ ] ⚠️ `Settings → General → Date Format` / `Time Format` match the project's locale
- [ ] ⚠️ `Settings → Discussion` — comments globally enabled or disabled per the project's intent
- [ ] ⚠️ `Settings → General → New User Default Role` is appropriate (typically `Subscriber`; don't ship as `Administrator`)

## 🔒 Security

- [ ] 🚫 WordPress core, all plugins, and the active theme on the latest stable version
- [ ] 🚫 SSL certificate active; HTTP-to-HTTPS redirect enforced
- [ ] ⚠️ 2FA enabled on the admin user (at minimum)
- [ ] ⚠️ `define('DISALLOW_FILE_EDIT', true);` in `wp-config.php` (blocks in-admin PHP editing)
- [ ] ⚠️ XML-RPC disabled if not used (common brute-force vector)
- [ ] 💡 HSTS header set at the server level

## 📈 SEO & indexing

- [ ] 🚫 `Settings → Reading → Search Engine Visibility` is **unchecked** (the "Discourage search engines" option)
- [ ] 🚫 301 redirects in place from old URLs (migration projects only)
- [ ] ⚠️ `robots.txt` reviewed — not blocking the site or important paths
- [ ] ⚠️ XML sitemap generated (Yoast / RankMath / core sitemap)
- [ ] ⚠️ Google Search Console verified and the sitemap submitted
- [ ] ⚠️ Open Graph tags (`og:title`, `og:description`, `og:image`) on the homepage at minimum
- [ ] ⚠️ Meta description filled on key pages (home, main service / product pages)

## ⚡ Performance

- [ ] ⚠️ Caching active — plugin (WP Rocket / W3 Total Cache) or server-level (Pantheon Edge / Cloudflare / etc.)
- [ ] ⚠️ Lighthouse mobile score ≥ 80 on the homepage
- [ ] ⚠️ Core Web Vitals within thresholds: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] 💡 CDN configured for static assets (if not handled by the host)

## 📊 Analytics & legal pages

- [ ] ⚠️ GA4 / Tag Manager installed and **actually measuring** (verify in `Realtime` view)
- [ ] ⚠️ Privacy Policy page exists and is linked from the footer
- [ ] ⚠️ Terms of Use page exists and is linked from the footer
- [ ] 💡 Cookie consent banner with consent management (LGPD — Brazil)

## 📧 Email & forms (configuration)

- [ ] 🚫 SMTP plugin configured (WP Mail SMTP / Fluent SMTP) — without it, transactional emails land in spam or fail silently
- [ ] ⚠️ "From" email address is a real domain address (not `wordpress@<domain>`)
- [ ] ⚠️ Every public-facing form has a honeypot or CAPTCHA (anti-spam)

## 📄 Required pages & layouts

- [ ] 🚫 `favicon.ico` in the project root (visible on every browser tab)
- [ ] 🚫 404 page renders inside the theme layout (not the default WordPress 404)
- [ ] ⚠️ WordPress password-protected page has a themed layout (not the bare default form)
- [ ] ⚠️ Search results page exists with an explicit "no results" state
- [ ] ⚠️ Every custom taxonomy either has an `archive` template **or** is consciously disabled (set `'has_archive' => false` in the registration)
- [ ] 💡 Apple touch icon (`apple-touch-icon.png`) present in the root
- [ ] 💡 `wp-login.php` logo replaced with the client's (or agency's) logo via `login_enqueue_scripts` + `login_headerurl` / `login_headertext` filters

## ♿ Validation

- [ ] ⚠️ Run an accessibility audit (axe DevTools / Lighthouse a11y / WAVE) — catches missing `alt` attributes, low contrast, broken tab order
- [ ] ⚠️ Run an HTML validator (W3C validator) — catches unclosed tags, duplicate attributes, malformed markup

## 🚀 Sage / Pantheon pre-deploy

- [ ] 🚫 `composer install --no-dev` ran for production (no dev dependencies shipped)
- [ ] 🚫 Built assets present in the deploy artifact (Vite manifest + hashed files)
- [ ] 🚫 `WP_DEBUG`, `WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY` set to `false` in the production environment
- [ ] 🚫 Database and uploads backed up immediately before go-live

## 🔥 Last-mile (manual smoke)

- [ ] 🚫 "Powered by WordPress" footer line removed or replaced
- [ ] 🚫 Phone, address and email shown in the footer / Contact page are correct
- [ ] 🚫 Submit every form on the site (contact, newsletter, application, etc.) — confirm the email actually arrives in the right inbox
- [ ] ⚠️ Site search returns sensible results — search any term and confirm the theme renders the results page properly
- [ ] ⚠️ Run a site-wide broken-link scan (Screaming Frog free / Dr. Link Check / Broken Link Checker plugin) — catches orphan links no static analysis will find
- [ ] 🚫 E-commerce: walk through checkout end-to-end with a real (or sandbox) payment (if applicable)
- [ ] ⚠️ Cross-browser + device test — Chrome / Firefox / Safari / Edge on desktop, iOS Safari + Chrome Android on mobile. "Responsive design" doesn't substitute — browsers break real things
