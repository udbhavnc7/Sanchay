/**
 * App-lock PIN credential handling.
 *
 * The PIN is never stored in plaintext. We store a salted PBKDF2-SHA-256
 * derivation (a standard, reviewed construction) and compare in constant time.
 *
 * A local app lock is an ACCESS BARRIER, not encryption of the ledger data.
 */

export interface PinCredential {
  algorithm: 'PBKDF2-SHA-256';
  iterations: number;
  /** Base64-encoded random salt. */
  salt: string;
  /** Base64-encoded derived key. */
  hash: string;
}

export const PIN_LENGTH = 4;
export const PIN_ITERATIONS = 120_000;
export const PIN_SALT_BYTES = 16;
export const PIN_HASH_BITS = 256;

export const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
export const BASE_LOCKOUT_MS = 30_000;
export const MAX_LOCKOUT_MS = 5 * 60_000;

export function isValidPinFormat(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Secure hashing is unavailable in this environment.');
  }
  return subtle;
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derivePinHash(
  pin: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const encoded = new TextEncoder().encode(pin);
  const key = await subtle.importKey('raw', toBuffer(encoded), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: toBuffer(salt), iterations, hash: 'SHA-256' },
    key,
    PIN_HASH_BITS
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export async function createPinCredential(
  pin: string,
  iterations: number = PIN_ITERATIONS
): Promise<PinCredential> {
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN must be exactly 4 digits.');
  }
  const salt = new Uint8Array(PIN_SALT_BYTES);
  globalThis.crypto.getRandomValues(salt);
  const hash = await derivePinHash(pin, salt, iterations);
  return {
    algorithm: 'PBKDF2-SHA-256',
    iterations,
    salt: toBase64(salt),
    hash: toBase64(hash),
  };
}

export async function verifyPinCredential(
  pin: string,
  credential: PinCredential
): Promise<boolean> {
  if (!isValidPinFormat(pin)) {
    return false;
  }
  const salt = fromBase64(credential.salt);
  const expected = fromBase64(credential.hash);
  const actual = await derivePinHash(pin, salt, credential.iterations);
  return constantTimeEqual(actual, expected);
}

/**
 * Milliseconds to wait after the given number of consecutive failures.
 * Zero below the threshold, then exponentially backing off up to MAX_LOCKOUT_MS.
 */
export function lockoutDelayMs(failures: number): number {
  if (!Number.isFinite(failures) || failures < MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    return 0;
  }
  const step = Math.min(failures - MAX_ATTEMPTS_BEFORE_LOCKOUT, 10);
  return Math.min(BASE_LOCKOUT_MS * 2 ** step, MAX_LOCKOUT_MS);
}