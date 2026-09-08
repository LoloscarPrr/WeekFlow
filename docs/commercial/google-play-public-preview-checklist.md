# WeekFlow · C1 Google Play Public Preview checklist

Canonical source: Blueprint Maestro v3.2 · Parte VII · C1 Public Preview.

## Repository / CI gates

- [x] One Android package only: `com.weekflow.app`.
- [x] Permanent release signing already used by the standalone APK workflow.
- [x] Monotonic CI `versionCode` retained.
- [x] Free/Premium entitlements exist in one codebase.
- [x] Billing remains disabled during distribution preparation.
- [x] Workflow configured to build signed APK + signed AAB.
- [x] `main` build verified green after WF-COMM-002 merge.
- [x] APK and AAB artifacts verified downloadable from the same successful 0.3.15 build.
- [x] Public privacy-policy source added and linked from the app.
- [x] Crashlytics is optional and off by default; unused FCM auto-init is disabled.
- [x] Play Data safety answers drafted from observed 0.3.16 behavior.
- [x] Spanish (Chile) store-listing copy drafted without future-feature claims.
- [x] Unused Android overlay permission blocked in Expo configuration.

## Play Console / external gates

These require the Google Play Console or real-device validation and are not considered complete from repository CI alone.

- [ ] Create/confirm the WeekFlow app in Play Console with package `com.weekflow.app`.
- [ ] Configure Play App Signing without replacing the established WeekFlow update identity unexpectedly.
- [ ] Upload the signed AAB to a closed-testing track.
- [ ] Paste and review the prepared name, descriptions and category in Play Console.
- [ ] Upload canonical iconography and real 0.3.16 screenshots from the locked WeekFlow visual identity.
- [ ] Attach the public privacy-policy URL and confirm it opens without authentication.
- [ ] Submit the prepared data-safety declarations against the exact uploaded AAB.
- [ ] Confirm the optional Crashlytics declaration matches Play's detected SDK list.
- [ ] Install from the closed-testing Play track on a real Android device.
- [ ] Update a previous WeekFlow build through Play without uninstalling.
- [ ] Verify existing SQLite data survives the Play-delivered update.
- [ ] Exercise the full Free flow with no network where the current Core is expected to remain offline-first.
- [ ] Confirm no Premium purchase/checkout is exposed while `billingEnabled` is false.

## C1 exit condition

C1 is complete only when installation/update from Google Play closed testing works, the Free flow remains complete and stable, existing data is preserved, and the repository + Play external gates above have evidence.

C2 Monetization must not start before those distribution gates are validated.
