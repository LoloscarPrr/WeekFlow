# TLC Initialization Snapshot — WF-SEC-002 (2026-11-24)

## Repository, version, product scope
- Repo: `LoloscarPrr/WeekFlow`; base main `1a6db3118418a7d0fa381effb2daf544775dedc3`; working branch `feature/wf-sec-002-remediation-triage`.
- Current technical app version **0.5.40** (`com.weekflow.app`), Expo SDK 57, RN 0.86, Node 22.13 in Quality, local SQLite and consent-aware Crashlytics. Android signature and monotonically increasing versionCode from release workflow; do not change without verified compatible release.
- Blueprint Maestro v4.0 re-read from uploaded project source in this session; Core reliability and privacy; do not disrupt existing functionality.
- Rules read: `AGENTS.md`, TLC `.agents/skills/tlc-spec-driven/SKILL.md`; relevant `WF-SEC-001` and `docs/security/owasp-masvs-baseline.md`.
- Phase: security remediation 3.1, requested by user. Proposed spec **WF-SEC-002 — Dependencias: triage y actualizaciones seguras**, phase NOW.

## CI baseline, verified
- main `1a6db31`: Quality PASS #44650947269; signed Android PASS #44650947250.
- Recurring security audit run #45292348857 2026-11-23 PASS as *scan execution*, reporting **17 npm production dependency advisories, 11 high/critical**. These counts are **not** vulnerability fixes nor proof of reachability in APK.
- Actual vulnerable package names / fix versions are **not available** in existing count-only CI report: reconstruct sanitized npm audit and analyze before modifying dependencies.
- Manual APK exploitation test, physical Xiaomi upgrade and Doze validation: **NOT RUN**.
- Local npm registry/network access from current container: unavailable; use GitHub Actions runner for registry-dependent investigation.

## Constraints, risks and immediate plan
- Do not blindly update Expo/RN major versions or add unreviewed overrides; evaluate npm advisory transitive chains and fix availability.
- No personal user data, signing secrets, keys or Grafana credentials in logs or audit artifacts.
- First lock spec, generate triage workflow/report and an isolated `npm audit fix --package-lock-only` candidate, inspect results and quality before considering any update to main.
- Keep app release / versionCode / signing untouched for CI-only investigation; if changes ship in APK, create a separately verified signed release. Exact risk to Android from npm audit remains unverified.
