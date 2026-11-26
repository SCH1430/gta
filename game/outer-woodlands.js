"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outerTreeTrunks = exports.outerTrees = void 0;
const region_layout_js_1 = require("./region-layout.js");
const groves = [
    [-222, -701, 85, 43, 31], [132, -719, 74, 45, 25], [-380, -593, 101, 37, 28],
    [-666, -358, 69, 50, 32], [-900, -190, 33, 57, 27], [-669, 313, 115, 58, 34],
    [644, -300, 108, 35, 33], [918, -209, 25, 52, 20], [726, 207, 108, 67, 30],
    [-212, 704, 127, 49, 45], [348, 646, 77, 66, 42], [208, 814, 136, 40, 45],
];
const within = (x, z, b, gap) => Math.abs(x - b.x) < b.w * .5 + gap && Math.abs(z - b.z) < b.d * .5 + gap;
const buffers = [...region_layout_js_1.regionRoads, ...region_layout_js_1.regionPaths].map(road => ({
    x: (road.x1 + road.x2) / 2, z: (road.z1 + road.z2) / 2,
    w: Math.abs(road.x2 - road.x1) + road.width, d: Math.abs(road.z2 - road.z1) + road.width,
}));
const protectedPlots = [...region_layout_js_1.regionObstacles, ...region_layout_js_1.regionAprons];
function plantGroves() {
    const trees = [];
    let seed = 419816;
    const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
    for (const [centerX, centerZ, w, d, amount] of groves) {
        let accepted = 0;
        for (let attempt = 0; attempt < amount * 5 && accepted < amount; attempt++) {
            const angle = random() * Math.PI * 2, factor = Math.sqrt(random());
            const x = centerX + Math.cos(angle) * w * factor, z = centerZ + Math.sin(angle) * d * factor;
            const h = 3.75 + random() ** .8 * 5.9, radius = h * (.17 + random() * .052);
            if (x < region_layout_js_1.regionLimits.minX + 8 || x > region_layout_js_1.regionLimits.maxX - 8 || z < region_layout_js_1.regionLimits.minZ + 8 || z > region_layout_js_1.regionLimits.maxZ - 8)
                continue;
            if (buffers.some(b => within(x, z, b, 13 + radius)))
                continue;
            if (protectedPlots.some(b => within(x, z, b, 5 + radius)))
                continue;
            if (trees.some(t => (x - t.x) ** 2 + (z - t.z) ** 2 < (radius + t.radius + 1.3) ** 2))
                continue;
            trees.push({ x, z, h, radius, turn: angle, tone: random() });
            accepted++;
        }
    }
    return trees;
}
exports.outerTrees = plantGroves();
exports.outerTreeTrunks = exports.outerTrees.map(({ x, z, h }) => ({ x, z, h, w: h * .038, d: h * .038 }));
