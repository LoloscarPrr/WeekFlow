# WeekFlow 0.5.44 — Security Hardening Release

- Adopt the combined dependency candidate from PR #167, retaining Expo SDK 57 and existing Firebase native packages.
- Scope gRPC and query-string overrides to their existing parent dependencies. Preserve existing package identity, signing and SQLite schema.
- Candidate CI (run 45862136563): 11 to 3 npm findings; high/critical 8 to 0. All candidate Quality and Metro checks passed. This is prior candidate evidence, not final release approval.
- Final 0.5.44 CI, strict dependency audit, signed APK/AAB and physical update/data-retention verification remain required. Three moderate findings remain subject to triage. No security certification or commercial approval is claimed.
- No changes to Architecture 360, credentials, production endpoints or product features.
