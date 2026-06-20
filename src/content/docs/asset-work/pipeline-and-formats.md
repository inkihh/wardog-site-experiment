---
title: Pipeline & formats
description: The asset pipeline at a glance — model source to P3D, textures to PAA, the RVMAT material, and the config that registers it, plus MLOD vs ODOL.
sidebar:
  order: 2
---

Before you open a modeling tool, it helps to see the **whole pipeline at once**: which
files an in-game asset is actually made of, which tool produces each one, and what
happens to them when you pack the mod. Asset work has more moving parts than scripting —
a single item is a model, a material, a stack of textures, and a config, and they only
work together if every reference between them lines up. This page is the map; the rest of
the section drills into each piece.

It's the asset-side analog of the Scripting section's
[Game structure](/scripting/game-structure/) page — orientation before detail.

## The round trip

You author an asset in editable source formats, then **binarize and pack** it into a PBO
that the engine loads. The shape of that round trip:

```text
   AUTHORING (editable)                 PACK            RUNTIME (engine)
 ────────────────────────          ───────────        ──────────────────
 .blend / OB project                                   (kept as source —
   └─ export ─► model.p3d  ──┐                          never shipped)
                            │
 .tif / .png  ─ ImageToPAA ─┼─► binarize + pack ─►  PBO ─► loaded by DayZ
   └─► texture.paa          │     (pboProject /
                            │      Addon Builder)
 material.rvmat  ───────────┤
 config.cpp  ───────────────┘     .cpp ─► .bin
```

Two things are worth internalising up front:

- **You keep your editable sources.** The `.blend`/Object Builder project, the layered
  `.tif`/`.psd` textures, the MLOD `.p3d` — those never go into the shipped mod. You keep
  them so you can change the asset later. The PBO gets a *binarized* copy.
- **Packing is a one-way conversion.** Binarizing is a compile step. There is no supported
  way back, and de-binarizing other people's assets is **forbidden by the EULA** — see
  [MLOD vs ODOL](#mlod-vs-odol-the-one-distinction-to-get-right) below.

## The files an asset is made of

A typical item or world object is a handful of files that reference each other by path:

| File | What it is | Authored in | Covered in |
| --- | --- | --- | --- |
| `model.p3d` | The 3D model — all its [LODs](/asset-work/p3d-setup/), [selections](/asset-work/selections-and-naming/), and [memory points](/asset-work/memory-points/) | Object Builder / Blender | [P3D setup](/asset-work/p3d-setup/) |
| `model.rvmat` | The **material** — links the model's faces to textures and a shader | Text editor / Object Builder | [Materials (RVMAT)](/asset-work/materials-rvmat/) |
| `*_co.paa`, `*_nohq.paa`, … | The **textures** — colour, normal, specular maps | Image tool → ImageToPAA | [Textures](/asset-work/textures/) |
| `config.cpp` | Registers the asset and wires it to gameplay | Text editor | [Configs](/asset-work/configs/) |
| `model.cfg` | The model's skeleton/sections (only if it animates or swaps textures) | Text editor | [Configs](/asset-work/configs/) |

The reference chain runs **config → model → material → textures**:

```text
config.cpp ──model=──► model.p3d ──face material──► model.rvmat ──Stage texture──► *_co.paa
                                                                                    *_nohq.paa
                                                                                    *_smdi.paa
```

Every arrow is a path string, and **a wrong path fails quietly** — a grey model, an
untextured face, an item that won't spawn. Most "why is my asset broken" debugging is
chasing a broken link in that chain.

## How the formats relate

A quick tour of the file types, grouped by job. Each gets a full page later.

### Model — P3D

The model lives in a single **`.p3d`** file that holds *every* level of detail and helper
mesh: the visual mesh you see, the collision hull, the bullet-collision mesh, the named
points the engine reads, and so on. Those are its [LODs](/asset-work/p3d-setup/). One file,
many LODs — that's the thing newcomers find surprising. The
[P3D setup](/asset-work/p3d-setup/) page takes it apart.

### Material — RVMAT

A **`.rvmat`** is a small text file that says "shade these faces with *this* shader, using
*these* textures." It's the indirection layer between the model and its textures: the model
points at the RVMAT, the RVMAT points at the texture maps and picks a shader. Swapping a
material (for a damaged state, say) is just pointing a face at a different RVMAT. See
[Materials (RVMAT)](/asset-work/materials-rvmat/).

### Textures — TIF/PNG → PAA

You author textures in a normal image format (**`.tif`**, `.png`, `.tga`) and convert them
to **`.paa`**, the engine's compressed, mip-mapped texture format, with BI's `ImageToPAA`.
DayZ uses several **map types** — colour (`_co`), normal (`_nohq`), specular (`_smdi`) and
more — each encoding a different surface property. [Textures](/asset-work/textures/) covers
the map types and the conversion.

### Config — config.cpp (+ model.cfg)

**`config.cpp`** is the asset's registration card: it gives the asset a class name, points
at its model, sets gameplay properties, and slots it into the game's class hierarchy. A
**`model.cfg`** sits alongside the P3D and declares its skeleton and named sections — you
only need one if the model animates or swaps textures via
[hidden selections](/asset-work/selections-and-naming/). Both are
[Config](/asset-work/configs/) territory, and this is where asset work hands off to
[scripting](/scripting/overview/).

## MLOD vs ODOL: the one distinction to get right

The `.p3d` extension hides **two different formats**, and confusing them is the single most
common source of "why can't I open this model" trouble.

| | **MLOD** | **ODOL** |
| --- | --- | --- |
| Role | Editable **authoring** format | Binarized **runtime** format |
| Produced by | Your modeling tool (export) | The binarizer, during packing |
| Editable? | Yes — open it in Object Builder / Blender | No — engine-optimised, compressed |
| Where it lives | Your source folder (kept, not shipped) | Inside the shipped PBO |
| Both use… | `.p3d` | `.p3d` |

Think of it like source code versus a compiled binary that happen to share a file
extension. You **author in MLOD** and keep it forever; the pack step **binarizes MLOD →
ODOL** and that's what ships. The first four bytes of the file tell them apart — `MLOD`
versus `ODOL`.

:::caution[No de-binarization — it's an EULA matter]
Going ODOL → MLOD ("DeODOL", de-binarization) to recover an editable model from someone
else's shipped PBO is **against the DayZ EULA**, and this site won't document it. If you
need an editable source, keep your own MLOD, build from vanilla/original assets, or ask the
author. Reading the *script* files the tools extract for you is fine — that's a different
thing; the line is at de-binarizing binarized assets.
:::

The practical upshot: **back up your MLOD sources** (and your layered textures). If you
only have the ODOL in your PBO, you've painted yourself into a corner — there's no
supported way to get the editable model back.

## Where each page picks up

- [P3D setup](/asset-work/p3d-setup/) — inside the `.p3d`: what a LOD is, which ones an
  asset needs, and a static prop built end to end.
- [Proxies](/asset-work/proxies/) — attaching one model inside another (optics, muzzles,
  vehicle parts).
- [Selections & naming](/asset-work/selections-and-naming/) — the named vertex/face groups
  and the naming contract across model, config, and animations.
- [Memory points](/asset-work/memory-points/) — the named points the engine reads, per
  asset type.
- [Materials (RVMAT)](/asset-work/materials-rvmat/) and
  [Textures](/asset-work/textures/) — the look: shader, maps, and PAA packing.
- [Configs](/asset-work/configs/) — tying model + materials + gameplay together, with a 3D
  optic and a vehicle worked through.

## Related

- [Modding overview](/getting-started/modding-overview/#the-shape-of-a-mod-on-disk) — the mod-on-disk shape these files pack into.
- [Workbench setup](/getting-started/workbench-setup/) — installing the tools and the `P:` drive.
- [Packing](/tooling-setup/packing/) — the binarize-and-pack step that turns this into a PBO.
- [Game structure](/scripting/game-structure/) — the scripting-side analog of this page.
