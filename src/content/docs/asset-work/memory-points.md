---
title: Memory points
description: The named points the engine reads from a model's Memory LOD, which ones each asset type needs, and how to verify them.
sidebar:
  order: 6
---

A **memory point** is a named position the engine reads off your model: where a muzzle flash
spawns, where a headlight shines from, where the inventory camera looks, where a wheel sits.
They're how a model tells the engine "*this* exact spot means something." Get them wrong and
bullets leave the wrong place, lights float, or an item previews from a strange angle.

Memory points are really just one-vertex [selections](/asset-work/selections-and-naming/)
that live in a dedicated LOD — so read that page first if "named selection" isn't familiar.

## What they are and where they live

Every memory point lives in the model's **Memory LOD** — a special LOD with **points but no
faces**. Each point is a single vertex assigned to a named selection; the *name* is how the
engine asks for it, and the vertex *position* is the answer. At runtime, script reads a point
with `GetMemoryPointPos("name")`, but most points are read by the **engine itself** by
convention — you don't call anything, you just have to provide the point under the expected
name.

That's the crucial idea: for engine-read points, **the name is a fixed contract**. The engine
looks for `usti hlavne` on a weapon whether or not you do anything in script. Your job is to
put a correctly-named point in the right place.

:::note[Memory points vs proxies]
Both live in the model and both are placed geometry. A **memory point** is a single position
(one vertex). A [proxy](/asset-work/proxies/) is an oriented triangle that hosts a whole
sub-model. A muzzle is a point; an optic slot is a proxy.
:::

## Points every item needs

Carried items and simple props rely on a small set of helper points so the engine can place,
bound, and preview them. The common ones:

| Point | Purpose |
| --- | --- |
| `autocenter` (or the bounding helpers) | The pivot the engine centres the object on. |
| `boundingbox_min` / `boundingbox_max` | The corners of the object's bounding box (physics/placement bounds). |
| `invview` | The inventory-preview camera (position + target) — controls the angle an item shows at in the inventory. |
| `ce_center` / `ce_radius` | The Central Economy bounds the loot system uses for the object. |

Exact requirements vary by base class — the reliable move is to mirror what the **vanilla
class you inherit from** provides (see [verifying](#how-to-know-which-points-you-need-and-verify-them)).

## Weapon points

Weapons read the most memory points, because firing, ejection, and aiming are all anchored to
the model. The engine-expected names are vanilla DayZ's (some are historic Czech names — they
are the engine's contract, so you use them as-is):

| Point | Meaning |
| --- | --- |
| `usti hlavne` | **Muzzle end** — where the projectile leaves and the muzzle flash spawns. |
| `konec hlavne` | **Barrel start** — paired with `usti hlavne` to define the barrel axis/direction. |
| `nabojnicestart` / `nabojniceend` | The **shell-ejection** trajectory (where spent casings fly from and to). |
| `eye` | The **aiming eye** point — aligns iron sights / optics with the camera. |

Alongside the points, a weapon carries [selections](/asset-work/selections-and-naming/) for
its moving parts (bolt, trigger, hammer, magazine) and a muzzle-flash selection, plus
[proxy](/asset-work/proxies/) slots for optics/muzzle/light. The barrel axis defined by
`usti hlavne` → `konec hlavne` is also what attached muzzle devices and the aiming line use,
so a sloppy pair of points throws off more than the flash.

## Vehicle points

Vehicles anchor wheels, lights, exhaust, and seats to named points and selections. The exact
names follow the **vanilla car class you inherit from** (e.g. the `Car`/`CarScript` family),
and the cleanest approach is to match that car's Memory LOD rather than invent names. The
categories you'll be providing:

- **Wheels** — each wheel's axis/position (paired with wheel [selections](/asset-work/selections-and-naming/)
  and a [proxy](/asset-work/proxies/) so wheels are removable, damageable parts).
- **Lights** — headlight, brake, and reverse light source positions (left/right), so beams
  and glows emit from the right spot.
- **Exhaust** — where the exhaust particle effect emits.
- **Seats / get-in points** — driver and cargo reference positions.

Because these are tied to the base class's expectations, **open the vanilla car you're
extending and copy the point names and rough placements**, then move them to fit your model.
Guessing names here is the usual reason a custom car has no headlights or won't let a player
in.

## How to know which points you need (and verify them)

There's no universal list — what an asset needs is defined by **the base class it inherits**.
So the dependable workflow is:

1. **Find your base class.** A custom optic extends an optic base; a car extends a car base; an
   item extends an item base. (See [Configs](/asset-work/configs/) for choosing one.)
2. **Open the matching vanilla model's Memory LOD.** After
   [extracting the game data](/getting-started/workbench-setup/), open the vanilla asset's MLOD
   in Object Builder and read off the memory points it provides under its Memory LOD.
   Reproduce the *set of names* on your model; place each point to fit your geometry.
3. **Verify placement, not just presence.** In Object Builder you can see each point's
   position. For script-read points you can confirm at runtime by reading
   `GetMemoryPointPos("name")` and spawning a marker there. A point that exists but sits at the
   origin (0,0,0) is the tell-tale of a point you named but never moved.

:::tip[Wrong place ≠ missing]
"Muzzle flash comes out of the stock" or "the headlight is inside the engine block" is almost
always a **mis-placed** point, not a missing one — the name was found, the position is wrong.
Check the Memory LOD coordinates before assuming the point isn't there.
:::

:::caution[Learn from vanilla, don't lift it]
Reading a vanilla model's memory points to learn the naming contract is exactly right.
Copying another *mod's* assets, or de-binarizing an ODOL to read it, is not — see the
[EULA note](/asset-work/pipeline-and-formats/#mlod-vs-odol-the-one-distinction-to-get-right).
:::

## Related

- [Selections & naming](/asset-work/selections-and-naming/) — memory points are one-vertex selections.
- [P3D setup](/asset-work/p3d-setup/) — the Memory LOD among the others.
- [Proxies](/asset-work/proxies/) — oriented attach points, the proxy counterpart to a single point.
- [Configs](/asset-work/configs/) — choosing the base class that dictates which points you need.
