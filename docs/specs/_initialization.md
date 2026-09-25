# TLC Initialization Snapshot

## Repository and ref
- LoloscarPrr/WeekFlow; main includes WeekFlow 0.4.2 keyboard-focus fix and product spec NTF-05.
- Blueprint Maestro v3.4 approved 2026-09-25.
- Older uncommitted Move work in another checkout is stale and preserved untouched.

## App / build
- Release candidate 0.4.2, source versionCode 84; package com.weekflow.app.
- Workflow retains permanent signing and assigns monotonic versionCode 100000 + run number.
- Physical Android acceptance and signed 0.4.2 APK/AAB verification remain required.

## Product context / active scope
- P0 stability, keyboard accessibility, persistent updates and shared canonical state remain the current execution priority.
- Commercial boundary is now canonical: Free keeps complete manual control of nuclear planning/data; Premium activates WeekFlow Brain/IA, text/voice, automation and advanced adaptation.
- Notifications may act as Día Vivo controls. Catalog NTF-05 defines “Aún no salgo” / “Voy saliendo” / “Ya voy en camino” as manual quick actions; intelligent impact/replanning is Premium.
- NTF-05 is PLANIFICADO for 0.8.x. Recording the decision does not authorize skipping current roadmap gates.

## Relevant specs and modules
- WF-QA-003 keyboard focus stability.
- WF-NTF-05 departure notification actions.
- Canonical commercial decisions D-026 and D-027 from Blueprint Maestro v3.4.
- Food, Semana/ImportantEventCard, TimeEditModal, MoveHome/MoveFeedback, RefreshableScrollView and keyboard regression tests remain relevant to 0.4.2 acceptance.

## Baseline
- PASS: Quality #194 / run 36094821035 for the 0.4.2 keyboard fix; TypeScript and full regression suite succeeded.
- PASS: local Week/Food keyboard regression and global focus regression.
- PASS by diff inspection: 0.4.2 does not change persistence/business rules.
- PENDING: signed Android 0.4.2 release verification and physical-device keyboard interaction.
- ROADMAP ONLY: NTF-05 / D-026 / D-027 are documented but not implemented in the app yet.

## Next action / constraints
- Close Android 0.4.2 signed build + physical keyboard acceptance before expanding scope.
- Preserve one source of truth: notification actions write the same ActualEvent/state used by Ahora/Semana/Brain.
- Free must remain usable manually if Premium, network or AI services are unavailable.
- Do not allow autonomous changes to fixed commitments; relevant impact requires confirmation.
