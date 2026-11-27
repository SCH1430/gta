const test = require('node:test');
const assert = require('node:assert/strict');

function session(money) {
    return {
        version: 1, settings: {}, yaw: 0,
        game: { v: 1, hero: { x: 0, z: 0 }, money, mission: 0, cars: [] }
    };
}

function legacyExport(money) {
    const text = JSON.stringify({ app: 'kontur-77', format: 2, session: session(money) });
    return { size: text.length, text: async () => text };
}

function browser(t, standalone = true) {
    const entries = new Map();
    const inputs = [];
    const location = { href: 'https://example.test/kanal/', pathname: '/kanal/', reloads: 0, reload() { this.reloads++; } };
    const globals = {
        location,
        window: { localStorage: {
            getItem: key => entries.get(key) ?? null,
            setItem: (key, value) => entries.set(key, String(value)),
            removeItem: key => entries.delete(key)
        } },
        document: {
            getElementById: id => standalone && id === 'k77-local-assets' ? {} : null,
            createElement() {
                const input = { click() {} };
                inputs.push(input);
                return input;
            }
        },
        indexedDB: { open() {
            const req = { error: Error('Storage unavailable') };
            queueMicrotask(() => req.onerror());
            return req;
        } }
    };
    for (const [name, value] of Object.entries(globals)) {
        const previous = Object.getOwnPropertyDescriptor(globalThis, name);
        Object.defineProperty(globalThis, name, { configurable: true, value });
        t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
    }
    for (const file of ['../game/field-services.js', '../game/storage.js'])
        delete require.cache[require.resolve(file)];
    const storage = require('../game/storage.js');
    const { FieldServices } = require('../game/field-services.js');
    const desk = new FieldServices(() => session(0), () => {}, () => {}, () => {});
    return {
        entries, location, storage, desk,
        key: name => 'kontur77:standalone:' + location.pathname + ':' + name,
        async choose(file) {
            await desk.act('desk-import');
            const input = inputs.at(-1);
            input.files = [file];
            return input.onchange();
        }
    };
}

test('an unreadable profile selector preserves both generations through autosave and profile recovery', async t => {
    const { entries, storage, key, desk, location } = browser(t);
    await storage.loadGame();
    await storage.saveGame(session(100));
    await storage.saveGame(session(200));
    const profileKey = key('profile/1/state');
    const original = entries.get(profileKey);
    entries.set(key('selected-profile'), '!');
    await assert.rejects(storage.loadGame());
    assert.equal(storage.activeProfile(), null);
    assert.equal(storage.canSaveGame(), false);
    await assert.rejects(storage.saveGame(session(0)));
    await assert.rejects(storage.saveGame(session(1)));
    await desk.act('desk-profile', '1');
    assert.equal(location.reloads, 1);
    assert.equal(entries.get(profileKey), original);
    assert.deepEqual(await storage.loadGame(), session(200));
    assert.equal(storage.canSaveGame(), true);
});

test('a failed IndexedDB load also prevents saves and the legacy JSON export remains readable on the site', async t => {
    const { storage } = browser(t, false);
    await assert.rejects(storage.loadGame(), /Storage unavailable/);
    assert.equal(storage.canSaveGame(), false);
    await assert.rejects(storage.saveGame(session(0)), /профиль/);
    assert.deepEqual(await storage.readExport(legacyExport(300)), session(300));
});

test('a damaged known slot can be restored only by confirming the new import', async t => {
    const { storage, desk, choose, entries, location, key } = browser(t);
    entries.set(key('selected-profile'), '2');
    const slot = key('profile/2/state');
    entries.set(slot, 'damaged');
    await assert.rejects(storage.loadGame());
    await assert.rejects(storage.saveGame(session(0)));
    await choose(legacyExport(400));
    assert.equal(entries.get(slot), 'damaged');
    await desk.act('desk-confirm');
    assert.equal(location.reloads, 1);
    assert.deepEqual(await storage.loadGame(), session(400));
    assert.equal(JSON.parse(entries.get(slot)).previous, undefined);
});

test('choosing an invalid import clears the previous confirmation and keeps the slot intact', async t => {
    const { storage, desk, choose, location } = browser(t);
    await storage.loadGame();
    await storage.saveGame(session(100));
    await choose(legacyExport(777));
    assert.match(desk.draw(), /desk-confirm/);
    await choose({ size: 1, text: async () => '{' });
    assert.doesNotMatch(desk.draw(), /desk-confirm/);
    assert.ok(desk.message);
    await desk.act('desk-confirm');
    assert.equal(location.reloads, 0);
    assert.deepEqual(await storage.loadGame(), session(100));
});

test('a late read cannot revive an older or cancelled import', async t => {
    const { storage, desk, choose } = browser(t);
    await storage.loadGame();
    let startRead, finishRead;
    const started = new Promise(resolve => { startRead = resolve; });
    const first = choose({ size: 10, text() {
        startRead();
        return new Promise(resolve => { finishRead = resolve; });
    } });
    await started;
    await choose(legacyExport(200));
    finishRead(await legacyExport(100).text());
    await first;
    assert.deepEqual(desk.pending, session(200));
    await desk.act('desk-cancel');
    assert.doesNotMatch(desk.draw(), /desk-confirm/);
});
