---
title: Actions
description: The DayZ user-action system — how the in-game prompts work, the action types, and how to add your own with a correct client/server split.
sidebar:
  order: 3
---

Every "Hold **F** to…" prompt and context interaction in DayZ comes from the **user-action
system**. It's the standard, engine-supported way to let a player *do something* to an item
or the world, and it's almost always the right tool — it handles targeting, the on-screen
prompt, the progress bar, animations, and the client/server hand-off for you. Rolling your
own input handling instead is a common beginner mistake.

This page shows how an action is shaped and how to add one. It leans on the
[client/server split](/scripting/common-gotchas/#the-clientserver-split) hard, because an
action is *defined* by which of its parts run where.

## The action types

All actions descend from `ActionBase`, and you pick a base class by interaction style:

| Base class | Feels like | Use for |
| --- | --- | --- |
| `ActionInteractBase` | A single **F** press | Quick interactions |
| `ActionContinuousBase` | **Hold** with a progress bar | Anything that takes time |
| `ActionSingleUseBase` | Instant, one-shot | Consume/use in one beat |
| `FirearmActionBase` | Weapon manipulation | Firearm-specific actions |

## Anatomy of an action

An action class overrides a small set of methods, each with a clear job:

- **`CreateConditionComponents()`** — declares the *preconditions* via two components:
  `m_ConditionItem` (what must be in the player's hands) and `m_ConditionTarget` (what the
  player must be aiming at).
- **`GetText()`** — the label shown in the prompt.
- **`ActionCondition(player, target, item)`** — a per-frame check for whether the action is
  currently available. **This runs on the client** to drive the prompt.
- **`GetActionTime()`** — how long a continuous action takes (seconds).
- **`OnExecuteServer()` / `OnFinishProgressServer()`** — the authoritative payload: the
  actual state change, server-side. (`OnExecute…` for interact/single-use, `OnFinishProgress…`
  for continuous.)
- **`OnExecuteClient()`** — optional client-side flourish (a sound, a particle).

The condition components are prebuilt classes. The common ones:

| Item condition (`m_ConditionItem`) | Means |
| --- | --- |
| `CCINone` | No item needed in hands |
| `CCINonRuined` | Held item must not be ruined |
| `CCINotPresent` | Hands must be empty |

| Target condition (`m_ConditionTarget`) | Means |
| --- | --- |
| `CCTNone` | No target required |
| `CCTObject(dist)` | Must target an object within `dist` metres |
| `CCTSelf` | Target is the player themselves |
| `CCTMan(dist)` | Must target another player |
| `CCTCursor(dist)` | Cursor-based targeting |

## Registering an action

Defining the class isn't enough — you have to register it so the engine offers it. The usual
route is to add it to the player via [`modded class`](/scripting/enscript-basics/#modded-class-the-injection-model),
remembering `super`:

```c
modded class PlayerBase
{
    override void SetActions(out TInputActionMap InputActionMap)
    {
        super.SetActions(InputActionMap);          // keep all existing actions
        AddAction(ActionRefuelLantern, InputActionMap);
    }
}
```

You can also register an action on a **specific item class** instead, so it's only offered
when that item is involved:

```c
modded class CampLantern
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionRefuelLantern);
    }
}
```

## The trust split, made concrete

This is the part to internalise. An action has its feet in both worlds:

- **`ActionCondition` runs on the client.** It decides whether to *show* the prompt, so it
  should be deliberately permissive and must never depend on secret state — the client
  doesn't have the authoritative truth and shouldn't leak it.
- **`OnExecuteServer` / `OnFinishProgressServer` run on the server.** This is where the
  *real* check and the *real* state change happen. Re-validate here; never assume the client
  only asked because the condition was genuinely met.

In other words: the client-side condition is a hint for the UI; the server-side execute is
the gatekeeper. Treating the condition as authoritative is the same
[never-trust-the-client](/scripting/common-gotchas/#never-trust-the-client) mistake the
networking layer warns about.

You read the action's context through `ActionData`: `m_Player` (the actor), `m_MainItem`
(the item in hands), and `m_Target` (with `m_Target.GetObject()` for the targeted entity).

## Worked example: refuelling the lantern

A continuous action: the player holds a **fuel canister** in their hands, aims at a
**lantern**, and holds the key to pour fuel in. The condition gates availability on the
client; the finish handler does the authoritative transfer on the server.

```c
// scripts/4_World/actions/ActionRefuelLantern.c
class ActionRefuelLantern extends ActionContinuousBase
{
    override void CreateConditionComponents()
    {
        m_ConditionItem   = new CCINonRuined();             // a usable item in hands
        m_ConditionTarget = new CCTObject(UAMaxDistances.DEFAULT); // aimed at something
    }

    override string GetText()
    {
        return "Refuel Lantern";
    }

    override float GetActionTime()
    {
        return 4.0;   // hold for 4 seconds
    }

    // Client-side availability — permissive, no secret state
    override bool ActionCondition(PlayerBase player, ActionTarget target, ItemBase item)
    {
        if (!item || !item.IsKindOf("CampLanternFuel"))
            return false;

        CampLantern lantern = CampLantern.Cast(target.GetObject());
        if (!lantern)
            return false;

        return lantern.GetFuel() < lantern.GetFuelMax();   // not already full
    }

    // Server-side payload — the authoritative state change
    override void OnFinishProgressServer(ActionData action_data)
    {
        CampLantern lantern = CampLantern.Cast(action_data.m_Target.GetObject());
        ItemBase    canister = action_data.m_MainItem;
        if (!lantern || !canister)
            return;

        // Re-validate on the server — don't trust that the client asked fairly
        if (lantern.GetFuel() >= lantern.GetFuelMax())
            return;

        lantern.AddFuel(50);                 // pour fuel into the lantern
        canister.AddQuantity(-50);           // and draw it from the canister
    }
}
```

The lantern exposes the small surface the action needs — a fuel reservoir it owns:

```c
class CampLantern extends ItemBase
{
    protected float m_Lantern_Fuel;

    float GetFuel()    { return m_Lantern_Fuel; }
    float GetFuelMax() { return 100.0; }

    void AddFuel(float amount)
    {
        m_Lantern_Fuel = Math.Clamp(m_Lantern_Fuel + amount, 0, GetFuelMax());
    }
}
```

Notice the division of labour: the canister-in-hands and lantern-as-target checks happen on
the client so the prompt appears at the right moment, but the fuel only actually changes in
`OnFinishProgressServer`, *after* a second check. That `m_Lantern_Fuel` value is exactly the
kind of state you'll want to [tell clients about](/scripting/engine-subsystems/networking/)
and [save across a restart](/scripting/engine-subsystems/persistence/).

## Related

- [Inventory & attachments](/scripting/engine-subsystems/inventory/) — the items actions operate on.
- [Networking & RPC](/scripting/engine-subsystems/networking/) — the trust boundary in full.
- [Persistence](/scripting/engine-subsystems/persistence/) — saving the state an action changed.
- [Common gotchas](/scripting/common-gotchas/) — why the client-side condition isn't a guarantee.
