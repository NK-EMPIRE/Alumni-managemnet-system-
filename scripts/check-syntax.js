'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const roots = ['backend', 'migrations', 'tests'];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && fullPath.endsWith('.js')) files.push(fullPath);
  }
}

for (const root of roots) walk(path.resolve(root));
files.push(path.resolve('server.js'));

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${file}\n${result.stderr}`);
  }
}

if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files checked.`);
