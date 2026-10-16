import { describe, expect, it } from 'vitest';
import { xrayKindToApi, xrayKindToDb } from '../src/utils/enums';

describe('xray kind mapping', () => {
  it('maps API labels to DB enums and back', () => {
    expect(xrayKindToDb('Before')).toBe('LEGACY_BEFORE');
    expect(xrayKindToDb('After')).toBe('LEGACY_AFTER');
    expect(xrayKindToDb('Record')).toBe('RECORD');

    expect(xrayKindToApi('LEGACY_BEFORE')).toBe('Before');
    expect(xrayKindToApi('LEGACY_AFTER')).toBe('After');
    expect(xrayKindToApi('RECORD')).toBe('Record');
  });
});
