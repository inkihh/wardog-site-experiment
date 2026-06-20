## Research

- If you feel that something may be helpful in the future, document it as research
- **Learn the technique, don't copy the code.** Understand *what* they do and *why* it works, then write our own implementation from scratch.
- Never copy class names, variable names, function names, or code structure from other mods.
- Never reference assets (p3d, rvmat, textures) from other mods — create our own or use vanilla assets. If neither is available, stop and inform me.
- Document findings in `resources/research/<topic>.md` as reference material, not as code to transplant.
- Link to those outcomes in this file.

## Outcomes

- [onboarding-modding-overview.md](resources/research/onboarding-modding-overview.md) — bird's-eye map of DayZ modding (scripting vs. asset work, mod-on-disk shape, toolchain, learning curve). Grounds `getting-started/modding-overview.md`.
- [onboarding-workbench-setup.md](resources/research/onboarding-workbench-setup.md) — DayZ Tools / Workbench install, the `P:` work drive, game-data extraction, project layout, sanity checks, common pitfalls. Grounds `getting-started/workbench-setup.md`.
- [scripting-enscript-basics.md](resources/research/scripting-enscript-basics.md) — EnScript type system, classes/inheritance, the `modded class` injection model, `ref`/`autoptr` ownership intro, modules, and syntax surprises. Grounds `scripting/enscript-basics.md`.
- [scripting-common-gotchas.md](resources/research/scripting-common-gotchas.md) — the client/server split, reference-counting mistakes, null handling, load order & config/script merge surprises, `modded class` pitfalls. Grounds `scripting/common-gotchas.md`.
- [scripting-game-structure.md](resources/research/scripting-game-structure.md) — the script module layers (`1_Core`→`5_Mission`), the access rule, how the engine finds/compiles scripts via CfgMods, and merge/override resolution. Grounds `scripting/game-structure.md`.
- [scripting-engine-subsystems.md](resources/research/scripting-engine-subsystems.md) — inventory & attachments, the action system, networking/RPC & net-sync, and persistence (save system vs. Central Economy). Grounds the `scripting/engine-subsystems/` overview + four subsystem pages.
- [asset-pipeline-and-formats.md](resources/research/asset-pipeline-and-formats.md) — the authoring→pack→runtime round trip, the files an asset is made of and their reference chain, and the MLOD vs ODOL distinction (with the EULA line). Grounds `asset-work/overview.md` + `asset-work/pipeline-and-formats.md`.
- [asset-p3d-and-lods.md](resources/research/asset-p3d-and-lods.md) — what a P3D/LOD is, the LOD types and their jobs, geometry/mass/collision rules, the minimum LOD set per asset type, and the static-prop walkthrough. Grounds `asset-work/p3d-setup.md`.
- [asset-proxies-selections-memory.md](resources/research/asset-proxies-selections-memory.md) — named selections and the cross-file naming contract, proxies (oriented placement triangles), and memory points by asset type (item/weapon/vehicle). Grounds `asset-work/proxies.md`, `selections-and-naming.md`, `memory-points.md`.
- [asset-materials-and-textures.md](resources/research/asset-materials-and-textures.md) — RVMAT shader/stages and the texture-slot mapping, damage-state material swaps, the texture map types (CO/NOHQ/SMDI…), sRGB-vs-linear, and PAA packing. Grounds `asset-work/materials-rvmat.md` + `textures.md`.
- [asset-configs.md](resources/research/asset-configs.md) — `config.cpp` wiring, the inherit-a-vanilla-base/override-little discipline, how config references selections/memory points/proxies, the 3D-optic and vehicle worked examples, and the config↔scripting seam. Grounds `asset-work/configs.md`.
