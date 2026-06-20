# Implementation — Overview (architecture & build)

High-level technical map of the site. See [content.md](content.md), [theming.md](theming.md),
and [deploy.md](deploy.md) for the deeper per-area detail.

## Stack

- **[Astro](https://astro.build/) 6** + **[Starlight](https://starlight.astro.build/) 0.40** —
  static documentation framework. All pages are pre-rendered to static HTML.
- **Package manager:** npm. **Node:** `>=20.3.0` (`package.json` engines); `.nvmrc` pins `22`.
- **Search:** Pagefind (bundled with Starlight) — a static index built at `astro build`.
- **Sitemap:** generated automatically by Starlight from `site` (`sitemap-index.xml`).

### Dependencies (`package.json`, name `dayzmodders`)

| Package | Range | Role |
| --- | --- | --- |
| `astro` | `^6.4.5` | Framework |
| `@astrojs/starlight` | `^0.40.0` | Docs theme/integration |
| `@fontsource-variable/inter` | `^5.2.8` | Body font (self-hosted) |
| `@fontsource-variable/oswald` | `^5.2.8` | Display font (self-hosted) |
| `sharp` | `^0.34.5` | Image optimization at build |

### Scripts

`dev`/`start` → `astro dev` (localhost:4321) · `build` → `astro build` (→ `dist/`) ·
`preview` → `astro preview` · `astro` → CLI passthrough.

## Repo layout

```
astro.config.mjs            Site + Starlight config (see below)
tsconfig.json               extends astro/tsconfigs/strict
src/
  content.config.ts         docs collection: docsLoader() + docsSchema()
  content/docs/             All pages (see content.md)
  styles/theme.css          Dark-only theme (see theming.md)
  assets/                   logo-split.svg (active), hero.svg, app-icon.svg (build-processed)
  components/               ThemeProvider, ThemeSelect (dark-only), Banner, Footer (see theming.md)
public/                     favicon.svg, CNAME, _headers (served as-is)
.github/workflows/deploy.yml  GitHub Pages CI (see deploy.md)
.github/PULL_REQUEST_TEMPLATE.md
README.md  CONTRIBUTING.md   Contributor onboarding
```

## `astro.config.mjs` breakdown

- `site: 'https://dayzmodders.inkihh.de'` — canonical URL; drives sitemap, canonical links, OG.
  No `base` (served at the domain root). `REPO = 'https://github.com/inkihh/wardog-site-experiment'`.
- `integrations: [starlight({ ... })]`:
  - `title: 'DayZ Modders'`, `description`, `logo: { src: './src/assets/logo-split.svg', alt }`.
  - `social: [{ github → REPO }, { discord → https://discord.gg/MTsg9Rhc3q }]`.
  - `editLink.baseUrl: ` `${REPO}/edit/main/` — per-page "Edit" links.
  - `lastUpdated: true` — uses git history for the per-page timestamp.
  - `components` — `ThemeProvider`, `ThemeSelect` (dark-only), `Banner` (draft strip), `Footer`
    (legal/contact + Sources row); see [theming.md](theming.md).
  - `head` — a single inline `<script>` (`OPEN_EXTERNAL_IN_NEW_TAB`); see below.
  - `customCss` — `@fontsource-variable/inter`, `@fontsource-variable/oswald`, then `./src/styles/theme.css`.
  - `sidebar` — five discipline groups. Four autogenerate (`items: [{ autogenerate: { directory } }]`);
    **Scripting is hand-tuned** — explicit slug entries plus a nested "Engine subsystems" group
    wrapping an autogenerate of `scripting/engine-subsystems/`. See [content.md](content.md).

## Behavior: open external links in a new tab

`OPEN_EXTERNAL_IN_NEW_TAB` is an inline head script injected on every page. On `DOMContentLoaded`
(and on `astro:page-load`) it walks every `<a href>`, resolves each against the current location,
and for any `http(s)` link whose host **differs from the current host** sets `target="_blank"` and
adds `rel="noopener noreferrer"`. Same-origin links and non-`http(s)` schemes are left untouched.
This covers the header social icons, hero buttons, per-page Edit links, footer links, and inline
content links in one place — chosen over per-component overrides.

## History

- **Foundation (Milestone 1):** Astro+Starlight scaffold, discipline taxonomy, 27 starter pages,
  dark-only brand theme, contributor onboarding, deploy config.
- **Hosting pivot:** originally planned for Cloudflare Pages + `dayzmodders.net`; moved to
  **GitHub Pages** + custom domain **`dayzmodders.inkihh.de`** in repo `inkihh/wardog-site-experiment`.
- **Branding & UX:** adopted the **split-circle logo** for header + hero (earlier three-shard
  `logo.svg` removed); added an always-on **draft banner**, a footer **legal/contact + Sources**
  row, and a head script that opens **all external links** in a new tab.
- **Writing (Milestone 2, in progress):** wrote the Getting-Started onboarding pages
  (`modding-overview`, `workbench-setup`); added a `sources` page crediting external references;
  research notes captured under `resources/research/` (indexed from `RESEARCH.md`). Then wrote the
  full **Scripting** section — `enscript-basics`, `common-gotchas`, `game-structure`, and the new
  nested `engine-subsystems/` group (`overview`, `inventory`, `actions`, `networking`,
  `persistence`), replacing the old flat `engine-subsystems.md` stub and hand-tuning the Scripting
  sidebar group for the nested label.
