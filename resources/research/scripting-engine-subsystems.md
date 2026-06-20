# Research — Engine subsystems (overview + inventory, actions, networking, persistence)

Reference material for `scripting/engine-subsystems/` (the index plus the four subsystem
pages). Learn-the-technique notes; site prose and all code examples original (running example —
a fictional camp lantern — is ours; no class/var/function names copied).

## Sources

- **Local skill `dayz-dev-plugin`**: `systems/inventory.md`, `systems/actions.md`,
  `systems/networking.md`, `scripting/client-server.md` (comms patterns + security),
  `systems/server-client-split.md` (trust boundary), `config/types-xml.md` (Central Economy:
  lifetime, restock, flags, spawn cycle), `scripting/memory-management.md` (entity lifetime),
  `scripting/class-hierarchy.md` (GameInventory methods, action hierarchy). Supporting:
  `systems/weapons.md`, `systems/vehicles.md`, `systems/camera.md`. DayZ 1.28+.
- **BI Community Wiki** (cross-check): inventory/`GameInventory`, user actions, multiplayer
  scripting / RPC, persistence (`OnStoreSave`/`OnStoreLoad`), Central Economy / types.xml.

## Overview page framing

- A "subsystem" here = a cohesive engine service you call into from script (not a script
  module). Each has a client side and a server side; the trust boundary runs through all four.
  The page is an index + the client/server framing, explicitly NOT an API dump.

## Inventory & attachments

- `InventoryLocationType`: GROUND, HANDS, ATTACHMENT, CARGO, PROXYCARGO, VEHICLE. [skill:
  inventory]
- Model: an item has an inventory; items live in a **slot** (attachment), in **cargo**, in
  **hands**, or on the **ground**. Attachments go in named slots (scope on rifle, battery in
  device); cargo is a W×H grid. [skill: inventory, class-hierarchy GameInventory]
- Key calls: `GetInventory()`, `CreateInInventory(type)`, `CreateAttachment(type)`,
  `CreateEntityInCargo(type)`, `CreateInHands(type)` (HumanInventory), `CanAddAttachment`,
  `CanAddEntityInCargo`, `FindFreeLocationFor`, `TakeEntityToInventory`,
  `PredictiveTakeEntityToHands/Inventory` (client+server), `Server…` (authoritative),
  `EnumerateInventory(traversal, out array)`, cargo `GetCargo().GetItemCount()/GetItem(i)`,
  attachments `AttachmentCount()/GetAttachmentFromIndex(i)`. Creating/deleting items is
  **server-authoritative**. [skill: inventory]
- Item events to override on ItemBase: `OnInventoryEnter/Exit`, `OnMovedWithinCargo`,
  `OnWasAttached/OnWasDetached`. Quantity API: `GetQuantity/SetQuantity/AddQuantity`,
  `Magazine.GetAmmoCount/ServerSetAmmoCount`. Health: `GetHealth/SetHealth/GetHealth01`,
  `IsRuined/IsDamageDestroyed`. [skill: inventory]
- Worked example fodder: a lantern that only accepts a "fuel canister" in a named attachment
  slot; gate with `CanReceiveAttachment`/slot config; react in `OnWasAttached`.

## Actions (user-action system)

- Hierarchy: `ActionBase` → `ActionSingleUseBase` (instant), `ActionContinuousBase` (hold,
  progress bar), `ActionInteractBase` (F-key press), `FirearmActionBase`. [skill: actions,
  class-hierarchy]
- Add your own: subclass; `CreateConditionComponents()` sets `m_ConditionItem` (CCINone,
  CCINonRuined, CCINotPresent, CCIWaterBottle…) and `m_ConditionTarget` (CCTNone, CCTObject(d),
  CCTSelf, CCTCursor(d), CCTMan(d), CCTWaterSurface); `GetText()`; `ActionCondition(player,
  target, item)` returns availability; `OnExecuteServer/Client` (single/interact) or
  `OnFinishProgressServer` + `GetActionTime()` (continuous). Register via
  `modded PlayerBase.SetActions(out TInputActionMap)` → `super` → `AddAction(MyAction,
  InputActionMap)`, or per-item `SetActions()` → `AddAction(MyAction)`. [skill: actions]
- ActionData: `m_Player`, `m_MainItem`, `m_Target` (`.GetObject()/.GetParent()`).
- **Trust:** `ActionCondition` runs client-side (deliberately permissive — drives the prompt);
  the authoritative check + state change happens in the server execute. Don't trust the client
  asked nicely. [skill: server-client-split]
- Worked example fodder: a continuous "Refuel Lantern" action — tool/fuel in hands, target the
  lantern, on finish (server) move fuel into the lantern and bump its fuel var.

## Networking & RPC

- Approaches: vanilla **ScriptRPC** (no deps), **RegisterNetSyncVariable** (entity state sync),
  CF RPCManager / NetworkedVariables (need Community Framework). Cover vanilla + net-sync as the
  base; mention CF as the multi-mod convenience. [skill: networking, client-server]
- ScriptRPC: `new ScriptRPC()`, `Write(...)` in order, `Send(target, id, guaranteed, identity)`.
  Receive by overriding `OnRPC(sender, rpc_type, ctx)` on the entity; `ctx.Read(...)` in the
  **same order**. Server→client, client→server, server→all (null target). [skill: networking]
- Net-sync vars (server→client entity state): `RegisterNetSyncVariableInt/Bool/Float(name,
  min, max[, precision])` in constructor; set on server then `SetSynchDirty()`; read on client
  in `OnVariablesSynchronized()`. Good for "lit/unlit", small state. [skill: networking,
  client-server]
- **Trust boundary / security:** server RPC handlers must validate — check `type ==
  CallType.Server`, non-null `sender`, resolve the real player from identity, range/owner/alive
  checks, rate-limit, validate item existence. Never trust client-sent values. Direction
  matters: a client→server RPC is a *request*, not a command. [skill: client-server security,
  server-client-split]
- Worked example fodder: toggling the lantern — client sends a "toggle" request RPC; server
  validates (player owns it, in range, alive), flips the authoritative state, syncs `m_IsLit`
  via net-sync; clients update visuals in `OnVariablesSynchronized`.

## Persistence (what survives a restart)

- DayZ persistence (the "storage"/hive) saves **characters + their inventory**, and
  **persistent objects** (tents, barrels, buried stashes, fences/bases, vehicles, deployed
  items). Loose world loot is **Central-Economy managed**, not "saved" — it's regenerated, and
  governed by `lifetime` (CE despawn timer), not by the save system. [skill: types-xml,
  memory-management]
- **`lifetime = 0` means immediate despawn, not infinite** — classic misconception. Real
  persistence durations use large lifetimes / persistent storage, not 0. [skill: types-xml]
- Custom script state on a persistent entity survives via `OnStoreSave(ParamsWriteContext)` /
  `OnStoreLoad(ParamsReadContext, int version)` (server-side); `super` first, read/write in the
  same order, return false on a failed read; `AfterStoreLoad()`/`EEOnAfterLoad` for post-load
  wiring. Version int lets you evolve the format. [BI wiki: persistence; pattern is standard
  EntityAI API — cross-check, not copied]
- Net-sync vars and RPC are **runtime** sync, NOT persistence — a synced var is re-sent each
  session, but only `OnStoreSave` writes it to disk. Keep the two concepts separate.
- types.xml flags relevant to "what counts/persists": `count_in_hoarder` (player storage),
  `count_in_cargo`, `count_in_player`, `nominal`/`min`/`restock` (economy, not save). [skill:
  types-xml]
- Worked example fodder: the lantern persists its `m_Fuel` and `m_IsLit` via OnStoreSave/Load so
  a refuelled, lit lantern in a tent comes back correct after a restart.

## Flags / cross-checks

- `OnStoreSave/OnStoreLoad` signatures and `AfterStoreLoad` are standard EntityAI persistence
  API — confirmed against BI wiki, not lifted from a mod. Verify exact signature in vanilla
  scripts when implementing.
- CF (Community Framework) APIs (RPCManager, NetworkedVariables, modules) require the CF
  dependency — flag that clearly so vanilla-only readers aren't misled.
