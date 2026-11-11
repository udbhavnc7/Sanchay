import { describe, expect, it } from 'vitest';
import {
  BASE_LOCKOUT_MS,
  createPinCredential,
  isValidPinFormat,
  lockoutDelayMs,
  MAX_ATTEMPTS_BEFORE_LOCKOUT,
  MAX_LOCKOUT_MS,
  verifyPinCredential,
} from './appLock';

const FAST_ITERATIONS = 1_000;

describe('app lock credentials', () => {
  it('accepts only four-digit PINs', () => {
    expect(isValidPinFormat('1234')).toBe(true);
    expect(isValidPinFormat('0000')).toBe(true);
    expect(isValidPinFormat('123')).toBe(false);
    expect(isValidPinFormat('12345')).toBe(false);
    expect(isValidPinFormat('12a4')).toBe(false);
    expect(isValidPinFormat('')).toBe(false);
  });

  it('stores a salted PBKDF2 credential without the PIN', async () => {
    const credential = await createPinCredential('2468', FAST_ITERATIONS);

    expect(credential.algorithm).toBe('PBKDF2-SHA-256');
    expect(credential.iterations).toBe(FAST_ITERATIONS);
    expect(credential.salt.length).toBeGreaterThan(0);
    expect(credential.hash.length).toBeGreaterThan(0);
    expect(JSON.stringify(credential)).not.toContain('2468');
  });

  it('uses a fresh random salt for every credential', async () => {
    const first = await createPinCredential('1357', FAST_ITERATIONS);
    const second = await createPinCredential('1357', FAST_ITERATIONS);

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it('verifies the correct PIN and rejects a wrong PIN', async () => {
    const credential = await createPinCredential('4321', FAST_ITERATIONS);

    await expect(verifyPinCredential('4321', credential)).resolves.toBe(true);
    await expect(verifyPinCredential('1234', credential)).resolves.toBe(false);
    await expect(verifyPinCredential('432', credential)).resolves.toBe(false);
  });

  it('rejects a malformed PIN before hashing', async () => {
    await expect(createPinCredential('12ab', FAST_ITERATIONS)).rejects.toThrow();
  });
});

describe('app lock lockout backoff', () => {
  it('does not delay attempts below the threshold', () => {
    for (let failures = 0; failures < MAX_ATTEMPTS_BEFORE_LOCKOUT; failures += 1) {
      expect(lockoutDelayMs(failures)).toBe(0);
    }
  });

  it('backs off exponentially once the threshold is reached', () => {
    expect(lockoutDelayMs(MAX_ATTEMPTS_BEFORE_LOCKOUT)).toBe(BASE_LOCKOUT_MS);
    expect(lockoutDelayMs(MAX_ATTEMPTS_BEFORE_LOCKOUT + 1)).toBe(BASE_LOCKOUT_MS * 2);
    expect(lockoutDelayMs(MAX_ATTEMPTS_BEFORE_LOCKOUT + 2)).toBe(BASE_LOCKOUT_MS * 4);
  });

  it('caps the lockout at the maximum delay', () => {
    expect(lockoutDelayMs(MAX_ATTEMPTS_BEFORE_LOCKOUT + 50)).toBe(MAX_LOCKOUT_MS);
    expect(lockoutDelayMs(Number.POSITIVE_INFINITY)).toBe(0);
  });
});