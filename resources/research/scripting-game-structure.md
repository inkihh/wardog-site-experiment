# Research — Game structure

Reference material for `scripting/game-structure.md`. Learn-the-technique notes; site prose
and all code examples original.

## Sources

- **Local skill `dayz-dev-plugin`**: `systems/mod-structure.md` (folder layout, mod.cpp,
  meta.cpp, the two config.cpp levels, CfgMods script-module registration, module access
  table, PBO packaging, common dependencies), `config/config-cpp.md` (CfgPatches, CfgMods,
  the `class defs { gameScriptModule / worldScriptModule / missionScriptModule }` registration,
  scope values, external class refs), `scripting/client-server.md` (module hierarchy and access
  rules), `scripting/class-hierarchy.md` (entity chain you'll read in vanilla scripts).
  Authoritative, DayZ 1.28+.
- **BI Community Wiki** (cross-check): `DayZ:Modding Structure`, `CfgMods`, `config.cpp`,
  script module / `PboPrefix` documentation.

## Script module layers

- Five numbered modules compile in a fixed order, engine-core → mission:
  `1_Core` → `2_GameLib` → `3_Game` → `4_World` → `5_Mission`. [skill: mod-structure,
  client-server]
- What belongs where (practical):
  - `1_Core` — lowest engine/script primitives. Rarely touched by mods.
  - `2_GameLib` — generic engine library types. Rarely touched.
  - `3_Game` — game-wide utilities/logic available everywhere (no world/mission deps).
  - `4_World` — entities, items, actions, players — the bulk of gameplay modding.
  - `5_Mission` — HUD, menus, the player's session, mission server/client logic.
- The three you actually touch: `3_Game`, `4_World`, `5_Mission`.

## Access rule (lower can't see higher)

| Module | Can access | Cannot access |
|--------|-----------|---------------|
| `3_Game` | engine API, built-ins | `4_World`, `5_Mission` |
| `4_World` | `3_Game`, engine API | `5_Mission` |
| `5_Mission` | `3_Game`, `4_World`, engine API | — (top) |

- Put a class in the **lowest** module that can see everything it needs. A `4_World` entity
  can't reference a `5_Mission` HUD class → talk upward via events/RPC, not direct references.
  [skill: mod-structure access table]

## How the engine finds & compiles scripts (CfgMods)

- Two config.cpp levels: addon-level (CfgPatches + CfgMods + content classes) and a script
  sub-config. Mod scripts are registered in **CfgMods → class defs** with one class per module
  pointing `files[]` at the source dir:
  `gameScriptModule` → 3_Game, `worldScriptModule` → 4_World, `missionScriptModule` → 5_Mission.
  [skill: mod-structure, config-cpp]
- `CfgPatches` declares the addon + `requiredAddons[]` (drives load order; e.g. `"DZ_Data"`,
  `"DZ_Scripts"`). The engine discovers a mod's classes/scripts through its config.
- Mod scripts are **merged into** the matching vanilla module (not a separate sandbox), which
  is why `modded class` can see and extend vanilla classes in the same module.

## How merge/override resolves

- Within a module, all registered files (vanilla + every mod, in load order) compile together
  into one symbol space. `modded class` stacks in load order; config classes merge by name with
  later-loaded winning on direct conflicts.
- Consequence: name collisions are silent; prefix custom symbols. Load order matters; require
  what you extend.

## Reading vanilla scripts to learn

- After Extract Game Data (Workbench setup), the vanilla scripts are readable on `P:` — the
  authoritative reference for "how does Bohemia do X." Reading them is legitimate (the EULA
  bars de-binarization/DeODOL of binarized *assets*, not reading the provided scripts).
- Use the class hierarchy (EntityAI → Man/ItemBase/CarScript/…) as a map for where to look.
  [skill: class-hierarchy]

## Cross-links

- Mechanism of `modded class`/`override`/`super` → enscript-basics; pitfalls → common-gotchas;
  the on-disk mod shape and packing → getting-started/modding-overview, tooling-setup.
