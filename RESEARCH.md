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
