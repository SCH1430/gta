"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowBarriers = exports.snowPatches = exports.garageApron = exports.pavedStrips = exports.steps = exports.obstacles = exports.freightWagons = exports.tramSupports = exports.crates = exports.marketMasts = exports.signalMasts = exports.utilityMasts = exports.streetBins = exports.streetTrees = exports.benches = exports.streetLamps = exports.buildings = exports.apartments = exports.bounds = exports.signalPositions = exports.roadLoop = exports.places = void 0;
exports.signalGreen = signalGreen;
exports.apartmentEntry = apartmentEntry;
exports.garageRoofSections = garageRoofSections;
exports.groundHeight = groundHeight;
exports.surfaceAt = surfaceAt;
exports.isBlocked = isBlocked;
exports.districtAt = districtAt;
const canalWalk = require("./canal-walk.js");
const city_life_layout_js_1 = require("./city-life-layout.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const blackout_js_1 = require("./blackout.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const static_box_index_js_1 = require("./static-box-index.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const { placeWalls, warmSurfaceAt } = require("./world-life-place-layout.js");
const { neighborhoodKiosk } = require("./world-life-neighbor-layout.js");
const { transitSolids } = require("./new-city-transit-layout.js");
const { serviceSolids } = require("./new-city-services-layout.js");
const { industrySolids } = require("./new-city-industry-layout.js");
exports.places = {
    spawn: { x: -34, z: 42 }, garage: { x: -43, z: 43 },
    market: { x: 30, z: 26 }, depot: { x: 12, z: -39 },
    damaged: { x: 40, z: -20 }, hideout: { x: -30, z: -18 }
};
exports.roadLoop = [
    { x: -50, z: 30 }, { x: 46, z: 30 },
    { x: 46, z: -46 }, { x: -50, z: -46 }
];
exports.signalPositions = [{ x: 46, z: 30 }, { x: -50, z: -46 }, ...world_expansion_layout_js_1.expansionSignals];
function signalGreen(axis, seconds) {
    const phase = ((seconds % 18) + 18) % 18;
    return axis === 'x' ? phase < 8 : phase >= 9 && phase < 17;
}
exports.bounds = world_expansion_layout_js_1.cityLimits;
exports.apartments = [
    { x: -31, z: 10, w: 18, d: 11, h: 18, id: 23 }, { x: -8, z: 10, w: 17, d: 11, h: 20, id: 24 },
    { x: -33, z: -8, w: 11, d: 12, h: 25, id: 31 }, { x: -10, z: -10, w: 13, d: 12, h: 15, id: 32 },
    { x: -68, z: 5, w: 16, d: 26, h: 24, id: 17 }, { x: -66, z: -25, w: 14, d: 17, h: 18, id: 18 },
    { x: 66, z: -29, w: 19, d: 20, h: 29, id: 14 }, { x: 70, z: -1, w: 15, d: 11, h: 21, id: 13 },
    { x: 31, z: 49, w: 22, d: 11, h: 17, id: 19 }, { x: -3, z: 51, w: 17, d: 10, h: 20, id: 20 },
    { x: -32, z: -63, w: 24, d: 11, h: 20, id: 41 }, { x: 30, z: -63, w: 25, d: 11, h: 24, id: 42 }
];
function apartmentEntry(a) {
    const type = a.id === 23 || a.id % 3 === 2 ? 'flush' :
        a.id === 24 || a.id === 13 ? 'canopy' : 'stoop';
    const steps = type === 'stoop' ? 2 : 0, rise = .154, tread = .36, landing = .80;
    return { type, x: a.x - a.w * .22, front: a.z + a.d / 2, steps,
        width: 2.62, rise, tread, landing, depth: steps ? landing + (steps - 1) * tread : 0 };
}
function garageRoofSections(g) {
    const main = g === exports.buildings.garage;
    return (main ? [-.24, .24] : [0]).map((offset, i) => ({
        x: g.x - g.w * .035, z: g.z + g.d * offset, w: g.w * .80, d: g.d * (main ? .36 : .56),
        bottom: 4.39, top: main ? 5.30 - i * .20 : 5.02
    }));
}
const apartmentStoops = exports.apartments.map(apartmentEntry).filter(entry => entry.steps);
exports.buildings = {
    garage: { x: -56, z: 46, w: 18, d: 16 }, garage2: { x: -73, z: 47, w: 14, d: 14 },
    shed: { x: -19, z: -32, w: 28, d: 13 }, power: { x: 25, z: -29, w: 14, d: 12 },
    dispatcher: { x: 11.5, z: -33, w: 6, d: 5.5 },
    kiosk: { x: 28, z: 18, w: 7, d: 4 }, booth: { x: 35.3, z: 18, w: 6, d: 4 },
    booth2: { x: 57, z: 18, w: 8, d: 4 }, booth3: { x: 67, z: 18, w: 8, d: 4 }
};
exports.streetLamps = [
    ...[-75, -58.3, -30, -9, 12, 33, 55, 76].flatMap(x => [-46, 30].map(z => {
        if (z === 30 && x === 12)
            return { x: 11, z: 19.8 };
        if (z === 30 && (x === 33 || x === -30)) {
            const [left, right] = x === 33 ? canalWalk.marketCrossing : canalWalk.courtCrossing;
            return { x, z: z - 6.7, crosswalk: { x: (left + right) / 2, z } };
        }
        return { x, z: z - 6.7 };
    })),
    ...[-56.5, 52.5].flatMap(x => [-24, 0].map(z => ({ x, z }))),
    ...world_expansion_layout_js_1.expansionLamps
];
exports.benches = [
    { x: -28, z: 17.1 }, { x: -6, z: 17.2 }, { x: -16, z: -17 }, { x: 13.8, z: 21.58 }
];
exports.streetTrees = [
    [-39, 3], [-25, 1], [-13, 2], [-2, 19], [-15, 20], [-37, -1], [-38, -16], [-60, -9], [-60, 20],
    [51, 46], [16, 47], [11, 53], [-24, 52], [-23, -55], [-9, -56], [35, -55], [58, -9], [76, -12]
];
exports.streetBins = [[-40, 18], [-5, 18], [20, 14], [71, 19], [-36, -26], [-37, 52]];
exports.utilityMasts = Array.from({ length: 8 }, (_, i) => ({ x: -77 + i * 23, z: 23 }));
exports.signalMasts = exports.signalPositions.flatMap(cross => ['x', 'z'].flatMap(axis => [-1, 1].map(k => ({
    x: cross.x + (axis === 'x' ? k * 6.45 : k * 6.20), z: cross.z + (axis === 'x' ? -k * 6.25 : k * 6.45),
    face: axis === 'x' ? (k === 1 ? Math.PI / 2 : -Math.PI / 2) : (k === 1 ? 0 : Math.PI), axis
}))));
const markets = [exports.buildings.kiosk, exports.buildings.booth, exports.buildings.booth2, exports.buildings.booth3];
exports.marketMasts = markets.flatMap(k => [-1, 1].map(s => ({ x: k.x + s * (k.w / 2 - .09), z: k.z + k.d / 2 + 1.62 })));
const westStall = exports.buildings.kiosk, eastStall = exports.buildings.booth;
const canopyLeft = westStall.x - westStall.w * .5 - .31, canopyRight = eastStall.x + eastStall.w * .5 + .31;
const marketFront = westStall.z + westStall.d * .5;
exports.spektrCanopy = { x: (canopyLeft + canopyRight) * .5, z: marketFront + .78, w: canopyRight - canopyLeft, d: 2.12, bottom: 2.44, top: 3.07 };
exports.spektrBlade = { x: canopyLeft - .23, z: marketFront + 2.19, w: .21, d: 3.14, bottom: 3.33, top: 4.54 };
exports.crates = [
    ...[[-31, -21], [-12, -21], [22, 10], [61, 8], [-60, 56], [-71, -40]].flatMap(([x, z]) => [
        { x, z, size: 1.03, color: '#677b78', base: 0 }, { x: x + 1.24, z: z + .19, size: .81, color: '#847c70', base: 0 },
        { x: x + .09, z, size: .54, color: '#938976', base: .82 }
    ]),
    ...markets.map((k, i) => ({ x: k.x - k.w * .37, z: k.z + k.d / 2 + 1.63, size: .60, color: i % 2 ? '#61736c' : '#7d7767', base: 0 })),
    { x: -46.1, z: 52.75, size: .94, color: '#677b78', base: 0 }
];
exports.tramSupports = [
    { x: 8.5, z: -93, wireX: 5, wireZ: -93 }, { x: 8.5, z: -76, wireX: 5, wireZ: -76 },
    { x: 8.5, z: -58, wireX: 5, wireZ: -58 }, { x: 8.5, z: -38.5, wireX: 5, wireZ: -38.5 },
    { x: 8.6, z: -22, wireX: 5.4, wireZ: -22 }, { x: 7.2, z: -9, wireX: 4, wireZ: -9 },
    { x: 6.8, z: 5.5, wireX: 2.7, wireZ: 5.5 }, { x: 8.8, z: 17.2, wireX: 4.6, wireZ: 18.7 },
    { x: 18.6, z: 22.2, wireX: 17.8, wireZ: 24.95 }, { x: 24.3, z: 21.8, wireX: 24.4, wireZ: 24.95 }
];
exports.freightWagons = [-18, -6, 6].map(z => ({ x: 120.85, z, w: 2.59, d: 9.64, h: 2.99 }));
exports.obstacles = [
    neighborhoodKiosk,
    ...require('./district-winter-details.js').streetSolids,
    ...placeWalls,
    ...transitSolids, ...serviceSolids, ...industrySolids,
    ...cargo_rail_js_1.cargoShedSides,
    ...Object.values(blackout_js_1.blackoutProps),
    ...exploration_layout_js_1.explorationObstacles, ...city_life_layout_js_1.serviceFence, ...city_life_layout_js_1.roadStopProps, ...market_quarter_layout_js_1.quarterWorkrooms, ...market_quarter_layout_js_1.quarterProps,
    ...exports.freightWagons, { x: 35.9, z: 24.83, w: 1.20, d: .59, h: 1.12 },
    { x: 54.6, z: 57.05, w: .33, d: .34, h: 2.16 }, { x: -116.4, z: 74.05, w: .33, d: .34, h: 2.16 },
    ...world_expansion_layout_js_1.expansionObstacles, ...exports.apartments, ...Object.values(exports.buildings),
    ...apartmentStoops.flatMap(entry => [-1, 1].map(side => ({
        x: entry.x + side * entry.width * .5, z: entry.front + entry.depth * .5,
        w: .12, d: entry.depth, h: 1.17
    }))),
    ...exports.streetLamps.map(p => ({ ...p, w: .30, d: .30, h: 6.25 })),
    ...exports.utilityMasts.map(p => ({ ...p, w: .21, d: .21, h: 7.68 })),
    ...exports.tramSupports.map(p => ({ ...p, w: .17, d: .17, h: 5.85 })),
    ...exports.signalMasts.map(p => ({ ...p, w: .12, d: .12, h: 3.68 })),
    ...exports.streetTrees.map(([x, z]) => ({ x: x + .04, z: z - .04, w: .23, d: .23, h: 3.8 })),
    ...exports.streetBins.map(([x, z]) => ({ x, z, w: .70, d: .70, h: 1.22 })),
    ...exports.crates.filter(c => c.base === 0).map(c => ({ x: c.x, z: c.z, w: c.size * 1.04, d: c.size * .86, h: c.size === 1.03 ? 1.26 : c.size * .80 })),
    ...exports.marketMasts.map(p => ({ ...p, w: .09, d: .09, h: 2.62 })),
    { x: 10.92, z: 22.25, w: .095, d: .095, h: 3.2 },
    { x: -8.15, z: 15.97, w: 8.45, d: .85, h: 3.99 },
    { x: 13.2, z: -37, w: .75, d: .55, h: 1.42 },
    { x: 7.04, z: -30.2, w: .70, d: .73, h: .69 }, { x: 24.20, z: 24.95, w: .23, d: 2.15, h: .61 },
    ...exports.benches.map(p => ({ ...p, w: 2.25, d: .6, h: .945 })),
    { x: 13.8, z: 20.9, w: 4.75, d: .13 },
    ...[-2.46, 2.46].map(dx => ({ x: 13.8 + dx, z: 22, w: .13, d: 2.27 })),
    ...[28, 35.3, 57, 67].map((x, i) => ({ x, z: 20.47, w: [7, 6, 8, 8][i] - .45, d: 1.16 })),
    ...[-79, -54, -30, -8, 17, 39, 57, 78].map(x => ({ x, z: 13, w: 1.4, d: 1.8 })).filter(p => p.x >= 17),
    { x: -21.6, z: 10, w: 1, d: 10 }, { x: -17.5, z: 10, w: 1, d: 10 },
    { x: -69, z: 57, w: 25, d: 1.5 }, { x: -20.4, z: 42.3, w: 1.8, d: .96 }
];
exports.steps = { x: -19.55, z1: 3, z2: 17, width: 3.1, tread: .7, rise: .155, count: 4 };
function curbStrip(axis, edge, side, start, end, crossings = [], joinedStart = false, bay = false) {
    const knots = new Set([start, end - .82, end]);
    if (bay) for (const [x] of canalWalk.marketBay.profile) knots.add(x);
    if (!joinedStart) knots.add(start + .82);
    for (const [a, b] of crossings)
        for (const k of [a - .82, a, b, b + .82]) if (k > start && k < end) knots.add(k);
    const run = [...knots].sort((a, b) => a - b).map(k => {
        let level = Math.min(1, (end - k) / .82, joinedStart ? 1 : (k - start) / .82);
        for (const [a, b] of crossings) level = Math.min(level, .12 + .88 * Math.max(a - k, k - b, 0) / .82);
        return [k, Math.max(0, level)];
    });
    const width = bay ? 2.45 : 1.85;
    const across = [[0, 0], [.15, 1], [width - .27, 1], [width, 0]]
        .map(([offset, level]) => [edge + offset * side, level]);
    if (side < 0)
        across.reverse();
    return { surface: 'concrete', height: .13, x: axis === 'x' ? run : across,
        z: axis === 'z' ? run : across, curb: { axis, edge, width }, bay };
}
exports.pavedStrips = [
    { surface: 'concrete', garage: true, height: .13, x: [[-45.4, 0], [-45.16, 1], [-43.4, 1], [-41.9, .16], [-34.4, .16], [-32.8, 1], [-24.4, 1]],
        z: [[35.46, 0], [35.61, 1], [37.64, 1], [37.91, 0]] },
    // Keep the end of the tram track clear. The approach runs on the shelter side of the buffer.
    { surface: 'concrete', height: .065, x: [[16.7, 0], [17.65, 1], [24.92, 1], [25.64, 0]],
        z: [[21.43, 0], [21.9, 1], [23.31, 1], [23.76, 0]], curb: { axis:'x', edge:23.76, width:2.33 } },
    { surface: 'metal', height: .135, x: [[25.64, 0], [26.26, 1], [35.24, 1], [canalWalk.marketCrossing[0], .15], [canalWalk.marketCrossing[1], .15], [39.8, 0]],
        z: [[21.26, 0], [21.89, 1], [24.17, 1], [25.24, 0]] },
    curbStrip('x', 24.53, -1, -43, 2.8, [canalWalk.courtCrossing]),
    curbStrip('x', 35.46, 1, -81, -56.86),
    curbStrip('x', canalWalk.marketBay.edge, 1, -24.4, 39.8, [canalWalk.courtCrossing, [4.4, 7.2], canalWalk.marketCrossing], true, true),
    curbStrip('x', 35.46, 1, 52.86, 80),
    curbStrip('x', -40.43, 1, -43.15, 39.15, [[-28, -25], [3, 7.5]]),
    curbStrip('x', -51.56, -1, -43.15, 39.15, [[-28, -25], [3, 7.5]]),
    curbStrip('z', -44.43, 1, -38.55, 22.60, [[-19, -16], [16.5, 19]]),
    curbStrip('z', -55.56, -1, -38.55, 22.60, [[-19, -16], [16.5, 19]]),
    curbStrip('z', 40.43, -1, -38.55, 21.26, [[-13, -10], [16.5, 19]]),
    curbStrip('z', 51.56, 1, -38.55, 22.60, [[-13, -10], [16.5, 19]])
];
function interval(profile, v) {
    if (v < profile[0][0] || v > profile[profile.length - 1][0])
        return -1;
    let i = 0;
    while (i + 2 < profile.length && v > profile[i + 1][0])
        i++;
    return i;
}
function stripHeight(strip, x, z) {
    if (strip.bay) z -= canalWalk.bayOffset(x);
    const i = interval(strip.x, x), j = interval(strip.z, z);
    if (i < 0 || j < 0)
        return -1;
    const [x0, a] = strip.x[i], [x1, b] = strip.x[i + 1], [z0, c] = strip.z[j], [z1, d] = strip.z[j + 1];
    const u = (x - x0) / (x1 - x0), v = (z - z0) / (z1 - z0);
    return strip.height * (u + v <= 1 ? a * c + (b - a) * c * u + a * (d - c) * v : b * d + (a - b) * d * (1 - u) + b * (c - d) * (1 - v));
}
function groundHeight(x, z) {
    if (z >= 54 && z <= 93) {
        const h = (0, world_expansion_layout_js_1.bridgeHeight)(x, z);
        if (h !== null)
            return h;
        if (z > world_expansion_layout_js_1.canal.north && z < world_expansion_layout_js_1.canal.south)
            return (0, world_expansion_layout_js_1.shoreHeight)(z);
    }
    if (Math.abs(x - exports.steps.x) <= exports.steps.width / 2 && z >= exports.steps.z1 && z <= exports.steps.z2) {
        const fromEnd = Math.min(z - exports.steps.z1, exports.steps.z2 - z);
        return Math.min(exports.steps.count, 1 + Math.floor((fromEnd + 1e-7) / exports.steps.tread)) * exports.steps.rise;
    }
    for (const entry of apartmentStoops) {
        const fromWall = z - entry.front;
        if (fromWall >= 0 && fromWall <= entry.depth + 1e-7 && Math.abs(x - entry.x) <= entry.width * .5) {
            const outer = Math.max(0, Math.ceil((fromWall - entry.landing) / entry.tread - 1e-7));
            return (entry.steps - outer) * entry.rise;
        }
    }
    for (const strip of exports.pavedStrips) {
        const height = stripHeight(strip, x, z);
        if (height >= 0)
            return height;
    }
    return 0;
}
exports.garageApron = [
    [-47, 36.7], [-42, 35.8], [-41.3, 34.8], [-35.2, 34.7], [-32.8, 35.9], [-26.3, 36.3], [-22, 37.8],
    [-19, 40.4], [-21, 48.7], [-23.9, 52.8], [-29.2, 54.1], [-39, 54.5], [-46.6, 53.8]
];
function insidePolygon(x, z, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i], b = points[j];
        if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0])
            inside = !inside;
    }
    return inside;
}
exports.snowPatches = [
    [-27, 43, 2.3, 1.35], [-25.8, 45.1, 1.38, .75], [-31.6, 48.8, 2.25, .8], [-42.1, 47.9, 1.5, .76],
    [-19.5, 20.5, 2.2, .83], [-29, 20, 2.7, 1.3], [-4, 20.2, 2.6, 1.5], [-34, -18, 1.8, .9],
    [18.5, 22.2, 1.86, .73], [39.6, 21.8, 1.24, .92], [9, -37.5, 1.44, .72], [20.2, -17.3, 2.1, 1.12]
].map(([x, z, rx, rz], n) => {
    const contour = Array.from({ length: 26 }, (_, i) => {
        const t = i * 2 * Math.PI / 26, r = 1 + .12 * Math.sin(3 * t + n) + .09 * Math.sin(5 * t + n * .7) + .042 * Math.cos(9 * t + n);
        return [x + rx * r * Math.cos(t), z + rz * r * Math.sin(t)];
    });
    return { x, z, rx, rz, contour };
});
function surfaceAt(x, z) {
    if (warmSurfaceAt(x, z))
        return 'concrete';
    if ((0, world_expansion_layout_js_1.expansionDistrict)(x, z))
        return (0, world_expansion_layout_js_1.expansionSurface)(x, z);
    for (const strip of exports.pavedStrips) {
        if (x < strip.x[0][0] || x > strip.x[strip.x.length - 1][0]) continue;
        const localZ = strip.bay ? z - canalWalk.bayOffset(x) : z;
        if (localZ >= strip.z[0][0] && localZ <= strip.z[strip.z.length - 1][0])
            return strip.surface;
    }
    if (z >= canalWalk.marketBay.edge && z < canalWalk.marketBay.edge + canalWalk.bayOffset(x)) return 'asphalt';
    if (canalWalk.onWalk(x, z)) return 'concrete';
    for (const p of exports.snowPatches)
        if (Math.abs(x - p.x) < p.rx * 1.27 && Math.abs(z - p.z) < p.rz * 1.27 && insidePolygon(x, z, p.contour))
            return 'snow';
    if (x > -48 && x < -18 && z > 34 && z < 55 && insidePolygon(x, z, exports.garageApron))
        return 'concrete';
    if (Math.abs(z - 30) < 5.46 || Math.abs(z + 46) < 5.55 || Math.abs(x + 50) < 5.55 || Math.abs(x - 46) < 5.55)
        return 'asphalt';
    if ((x > -43 && x < 5 && z > -31.5 && z < 27.5) || (x > -41 && x < 37 && z > -42 && z < -14) ||
        (Math.abs(x - 13) < 4.5 && Math.abs(z - 1) < 24.5) || (x > 12 && x < 84 && z > 7 && z < 25) ||
        (x > -79 && x < -31 && z > 33.5 && z < 54.5) || (x > -37 && x < 55 && z > 37.5 && z < 58.5))
        return 'concrete';
    return 'snow';
}
exports.lowBarriers = [{ x: -29, z: -18.9, w: 2.7, d: .48 }, { x: 14.5, z: 23, w: 2.4, d: .5 }];
const nearbyObstacles = (0, static_box_index_js_1.indexStaticBoxes)(exports.obstacles, exports.bounds, o => ({
    minX: o.x - o.w * .5, maxX: o.x + o.w * .5, minZ: o.z - o.d * .5, maxZ: o.z + o.d * .5
}), 12, 8);
function isBlocked(x, z, radius = .35, vehicle = false, height = 0) {
    if (x - radius < exports.bounds.minX || x + radius > exports.bounds.maxX || z - radius < exports.bounds.minZ || z + radius > exports.bounds.maxZ)
        return true;
    const near = (o) => {
        const dx = Math.max(Math.abs(x - o.x) - o.w / 2, 0);
        const dz = Math.max(Math.abs(z - o.z) - o.d / 2, 0);
        return dx * dx + dz * dz < radius * radius || (dx === 0 && dz === 0);
    };
    if (nearbyObstacles(x - radius, z - radius, x + radius, z + radius).some(near))
        return true;
    if ((vehicle || height < .63) && exports.lowBarriers.some(near))
        return true;
    if (vehicle && x > -22 && x < -17 && z > 2 && z < 18)
        return true;
    return false;
}
function districtAt(x, z) {
    const district = (0, world_expansion_layout_js_1.expansionDistrict)(x, z);
    if (district)
        return district;
    if (z > 34) {
        const bay = canalWalk.marketBay;
        if (x >= bay.profile[0][0] && x <= canalWalk.marketCrossing[1] && z <= bay.edge + canalWalk.bayOffset(x) + 1.85)
            return 'Рынок «Спектр»';
        return 'Канальные гаражи';
    }
    if (x > 15 && z > -9)
        return 'Рынок «Спектр»';
    if (z < -20 || (x >= 0 && z < -5))
        return 'Трамвайное депо';
    return 'Панельные дворы';
}
