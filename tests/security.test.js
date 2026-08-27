'use strict';

const assert = require('assert');
const { parseAllowedOrigins, isAllowedOrigin } = require('../backend/src/config/security');
const { generateTemporaryPassword, validatePassword } = require('../backend/src/utils/password');
const requireAutomationSecret = require('../backend/src/middleware/requireAutomationSecret');
const { isAllowedCampaignRecipient, buildTestRecipients, ALLOWED_CAMPAIGN_RECIPIENTS } = require('../backend/src/services/email.service');

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

  it('allows only the two approved campaign recipients', function () {
    assert.deepStrictEqual(ALLOWED_CAMPAIGN_RECIPIENTS, [
      'naveen.karthickbusiness@gmail.com',
      'sundareswaran9407@mountzion.ac.in'
    ]);
    assert.strictEqual(isAllowedCampaignRecipient('NAVEEN.KARTHICKBUSINESS@GMAIL.COM'), true);
    assert.strictEqual(isAllowedCampaignRecipient('sundareswaran9407@mountzion.ac.in'), true);
    assert.strictEqual(isAllowedCampaignRecipient('someone-else@example.com'), false);
    assert.strictEqual(isAllowedCampaignRecipient(''), false);
  });

  it('builds test campaigns with only the two approved destinations', function () {
    const testRecipients = buildTestRecipients({
      assignment_id: 42,
      alumni_id: 7,
      name: 'Actual Alumni Name',
      email: 'alumni@example.com'
    });
    assert.deepStrictEqual(testRecipients.map((recipient) => recipient.email), ALLOWED_CAMPAIGN_RECIPIENTS);
    assert.ok(testRecipients.every((recipient) => recipient.name === 'AMS n8n Test Recipient'));
    assert.ok(testRecipients.every((recipient) => !recipient.email.includes('alumni@example.com')));
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
