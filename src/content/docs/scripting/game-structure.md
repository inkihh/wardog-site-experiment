---
title: Game structure
description: The script module layers, the access rules between them, how the engine finds and compiles your code, and how mod scripts merge with vanilla.
sidebar:
  order: 4
---

Before you write much script, it helps to know *where it goes* and *how the engine ever
finds it*. DayZ's scripts aren't one flat pile — they're organised into a fixed stack of
**modules**, registered through config, compiled in a set order, and merged with the base
game's own code. Get the mental model right and a whole class of "why can't my class see
that?" and "why didn't my override take?" questions answer themselves.

This page assumes you know the language ([EnScript basics](/scripting/enscript-basics/)) and
have seen the on-disk shape of a mod
([Modding overview](/getting-started/modding-overview/#the-shape-of-a-mod-on-disk)).

## The module layers

Every script belongs to one of five numbered modules, and they compile in this order:

```text
1_Core  →  2_GameLib  →  3_Game  →  4_World  →  5_Mission
```

Think of it as engine-core at the bottom and the player's live session at the top. What
each one is for:

| Module | What lives here | You'll touch it |
| --- | --- | --- |
| `1_Core` | Lowest-level script primitives and engine glue | Rarely |
| `2_GameLib` | Generic, game-agnostic library types | Rarely |
| `3_Game` | Game-wide logic and utilities, available everywhere | Often |
| `4_World` | Entities, items, actions, players — gameplay objects | **Most of your work** |
| `5_Mission` | HUD, menus, input, the player's session and mission logic | Often |

In practice the bottom two are Bohemia's foundation; your code lives in **`3_Game`,
`4_World`, and `5_Mission`**. A custom item or [action](/scripting/engine-subsystems/actions/)
is `4_World`; a custom HUD element or keybind is `5_Mission`; a shared helper with no
world or mission dependencies is `3_Game`.

## The access rule: lower can't see higher

The order isn't just cosmetic — it's an **access boundary**. A module can reference modules
*below* it, never above:

| Code in… | Can access | Cannot access |
| --- | --- | --- |
| `3_Game` | engine API, built-ins | `4_World`, `5_Mission` |
| `4_World` | `3_Game`, engine API | `5_Mission` |
| `5_Mission` | `3_Game`, `4_World`, engine API | — (top of the stack) |

So a `4_World` item **cannot** hold a reference to a `5_Mission` HUD class. That feels
restrictive until you see the reason: a world entity exists on the server, where there is no
mission HUD at all. The rule keeps you from writing code that can't possibly run on both
sides.

The practical guideline: **put each class in the lowest module that can still see everything
it needs.** When something low needs to reach something high — a world object that wants to
update the UI — you don't reach *up*; you communicate sideways with an event or an
[RPC / net-sync variable](/scripting/engine-subsystems/networking/). That indirection is the
same boundary the [client/server split](/scripting/common-gotchas/#the-clientserver-split)
enforces, viewed from the code-organisation angle.

## How the engine finds your scripts

A mod's scripts are invisible to the engine until its **config** points at them. That
registration lives in `CfgMods`, with one entry per module mapping the engine's module name
to your source folder:

```cpp
class CfgMods
{
    class Lantern                       // your mod
    {
        dir = "Lantern";
        name = "Lantern";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule        // → 3_Game
            {
                value = "";
                files[] = { "Lantern/scripts/3_Game" };
            };
            class worldScriptModule       // → 4_World
            {
                value = "";
                files[] = { "Lantern/scripts/4_World" };
            };
            class missionScriptModule     // → 5_Mission
            {
                value = "";
                files[] = { "Lantern/scripts/5_Mission" };
            };
        };
    };
};
```

Alongside that, your **`CfgPatches`** declares the addon and — crucially — its load order
through `requiredAddons[]`:

```cpp
class CfgPatches
{
    class Lantern
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Scripts" };  // load after these
    };
};
```

The engine reads every loaded addon's config, collects the registered files for each
module, and compiles them **together** — vanilla and every mod side by side — into a single
symbol space per module. Your scripts aren't sandboxed off in a corner; they're compiled
right alongside the classes they extend, which is exactly why
[`modded class`](/scripting/enscript-basics/#modded-class-the-injection-model) can see and
hook into vanilla code in the same module.

## How merge and override resolve

Because everything in a module compiles into one namespace, two things follow:

- **`modded class` declarations stack in load order.** If three mods all `modded class
  PlayerBase`, their additions layer on top of each other in the order the addons load. Each
  one's `super` call reaches the version below it. (This is why
  [forgetting `super`](/scripting/common-gotchas/#modded-class-pitfalls) breaks the whole
  chain, not just vanilla.)
- **Config classes merge by name, and the last loaded wins** on a direct conflict. Two mods
  editing the same field of the same vanilla class will clobber each other; the one that
  loads later takes it.

Both behaviours make **load order** load-bearing, and `requiredAddons[]` is how you control
it: require whatever you extend, so it's guaranteed to exist and compile first. Skip that
and your modded class can compile before its base and fail to find it — a leading cause of
"class `X` not found" at startup. More on the failure modes in
[Common gotchas → load order](/scripting/common-gotchas/#mod-load-order-and-config-merges).

## Read the vanilla scripts

The best reference for "how does Bohemia do this?" is Bohemia's own code. After you run
**Extract Game Data** during [Workbench setup](/getting-started/workbench-setup/), the
vanilla scripts sit readable on your `P:` drive. Reading them — and copying the *technique*,
not the files — is the fastest way to learn the real patterns.

:::note[This is allowed]
Reading the script files the tools extract for you is fine. What the EULA forbids is
**de-binarization** of binarized assets (DeODOL and similar). Scripts you're given in
readable form are fair game to study.
:::

Use the [class hierarchy](/scripting/enscript-basics/#casting-and-type-checks) as your map:
start from `EntityAI`, follow the chain down to `ItemBase`, `Weapon_Base`, `CarScript`,
`PlayerBase`, and read the class that already does something close to what you want. Then
write your own version in the right module.

## Related

- [EnScript basics](/scripting/enscript-basics/) — the language and the `modded class` mechanism.
- [Common gotchas](/scripting/common-gotchas/) — load-order and merge failures in detail.
- [Engine subsystems](/scripting/engine-subsystems/overview/) — the systems you build inside these modules.
- [Modding overview](/getting-started/modding-overview/) — the mod-on-disk shape these scripts pack into.
