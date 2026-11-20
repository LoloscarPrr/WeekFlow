# WeekFlow — OWASP MASVS security baseline (2026-11-19)

**State:** preliminary evidence inventory, NOT a security attestation or an OWASP certification.

Reference: [OWASP MASVS](https://mas.owasp.org/MASVS/) / [MASTG](https://mas.owasp.org/MASTG/). Automatic npm advisory scanning is only a small part of a mobile security assessment.

| Control group | What matters in WeekFlow | Evidence available now | Status / next action |
| --- | --- | --- | --- |
| MASVS-STORAGE | SQLite stores calendar, habits, nutrition and training profile | Local-first SQLite exists; encryption-at-rest not proven | **NOT VERIFIED:** classify sensitive data, inspect backups, encryption and lock-screen exposure |
| MASVS-CRYPTO | Correct cryptography, key lifecycle and secret management | Android release signing is restored from GitHub Actions secrets | **PARTIAL:** key existence is not proof of cryptographic control; review embedded config/keys |
| MASVS-AUTH | Firebase authentication and session access | Firebase Auth is a dependency; account flows have tests | **NOT VERIFIED:** assess login, logout, revocation and authorization in actual app/backend |
| MASVS-NETWORK | TLS, API authentication, remote Brain/vision endpoints | Public endpoint variables exist, and network services are optional | **NOT VERIFIED:** verify HTTPS, backend authentication, TLS and sensitive request handling |
| MASVS-PLATFORM | Android permissions, intents, notifications and imported files | Exact alarms permissions and file imports implemented | **NOT VERIFIED:** manual Android manifest, exported components and file-handling inspection |
| MASVS-CODE | Third-party library vulnerabilities, code integrity, reproducibility | `npm ci`, Quality, signed Android workflow; new `npm audit --omit=dev` inventory | **PARTIAL:** baseline workflow added; review advisories and raise enforcement only after triage |
| MASVS-RESILIENCE | Runtime tampering and reverse engineering | Signed release APK is produced | **NOT VERIFIED:** signature does not imply protection from tampering; analyze release artifact |
| MASVS-PRIVACY | Consent, data minimization, crash reporting, observability | Crashlytics utility checks local reporting consent | **PARTIAL:** inspect analytics payloads, deletion/data retention, optional observability exports |

## Automated baseline
- `.github/workflows/security-baseline.yml` runs on PRs, pushes to main, weekly and manually; **read-only** permission.
- Reports **severity counts**, omits package names and contains no user data or API keys. A broken/unavailable scan is **failure**; existing dependency findings are **warnings** in this first inventory, never a security PASS.
- Covers only npm production dependencies; it does **not** inspect native Android libraries, APK binaries, network behavior or real-device access controls.

## Grafana — separate privacy gate
WeekFlow already uses consent-controlled Firebase Crashlytics for errors. Grafana should show **aggregated operational metrics** (build failures, crash totals, latency/error rates) from an authenticated server-side source, not a direct APK-to-Grafana connection. No Grafana endpoint, credentials, dashboard or data export is configured by this change. Keep personal schedules, food records, profiles and raw crash payloads out of dashboards by default. A separate spec and infrastructure access are required before any real connection.

## First scan snapshot (2026-11-19/20)
GitHub Security workflow run `44650512437` completed and reported **17 npm production dependency findings**, **11 high/critical**. This is an initial vulnerability inventory, not an indication that all findings are reachable through the Android APK. No packages were upgraded or problems automatically corrected. Triage is required before any severity enforcement or release claim.

## Remediation order after scan
Review actual high/critical advisories for whether affected code is shipped/exploitable; prioritize network/auth/storage vulnerabilities and supported upgrades. Do not blindly upgrade Expo/React Native transitive dependencies or weaken signed-build gates.
