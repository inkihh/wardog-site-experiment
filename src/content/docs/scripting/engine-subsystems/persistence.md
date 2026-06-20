---
title: Persistence
description: What survives a DayZ server restart and how storage works — the save system versus the Central Economy, and saving custom state with OnStoreSave/OnStoreLoad.
sidebar:
  order: 5
---

"Will this still be here after a restart?" has a more interesting answer than you'd expect,
because DayZ has **two** systems that decide whether an object exists tomorrow, and they're
easy to confuse. Getting them straight is most of what this page is for; the rest is how to
save your own custom state.

## Two systems, not one

**The save system (the "hive" / storage)** writes things to disk and restores them on
restart. It covers:

- **Player characters and their inventory** — everything a logged-out player is carrying.
- **Persistent objects** — tents, barrels, buried stashes, base-building parts, vehicles,
  and other deployed/placed items.

**The Central Economy (CE)** manages **loose world loot** — the items that spawn in
buildings and on the ground. This loot is *not saved*. It's regenerated and governed by
spawn rules and a **`lifetime`** despawn timer in `types.xml`, not by the hive.

So the rule of thumb: an item persists if it lives in a **persistent context** — a player's
inventory, or inside/attached to a persistent object. The *same* lantern survives a restart
in a player's backpack or a tent, but a lantern dropped loose on the ground is CE-managed and
will despawn on its `lifetime`, restart or not.

:::danger[`lifetime = 0` means *immediate* despawn]
The single most common persistence misconception. In `types.xml`, `lifetime` is the number
of seconds an untouched item survives — and `0` means it despawns **immediately**, not
forever. Long-lived items use a large lifetime (e.g. `3888000` ≈ 45 days), not `0`. The
[Central Economy](/asset-work/configs/) is where these values live.
:::

Net-sync variables and RPCs are **runtime** sync, not persistence — they re-send state every
session but never write it to disk. ([Networking](/scripting/engine-subsystems/networking/)
draws that line.) If you want something remembered, you have to *save* it.

## Saving custom state

When you add your own member variables to an entity — like the lantern's fuel level — the
engine doesn't know they exist, so they won't be saved unless you write them. The hooks are
`OnStoreSave` and `OnStoreLoad`, and they run **on the server**.

The rules are strict and symmetric:

- Call **`super` first** in both — the engine writes/reads its own block before yours, and
  skipping it misaligns the whole stream.
- **Write and read in the *same order*.** The save is a flat byte stream with no field
  names; order is the only thing keeping it coherent.
- **Return `false` from `OnStoreLoad` on a failed read**, so the engine knows the record is
  bad rather than carrying on with garbage.
- Use the **`version`** parameter to evolve the format safely when you add fields later.

```c
class CampLantern extends ItemBase
{
    protected float m_Lantern_Fuel;
    protected bool  m_Lantern_IsLit;

    override void OnStoreSave(ParamsWriteContext ctx)
    {
        super.OnStoreSave(ctx);          // engine's data first
        ctx.Write(m_Lantern_Fuel);
        ctx.Write(m_Lantern_IsLit);
    }

    override bool OnStoreLoad(ParamsReadContext ctx, int version)
    {
        if (!super.OnStoreLoad(ctx, version))
            return false;

        if (!ctx.Read(m_Lantern_Fuel))   // same order as OnStoreSave
            return false;
        if (!ctx.Read(m_Lantern_IsLit))
            return false;

        return true;
    }
}
```

## Re-applying state after load

`OnStoreLoad` restores the *values*, but it runs mid-load — before the entity is fully wired
up — so it's the wrong place to act on them. Do that in **`AfterStoreLoad`**, which fires
once the entity is ready:

```c
override void AfterStoreLoad()
{
    super.AfterStoreLoad();
    UpdateLight();    // make the visual match the restored m_Lantern_IsLit
    SetSynchDirty();  // and push the restored state out to clients
}
```

That `SetSynchDirty()` matters: the saved value is now on the server, but clients still need
it [synced](/scripting/engine-subsystems/networking/). Persistence and sync are two separate
jobs on the same variable — save writes it to disk, sync sends it to clients — and a fully
correct feature does both.

## Evolving the save format

The moment you ship, your save format is a contract with every existing save. If you later
add a third persisted variable, old records won't contain it, and a naive `ctx.Read` will
fail or desync. The `version` parameter is how you stay compatible:

```c
override bool OnStoreLoad(ParamsReadContext ctx, int version)
{
    if (!super.OnStoreLoad(ctx, version))
        return false;

    if (!ctx.Read(m_Lantern_Fuel))  return false;
    if (!ctx.Read(m_Lantern_IsLit)) return false;

    if (version >= 2)               // a field added in your format v2
    {
        if (!ctx.Read(m_Lantern_WickWear)) return false;
    }
    return true;
}
```

Add new fields **at the end** and gate them on the version that introduced them; never
reorder or remove existing reads.

## What counts toward the economy

One related lever lives back in `types.xml`: the count flags decide whether persisted items
also count against the economy's spawn limits — `count_in_hoarder` (player storage like tents
and barrels), `count_in_cargo` (inside containers), `count_in_player` (carried). Enabling
them on a busy server can starve fresh spawns, because hoarded-but-persistent items eat into
the `nominal` target. It's a tuning concern rather than a scripting one, but it's where
"persistence" and "the economy" meet. [Configs](/asset-work/configs/) covers the economy
files.

## Related

- [Networking & RPC](/scripting/engine-subsystems/networking/) — syncing state versus saving it.
- [Inventory & attachments](/scripting/engine-subsystems/inventory/) — the item state you're persisting.
- [Actions](/scripting/engine-subsystems/actions/) — the logic that changes the state you save.
- [Common gotchas](/scripting/common-gotchas/) — the server-authoritative model behind all of this.
