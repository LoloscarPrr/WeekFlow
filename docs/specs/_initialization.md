# TLC Initialization Snapshot

## Repository and ref
- LoloscarPrr/WeekFlow; main at 8c9b7617216839450b06ac70d67f292a082dc749.
- Resume PR #97, codex/wf-qa-003-keyboard-focus-scroll at a1417ae8f0007d20e9963203dc4c5b8c78e5dccf, reviewed 2026-09-25.
- Older uncommitted Move work in another checkout is stale and preserved untouched.

## App / build
- Release candidate 0.4.2, source versionCode 84; package com.weekflow.app.
- Workflow retains permanent signing and assigns monotonic versionCode 100000 + run number.

## Product context / active scope
- Attached Blueprint Maestro v3.3 reviewed: P0 stability, keyboard accessibility, persistent updates and shared canonical state take priority.
- Main already includes Food 0.4.1; resume WF-QA-003 only. No new Food/Move features or persistence changes.
- Relevant product decision weekflow-0.2.5-scope is historical; current ImportantEventCard is preserved as required by the active spec.

## Relevant specs and modules
- WF-QA-003 keyboard focus stability, LOCKED scope.
- Food, Semana/ImportantEventCard, TimeEditModal, MoveHome/MoveFeedback, RefreshableScrollView and keyboard regression tests reviewed.

## Baseline
- PASS: PR Quality #194 / run 36094821035 at a1417ae; dependency installation, TypeScript and full regressions succeeded.
- PASS: local Week/Food keyboard regression and global focus regression (12 TextInput files).
- PASS by diff inspection: no data/persistence/business-rule modifications; keyboard avoiding wrappers, native resize and on-drag dismissal retained.
- NOT RUN: Android 0.4.2 release, pending merge.
- UNAVAILABLE: physical-device keyboard interaction in this environment.

## Next action / constraints
- Record review evidence, integrate PR #97 and verify signed APK/AAB.
- Do not claim physical focus/visibility acceptance solely from static checks or CI.
