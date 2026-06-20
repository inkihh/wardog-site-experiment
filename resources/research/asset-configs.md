# Research: config.cpp wiring (items, optics, vehicles)

Grounding for `asset-work/configs.md`. Sources: `dayz-items` skill
(file-formats/format-config-cpp.md, format-model-cfg.md, research/dayz_item_pipeline.md
§Config.cpp / §Proxy System / §Model.cfg), BI Community Wiki. Vanilla base-class names are
the engine hierarchy (allowed); no other-mod config bodies copied.

## What config does

- **`CfgPatches`**: declares the addon — `units[]`, `weapons[]`, `requiredAddons[]` (fixes
  load order; same mechanism as scripting). `requiredVersion`.
- **`CfgVehicles`**: defines nearly everything placeable (items, props, vehicles — despite
  the name). Each entry **inherits a vanilla base** and overrides a few fields.
- Other classes as needed: `CfgWeapons` (firearms/optics live here in vanilla),
  `CfgSlots`, `CfgNonAIVehicles` (proxy attachment models), `CfgModels`/`CfgSkeletons`
  (model.cfg).

## Inheritance discipline (the core lesson)

- **Inherit the closest vanilla base, override little.** Base brings physics/damage/
  inventory/simulation. Forward-declare a base with an empty `class Base;` then `class Mine :
  Base { ... }` — reference, never recreate.
- Override: `model`, `displayName`, `descriptionShort`, `hiddenSelections*`, `DamageSystem`
  rvmats, `weight`, `itemSize[]`, slot membership, gameplay tuning (fuelCapacity, cargo).
- Leave alone: simulation type, inherited event wiring, default sound/anim hookups.
- Common bases: `Inventory_Base`/`ItemBase`, `Clothing`, `Weapon_Base`, optics bases,
  `Car`/`CarScript` family, `House`/`HouseNoDestruct`.

## How config reaches into the model

- **Selections → `hiddenSelections[]`** (+ parallel `hiddenSelectionsTextures[]` /
  `hiddenSelectionsMaterials[]`). Same selection string must be in P3D and model.cfg
  `sections[]`.
- **Memory points**: rarely named in config directly, but the **base class dictates which
  points the model must provide**.
- **Proxies/slots**: `attachments[]` = slots an item *accepts*; `inventorySlot[]` = slot an
  item *fits into*. Slots fill swappable proxies.
- **Materials by health**: `DamageSystem` → `healthLevels[]` swaps rvmats.
- `scope = 2` required to be spawnable. Paths use backslashes.

## Worked example A — 3D optic (page uses original `ReflexOptic` + `FieldRifle`)

- An optic = item that (1) fits the weapon's **optics slot**, (2) declares **`OpticsInfo`**,
  (3) `OpticsInfo` points at a **camera memory point** on the optic model
  (`memoryPointCamera`). That camera point is the asset↔config bridge.
- Both live in **`CfgWeapons`** (firearms + their attachments are weapons-side, not
  CfgVehicles). Optic base = vanilla `ItemOptics`; rifle base = `Rifle_Base`.
- Self-contained pair: rifle declares `attachments[] = {"weaponOptic"}`; optic declares
  `inventorySlot[] = {"weaponOptic"}` (same string). Mismatch → won't attach.
  When attaching to a **vanilla** weapon, use that weapon's real optics-slot name (read it
  off the vanilla config — don't guess).
- `OpticsInfo` fields used (modest, correct set): `opticType`, `memoryPointCamera`,
  `discreteDistance[]`, `discreteDistanceInitIndex`, `distanceZoomMin/Max`. (PIP/3D scope
  specifics intentionally kept light to avoid over-claiming exact field names.)
- The rifle's model needs an optics **proxy** where the scope mounts.

## Worked example B — vehicle (page uses original `FieldBuggy : OffroadHatchback`)

- A full car config is **large** (physics, fuel, damage zones, lights, doors, seats, cargo).
  Strategy = inherit a vanilla car, override minimally (`model`, `hiddenSelections*` skins,
  `fuelCapacity`). Do **not** hand-write the simulation.
- The model must honour the base's contracts: wheel/light/exhaust **memory points**,
  damage-zone **selections** (Fire Geometry), wheel **proxies**, **Roadway** + **Land
  Contact** LODs — all named as the base expects. Config is short *because* the model carries
  the contract. Open the vanilla car to learn the names.
- Overriding dozens of fields ⇒ wrong base class.

## Config ↔ scripting seam

- A `CfgVehicles` class name can be a **scripted class** the engine instantiates. Example:
  the Scripting section's lantern is a config entry (slot wiring, model) AND an `ItemBase`
  script class (refuel behaviour) under the same name. Actions / net-sync / persistence hang
  off the scripted class.
- Config = bottom of the asset pipeline, top of the scripting one.

## model.cfg (only when needed)

- Needed if the model **animates** or **swaps textures** (hidden selections). Static items
  may not need one.
- `CfgSkeletons` (skeleton/bones; clothing uses the full character skeleton) + `CfgModels`
  (`skeletonName`, `sections[]` ↔ hiddenSelections, optional `Animations`). **CfgModels class
  name must match the p3d filename.** A `Default` base class is required in CfgModels.
