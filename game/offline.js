"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareOffline = prepareOffline;
exports.auditOffline = auditOffline;
const local_assets_js_1 = require("./local-assets.js");
function waitForInstall(registration) {
    if (registration.active)
        return Promise.resolve(registration.active);
    return new Promise((resolve, reject) => {
        let worker;
        const cleanup = () => {
            worker?.removeEventListener('statechange', update);
            registration.removeEventListener('updatefound', found);
        };
        const update = () => {
            const active = registration.active;
            if (active && active.state === 'activated') {
                cleanup();
                resolve(active);
            }
            else if (worker?.state === 'redundant') {
                cleanup();
                reject(Error('Загрузка прервана. Проверьте сеть и свободное место.'));
            }
        };
        const found = () => {
            worker?.removeEventListener('statechange', update);
            worker = registration.installing || registration.waiting || registration.active;
            worker?.addEventListener('statechange', update);
            update();
        };
        registration.addEventListener('updatefound', found);
        found();
    });
}
async function prepareOffline(report) {
    let current = { phase: 'checking', loaded: 0, total: 0 };
    const emit = (next) => { current = next; report(next); };
    emit(current);
    if ((0, local_assets_js_1.isStandalone)()) {
        try {
            const audit = await auditEmbedded();
            if (audit.bad.length)
                throw Error('Файл игры повреждён. Распакуйте архив ещё раз.');
            emit({ phase: 'ready', loaded: audit.total, total: audit.total });
        }
        catch (error) {
            emit({ ...current, phase: 'error', error: error instanceof Error ? error.message : 'Не удалось проверить HTML-файл.' });
        }
        return;
    }
    if (!window.isSecureContext || !('serviceWorker' in navigator)) {
        emit({ ...current, phase: 'error', error: 'Для офлайн-режима откройте игру по HTTPS или на localhost.' });
        return;
    }
    const sw = navigator.serviceWorker;
    const scope = new URL('./', location.href);
    const onMessage = (event) => {
        if (event.data?.tag !== 'kontur-pack')
            return;
        if (event.data.phase === 'loading' || event.data.phase === 'error')
            emit(event.data);
    };
    sw.addEventListener('message', onMessage);
    try {
        const existing = await sw.getRegistration(scope.href);
        let reg;
        if (existing?.scope === scope.href && existing.active && existing.active.scriptURL === new URL('sw.js', scope).href) {
            reg = existing;
        }
        else {
            const info = await fetch(new URL('offline-pack.json', scope), { cache: 'no-cache' });
            if (!info.ok)
                throw Error('Пакет офлайн-игры недоступен.');
            const { total } = await info.json();
            if (typeof total === 'number')
                emit({ phase: 'loading', loaded: 0, total });
            reg = await sw.register(new URL('sw.js', scope), { scope: scope.href, updateViaCache: 'none' });
        }
        const worker = await waitForInstall(reg);
        const result = await new Promise((resolve, reject) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = event => { channel.port1.close(); resolve(event.data); };
            channel.port1.onmessageerror = () => { channel.port1.close(); reject(Error('Не удалось подтвердить офлайн-пакет.')); };
            worker.postMessage({ type: 'VERIFY_PACK' }, [channel.port2]);
        });
        emit(result);
        if (reg === existing && navigator.onLine)
            void reg.update().catch(() => { });
    }
    catch (error) {
        if (current.phase !== 'error')
            emit({ ...current, phase: 'error',
                error: error instanceof Error ? error.message : 'Не удалось сохранить ресурсы игры.' });
    }
    finally {
        sw.removeEventListener('message', onMessage);
    }
}
async function auditEmbedded() {
    const manifest = document.getElementById('k77-local-integrity')?.textContent;
    if (!manifest)
        throw Error('В HTML-файле отсутствует список встроенных ресурсов.');
    const entries = Object.entries(JSON.parse(manifest));
    if (!entries.length)
        throw Error('Список встроенных ресурсов пуст.');
    const bad = [];
    let total = 0;
    for (const [path, info] of entries) {
        total += info.bytes;
        try {
            const url = (0, local_assets_js_1.assetUrl)(path), header = url.slice(0, url.indexOf(','));
            if (!header.endsWith(';base64'))
                throw Error(path);
            const raw = atob(url.slice(header.length + 1));
            if (raw.length !== info.bytes)
                throw Error(path);
            if (globalThis.crypto?.subtle) {
                const data = Uint8Array.from(raw, ch => ch.charCodeAt(0));
                const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), b => b.toString(16).padStart(2, '0')).join('');
                if (hash !== info.hash)
                    throw Error(path);
            }
        }
        catch {
            bad.push(path);
        }
    }
    return { files: entries.length, good: entries.length - bad.length, bad, fixed: 0, total };
}
async function auditOffline(repair = []) {
    if ((0, local_assets_js_1.isStandalone)())
        return auditEmbedded();
    const worker = (await navigator.serviceWorker.getRegistration(new URL('./', location.href).href))?.active;
    if (!worker)
        throw Error('Офлайн-пакет ещё устанавливается');
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const limit = window.setTimeout(() => { channel.port1.close(); reject(Error('Проверка заняла слишком много времени')); }, 90000);
        channel.port1.onmessage = e => { clearTimeout(limit); channel.port1.close(); e.data.error ? reject(Error(e.data.error)) : resolve(e.data); };
        worker.postMessage({ type: 'AUDIT_PACK', repair }, [channel.port2]);
    });
}
