---
title: Materials (RVMAT)
description: The RVMAT material format — how it links a model to its textures and shader, the stages you actually touch, and starter setups.
sidebar:
  order: 7
---

An **RVMAT** (Real Virtuality Material) is a small text file that decides *how a surface looks*:
which shader lights it, which [textures](/asset-work/textures/) feed that shader, and how shiny,
self-lit, or reflective it is. It's the layer between the model and its textures — the model's
faces point at an RVMAT, the RVMAT points at the texture maps.

This page assumes you've seen where materials sit in the
[pipeline](/asset-work/pipeline-and-formats/#material--rvmat) and have a model whose faces need
shading. RVMATs are plain text, so you can write them in any editor (Object Builder also has a
material editor).

## How an RVMAT links model → textures → shader

Three things meet in an RVMAT:

```text
 model.p3d face ──material──► model.rvmat ──┬─ PixelShaderID / VertexShaderID  (which shader)
                                            ├─ Stage1 texture ─► *_nohq.paa    (normal)
                                            ├─ Stage5 texture ─► *_smdi.paa    (specular)
                                            └─ ambient/diffuse/specular …      (lighting params)
```

Each face in a Visual LOD stores a **material path** (the `.rvmat`) next to its **texture
path** (the colour map). The RVMAT then names the *rest* of the texture maps it needs in its
**stages**, and picks the shader. So the colour map is referenced from the face; the normal,
specular, and friends are referenced from the RVMAT.

A direct consequence: to change how a surface looks — a damaged state, a different finish — you
point the face at a **different RVMAT**. That's exactly how damage states work (more below).

## The shape of an RVMAT

An RVMAT is a set of top-level lighting parameters followed by numbered texture **stages**:

```cpp
ambient[]       = {1.0, 1.0, 1.0, 1.0};   // ambient colour multiplier (RGBA)
diffuse[]       = {1.0, 1.0, 1.0, 1.0};   // diffuse colour multiplier
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};   // extra diffuse, ignores lighting
emmisive[]      = {0.0, 0.0, 0.0, 1.0};   // self-illumination  (note the spelling!)
specular[]      = {0.3, 0.3, 0.3, 1.0};   // specular highlight colour
specularPower   = 80;                     // highlight tightness (higher = sharper)

PixelShaderID   = "Super";
VertexShaderID  = "Super";

class Stage1 { texture = "MyMod\data\crate_nohq.paa"; uvSource = "tex"; };   // normal
class Stage2 { texture = "#(argb,8,8,3)color(0.5,0.5,0.5,1,DT)"; uvSource = "tex"; };   // detail
class Stage3 { texture = "#(argb,8,8,3)color(0,0,0,0,MC)"; uvSource = "tex"; };         // macro/colour mask
class Stage4 { texture = "#(argb,8,8,3)color(1,1,1,1,AS)"; uvSource = "tex"; };         // ambient shadow
class Stage5 { texture = "MyMod\data\crate_smdi.paa"; uvSource = "tex"; };   // specular
class Stage6 { texture = "#(ai,64,64,1)fresnel(2.62,0.8)"; uvSource = "none"; };        // fresnel
class Stage7 { texture = "dz\data\data\env_land_co.paa"; uvSource = "tex"; };           // environment
```

:::caution[`emmisive`, not `emissive`]
The self-illumination field is spelled **`emmisive`** — a long-standing engine typo. The
correctly-spelled `emissive` is silently ignored. This trips up nearly everyone once.
:::

A few notes that save confusion:

- **Stages start at 1.** There is no `Stage0`.
- **Paths use backslashes**, consistent with the rest of BI config.
- **Procedural textures** — the `#(argb,8,8,3)color(…)` and `#(ai,…)fresnel(…)` strings are
  *generated* textures, not files. They're how you supply a flat/solid input for a stage
  without authoring an image (handy for a uniform detail or a placeholder).

## The stages, mapped to texture types

For the **Super** shader (the workhorse for DayZ items), the stages have conventional jobs that
line up with the [texture map types](/asset-work/textures/):

| Stage | Texture type | What it does |
| --- | --- | --- |
| (face) | `_co.paa` | **Colour/albedo** — referenced from the face, not a stage. |
| Stage1 | `_nohq.paa` | **Normal map** — surface bump/detail and (in alpha) a spec exponent. |
| Stage2 | `_dt.paa` | **Detail** — fine tiled micro-detail. |
| Stage3 | `_mc.paa` | **Macro / colour mask** — broad tinting or damage masks. |
| Stage4 | `_as.paa` | **Ambient shadow** — baked occlusion. |
| Stage5 | `_smdi.paa` | **Specular map** — where and how strongly the surface is glossy/metallic. |
| Stage6 | procedural | **Fresnel** — edge reflectivity falloff. |
| Stage7 | `env_*.paa` | **Environment** — the reflection the surface samples. |

You rarely touch all seven by hand. In practice you set the **colour** (on the face), the
**normal** (Stage1), and the **specular** (Stage5), and leave the detail/mask/fresnel/env stages
at sensible defaults copied from a vanilla material of the same kind. The
[Textures](/asset-work/textures/) page covers what each map encodes.

## Super-shader vs other shaders

`PixelShaderID`/`VertexShaderID` pick the shader, and that choice changes which stages matter:

- **`Super`** — the standard PBR-ish lit shader for most solid surfaces (gear, props, weapons,
  vehicles). The seven-stage layout above is its pipeline.
- **`Normal` / `Basic`** and friends — simpler shaders for special cases. An **emissive/glowing**
  or **additive** surface (a screen, an aurora, a light source) often uses a simpler shader with
  `renderFlags[]` like `AddBlend`/`NoZWrite` and a non-zero `emmisive[]`, and ignores most
  stages.
- **Glass/transparent** surfaces use a shader and render flags suited to alpha blending.

When in doubt, start from the vanilla material of the closest surface type and adjust — the
shader IDs and render flags are easy to get subtly wrong from scratch.

## Damage states

DayZ items change material as they take damage, by swapping the *whole RVMAT* at thresholds.
You author a pristine, a damaged, and a destroyed variant (often the same stages with a
different macro/damage mask in Stage3 and a lower `specularPower`), and the config's damage
system lists which RVMAT applies at which health level:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\crate.rvmat"}},          // pristine
    {0.7, {"MyMod\data\crate.rvmat"}},
    {0.5, {"MyMod\data\crate_damage.rvmat"}},   // worn
    {0.3, {"MyMod\data\crate_damage.rvmat"}},
    {0.0, {"MyMod\data\crate_destruct.rvmat"}}  // ruined
};
```

That block lives in the config — see [Configs](/asset-work/configs/). The material side is just
"make three RVMATs that share a layout."

## Starter setups

Concrete points to start from, then tune `specular`/`specularPower`/`emmisive`:

| Look | Shape it from |
| --- | --- |
| **Matte** (cloth, wood, rubber) | Super shader, low `specular` (e.g. `{0.1,0.1,0.1,1}`), low `specularPower` (~20–40), flat or real `_smdi`. |
| **Metal** (gun parts, vehicle panels) | Super shader, higher `specular`, high `specularPower` (~120+), a real `_smdi` marking the metal, a real `_nohq`. |
| **Glass** | A transparent-capable shader, low diffuse, strong `specular`, environment reflection, appropriate render flags. |
| **Emissive** (screens, lights, glow) | Simpler shader (`Normal`/`Basic`), non-zero `emmisive[]`, often `AddBlend`/`NoZWrite` render flags, most stages unused. |

:::tip[Crib from a vanilla material of the same kind]
The fastest way to a correct RVMAT is to open the vanilla material for the *same kind of
surface* (a vanilla metal part for a gun, a vanilla cloth for a vest), learn how its stages and
parameters are set, and rebuild your own with your textures. Learn the recipe; don't ship their
file or textures.
:::

## Related

- [Textures](/asset-work/textures/) — the map types the stages reference, and how they're authored and packed.
- [Pipeline & formats](/asset-work/pipeline-and-formats/) — where RVMAT sits in the asset chain.
- [P3D setup](/asset-work/p3d-setup/) — assigning a material to Visual-LOD faces.
- [Configs](/asset-work/configs/) — the `healthLevels` damage-state wiring.
