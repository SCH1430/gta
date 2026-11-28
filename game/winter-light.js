"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winterBudget = exports.winterBudgets = void 0;
exports.patrolFlash = patrolFlash;
const lamps = {
    crossing: ['#f2eee8','#ded8cc'], port: ['#f0ede4','#d5d9d0'], works: ['#efc286','#d59861'],
    market: ['#ffe3b6','#f4c390'], yard: ['#f4d4a2','#dcab7c'], avenue: ['#ffe2a0','#ffa95c']
};
function lampFamily(f) {
    if(f.crosswalk) return 'crossing';
    if(f.z>86) return 'port';
    if(f.z < -57 || (f.x < -86 && f.z < 25)) return 'works';
    if(f.x>16 && f.x<80 && f.z>3 && f.z<28) return 'market';
    if(Math.abs(f.x)>52 && f.z>-48 && f.z<25) return 'yard';
    return 'avenue';
}
exports.lampFamily = lampFamily;
exports.lampPalette = lamps;
exports.inHeadlight = inHeadlight;
exports.winterBudgets = [
    { flakes: 44, lit: 16, puffs: 3, halo: 46, tracks: 17 },
    { flakes: 79, lit: 32, puffs: 5, halo: 72, tracks: 24 },
    { flakes: 110, lit: 50, puffs: 7, halo: 98, tracks: 31 }
];
const winterBudget = (tier) => exports.winterBudgets[Math.min(2, Math.max(0, Math.round(tier) || 0))];
exports.winterBudget = winterBudget;
function patrolFlash(elapsed) {
    const beat = Math.floor(elapsed * 7) % 4;
    return beat === 0 || beat === 2 ? 'blue' : beat === 1 ? 'red' : null;
}
function inHeadlight(x, y, z, b) {
    const dx = x - b.x, dz = z - b.z, distance = -(dx * b.sin + dz * b.cos) - 1.85;
    if (distance < 0 || distance > 15.4)
        return 0;
    const lateral = dx * b.cos - dz * b.sin, h = y - b.ground;
    const offset = Math.min(b.left ? Math.abs(lateral + .64) : Infinity, b.right ? Math.abs(lateral - .64) : Infinity);
    const width = .28 + distance * .174, height = .39 + distance * .104;
    return Math.max(0, 1 - offset / width) * Math.max(0, 1 - Math.abs(h - .72) / height) * (1 - distance / 18);
}
