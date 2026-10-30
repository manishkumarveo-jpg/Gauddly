import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordChecks, isStrongPassword } from '../src/lib/password.js';

test('a password needs 8 characters, an uppercase letter and a number or symbol', () => {
  assert.equal(isStrongPassword('Sanctum1'), true);
  assert.equal(isStrongPassword('Sanctum!'), true);
  assert.equal(isStrongPassword('Sanct1'), false, 'too short');
  assert.equal(isStrongPassword('sanctum1'), false, 'no uppercase');
  assert.equal(isStrongPassword('Sanctumm'), false, 'letters only');
  assert.deepEqual(passwordChecks('abc').map((c) => c.ok), [false, false, false]);
});
