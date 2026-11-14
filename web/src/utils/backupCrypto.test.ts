import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBackupState, parsePersistedState } from '../data/persistence';
import {
  initialAccounts, initialBudgets, initialContacts, initialGoals,
  initialPlannedPayments, initialTransactions,
} from '../data/mockData';
import { decryptBackupJson, encryptBackupJson, isEncryptedBackup } from './backupCrypto';

const PASSWORD = 'correct horse battery';
const PLAINTEXT_LIMIT = 5 * 1024 * 1024;
const ENVELOPE_LIMIT = 7 * 1024 * 1024;
const BAD_FORMAT = 'Invalid encrypted backup format.';
const AUTH_ERROR = 'Wrong password, or the file was altered.';
const SECURE_ERROR = 'Encryption needs a secure context (https:// or localhost).';

// Independent Node/OpenSSL fixture; does not reuse the implementation's WebCrypto helpers.
function fixture(plaintext: string | Uint8Array = '{"legacy":true}', iterations = 1_000, password = PASSWORD) {
  const header = {
    format: 'sanchay.encrypted.v1',
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: randomBytes(16).toString('base64') },
    cipher: { name: 'AES-GCM', iv: randomBytes(12).toString('base64') },
  };
  const key = pbkdf2Sync(password, Buffer.from(header.kdf.salt, 'base64'), iterations, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, Buffer.from(header.cipher.iv, 'base64'));
  cipher.setAAD(Buffer.from(JSON.stringify(header)));
  const bytes = typeof plaintext === 'string' ? Buffer.from(plaintext) : plaintext;
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final(), cipher.getAuthTag()]);
  return { ...header, ciphertext: ciphertext.toString('base64') };
}

function flipByte(base64: string, at = 0) {
  const bytes = Buffer.from(base64, 'base64');
  bytes[at] ^= 1;
  return bytes.toString('base64');
}

function realBackup() {
  return createBackupState({
    accounts: initialAccounts,
    transactions: initialTransactions,
    contacts: initialContacts,
    goals: initialGoals,
    budgets: initialBudgets,
    plannedPayments: initialPlannedPayments,
    preferences: {
      isDarkMode: true,
      isAudioEnabled: false,
      isCardFrozen: false,
      userProfile: { name: 'संचय \u{1F331} café', email: 'unicode@sanchay.local' },
      appLockPin: '2468',
      appLock: { algorithm: 'PBKDF2-SHA-256', salt: 'private-salt', hash: 'private-hash', iterations: 120_000 },
      appLockFailures: 3,
      appLockLockedUntil: 123456,
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('encrypted backup WebCrypto interoperability', () => {
  it('round-trips byte-identical Unicode JSON from a real sanitized backup with no PIN or lock credential', async () => {
    const state = realBackup();
    const json = JSON.stringify(state, null, 2);
    const encrypted = await encryptBackupJson(json, PASSWORD);
    expect(isEncryptedBackup(encrypted)).toBe(true);
    expect(encrypted).not.toContain('unicode@sanchay.local');
    const decrypted = await decryptBackupJson(encrypted, PASSWORD);
    expect(decrypted).toBe(json);
    expect(parsePersistedState(decrypted)).toEqual(state);
    expect(JSON.parse(decrypted).preferences).not.toHaveProperty('appLockPin');
    expect(JSON.parse(decrypted).preferences).not.toHaveProperty('appLock');
    expect(JSON.parse(decrypted).preferences).not.toHaveProperty('appLockFailures');
    expect(JSON.parse(decrypted).preferences).not.toHaveProperty('appLockLockedUntil');
    expect(decrypted).not.toContain('private-hash');
  });

  it('writes 600k PBKDF2 SHA256, AES256GCM with a 128-bit tag and canonical full-header AAD', async () => {
    const json = '{"message":"नमस्ते \\uD83C\\uDF31"}';
    const envelope = JSON.parse(await encryptBackupJson(json, PASSWORD));
    const { ciphertext, ...header } = envelope;
    expect(header).toEqual({
      format: 'sanchay.encrypted.v1',
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600_000, salt: expect.any(String) },
      cipher: { name: 'AES-GCM', iv: expect.any(String) },
    });
    expect(Buffer.from(header.kdf.salt, 'base64')).toHaveLength(16);
    expect(Buffer.from(header.cipher.iv, 'base64')).toHaveLength(12);
    const key = pbkdf2Sync(PASSWORD, Buffer.from(header.kdf.salt, 'base64'), 600_000, 32, 'sha256');
    const bytes = Buffer.from(ciphertext, 'base64');
    expect(bytes.length).toBe(Buffer.byteLength(json) + 16);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(header.cipher.iv, 'base64'));
    decipher.setAAD(Buffer.from(JSON.stringify(header)));
    decipher.setAuthTag(bytes.subarray(-16));
    expect(Buffer.concat([decipher.update(bytes.subarray(0, -16)), decipher.final()]).toString()).toBe(json);
  });

  it('uses a fresh random salt and IV on every export', async () => {
    const a = JSON.parse(await encryptBackupJson('{}', PASSWORD));
    const b = JSON.parse(await encryptBackupJson('{}', PASSWORD));
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it.each([1_000, 2_000_000])('honors supported reader iterations %i including a short legacy password', async (iterations) => {
    const envelope = fixture('{"legacy":true}', iterations, 'old');
    await expect(decryptBackupJson(JSON.stringify(envelope), 'old')).resolves.toBe('{"legacy":true}');
  });

  it('canonicalizes key order and whitespace without changing authenticated metadata', async () => {
    const e = fixture();
    const reordered = { ciphertext: e.ciphertext, cipher: { iv: e.cipher.iv, name: e.cipher.name },
      kdf: { salt: e.kdf.salt, iterations: e.kdf.iterations, hash: e.kdf.hash, name: e.kdf.name }, format: e.format };
    await expect(decryptBackupJson(JSON.stringify(reordered, null, 4), PASSWORD)).resolves.toBe('{"legacy":true}');
  });

  it('normalizes wrong and empty passwords to the same authentication failure', async () => {
    const text = JSON.stringify(fixture());
    await expect(decryptBackupJson(text, 'incorrect password')).rejects.toThrow(AUTH_ERROR);
    await expect(decryptBackupJson(text, '')).rejects.toThrow(AUTH_ERROR);
  });

  it.each(['salt', 'iv', 'iterations', 'ciphertext', 'tag'] as const)('rejects tampering of %s without returning partial plaintext', async (field) => {
    const e = fixture();
    if (field === 'salt') e.kdf.salt = flipByte(e.kdf.salt);
    if (field === 'iv') e.cipher.iv = flipByte(e.cipher.iv);
    if (field === 'iterations') e.kdf.iterations += 1;
    if (field === 'ciphertext') e.ciphertext = flipByte(e.ciphertext);
    if (field === 'tag') e.ciphertext = flipByte(e.ciphertext, Buffer.from(e.ciphertext, 'base64').length - 1);
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(AUTH_ERROR);
  });

  it('rejects authenticated bytes that are not valid UTF-8 rather than silently replacing them', async () => {
    await expect(decryptBackupJson(JSON.stringify(fixture(new Uint8Array([0xff]))), PASSWORD)).rejects.toThrow();
  });
});

describe('strict encrypted envelope validation', () => {
  it.each([
    ['format', 'sanchay.encrypted.v2'], ['format', null],
    ['kdf.name', 'pbkdf2'], ['kdf.name', 'scrypt'], ['kdf.hash', 'SHA-1'],
    ['cipher.name', 'AES-CBC'], ['cipher.name', 'aes-gcm'],
    ['kdf.iterations', 0], ['kdf.iterations', 999], ['kdf.iterations', 2_000_001],
    ['kdf.iterations', 1e100], ['kdf.iterations', 1_000.5], ['kdf.iterations', '1000'],
    ['kdf.iterations', null], ['kdf.iterations', true],
    ['kdf', []], ['cipher', null], ['ciphertext', 123],
  ])('rejects invalid %s = %s before any key derivation', async (path, value) => {
    const e = fixture();
    const parts = String(path).split('.');
    const parent = parts.length === 2 ? e[parts[0] as 'kdf' | 'cipher'] : e;
    Object.assign(parent, { [parts.at(-1)!]: value });
    // If parsing reaches PBKDF2, this throws a different error than the required format error.
    const subtle = Object.create(globalThis.crypto.subtle);
    subtle.importKey = () => { throw new Error('Unvalidated data reached PBKDF2'); };
    vi.stubGlobal('crypto', { subtle, getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it.each(['format', 'kdf', 'cipher', 'ciphertext', 'kdf.name', 'kdf.hash', 'kdf.iterations', 'kdf.salt', 'cipher.name', 'cipher.iv'])('rejects missing %s', async (path) => {
    const e = fixture();
    const parts = path.split('.');
    const parent = parts.length === 2 ? e[parts[0] as 'kdf' | 'cipher'] : e;
    Reflect.deleteProperty(parent, parts.at(-1)!);
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it.each(['root', 'kdf', 'cipher'])('rejects extra unauthenticated %s metadata', async (where) => {
    const e = fixture();
    Object.assign(where === 'root' ? e : e[where as 'kdf' | 'cipher'], { tagLength: 96 });
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it.each(['salt', 'iv', 'ciphertext'] as const)('requires canonical base64 and correct decoded length for %s', async (field) => {
    const e = fixture();
    const parent = field === 'salt' ? e.kdf : field === 'iv' ? e.cipher : e;
    for (const value of ['', '!!!!', 'AAAA AAAA', 'AAAA\nAAAA', 'AAAA-_==', 'A===', 'AA=A', 'AAAA=', 'AB==', 'AAAA']) {
      Object.assign(parent, { [field]: value });
      await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
    }
    const wrongLength = Buffer.alloc(field === 'salt' ? 17 : field === 'iv' ? 13 : 15).toString('base64');
    Object.assign(parent, { [field]: wrongLength });
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it('rejects noncanonical salt pad bits even when they decode to the original bytes', async () => {
    const e = fixture();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    e.kdf.salt = e.kdf.salt.slice(0, -3) + alphabet[alphabet.indexOf(e.kdf.salt.at(-3)!) + 1] + '==';
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it.each(['null', '[]', '{}', '42', '"text"', '{broken', '{"format":"sanchay.encrypted.v1"}'])('rejects malformed envelope %s', async (text) => {
    await expect(decryptBackupJson(text, PASSWORD)).rejects.toThrow(BAD_FORMAT);
  });

  it('rejects oversized ciphertext and envelope before expensive processing', async () => {
    const e = fixture();
    e.ciphertext = Buffer.alloc(PLAINTEXT_LIMIT + 17).toString('base64');
    await expect(decryptBackupJson(JSON.stringify(e), PASSWORD)).rejects.toThrow(BAD_FORMAT);
    const oversized = JSON.stringify(fixture()) + ' '.repeat(ENVELOPE_LIMIT);
    await expect(decryptBackupJson(oversized, PASSWORD)).rejects.toThrow(BAD_FORMAT);
    expect(isEncryptedBackup(oversized)).toBe(false);
  });

  it('limits plaintext by UTF-8 bytes, not JS string length', async () => {
    await expect(encryptBackupJson('a'.repeat(PLAINTEXT_LIMIT + 1), PASSWORD)).rejects.toThrow(/5 MB/);
    await expect(encryptBackupJson('अ'.repeat(Math.floor(PLAINTEXT_LIMIT / 3) + 1), PASSWORD)).rejects.toThrow(/5 MB/);
  });

  it('accepts the exact 5 MB plaintext boundary without unsafe base64 stack expansion', async () => {
    const json = ' '.repeat(PLAINTEXT_LIMIT - 2) + '{}';
    const encrypted = await encryptBackupJson(json, PASSWORD);
    expect(Buffer.byteLength(encrypted)).toBeLessThanOrEqual(ENVELOPE_LIMIT);
    await expect(decryptBackupJson(encrypted, PASSWORD)).resolves.toBe(json);
  });

  it('requires at least 8 characters for new exports and never trims passwords', async () => {
    for (const password of ['', '1234567']) {
      await expect(encryptBackupJson('{}', password)).rejects.toThrow(/at least 8/);
    }
    const encrypted = await encryptBackupJson('{}', ' abcdef ');
    await expect(decryptBackupJson(encrypted, ' abcdef ')).resolves.toBe('{}');
    await expect(decryptBackupJson(encrypted, 'abcdef')).rejects.toThrow(AUTH_ERROR);
  });
});

describe('backup detection and secure availability', () => {
  it('detects the format marker even if encrypted metadata is malformed, never treating it as plaintext', () => {
    expect(isEncryptedBackup('{"format":"sanchay.encrypted.v1"}')).toBe(true);
    expect(isEncryptedBackup(JSON.stringify(fixture()))).toBe(true);
  });

  it.each(['null', '[]', '{}', '42', '"sanchay.encrypted.v1"', '{broken', '{"format":"other"}'])('does not misidentify plaintext or invalid JSON: %s', (text) => {
    expect(isEncryptedBackup(text)).toBe(false);
  });

  it('leaves real legacy backup validation unchanged', () => {
    const backup = realBackup();
    const text = JSON.stringify(backup);
    expect(isEncryptedBackup(text)).toBe(false);
    expect(parsePersistedState(text)).toEqual(backup);
  });

  it.each([undefined, {}, { subtle: {} }, { getRandomValues() {} }])('fails closed when WebCrypto is unavailable: %j', async (crypto) => {
    const text = JSON.stringify(fixture());
    vi.stubGlobal('crypto', crypto);
    await expect(encryptBackupJson('{}', PASSWORD)).rejects.toThrow(SECURE_ERROR);
    await expect(decryptBackupJson(text, PASSWORD)).rejects.toThrow(SECURE_ERROR);
    expect(isEncryptedBackup(text)).toBe(true);
  });

  it('does not export plaintext if random generation fails', async () => {
    vi.stubGlobal('crypto', {
      subtle: globalThis.crypto.subtle,
      getRandomValues() { throw new Error('Randomness unavailable'); },
    });
    await expect(encryptBackupJson('{"private":"ledger"}', PASSWORD)).rejects.toThrow();
  });
});
