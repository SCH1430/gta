"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDuration = void 0;
exports.shouldIntercept = shouldIntercept;
exports.patrolDestination = patrolDestination;
exports.bridgePatrolTarget = bridgePatrolTarget;
const world_layout_js_1 = require("./world-layout.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const scanDuration = (level) => 8 + level * 2.4;
exports.scanDuration = scanDuration;
function shouldIntercept(level, rank, driving, contact, car) {
    return level === 3 && rank === 1 && driving && Math.hypot(contact.motion.x, contact.motion.z) > 5 && (0, sim_navigation_js_1.dist)(car, contact.position) > 12;
}
function inWorld(x, z) {
    return {
        x: (0, sim_navigation_js_1.clamp)(x, world_layout_js_1.bounds.minX + 2, world_layout_js_1.bounds.maxX - 2),
        z: (0, sim_navigation_js_1.clamp)(z, world_layout_js_1.bounds.minZ + 2, world_layout_js_1.bounds.maxZ - 2)
    };
}
const spokes = [{ x: 0, z: -1 }, { x: 1, z: 0 }, { x: 0, z: 1 }, { x: -1, z: 0 }];
function patrolDestination(contact, intercept, search, time, rank) {
    const { x, z } = contact.position;
    if (!search) {
        const motion = contact.motion, pace = Math.max(1, Math.hypot(motion.x, motion.z));
        const lead = intercept ? (0, sim_navigation_js_1.clamp)(pace * 2.1, 18, 36) : 0;
        return inWorld(x + motion.x / pace * lead, z + motion.z / pace * lead);
    }
    if (rank === 0 && time < 3.8)
        return inWorld(search.x, search.z);
    const spoke = spokes[(rank + Math.floor((time + rank * .9) / 4.6)) % spokes.length];
    const radius = search.radius * (rank === 0 ? .51 : .73);
    return inWorld(search.x + spoke.x * radius, search.z + spoke.z * radius);
}
function bridgePatrolTarget(level, rank, contact, bridges) {
    if (level < 3 || rank !== 2 || Math.abs(contact.motion.z) < 4)
        return null;
    const { x, z } = contact.position;
    const bridge = bridges.find(b => Math.abs(b.x - x) < 18);
    if (!bridge)
        return null;
    const south = contact.motion.z > 0;
    const onApproach = south ? z >= 2 && z < 95 : z > 52 && z <= 150;
    if (!onApproach)
        return null;
    return inWorld(bridge.x + (south ? -2.15 : 2.15), south ? 94 : 52.5);
}
