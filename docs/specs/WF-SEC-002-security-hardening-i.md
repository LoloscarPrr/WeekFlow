# WF-SEC-002 — Security Hardening I

Status: PARTIAL / commercial release blocked pending verified triage.

Base: 0.5.43; this infrastructure-only change does not increment app version or modify APK, signing, SQLite, or user features.

## Evidence
The 2026-11-20 audit run 44650512437 reported 17 findings, 11 high/critical. The historic workflow retained counts only; the package/advisory list is not recoverable from its logs. This is not a current vulnerability inventory or a claim that every finding reaches Android.

## Implemented
- An explicit --enforce mode fails if high/critical production npm findings remain.
- Invalid reports and invalid CLI options fail closed; tests exercise CLI exit codes.
- Manual Security baseline workflow input enforce_high_critical enables this policy. Normal Alpha/PR inventory is informational and does not imply release approval.
- Public CI output continues to expose counts only.

## Next gates
1. Obtain detailed advisory inventory privately via repository owner security alerts or a trusted environment running npm audit --omit=dev --json against the exact lockfile. Do not publish raw output in public Actions logs/artifacts.
2. Triage dependency paths, shipped code, exploitability, compatible patched versions and Expo native compatibility. No blind npm audit fix --force.
3. Test targeted lockfile changes with npm ci, typecheck, full regressions, Metro, signed Android build and physical update; verify no data loss.
4. Require an enforcing scan of the exact commercial candidate, plus native/mobile security and privacy checks; zero high/critical npm findings is not a security certification.
5. Keep Architecture 360 code, credentials, resources and data separate; no cross-project reuse.

No dependency remediation or commercial release is claimed in this PR.
