"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStandalone = isStandalone;
exports.assetUrl = assetUrl;
exports.decodeAudioAsset = decodeAudioAsset;
const packId = 'k77-local-assets';
let entries;
function embeddedPack() {
    return typeof document === 'undefined' ? null : document.getElementById?.(packId) ?? null;
}
function isStandalone() {
    return embeddedPack() !== null;
}
function embeddedUrl(path) {
    const pack = embeddedPack();
    if (!pack)
        return undefined;
    entries ??= JSON.parse(pack.textContent ?? '{}');
    if (!entries || !Object.hasOwn(entries, path))
        throw Error('Файл отсутствует в автономной сборке: ' + path);
    return entries[path];
}
function assetUrl(path) {
    return embeddedUrl(path) ?? './assets/' + path;
}
async function decodeAudioAsset(context, path) {
    const url = embeddedUrl(path);
    if (url) {
        const comma = url.indexOf(',');
        if (comma < 0 || !url.slice(0, comma).endsWith(';base64'))
            throw Error('Некорректная запись звука: ' + path);
        const source = atob(url.slice(comma + 1)), data = new Uint8Array(source.length);
        for (let i = 0; i < source.length; i++)
            data[i] = source.charCodeAt(i);
        return context.decodeAudioData(data.buffer);
    }
    const response = await fetch(new URL(assetUrl(path), document.baseURI));
    if (!response.ok)
        throw Error(path + ': ' + response.status);
    return context.decodeAudioData(await response.arrayBuffer());
}
