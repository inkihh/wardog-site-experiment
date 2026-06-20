---
title: EnScript basics
description: The core of Enforce Script — types, classes, the modded-class injection model, references, and the things that differ from other languages.
sidebar:
  order: 2
---

DayZ is scripted in **Enforce Script** (EnScript) — Bohemia's own statically-typed,
C-like, object-oriented language for the [Enfusion engine](/getting-started/modding-overview/).
It compiles ahead of time, it's garbage-collected, and it leans heavily on classes and
inheritance. If you know C# or Java you'll be productive quickly; just keep reminding
yourself that it is **not** C++, **not** C#, and **not** Lua — the resemblances are
skin-deep and the differences are exactly where people lose time.

This page covers the language itself. The sharp edges that cause real bugs — the
[client/server split](/scripting/common-gotchas/#the-clientserver-split), reference
mistakes, and `modded class` pitfalls — get their own treatment in
[Common gotchas](/scripting/common-gotchas/). Read this first, then skim that.

## The type system

### Primitives

| Type | What it is | Example |
| --- | --- | --- |
| `int` | 32-bit signed integer | `int count = 42;` |
| `float` | 32-bit floating point | `float ratio = 0.75;` |
| `bool` | `true` / `false` | `bool ready = true;` |
| `string` | UTF-8 text | `string label = "Lantern";` |
| `vector` | three packed floats (x, y, z) | `vector pos = "1.5 0 2";` |
| `typename` | a reference to a *type* | `typename t = ItemBase;` |
| `Class` | the root of every script class | — |

The one that surprises everyone is **`vector`**. It's a value type holding three
floats — used for positions, directions, orientations, and colours — and you can
initialise it straight from a string literal:

```c
vector pos    = "1.5 0 2";      // parsed into x=1.5, y=0, z=2
vector origin = Vector(0, 0, 0); // or built explicitly
float height  = pos[1];          // index the components
```

It reads like a string, but it behaves like three numbers. Assigning it copies the
value; there's no separate "construct a vector struct field by field" step.

### Arrays, sets, and maps

Collections are generic. The dynamic `array<T>` is the workhorse:

```c
array<string> tags = new array<string>;
array<string> empty = {};        // {} is shorthand for an empty array

tags.Insert("flammable");
int n = tags.Count();            // size
string first = tags.Get(0);      // access (or tags[0])
tags.Remove(0);                  // remove by index
tags.Clear();                    // empty it
```

There's also `set<T>` (unique values — `Insert` returns `false` on a duplicate),
`map<K, V>` (`Insert` / `Get` / `Contains`), and C-style fixed arrays (`int slots[8];`).
EnScript ships type aliases for the common cases — `TStringArray` is `array<string>`,
plus `TIntArray`, `TFloatArray`, `TVectorArray`, `TStringStringMap`, and friends.

```c
map<string, int> stock = new map<string, int>;
stock.Insert("Battery9V", 3);
if (stock.Contains("Battery9V"))
    int have = stock.Get("Battery9V");
```

:::caution[Don't `foreach` straight over a getter]
`foreach (auto x : GetSomething())` can misbehave because the temporary returned by the
getter isn't kept alive. Assign it to a local first, then iterate the local. This is one
of the most common silent bugs — see [Common gotchas](/scripting/common-gotchas/).
:::

## Classes and inheritance

Classes look familiar. A class `extends` its parent, methods are `PascalCase`, member
variables conventionally start with `m_`, and **members are `public` by default** (unlike
C#):

```c
class FuelCanister extends ItemBase
{
    protected float m_FuelLitres;   // explicitly protected
    int  m_BurnRate;                // public by default

    void FuelCanister()             // constructor: void + class name
    {
        m_FuelLitres = 0;
    }

    void ~FuelCanister() { }        // destructor: void ~ClassName

    float GetFuel() { return m_FuelLitres; }

    static FuelCanister Empty()     // static factory
    {
        return new FuelCanister();
    }
}
```

When you override a method from the parent, the `override` keyword is **required** — the
compiler rejects an override that isn't marked, and rejects an `override` that doesn't
actually shadow anything. That check catches a lot of typos.

### Casting and type checks

Downcasts are explicit and **safe** — they return `null` instead of throwing, so you
always check the result:

```c
ItemBase item = ItemBase.Cast(someEntity);
if (item)
{
    // safe to use item
}

// out-parameter form
ItemBase asItem;
if (Class.CastTo(asItem, someEntity)) { /* ... */ }

if (someEntity.IsInherited(ItemBase)) { /* it IS an ItemBase */ }
```

Two name accessors that trip people up: for an entity, `ClassName()` returns the **script**
class name while `GetType()` returns the **config** class name, and the two can differ.
When you're comparing against a `config.cpp` class, use `GetType()`.

### Templates and enums

Generics use `<Class T>`:

```c
class Slot<Class T>
{
    protected T m_Value;
    void Set(T v) { m_Value = v; }
    T    Get()    { return m_Value; }
}
```

Enums auto-number from zero, and you can pin explicit values:

```c
enum LampState
{
    OFF,        // 0
    DIM,        // 1
    BRIGHT = 5, // 5
    FLICKER     // 6
}
```

## `modded class`: the injection model

This is the single most important idea in DayZ scripting, and it has no direct equivalent
in most languages. You almost never edit a vanilla file. Instead you write a **`modded
class`** that the compiler *merges onto* the existing class — vanilla's, or another mod's —
producing one combined class with your additions layered in.

```c
modded class PlayerBase          // note: NO ": ManBase" — see below
{
    protected int m_Lantern_TimesRefuelled;   // prefix custom members!

    override void Init()
    {
        super.Init();            // keep the original behaviour
        m_Lantern_TimesRefuelled = 0;
    }
}
```

Three rules carry almost all the weight here:

- **Never add `: Parent` to a `modded class`.** It already inherits from the class it
  mods; writing `modded class PlayerBase : ManBase` is *silently ignored* and only
  confuses readers.
- **Always call `super`** in an override unless you genuinely mean to replace the original
  wholesale. Forget it and you silently drop both vanilla's behaviour *and* every other
  mod's override further down the chain.
- **Prefix your custom members and methods** with your mod's name
  (`m_Lantern_TimesRefuelled`, not `m_TimesRefuelled`). The class namespace is flat and
  shared with every other mod; an unprefixed name can collide with — and silently override
  — something that already exists.

`modded class` even works **across PBOs**, which is the basis for splitting a mod into
client and server halves. The mechanics of *why* these rules matter, and how merge order
resolves when several mods touch the same class, are covered in
[Common gotchas](/scripting/common-gotchas/#modded-class-pitfalls) and
[Game structure](/scripting/game-structure/).

## References and ownership

EnScript is garbage-collected, with **opt-in reference counting** layered on top. You
control object lifetime with two keywords — and the rules are strict enough that they're a
gotcha in their own right, so this is the short version:

```c
class LanternRegistry
{
    ref array<ref FuelCanister> m_Canisters;  // strong ref: kept alive

    void LanternRegistry()
    {
        m_Canisters = new array<ref FuelCanister>;
    }
}
```

- **`ref`** is a strong reference that keeps an object alive. It is for **member variables
  only** — never on parameters, return types, or locals.
- **`autoptr`** is a scope-bound strong reference: the object is deleted automatically when
  the variable goes out of scope.
- **No keyword** is a *weak* reference — the GC may collect the object out from under you,
  leaving the variable `null`.
- For `ref` to mean anything, the class must extend **`Managed`** (directly or through an
  ancestor). Game entities like `ItemBase` are engine-managed instead — you don't `ref`
  them to own them.
- **Never use `delete`.** Null the reference and let the GC clean up; for entities call
  `Delete()` (server-side).

The aggressive-GC failures, circular-reference leaks, and the `Managed` requirement are
spelled out with examples in
[Common gotchas → reference counting](/scripting/common-gotchas/#reference-counting).

## Modules and scopes

Your scripts don't live in one flat pile — they're split into numbered **modules** that
compile in a fixed order:

```text
1_Core  →  2_GameLib  →  3_Game  →  4_World  →  5_Mission
```

A lower module **cannot see** a higher one: code in `3_Game` can't reach a `5_Mission`
class, but `5_Mission` can use everything below it. In practice you'll write in `3_Game`
(game-wide logic), `4_World` (entities, items, actions), and `5_Mission` (HUD, menus, the
player's session). Put each class in the *lowest* module that can still see everything it
needs. [Game structure](/scripting/game-structure/) goes deep on the layers, the access
rule, and how the engine finds and compiles your files.

There are no namespaces — the class space is global and flat across every loaded mod —
which is the other reason the prefix convention matters.

## Syntax surprises

A grab-bag of things that bite people coming from C#, C++, or JavaScript:

- **`ToLower()` / `ToUpper()` mutate in place and return an `int`.** They change the string
  itself and return its *length*, not the lowercased string. `string lower =
  s.ToLower();` does not do what you think.
- **Bitwise operators bind *looser* than comparisons.** `if (flags & FLAG == FLAG)` parses
  as `flags & (FLAG == FLAG)`. Always parenthesise: `if ((flags & FLAG) == FLAG)`.
- **`switch` can demand a `return` outside the switch.** Even with a `default` branch, the
  compiler may insist on a trailing `return` after the closing brace.
- **`1 < int.MIN` evaluates to `true`.** A genuine engine quirk — be careful with
  integer-boundary comparisons.
- **Complex one-line array writes can segfault.** Split `arr[Index()] = Compute();` into
  intermediate locals.
- **The preprocessor doesn't respect strings or comments.** A `#ifdef` / `#endif` /
  `#define` token *inside a string literal or comment* is still parsed as a directive and
  will throw the file's conditionals off. Never embed those words in text.
- **`ref` is not a C++ reference.** It's a lifetime keyword, not an aliasing one. For
  "modify my argument," use an `out` parameter, never `ref`.
- **`auto` exists** for type inference, most often in `foreach`.

When something compiles but misbehaves at runtime, the script VM logs to the server's
`.RPT` file — that log is your first stop, every time.

## Related

- [Common gotchas](/scripting/common-gotchas/) — read before you write much; it'll save hours.
- [Game structure](/scripting/game-structure/) — the module layers and how mods compile in.
- [Engine subsystems](/scripting/engine-subsystems/overview/) — the systems you'll script against.
- [Modding overview](/getting-started/modding-overview/) — where scripting sits in the bigger picture.
