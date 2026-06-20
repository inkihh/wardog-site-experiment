# Research: Materials (RVMAT) & textures (PAA)

Grounding for `asset-work/materials-rvmat.md` and `textures.md`. Sources: `dayz-items`
skill (file-formats/format-rvmat.md, format-paa.md, format-tif.md,
research/dayz_item_pipeline.md §RVMAT / §Texture Pipeline), BI Community Wiki.
Learn-the-technique only.

## RVMAT

- Plain-text, class-based. Links a model face → textures → shader. Face stores a **material
  path** (the rvmat) + a **colour texture path**; the rvmat names the *other* maps in its
  **stages** and picks the shader.
- Top-level params: `ambient[] diffuse[] forcedDiffuse[] emmisive[] specular[]`,
  `specularPower`, `PixelShaderID`, `VertexShaderID`.
  - **`emmisive`** (double-m) is the engine's spelling — `emissive` is silently ignored.
- **Super shader stages** (the workhorse), mapped to texture suffixes:
  - colour `_co` → referenced from the **face**, not a stage
  - Stage1 `_nohq` (normal), Stage2 `_dt` (detail), Stage3 `_mc` (macro/colour mask),
    Stage4 `_as` (ambient shadow), Stage5 `_smdi` (specular), Stage6 procedural fresnel,
    Stage7 `env_*` (environment).
  - Stages start at **1** (no Stage0). Backslash paths.
- **Procedural textures**: `#(argb,8,8,3)color(R,G,B,A,TYPE)` / `#(ai,..)fresnel(..)` =
  generated inputs (solid/flat/placeholder), not files.
- In practice you set colour (face) + normal (Stage1) + specular (Stage5); copy detail/mask/
  fresnel/env defaults from a vanilla material of the same kind.
- **Shader choice** changes which stages matter: `Super` for most lit surfaces; simpler
  `Normal`/`Basic` (+ `renderFlags[]` like `AddBlend`/`NoZWrite`, non-zero `emmisive[]`) for
  emissive/additive (screens, glow, sky); alpha-blend shader for glass.
- **Damage states**: swap the *whole rvmat* at health thresholds via config
  `healthLevels[] = { {1.0,{..}}, {0.7,..}, {0.5,{.._damage}}, {0.3,..}, {0.0,{.._destruct}} }`.
  Variants usually share layout (different Stage3 mask, lower `specularPower`).
- Starter recipes: matte = low spec, low specularPower (~20–40); metal = higher spec, high
  specularPower (~120+), real `_smdi`+`_nohq`; glass = transparent shader + env reflection;
  emissive = simpler shader + non-zero `emmisive` + AddBlend/NoZWrite.

## Textures & PAA

- Role identified by **filename suffix** (tools key off it):
  - `_co` colour/albedo (RGB; alpha = opacity)
  - `_nohq` normal (RGB direction; **alpha = specular/gloss exponent** — double duty; flat =
    `(128,128,255)` blue, opaque alpha)
  - `_smdi` specular (packed channels: intensity/metalness/character; bright=shiny)
  - `_as` ambient shadow/AO; `_dt` detail; `_mc` macro/colour mask; `_ti` thermal;
    `_mask` camo/variant region mask.
- **Colour space**: `_co` is **sRGB** (a picture); data maps (`_nohq`/`_smdi`/`_as`/masks)
  are **linear** (numbers — must not be gamma-corrected). Treating a normal map as sRGB =
  subtly wrong lighting.
- **Dimensions**: power-of-two per side (256/512/1024/2048), square or 2:1, ≤2048 advisable.
  Mips auto-generated on conversion. Match size to on-screen footprint.
- **PAA** = engine runtime texture (compressed DXT1/DXT5 + mip chain + tags). Author in
  `.tif`/`.png`/`.tga`; convert with BI **`ImageToPAA`** (headless, scriptable). Compression
  auto-picked from suffix/alpha. 16/32-bit TIF must drop to 8-bit; CMYK→RGB first.
  Non-power-of-two input fails (the usual "won't convert" cause).
- Referenced back from rvmat: colour from face; normal→Stage1, specular→Stage5, etc.
  A complete surface look = `_co` on faces + `_nohq`/`_smdi` in rvmat stages, all packed to
  `.paa`, all paths matching the PBO layout.
- Tooling how-to (running ImageToPAA, packing) → Tooling & Setup section (cross-link).
