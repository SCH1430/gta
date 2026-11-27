const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'offline-pack.json'), 'utf8'));

test('the checked-in site matches the offline package byte for byte', () => {
    let size = 0;
    for (const file of manifest.files) {
        const data = readFileSync(path.join(root, file.path));
        assert.equal(data.length, file.bytes, file.path);
        assert.equal(createHash('sha256').update(data).digest('hex'), file.hash, file.path);
        size += data.length;
    }
    assert.equal(size, manifest.total);
});

test('the service worker uses the same manifest as the site', () => {
    const worker = readFileSync(path.join(root, 'sw.js'), 'utf8');
    const embedded = worker.match(/^const PACK = (.+);$/m);
    assert.ok(embedded, 'service worker is missing its offline package');
    assert.deepEqual(JSON.parse(embedded[1]), manifest);
});
