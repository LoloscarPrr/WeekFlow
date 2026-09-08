# WF-COMM-002 · Google Play public-preview build foundation

Status: DONE

## Source of truth

WeekFlow Blueprint Maestro v3.2 · Parte VII, especially C1 · Public Preview and decisions D-017 through D-020.

## Problem

WeekFlow currently produces a permanently signed standalone APK, but C1 requires a signed Android App Bundle (AAB) suitable for Google Play closed testing while keeping one package, one app and one update line. Purchases must remain disabled until distribution has been prepared and validated.

## Scope

- Extend the existing native Android release workflow to produce a signed release AAB alongside the standalone APK.
- Use the same permanent WeekFlow signing configuration already used by the APK.
- Keep Android package `com.weekflow.app` and the existing monotonic `versionCode` logic.
- Upload both APK and AAB as GitHub Actions artifacts.
- Publish both files to the existing versioned GitHub Release for easy retrieval.
- Add a repository checklist for the remaining C1 Play Console/public-preview tasks that cannot be validated from CI alone.
- Do not enable billing, subscriptions, purchases or Premium checkout.

## Out of scope

- Google Play Billing / purchase restoration.
- Price selection.
- Paywall activation.
- Play Console account changes performed outside the repository.
- Production launch.

## Acceptance criteria

1. The build still creates a signed standalone release APK.
2. The build creates a signed release AAB using the permanent WeekFlow release signing key.
3. APK and AAB use package `com.weekflow.app` and the same monotonic `versionCode` assigned by CI.
4. The workflow uploads a dedicated APK artifact and a dedicated AAB artifact.
5. The existing GitHub Release receives both APK and AAB without creating a second Free/Premium package.
6. `COMMERCIAL_CONFIG.billingEnabled` remains `false`.
7. A C1 checklist records Play listing, privacy, screenshots/iconography, closed testing, telemetry and real-device update validation as external/manual gates.
8. `npm run quality` remains green.
9. The merged `main` native build completes successfully and exposes both downloadable outputs.

## Verification plan

- PR quality gate: `npm run quality`.
- Review workflow diff for package/versionCode/signing invariants.
- After merge: verify `Build WeekFlow Native APK` succeeds on `main`.
- After merge: verify both APK and AAB artifacts exist for the same workflow run.
- Manual Play Console installation/update remains NOT RUN until the bundle is uploaded to a closed-testing track.

## Persistence / migration impact

None. No SQLite schema or user-data changes.

## UI impact

None. This slice prepares distribution only; it does not add a paywall or visually lock Premium features.

## Verification record

- AC1–AC5: PASS — merged `main` produces the signed standalone APK and signed Play AAB under one package and release tag.
- AC6: PASS — `COMMERCIAL_CONFIG.billingEnabled` remains `false`.
- AC7: PASS — `docs/commercial/google-play-public-preview-checklist.md` tracks every external C1 gate.
- AC8: PASS — local and merged `main` Quality workflows passed.
- AC9: PASS — the verified 0.3.15 Android release published both downloadable artifacts; its AAB validates as `com.weekflow.app`, target API 36, versionCode `100120`.
- Manual Play installation/update: BLOCKED — requires Play Console and a real Android device; it remains a C1 external gate.
