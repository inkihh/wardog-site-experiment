---
title: P3D setup
description: Structuring a DayZ-ready P3D model — what a LOD is, the LOD types the engine reads, what each asset type needs, and a static prop built end to end.
sidebar:
  order: 3
---

The P3D is the single most-asked-about, most-fail-quietly part of DayZ asset work. Get its
structure right and most of the rest follows; get a LOD wrong and your model is invisible,
falls through the floor, or can't be shot. This page is about what's *inside* a P3D and how
to assemble a correct one — it assumes you've read
[Pipeline & formats](/asset-work/pipeline-and-formats/) for where the P3D sits in the
bigger picture.

Instructions here center on **Object Builder** (part of DayZ Tools), the authoritative tool
for P3D work. The [Blender Arma Toolbox / Arma3ObjectBuilder](https://github.com/MrClock8163/Arma3ObjectBuilder)
addon is a popular alternative and the concepts map across — the LODs, selections, and
points are properties of the *format*, not the tool.

## What a P3D actually is

A `.p3d` is **one file containing many meshes**, not one mesh. Each mesh is a **LOD** — a
"level of detail" — and the engine reads each LOD for a different job. The visual mesh you
see in-game is one LOD. The invisible collision hull is another. The set of named points the
engine queries is another. They all live in the same file, stacked.

That's the mental shift: when someone says "the model," they usually mean the **Visual LOD**,
but the *file* is the whole stack. In Object Builder, the LOD list down the side is exactly
this stack, and you switch between LODs to edit each one.

:::note[MLOD here, ODOL at runtime]
Everything below describes the editable **MLOD** P3D you author. Packing binarizes it to
**ODOL** for the engine. You never hand-edit ODOL — see
[MLOD vs ODOL](/asset-work/pipeline-and-formats/#mlod-vs-odol-the-one-distinction-to-get-right).
:::

## The LOD types

A LOD has a **type**, which tells the engine what it's for. In Object Builder you pick the
type from a list; internally each type is a fixed "resolution" number (visual LODs use small
increasing numbers; special LODs use fixed large values like Geometry and Memory). You rarely
need the raw numbers — work by type name.

The ones you'll meet, grouped by job:

| LOD type | Job |
| --- | --- |
| **Resolution / Visual** (LOD 0, 1, 2…) | The mesh you see. Multiple, decreasing detail; the engine swaps to a lower one at distance. LOD 0 is full detail. |
| **Geometry** | The **physics/collision** hull — what the object bumps into and how it's pushed. Must be **convex** (or split into convex components), carries the object's **mass**. |
| **Fire Geometry** | What **bullets and melee** hit. Often a copy of Geometry. Damage zones come from its [selections](/asset-work/selections-and-naming/). |
| **View Geometry** | What **AI line-of-sight** and the camera test against. Simplified. |
| **Memory** | Named **points** the engine reads — no faces. Muzzle, lights, attach points, bounding helpers. See [Memory points](/asset-work/memory-points/). |
| **Shadow Volume** | The mesh that **casts shadows**. Simplified, closed. |
| **Roadway** | The surfaces players can **walk/stand on** (a vehicle roof, a building floor). |
| **View Pilot / View Cargo / View Gunner** | First-person **interior** meshes for a vehicle's seats. |
| **Land Contact** | The points that **touch the ground** (e.g. a vehicle's wheel-bottoms), so it rests correctly. |
| **Paths** | AI **pathfinding** graph through a building's interior. |

You don't need all of them for every asset — see [what each asset type needs](#what-each-asset-type-needs).

## Resolution / Visual LODs

The Visual LODs are the model people picture. You author at least **LOD 0** (full detail),
and add lower-detail copies the engine shows at distance to save performance. A small static
prop might have two; a building has several.

Rough rule: each lower LOD has roughly **half the triangles** of the one above. The decimation
doesn't have to be pretty up close — by the time the engine shows LOD 3, it's far away.

Every face in a Visual LOD carries a **texture path** and a **material (RVMAT) path**. That's
the link out to the look of the surface — covered in [Materials (RVMAT)](/asset-work/materials-rvmat/).

## Geometry, mass, and collision

The **Geometry LOD** is where a surprising amount of "my object behaves wrong" lives. Key
rules:

- **It must be convex.** A single concave hull silently breaks collision. If your shape is
  concave (an L, a ring, anything with a dent), split it into **convex components**, each in
  its own [named selection](/asset-work/selections-and-naming/) called `component01`,
  `component02`, … The engine treats each component as one convex piece.
- **It carries mass.** The Geometry LOD holds the object's mass distribution (per-vertex, set
  in Object Builder via *Mass* tools, or as a total spread across vertices). Mass drives how
  the object falls, gets shoved, and reacts to physics. Too light and it skitters; too heavy
  and it's immovable.
- **Keep it simple.** A dozen to a few hundred faces, not thousands. Collision is computed
  against this mesh constantly; a high-poly Geometry LOD is a performance trap and often
  *less* stable than a blocky one.

The **Fire Geometry LOD** is what projectiles test against — make it match the silhouette you
want shootable. For a simple prop, copy the Geometry LOD. For anything with **damage zones**
(a vehicle's engine, wheels, a body part), the zones are [named selections](/asset-work/selections-and-naming/)
in Fire Geometry, referenced from the config's damage system.

:::tip[Geometry needs its properties set]
On the Geometry LOD, set the named properties Object Builder exposes — commonly
`autocenter = 0` (so the engine doesn't re-pivot the object on its bounding box) and, if you
have no Shadow LOD, `lodnoshadow = 1`. Missing these is a frequent cause of objects that
"jump" when spawned or throw shadow warnings.
:::

## What each asset type needs

The minimum useful LOD set depends on what the asset *is*:

| Asset type | Needs at least |
| --- | --- |
| **Static prop / item** | Visual 0, Geometry, Memory. (Add a Shadow Volume and a lower Visual LOD for polish.) |
| **Item (carried)** | As above — the Memory LOD also carries the inventory-view and bounding helper points. |
| **Weapon** | Visuals, Geometry, Fire Geometry, **Memory** (muzzle/eye points), plus selections for moving parts. See [memory points](/asset-work/memory-points/). |
| **Vehicle** | Visuals, Geometry, Fire Geometry, View Geometry, **Roadway**, **Land Contact**, Memory (wheels/lights), and the View Pilot/Cargo interior LODs. |
| **Building** | Visuals, Geometry, Fire Geometry, View Geometry, Roadway, **Paths**, Memory. |

The pattern: the more the player *interacts* with an asset (walk on it, shoot it, sit in it,
path through it), the more special LODs it needs.

## A static prop, end to end

Here's the smallest *correct* asset: a blocky **wooden crate** that stands in the world,
collides, casts a shadow, and can be shot — no animation, no script. Call the model
`woodcrate.p3d`. In Object Builder you'd build these LODs:

```text
woodcrate.p3d
├─ Resolution LOD 0   visual mesh, faces textured + RVMAT assigned
├─ Resolution LOD 1   ~half the faces (shown at distance)   [optional, recommended]
├─ Geometry           one convex box hull
│                       • selection  component01  (all faces)
│                       • mass distributed across vertices  (e.g. ~30 kg)
│                       • property   autocenter = 0
├─ Fire Geometry      copy of Geometry (so bullets hit it)
├─ Shadow Volume      simplified closed box
└─ Memory             helper points (bounding box / centre)
```

Step by step:

1. **Model LOD 0.** Build the crate, UV-unwrap it, and assign each face a texture and an
   `.rvmat` ([Materials](/asset-work/materials-rvmat/)). This is the only mesh the player
   normally sees.
2. **Add a lower Visual LOD.** Duplicate LOD 0, decimate to ~50%, keep it as LOD 1. Optional
   but cheap insurance for performance.
3. **Geometry.** Make a convex box that encloses the crate. Select all its faces into a
   selection named `component01`. Set its mass. Set `autocenter = 0`.
4. **Fire Geometry.** Copy the Geometry LOD so the crate is shootable. (For a destructible
   crate you'd add damage-zone selections here and wire them in config — out of scope for
   the minimal version.)
5. **Shadow Volume.** A simplified, closed version of the box so it casts a clean shadow.
6. **Memory.** Add the bounding/centre helper points the engine expects for placement. The
   [Memory points](/asset-work/memory-points/) page lists which an item-type asset needs.

Then the config registers it. A non-interactive prop typically inherits a static base class
(the `House`/`HouseNoDestruct` family), and the wiring is minimal:

```cpp
class CfgPatches
{
    class MyProps
    {
        units[] = { "WoodCrate" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data" };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;            // vanilla static base — forward-declared

    class WoodCrate : HouseNoDestruct
    {
        scope = 2;                    // 2 = public / spawnable
        model = "\MyProps\data\woodcrate.p3d";
    };
};
```

That's a complete, correct static asset: a P3D with the right LODs and a few lines of config.
Everything else in this section is what you add on top — [proxies](/asset-work/proxies/) to
attach sub-models, [selections](/asset-work/selections-and-naming/) for moving or damageable
parts, richer [materials](/asset-work/materials-rvmat/), and the
[config](/asset-work/configs/) wiring that turns a prop into a weapon, optic, or vehicle.

:::note[Learn from vanilla]
After [extracting the game data](/getting-started/workbench-setup/), open a vanilla prop's
MLOD source in Object Builder and read how its LODs are built. Copy the *technique*, never
the file — and never de-binarize an ODOL to get one.
:::

## Common ways a P3D goes wrong

- **Invisible model** — no Visual LOD 0, or its faces have no texture/material assigned.
- **Falls through the world / can't be bumped** — no Geometry LOD, or it isn't convex / has no
  `component01` selection.
- **Can't be shot** — no Fire Geometry LOD.
- **Jumps or re-centres on spawn** — missing `autocenter = 0` on Geometry.
- **No shadow, or a shadow warning in the logs** — no Shadow Volume and no `lodnoshadow = 1`.
- **Config can't find the model** — the `model =` path doesn't match the packed P3D path, or
  the [CfgModels class name doesn't match the P3D filename](/asset-work/configs/).

## Related

- [Pipeline & formats](/asset-work/pipeline-and-formats/) — where the P3D sits in the asset pipeline.
- [Selections & naming](/asset-work/selections-and-naming/) — `component01`, damage zones, and the naming contract.
- [Memory points](/asset-work/memory-points/) — what goes in the Memory LOD, per asset type.
- [Proxies](/asset-work/proxies/) — attaching sub-models into a P3D.
- [Materials (RVMAT)](/asset-work/materials-rvmat/) — assigning the look to Visual-LOD faces.
- [Configs](/asset-work/configs/) — registering the model and wiring gameplay.
