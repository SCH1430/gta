"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.townProgrammes = exports.programmes = void 0;
exports.isProgramme = isProgramme;
exports.nextProgramme = nextProgramme;
exports.roadAcoustics = roadAcoustics;
exports.programmes = ['fm-weather', 'fm-request', 'fm-hockey', 'radio', 'radio2'];
exports.townProgrammes = ['fm-route-restored', 'fm-lane-blocked', 'fm-lane-clear'];
const archive = ['archive-a', 'archive-b', 'archive-c'];
const stories = ['fm-ledger', 'fm-heat', 'fm-gauge', 'fm-power', 'fm-letter', 'fm-intro', 'fm-end', 'fm-night', 'dock-manifest', 'dock-clear', 'dock-receipt'];
const valid = new Set([...exports.programmes, ...archive, ...stories, ...exports.townProgrammes,
    'canal-lost-keys','dispatch-yard-call','dispatch-yard-reply',...['snow','thaw','clear','wind'].map(w=>'canal-weather-'+w)]);
function isProgramme(id) { return valid.has(id); }
function nextProgramme(slot, unlocked = [], tapes = false) {
    const news = unlocked.filter(isProgramme);
    if (slot % 4 === 2 && news.length)
        return news;
    if (slot % 5 === 4 && tapes)
        return archive;
    return [exports.programmes[slot % exports.programmes.length]];
}
function roadAcoustics(x, z) {
    const edge = (distance, full) => Math.max(0, Math.min(1, (full + 2 - distance) / 2));
    const concrete = edge(Math.abs(z - 13), 3.8) * edge(Math.abs(x - 63), 50);
    const bridge = Math.max(edge(Math.abs(x + 126), 5.9), edge(Math.abs(x - 46), 5.9)) * edge(Math.abs(z - 73.5), 14);
    return { concrete, bridge };
}
