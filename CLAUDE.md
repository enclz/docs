# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`enclz/docs` is the public documentation site for **Enclz** — on-chain spend policy for AI agents on Solana. Built with **Docusaurus 3 (TypeScript, classic preset)**. Deploys to `https://docs.enclz.com`.

The Anchor program lives in [`enclz/solana`](https://github.com/enclz/solana). The orchestrator app lives in [`enclz/webapp`](https://github.com/enclz/webapp). The original markdown spec lives in [`enclz/.github`](https://github.com/enclz/.github) and is being ported here over time.

## Commands

```
npm start            # local dev server on http://localhost:3000
npm run build        # production build → build/
npm run serve        # serve the built bundle
npm run typecheck    # tsc --noEmit
npm run clear        # nuke .docusaurus/ cache (run if dev server gets weird)
npm run deploy       # GitHub Pages deploy (only if/when DEPLOY_TOKEN is set)
```

## Layout

```
docs/                    # markdown / mdx — auto-sidebar via folder structure
blog/                    # blog posts (RSS/Atom feeds enabled)
src/
  pages/                 # custom pages (homepage = pages/index.tsx)
  components/            # reusable React components
  css/custom.css         # global theme overrides — see "Theme" below
static/                  # files served verbatim (logos, favicon, og-image)
docusaurus.config.ts     # site metadata, navbar, footer, plugins
sidebars.ts              # sidebar config (defaults to auto-generated)
```

## Theme

Brand palette and typography are pulled from the webapp ([`enclz/webapp`](https://github.com/enclz/webapp), see `tailwind.config.js`). The mapping lives in `src/css/custom.css`:

- **Surfaces**: `#07080c` (bg), `#0f1117` (surface), `#131520` (card), `#1e2235` (border)
- **Accent**: `#7c3aed` (primary), `#a78bfa` (lighter)
- **Text**: `#f1f5f9` (primary), `#94a3b8` (secondary), `#4b5563` (muted)
- **Fonts**: Inter (sans), JetBrains Mono (mono) — both via Google Fonts CDN

**Dark mode is the default** and color scheme is *not* coupled to system preference (`respectPrefersColorScheme: false`). Light mode is kept as a fallback but the canonical surface is dark — this matches the webapp.

When updating brand tokens, change them in **one place** (`src/css/custom.css`) and let Infima's CSS variables flow. Don't sprinkle hard-coded hex values across components.

## Writing docs

- Use `.mdx` for any page that benefits from React components; `.md` is fine for plain prose.
- Match the writing style guide in the agent workspace — short sentences, no em-dashes, builder voice. (The agent workspace `CLAUDE.local.md` references `/workspace/agent/research/writing-style.md`.)
- Add `description:` frontmatter to every doc — it's used for SEO meta and sidebar previews.
- Code examples: prefer `bash`, `typescript`, `rust`, `json`, or `toml` languages. Prism is configured to highlight all of these.

## Conventions

- **No emoji in body copy** unless they're load-bearing (e.g. ✓ / ✗ in CLI demos). Headings stay plain.
- **External links open in same tab by default** (Docusaurus handles `target="_blank"` only when explicitly set). Don't override.
- **Don't add icons to navbar/footer items** — keep it text-only to match the webapp's minimal aesthetic.
- **Edit URL** auto-generated via `editUrl` config; don't hard-code "edit on GitHub" links per page.

## Deploy

Production target is `https://docs.enclz.com`. Hosting plan is TBD — likely Vercel or GitHub Pages. The `deploy` script assumes GitHub Pages; revisit when the host is decided.

CI / preview deploys not yet configured.

## Don't

- Don't import from the webapp directly — this site stands alone. Brand tokens are duplicated by design (so the docs site can ship without the webapp building successfully).
- Don't commit `node_modules/`, `build/`, or `.docusaurus/` — the `.gitignore` from `create-docusaurus` already handles this.
- Don't add the Docusaurus default branding (mountain/tree/react SVGs) back into pages once they've been replaced. They're in `static/img/` for now and will be removed once the homepage stabilizes.
