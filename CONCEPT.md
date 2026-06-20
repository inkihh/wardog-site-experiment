# Concept

> Internal product view of **dayzmodders.inkihh.de** — what it is, why it exists, and the
> design principles behind it. No code-level details (those live in IMPLEMENTATION.md).

## Summary

**dayzmodders.inkihh.de** is a community-maintained knowledge base for DayZ modding,
published as a statically generated documentation site. It exists to take the hard-won,
scattered, and often gatekept knowledge of the DayZ Modders community and move it into a
single place that is durable, searchable, and welcoming to newcomers.

The site is built with **Astro Starlight**, deployed to **GitHub Pages** at
dayzmodders.inkihh.de, with its source open on GitHub (`inkihh/wardog-site-experiment`).
Content is authored in Markdown and contributed through pull requests.

## The problem

The project grew out of a community discussion started by Wardog, who can no longer carry
the community's knowledge-sharing burden alone and asked others to step up. The recurring
pain points raised by members:

- **Knowledge is gatekept and scattered.** Critical modding know-how (P3D setup, RVMATs,
  memory points, EnScript gotchas, game structure) is obscure, undocumented, and spread
  across Discord messages, scattered GitHub repos, YouTube videos, and private mentorships.
- **Discord is a poor knowledge store.** Search is weak, threads and channel messages fall
  out of view quickly, and answers are effectively lost once they scroll away.
- **The environment is off-putting to newcomers.** Many members report cold, sarcastic, or
  dismissive responses — or no response at all — when asking questions. New modders give up,
  or burn hours failing with AI, or get pushed toward scammers because the knowledge is so
  obscure they're forced to reach out privately.
- **Few people write anything down.** Across years of the community, only a handful of
  people have documented their learnings. Without writing it down, a new platform just
  reproduces the old problem.

The goal is not to replace the Discord or hand-feed answers, but to give the community a
**golden standard of searchable reference material** — a place to point people, build on
with evidence, and lower the "I give up" threshold for anyone learning.

## Goals

- Provide a searchable, durable home for DayZ modding knowledge that outlives Discord scroll.
- Lower the barrier to contribution: if you can write Markdown, you can contribute.
- Cover the **esoteric, hard-to-find** side of modding — the things AI and existing wikis
  get wrong or don't cover at all.
- Be welcoming and well-structured so newcomers don't feel talked down to.
- Be reliable and fast for both humans and machine readers (LLM crawlers).
- Be maintainable over the full lifetime of the community, by humans who understand it.

## Non-goals

- **Not a Q&A forum / Stack Overflow.** Closer to GitHub docs or Unity Learn — a curated
  base of reference material and worked examples, not a question queue.
- **Not an auto-generated API dump.** A raw Doxygen-style reference of the unpacked source
  is explicitly out of scope; it doesn't deliver the value people actually want. Instead the
  site documents the subsystems and native functions people frequently use.
- **Not a vehicle for EULA-violating content.** De-binarization tools and workflows (e.g.
  DeODOL) are disallowed per the DayZ EULA and have no place in the docs.

## Audience

- **New and intermediate modders** looking for clear, trustworthy guidance they currently
  can't find — the primary readers.
- **Experienced modders** who want a canonical reference to cite and build on, and a place
  to contribute their knowledge once.
- **Machine readers (LLM crawlers).** The site is structured to be cleanly consumable by
  LLMs so the knowledge propagates, without the site itself depending on AI integrations.

## Content scope

The two largest topic areas are **scripting** and **asset work**, with significant overlap
between them — which makes cross-linking between related pages an important design concern.

Priority topics surfaced by the community:

- **Asset / modeling pipeline** — P3D setup (the most-requested priority), proxies,
  selections and their naming, memory points and which to use per asset type, RVMATs,
  texture maps (CO / NOHQ / SMDI, etc.), 3D scope and vehicle setup with worked examples.
- **Scripting** — EnScript gotchas, commonly used engine subsystems, select proto native
  functions, and general game structure.
- **Tooling & onboarding** — a clean Workbench setup guide is called out as a common early
  pitfall worth covering well.

Worked examples (sample `.blend`/`.p3d`/config files, "blocky" reference assets) are seen
as especially valuable, and the DayZ Modders GitHub organization can host sample mods and
raw source of community-built mods as companion learning material.

### Authoring resources — local DayZ knowledge skills

The maintainer keeps a set of **local DayZ knowledge skills** (installed under the
Windows Claude home at `~/.claude/skills/`, i.e. `/mnt/c/Users/<user>/.claude/skills/`
from WSL — *not* the WSL `~/.claude/skills/`, which only holds unrelated skills). These
are authoritative, version-current (DayZ 1.28+) references built from hands-on modding and
the Bohemia Community Wiki, and they are the **preferred grounding source** when writing or
reviewing pages — more reliable than open web search:

- **`dayz-dev-plugin`** — Enforce Script, class hierarchy, client/server split, memory
  management, mod structure, and engine systems (inventory, actions, networking, weapons,
  vehicles). Vanilla, Community Framework, and Expansion aware.
- **`dayz-items`** — the asset/item import pipeline: P3D (MLOD/ODOL), RVMAT, PAA, model.cfg,
  config.cpp, plus file-format references and MLOD rules.
- **`dayz-project`** — project structure and build process: the P: drive, symlinks, PBO
  packing/signing, client/server/both build types, profiles and RPT logs.
- **`dayz-ui`** / **`dayz-loadingscreen`** — client-side UI/HUD widgets and the loading
  screen. **`cftools-api`** — the CFTools Cloud server-admin API.

Treat these the same way as any other source: **learn the technique, ground the facts, write
our own prose** (per RESEARCH.md) — never copy class names, structure, or assets verbatim,
and let community PRs verify and correct. Capture what's used in `resources/research/`.

Some of these are themselves open source (e.g. `dayz-dev-plugin`, GPL-3.0, by DayZGhost).
External references the site grounds content in — open-source skills and primary sources
like the Bohemia Community Wiki — are credited publicly on the site's **Sources** page, and
that list grows as more are used.

## Contribution model

- **Source is open** on GitHub (`inkihh/wardog-site-experiment`).
- **Anyone can contribute** documentation by writing Markdown and opening a pull request.
- **Core contributors** who help maintain the site get direct repository access; everyone
  else contributes via PRs.
- **Writers are a first-class need.** Much of the community has deep knowledge but struggles
  to write it clearly; pairing knowledgeable people with strong writers is an explicit goal.
- **Voice sessions** are planned where people talk through what they know while someone else
  helps shape it into usable docs.
- Once a solid foundation exists, **Discord events** will be used to pull in more contributors.

## Design principles

- **Quality over volume.** People trust what feels well made and thoughtfully put together.
  The aim is genuinely useful material, not re-feeding people what an LLM could already tell
  them. A flood of low-value pages would just recreate the problem on a new platform.
- **A recognizable, deliberate identity.** The site deliberately avoids the easy, generic
  wiki route in favor of a themed, recognizable presentation — its own hero/landing page and
  considered layout — so it reads as something intentionally crafted.
- **Human-authored content, machine-readable output.** Documentation is written and curated
  by the community, with quality and accuracy owned by people who understand the material. The
  output is structured so LLMs can consume it cleanly — making the knowledge useful to AI
  readers is a welcome side effect, not the source of the content.
- **Maintainability over short-term convenience.** Tooling decisions are made for the lifetime
  of the project and for the ability to comprehend and review changes — not for whatever is
  fastest to stand up today.

## Technology rationale

> Concept-level rationale only. Concrete configuration and structure live in IMPLEMENTATION.md.

- **Static site generation** — pages are pre-rendered and served from the CDN as cached
  responses. This maximizes reliability, keeps the site resilient under load, and makes it
  robust for LLM crawlers.
- **Astro Starlight** — chosen as the documentation framework after evaluating alternatives
  (ProperDocs/mkdocs, VitePress, Zensical, GitBook). Starlight on Astro is powerful and
  flexible enough to theme strongly and to organize large amounts of content into grouped
  sidebar sections rather than one cluttered panel. The earlier ProperDocs plan was dropped
  in favor of it.
- **GitHub Pages** — the hosting target. The site builds from the repository and deploys via
  GitHub Actions on every push to `main`, served over GitHub's CDN with an automatically
  provisioned, auto-renewing TLS certificate on the custom domain. Keeping hosting, source, and
  CI in one place favors maintainability; an earlier Cloudflare Pages plan was dropped in favor
  of it.
- **Search** — the site ships with Starlight's built-in static search (Pagefind): self-contained,
  zero-cost, privacy-friendly, and with no external service to depend on. This is the default and
  stays in place. We only switch to a different search system if it's **really needed** — i.e. the
  built-in search demonstrably falls short (e.g. relevance, typo-tolerance, or the no-results
  analytics it can't provide) once there's enough content and traffic to justify it. A stronger
  hosted option such as Algolia is the likely candidate if that day comes, but no switch is made
  for its own sake.

## Behavior & rules

- **EULA compliance.** Content must respect the DayZ EULA. De-binarization tools and
  workflows are not permitted.
- **Respectful collaboration.** The project is a reaction to a hostile, gatekeeping culture;
  the docs and the contribution process are meant to model the opposite — "build a staircase,
  don't pull the ladder up."

## Related initiatives

These came up alongside the site and share the community/GitHub org, but are tracked
separately from this project:

- **Discord restructure** — moving the modding category toward forum channels for focused,
  longer-lived conversations, with a cleaner code of conduct and a centralized reporting
  system. Only the modding category is affected.
- **Mod project handler** — a separate, planned desktop application for managing a mod
  project end to end (create from template, project settings, packing, file patching,
  publishing). Not an IDE and not part of this site, but a parallel priority.

## Milestones

1. **Foundation** ✅ *(done)* — scaffolded and themed the Astro Starlight site, planned the
   full topical category structure, and stood up the GitHub Pages deploy so contributors have
   somewhere to write into.
2. **Writing** *(highest ongoing priority — now the focus)* — populate the priority categories (asset
   pipeline / P3D, scripting, onboarding) with genuinely useful, human-authored material.
   *Delivered so far:* the Getting Started onboarding pages (modding overview, Workbench setup) and
   the full Scripting section (EnScript basics, common gotchas, game structure, and the engine
   subsystems — inventory, actions, networking, persistence). *Still open:* the asset pipeline / P3D
   pages and the tooling deep-dives.
3. **Search** — keep the built-in static search (Pagefind) by default; only switch to a stronger
   system (e.g. Algolia) if it's *really needed* once there's enough content and traffic.
4. **Later / under consideration** — deeper LLM-consumption optimizations (e.g. an AST-aware
   tree-sitter approach for scripts), curated reference pages for select subsystems and native
   functions, and possibly translations (maintaining parity across pages is the open concern;
   Crowdin was discussed but cost at scale is undecided).
