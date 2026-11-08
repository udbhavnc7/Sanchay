# Sanchay — Data retention and incident response

Status: draft procedure sized for this project's actual operations (single maintainer,
local-first app, no user accounts, no server-side user data). Created 2026-11-08 for
`SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` §7 item 207. The maintainer should confirm it fits the
jurisdiction they publish in (privacy-policy contact, Play requirements) and amend if needed.

Grounded in [data-flow-inventory.md](data-flow-inventory.md) and
[privacy-policy.md](privacy-policy.md).

## 1. Retention schedule

| Data | Location | Retention | Removal |
|---|---|---|---|
| Dashboard financial data (accounts, transactions, payees, goals, budgets, planned payments, attempts, preferences, app-lock PIN) | App-private WebView `localStorage` (`sanchay.local.v1`) on the user's device | Until the user deletes it — no server copy exists | Privacy panel → Reset local data, or OS "Clear data" (inventory §10) |
| Poll votes (`polls/{pollId}/votes/{deviceId}` = option id + timestamp; random app-generated UUID) | Google Firestore | Until `[TODO: retention decision]`; no dashboard data ever joins this store | User request via privacy-policy contact, or maintainer deletes the document |
| Poll "already voted" flag + device UUID | App DataStore on device | Same as app data | OS "Clear data" |
| Exported JSON/CSV/receipt files | Wherever the user saves them (`Downloads/Sanchay`, browser downloads) | User-controlled | User deletes the file |
| Debug logs (Timber, Ktor BODY logs) | Device logcat, debug builds only | Not present in release builds; cleared by device reboot/log rotation | n/a (release emits none) |
| Crash reports / analytics | — | None collected — Crashlytics removed 2026-11-08, no other SDK exists | n/a |

## 2. What Sanchay will never retain

- No UPI PIN/OTP/bank credentials, no SMS/notification content, no contact lists, no precise
  location (manifest has no such permissions — inventory §8).
- The app-lock PIN is device-local only: never exported, never imported, never transmitted
  (inventory §9).
- No backups of user data are taken by the app or by Android cloud backup
  (`allowBackup="false"`).

## 3. Incident response (step-by-step)

Scope: any event where non-public data may have left the device, been logged, or been exposed —
e.g. a release build found transmitting user data, a dependency vulnerability, a mistaken
analytics/crash SDK, or an exposed secret (`google-services.json` API key abuse).

1. **Identify** — determine what data, which builds/versions, and how it left (repro + `git log`
   around the change; for network questions re-run the packet-capture checklist item).
2. **Contain** — stop the leak in the next commit: remove/disable the offending code path or SDK,
   cut a patched release, and if a Play release is affected consider an urgent update or staged
   rollout halt. If secrets leaked, rotate them in the Firebase/Play consoles.
3. **Assess** — classify affected data against §1 (almost always device-local data → user must be
   told how to wipe it; poll votes → server-side deletion).
4. **Notify** — publish an honest statement: what happened, what data, what versions, what users
   should do (e.g. "Clear app storage", "revoke the API key"). Channels: Play release notes,
   README, `[TODO: contact address]`. Do not claim "nothing was exposed" without evidence.
5. **Fix & verify** — add the failing case to the checklist/tests (e.g. a test asserting the
   offending SDK/string is absent, as done for Crashlytics), re-run
   `docs/release-checklist.md` §2/§4, verify on a clean device.
6. **Record** — write a short post-incident note (date, impact, root cause, prevention) into this
   file's changelog below. Keep compliance correspondence private (spec §7 item 350).

## 4. Standing checks before any release

- Re-run `docs/release-checklist.md` §2 (static APK audit) and §4 (web checks).
- Re-verify `docs/data-flow-inventory.md` still matches the shipped build (§5 destinations,
  §6 SDKs, §8 permissions).
- Confirm the privacy policy URL still resolves and still describes the shipped behaviour.

## Changelog

- 2026-11-08: initial procedure created (static-audit baseline).
