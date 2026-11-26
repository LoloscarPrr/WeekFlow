# WF-NOTIFY-011A — Android closed-app FCM diagnostic (Alpha 0.5.43)

## Scope
A360 PR #21 validated the architectural path of server-originated push independent of UI; WeekFlow is native Expo/Android and uses its own Firebase project weekflow-84a82. Do not reuse A360 credentials, tokens, or database. This is a pilot, not a claim that normal reminders are fixed. Keep all existing local alarms, 5-second and 24-hour tests, exact-alarm permission, Smart Silence, SQLite, package and signing.

## Acceptance
- Explicit button in Notificaciones after permission, authenticated verified account and user tap; no remote agenda upload.
- Native FCM device token sent only to pinned WeekFlow HTTPS endpoint with Firebase ID token.
- Backend disabled unless opted in and server-only FCM credential plus one explicitly approved Firebase UID exist. Verify RS256 issuer/audience/expiry/email, fixed generic notification, persistent 90s cooldown, no arbitrary payload.
- 202 means background test queued, not FCM acceptance or Android delivery. After 15 seconds the worker requests FCM HTTP v1 with HIGH priority, existing channel, diagnostic tag and 120s TTL. Provider status only logged, no identifiers.
- No real reminder sent remotely and no changes to existing schedule. A user may receive an explicitly requested diagnostic even if they log out or switch notifications off before its 15s delay; OS permission still controls display.
- Physical test: close normally, lock screen, observe arrival. Compare local DATE test after 24/48h, airplane mode, reboot. Force-stop is not a supported guarantee.

## Operator setup (not yet activated)
1. Review CI and Edge typecheck. Apply only supabase/sql/weekflow-push-test.sql to WeekFlow; test service-only RPC including second call false, verify no grants for anon/authenticated, run advisors. No A360 changes.
2. Enable FCM HTTP v1 in Firebase project weekflow-84a82. Create a dedicated least-privilege messaging sender credential. Set WEEKFLOW_FCM_SERVICE_ACCOUNT_JSON only in WeekFlow Edge secrets; never commit or paste credentials in chat. Set WEEKFLOW_PUSH_TESTER_UID to the approved verified account UID. Set ENABLE_WEEKFLOW_PUSH_TEST=false initially.
3. Deploy weekflow-push-test with verify_jwt=false (custom Firebase verification in handler). Verify disabled 503, unauthorized 403, invalid payload 400, cooldown 429; after configuring credentials and tester, explicitly enable. Verify FCM provider status in logs and physical delivery.
4. Disable flag after pilot if not continuing. No database stores device tokens or agenda.

## 011B — real reminders (not implemented)
Need explicit consent, revocable per-device registration bound to account, persistent versioned queue of minimal reminder IDs/timestamps, revocation on logout/disable, expiry and plan reconciliation, offline local delivery, shared on-device atomic delivery ledger across native alarm and push receivers before display. Do not send an OS-auto-displayed backup in parallel with local alarm: it cannot guarantee deduplication. Test restart, time zone, schedule edits, stale notifications and protected sleep. No production backup before physical pilot and security/privacy acceptance.
