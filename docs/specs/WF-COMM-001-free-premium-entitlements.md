# WF-COMM-001 — Free/Premium entitlement foundation

Status: LOCKED

## Problem statement
WeekFlow Blueprint Maestro v3.2 approves a Free/Premium commercial architecture inside one app and one codebase. The repository already has an initial entitlement map, but the commercial contract needs to be explicit and fail-safe before any Google Play Billing activation.

A product-flavor split into separate Free/Premium APKs would contradict the canonical product decision and fragment the update line.

## Desired behavior
- WeekFlow remains one app, one package (`com.weekflow.app`) and one release/update line.
- Free capabilities remain available regardless of Premium entitlement state.
- Premium capabilities require an active, non-expired Premium entitlement.
- Invalid/unknown Premium expiry metadata must fail closed for Premium access rather than accidentally granting it.
- Billing remains disabled during this foundation step.
- The commercial layer exposes a structured access decision suitable for future UI/paywall and Google Play integration without coupling feature code to billing details.

## Scope
- Harden `src/commercial/entitlements.ts`.
- Add an access-decision API that reports whether access is allowed, required tier, and reason.
- Keep the canonical Free/Premium feature catalog aligned with Blueprint v3.2.
- Expand regression tests for Free preservation, Premium expiry and malformed entitlement metadata.

## Non-goals
- No Google Play Billing purchase or restore flow.
- No subscription pricing decision.
- No separate Free/Premium package, flavor or APK.
- No account/backend entitlement validation.
- No visual paywall or screen-level lock in this spec.
- No persistence or database migration.

## Acceptance criteria
1. `COMMERCIAL_CONFIG.billingEnabled` remains `false`.
2. Package/release architecture remains single-app; no Free/Premium Android product flavors or package IDs are introduced.
3. All canonical Free features remain accessible with the default Free entitlement.
4. Premium features are inaccessible with the default Free entitlement.
5. Active, non-expired Premium entitlement grants Premium features.
6. Inactive Premium entitlement does not grant Premium features.
7. Expired Premium entitlement does not grant Premium features and never blocks Free features.
8. Malformed/invalid Premium expiry fails closed for Premium features.
9. Access-decision API reports `allowed`, `requiredTier`, and a stable reason that future UI/billing layers can consume.
10. Commercial regression tests cover criteria 1 and 3–9.

## Data / persistence impact
NONE. Entitlements remain an in-memory domain contract in this step. Existing user data and SQLite schemas are untouched.

## UI / UX impact
NONE in this spec. No current screen is locked or visually changed. This intentionally avoids regressing the current alpha while preparing the commercial contract.

## Edge cases / regressions to check
- Free entitlement with `active: false` must still retain Free features because Free is not a purchased entitlement.
- Premium entitlement with a past expiry must fail Premium access.
- Premium entitlement with an unparsable expiry string must fail Premium access.
- Premium entitlement without an expiry may be treated as active while `active: true` (supports future one-time purchase or non-expiring grant).
- A failed/expired Premium state must not block user-created data or Free core capabilities.

## Verification plan
- Run `npm run quality` in CI.
- Confirm `tests/commercial-entitlements.test.ts` passes.
- Review `app.json` and release workflow to confirm only `com.weekflow.app` / single APK path remains.
- Compare implementation against each acceptance criterion before marking DONE.

## Verification record
Pending implementation.
