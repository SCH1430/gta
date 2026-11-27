"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winterBudget = exports.winterBudgets = void 0;
exports.patrolFlash = patrolFlash;
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
