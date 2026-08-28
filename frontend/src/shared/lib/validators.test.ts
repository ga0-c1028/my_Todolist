import { describe, expect, it } from 'vitest';
import {
  isValidCategoryName,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidTodoTitle,
} from './validators';

describe('isValidEmail', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain dot', () => {
    expect(isValidEmail('user@examplecom')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts exactly 8 chars with letter+digit', () => {
    expect(isValidPassword('abcd1234')).toBe(true);
  });

  it('rejects 7 chars', () => {
    expect(isValidPassword('abc123d')).toBe(false);
  });

  it('rejects letters only', () => {
    expect(isValidPassword('abcdefgh')).toBe(false);
  });

  it('rejects digits only', () => {
    expect(isValidPassword('12345678')).toBe(false);
  });
});

describe('isValidName', () => {
  it('accepts 1 char', () => {
    expect(isValidName('a')).toBe(true);
  });

  it('accepts 30 chars', () => {
    expect(isValidName('a'.repeat(30))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('rejects 31 chars', () => {
    expect(isValidName('a'.repeat(31))).toBe(false);
  });
});

describe('isValidCategoryName', () => {
  it('accepts 1 char', () => {
    expect(isValidCategoryName('a')).toBe(true);
  });

  it('accepts 20 chars', () => {
    expect(isValidCategoryName('a'.repeat(20))).toBe(true);
  });

  it('rejects 21 chars', () => {
    expect(isValidCategoryName('a'.repeat(21))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidCategoryName('')).toBe(false);
  });
});

describe('isValidTodoTitle', () => {
  it('accepts 1 char', () => {
    expect(isValidTodoTitle('a')).toBe(true);
  });

  it('accepts 100 chars', () => {
    expect(isValidTodoTitle('a'.repeat(100))).toBe(true);
  });

  it('rejects 101 chars', () => {
    expect(isValidTodoTitle('a'.repeat(101))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTodoTitle('')).toBe(false);
  });
});
