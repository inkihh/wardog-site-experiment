# DayZ Modders

A community-maintained knowledge base for **DayZ modding** — scripting, asset work,
tooling, and onboarding. Built by modders, for modders, and published as a fast,
static documentation site.

🔗 **Live site:** https://dayzmodders.inkihh.de

> **Status: foundation in place, content well underway.** The site is scaffolded and
> themed, with the full discipline taxonomy in place. The **Getting Started** guides,
> every section's overview, the full **Scripting** section (EnScript basics, common
> gotchas, game structure, and the engine-subsystems pages — inventory, actions,
> networking, persistence), and the full **Asset Work** section (pipeline & formats, P3D
> setup, proxies, selections & naming, memory points, materials/RVMAT, textures, and
> configs) are written. The remaining discipline deep-dives — the **Tooling & Setup**
> how-tos — are mostly still stubs (flagged in the sidebar) waiting to be written, and
> that's where contributors come in.

## What this is

DayZ modding knowledge is scattered across Discord, half-finished repos, videos, and
private mentorships — and often gatekept. This site gathers it into one durable,
searchable place: a curated, cross-linked reference for the hard-to-find side of
modding the game. It's not a Q&A forum and not an auto-generated API dump — it's a
deliberately built knowledge base, closer to good project docs than a wiki.

Content is authored in Markdown and contributed through pull requests.

## Tech stack

- **[Astro](https://astro.build/)** + **[Starlight](https://starlight.astro.build/)** — static documentation framework.
- **Dark-only brand theme** — navy palette and blue accent drawn from the community logo (no light mode / theme switcher).
- **Self-hosted fonts** via `@fontsource` (Inter for body, Oswald for display).
- **Built-in search** — Starlight ships Pagefind search that works on every build.
  (A move to Algolia is planned once there's enough content; see below.)
- **[GitHub Pages](https://pages.github.com/)** — static hosting, built & deployed by GitHub Actions.

## Local development

Requires **Node `>=20.3.0`** (see [`.nvmrc`](./.nvmrc) — currently Node 22).

```sh
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:4321
npm run build    # production build into ./dist
npm run preview  # serve the production build locally
```

## Project structure

| Path | What |
| --- | --- |
| `src/content/docs/` | All documentation pages, grouped by discipline |
| `src/content/docs/index.mdx` | Landing / hero page |
| `astro.config.mjs` | Site config + the sidebar taxonomy |
| `src/styles/theme.css` | Site theme (palette, typography, hero, cards) |
| `src/assets/` | Brand artwork — `logo` (mark), `hero`, `app-icon` |
| `src/components/` | Starlight component overrides (dark-only: forced theme, no switcher) |
| `public/` | Static files served as-is (`favicon.svg`, `_headers`) |
| `CONTRIBUTING.md` | Contributor quick start |

The sidebar is organized **by discipline** and **autogenerates** from each directory
under `src/content/docs/`, so adding a Markdown file is enough to extend the nav:

- **Getting Started** · **Scripting** · **Asset Work** · **Tooling & Setup** · **Contributing**

## Contributing

If you can write Markdown, you can contribute — no repo access needed. See
**[CONTRIBUTING.md](./CONTRIBUTING.md)** for the quick start, or the
[Contributing section](https://dayzmodders.inkihh.de/contributing/overview/) on the site for
the full guidance.

**House rules:** quality over volume · respect the DayZ EULA (no de-binarization /
DeODOL) · original or vanilla assets only.

## Deployment (GitHub Pages)

The site is a static build published to **GitHub Pages** via GitHub Actions on every
push to `main` — see [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
(build with `withastro/action`, publish with `actions/deploy-pages`).

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` (from `.nvmrc`) |
| Production branch | `main` |
| Custom domain | `dayzmodders.inkihh.de` (set via [`public/CNAME`](./public/CNAME)) |

`astro.config.mjs` sets `site: 'https://dayzmodders.inkihh.de'`, which drives the
generated sitemap and canonical URLs — update it if the domain changes. HTTPS uses a
GitHub-provisioned, auto-renewed Let's Encrypt certificate.

## License

Documentation content is intended to be shared — **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**.
This is a community project and not affiliated with or endorsed by Bohemia Interactive.
