---
title: Inventory & attachments
description: How DayZ models items, slots, cargo, and attachments — creating, moving, querying, and reacting to items, with a worked attachment example.
sidebar:
  order: 2
---

The inventory system is the one subsystem nearly every mod touches, because almost
everything in DayZ *is* an item with an inventory. Understanding its shape — slots versus
cargo, where an item can live, who's allowed to move it — saves you from a long tail of
"the item won't go where I put it" bugs.

This page builds on the [client/server split](/scripting/common-gotchas/#the-clientserver-split):
**creating, deleting, and authoritatively moving items are server jobs.** Keep that in the
back of your mind throughout.

## The model

Every entity that can hold things has a **`GameInventory`**, reached with `GetInventory()`.
An item is always in exactly one **location**, and the location *type* tells you how it's
held:

| Location | Meaning |
| --- | --- |
| `GROUND` | Lying in the world |
| `HANDS` | In a player's hands |
| `ATTACHMENT` | In a named slot on a parent (scope on a rifle, fuel in a lantern) |
| `CARGO` | In a parent's cargo grid (items inside a backpack or crate) |
| `PROXYCARGO` | Nearby ground items shown in the vicinity panel |
| `VEHICLE` | In a vehicle's cargo |

The two that matter most for modded items are **attachments** and **cargo**, and they're
genuinely different:

- An **attachment** goes into a single **named slot** with a fixed identity — a battery
  slot, an optics slot, a fuel slot. A slot holds one specific kind of thing, and the parent
  config declares which slots exist. Attachments usually *change how the parent behaves*.
- **Cargo** is a width × height **grid** of loose storage. Anything that fits and is allowed
  goes in; it doesn't change the container, it's just held.

Players have a richer `GetHumanInventory()` on top of this for hands and worn clothing.

## Creating items

All of these run on the **server**. Pick the call that matches where the item should land:

```c
// Into any free slot of a player's inventory
EntityAI canister = player.GetInventory().CreateInInventory("CampLanternFuel");

// Straight into the player's hands
EntityAI lantern = player.GetHumanInventory().CreateInHands("CampLantern");

// As an attachment on a parent (into the matching named slot)
EntityAI fuel = lantern.GetInventory().CreateAttachment("CampLanternFuel");

// Into a container's cargo grid
EntityAI spare = crate.GetInventory().CreateEntityInCargo("CampLanternFuel");

// On the ground in the world
vector at = player.GetPosition();
EntityAI dropped = GetGame().CreateObjectEx("CampLantern", at, ECE_PLACE_ON_SURFACE);
```

Every one of these returns `null` if it couldn't place the item (no space, not allowed) — so
[check the result](/scripting/common-gotchas/#null-handling) before you touch it.

## Checking space before you act

Rather than create-and-hope, ask first:

```c
if (lantern.GetInventory().CanAddAttachment(fuel))
    lantern.GetInventory().CreateAttachment("CampLanternFuel");

if (crate.GetInventory().CanAddEntityInCargo(item))
{
    // it'll fit
}

// Or find a concrete free spot for an existing item
InventoryLocation loc = new InventoryLocation();
if (player.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, loc))
{
    // loc now describes where it can go
}
```

## Moving items

There are two families of move call, and choosing the wrong one is a common desync bug:

- **`Predictive…`** runs on **both** client and server — the client moves the item
  immediately for responsiveness and the server confirms. Use these for player-driven moves.
- **`Server…`** is **authoritative**, server-only. Use these from server-side logic (an
  action's execute, a script spawning loadout).

```c
// Player-driven: predictive
player.PredictiveTakeEntityToHands(lantern);
player.PredictiveTakeEntityToInventory(FindInventoryLocationType.ANY, item);

// Server-driven: authoritative
player.ServerTakeEntityToInventory(item);
```

## Querying and iterating

To walk everything a player is carrying — across hands, slots, cargo, and nested
containers — enumerate it into an array first (don't
[`foreach` over the getter](/scripting/enscript-basics/#arrays-sets-and-maps) directly):

```c
bool PlayerHasFuel(PlayerBase player)
{
    array<EntityAI> contents = new array<EntityAI>;
    player.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, contents);

    foreach (EntityAI e : contents)
    {
        if (e.IsKindOf("CampLanternFuel"))
            return true;
    }
    return false;
}
```

For a single container you can iterate cargo and attachments directly:

```c
// Cargo grid
CargoBase cargo = crate.GetInventory().GetCargo();
for (int i = 0; i < cargo.GetItemCount(); i++)
    EntityAI inCargo = cargo.GetItem(i);

// Attachment slots
for (int s = 0; s < lantern.GetInventory().AttachmentCount(); s++)
    EntityAI att = lantern.GetInventory().GetAttachmentFromIndex(s);
```

## Reacting to inventory events

Override these on your `ItemBase` (directly, or via
[`modded class`](/scripting/enscript-basics/#modded-class-the-injection-model)) to run logic
when items move. Always call `super` first:

```c
class CampLantern extends ItemBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        // this lantern was attached to something
    }

    override void OnInventoryEnter(Man player)
    {
        super.OnInventoryEnter(player);
        // picked up / moved into an inventory
    }
}
```

Companion events include `OnInventoryExit`, `OnMovedWithinCargo`, and `OnWasDetached`.

## Worked example: a lantern that takes fuel

Here's the running example end to end. The lantern accepts exactly one **fuel canister** in
a dedicated slot, and reacts when one is inserted or removed.

The slot wiring lives in config — the parent declares the slot, the child declares it fits
there ([Configs](/asset-work/configs/) covers this side fully):

```cpp
class CfgVehicles
{
    class ItemBase;

    class CampLantern : ItemBase
    {
        scope = 2;
        displayName = "Camp Lantern";
        model = "\Lantern\data\lantern.p3d";
        attachments[] = { "CampLanternFuelSlot" };   // the slot this lantern offers
    };

    class CampLanternFuel : ItemBase
    {
        scope = 2;
        displayName = "Lantern Fuel";
        model = "\Lantern\data\fuel.p3d";
        inventorySlot[] = { "CampLanternFuelSlot" };  // and where this fuel fits
    };
};
```

Then the script gates and reacts to the attachment. `CanReceiveAttachment` is the
gatekeeper; `OnWasAttached` / `OnWasDetached` are where you respond:

```c
class CampLantern extends ItemBase
{
    protected EntityAI m_Lantern_FuelItem;   // weak ref — the engine owns the entity

    // Refuse anything that isn't our fuel canister
    override bool CanReceiveAttachment(EntityAI attachment, int slotId)
    {
        if (!attachment.IsKindOf("CampLanternFuel"))
            return false;
        return super.CanReceiveAttachment(attachment, slotId);
    }

    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
    }

    // Track the fuel canister when it's slotted in / pulled out
    override void EEItemAttached(EntityAI item, string slot_name)
    {
        super.EEItemAttached(item, slot_name);
        if (item.IsKindOf("CampLanternFuel"))
            m_Lantern_FuelItem = item;
    }

    override void EEItemDetached(EntityAI item, string slot_name)
    {
        super.EEItemDetached(item, slot_name);
        if (item == m_Lantern_FuelItem)
            m_Lantern_FuelItem = null;
    }

    bool HasFuel() { return m_Lantern_FuelItem != null; }
}
```

Note `m_Lantern_FuelItem` is a plain (weak) reference, **not** `ref` — the fuel canister is an
engine-managed entity, not a script object you own, so you don't reference-count it. (See
[reference counting](/scripting/common-gotchas/#reference-counting).) From here, an
[Action](/scripting/engine-subsystems/actions/) can refuel it, a
[net-sync variable](/scripting/engine-subsystems/networking/) can tell clients whether it's
lit, and [persistence](/scripting/engine-subsystems/persistence/) can remember its fuel
level across a restart — the same lantern, threaded through all four subsystems.

## A note on quantity and health

Many items carry a **quantity** (food, ammo, fuel as a stackable) — `GetQuantity()`,
`SetQuantity()`, `AddQuantity()` — and all items carry **health**: `GetHealth("", "")`,
`GetHealth01("", "")` (normalised 0–1), `SetHealth()`, plus `IsRuined()`. Both are
server-authoritative and both can be persisted; quantity is often the cleaner way to model
"how much fuel is in the canister" than a custom variable.

## Related

- [Actions](/scripting/engine-subsystems/actions/) — let the player do things *to* items.
- [Networking & RPC](/scripting/engine-subsystems/networking/) — tell clients about item state.
- [Persistence](/scripting/engine-subsystems/persistence/) — make item state survive a restart.
- [Configs](/asset-work/configs/) — the config side of items, slots, and cargo.
