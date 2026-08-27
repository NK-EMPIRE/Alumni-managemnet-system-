'use strict';

const http = require('http');
const { server } = require('../server');

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ port: server.address().port, path }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
  });
}

(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    const health = await request('/api/health');
    if (health.status !== 200) throw new Error(`Health status was ${health.status}`);
    if (!health.headers['content-security-policy']) throw new Error('CSP header missing');
    if (health.headers['x-powered-by']) throw new Error('x-powered-by header present');

    const missing = await request('/api/not-a-real-route');
    if (missing.status !== 404) throw new Error(`API 404 status was ${missing.status}`);
    if (JSON.parse(missing.body).success !== false) throw new Error('API 404 response was not JSON');

    console.log('HTTP smoke test passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
