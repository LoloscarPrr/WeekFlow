# TLC Initialization Snapshot

## Repository and ref
- Repository: LoloscarPrr/WeekFlow.
- Main includes WeekFlow 0.4.2 keyboard-focus fix plus Blueprint Maestro v3.4 product decisions and NTF-05.
- Active QA branch: codex/wf-qa-004-keyboard-visibility.
- Blueprint Maestro v3.4 approved 2026-09-25.
- Older uncommitted Move work in another checkout is stale and preserved untouched.

## App / build
- WeekFlow 0.4.2 / source versionCode 84; package com.weekflow.app.
- Android release #151 PASS on 891499a; workflow assigned versionCode 100151 and generated signed APK + AAB with permanent signing.
- Main Quality #196 PASS for 0.4.2.
- Physical Android evidence after 0.4.2 shows an active input can still remain below the visible viewport when the keyboard opens; removing unconditional scrollToEnd fixed the old jump but did not fully guarantee field visibility.
- Release candidate 0.4.3 addresses measured active-field visibility without adding native dependencies.

## Product context / active scope
- P0 stability, keyboard accessibility, persistent updates and shared canonical state remain the current execution priority.
- Commercial boundary is canonical: Free keeps complete manual control of nuclear planning/data; Premium activates WeekFlow Brain/IA, text/voice, automation and advanced adaptation.
- Notifications may act as Día Vivo controls. Catalog NTF-05 defines “Aún no salgo” / “Voy saliendo” / “Ya voy en camino” as manual quick actions; intelligent impact/replanning is Premium.
- NTF-05 is PLANIFICADO for 0.8.x. Recording the decision does not authorize skipping current roadmap gates.

## Relevant specs and modules
- WF-QA-003 keyboard focus stability: code regression PASS; physical acceptance exposed the remaining visibility issue.
- WF-QA-004 measured keyboard field visibility: active P0 QA correction for 0.4.3.
- WF-NTF-05 departure notification actions: roadmap only.
- Canonical commercial decisions D-026 and D-027 from Blueprint Maestro v3.4.
- Relevant input surfaces: Food, Semana/ImportantEventCard, MoveHome/MovePlan/MoveFeedback, TimeEditModal, RefreshableScrollView and shared keyboard visibility utilities.

## Baseline
- PASS: 0.4.2 Quality #196 and Android #151; signed APK + AAB generated.
- PASS: WF-QA-004 local TypeScript + regression suite and PR Quality #197 at cadee26.
- FAIL / physical evidence for 0.4.2: important-event title or Food pantry can remain obscured by the keyboard; repeated open/close can alter visible layout.
- PENDING: integrate WF-QA-004, generate signed Android 0.4.3 APK/AAB and re-test physically on Android.
- ROADMAP ONLY: NTF-05 / D-026 / D-027 are documented but not implemented in the app yet.

## Next action / constraints
- Integrate WF-QA-004 only after preserving Blueprint v3.4/NTF-05 documentation.
- Verify Quality and signed Android 0.4.3 build after merge.
- Physical re-test must confirm the focused field stays visible in Food pantry/manual entry, Semana important-event title, TimeEditModal fields and Move feedback.
- Preserve native input focus, saved data, explicit Save/Cancel, manual drag dismissal, refresh behavior and permanent signing.
- Preserve one source of truth: future notification actions write the same ActualEvent/state used by Ahora/Semana/Brain.
- Free must remain usable manually if Premium, network or AI services are unavailable.
- Do not allow autonomous changes to fixed commitments; relevant impact requires confirmation.
