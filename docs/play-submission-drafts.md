# Sanchay — Play Console submission drafts (DRAFT)

Status: **draft for maintainer entry into Play Console — not a submission.** Created 2026-11-09
for `SANCHAY_UPI_COMPLIANCE_FIRST_SPEC.md` items 228–231 and 351–352. Every answer is derived
from [data-flow-inventory.md](data-flow-inventory.md) (release-variant static audit, 2026-11-08/09)
— re-verify the inventory if the APK changes. `[TODO]` fields need maintainer input.

---

## 1. Data safety form (spec items 230, 352)

### Data collected & processed

| Data category (Play taxonomy) | Collected? | Shared? | Processed locally? | Transmitted? | Purpose |
|---|---|---|---|---|---|
| **Personal info → Name** (profile name/email the user types in Settings) | Yes | No | Yes | **No** | App display only |
| **Financial info → Financial account info + transaction history** (accounts, balances, transactions, payees, budgets, goals, planned payments, payment-assistance attempts) | Yes | No | Yes | **No** — dashboard has zero network APIs (inventory §2) | App functionality, local reports |
| **Photos/videos → Files and documents** (user-imported backup files via system picker) | Yes | No | Yes | **No** | Import/restore; never uploaded |
| **App activity → App interactions / other user-generated content** (user-entered notes, UTR references, payee UPI ids) | Yes | No | Yes | **No** | App functionality |
| **Device or other IDs → App-generated random identifier** (UUID from `DeviceIdUseCase`) | Yes | No | Stored in app DataStore | **Yes — to Google Firestore** (`polls/{pollId}/votes/{deviceId}` = option id + server timestamp, only if the user taps Vote on the native poll screen, which is not reachable from the current dashboard UI) | Analytics? **No** — app functionality (poll tallying) only; no behaviour tracking |
| **Location, contacts, SMS, call logs, phone number, email (collected), advertising ID** | **No** | — | — | — | Manifest has no such permissions (inventory §8); no analytics/ad SDK exists (inventory §6) |

### Data sharing

- **No data is shared with third parties.** No advertising, no analytics, no data brokers.
- Google (Firebase Firestore) processes the poll vote as the **service provider** hosting the
  backend — declare under Google's SDK, not as "sharing".

### Data security & deletion

- **Data encrypted in transit:** Yes — `usesCleartextTraffic="false"`; all dormant native
  requests use HTTPS/TLS (currency API, GitHub, Firestore).
- **Data encrypted at rest:** Yes, to the extent provided by Android — dashboard data lives in
  app-private WebView storage (not readable by other apps; device file-based encryption).
  Optional password-encrypted backups: design drafted, not yet shipped
  ([design-encrypted-backups.md](design-encrypted-backups.md)) — **do not claim encrypted
  backups until implemented.**
- **Users can request data deletion:** Yes — in-app "Reset local data" (Privacy panel) removes
  the entire dashboard store; Android Settings → Clear data removes everything app-local.
  Firestore poll votes: deletable via the maintainer contact (`[TODO: contact address]`, same as
  privacy policy).
- **Data is never sold and never used for advertising or credit decisions.**

### SDK list to declare (from the release runtime classpath, inventory §6)

| SDK | What it does | Data it receives |
|---|---|---|
| **Google Firebase Firestore** (`firebase-firestore`) | Poll vote storage | App-generated UUID + poll option id + timestamp (only on user tap Vote) |
| **Google Play services** (transitive) | Transport for Firestore | As required by the Firestore SDK |
| *(declare also)* Crashlytics, Review, AppUpdate: **not present** — removed 2026-11-08 | — | — |

Ktor/OkHttp is an app library (not a Play "third-party SDK" disclosure item in practice), but the
three HTTP destinations it can reach are disclosed in the privacy policy.

## 2. Financial features declaration (spec items 228, 351)

**Facts for the reviewer:** Sanchay does **not** initiate, process, or facilitate money
transfers. Path A is a local ledger + "copy these details into your own UPI app" assistance flow:
no `upi://` intent, no QR, no UPI Collect/API, no bank connection (enforced by the CI compliance
gate). The app moves no funds and holds no balances for anyone.

**Recommended honest position (maintainer decides):**

1. Complete the declaration even if the classification needs clarification (Play allows
   indicating uncertainty) — do not skip it.
2. Given the payment-assistance framing, plan to review **"Money transfer and wire services"**
   and **"Mobile payments and digital wallets"** with Play's classifier against the *actual*
   shipped feature set; if neither fits the assistance-only reality, use Play's clarification
   channel rather than picking a convenient category.
3. Keep description, privacy policy, in-app labels and behaviour consistent (item 229): the
   README/panel wording ("does not move money", "not verified by Sanchay") is the source copy —
   reuse it verbatim in the listing.
4. Store listing must not include UPI/NPCI badges or "official/verified UPI" claims (enforced by
   compliance gate + spec items 232–233, 353).

`[TODO: record the final chosen declaration + any Play correspondence in the private compliance
records (spec item 350) — do not publish confidential correspondence.]`

## 3. Working-link checklist before submission (spec items 231, 355)

- [ ] Privacy policy URL published (draft: [privacy-policy.md](privacy-policy.md)) — linked in
  Play Console **and** inside the app (privacy panel + README).
- [ ] Support/contact address live (same `[TODO]` as the privacy policy).
- [ ] Terms of use published or consciously omitted with a Play-appropriate note.
- [ ] Data safety form above entered and cross-checked against the release APK's actual SDKs.
- [ ] Financial features declaration completed (§2).
- [ ] Store screenshots captured from the release build on a phone (2–8 required; current
  phone-viewport candidates are in [docs/screenshots](../docs/screenshots/) — Overview, Activity,
  Reports, Plan, Accounts, Payees; re-capture on-device so the WebView chrome and status bar are
  real).
