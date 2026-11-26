"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.breakSpeed = exports.fixturesById = exports.fixtureAt = exports.fixtures = exports.junctionKey = exports.intact = void 0;
exports.restoreFixtures = restoreFixtures;
exports.brokenCircuits = brokenCircuits;
const world_layout_js_1 = require("./world-layout.js");
exports.intact = Object.freeze({});
const junctionKey = ({ x, z }) => Number(x.toFixed(3)) + ':' + Number(z.toFixed(3));
exports.junctionKey = junctionKey;
const layout = [];
for (const [i, p] of world_layout_js_1.streetLamps.entries()) {
    const face = p.crosswalk ? Math.atan2(p.crosswalk.x - p.x, p.crosswalk.z - p.z) :
        p.face ?? (i < 16 || i >= 20 ? 0 : p.x < 0 ? Math.PI / 2 : -Math.PI / 2);
    layout.push({ ...p, id: 'lamp:' + (0, exports.junctionKey)(p), kind: 'lamp', face });
}
for (const p of world_layout_js_1.signalMasts) {
    const cross = world_layout_js_1.signalPositions.reduce((a, b) => (a.x - p.x) ** 2 + (a.z - p.z) ** 2 < (b.x - p.x) ** 2 + (b.z - p.z) ** 2 ? a : b);
    layout.push({ ...p, id: 'signal:' + (0, exports.junctionKey)(p), kind: 'signal', circuit: (0, exports.junctionKey)(cross) });
}
exports.fixtures = layout;
const byPosition = new Map(layout.map(p => [(0, exports.junctionKey)(p), p]));
const fixtureAt = (x, z) => byPosition.get((0, exports.junctionKey)({ x, z }));
exports.fixtureAt = fixtureAt;
exports.fixturesById = new Map(layout.map(p => [p.id, p]));
function restoreFixtures(input, now) {
    if (!input || typeof input !== 'object')
        return exports.intact;
    const result = {};
    for (const [id, entry] of Object.entries(input)) {
        if (!exports.fixturesById.has(id) || !entry || typeof entry !== 'object')
            continue;
        const { at, dx, dz } = entry;
        if (!Number.isFinite(dx) || !Number.isFinite(dz) || !Number.isFinite(at))
            continue;
        const length = Math.hypot(dx, dz);
        if (length < .001)
            continue;
        result[id] = { at: Math.max(0, Math.min(now, at)), dx: dx / length, dz: dz / length };
        if (Number.isFinite(entry.raisedAt))
            result[id].raisedAt = Math.max(at, Math.min(now, entry.raisedAt));
    }
    return result;
}
function brokenCircuits(broken) {
    const dark = new Set();
    for (const id of Object.keys(broken)) {
        const circuit = exports.fixturesById.get(id)?.circuit;
        if (circuit)
            dark.add(circuit);
    }
    return dark;
}
const breakSpeed = (kind, f) => (f.kind === 'signal' ? 4.25 : 5.15) * ({ hatch: 1, sedan: .90, van: .79, suv: .82, pickup: .77, coupe: 1.04, taxi: .90, wagon: .91, towtruck: .72, utility: .69 }[kind]);
exports.breakSpeed = breakSpeed;
