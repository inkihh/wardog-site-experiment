---
title: Networking & RPC
description: Moving data between client and server in DayZ — ScriptRPC, net-sync variables, message direction, and the trust boundary, with a worked example.
sidebar:
  order: 4
---

The client and the server are **separate processes with separate state**. A value you set on
one side does not exist on the other until you *send* it. Networking is how you bridge that
gap — and because the gap is also a [trust boundary](/scripting/common-gotchas/#never-trust-the-client),
it's the subsystem where a careless mistake turns into an exploit rather than just a bug.

This page covers the two vanilla mechanisms you'll reach for first, the direction a message
travels, and how to validate what crosses the line.

## Two mechanisms (vanilla)

You don't need any dependencies for these:

- **`ScriptRPC`** — a one-off message. You write some values, send them to the other side,
  and a handler reads them back. Good for *events*: "the player pressed the button," "apply
  this effect now."
- **Net-sync variables** — automatic, ongoing sync of an entity's member variables from
  server to clients. Good for *state*: "this lantern is lit," "this device is at 40%." You
  set it on the server; clients are kept up to date for free.

A rough rule: **RPC for events, net-sync for state.** Many features use both — an RPC
*requests* a change, and a net-sync variable *broadcasts* the result.

:::note[Community Framework]
If your mod already depends on the [Community Framework](https://github.com/Arkensor/DayZ-CommunityFramework),
its `RPCManager` and `NetworkedVariables` add named RPCs and cross-mod namespacing on top of
the same ideas. They're a convenience, not a requirement — everything below is plain vanilla.
:::

## Message direction

Every message goes one of three ways, and the direction decides who you can trust:

- **Server → one client** — push private state or a notification to a specific player.
- **Server → all clients** — broadcast (send to a `null` target).
- **Client → server** — a **request**. The client is asking the server to do something. This
  is the dangerous direction: the sender is untrusted, so the server must validate before
  acting.

There is no client → client. Clients talk to each other *through* the server.

## ScriptRPC

Sending is: make a `ScriptRPC`, `Write()` your values **in order**, then `Send()`:

```c
const int LANTERN_RPC_TOGGLE = 17601;   // your own id; keep it clear of engine ERPCs

// Client → server: "please toggle this lantern"
void RequestToggle(EntityAI lantern)
{
    ScriptRPC rpc = new ScriptRPC();
    rpc.Send(lantern, LANTERN_RPC_TOGGLE, true, null);   // null recipient → goes to server
}
```

`Send(target, id, guaranteed, recipient)`: `target` is the entity whose `OnRPC` fires on the
far side, `guaranteed` asks for reliable delivery, and `recipient` is the player to send to
(or `null` for "to the server" when sending from a client).

Receiving means overriding `OnRPC` on that entity and reading the values back **in the same
order you wrote them**:

```c
class CampLantern extends ItemBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (rpc_type == LANTERN_RPC_TOGGLE)
        {
            // runs on the server — validate, then act (see below)
        }
    }
}
```

When you write multiple values, read them back in identical order — a mismatch silently
corrupts everything after it:

```c
rpc.Write(amount);     // int
rpc.Write(reason);     // string
// reading:
int amount;  ctx.Read(amount);
string reason; ctx.Read(reason);
```

## Net-sync variables

For small pieces of entity state, register the variables in the constructor, set them on the
server and mark the entity dirty, and react on the client:

```c
class CampLantern extends ItemBase
{
    protected bool m_Lantern_IsLit;

    void CampLantern()
    {
        RegisterNetSyncVariableBool("m_Lantern_IsLit");
    }

    // Server-side setter
    void SetLit(bool lit)
    {
        if (!GetGame().IsServer())
            return;
        m_Lantern_IsLit = lit;
        SetSynchDirty();             // queues the sync to clients
    }

    // Runs on clients when synced values arrive
    override void OnVariablesSynchronized()
    {
        super.OnVariablesSynchronized();
        UpdateLight();               // show/hide the glow to match m_Lantern_IsLit
    }

    void UpdateLight() { /* attach/detach the light, swap the material… */ }
}
```

There are matching `RegisterNetSyncVariableInt(name, min, max)` and
`RegisterNetSyncVariableFloat(name, min, max, precision)` — the ranges let the engine pack
the value into as few bits as possible, so keep them tight. Call `SetSynchDirty()` **once**
after changing several variables; it batches them.

## The trust boundary

A client→server RPC handler is the front door to your server logic, and the client on the
other side may be modified or hostile. **Validate before you act**, every time:

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);
    if (rpc_type != LANTERN_RPC_TOGGLE)
        return;

    if (!GetGame().IsServer()) return;   // authoritative side only
    if (!sender) return;                 // must have an identity

    // Resolve the real player from the identity — never trust an id the client supplies
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayerByIdentity(sender));
    if (!player || !player.IsAlive()) return;

    // Range / ownership checks: is the player actually holding this lantern?
    if (player.GetItemInHands() != this) return;

    // Only now is it safe to change authoritative state
    SetLit(!m_Lantern_IsLit);
}
```

The checklist that prevents most exploits:

- Confirm you're on the server and the `sender` identity is non-null.
- Resolve the player from the identity; don't act on an id or index the client sent.
- Check distance, ownership, and that the player is alive.
- Confirm referenced items actually exist, and rate-limit if the message can be spammed.

This is the same principle [Actions](/scripting/engine-subsystems/actions/) apply to their
server execute, and the reason the client-side condition there is only ever a hint.

## Worked example: toggling the lantern, end to end

Putting the pieces together, here's the full round trip for the lantern's light:

1. **Client** — a keybind (or an [action](/scripting/engine-subsystems/actions/)) calls
   `RequestToggle(lantern)`, sending `LANTERN_RPC_TOGGLE` to the server. The client changes
   *nothing* itself.
2. **Server** — `OnRPC` validates the sender, confirms the player is alive and holding the
   lantern, then flips `m_Lantern_IsLit` via `SetLit()`, which calls `SetSynchDirty()`.
3. **All clients** — receive the synced value and run `OnVariablesSynchronized()`, where
   `UpdateLight()` turns the glow on or off to match.

The client asked, the server decided, and the result was broadcast through a net-sync
variable — request over RPC, state over sync. Nothing authoritative ever lived on the
client.

:::caution[Sync is not persistence]
A net-sync variable is re-sent every session; it is **not** written to disk. If the lantern
should still be lit after a server restart, that's a separate job —
[Persistence](/scripting/engine-subsystems/persistence/) — and it saves the same
`m_Lantern_IsLit` value through a different path.
:::

## Related

- [Persistence](/scripting/engine-subsystems/persistence/) — saving state versus syncing it.
- [Actions](/scripting/engine-subsystems/actions/) — where many client→server requests originate.
- [Common gotchas](/scripting/common-gotchas/#never-trust-the-client) — the trust boundary in depth.
- [Inventory & attachments](/scripting/engine-subsystems/inventory/) — the entities you're syncing.
