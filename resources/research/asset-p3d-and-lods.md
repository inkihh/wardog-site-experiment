# Research: P3D, LODs, geometry & mass

Grounding for `asset-work/p3d-setup.md`. Sources: `dayz-items` skill
(file-formats/format-p3d-mlod.md, research/dayz_item_pipeline.md §LOD Requirements,
pipeline/mlod-rules.md), BI Community Wiki (LOD types). Learn-the-technique only.

## Core idea

A `.p3d` is **one file, many meshes**. Each mesh is a **LOD** with a *type* telling the
engine its job. In Object Builder the LOD list is this stack. Internally each LOD has a
"resolution" float; visual LODs use small increasing numbers, special LODs use fixed large
values (Geometry ≈ 1e13, Memory ≈ 1e15, Shadow ≈ 1e4). Work by **type name**, not numbers.

## LOD types (by job)

| Type | Job |
| --- | --- |
| Resolution / Visual (0,1,2…) | The visible mesh; lower LODs shown at distance (~½ tris each step). LOD 0 = full detail. Faces carry texture + rvmat path. |
| Geometry | Physics/collision hull. **Must be convex** (or split into convex `componentNN` selections). Carries **mass**. |
| Fire Geometry | Bullet/melee collision. Often a copy of Geometry. Damage zones = selections here. |
| View Geometry | AI line-of-sight / camera occlusion. Simplified. |
| Memory | Named **points** (no faces) the engine reads. |
| Shadow Volume | Shadow-casting mesh (simplified, closed). |
| Roadway | Walkable/standable surfaces (vehicle roof, building floor). |
| View Pilot/Cargo/Gunner | First-person vehicle interior meshes. |
| Land Contact | Ground-contact points (wheel bottoms) for resting. |
| Paths | AI pathfinding through interiors. |

## Geometry / mass / collision rules

- Convexity is mandatory; concave shape → multiple `component01`, `component02`, …
  selections, each treated as one convex piece. Geometry needs ≥1 component.
- Mass lives on the Geometry LOD (per-vertex distribution). Drives falling/shoving.
- Keep Geometry low-poly (dozens–hundreds of faces). High-poly = perf trap + less stable.
- Properties on Geometry: `autocenter = 0` (stop re-pivot on bounding box); `lodnoshadow = 1`
  on visuals if no Shadow LOD.

## Minimum LOD set by asset type

- **Static prop / item**: Visual 0 + Geometry + Memory (add Shadow + a lower Visual).
- **Weapon**: Visuals + Geometry + Fire Geometry + Memory (muzzle/eye) + moving-part
  selections.
- **Vehicle**: Visuals + Geometry + Fire Geometry + View Geometry + Roadway + Land Contact +
  Memory (wheels/lights) + View Pilot/Cargo.
- **Building**: Visuals + Geometry + Fire Geometry + View Geometry + Roadway + Paths + Memory.
- Rule of thumb: the more the player interacts (walk on / shoot / sit in / path through), the
  more special LODs.

## Static-prop worked example (the page's walkthrough)

Blocky `woodcrate.p3d` (original asset): Visual 0 (+ Visual 1), Geometry (1 convex box,
`component01`, mass ~30 kg, `autocenter=0`), Fire Geometry (copy of Geometry), Shadow Volume,
Memory (bounding/centre helpers). Config: inherit `HouseNoDestruct`, `scope=2`, `model=`.

## Common failure → cause

- Invisible → no Visual 0 / faces lack texture+material.
- Falls through / no collision → no Geometry, not convex, or no `componentNN`.
- Can't be shot → no Fire Geometry.
- Jumps/re-centres on spawn → missing `autocenter=0`.
- No shadow / shadow warning → no Shadow Volume and no `lodnoshadow=1`.
- Config can't find model → `model=` path mismatch, or CfgModels class name ≠ p3d filename.
