---
title: Scripting overview
description: How EnScript and the DayZ engine fit together, and what this section covers.
sidebar:
  order: 1
  label: Overview
---

DayZ is scripted in **EnScript** (Enforce Script), the engine's own
statically-typed, C-like language. This section covers the practical reality of
working with it — the parts that bite people, the subsystems you'll actually touch,
and how the game is structured underneath your code.

Scripting and [asset work](/asset-work/overview/) overlap constantly: a weapon, a
vehicle, or an item is part model, part config, part script. Expect to jump between
the two.

## What this section covers

The pages read foundational → applied — work through them in order:

- **[EnScript basics](/scripting/enscript-basics/)** — types, classes, the `modded class`
  injection model, references, and the things that differ from languages you already know.
- **[Common gotchas](/scripting/common-gotchas/)** — the sharp edges: the client/server
  split, reference counting, null handling, mod load order, and `modded class` pitfalls.
- **[Game structure](/scripting/game-structure/)** — the script module layers, the access
  rules between them, and how mods compile in and merge with vanilla.
- **[Engine subsystems](/scripting/engine-subsystems/overview/)** — the systems you reach
  for most, one page each:
  [inventory & attachments](/scripting/engine-subsystems/inventory/),
  [actions](/scripting/engine-subsystems/actions/),
  [networking & RPC](/scripting/engine-subsystems/networking/), and
  [persistence](/scripting/engine-subsystems/persistence/).

## What this section is not

It's **not** a generated API dump of the unpacked source. Raw Doxygen-style
references don't deliver the value people actually want. Instead we document the
subsystems and native functions people frequently use, with worked examples and the
context that a raw reference can't give you.

## Where to start

If you're new to EnScript, read [EnScript basics](/scripting/enscript-basics/) first,
then skim [Common gotchas](/scripting/common-gotchas/) before you write much — it'll
save you hours.
