---
title: Common gotchas
description: The sharp edges of EnScript — the client/server split, reference counting, null handling, load order, and modded-class pitfalls.
sidebar:
  order: 3
---

Most of the time you lose to DayZ scripting isn't spent on hard logic — it's spent on a
handful of sharp edges that *compile fine and then misbehave*. The bug that "works in
singleplayer but breaks on the server," the object that vanishes a frame after you create
it, the override that silently does nothing. This page is the catalogue. Read it before
you write much; each section is a class of bug, not a single trick.

It assumes you've met the language in [EnScript basics](/scripting/enscript-basics/).

## The client/server split

DayZ is **server-authoritative**: the server owns the truth, and clients predict and
render. This single fact is behind a huge share of beginner bugs, because the code you
write usually runs on *both* sides and you have to be deliberate about which side does
what.

```c
if (GetGame().IsServer())
{
    // authoritative: spawn/delete entities, change real state
}

if (GetGame().IsClient())
{
    // presentation: effects, sounds, UI
}
```

The traps:

- **`IsClient()` returns `false` during init.** If you gate initialization code behind
  `IsClient()`, it simply never runs. For "client *and* singleplayer" during startup, test
  `if (!GetGame().IsDedicatedServer())` instead.
- **Spawning or deleting entities on the client is wrong.** Entity creation and deletion
  are server jobs. Do them client-side and you get desync, ghosts, or nothing at all.
- **A member you set on one side doesn't exist on the other.** The two sides are separate
  processes with separate object state. If the client needs a value the server computed,
  you must *send* it — via a [net-sync variable or RPC](/scripting/engine-subsystems/networking/),
  not by setting a member and hoping.

:::danger[Singleplayer hides these bugs]
A listen server and singleplayer run both halves in one process, so client/server mistakes
often work there and only break on a **dedicated server**. Test on a real server before you
call something done.
:::

The deeper consequence — that a signed client PBO can be fully unpacked, so nothing in it
is secret — is covered under [the trust boundary](#never-trust-the-client) below and on the
[Networking](/scripting/engine-subsystems/networking/) page.

## Reference counting

EnScript's garbage collector is **aggressive**, and its reference keywords are stricter
than they look. The rules from [EnScript basics](/scripting/enscript-basics/#references-and-ownership)
turn into these concrete mistakes:

**`ref` / `autoptr` are member-only.** Putting `ref` on a parameter, return type, or local
doesn't do what you'd expect — use an `out` parameter to hand a value back to a caller.

**A member without `ref` can be collected between frames.** This is the classic
"my object turned into `null`" bug:

```c
class BeaconController
{
    SignalBeacon m_Beacon;          // WRONG — weak, GC may collect it

    void Start()
    {
        m_Beacon = new SignalBeacon();
        // m_Beacon may be null again before you next touch it
    }
}
```

```c
class BeaconController
{
    ref SignalBeacon m_Beacon;      // RIGHT — strong, lives as long as the controller
}
```

**`ref` does nothing unless the class extends `Managed`.** Reference counting is opt-in;
a plain `class` that isn't `Managed` ignores `ref` entirely.

```c
class SignalBeacon : Managed       // now ref actually keeps it alive
{
    int m_Channel;
}
```

**Circular references leak.** Two `Managed` objects that hold a `ref` to each other will
*never* be collected. Break the cycle by making one side a weak (no-keyword) reference —
typically the child's back-pointer to its parent:

```c
class Beacon : Managed
{
    ref BeaconBattery m_Battery;    // owner → strong
}

class BeaconBattery : Managed
{
    Beacon m_Owner;                 // back-pointer → weak, breaks the cycle
}
```

**Never `delete`.** It can segfault. Null the reference and let the GC do its job; for
scope cleanup use `autoptr`; for **entities** (items, vehicles, players — engine-managed,
not script-GC'd) call `Delete()` or `GetGame().ObjectDelete()`, and only on the server.

## Null handling

The engine does not null-check for you, and a method call on `null` crashes the script VM
(logged to the `.RPT`). Two habits prevent most of it:

- **Always check a cast.** `T.Cast()` returns `null` on failure by design — `if (x)` before
  you use it, every time.
- **Treat engine getters as nullable.** `GetIdentity()`, `GetGame().GetPlayer()`, a
  targeted object, an attachment lookup — any of these can be `null` depending on side and
  timing. Guard them.

The `notnull` parameter annotation documents that the *caller* has already checked — it
doesn't insert a check for you.

## Mod load order and config merges

When your mod extends something, that something has to exist **first**. Load order is
driven by `requiredAddons[]` in your `CfgPatches`:

```cpp
class CfgPatches
{
    class Lantern_Core
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data" };   // load after base game data
    };
};
```

What goes wrong:

- **Forgetting `requiredAddons[]`.** Your modded class can compile *before* the base class
  it extends, and fail to find it. Require what you build on.
- **Config classes merge by name, last-loaded wins.** Two mods that touch the same vanilla
  class can silently clobber each other; the one loaded later takes the field. Script
  `modded class` declarations *stack* in load order instead of replacing.
- **Config is not private.** Class names, `displayName`, model paths — everything in
  `config.cpp` ships to clients and is readable. Only script in a server-only PBO is truly
  hidden. (See [the trust boundary](#never-trust-the-client).)

[Game structure](/scripting/game-structure/) explains how the engine discovers and compiles
all of this.

## `modded class` pitfalls

The injection model from [EnScript basics](/scripting/enscript-basics/#modded-class-the-injection-model)
fails quietly when you break its rules:

- **No `: Parent`.** `modded class PlayerBase : ManBase` — the `: ManBase` is silently
  ignored. The modded class already inherits.
- **Forgetting `super`.** An override without `super.Method(...)` drops vanilla's behaviour
  *and* every other mod's override below you in the chain. Unless you mean to replace it
  entirely, call `super` first.
- **Silent overrides from unprefixed names.** Name a custom method `SetState()` and you may
  override a vanilla `SetState()` you didn't know existed — no warning. Prefix custom
  members and methods with your mod name.
- **You're not necessarily last in the chain.** Several mods can `modded class` the same
  class; their overrides run in load order. Don't assume your version is the final word, and
  don't depend on another mod's ordering.

```c
modded class PlayerBase
{
    override void SetActions(out TInputActionMap InputActionMap)
    {
        super.SetActions(InputActionMap);   // keep vanilla + other mods' actions
        AddAction(ActionRefuelLantern, InputActionMap);
    }
}
```

Drop that `super` line and the player loses *every* default action. That's the shape of the
whole category: nothing errors, the behaviour just quietly disappears.

## Never trust the client

Because a signed client PBO can be unpacked and read, **anything that reaches a client is
public and tamperable**. Every server-side handler that acts on client input has to
validate before it acts:

- Confirm the call really is server-side and the sender identity is non-null.
- Resolve the actual player from the identity — don't trust an ID the client typed.
- Check distance, ownership, and that the player is alive.
- Rate-limit, and confirm referenced items actually exist.

A client→server message is a **request**, never a command. The
[Networking page](/scripting/engine-subsystems/networking/) shows the validation pattern in
full, and [Actions](/scripting/engine-subsystems/actions/) shows where the client-side
condition ends and the authoritative server check begins.

## Related

- [EnScript basics](/scripting/enscript-basics/) — the language these gotchas come from.
- [Game structure](/scripting/game-structure/) — modules, load order, and merge resolution.
- [Engine subsystems](/scripting/engine-subsystems/overview/) — networking, actions, and the trust boundary in practice.
