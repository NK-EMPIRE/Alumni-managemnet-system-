const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log("Logging in as 'ert'...");
    // Since we don't know ert's password, we will generate a JWT token directly for user ID 19
    // matching user.controller.js login generation.
    const jwt = require('jsonwebtoken');
    const dotenv = require('dotenv');
    dotenv.config();
    
    const token = jwt.sign(
      { userId: 19, email: 'ert@gmail.com', role: 'LEADER' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log("Generated mock JWT token for ert.");

    console.log("Fetching assignments from local server...");
    const res = await get('http://localhost:3000/api/v1/alumni/assigned?onlyMe=true&page=1&limit=100', token);
    console.log("Server response:", JSON.stringify(res, null, 2));
    
  } catch (err) {
    console.error("HTTP request failed:", err.message);
  }
}

run();
