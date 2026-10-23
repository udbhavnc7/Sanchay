import { describe, expect, it } from 'vitest';
import {
  addMoney,
  compareMoney,
  fromMinorUnits,
  isValidAmount,
  parseMoneyInput,
  subtractMoney,
  sumMoney,
  toMinorUnits,
} from './money';

describe('money minor units', () => {
  it('adds decimal amounts without binary drift', () => {
    expect(toMinorUnits(0.1) + toMinorUnits(0.2)).toBe(30);
    expect(toMinorUnits(sumMoney([0.1, 0.2]))).toBe(30);
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
  });

  it('keeps seeded account totals exact', () => {
    const total = sumMoney([68450.75, 142300, 6400]);
    expect(toMinorUnits(total)).toBe(21_715_075);
    expect(total).toBe(217150.75);
  });

  it('adds, subtracts and compares using minor units', () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(toMinorUnits(subtractMoney(0.3, 0.1))).toBe(20);
    expect(compareMoney(100.01, 100.02)).toBe(-1);
    expect(compareMoney(100.02, 100.02)).toBe(0);
    expect(fromMinorUnits(21715075)).toBe(217150.75);
  });

  it('handles currencies with different minor units', () => {
    expect(parseMoneyInput('100', 'JPY')).toMatchObject({
      ok: true,
      amount: 100,
      minorUnits: 100,
    });
    expect(parseMoneyInput('100.5', 'JPY').ok).toBe(false);
    expect(toMinorUnits(100, 'JPY')).toBe(100);
    expect(toMinorUnits(100, 'INR')).toBe(10000);
  });
});

describe('parseMoneyInput', () => {
  it('parses formatted positive amounts exactly', () => {
    expect(parseMoneyInput('₹1,234.56')).toMatchObject({
      ok: true,
      amount: 1234.56,
      minorUnits: 123456,
    });
    expect(parseMoneyInput('1200')).toMatchObject({
      ok: true,
      amount: 1200,
      minorUnits: 120000,
    });
  });

  it('rejects empty, malformed, zero and over-precise amounts', () => {
    expect(parseMoneyInput('')).toMatchObject({ ok: false });
    expect(parseMoneyInput('abc')).toMatchObject({ ok: false });
    expect(parseMoneyInput('0')).toMatchObject({ ok: false });
    expect(parseMoneyInput('-50')).toMatchObject({ ok: false });
    expect(parseMoneyInput('1000.999')).toMatchObject({ ok: false });
  });

  it('rejects unsafe values', () => {
    expect(parseMoneyInput('999999999999999999')).toMatchObject({ ok: false });
  });
});

describe('isValidAmount', () => {
  it('accepts two-decimal values and rejects extra precision', () => {
    expect(isValidAmount(1000.99)).toBe(true);
    expect(isValidAmount(1000.999)).toBe(false);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-5)).toBe(false);
    expect(isValidAmount(Number.NaN)).toBe(false);
  });
});
