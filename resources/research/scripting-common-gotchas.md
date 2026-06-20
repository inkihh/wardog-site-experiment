# Research — Common gotchas

Reference material for `scripting/common-gotchas.md`. Learn-the-technique notes; site prose
and all code examples original.

## Sources

- **Local skill `dayz-dev-plugin`**: `scripting/memory-management.md` (ref/autoptr/Managed,
  circular refs, never-delete, premature GC, entity lifecycle), `scripting/client-server.md`
  (IsServer/IsClient, the IsClient-false-during-init trap, lifecycle, comms patterns, "never
  trust client" security), `systems/server-client-split.md` (signed client PBO is fully
  unpackable; what must stay server-side; modded class across PBOs; stub/override idiom).
  Authoritative, DayZ 1.28+.
- **BI Community Wiki** (cross-check): `DayZ:Enforce Script`, multiplayer scripting / RPC,
  `IsServer`/`IsClient` semantics.

## Client/server split (the #1 source of "works then doesn't" bugs)

- DayZ is **server-authoritative**. Server decides; client predicts/renders. Clients are
  untrusted and a signed client PBO is fully unpackable — treat every client byte as public.
- Detection: `GetGame().IsServer()`, `IsClient()`, `IsMultiplayer()`, `IsDedicatedServer()`.
- **Trap:** `IsClient()` returns **false during init** — use `!IsDedicatedServer()` for
  "runs on client and in singleplayer" during init. [skill: client-server]
- Bugs from getting it wrong: spawning/deleting entities on the client (must be server),
  trusting client-sent values, doing authoritative state on the client, expecting a member set
  on one side to exist on the other (it won't unless synced).
- Singleplayer/listen-server runs both sides in one process, so split bugs hide there and only
  surface on a dedicated server — test on a real server.

## Reference-counting mistakes

- `ref`/`autoptr` are **member-only** — never params/returns/locals (`out` for params). [skill:
  memory-management]
- Class must `extends Managed` (directly or via a Managed ancestor) for `ref` to do anything.
  Entities (EntityAI) are engine-managed — different lifecycle, don't `ref` them for ownership.
- The GC is aggressive: a member without `ref` can be collected between frames → null member.
- **Never `delete`** (segfaults) — null the reference; use `autoptr` for scope cleanup; for
  entities use `obj.Delete()` / `GetGame().ObjectDelete()` server-side.
- **Circular refs leak** — two `Managed` objects holding `ref` to each other never collect.
  Fix: make one side a weak (no-keyword) reference.
- Multiple strong owners of one object = murky lifetime; prefer one owner, others weak.

## Null handling

- Casts return null on failure — always `if (x)` after `T.Cast(...)`. The engine won't
  null-check for you; calling a method on null crashes the script VM (logged to .RPT).
- `GetIdentity()`, `GetGame().GetPlayer()` etc. can be null depending on side/timing — guard.
- `notnull` param annotation documents a caller-checked contract; it doesn't insert a check.

## Mod load order & config/script merge surprises

- `requiredAddons[]` (in CfgPatches) drives load order — your addon must require whatever it
  extends so the base class exists first. Missing it → modded extension may compile before its
  base and fail. [skill: server-client-split, mod-structure]
- Config classes merge/override by name; later-loaded wins on conflicts → two mods touching the
  same vanilla class can clobber each other. Script `modded class` from multiple mods stack in
  load order.
- Config is **not hidden** from clients (names, displayName, model paths all ship) — only
  server-PBO *script* is truly private.

## modded class pitfalls

- **No `: Parent`** on a modded class (silently ignored). [skill: enforce-script]
- **Always `super.`** or you silently drop vanilla behaviour (and every other mod's override in
  the chain).
- **Silent overrides:** an unprefixed custom method/member name can collide with a vanilla one
  and override it without warning — prefix with the mod name.
- Override ordering across mods is load-order dependent; don't assume you're last in the chain.
- For `ref` to work on a custom member added in a modded class, the *base* must ultimately be
  Managed (EntityAI is, plain `Class` is not).

## Worked-example fodder (write original)

- A "set a member on the server, read it on the client" bug → fix with a net-sync var.
- A circular-ref leak between an owner object and a child → fix by weakening one side.
- A modded `Init`/`SetActions` that forgets `super.` → actions/other mods vanish.
