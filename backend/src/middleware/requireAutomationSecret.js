'use strict';

const crypto = require('crypto');

function requireAutomationSecret(req, res, next) {
  const received = String(req.headers['x-automation-secret'] || '');
  const expected = String(process.env.N8N_SHARED_SECRET || '');

  if (!expected || received.length !== expected.length) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing automation secret header'
    });
  }

  if (!crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing automation secret header'
    });
  }

  return next();
}

module.exports = requireAutomationSecret;
