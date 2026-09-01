# WF-CORE-004 — Release adaptive-layout APK

Status: LOCKED
Owner: WeekFlow

## Problem
The adaptive multiple-layout change is merged to `main`, but its merge commit has no associated native-build workflow run. There is therefore no signed, update-compatible APK containing the change.

## Desired behavior
Publish the next signed WeekFlow Alpha APK from current `main`, containing WF-CORE-003 and retaining the existing Android package and permanent signing identity.

## Scope
- Advance the visible app/package version from 0.3.11 to 0.3.12.
- Trigger the official native APK workflow.
- Publish and retrieve the signed standalone APK.

## Non-goals
- No product, data, navigation, Brain, Food, Move, Rest, Week or Now behavior changes.
- No Android package-name or persistence changes.

## Acceptance criteria
- [ ] AC1 — App and package metadata report version 0.3.12.
- [ ] AC2 — Package id remains `com.weekflow.app`; the workflow assigns a versionCode greater than the previous installed build.
- [ ] AC3 — Type checks and regression tests pass before native compilation.
- [ ] AC4 — The official workflow produces a signed standalone APK from the commit containing WF-CORE-003.
- [ ] AC5 — The APK is published as a downloadable artifact/release asset.

## Data / persistence impact
None. The same package and signing identity are retained so Android can update the installed app without clearing its data.

## UI / UX impact
None beyond the already merged adaptive layout described by WF-CORE-003.

## Edge cases / regressions
- Release signing secrets must be available to the official workflow.
- The build must not fall back to the debug signing key.
- The app package must remain unchanged.

## Verification plan
- Compare `app.json` and `package.json` versions.
- Run `npm run quality`.
- Inspect the GitHub Actions run, jobs and artifact.
- Confirm the release APK filename and availability.
