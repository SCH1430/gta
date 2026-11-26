"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmbientWalkers = exports.isLegacyAmbientWalker = exports.isAmbientWalker = exports.ambientWalkways = void 0;
const collision_js_1 = require("./collision.js");
const human_kits_js_1 = require("./human-kits.js");
const population_profile_js_1 = require("./population-profile.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const world_railway_js_1 = require("./world-railway.js");
const world_layout_js_1 = require("./world-layout.js");
const route = (nodes, arrival) => ({
    arrival,
    district: (0, population_profile_js_1.populationDistrict)({ x: nodes[nodes.length >> 1][0], z: nodes[nodes.length >> 1][1] }),
    points: nodes.map(([x, z, dwell, faceX, faceZ]) => ({ x, z, dwell, face: faceX === undefined || faceZ === undefined ? undefined : { x: faceX, z: faceZ } }))
});
exports.ambientWalkways = [
    route([[40.1, 15], [39.66, 21.91], [36.75, 22.15, 6.5, 36, 18.9], [33.95, 21.85], [33.43, 22.37], [32.91, 22.37], [31.95, 21.9, 3.2, 30.4, 20], [29.87, 22.42], [26.25, 21.85], [25.73, 22.37], [24.17, 22.37], [23.15, 21.7], [22.8, 14]]),
    route([[22.3, 15.4], [23, 21.45], [22.65, 22.55], [21.45, 22.85, 5, 17.05, 22.59], [19.3, 21.72], [17.45, 21.6], [16.65, 18.85]], 'market'),
    route([[39.62, 36.73], [34.45, 36.6], [26.4, 36.6, 1.45, 26.5, 32], [21.85, 36.6], [19.2, 35.5], [17.6, 36.3]]),
    route([[49.3, 13.7], [51.2, 19.55], [52.76, 22.15], [53.35, 22.1], [54.39, 22.62], [58, 22.13, 5, 57, 18.8], [63.43, 22.18], [66.03, 22.7], [69.2, 22.1, 4.2, 67, 19], [73.05, 21.9], [73, 14.2]]),
    route([[15.9, -28.6], [15.91, -35.9], [15.9, -39.55, 4.9, 8.7, -37], [12.35, -39.6], [9.8, -39.45, 7, 7.58, -36.5]], 'depot'),
    route([[7.47, -28.5], [7.99, -31.1], [7.52, -34], [7.92, -37.95, 5.2, 7.58, -36.5], [8.96, -37.95], [10.1, -38.62], [15.2, -38.7], [17.1, -38.65]], 'depot'),
    route([[16.22, -50.9], [21.8, -50.8], [27.2, -50.9], [35.2, -50.95], [42.4, -51.03, 2.4, 42, -46], [44.3, -55.1]]),
    route([[-41.95, 2.35], [-41.45, 11.2], [-41.12, 16.62], [-38.2, 16.6], [-31.27, 16.58, 4.5, -31.1, 14.9], [-26.59, 16.06], [-25.1, 16.58], [-23.04, 18.84], [-23.04, 21.75]]),
    route([[-15.95, 19.9], [-13.8, 18.37], [-10.1, 17.38], [-7.83, 16.79, 4.1, -8, 14.6], [-7.31, 18.35], [-4.71, 18.87], [-4.19, 18.87], [-3.8, 17.7], [1.42, 17.75], [2.3, 14.9], [2.3, 8.7]]),
    route([[-41.35, 2.3], [-40.83, 3.34], [-38.75, 3.86], [-36.15, 2.3], [-30.15, 2.4], [-27.03, -1.24], [-24.95, -1.24], [-24.43, 0.84], [-24.75, 2.31, 2.7, -25, 5], [-23.05, 2.32]]),
    route([[-46.6, 53.8], [-45.56, 53.8], [-45.04, 53.28], [-46.1, 45.65, 3.1, -49.6, 45.42], [-46, 39.3], [-45.7, 36.29], [-38.8, 36.28], [-29.65, 36.25], [-25.9, 39.8]]),
    route([[-17.55, 45.1], [-17.5, 42.65], [-17.6, 38.85], [-25.2, 38, 2.7, -25.9, 40.61], [-31.2, 37.28], [-42.4, 37.3]]),
    route([[-55, -57], [-57.05, -55.05], [-55.49, -52.45], [-55.45, -51.38], [-51.7, -51.63], [-47.9, -51.56], [-45.3, -54.4]]),
    route([[-52, -305.5], [-51.48, -304.98], [-39, -305.5], [-27, -305.5, 3, -20, -305.5], [-15, -305.5], [0, -305.5], [11, -305.5]]),
    route([[10, -303.25], [-3, -303.25], [-14, -303.25, 2, -20, -305.5], [-29, -303.25], [-42, -303.25]]),
    route([[-434, -54], [-422.56, -54.52], [-421, -54], [-409, -54, 3, -402, -54], [-397, -54], [-382.06, -54.24], [-371, -54]]),
    route([[-372, -51.75], [-385, -51.75], [-396, -51.75, 2, -402, -54], [-411, -51.75], [-424, -51.75]]),
    route([[371, -64], [382.44, -64.52], [384, -64], [396, -64, 3, 403, -64], [408, -64], [423, -64], [427.68, -64.52], [434, -64]]),
    route([[433, -61.75], [420, -61.75], [409, -61.75, 2, 403, -64], [394, -61.75], [381, -61.75]]),
    route([[44, 310], [57, 310], [69, 310, 3, 76, 310], [81, 310], [96, 310], [107, 310]]),
    route([[106, 307.75], [93, 307.75], [82, 307.75, 2, 76, 310], [67, 307.75], [54, 307.75]]),
    route([[-48, -665], [-35, -665], [-23, -665, 3, -16, -665], [-11, -665], [4, -665], [15, -665]]),
    route([[14, -662.75], [1, -662.75], [-10, -662.75, 2, -16, -665], [-25, -662.75], [-38, -662.75]]),
    route([[-834, -111], [-821, -111], [-809, -111, 3, -802, -111], [-797, -111], [-782, -111], [-775.24, -108.4], [-774.72, -108.4], [-771, -111]]),
    route([[-772, -108.75], [-778.76, -108.23], [-785, -108.75], [-796, -108.75, 2, -802, -111], [-811, -108.75], [-824, -108.75]]),
    route([[756, -163], [769, -163], [781, -163, 3, 788, -163], [793, -163], [808, -163], [819, -163]]),
    route([[818, -160.75], [805, -160.75], [794, -160.75, 2, 788, -163], [779, -160.75], [766, -160.75]]),
    route([[153, 677], [166, 677], [178, 677, 3, 185, 677], [190, 677], [205.08, 682.72], [205.6, 678.56], [205.25, 677], [216, 677]]),
    route([[215, 679.25], [204.6, 682.89], [202, 679.25], [191, 679.25, 2, 185, 677], [176, 679.25], [163, 679.25]]),
    route([[39.5, -5], [39.65, 4], [40.28, 13], [39.5, 22.55, 4, 35.4, 19], [34.82, 22.03], [33.6, 22.65, 5, 34, 19], [26, 23.55, 4, 25, 20], [23.4, 21.99], [23.1, 20.85], [22.3, 14], [17.1, 9.84], [16, -2.7]]),
    route([[44, 58.85], [44, 49], [43.75, 43], [39.24, 36.64], [38.72, 35.08], [39.3, 24], [38.4, 23.4, 4, 35.3, 22], [39.5, 18], [40.7, 9], [43, 2.2]]),
    route([[67, 48], [66, 38.4], [64.2, 36], [55.4, 36, 2.7, 55, 30], [50.5, 42.05], [47.3, 54], [45.3, 60.35]]),
];
const maxWalkers = 44, walkerPrefix = 'ambient-walker-', walkerId = /^ambient-walker-(0|[1-9]\d?)$/;
const legacyWalker = /^(?:(?:walker|local)-\d+|region-[a-z]+-walker-\d+)$/;
const isAmbientWalker = (person) => walkerId.test(person.id);
exports.isAmbientWalker = isAmbientWalker;
const isLegacyAmbientWalker = (person) => person.role === 'walker' && legacyWalker.test(person.id);
exports.isLegacyAmbientWalker = isLegacyAmbientWalker;
const manageable = (p) => p.role === 'walker' && ((0, exports.isAmbientWalker)(p) || (0, exports.isLegacyAmbientWalker)(p));
const onAssignment = (p) => p.onboard || p.platformStep || p.cab;
const portal = (walk, index) => index === 0 || index === walk.points.length - 1;
class AmbientWalkers {
    arrival = null;
    openStop = null;
    arrivalUntil = 0;
    mostRecent = -Infinity;
    nextChange = 0;
    sequence = 0;
    restore(people) {
        this.arrival = this.openStop = null;
        this.arrivalUntil = this.nextChange = 0;
        this.mostRecent = -Infinity;
        this.sequence = 0;
        const restored = [], seen = new Set();
        for (const p of people) {
            if (!p || !(0, exports.isAmbientWalker)(p) || p.role !== 'walker' || Number(p.id.slice(walkerPrefix.length)) >= maxWalkers || seen.has(p.id) ||
                !Number.isFinite(p.x) || !Number.isFinite(p.z) || p.x < world_layout_js_1.bounds.minX || p.x > world_layout_js_1.bounds.maxX || p.z < world_layout_js_1.bounds.minZ || p.z > world_layout_js_1.bounds.maxZ)
                continue;
            const walk = exports.ambientWalkways[p.route];
            if (!walk || !walk.points[p.waypoint])
                continue;
            seen.add(p.id);
            const { id, x, z, route, waypoint } = p;
            restored.push({ id, role: 'walker', x, z, y: (0, world_layout_js_1.groundHeight)(x, z), route, waypoint, leg: p.leg === 1 ? 1 : 0,
                yaw: Number.isFinite(p.yaw) ? p.yaw : (0, sim_navigation_js_1.aim)(p, walk.points[waypoint]), speed: 0,
                wait: Number.isFinite(p.wait) ? Math.min(10, Math.max(0, p.wait)) : 0 });
        }
        return restored;
    }
    goal(p) {
        const walk = exports.ambientWalkways[p.route], goal = walk?.points[p.waypoint];
        if (!walk || !goal)
            return p;
        if (p.wait <= 0 && (0, sim_navigation_js_1.dist)(p, goal) < .23) {
            if (portal(walk, p.waypoint))
                p.leg = p.waypoint === 0 ? 0 : 1;
            p.waypoint += p.leg === 1 ? -1 : 1;
            const pause = goal.dwell ?? (portal(walk, p.waypoint) ? .5 : 0);
            p.wait = pause * (.82 + Number(p.id.slice(walkerPrefix.length)) % 5 * .09);
            return walk.points[p.waypoint];
        }
        return goal;
    }
    watching(p) {
        if (p.wait <= 0)
            return;
        const index = p.waypoint + (p.leg === 1 ? 1 : -1);
        return exports.ambientWalkways[p.route]?.points[index]?.face;
    }
    update(frame, people, cars, rail, protectedActor) {
        if (frame.elapsed < this.mostRecent) {
            this.arrival = this.openStop = null;
            this.arrivalUntil = 0;
            this.nextChange = 0;
        }
        this.mostRecent = frame.elapsed;
        if (rail.service && rail.stop && rail.doors > .6 && this.openStop !== rail.stop) {
            this.arrival = this.openStop = rail.stop;
            this.arrivalUntil = frame.elapsed + 19;
        }
        else if (!rail.stop)
            this.openStop = null;
        if (frame.elapsed < this.nextChange)
            return false;
        this.nextChange = frame.elapsed + (frame.pressure === 2 ? 1.5 : frame.pressure === 1 ? 1.1 : .62);
        const radius = frame.radius, arrival = frame.elapsed < this.arrivalUntil && frame.wanted < 2 ? this.arrival : null;
        const pulse = arrival && frame.pedestrians > 2 && (0, sim_navigation_js_1.dist)(frame, world_railway_js_1.tramStops[arrival]) < 45 ? Math.min(4, Math.ceil(frame.pedestrians * .21)) : 0;
        const target = frame.pedestrians + pulse;
        const crowd = people.reduce((count, p) => count + Number(!p.onboard && !p.cab && (0, sim_navigation_js_1.dist)(frame, p) <= radius), 0);
        const dynamic = people.filter(exports.isAmbientWalker);
        const spare = dynamic.find(p => (0, sim_navigation_js_1.dist)(frame, p) > radius + 52 && !protectedActor(p) && !onAssignment(p) && (0, population_profile_js_1.populationCanLeave)(frame, p, radius + 52));
        if (spare) {
            people.splice(people.indexOf(spare), 1);
            return true;
        }
        if (crowd > target) {
            const leaving = people.find(p => {
                if (!manageable(p) || onAssignment(p) || protectedActor(p) || (0, sim_navigation_js_1.dist)(frame, p) > radius ||
                    !(0, population_profile_js_1.populationCanLeave)(frame, p, (0, exports.isAmbientWalker)(p) ? 28 : 34))
                    return false;
                return !(0, exports.isAmbientWalker)(p) || exports.ambientWalkways[p.route]?.points.some((q, i) => portal(exports.ambientWalkways[p.route], i) && (0, sim_navigation_js_1.dist)(p, q) < .92);
            });
            if (leaving) {
                people.splice(people.indexOf(leaving), 1);
                return true;
            }
            return false;
        }
        if (crowd >= target || dynamic.length >= maxWalkers)
            return false;
        const used = new Set(dynamic.map(p => p.id));
        const candidates = [];
        for (let i = 0; i < exports.ambientWalkways.length; i++) {
            const walk = exports.ambientWalkways[i];
            for (const node of [0, walk.points.length - 1]) {
                const point = walk.points[node], distance = (0, sim_navigation_js_1.dist)(frame, point);
                if (distance > radius + 2 || !(0, population_profile_js_1.populationCanEnter)(frame, point, 23, radius + 2))
                    continue;
                const jitter = ((i * 19 + node * 7 + this.sequence * 13) % 41) * .62;
                const local = walk.district === frame.district ? 19 : 0;
                const rank = distance + jitter - local - (pulse && walk.arrival === arrival ? 22 : 0);
                candidates.push({ walk, index: i, node, rank });
            }
        }
        candidates.sort((a, b) => a.rank - b.rank);
        for (const { walk, index, node } of candidates) {
            const point = walk.points[node], next = node === 0 ? 1 : node - 1, first = walk.points[next];
            const x = point.x, z = point.z, y = (0, world_layout_js_1.groundHeight)(x, z);
            if (!(0, collision_js_1.clearDisc)(point, .36, y, cars) || people.some(p => !p.onboard && (0, sim_navigation_js_1.dist)(p, point) < 1.25))
                continue;
            // Prefer an identity whose outfit is absent around the entrance.
            const separation = new Float32Array(human_kits_js_1.civilians.length).fill(32 * 32);
            for (const p of people) {
                if (p.role !== 'walker' || p.cab || p.onboard)
                    continue;
                const variant = (0, human_kits_js_1.streetWardrobe)(p.id, -1);
                if (variant >= 0)
                    separation[variant] = Math.min(separation[variant], (p.x - x) ** 2 + (p.z - z) ** 2);
            }
            let slot = -1, best = -1;
            for (let i = 0; i < maxWalkers; i++) {
                if (used.has(walkerPrefix + i))
                    continue;
                const distance = separation[(0, human_kits_js_1.streetWardrobe)(walkerPrefix + i, 0)];
                if (distance > best) {
                    slot = i;
                    best = distance;
                    if (best === 32 * 32)
                        break;
                }
            }
            people.push({ id: walkerPrefix + slot, role: 'walker', x, z, y, yaw: (0, sim_navigation_js_1.aim)(point, first),
                speed: 0, wait: 0, route: index, waypoint: next, leg: node === 0 ? 0 : 1 });
            this.sequence++;
            return true;
        }
        return false;
    }
}
exports.AmbientWalkers = AmbientWalkers;
