export const ENCRYPTED_BACKUP_FORMAT = 'sanchay.encrypted.v1';
export const BACKUP_MIN_PASSWORD_LENGTH = 8;
export const MAX_BACKUP_PLAINTEXT_BYTES = 5 * 1024 * 1024;
export const MAX_ENCRYPTED_BACKUP_BYTES = 7 * 1024 * 1024;

const WRITER_ITERATIONS = 600_000;
const MIN_ITERATIONS = 1_000;
const MAX_ITERATIONS = 2_000_000;
const TAG_BYTES = 16;
const BAD_FORMAT = 'Invalid encrypted backup format.';
const AUTH_ERROR = 'Wrong password, or the file was altered.';

interface BackupHeader {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
}

function getCrypto(): Crypto {
  const crypto = globalThis.crypto;
  const subtle = crypto?.subtle;
  if (!subtle || typeof crypto.getRandomValues !== 'function' ||
    typeof subtle.importKey !== 'function' || typeof subtle.deriveKey !== 'function' ||
    typeof subtle.encrypt !== 'function' || typeof subtle.decrypt !== 'function') {
    throw new Error('Encryption needs a secure context (https:// or localhost).');
  }
  return crypto;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function parseBoundedJson(text: string): unknown {
  // Reject before parsing/allocating an unbounded attacker-controlled file. JS code units
  // are a lower bound on UTF-8 bytes; the second guard handles multibyte input.
  if (typeof text !== 'string' || text.length > MAX_ENCRYPTED_BACKUP_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_ENCRYPTED_BACKUP_BYTES) {
    throw new Error(BAD_FORMAT);
  }
  return JSON.parse(text);
}

function toBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  // Never spread a whole backup into function arguments (stack limit on mobile).
  for (let i = 0; i < bytes.length; i += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  }
  return btoa(chunks.join(''));
}

function fromBase64(value: unknown, minBytes: number, maxBytes: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 ||
    value.length > Math.ceil(maxBytes / 3) * 4) {
    throw new Error(BAD_FORMAT);
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const decodedLength = value.length / 4 * 3 - padding;
  // A single character-class scan avoids a repeated-group regex exhausting the stack
  // on a valid multi-megabyte ciphertext. Padding anywhere else is invalid.
  if (decodedLength < minBytes || decodedLength > maxBytes ||
    /[^A-Za-z0-9+/]/.test(value.slice(0, value.length - padding))) {
    throw new Error(BAD_FORMAT);
  }
  const binary = atob(value);
  // Reject nonzero unused pad bits: alternate encodings must not bypass header AAD.
  if (binary.length !== decodedLength || btoa(binary) !== value) throw new Error(BAD_FORMAT);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseEnvelope(text: string) {
  try {
    const value = parseBoundedJson(text);
    if (!isRecord(value) || !exactKeys(value, ['format', 'kdf', 'cipher', 'ciphertext']) ||
      value.format !== ENCRYPTED_BACKUP_FORMAT || !isRecord(value.kdf) || !isRecord(value.cipher)) {
      throw new Error(BAD_FORMAT);
    }
    const { kdf, cipher } = value;
    if (!exactKeys(kdf, ['name', 'hash', 'iterations', 'salt']) ||
      !exactKeys(cipher, ['name', 'iv']) || kdf.name !== 'PBKDF2' || kdf.hash !== 'SHA-256' ||
      cipher.name !== 'AES-GCM' || typeof kdf.iterations !== 'number' ||
      !Number.isSafeInteger(kdf.iterations) || kdf.iterations < MIN_ITERATIONS ||
      kdf.iterations > MAX_ITERATIONS || typeof kdf.salt !== 'string' || typeof cipher.iv !== 'string') {
      throw new Error(BAD_FORMAT);
    }
    const salt = fromBase64(kdf.salt, 16, 16);
    const iv = fromBase64(cipher.iv, 12, 12);
    const ciphertext = fromBase64(value.ciphertext, TAG_BYTES, MAX_BACKUP_PLAINTEXT_BYTES + TAG_BYTES);
    // Fixed field ordering is part of v1's AAD, independent of JSON key order/whitespace.
    const header: BackupHeader = {
      format: ENCRYPTED_BACKUP_FORMAT,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: kdf.iterations, salt: kdf.salt },
      cipher: { name: 'AES-GCM', iv: cipher.iv },
    };
    return { header, salt, iv, ciphertext };
  } catch {
    throw new Error(BAD_FORMAT);
  }
}

function headerAad(header: BackupHeader): Uint8Array<ArrayBuffer> {
  // A constant format string alone does NOT authenticate all metadata. Authenticate
  // the entire validated canonical header; no fallback to the draft's constant AAD.
  return new TextEncoder().encode(JSON.stringify(header));
}

async function deriveKey(
  subtle: SubtleCrypto,
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
  usage: 'encrypt' | 'decrypt'
): Promise<CryptoKey> {
  const encodedPassword = new TextEncoder().encode(password);
  try {
    const material = await subtle.importKey('raw', encodedPassword, 'PBKDF2', false, ['deriveKey']);
    return await subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      [usage]
    );
  } finally {
    encodedPassword.fill(0);
  }
}

/** Encrypt JSON already sanitized by createBackupState; never persists passwords or saves files. */
export async function encryptBackupJson(stateJson: string, password: string): Promise<string> {
  const crypto = getCrypto();
  if (password.length < BACKUP_MIN_PASSWORD_LENGTH) {
    throw new Error(`Backup password must be at least ${BACKUP_MIN_PASSWORD_LENGTH} characters.`);
  }
  const tooLarge = 'Backup exceeds the 5 MB plaintext limit.';
  if (stateJson.length > MAX_BACKUP_PLAINTEXT_BYTES) throw new Error(tooLarge);
  const plaintext = new TextEncoder().encode(stateJson);
  if (plaintext.byteLength > MAX_BACKUP_PLAINTEXT_BYTES) {
    plaintext.fill(0);
    throw new Error(tooLarge);
  }
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const header: BackupHeader = {
      format: ENCRYPTED_BACKUP_FORMAT,
      kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: WRITER_ITERATIONS, salt: toBase64(salt) },
      cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    };
    const key = await deriveKey(crypto.subtle, password, salt, WRITER_ITERATIONS, 'encrypt');
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: headerAad(header), tagLength: 128 }, key, plaintext
    );
    return JSON.stringify({ ...header, ciphertext: toBase64(new Uint8Array(ciphertext)) });
  } catch {
    throw new Error('Could not encrypt this backup. No unencrypted backup was created.');
  } finally {
    plaintext.fill(0);
  }
}

/** Returns authenticated JSON only. Caller must still validate it with parsePersistedState before restore. */
export async function decryptBackupJson(envelopeJson: string, password: string): Promise<string> {
  const crypto = getCrypto();
  const { header, salt, iv, ciphertext } = parseEnvelope(envelopeJson);
  let plaintext: Uint8Array<ArrayBuffer> | undefined;
  try {
    const key = await deriveKey(crypto.subtle, password, salt, header.kdf.iterations, 'decrypt');
    plaintext = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: headerAad(header), tagLength: 128 }, key, ciphertext
    ));
    if (plaintext.byteLength > MAX_BACKUP_PLAINTEXT_BYTES) throw new Error(BAD_FORMAT);
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(plaintext);
  } catch {
    // Password mistakes and authentication failures deliberately reveal the same information.
    throw new Error(AUTH_ERROR);
  } finally {
    plaintext?.fill(0);
  }
}

/** A bounded routing hint, not validation: malformed v1 envelopes still take the encrypted path. */
export function isEncryptedBackup(text: string): boolean {
  try {
    const value = parseBoundedJson(text);
    return isRecord(value) && value.format === ENCRYPTED_BACKUP_FORMAT;
  } catch {
    return false;
  }
}
