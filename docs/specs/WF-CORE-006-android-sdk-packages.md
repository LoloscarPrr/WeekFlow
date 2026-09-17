# WF-CORE-006 · Android SDK package repair

Status: LOCKED

## TLC Initialization Snapshot
- Repository/ref: LoloscarPrr/WeekFlow, main at 36f71a69b7a40b22ef575eda0e4e261010357225.
- App/build: 0.3.19, source versionCode 74; CI assigns 100000 + run number. Expo ~57.0.8, React Native 0.86.0, Node 22.13, Java 17.
- Product context: Blueprint Maestro v3.2 reviewed; its historical version snapshot predates current main. Preserve current product behavior, minimal important events, keyboard repair and single signed APK/AAB update line.
- Relevant specs: WF-COMM-002 (APK/AAB distribution), WF-WEEK-003 (keyboard visibility). Existing initialization snapshot is historical; this session refreshes build context only.
- Baseline: FAIL — run 35111090473 fails at Setup Android SDK; subsequent quality/build steps skipped. Local tests NOT RUN; no app changes planned.
- Constraints: setup-android@v3 defaults to `tools platform-tools`; `tools` is obsolete. Command-line tools are installed separately by the action. Gradle resolves project SDK/build dependencies as before.
- Active spec: WF-CORE-006.

## Problem / desired behavior
Android setup requests the removed SDK package `tools`, preventing release builds. Explicitly request `platform-tools` while retaining action-managed command-line tools and the existing Gradle SDK resolution.

## Locked scope and non-goals
Only modify Setup Android SDK in .github/workflows/build-weekflow-native.yml. Add this required verification record. No application logic, UI, dependencies, version, signing, quality gates or release-output changes.

## Acceptance criteria
1. Setup explicitly requests `platform-tools` and never the standalone package `tools`.
2. Setup Android SDK succeeds on a new main build.
3. Existing release quality gate and Android build pass; Standalone APK artifact exists and is nonempty.
4. Existing AAB, signing, versionCode and publishing configuration is preserved; no application source changes.

## Impact / edge cases
No data, persistence, migration or UI/UX impact. Sibling screens are unaffected because application files are untouched. Regression checks cover the implicit action default and retained build/output steps.

## Verification plan
Review exact workflow diff; push main to trigger its existing Android workflow; inspect SDK, quality, build and upload steps plus artifacts. Record PASS or BLOCKED evidence below after the run.

## Verification record
Pending execution.
