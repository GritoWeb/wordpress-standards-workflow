# GritoWeb — WordPress Standards & Workflow

Single **source of truth** so every dev starts WordPress projects the same way.
Stack: **Sage 11** theme (Vite, Acorn, Blade, Tailwind), **Lando** local env,
standard WordPress layout (theme in `wp-content/themes/`, no Bedrock).

This repo is **documentation + reference**, not automation. You bring the
project up by hand (it's interactive anyway — Pantheon token, DB, etc.) and
copy the standards in.

## What's here

```
README.md                          # this file — the workflow + how to use the repo
CLAUDE.md                          # the dev standard — copy to the project root
skills/
  html-qa-smoketest/SKILL.md       # QA skill — copy to <project>/.claude/skills/
EXAMPLES.md                        # one complete reference block (code) for AI context
gitignore.example                  # base .gitignore (WP + Sage 11 + Lando)
CHANGELOG.md                       # what changed in the standards
```

## How to use it on a new project

After WordPress is up (see workflow below), from the project root:

```bash
KIT=/path/to/this/repo

cp "$KIT/CLAUDE.md" ./CLAUDE.md
mkdir -p .claude/skills
cp -R "$KIT/skills/html-qa-smoketest" .claude/skills/
# if the project has no .gitignore yet:
cp "$KIT/gitignore.example" ./.gitignore
```

Then read [`EXAMPLES.md`](./EXAMPLES.md) — point the AI at it and at
`CLAUDE.md` for context before generating code.

---

## Project start workflow

Two scenarios. The "copy the standards in" part is identical; only how
WordPress comes up differs. Both start from a **brand-new, empty** site.

### Prerequisites (host machine)

Composer and Node run on the **host**; Lando only serves WordPress.

- Docker + [Lando](https://lando.dev/)
- PHP 8.2+ and Composer (Sage 11 scaffold)
- Node + npm (theme asset build)
- Git
- Scenario A only: a Pantheon account and a personal **machine token**
  (Pantheon → Account → Machine Tokens).

### Scenario A — Pantheon

1. Create the site on Pantheon (empty, raw WordPress).
2. Create the project folder locally and `cd` into it.
3. `lando init --source pantheon` — paste the machine token (hidden), pick the site.
4. `lando start` then `lando pull` (DB + uploads; `lando start` clones code only).
5. Scaffold Sage into the theme dir:
   ```bash
   cd wp-content/themes
   composer create-project roots/sage sage
   cd sage && composer install        # boots Acorn
   ```
6. Activate the theme: `lando wp theme activate sage`.
7. Copy the standards in (see "How to use it" above) — the Pantheon clone is
   already a git repo: review and commit through the normal flow,
   **never push without the project owner's permission**.
8. Build theme assets (see "Theme assets").

### Scenario B — Local only (no Pantheon)

1. Create the project folder and `cd` into it.
2. `lando init --recipe wordpress` (choose "current working directory").
3. Adjust `.lando.yml` (e.g. `php: "8.3"`), then `lando start`.
4. `lando wp core download`, configure `wp-config.php` (host `database`,
   credentials per recipe), open the install URL, set language + admin user.
5. Scaffold Sage (same as Scenario A, step 5).
6. Activate: `lando wp theme activate sage`.
7. Copy the standards in. Optionally `git init` + an initial commit
   (local only — never push without permission).
8. Build theme assets.

### Theme assets (both scenarios)

Sage 11 uses **Vite**. Composer/Node on the host, WordPress in Lando.

```bash
cd wp-content/themes/sage
npm install
npm run dev      # development (HMR)   — or:
npm run build    # production build
```

> **Lando + Vite gotcha:** the Vite dev server runs on the host while the site
> is served from the Lando container, so HMR can fail to connect until the dev
> server origin is reachable from the browser. If HMR misbehaves, use
> `npm run build` and reload, or align the Vite dev server URL with the Lando
> app URL in the theme's Vite config. Record the working setting per project.

---

## Maintaining the standards

`CLAUDE.md`, the skill and the examples are versioned here — this repo, not the
old gists, is the source of truth. To change a standard: open a PR, add a
`CHANGELOG.md` entry. Point the old gists at this repo (or archive them).

## Troubleshooting

- **`composer create-project` fails** — PHP must be 8.2+ on the host
  (`php -v`); Sage 11 requires it.
- **Theme not activating** — Lando must be running; run
  `lando wp theme activate sage` after `lando start`.
- **HMR not connecting** — see the Lando + Vite gotcha; `npm run build` is the
  reliable fallback.
- **Reset a Lando env** — `lando destroy -y && lando start` (local data lost;
  re-`lando pull` on Pantheon).
