"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeProfile = exports.recoveryNotice = void 0;
exports.validSession = validSession;
exports.loadGame = loadGame;
exports.saveGame = saveGame;
exports.canSaveGame = () => profileLoaded;
exports.switchProfile = switchProfile;
exports.downloadSession = downloadSession;
exports.readExport = readExport;
exports.readLocalReport = readLocalReport;
exports.writeLocalReport = writeLocalReport;
exports.readLocalReplay = readLocalReplay;
exports.writeLocalReplay = writeLocalReplay;
const local_assets_js_1 = require("./local-assets.js");
const sim_types_js_1 = require("./sim-types.js");
const storeName = 'saves';
let opening;
let profile = null;
let profileLoaded = false;
let serial = Promise.resolve();
let directStorage;
exports.recoveryNotice = '';
const slot = (which, age) => 'profile/' + which + '/' + age;
const activeProfile = () => profile;
exports.activeProfile = activeProfile;
function directKey(key) { return 'kontur77:standalone:' + location.pathname + ':' + key; }
function directStore() {
    if (!(0, local_assets_js_1.isStandalone)())
        return null;
    if (directStorage !== undefined)
        return directStorage;
    try {
        const store = window.localStorage, probe = directKey('probe');
        store.setItem(probe, '1');
        store.removeItem(probe);
        directStorage = store;
    }
    catch {
        directStorage = null;
    }
    return directStorage;
}
function readDirect(store, key) {
    const value = store.getItem(directKey(key));
    if (value === null)
        return undefined;
    try {
        return JSON.parse(value);
    }
    catch {
        throw new SyntaxError('Локальная запись повреждена');
    }
}
function writeDirect(store, key, value) {
    const name = directKey(key), json = JSON.stringify(value);
    if (json === undefined)
        store.removeItem(name);
    else
        store.setItem(name, json);
}
function database() {
    if (!opening) {
        const scope = (0, local_assets_js_1.isStandalone)() ? 'standalone:' + location.pathname : new URL('./', location.href).pathname;
        opening = new Promise((resolve, reject) => {
            const req = indexedDB.open('kontur77:' + scope, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(storeName))
                    req.result.createObjectStore(storeName);
            };
            req.onerror = () => reject(req.error);
            req.onsuccess = () => { const db = req.result; db.onversionchange = () => { db.close(); opening = undefined; }; db.onclose = () => { opening = undefined; }; resolve(db); };
        }).catch(err => { opening = undefined; throw err; });
    }
    return opening;
}
async function fetchKeys(keys) {
    const db = await database();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly'), requests = keys.map(k => tx.objectStore(storeName).get(k));
        tx.oncomplete = () => resolve(requests.map(r => r.result));
        tx.onabort = () => reject(tx.error);
    });
}
async function putKey(key, data) {
    const db = await database();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(data, key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
    });
}
const point = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.z);
const object = (p) => p !== null && typeof p === 'object' && !Array.isArray(p);
function validCore(g) {
    if (!object(g) || g.v !== 1 || !point(g.hero) || !Number.isFinite(g.money) || g.money < 0 || !Number.isInteger(g.mission) || g.mission < 0 || g.mission > 3)
        return false;
    if (!Array.isArray(g.cars) || g.cars.length > 200 || !g.cars.every((c) => point(c) && typeof c.id === 'string' && sim_types_js_1.vehicleKinds.includes(c.kind)))
        return false;
    if (g.people !== undefined && (!Array.isArray(g.people) || g.people.length > 1024 || !g.people.every(point)))
        return false;
    const props = g.motorPool?.props, transfer = g.transition;
    if (props !== undefined && (!Array.isArray(props) || !props.every((p) => point(p) && typeof p.id === 'string')))
        return false;
    if (transfer && (!Array.isArray(transfer.route) || !transfer.route.length || !transfer.route.every(point) || !Number.isFinite(transfer.t) || !Number.isFinite(transfer.duration)))
        return false;
    return true;
}
function validSession(s) {
    return !!s && s.version === 1 && object(s.settings) && Number.isFinite(s.yaw) && validCore(s.game) && (!s.game.checkpoint || validCore(s.game.checkpoint));
}
function checksum(json) {
    let hash = 2166136261;
    for (let index = 0; index < json.length; index++)
        hash = Math.imul(hash ^ json.charCodeAt(index), 16777619);
    return 'fnv1a:' + (hash >>> 0).toString(16).padStart(8, '0');
}
async function digest(json) {
    if ((0, local_assets_js_1.isStandalone)() && !globalThis.crypto?.subtle)
        return checksum(json);
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
    return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
}
function parseSession(json) {
    try {
        const value = JSON.parse(json);
        return validSession(value) ? value : null;
    }
    catch {
        return null;
    }
}
async function decode(record) {
    if (record?.format !== 2 || typeof record.json !== 'string' || typeof record.hash !== 'string')
        return null;
    const expected = (0, local_assets_js_1.isStandalone)() && record.hash.startsWith('fnv1a:') ? checksum(record.json) : await digest(record.json);
    return record.hash === expected ? parseSession(record.json) : null;
}
function decodeDirect(record) {
    return record?.format === 2 && typeof record.json === 'string' && checksum(record.json) === record.hash ? parseSession(record.json) : null;
}
function readDirectProfile(store, which) { return readDirect(store, slot(which, 'state')) ?? {}; }
function selectedProfile(value) {
    if (value === undefined || value === null)
        return 1; // First launch or a save from before profiles were introduced.
    if (![1, 2, 3].includes(value))
        throw Error('Не удалось определить выбранный профиль');
    return value;
}
function loadDirect(store) {
    profile = selectedProfile(readDirect(store, 'selected-profile'));
    const { now, previous } = readDirectProfile(store, profile);
    const latest = decodeDirect(now);
    if (latest)
        return latest;
    const backup = decodeDirect(previous);
    if (backup) {
        writeDirect(store, slot(profile, 'state'), { now: previous, previous });
        exports.recoveryNotice = 'Восстановлена резервная запись от ' + new Date(previous.at).toLocaleString('ru-RU');
        return backup;
    }
    if (now || previous)
        throw Error('Записи профиля повреждены');
    return null;
}
function saveDirect(store, which, json, confirmedImport) {
    let current;
    try {
        current = readDirectProfile(store, which);
    }
    catch (error) {
        if (!confirmedImport || !(error instanceof SyntaxError))
            throw error;
        current = {};
    }
    const hash = checksum(json);
    if (current.now?.format === 2 && current.now.hash === hash && current.now.json === json)
        return;
    const previous = decodeDirect(current.now) ? current.now : current.previous;
    const now = { format: 2, at: Date.now(), json, hash };
    writeDirect(store, slot(which, 'state'), { now, previous });
}
async function commit(which, expected, backup, next) {
    const db = await database();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite'), st = tx.objectStore(storeName), request = st.get(slot(which, 'now'));
        let same = false;
        request.onsuccess = () => {
            const actual = request.result;
            same = actual?.json === expected?.json && actual?.hash === expected?.hash && actual?.format === expected?.format;
            if (!same)
                return;
            if (actual?.format === 2 && actual.hash === next.hash && actual.json === next.json)
                return;
            if (backup)
                st.put(backup, slot(which, 'previous'));
            st.put(next, slot(which, 'now'));
        };
        tx.oncomplete = () => resolve(same);
        tx.onabort = () => reject(tx.error);
    });
}
async function generation(json) { return { format: 2, at: Date.now(), json, hash: await digest(json) }; }
async function loadGame() {
    profile = null;
    profileLoaded = false;
    exports.recoveryNotice = '';
    const session = await readGame();
    profileLoaded = true;
    return session;
}
async function readGame() {
    const local = directStore();
    if (local)
        return loadDirect(local);
    const [selected] = await fetchKeys(['selected-profile']);
    const which = selectedProfile(selected);
    profile = which;
    for (;;) {
        const [current, previous, old] = await fetchKeys([slot(which, 'now'), slot(which, 'previous'), 'campaign']);
        const latest = await decode(current);
        if (latest)
            return latest;
        const backup = await decode(previous);
        if (backup) {
            if (!await commit(which, current, undefined, previous))
                continue;
            exports.recoveryNotice = 'Восстановлена резервная запись от ' + new Date(previous.at).toLocaleString('ru-RU');
            return backup;
        }
        if (which === 1 && validSession(old)) {
            if (!await commit(which, current, undefined, await generation(JSON.stringify(old))))
                continue;
            if (current)
                exports.recoveryNotice = 'Открыта исходная запись версии 1.x';
            return old;
        }
        if (current || previous)
            throw Error('Записи профиля повреждены');
        return null;
    }
}
function saveGame(snapshot, { confirmedImport = false } = {}) {
    if (profile === null || (!profileLoaded && !confirmedImport))
        return Promise.reject(Error('Сначала откройте профиль в меню сохранений'));
    if (!validSession(snapshot))
        return Promise.reject(Error('Запись игры не прошла проверку'));
    const which = profile;
    let json;
    try {
        json = JSON.stringify(snapshot);
    }
    catch (e) {
        return Promise.reject(e);
    }
    const local = directStore();
    if (local) {
        try {
            saveDirect(local, which, json, confirmedImport);
            return Promise.resolve();
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    const write = async () => {
        const next = await generation(json);
        for (;;) {
            const [current] = await fetchKeys([slot(which, 'now')]);
            const valid = await decode(current);
            if (await commit(which, current, valid ? current : undefined, next))
                return;
        }
    };
    const pending = serial.then(write, write);
    serial = pending.catch(() => { });
    return pending;
}
async function switchProfile(which) {
    if (![1, 2, 3].includes(which))
        throw Error('Профиль не найден');
    const local = directStore();
    if (local) {
        writeDirect(local, 'selected-profile', which);
        return;
    }
    await serial;
    await putKey('selected-profile', which);
}
function downloadSession(s) {
    const content = JSON.stringify({ app: 'kontur-77', format: 2, date: new Date().toISOString(), session: s }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kontur-77-profil-' + (profile ?? 'session') + '.json';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}
async function readExport(file) {
    if (file.size > 12 * 1024 * 1024)
        throw Error('Файл слишком велик для игрового сохранения');
    const pack = JSON.parse(await file.text());
    if (pack?.app !== 'kontur-77' || pack?.format !== 2 || !validSession(pack.session))
        throw Error('Выберите JSON-сохранение «Контур-77»');
    return pack.session;
}
async function readLocalReport() {
    if (profile === null) return;
    const local = directStore(), key = slot(profile, 'benchmark');
    if (local)
        return readDirect(local, key);
    const [v] = await fetchKeys([key]);
    return v;
}
async function writeLocalReport(report) {
    if (profile === null) throw Error('Сначала откройте профиль в меню сохранений');
    const local = directStore(), key = slot(profile, 'benchmark');
    if (local) {
        writeDirect(local, key, report);
        return;
    }
    await putKey(key, report);
}
async function readLocalReplay() {
    if (profile === null) return;
    const local = directStore(), key = slot(profile, 'replay');
    if (local)
        return readDirect(local, key);
    const [value] = await fetchKeys([key]);
    return value;
}
async function writeLocalReplay(value) {
    if (profile === null) throw Error('Сначала откройте профиль в меню сохранений');
    const local = directStore(), key = slot(profile, 'replay');
    if (local) {
        writeDirect(local, key, value);
        return;
    }
    await putKey(key, value);
}
