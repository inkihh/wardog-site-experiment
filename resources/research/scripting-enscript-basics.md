# Research — EnScript basics

Reference material for `scripting/enscript-basics.md`. Learn-the-technique notes; site
prose and all code examples written from scratch (no class/var/function names copied).

## Sources

- **Local skill `dayz-dev-plugin`** (`/mnt/c/Users/ingma/.claude/skills/dayz-dev-plugin/`):
  `scripting/enforce-script.md` (types, collections, operators, control flow, naming,
  classes, modded classes, templates, enums, casting, quirks, string methods, preprocessor,
  params, singletons), `scripting/class-hierarchy.md` (entity chain, casting helpers),
  `scripting/memory-management.md` (ref/autoptr/Managed — intro only here, deep dive on the
  gotchas page). Authoritative, DayZ 1.28+.
- **BI Community Wiki** (cross-check): `Enforce Script Syntax`, `DayZ:Enforce_Script`,
  `Class` / data types pages.

## Type system

- Primitives: `int` (32-bit signed), `float` (32-bit IEEE), `bool`, `string` (UTF-8),
  `vector` (three packed floats x/y/z), `typename` (a type reference), `Class` (root of all
  script classes). [skill: enforce-script]
- `vector` is a **value type** and can be initialised from a string literal: `vector v = "1 2 3";`
  or `Vector(1,2,3)`. Surprising to newcomers — it reads like a string but is three floats.
- Collections: `array<T>` (dynamic, `.Insert/.Count/.Get/.Remove/.Clear`), `{}` shorthand for
  an empty array, `set<T>` (unique; Insert returns false on dup), `map<K,V>`
  (`Insert/Get/Contains`), C-style fixed arrays `int a[10]`. Aliases: `TStringArray` =
  `array<string>`, `TIntArray`, `TFloatArray`, `TVectorArray`, `TStringStringMap`, etc.
- `auto` is available (type inference), commonly used in `foreach`.

## Classes & inheritance

- `class X extends Y { ... }`. Access modifiers `private`/`protected`/`public`; **public is
  default**. Constructor `void X()`, destructor `void ~X()`. `static` members/methods.
- `override` keyword required when overriding. Casting: `T.Cast(obj)` (null on fail),
  `CastTo(out, obj)`, `obj.IsInherited(T)`, `obj.ClassName()` (script class) vs `obj.GetType()`
  (config class — differ for entities!), `obj.Type()` → typename. [skill: enforce-script,
  class-hierarchy]
- Templates/generics: `class Box<Class T> { T m_Item; }`.
- Enums: members auto-increment from 0; explicit values allowed.

## modded class / override / super (the injection mechanism)

- `modded class Foo { ... }` merges onto the existing `Foo` (vanilla or another mod) at
  compile time — the heart of how mods extend without editing originals.
- **Never** write `modded class Foo : Bar` — the `: Bar` is silently ignored (already inherits).
- **Always** `super.Method(...)` in an override unless you deliberately replace behaviour.
- Prefix custom members/methods with the mod name (`m_Mymod_X`) to avoid silently clobbering a
  vanilla symbol. Works across PBOs/addons. [skill: enforce-script, server-client-split]
- Deep dive (pitfalls, ordering, silent overrides) lives on common-gotchas; basics page only
  introduces the mechanism.

## References & ownership (intro only — full treatment on gotchas)

- GC + optional reference counting. `ref` = strong reference, **member variables only**.
  `autoptr` = scope-bound auto-delete. No keyword = weak (GC may collect). Class must extend
  `Managed` for `ref` to mean anything. **Never `delete`** — null the reference. [skill:
  memory-management]
- `ref` in params/returns/locals is wrong — use `out` for params.

## Modules & scopes (intro — full treatment on game-structure)

- Numbered modules compile in order `1_Core → 2_GameLib → 3_Game → 4_World → 5_Mission`.
  Lower can't see higher. Flat global class namespace (no namespaces) → prefix to avoid
  collisions. [skill: client-server, mod-structure]

## Syntax surprises (for C# / C++ / JS folks)

- `string.ToLower()`/`ToUpper()` **mutate in place AND return the length (int)**, not the string.
- Bitwise operators have **lower precedence than comparisons** — parenthesise `(flags & F) == F`.
- `switch` may need a `return` moved *outside* the switch to satisfy the compiler even with a
  default branch.
- `foreach` directly over a getter's return is unsafe — assign to a local first.
- Known engine quirk: `1 < int.MIN` evaluates **true**. Watch int-boundary comparisons.
- Complex single-line array assignments can segfault — use intermediate locals.
- Preprocessor scans `#ifdef`/`#endif`/`#define` tokens even inside strings/comments → never
  embed those words in a string literal.
- `ref` is not a C++ reference; `vector` is not a struct you build field-by-field; there is no
  garbage-collected-then-finalized contract you should lean on — keep a strong ref alive.
- Singletons: `GetGame()` (or `g_Game`, faster in 1.28+), `GetDayZGame()`, `GetPlayer()`
  (client-only local player).

## Flags / cross-checks

- Module-2 spelling is `2_GameLib`. The three you actually touch: `3_Game`/`4_World`/`5_Mission`.
- Performance: prefer script methods over proto/native for trivial ops; avoid
  `GetObjectsAtPosition*`, `SurfaceIsPond/Sea`.
