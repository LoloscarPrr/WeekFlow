# WF-QA-004 — Keep the active field visible above the keyboard
Status: VERIFYING

## Problem and evidence
Video 1000142985.mp4 shows Semana's title hidden at the keyboard edge and Food pantry opening below the visible area. Removing scrollToEnd prevents the old jump but is insufficient to reveal an obscured input. Installed version is not visible in the recording.

## Scope / behavior
- Shared measured keyboard-aware ScrollView and TextInput, preserving native refs/events and input identity.
- Apply to Food, Semana/event title, Move profile/feedback and TimeEditModal; existing RefreshableScrollView consumers keep their refresh behavior.
- After focus, keyboard show/frame change or layout/content changes, measure the owned focused field and visible scroll viewport. Scroll only the minimum needed to reveal it with a small gap, bounded by content limits. Already-visible fields do not move.
- On Android, use existing native adjustResize; keep KeyboardAvoidingView for iOS without a second Android height adjustment.
- Cancel deferred corrections on keyboard hide, blur, drag and unmount; never blur/dismiss as a side effect of focus. No resetting to top/end when hiding the keyboard.
- Release 0.4.3 with unchanged package/signing and existing data.

## Non-goals
No redesign, business changes, migration, new native dependency or forcing screen-end scrolling. Other standalone modal/import form redesign is out of scope.

## Acceptance criteria
1. Geometry tests prove minimal correction for hidden fields, no movement for visible fields, bounds at content edges and stable behavior for oversized multiline fields.
2. Owned focused input is remeasured after keyboard/viewport changes; stale callbacks cannot move another field or unmounted screen. Manual drag cancels pending corrections.
3. Food pantry/manual entry, Semana title/break input, Move profile/feedback and time fields use the shared focus-aware input and scroll path; focus and native callbacks remain intact.
4. Android resize is the only height adjustment on affected forms; iOS retains avoidance; refresh and explicit save/cancel remain functional by inspection/regression.
5. Typecheck, full regressions and signed Android APK/AAB pass.
6. Physical test on Redmi: field visible, no jump to unrelated content, type/save succeeds, back/reopen/drag and repeated focus work. BLOCKED until user verifies candidate.

## Persistence and verification
No stored data or schema changes. Test geometry numerically and integration structure. Review callback cancellation and native event/ref forwarding. Verify exact commit in CI and signed release artifacts. Update WF-QA-003 evidence to reference the remaining visibility correction, without marking physical testing complete.

## Verification
- AC1 PASS: 14 numeric regressions cover visible/hidden fields, keyboard overlap, boundaries, invalid measurements, oversized input and repeated measurements.
- AC2 PASS by lifecycle review: per-container ownership, generation guard, native instance checks, ref cleanup and cancel on hide/blur/drag/unmount. Measurements use native scroll host and native input, not approximate page positions.
- AC3 PASS by integration regression and typecheck: all six input-bearing modules use the stable forwarded native input; all four scrolling form surfaces share the container.
- AC4 PASS by inspection and regression: native Android resize preserved, iOS padding preserved, forwarded refresh/onScroll/layout/events and explicit Save/Cancel retained. No storage/business changes.
- AC5 local PASS: npm run quality (TypeScript and full regression suite). CI and signed 0.4.3 artifacts PENDING.
- AC6 BLOCKED: needs physical re-test on candidate 0.4.3. Source video demonstrates old failure, not success of this change.

