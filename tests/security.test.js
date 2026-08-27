'use strict';

const assert = require('assert');
const { parseAllowedOrigins, isAllowedOrigin } = require('../backend/src/config/security');
const { generateTemporaryPassword, validatePassword } = require('../backend/src/utils/password');
const requireAutomationSecret = require('../backend/src/middleware/requireAutomationSecret');

describe('Security helpers', function () {
  it('normalizes configured origins and rejects unconfigured cross-origin requests', function () {
    const origins = parseAllowedOrigins('https://alumni.mzcet.in/, https://admin.example.com');
    assert.strictEqual(isAllowedOrigin('https://alumni.mzcet.in', origins), true);
    assert.strictEqual(isAllowedOrigin('https://unknown.example.com', origins), false);
    assert.strictEqual(isAllowedOrigin(undefined, origins), true);
  });

  it('generates passwords that satisfy the application policy', function () {
    const password = generateTemporaryPassword();
    assert.strictEqual(password.length, 12);
    assert.deepStrictEqual(validatePassword(password), []);
  });

  it('accepts only the configured automation secret', function () {
    const previous = process.env.N8N_SHARED_SECRET;
    process.env.N8N_SHARED_SECRET = 'a'.repeat(32);

    let status;
    let nextCalled = false;
    const res = { status(code) { status = code; return this; }, json() { return this; } };
    requireAutomationSecret({ headers: { 'x-automation-secret': 'b'.repeat(32) } }, res, () => { nextCalled = true; });
    assert.strictEqual(status, 401);
    assert.strictEqual(nextCalled, false);

    requireAutomationSecret({ headers: { 'x-automation-secret': 'a'.repeat(32) } }, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    if (previous === undefined) delete process.env.N8N_SHARED_SECRET;
    else process.env.N8N_SHARED_SECRET = previous;
  });
});
