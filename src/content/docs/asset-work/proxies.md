---
title: Proxies
description: Attaching sub-models — optics, muzzles, vehicle parts — with proxies, how the engine resolves a proxy to a model, and the pitfalls.
sidebar:
  order: 4
---

A **proxy** is a placeholder inside one model that says "render *another* model right here."
It's how a rifle shows whatever optic is attached, how a vest shows its pouches, how a car
shows its wheels. Instead of baking every variant into one giant model, you leave a marked
spot and let the engine drop the right sub-model into it at runtime.

This builds on [P3D setup](/asset-work/p3d-setup/) and
[selections & naming](/asset-work/selections-and-naming/) — a proxy is a special kind of
named selection, so read those first if the terms are new.

## Proxy vs baked-in geometry

Use a proxy when the attached part is **interchangeable or optional**:

- A weapon's optic, muzzle device, or light — the player swaps them.
- A vest's pouches, a backpack's add-ons — different loadouts.
- A vehicle's wheels and removable parts — they come off, get damaged, get replaced.

**Bake the geometry in** when the part is permanent and never swapped — there's no reason to
pay the proxy's indirection for a fixed handle or a welded bracket. The test is simple: *can
the player remove or change this part?* If yes, proxy; if no, bake it.

## What a proxy is, physically

In the P3D, a proxy is a **single triangle** in a Visual LOD, assigned to a [named selection](/asset-work/selections-and-naming/)
whose name starts with `proxy:`. The triangle isn't drawn — its three vertices define a
**coordinate frame** where the attached model is placed:

```text
vertex 0  →  origin   (where the sub-model's pivot lands)
vertex 1  →  one axis  (orientation)
vertex 2  →  another axis (orientation)
```

So the proxy carries both a **position** and a **rotation**. Object Builder creates proxies
for you (Create Proxy), so you place and orient them visually rather than entering
coordinates — but knowing it's "an oriented triangle" explains why a mis-placed proxy points
an attachment the wrong way instead of just offsetting it.

The proxy triangle should reference **no texture and no material** — it's a marker, not
geometry.

## How the engine resolves a proxy

The selection name *is* the link to the model. Its form:

```text
proxy:\path\to\submodel.NNN
```

- `proxy:` — the literal prefix that marks the selection as a proxy.
- `\path\to\submodel` — the path to the sub-model's P3D, relative to the `P:` drive (no
  `.p3d` extension here).
- `.NNN` — a three-digit index (`.001`, `.002`, …). Multiple instances of the same sub-model
  get incrementing indices, so a vest with four grenade slots has `.001` through `.004`.

At load, the engine reads that path, finds the sub-model's P3D, and renders it in the proxy's
frame. For **swappable** attachments (an optic that changes), the proxy slot is wired through
config rather than hard-pointing at one model — the config's attachment slot decides which
model fills the proxy. For **fixed** decorative sub-models, the path can point straight at the
one model.

:::note[Two ways an attachment reaches a proxy]
A *fixed* proxy names the exact sub-model in its selection. A *swappable* attachment slot
(weapon optics, vest pouches) leaves the proxy as a slot the config fills — the
[Configs](/asset-work/configs/) page shows the attachment-slot side, and the
[3D optic worked example](/asset-work/configs/) puts a scope on a rifle through one.
:::

## Common uses

- **Weapons.** An optics rail, a muzzle slot, and an underbarrel/light slot are proxies on
  the weapon model. Each accepts a category of attachment defined in config. The attachment's
  own model then lines up using *its* [memory points](/asset-work/memory-points/).
- **Vehicles.** Wheels are proxies, which is what lets a wheel be removed, damaged, and
  re-fitted as a separate item. Other removable parts (doors, hoods on some setups) follow the
  same idea.
- **Clothing.** Vests and backpacks proxy their pouches and add-on containers.

## Pitfalls

Proxies fail quietly, and almost always for one of these reasons:

- **Broken path.** The `proxy:\…` path doesn't match where the sub-model's P3D actually packs
  to. Result: nothing renders at the slot, no error you'll notice. Check the path against the
  packed location, not your source-folder spelling.
- **Wrong or missing index.** Two proxies sharing `.001`, or a config expecting `.002` that
  isn't there. Instances must be uniquely indexed.
- **Proxy in the wrong LOD.** A proxy only does its job in the LODs that need to show the
  attachment (typically the Visual LODs). Forgetting to add it to a lower Visual LOD makes the
  attachment vanish at distance.
- **Mis-oriented triangle.** The attachment appears but points sideways or sits rotated —
  the proxy triangle's vertices define orientation, so a flipped triangle flips the part.
- **Attachment's own points missing.** The proxy places the sub-model; the sub-model still
  needs its *own* correct [memory points](/asset-work/memory-points/) and origin to line up.
  A scope that sits 2 cm too high is usually the scope's eye/origin, not the rifle's proxy.

:::tip[Sanity-check against vanilla]
When an attachment lands in the wrong place, open a vanilla weapon or vest's MLOD in Object
Builder and compare how its proxy triangles are placed and named. Learn the placement
convention; never copy the file.
:::

## Related

- [Selections & naming](/asset-work/selections-and-naming/) — a proxy is a `proxy:`-prefixed selection.
- [P3D setup](/asset-work/p3d-setup/) — where proxies live among the LODs.
- [Memory points](/asset-work/memory-points/) — how the *attached* model aligns itself.
- [Configs](/asset-work/configs/) — the attachment-slot side that fills swappable proxies.
- [Inventory & attachments](/scripting/engine-subsystems/inventory/) — the runtime model of slots and attachments.
