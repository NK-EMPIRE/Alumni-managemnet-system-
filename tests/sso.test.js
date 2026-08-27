const assert = require('assert');
const { getSsoIdentifier, getDashboardRedirectPath } = require('../backend/src/utils/sso');
const { getPaginationParams } = require('../backend/src/helpers/pagination');

describe('SSO helpers', function () {
  it('extracts the best identifier from a token payload', function () {
    const payload = { email: 'student@example.com' };
    assert.strictEqual(getSsoIdentifier(payload), 'student@example.com');
  });

  it('falls back to username when email is missing', function () {
    const payload = { username: 'staff@example.com' };
    assert.strictEqual(getSsoIdentifier(payload), 'staff@example.com');
  });

  it('maps known roles to dashboard pages', function () {
    assert.strictEqual(getDashboardRedirectPath('ADMIN'), 'admin.html');
    assert.strictEqual(getDashboardRedirectPath('LEADER'), 'teamleader.html');
    assert.strictEqual(getDashboardRedirectPath('MEMBER'), 'teammember.html');
    assert.strictEqual(getDashboardRedirectPath('unknown'), 'admin.html');
  });

  it('sanitizes invalid pagination values', function () {
    assert.deepStrictEqual(getPaginationParams({ page: 'NaN', limit: '100000' }), {
      page: 1,
      limit: 100,
      offset: 0
    });
  });
});
