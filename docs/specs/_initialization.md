# TLC Initialization Snapshot — WF-SEC-001 (2026-11-19)

## Repository, baseline and build metadata
- Repository: `LoloscarPrr/WeekFlow`, `main` base SHA `8336ff9f947cf82d1027b20e323cc65275edc504`, working branch `feature/wf-sec-001-owasp-baseline`.
- App and package version: `0.5.40`; Android package `com.weekflow.app`; signed versionCode is assigned monotonically by Android release workflow. **No app build metadata change** in this security-only phase.
- Expo SDK 57, React Native 0.86, npm lockfile; local SQLite, optional network integrations and Firebase Crashlytics (consent-gated).
- Sources read: `AGENTS.md`, `.agents/skills/tlc-spec-driven/SKILL.md`, `docs/specs/_template.md`, Quality workflow, package manifest, Crashlytics spec; Blueprint Maestro v4.0 from project context.
- Related specs: `WF-CORE-005` Crashlytics, `WF-CORE-008` reproducible builds, `WF-NOTIFY-010` notifications.

## Current phase and baseline checks
- Consolidation / security and monitoring foundation requested; avoid feature creep and sending private device data to a dashboard.
- GitHub Quality and signed Android build for `main` SHA `8336ff9`: **PASS** (2026-11-19/20).
- Security dependency scan in repo: **NOT RUN / NOT CONFIGURED**, no `.github/workflows/security-baseline.yml`.
- Manual OWASP MASVS/MASTG mobile assessment, Android dynamic analysis, threat modeling and external Grafana service: **NOT RUN**.
- Local tests: **NOT RUN** prior to this change.

## Known constraints and scope
- OWASP MASVS/MASTG are mobile security standards/testing methodologies, not SDKs or automatic compliance certificates.
- Do not claim encrypted SQLite, end-to-end security, or Grafana connectivity without verification.
- Preserve privacy; no production credentials on-device or in reports; independent least-privilege CI workflow reports dependency audit counts without posting package data to external analytics.
- Existing Quality and Android signing must remain functional; no dependency upgrades until findings are triaged.
- Proposed spec: `WF-SEC-001 — Baseline OWASP MASVS + audit de dependencias en CI`, phase **NOW**.
