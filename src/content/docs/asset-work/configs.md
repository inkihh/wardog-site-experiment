---
title: Configs
description: How config.cpp ties a model, materials, and gameplay together — base classes, what to override, and worked examples for a 3D optic and a vehicle.
sidebar:
  order: 9
---

`config.cpp` is where an asset stops being a model and becomes a *thing in the game*. It gives
the asset a class name, points at its [P3D](/asset-work/p3d-setup/) and
[materials](/asset-work/materials-rvmat/), slots it into the game's class hierarchy so it
inherits behaviour, and references the [selections](/asset-work/selections-and-naming/),
[memory points](/asset-work/memory-points/), and [proxies](/asset-work/proxies/) you built into
the model. It's also the seam where asset work meets [scripting](/scripting/overview/).

This page assumes you've read [Pipeline & formats](/asset-work/pipeline-and-formats/) — the
config is the last link in the `config → model → material → textures` chain.

## What a config actually does

Two top-level pieces appear in almost every mod:

- **`CfgPatches`** — declares your addon: what classes it adds (`units[]`, `weapons[]`) and what
  it depends on (`requiredAddons[]`, which fixes [load order](/scripting/game-structure/#how-merge-and-override-resolve)).
  This is the same mechanism the scripting side uses.
- **`CfgVehicles`** — defines most placeable things: items, clothing, props, and vehicles
  (despite the name). Each entry is a class that **inherits a base class** and overrides a
  handful of fields. Firearms and their attachments (optics, suppressors, …) live in a
  sibling, **`CfgWeapons`**, but follow the exact same inherit-and-override pattern.

There are other config classes (`CfgWeapons`, `CfgSlots`, `CfgNonAIVehicles`, …), but
`CfgPatches` + `CfgVehicles` is the spine.

## Inherit from a vanilla base — override little

The most important config habit: **inherit the closest vanilla base class and change only what's
yours.** The base class already wires up the hard parts — physics, damage, inventory behaviour,
simulation. Your job is to point it at your model and tweak the surface.

```cpp
class CfgVehicles
{
    class HouseNoDestruct;          // vanilla base — forward-declared, not redefined

    class WoodCrate : HouseNoDestruct
    {
        scope = 2;
        model = "\MyProps\data\woodcrate.p3d";
        // everything else inherited
    };
};
```

That forward declaration (`class HouseNoDestruct;` with no body) tells the compiler "this class
exists elsewhere, I'm extending it" — you reference vanilla bases this way, you don't recreate
them.

**What to override vs leave alone:**

| Override (it's about *your* asset) | Leave alone (inherited machinery) |
| --- | --- |
| `model`, `displayName`, `descriptionShort` | The simulation / physics type |
| `hiddenSelections*`, the `DamageSystem` rvmats | The base class's event wiring |
| `weight`, `itemSize[]`, slot membership | Default sound/animation hookups you don't change |
| Gameplay tuning (fuel capacity, cargo size) | Anything you'd have to copy verbatim to keep |

Pick the right base and you write ten lines; pick `Inventory_Base` for something that should
have been a `Car` and you'll reinvent a thousand.

Common bases you'll meet: `Inventory_Base`/`ItemBase` (generic items),
`Clothing` (wearables), `Weapon_Base` (firearms), the optics bases (attachable scopes),
the `Car`/`CarScript` family (vehicles), and `House`/`HouseNoDestruct` (static world objects).

## How config references the model

The config doesn't just name the P3D — it reaches into the named things inside it:

- **Selections → `hiddenSelections`.** A [selection](/asset-work/selections-and-naming/) like
  `camo` listed in `hiddenSelections[]` lets the config assign that face group a texture and
  material — and lets scripts re-skin it at runtime. The arrays are **parallel**: index *i* of
  `hiddenSelections[]`, `hiddenSelectionsTextures[]`, and `hiddenSelectionsMaterials[]` all
  describe the same selection.
- **Memory points** are read by the engine by name — the config rarely names them directly, but
  the **base class you choose dictates which [memory points](/asset-work/memory-points/) the
  model must provide** (a weapon base expects a muzzle point; a car base expects wheel/light
  points).
- **Proxies / attachment slots.** `attachments[]` declares which slots an item *accepts*;
  `inventorySlot[]` declares which slot an item *fits into*. Those slots are what fill a model's
  swappable [proxies](/asset-work/proxies/).
- **Materials by health.** The `DamageSystem`'s `healthLevels[]` swaps
  [RVMATs](/asset-work/materials-rvmat/#damage-states) as the item degrades.

## Worked example: a 3D optic

A scope is an item that **attaches to a weapon's optics slot** and lets the player aim through
it. Three things make it an optic rather than a generic item: it fits the optics slot, it
declares an `OpticsInfo`, and its `OpticsInfo` points at a **camera memory point** on the model.
That camera point is the asset↔config bridge — it's a [memory point](/asset-work/memory-points/)
you place in the model and name here.

To keep the example self-contained, here's a minimal rifle that *offers* an optics slot, and the
optic that fits it. Both are firearm-side, so they live in **`CfgWeapons`**. The rifle's model
carries an optics [proxy](/asset-work/proxies/); the slot name is the contract between the two
classes:

```cpp
class CfgWeapons
{
    class Rifle_Base;
    class ItemOptics;                             // vanilla optics base — forward-declared

    class FieldRifle : Rifle_Base
    {
        scope = 2;
        displayName = "Field Rifle";
        model = "\MyMod\data\fieldrifle.p3d";
        attachments[] = { "weaponOptic" };        // ◄── the slot this rifle offers
    };

    class ReflexOptic : ItemOptics
    {
        scope = 2;
        displayName = "Reflex Optic";
        descriptionShort = "A compact reflex sight.";
        model = "\MyMod\data\reflexoptic.p3d";
        inventorySlot[] = { "weaponOptic" };      // ◄── fits the rifle's slot (same string!)

        weight = 200;
        itemSize[] = { 2, 1 };

        hiddenSelections[]         = { "camo" };
        hiddenSelectionsTextures[] = { "\MyMod\data\reflexoptic_co.paa" };
        hiddenSelectionsMaterials[]= { "\MyMod\data\reflexoptic.rvmat" };

        class OpticsInfo
        {
            opticType            = 0;
            memoryPointCamera    = "opticView";   // ◄── memory point on the optic's model
            discreteDistance[]   = { 100 };
            discreteDistanceInitIndex = 0;
            distanceZoomMin      = 100;
            distanceZoomMax      = 100;
        };
    };
};
```

Notice the three contracts the config relies on, each pointing back at something you built into
the asset:

1. **The slot string** `weaponOptic` is identical on both sides — the rifle's `attachments[]`
   and the optic's `inventorySlot[]`. A mismatch (or a wrong vanilla slot name) means the optic
   simply won't attach. When attaching to a *vanilla* weapon, use that weapon's real optics-slot
   name — read it off the vanilla config rather than guessing.
2. **`memoryPointCamera = "opticView"`** names a [memory point](/asset-work/memory-points/) the
   engine looks through when the player aims. If that point is missing or misplaced in the model,
   the view is wrong — a textbook "wrong place, not missing" memory-point bug.
3. **`hiddenSelections`** names the `camo` [selection](/asset-work/selections-and-naming/) so the
   optic can be skinned. The same string must be in the P3D and (if present) the `model.cfg`'s
   `sections[]`.

The rifle's model also needs an optics **proxy** where the scope mounts — see
[Proxies](/asset-work/proxies/).

## Worked example: a vehicle

Vehicles are the deep end. A full car config is **large**, because a car simulates physics,
fuel, damage zones, lights, doors, seats, and cargo. The winning strategy is exactly the rule
above, taken to its limit: **inherit a vanilla car and override as little as possible.** You do
*not* hand-write the simulation.

```cpp
class CfgVehicles
{
    class Car;
    class CarScript;
    class OffroadHatchback;          // a vanilla car — forward-declared

    class FieldBuggy : OffroadHatchback
    {
        scope = 2;
        displayName = "Field Buggy";
        model = "\MyMod\data\fieldbuggy.p3d";

        // Re-skin via the model's hidden selections
        hiddenSelections[]         = { "camo1", "camo2" };
        hiddenSelectionsTextures[] = { "\MyMod\data\buggy_ext_co.paa",
                                       "\MyMod\data\buggy_int_co.paa" };
        hiddenSelectionsMaterials[]= { "\MyMod\data\buggy_ext.rvmat",
                                       "\MyMod\data\buggy_int.rvmat" };

        fuelCapacity = 80;           // gameplay tuning — override

        // Damage zones, wheels, lights, seats: inherited from OffroadHatchback,
        // and they expect the matching selections / memory points on YOUR model.
    };
};
```

What this example is really teaching:

- **Inheritance does the heavy lifting.** `OffroadHatchback` (through `CarScript`/`Car`) brings
  the entire drive simulation, the damage model, the seat/door/light logic. You change the
  *skin* and a little *tuning*, not the machinery.
- **The model must honour the base class's contracts.** Because you inherited a car, your P3D
  has to provide the **wheel/light/exhaust [memory points](/asset-work/memory-points/)**, the
  **damage-zone [selections](/asset-work/selections-and-naming/)** in Fire Geometry, the
  **wheel [proxies](/asset-work/proxies/)**, the **Roadway** and **Land Contact** LODs — all
  with the names the base class expects. The config is short *because* the model carries the
  contract. Open the vanilla car you inherit to learn those names.
- **Skinning uses the same `hiddenSelections` mechanism** as the optic — just with more
  selections (exterior, interior).

If you find yourself overriding dozens of fields, you probably picked the wrong base class. Step
back and inherit the vanilla vehicle closest to what you want.

:::caution[Inherit, don't transplant]
"Inherit the vanilla base and override a little" is the technique — it is **not** an invitation
to copy a vanilla config's whole body into your mod, or to de-binarize anything. Reference the
base by name; write your own short override. See the
[EULA note](/asset-work/pipeline-and-formats/#mlod-vs-odol-the-one-distinction-to-get-right).
:::

## Where config meets scripting

Config defines *what an asset is*; script defines *what it does in play*. The handoff happens at
the class name — a `CfgVehicles` class can name a script class that the engine instantiates:

- The lantern from the [inventory example](/scripting/engine-subsystems/inventory/#worked-example-a-lantern-that-takes-fuel)
  is a `CfgVehicles` entry (slot wiring, model) **and** an `ItemBase` script class (the refuel
  behaviour) — the same class name in both worlds.
- An [Action](/scripting/engine-subsystems/actions/), a
  [net-sync variable](/scripting/engine-subsystems/networking/), and
  [persistence](/scripting/engine-subsystems/persistence/) all hang off that scripted class.

So config is the *bottom* of the asset pipeline and the *top* of the scripting one. When your
model, materials, and config are correct, scripting is where the asset comes alive.

## Possible future split

This page covers items, optics, and vehicles together. As the worked examples grow, it may split
into per-asset-type guides (a dedicated weapon config page, a vehicle config page). For now,
they share the one rule that matters: **inherit the right base, override what's yours, and make
the model honour the base class's contracts.**

## Related

- [Pipeline & formats](/asset-work/pipeline-and-formats/) — config as the last link in the chain.
- [Selections & naming](/asset-work/selections-and-naming/) — what `hiddenSelections` and damage zones reference.
- [Memory points](/asset-work/memory-points/) — the points the base class expects your model to provide.
- [Proxies](/asset-work/proxies/) — the attachment slots `attachments[]`/`inventorySlot[]` fill.
- [Materials (RVMAT)](/asset-work/materials-rvmat/) — the `healthLevels[]` damage-state rvmats.
- [Scripting overview](/scripting/overview/) — where the asset gains behaviour.
