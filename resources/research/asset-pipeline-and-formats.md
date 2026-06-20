# Research: Asset pipeline & file formats

Grounding for `asset-work/overview.md` and `asset-work/pipeline-and-formats.md`.
Sources: local `dayz-items` skill (file-formats/*, research/dayz_item_pipeline.md), BI
Community Wiki. Learn-the-technique only — no class names/structure/assets copied.

## The round trip (authoring → pack → runtime)

- Author in **editable sources**: modeling-tool project (`.blend` / Object Builder),
  layered textures (`.tif`/`.psd`/`.png`), MLOD `.p3d`, plain-text `.rvmat` / `config.cpp`.
- **Pack step** (pboProject / Addon Builder / DayZ Tools `binarize`) converts:
  - MLOD `.p3d` → **ODOL** `.p3d` (binarized).
  - `config.cpp` → `config.bin`.
  - source images → `.paa` (via `ImageToPAA`; often run before pack).
- Output is a **PBO** the engine loads. Editable sources are **kept, not shipped**.
- Binarization is **one-way** and a compile step. No supported de-binarization.

## The files an asset is made of

| File | Role | Authored in |
| --- | --- | --- |
| `model.p3d` | 3D model: all LODs, selections, memory points | Object Builder / Blender |
| `model.rvmat` | Material: links faces → textures + shader | text / OB material editor |
| `*_co/_nohq/_smdi.paa` | Textures (colour/normal/specular…) | image tool → ImageToPAA |
| `config.cpp` | Registers asset, wires gameplay | text |
| `model.cfg` | Skeleton + named sections (only if animated / texture-swap) | text |

Reference chain: **config → model (`model=`) → material (face material path) → textures
(rvmat Stage textures + face colour path)**. Each arrow is a path string; a wrong path
fails **silently** (grey model, untextured face, item won't spawn).

## MLOD vs ODOL

- Both use the `.p3d` extension. First 4 bytes: `MLOD` vs `ODOL`.
- **MLOD** = editable authoring format (source/Memory-LOD format). Input to the binarizer.
  Openable in Object Builder and Blender Arma3ObjectBuilder.
- **ODOL** = binarized, engine-optimised, compressed. Runtime-only. DayZ uses ODOL v54
  (1.28+). Not human-readable; OB and the Blender addon **cannot** open it.
- **EULA**: ODOL→MLOD de-binarization (DeODOL) is forbidden — never document. (Reading the
  *script* files the tools extract is fine; that's a different operation.)
- Practical: keep MLOD + layered texture backups; if only the ODOL-in-PBO survives, the
  editable model is effectively lost.

## Notes / cautions

- MLOD coordinate quirks (Y/Z swap on disk, negated normals, inverted selection-weight
  bytes) are *binary-format* details handled by the tools — not something a page reader
  hand-edits. Mentioned only so "models rotated 90°/inverted" symptoms make sense; the
  page stays at the conceptual level.
- Tooling how-to (install DayZ Tools, P: drive, run ImageToPAA, pack PBO) is **out of
  scope** here → cross-link to Getting Started / Tooling & Setup.
