---
title: Asset Work overview
description: The DayZ modeling and asset pipeline — P3D, proxies, selections, memory points, materials, textures, and configs.
sidebar:
  order: 1
  label: Overview
---

Asset work is where a lot of the demand — and a lot of the pain — lives. Getting a
model into DayZ correctly means understanding the **P3D pipeline**: the model itself,
its LODs, selections and naming, memory points, materials, textures, and the configs
that tie it all to gameplay.

This is one of the two biggest topic areas on the site, and it overlaps heavily with
[scripting](/scripting/overview/) — a weapon or vehicle is part model, part config,
part script.

## What this section covers

The pages read foundational → applied — start with the pipeline and work down:

- **[Pipeline & formats](/asset-work/pipeline-and-formats/)** — the round trip from a
  modeling app to an in-game asset, the file formats involved, and the **MLOD vs ODOL**
  distinction. Read this first — it's the map for everything below.
- **[P3D setup](/asset-work/p3d-setup/)** — the model format and how a DayZ-ready P3D
  is structured, LOD by LOD. *(The most-requested topic.)*
- **[Proxies](/asset-work/proxies/)** — attaching sub-models (muzzles, optics, parts)
  the right way.
- **[Selections & naming](/asset-work/selections-and-naming/)** — named vertex/face
  groups and the naming contract that makes them work.
- **[Memory points](/asset-work/memory-points/)** — the named points the engine reads,
  and which ones each asset type needs.
- **[Materials (RVMAT)](/asset-work/materials-rvmat/)** — how surfaces are shaded.
- **[Textures](/asset-work/textures/)** — the map types (CO / NOHQ / SMDI, …) and how
  they're authored and packed.
- **[Configs](/asset-work/configs/)** — wiring assets into the game: items, optics,
  vehicles, and more.

## Worked examples, inline

Every deep-dive page carries a **worked example** — a static prop walked through end to
end in [P3D setup](/asset-work/p3d-setup/), a 3D optic and a vehicle in
[Configs](/asset-work/configs/), with weapon and vehicle specifics threaded through the
proxy, selection, and memory-point pages. They're textual config-and-structure
walkthroughs you can read and adapt, in the same spirit as the Scripting section's
running lantern example.

:::note[Original assets only]
Examples here use **original or vanilla** assets and class names. We never redistribute
models, RVMATs, or textures from other people's mods, and we don't reproduce another
project's class structure. Where an example names an engine-expected selection or memory
point (like a weapon's muzzle point), that's the engine's contract, not someone's asset.
:::

## Where the tools live

This section is about the **assets themselves** — what's inside a P3D, how an RVMAT is
wired, what the engine reads. Installing the toolchain, the `P:` drive, and packing a
PBO are covered separately:

- [Workbench setup](/getting-started/workbench-setup/) — install DayZ Tools and stand up
  the `P:` drive.
- [Tooling & Setup](/tooling-setup/overview/) — the build-and-ship workflow, including
  [packing](/tooling-setup/packing/).

## Where to start

If you're setting up your first model, read
[Pipeline & formats](/asset-work/pipeline-and-formats/) for the lay of the land, then
[P3D setup](/asset-work/p3d-setup/), then [selections & naming](/asset-work/selections-and-naming/)
and [memory points](/asset-work/memory-points/).
