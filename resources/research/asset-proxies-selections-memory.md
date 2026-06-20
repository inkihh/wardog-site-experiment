# Research: Proxies, selections & memory points

Grounding for `asset-work/proxies.md`, `selections-and-naming.md`, `memory-points.md`.
Sources: `dayz-items` skill (research/dayz_item_pipeline.md §Proxy System / §Named
Selections, file-formats/format-p3d-mlod.md §Named selections, pipeline/mlod-rules.md),
BI Community Wiki. Learn-the-technique only; weapon/vehicle point names below are the
engine's contract (vanilla), not another mod's assets.

## Named selections

- A selection = named group of vertices+faces inside **one LOD**. A vertex/face can be in
  several selections; selections carry per-vertex weights (0–1) used for skinning.
- **Per-LOD**: same name in Visual vs Fire Geometry = different geometry sharing a name. For
  consistent behaviour, create the same-named selection in **every participating LOD**
  (e.g. an animated `door` in Visual + Fire Geometry + Geometry).
- Two camps of names: **engine-fixed contracts** (`component01`, bone-named groups) vs
  **names you choose** (`camo`, `door`, `engine`) which must match wherever referenced.

### The naming contract (must match identically, case included)

- Hidden/texture-swap: P3D selection ↔ `model.cfg` `sections[]` ↔ `config.cpp`
  `hiddenSelections[]`.
- Animated: P3D selection ↔ `model.cfg` animation `selection=` (+ config `AnimationSources`
  if user/script-driven).
- Damage zones: Fire-Geometry selection name ↔ config damage system.
- **Case-sensitive** where it matters; a tool that force-lowercases on export breaks
  non-lowercase names (Blender A3OB `force_lowercase` must be False). Pick one casing
  convention (usually all-lowercase) and keep P3D/model.cfg/config byte-identical.
- `hiddenSelections[]`, `hiddenSelectionsTextures[]`, `hiddenSelectionsMaterials[]` are
  **parallel arrays** — index alignment required.
- Failures are **silent** (swap doesn't happen / part doesn't move). Debug = spell-check
  across files → check present in every needed LOD → check array indices → confirm survived
  packing.

## Proxies

- A proxy = a **single triangle** in a Visual LOD, in a selection named `proxy:\path.NNN`.
  Triangle isn't drawn; its 3 verts define an **oriented frame**: v0 = origin, v1/v2 = axes
  → position **and** rotation. Triangle references no texture/material.
- Selection name form: `proxy:\<p3d path relative to P:>.NNN` (3-digit index `.001`…).
  Multiple instances → incrementing indices. Engine resolves the path → renders the
  sub-model in the proxy frame.
- Object Builder's *Create Proxy* places/orients these visually.
- Use a proxy when the part is **swappable/optional** (optics, muzzle, light; vest pouches;
  vehicle wheels & removable parts). **Bake in** when permanent/never-swapped.
- Swappable attachments are filled via config attachment **slots** (not a hard path in the
  selection); fixed decorative sub-models can name the model directly.
- Pitfalls: broken `proxy:\` path (silent), duplicate/missing index, proxy missing from a
  lower Visual LOD (attachment vanishes at distance), mis-oriented triangle (part rotated),
  attachment's own origin/memory points wrong (offset that's the *sub-model's* fault).

## Memory points

- A memory point = a **one-vertex selection** in the **Memory LOD** (points, no faces). Name
  = engine's key; vertex position = the answer. Script reads `GetMemoryPointPos("name")`,
  but most points are read by the **engine itself** by convention.
- **Items** (common helpers): `autocenter`, `boundingbox_min`/`boundingbox_max`, `invview`
  (inventory-preview camera), `ce_center`/`ce_radius` (Central Economy bounds). Exact set
  depends on base class.
- **Weapons** (vanilla/engine names, some historic Czech — they ARE the contract):
  - `usti hlavne` — muzzle end (projectile spawn, muzzle flash).
  - `konec hlavne` — barrel start (with `usti hlavne` defines barrel axis/direction).
  - `nabojnicestart` / `nabojniceend` — shell-ejection trajectory.
  - `eye` — aiming-eye point (iron sight / optics alignment).
  - Plus moving-part selections (bolt/trigger/hammer/magazine) and optic/muzzle/light proxy
    slots.
- **Vehicles**: names follow the **vanilla car base you inherit** (`Car`/`CarScript` family) —
  categories: wheel axis/position (+ wheel selection & proxy), light positions (head/brake/
  reverse, L/R), exhaust emit point, driver/cargo seat references. **Open the vanilla car
  and copy the name set**; don't invent.
- "How do I know which?" → defined by **base class**; open the matching vanilla model's
  Memory LOD (after Extract Game Data) to read the names. Verify *placement* not just
  presence: a point at (0,0,0) = named-but-never-moved; "muzzle flash from the stock" =
  mis-placed, not missing.
- MLOD binary detail (handled by tools, not page readers): a selection's TAGG data is
  `nPoints` weight bytes + `nFaces` flag bytes; memory point = 1-point selection; for
  OB-authored DayZ models the 3 point floats read in file order as `(X, Y-up, Z)` match
  runtime `GetMemoryPointPos` (no swap/negation). `dayz-items/scripts/mlod_inspect.py`
  implements this.
