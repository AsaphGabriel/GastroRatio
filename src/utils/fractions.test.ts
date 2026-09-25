import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatHouseholdFraction } from './fractions.js';

describe('formatHouseholdFraction', () => {
  it('formats decimals to household fractions', () => {
    assert.strictEqual(formatHouseholdFraction(1.33), '1 e 1/3');
    assert.strictEqual(formatHouseholdFraction(0.5), '1/2');
    assert.strictEqual(formatHouseholdFraction(2.75), '2 e 3/4');
    assert.strictEqual(formatHouseholdFraction(1.0), '1');
    assert.strictEqual(formatHouseholdFraction(0.25), '1/4');
    assert.strictEqual(formatHouseholdFraction(0.95), '1');
    assert.strictEqual(formatHouseholdFraction(1.95), '2');
    assert.strictEqual(formatHouseholdFraction(1.15), '1 e 1/4');
    assert.strictEqual(formatHouseholdFraction(1.10), '1');
    assert.strictEqual(formatHouseholdFraction(0), '0');
  });
});
