---
title: Selections & naming
description: Named vertex and face groups, how they span LODs, and the naming contract that must match across model, config, and animations.
sidebar:
  order: 5
---

A **selection** is a named group of vertices and faces inside a LOD. Selections are how you
point at *part* of a model so something else — the config, an animation, the physics engine —
can act on it. "Hide this part," "swap this part's texture," "rotate this part," "this part is
the collision component," "this part is a damage zone" all start with a named selection.

Selections are also where a whole class of *"it works in Object Builder but not in game"* bugs
comes from, because the name is a **contract**: the same string has to appear, spelled and
cased identically, in several different files. This page is about both — what selections do
and how to keep their names in sync.

## What a selection is

In Object Builder you make a selection by selecting some geometry and naming it. The name and
the membership are stored in the LOD. A vertex or face can belong to **several** selections at
once (a door panel can be in the `door` animation selection *and* a `damage` zone). Selections
carry a per-vertex **weight** too (0–1), which matters for skinning — a vertex can be 70% one
bone, 30% another.

The key thing: a selection is **per-LOD**. The `door` selection in the Visual LOD and the
`door` selection in the Fire Geometry LOD are *different sets of geometry that happen to share
a name*. Which leads to the rule below.

## Selections span LODs by name

When a system needs a part to behave consistently, you create the **same-named selection in
every LOD that participates**. An animated door, for example, needs a `door` selection in:

- the **Visual LODs** (so the visible door swings),
- the **Fire Geometry LOD** (so bullets hit the door where it actually is),
- the **Geometry LOD** if it collides,

…all named `door`. The engine ties them together by name. Miss one LOD and you get the classic
symptom: the door *looks* open but still blocks bullets, or vice versa.

## The named selections you'll actually use

| Selection | Lives in | Purpose |
| --- | --- | --- |
| `component01`, `component02`, … | Geometry | Convex collision components (at least one required). See [P3D setup](/asset-work/p3d-setup/#geometry-mass-and-collision). |
| A hidden-selection name (e.g. `camo`) | Visual | A face group whose texture/material the config can **swap** at runtime via `hiddenSelections`. |
| Damage-zone names (e.g. `engine`, `wheel`) | Fire Geometry | Areas the config's damage system tracks and can ruin independently. |
| Animated-part names (e.g. `door`, `bolt`, `trigger`) | Visual (+ Geo/Fire) | Parts an animation in `model.cfg` moves. |
| Bone-named groups | Visual (worn/rigged models) | Skinning weights — each group named after a skeleton bone deforms with it. |
| `proxy:\…` | Visual | A [proxy](/asset-work/proxies/) attachment point (special-prefix selection). |

These names fall into two camps. Some are **engine-fixed contracts** — `component01` must be
spelled exactly that; a bone group must match the skeleton's bone name. Others are **names you
choose** — `camo`, `door`, `engine` are yours, but once chosen they must match wherever you
reference them.

## The naming contract: where a name has to match

A selection name you invent typically has to appear, **identical**, in up to three places:

```text
 model.p3d            model.cfg                 config.cpp
 ─────────            ─────────                 ──────────
 selection "camo" ──► sections[] = {"camo"} ──► hiddenSelections[] = {"camo"}

 selection "door" ──► class Door {              (AnimationSources, if user/script-driven)
                        selection = "door";
                        ...
                      }
```

- **Hidden (texture-swap) selections.** The face group named in the P3D must be listed in the
  model.cfg's `sections[]` **and** in the config's `hiddenSelections[]`. All three must match.
  The [Configs](/asset-work/configs/) page covers the config side; mis-matching here is the
  #1 cause of "my texture won't swap."
- **Animated selections.** The animation class in `model.cfg` names the `selection` it moves;
  that string must be the selection in the P3D. If the animation is driven by user/script
  state, a matching `AnimationSources` entry in config feeds it.
- **Damage zones.** The Fire-Geometry selection name is referenced by the config's damage
  system; the names must agree.

Get any of these out of sync and there's **no error** — the swap just doesn't happen, the part
just doesn't move. The engine looked for `Camo`, your P3D has `camo`, and it silently found
nothing.

## Case sensitivity will bite you

DayZ treats these names as **case-sensitive** in the places that matter — `camo`, `Camo`, and
`CAMO` are three different selections. A common failure is a tool (or a careless export option)
**lower-casing** selection names on the way out, which breaks any name that wasn't already
lower-case. If you use the Blender/Arma Toolbox path, this is the "don't force-lowercase on
export" rule; in Object Builder, just type the name the same way everywhere.

:::tip[Pick a casing convention and never deviate]
Decide up front — most people lower-case everything (`camo`, `door`, `engine`) — and keep the
P3D, `model.cfg`, and `config.cpp` byte-for-byte identical. A name mismatch costs more
debugging time than almost anything else in asset work, precisely because it fails silently.
:::

## Debugging "works in the editor, not in game"

When something works while you're staring at the model in Object Builder but not once it's in
DayZ, suspect the naming contract first:

1. **Spell-check the name across all three files.** P3D selection vs `sections[]` vs
   `hiddenSelections[]` (or vs the animation's `selection`). Look for casing and typos.
2. **Check it's in every LOD that needs it.** A selection present in Visual but missing in
   Fire Geometry produces "looks right, behaves wrong."
3. **Confirm the array indices line up.** `hiddenSelections[]`, `hiddenSelectionsTextures[]`,
   and `hiddenSelectionsMaterials[]` are **parallel arrays** — index 0 of each must describe
   the same selection. A shifted index swaps the wrong part.
4. **Verify it survived packing.** If a tool rewrote the name on export, what's in the PBO
   isn't what you typed.

## Related

- [P3D setup](/asset-work/p3d-setup/) — `component01` and where selections sit among LODs.
- [Proxies](/asset-work/proxies/) — the `proxy:`-prefixed selection.
- [Memory points](/asset-work/memory-points/) — named *points* (one-vertex selections) in the Memory LOD.
- [Configs](/asset-work/configs/) — the `hiddenSelections` / `sections` / damage-zone side.
- [Common gotchas](/scripting/common-gotchas/) — the scripting analog of "it fails silently."
