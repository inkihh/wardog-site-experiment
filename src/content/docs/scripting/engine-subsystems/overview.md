---
title: Engine subsystems
description: An index to the DayZ engine systems you script against most — inventory, actions, networking, and persistence — and the client/server framing they share.
sidebar:
  order: 1
  label: Overview
---

Most of your gameplay code doesn't invent new machinery — it *calls into* machinery the
engine already provides. A "subsystem" in this section is one of those cohesive engine
services: the inventory model, the user-action system, the networking layer, the
persistence store. You don't build them; you hook into them correctly.

This is the part of the site that most deliberately **isn't an API dump**. A raw list of
every method on `GameInventory` wouldn't tell you the thing that actually matters — *how the
system is shaped, which side of the client/server line each call belongs on, and what a
correct, complete example looks like*. So each page takes one subsystem and does it
properly, with a worked example you could adapt.

## What every subsystem has in common

Two ideas run through all four pages, and they're worth fixing in your head before you read
any of them:

- **Every subsystem has a client side and a server side.** The
  [server is authoritative](/scripting/common-gotchas/#the-clientserver-split): it owns the
  real state and makes the real decisions. The client predicts, renders, and *asks*. Whether
  you're creating an item, running an action, or syncing a value, the first question is
  always "which side is this running on, and is that the side that's allowed to do it?"
- **The trust boundary runs through all of them.** A client→server message is a request to
  be validated, not a command to be obeyed. An action's on-screen condition is a hint, not a
  guarantee. The authoritative check always happens server-side.

Hold onto those two and the individual systems stop feeling like unrelated APIs and start
feeling like four views of the same architecture.

## The subsystems

- **[Inventory & attachments](/scripting/engine-subsystems/inventory/)** — how items, slots,
  cargo, and attachments are modelled, and how to create, move, query, and react to items.
- **[Actions](/scripting/engine-subsystems/actions/)** — the user-action system: how the
  prompts you see in-game work, and how to add your own with a clean client/server split.
- **[Networking & RPC](/scripting/engine-subsystems/networking/)** — moving data between
  client and server safely, with message direction and the trust boundary front and centre.
- **[Persistence](/scripting/engine-subsystems/persistence/)** — what actually survives a
  server restart, how storage differs from the Central Economy, and how to save custom state.

The pages share a running example — a fictional **camp lantern** that takes a fuel
canister, can be refuelled, toggles on and off, and remembers its fuel level across a
restart — so you can see how one item touches all four systems at once.

## Related

- [Common gotchas](/scripting/common-gotchas/) — the client/server split and trust boundary in depth.
- [EnScript basics](/scripting/enscript-basics/) — the language the examples are written in.
- [Game structure](/scripting/game-structure/) — which module each subsystem's code belongs in.
