# Design — Password-encrypted backups

Status: **implemented 2026-11-14** (`web/src/utils/backupCrypto.ts`,
`web/src/components/BackupPasswordModal.tsx`, `backupCrypto.test.ts`). Created 2026-11-09.
Password-encrypted `.sanchay` export is available alongside the plain JSON export; the spec §7
item 205 "make the risks clear" branch remains for plain exports.

## 1. Problem

Backups are plaintext JSON (`handleExportBackup` → `saveTextFile`). Anyone who obtains the file —
cloud sync of Downloads, a shared device, a lost laptop — reads every transaction, payee and UPI
id in it. The app-lock PIN is already excluded (spec §7 item 205), but the financial data itself
is not protected at rest.

## 2. Goals

1. Optional password-encrypted export; password-protected import with clean failure modes.
2. Nothing stored that lets anyone except the password holder decrypt (no key escrow, no account).
3. Honest UX: unrecoverable-if-forgotten is stated *before* the user commits.
4. Legacy plaintext backups keep importing (with a warning).
5. Pure WebCrypto — no new npm dependencies, works in Android WebView and browsers.

## 3. Non-goals

- Key escrow, recovery codes, account-based recovery (would contradict local-first/no-account).
- Encrypting `localStorage` itself (WebView storage is app-private; Android FBE already protects
  app-private storage at rest on modern devices — different problem, separate decision).
- Automatic/scheduled backups (§8).
- Encrypting CSV exports/receipts (user-visible print-style artefacts; warning copy only).

## 4. File format (`sanchay.encrypted.v1`)

The export remains a single `.json` file (keeps picker filters and `saveTextFile` unchanged):

```json
{
  "format": "sanchay.encrypted.v1",
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "salt": "<base64>" },
  "cipher": { "name": "AES-GCM", "iv": "<base64>" },
  "ciphertext": "<base64>"
}
```

- **KDF:** PBKDF2-HMAC-SHA-256, 600,000 iterations (OWASP 2023 guidance for PBKDF2-SHA256),
  16-byte random salt (`crypto.getRandomValues`). PBKDF2 (not Argon2) because WebCrypto in the
  Android WebView exposes PBKDF2 universally; iterations are read *from the file* on import so a
  future parameter bump never breaks old backups.
- **Cipher:** AES-256-GCM, 12-byte random IV, 128-bit auth tag (WebCrypto default).
- **AAD:** `additionalData = "sanchay.encrypted.v1"` so the header cannot be swapped (e.g.
  downgrade the KDF parameters) without failing authentication.
- **Plaintext:** UTF-8 JSON of the existing `PersistedState` (created by `createBackupState`, so
  the app-lock PIN is still excluded before encryption).
- **Detection on import:** parse JSON → if `format === 'sanchay.encrypted.v1'` → encrypted path;
  else → legacy plaintext path (current behaviour + warning banner).

## 5. Crypto module

New `web/src/utils/backupCrypto.ts` (all `async`, all via `crypto.subtle`):

```ts
encryptBackupJson(stateJson: string, password: string): Promise<string>  // returns envelope JSON
decryptBackupJson(envelopeJson: string, password: string): Promise<string> // returns state JSON
isEncryptedBackup(text: string): boolean
```

Implementation notes:

- Guard first: `if (!globalThis.crypto?.subtle) throw` with the user-facing message
  "Encryption needs a secure context (https:// or localhost)." (`sanchay.local` in the WebView is
  an https origin ⇒ secure context; a `file://` desktop open is not — degrade with that message,
  never silently plaintext.)
- Key derivation → `crypto.subtle.importKey('raw', utf8(password), 'PBKDF2')` → `deriveKey`
  (AES-GCM, 256-bit, extractable=false) → `encrypt/decrypt`.
- Errors normalise to two user messages only: **wrong password** (GCM `OperationError` also
  covers tampered files — say "Wrong password, or the file was altered") and **bad format**.
- No password ever logged, stored, or put in state that outlives the dialog (React state cleared
  on completion; never written to `localStorage`).

## 6. UX flow

### Export (privacy panel)

1. "Export backup" → if encrypted backups enabled: password + confirm fields (min 8 chars,
   strength hint at ≥12), checkbox **"Export without encryption"** (default OFF — matches the
   current warnings only when the user consciously opts out).
2. On encrypt: spinner during PBKDF2 (~0.5–3 s on device; budget ≤3 s at 600k — if a device
   benchmark shows >3 s, drop writer iterations to 310k; readers honour the file's value).
3. Success copy states: "Encrypted. **If you forget this password the backup cannot be
   recovered.**"

### Import (existing file picker path, `handleBackupFile`)

1. Size guard stays (5 MB plaintext-equivalent ⇒ base64 ciphertext ceiling ≈ 3.7 MB payload —
   adjust the limit message accordingly).
2. Envelope detected → password prompt modal → decrypt → hand the plaintext to the *existing*
   `parsePersistedState` validation chain unchanged (validation code is not duplicated).
3. Wrong password/tamper → single clear error, prompt stays open, nothing is mutated (current
   import already stages into `pendingImport` before applying — preserve that).
4. Legacy plaintext detected → restore proceeds **with** a warning row: "This backup is not
   encrypted — consider re-exporting with a password."

## 7. Test plan (vitest; Node ≥18 exposes `crypto.subtle`)

| Case | Assertion |
|---|---|
| round-trip | encrypt → decrypt → byte-identical state JSON; `parsePersistedState` accepts it |
| wrong password | rejects with the wrong-password error; no partial output |
| tampered ciphertext / iv / salt / iterations | rejects (GCM tag or AAD failure) |
| header downgrade | changing `format`/`kdf.name` after encryption → rejects (AAD) |
| unicode | Hindi/emoji payee names round-trip exactly |
| PIN exclusion | decrypted state has no `appLockPin` (inherits `createBackupState`) |
| legacy plaintext | `isEncryptedBackup` false → existing import path passes unchanged |
| malformed envelope | missing field / bad base64 → "bad format" error, never a crash |
| secure-context guard | with `crypto.subtle` stubbed absent → clear error, no silent fallback |
| PBKDF2 params honoured | envelope with 1000 iterations (test fixture) still decrypts |

## 8. Phase 2 (out of scope)

- **Scheduled auto-backup:** WebView has no background scheduler; would need a JS timer writing a
  dated encrypted file through the existing bridge while a session password is held in memory
  (never persisted), plus a settings toggle. Requires its own design (naming collisions, rotation,
  "last backup" indicator, battery/perf review).
- Per-file password change ("re-key") without re-selecting data.

## 9. Docs to update on implementation

README (limitations + backup paragraphs + Roadmap), privacy panel copy (offer encrypted export),
inventory §9, privacy-policy retention section, release checklist §5 item ticks with test
evidence; keep spec §7 item 205's honesty wording until the feature actually ships.
