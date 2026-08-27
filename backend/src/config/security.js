'use strict';

function parseAllowedOrigins(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => origin.replace(/\/$/, ''))
  );
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (!(allowedOrigins instanceof Set) || allowedOrigins.size === 0) return false;
  return allowedOrigins.has(String(origin).replace(/\/$/, ''));
}

function requireProductionSecret(name, value) {
  if (process.env.NODE_ENV !== 'production') return;
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to a random value of at least 32 characters in production`);
  }
}

module.exports = { parseAllowedOrigins, isAllowedOrigin, requireProductionSecret };
