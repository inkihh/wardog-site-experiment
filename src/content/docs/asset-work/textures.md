---
title: Textures
description: DayZ texture map types — CO, NOHQ, SMDI and friends — what each encodes, authoring conventions, and packing to PAA.
sidebar:
  order: 8
---

DayZ doesn't use one texture per surface — it uses a **set of maps**, each encoding a
different physical property: colour, surface bump, shininess, baked shadow. The
[RVMAT](/asset-work/materials-rvmat/) wires them into the shader; this page is about the maps
themselves — what each one stores, how to author it, and how to pack it into the engine's
**PAA** format.

It pairs closely with [Materials (RVMAT)](/asset-work/materials-rvmat/): the RVMAT references
these textures, so the two pages are two halves of "how a surface looks."

## The map types

DayZ identifies a texture's *role* by a **filename suffix**. The suffix isn't decoration — the
tools and conventions key off it (PAA compression is even chosen by suffix). The ones you'll
meet:

| Suffix | Map | Encodes |
| --- | --- | --- |
| `_co` | **Colour** (albedo) | The base colour, in RGB. Alpha = opacity where the surface is transparent. |
| `_nohq` | **Normal map** (high-quality) | Tangent-space surface direction in RGB (per-pixel "which way does this face?"); the **alpha channel carries a specular/gloss exponent**. |
| `_smdi` | **Specular map** | Where and how strongly the surface is glossy/metallic. Packed grayscale-style channels. |
| `_as` | **Ambient shadow** (AO) | Baked ambient occlusion — soft contact shadows in crevices. |
| `_dt` | **Detail** | Fine, tiled micro-detail layered over the colour. |
| `_mc` | **Macro / colour mask** | Broad masks — tinting regions, damage overlays. |
| `_ti` | **Thermal** | How the surface reads on thermal optics. |
| `_mask` | **Camo mask** | Region mask used to recolour a shared model for variants. |

`_co` and `_nohq` carry most of the look; `_smdi` is what makes metal read as metal. The rest
are polish or special-purpose.

:::note[The suffix is a contract]
`crate_co.paa` and `crate_nohq.paa` aren't just tidy names — the conversion tool picks the
right compression from the suffix, and the [RVMAT](/asset-work/materials-rvmat/) stages expect
each map in its slot. Name maps by their role.
:::

## What each channel means

Two maps are worth spelling out because their channels surprise people:

- **`_nohq` (normal).** RGB stores the surface normal direction (a "flat" normal is the famous
  `(128,128,255)` pale blue — pointing straight out). Crucially, in DayZ the **alpha channel of
  the NOHQ holds a specular power / gloss exponent**, so the normal map does double duty. A
  fully opaque alpha and a flat blue RGB is the neutral starting point.
- **`_smdi` (specular).** A packed map whose channels describe specular intensity / metalness /
  surface character rather than a literal colour. Bright = shiny/metallic, dark = matte. If your
  metal looks like plastic, the `_smdi` is usually the culprit (or it's missing entirely).

## Colour space: sRGB vs linear

This is the authoring detail people get wrong and then chase as a "lighting bug":

- **Colour (`_co`) is sRGB** — it's a picture meant to be *seen*, so it's stored in the
  gamma-encoded space your eyes and monitor expect.
- **Data maps (`_nohq`, `_smdi`, `_as`, masks) are linear** — they're *numbers* (directions,
  intensities, masks), not pictures, so they must **not** be gamma-corrected. Treating a normal
  map as sRGB skews every value and gives you subtly wrong lighting that's maddening to
  diagnose.

Author colour maps in sRGB and data maps as raw/linear data, and keep your image tool from
"helpfully" colour-managing the data maps.

## Resolution, ratios, and mips

The engine has hard constraints on texture dimensions:

- **Power-of-two dimensions** — 256, 512, 1024, 2048 (per side). A 1000×1000 texture is
  rejected; it has to be 1024×1024.
- **Square or 2:1** — `1024×1024` or `2048×1024`, not arbitrary rectangles.
- **Mind the cap** — keep individual textures to **2048** per side unless you have a clear
  reason; oversized textures cost memory for little visible gain on an item.
- **Mips are automatic** — the down-res chain (full size → … → 1×1) the engine uses at distance
  is generated during conversion. You don't author mips; you just author at the right base size.

Match resolution to how big the asset appears: a small item rarely needs 2048; a vehicle or a
hero weapon might. Bigger isn't better — it's just heavier.

## Packing to PAA

The engine loads textures as **`.paa`** — a compressed, mip-mapped format. You author in a
normal image format and convert:

```text
crate_co.png  (sRGB, 1024×1024)  ──┐
crate_nohq.png (linear)            ├─ ImageToPAA ─►  crate_co.paa
crate_smdi.png (linear)            ┘                 crate_nohq.paa
                                                     crate_smdi.paa
```

- **Author** in **`.tif`**, `.png`, or `.tga` (TIF is common from PBR tools; 16/32-bit TIFs
  must be reduced to 8-bit, and CMYK converted to RGB, before conversion).
- **Convert** with BI's **`ImageToPAA`** (part of DayZ Tools). It's headless and scriptable, and
  it picks the compression (DXT1 vs DXT5, etc.) from the suffix and alpha — which is another
  reason the `_co`/`_nohq` naming matters.
- Use **RGBA** sources for maps that need alpha (a `_co` with transparency, a `_nohq` carrying
  its spec exponent); RGB is fine for opaque maps.

The actual mechanics of running the converter and packing the PBO live in the tooling section —
see [Packing](/tooling-setup/packing/) and [Workbench setup](/getting-started/workbench-setup/).
This page is about getting the *source* maps right so the conversion has good input.

:::tip[If conversion fails, check dimensions first]
`ImageToPAA` returns an error (and often just produces nothing usable) on non-power-of-two
input or a bad aspect ratio. "My texture won't convert" is, nine times out of ten, a 1000×1000
that needs to be 1024×1024.
:::

## How textures are referenced from an RVMAT

The loop closes back at the [RVMAT](/asset-work/materials-rvmat/). The **colour** map is
referenced from the model's faces; the **other** maps are referenced by the RVMAT's stages:

```cpp
class Stage1 { texture = "MyMod\data\crate_nohq.paa"; uvSource = "tex"; };   // normal → Stage1
class Stage5 { texture = "MyMod\data\crate_smdi.paa"; uvSource = "tex"; };   // specular → Stage5
```

So a complete "look" for one surface is: a `_co` on the faces, a `_nohq` and `_smdi` (at least)
named in the RVMAT stages, all packed to `.paa`, all paths matching where they land in the PBO.
A wrong path here is the quiet "grey/untextured face" bug from the
[pipeline page](/asset-work/pipeline-and-formats/#the-files-an-asset-is-made-of).

## Related

- [Materials (RVMAT)](/asset-work/materials-rvmat/) — the stages that reference these maps and the shader that uses them.
- [Pipeline & formats](/asset-work/pipeline-and-formats/) — TIF/PNG → PAA in the wider pipeline.
- [Packing](/tooling-setup/packing/) — running ImageToPAA and binarizing into a PBO.
- [P3D setup](/asset-work/p3d-setup/) — the colour/material paths carried on Visual-LOD faces.
