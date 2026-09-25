# TLC Initialization Snapshot

- Repository: LoloscarPrr/WeekFlow, main 891499a76a66b9ac4b093cd061a79824d0c76bee.
- Session: 2026-09-25, resume after Android video 1000142985.mp4 (33 seconds).
- Source: 0.4.2 / versionCode 84; release build #151 uses 100151 and permanent signing.
- Baseline PASS: main Quality #196 and Android #151, APK and AAB generated.
- Physical evidence FAIL: opening keyboard leaves important-event title or Food pantry below the visible viewport; repeated opening/closing changes layout. Video does not expose installed version, so exact installed version is unknown.
- Blueprint Maestro v3.3 reviewed earlier this session: P0 usability and stable updates before feature expansion.
- WF-QA-003 removed unconditional scrolling but did not implement measured field visibility. Its physical acceptance remains incomplete.
- Active next spec: WF-QA-004, measured keyboard field visibility in shared scrolling forms.
- Relevant code reviewed: RootLayout/BottomNav, RefreshableScrollView, Food, Semana/ImportantEventCard, MoveHome/MovePlan/MoveFeedback, TimeEditModal, existing keyboard tests.
- Constraints: preserve native input focus, saved data, explicit Save/Cancel, manual drag dismissal and permanent signing. No new native dependencies. Physical re-test of new APK remains external.
