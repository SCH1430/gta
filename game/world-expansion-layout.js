"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expansionOverheads = exports.expansionObstacles = exports.bridgeRailingRuns = exports.bankSegments = exports.iceSlips = exports.expansionSignals = exports.expansionLamps = exports.expansionWalks = exports.expansionTrafficLoops = exports.expansionLandmarks = exports.expansionBuildings = exports.expansionRoads = exports.canal = exports.bridges = exports.cityLimits = void 0;
exports.expansionDistrict = expansionDistrict;
exports.bridgeHeight = bridgeHeight;
exports.shoreHeight = shoreHeight;
exports.expansionSurface = expansionSurface;
const outer_woodlands_js_1 = require("./outer-woodlands.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const region_wayfinding_js_1 = require("./region-wayfinding.js");
const region_layout_js_1 = require("./region-layout.js");
const block = (x, z, w, d, h, kind, name = '') => ({ x, z, w, d, h, kind, name });
exports.cityLimits = region_layout_js_1.regionLimits;
exports.bridges = [{ x: -126, name: 'Литейный мост' }, { x: 46, name: 'Портовый мост' }, ...region_layout_js_1.regionBridges];
exports.canal = { north: 61.2, south: 85.8, iceLevel: -.72 };
const road = (x1, z1, x2, z2, width, name) => ({ x1, z1, x2, z2, width, name });
exports.expansionRoads = [
    road(-173, -117, 166, -117, 10.4, 'Северная магистраль'),
    road(-173, -46, 168, -46, 11, 'Деповская улица'),
    road(-174, 30, 168, 30, 10.8, 'Канальная улица'),
    road(-168, 112, 171, 112, 11, 'Портовый проспект'),
    road(-126, -137, -126, 142, 10.8, 'Литейный проезд'),
    road(-50, -137, -50, 55.5, 11, 'Улица мастеров'),
    road(46, -136, 46, 144, 11, 'Портовая улица'),
    road(132, -139, 132, 52, 10.5, 'Грузовой проезд'),
    road(132, 93, 132, 141, 9, 'Складская улица')
];
exports.expansionBuildings = [
    block(-155, -5, 27, 49, 11, 'plant', 'ЛИТЕЙНАЯ № 3'),
    block(-154, -74, 26, 24, 8, 'warehouse', 'ФОРМОВОЧНЫЙ ЦЕХ'),
    block(-103, 6, 20, 16, 15, 'brick', 'ДОМ ЛИТЕЙЩИКОВ'),
    block(-104, -19, 19, 15, 12, 'brick'), block(-101, 46, 25, 12, 6, 'station', 'ДК МЕТАЛЛУРГ'),
    block(-151, 46, 32, 12, 6, 'warehouse', 'РЕМОНТНЫЕ МАСТЕРСКИЕ'),
    block(-103, -72, 23, 12, 17, 'hotel', 'ОБЩЕЖИТИЕ'), block(-155, -97, 23, 10, 5, 'warehouse'),
    block(-155, -132, 27, 11, 12, 'brick'), block(-105, -132, 19, 12, 12, 'brick'),
    block(-77, -94, 35, 20, 13, 'plant', 'ТУРБИННЫЙ ЗАЛ'), block(-77, -133, 28, 12, 6, 'warehouse', 'ЭЛЕКТРОЦЕХ'),
    block(-25, -94, 16, 16, 25, 'tower', 'ТЭЦ 08'), block(23, -94, 16, 16, 23, 'tower'),
    block(-21, -134, 32, 11, 6, 'station', 'ТЕПЛОКОНТРОЛЬ'), block(22, -133, 18, 12, 11, 'brick'),
    block(76, -94, 22, 19, 13, 'plant', 'КОТЕЛЬНАЯ'), block(104, -91, 11, 11, 15, 'tank'),
    block(75, -133, 29, 12, 13, 'brick'), block(104, -132, 15, 11, 7, 'warehouse'),
    block(157, -132, 25, 12, 8, 'warehouse'),
    block(156, -94, 26, 21, 7, 'warehouse', 'ХОЛОДИЛЬНИК'), block(157, -66, 26, 13, 9, 'warehouse'),
    block(102, -68, 29, 13, 10, 'warehouse', 'ГРУЗОВОЙ ТЕРМИНАЛ'),
    block(101, -12.5, 20, 33, 7, 'station', 'СТАНЦИЯ ВОСТОЧНАЯ'),
    block(156, -21, 25, 20, 8, 'warehouse', 'ПОЧТА 87'),
    block(103, 46, 24, 14, 10, 'brick', 'ПУТЕВАЯ СЛУЖБА'), block(155, 45, 26, 13, 9, 'warehouse'),
    block(156, 0, 12, 3.2, 5.4, 'container'), block(153, 7, 17, 3.2, 2.7, 'container'),
    block(158, 14, 14, 3.2, 5.4, 'container'),
    block(-151, 97, 22, 8, 6, 'dock', 'ПРИЧАЛ 01'),
    block(-157, 131, 29, 17, 8, 'dock', 'СУДОРЕМОНТ'),
    block(-94, 98, 25, 11, 9, 'dock', 'СОЛЯНОЙ СКЛАД'),
    block(-91, 132, 42, 18, 9, 'warehouse', 'МОРСКОЙ АРХИВ'),
    block(-49, 97, 10, 7, 17, 'crane', 'К-12'), block(-31, 135, 18, 13, 20, 'hotel', 'ПОРТОВАЯ'),
    block(-5, 98, 24, 9, 7, 'dock', 'РЕЧНОЙ ВОКЗАЛ'), block(16, 133, 28, 15, 9, 'warehouse'),
    block(80, 97, 10, 7, 18, 'crane', 'К-14'), block(78, 132, 28, 13, 13, 'brick', 'ДОМ ПОРТОВИКОВ'),
    block(106, 99, 13, 4.2, 5.4, 'container'), block(110, 134, 12, 8, 6, 'warehouse'),
    block(151, 97, 15, 4, 5.4, 'container'), block(155, 131, 29, 18, 8, 'dock', 'НАСОСНАЯ № 2')
];
exports.expansionLandmarks = [
    { x: -154, z: 2, label: 'Литейная № 3' }, { x: -25, z: -94, label: 'Северная ТЭЦ' },
    { x: 101, z: -7, label: 'Станция Восточная' }, { x: -5, z: 98, label: 'Речной вокзал' },
    { x: 46, z: 74, label: 'Портовый мост' }, { x: -126, z: 74, label: 'Литейный мост' }
];
function expansionDistrict(x, z) {
    if (z > 59 && z <= 85.8)
        return 'Шлюзовой канал';
    const region = (0, region_layout_js_1.regionDistrict)(x, z);
    if (region)
        return region;
    if (z > 85.8)
        return 'Южный порт';
    if (z < -74)
        return 'Северная ТЭЦ';
    if (x < -83)
        return 'Литейный квартал';
    if (x > 83)
        return 'Грузовая станция';
    return null;
}
const p = (x, z) => ({ x, z });
exports.expansionTrafficLoops = [
    [p(-126, 30), p(-50, 30), p(-50, -46), p(-126, -46)],
    [p(46, -46), p(132, -46), p(132, -117), p(46, -117)],
    [p(-126, 112), p(46, 112), p(46, 30), p(-126, 30)]
];
exports.expansionWalks = [
    [p(-118, 18), p(-92, 18), p(-92, 22), p(-118, 22)],
    [p(-40, -110), p(-15, -110), p(-15, -106), p(-40, -106)],
    [p(115, 16), p(123, 16), p(123, -27), p(115, -27)],
    [p(-17, 104), p(20, 104), p(20, 107), p(-17, 107)],
    [p(54, 102), p(60, 102), p(60, 91), p(54, 91)]
];
exports.expansionLamps = [
    ...[-159, -139, -106, 91, 116, 149, 169].flatMap(x => [-46, 30].map(z => ({ x, z: z - 6.8, face: 0 }))),
    ...[-154, -107, -65, -24, 16, 58, 94, 151].flatMap(x => [-117, 112].map(z => ({ x, z: z - 7, face: 0 }))),
    ...[-104, -78, -23, 5, 47, 97, 133].flatMap(z => [{ x: -133, z, face: Math.PI / 2 }, { x: 139, z, face: -Math.PI / 2 }])
].filter(l => !(l.x === 139 && l.z > 55 && l.z < 91)).concat(region_layout_js_1.regionLamps);
exports.expansionSignals = [p(-126, 30), p(132, -46), ...region_layout_js_1.regionSignals];
function bridgeHeight(x, z) {
    if (z < 54 || z > 93 || exports.bridges.every(b => Math.abs(x - b.x) > 7.15))
        return null;
    return 1.18 * Math.max(0, Math.min(1, (z - 54) / 9, (93 - z) / 9));
}
function shoreHeight(z) {
    return exports.canal.iceLevel * Math.max(0, Math.min(1, (z - exports.canal.north) / 4, (exports.canal.south - z) / 4));
}
exports.iceSlips = [-162, -35, market_quarter_layout_js_1.marketIceSlip, 160, ...region_layout_js_1.regionIceSlips];
function makeBankSegments() {
    const openings = [...exports.iceSlips.map(x => [x - 2, x + 2]), ...exports.bridges.map(b => [b.x - 7.15, b.x + 7.15])].sort((a, b) => a[0] - b[0]);
    const sections = [];
    let start = exports.cityLimits.minX - 1;
    for (const [left, right] of openings) {
        sections.push([start, left]);
        start = right;
    }
    sections.push([start, exports.cityLimits.maxX + 1]);
    return sections;
}
exports.bankSegments = makeBankSegments();
const bridgeRailingRuns = (x) => (0, cargo_rail_js_1.cargoCutsBridge)(x) ? [[54, 57.55], [61.12, 93]] : [[54, 93]];
exports.bridgeRailingRuns = bridgeRailingRuns;
exports.expansionObstacles = [
    ...region_layout_js_1.regionObstacles, ...outer_woodlands_js_1.outerTreeTrunks, ...region_wayfinding_js_1.signPosts,
    ...exports.expansionBuildings.filter(b => b.kind !== 'crane' && b.kind !== 'tower' && b.kind !== 'tank'),
    ...exports.expansionBuildings.filter(b => b.kind === 'tower' || b.kind === 'tank').flatMap(b => Array.from({ length: 8 }, (_, i) => {
        const offset = (i - 3.5) / 4, halfWidth = Math.sqrt(1 - offset * offset) * b.w / 2;
        return { x: b.x, z: b.z + offset * b.d / 2, w: halfWidth * 2, d: b.d / 8, h: b.h };
    })),
    { x: 100, z: 13, w: 1.60, d: 2.03, h: 5.84 },
    { x: 112.4, z: 13, w: 1.30, d: 2.08, h: 5.84 },
    ...[-42, -2, 36].map(x => ({ x, z: -82, w: .26, d: .40, h: 4.48 })),
    ...exports.expansionBuildings.filter(b => b.kind === 'crane').flatMap(b => [-1, 1].flatMap(dx => [-1, 1].map(dz => ({ x: b.x + dx * b.w * .44, z: b.z + dz * b.d * .44, w: .7, d: .7, h: b.h - 4 })))),
    ...exports.bankSegments.flatMap(([a, b]) => [exports.canal.north, exports.canal.south].map(z => ({ x: (a + b) / 2, z, w: b - a, d: .57, h: 1.53 }))),
    ...exports.bridges.flatMap(b => [-1, 1].flatMap(s => (0, exports.bridgeRailingRuns)(b.x).map(([a, z]) => ({ x: b.x + s * 6.82, z: (a + z) / 2, w: .45, d: z - a, h: 1.18 }))))
];
function expansionSurface(x, z) {
    if (z > exports.canal.north && z < exports.canal.south && exports.bridges.every(b => Math.abs(x - b.x) > 7.1))
        return 'snow';
    if (z > 57 && z < 91 && exports.bridges.some(b => Math.abs(x - b.x) > 5.3 && Math.abs(x - b.x) < 7.1))
        return 'metal';
    const outer = (0, region_layout_js_1.regionalSurfaceAt)(x, z);
    if (outer)
        return outer;
    let sidewalk = false;
    for (const r of exports.expansionRoads) {
        const dx = Math.max(r.x1 - x, 0, x - r.x2), dz = Math.max(r.z1 - z, 0, z - r.z2), edge = Math.max(dx, dz);
        if (edge <= r.width * .5)
            return 'asphalt';
        if (edge <= r.width * .5 + 2)
            sidewalk = true;
    }
    if (sidewalk)
        return 'concrete';
    for (const b of exports.expansionBuildings)
        if (Math.abs(x - b.x) < b.w / 2 + 3.6 && Math.abs(z - b.z) < b.d / 2 + 3.6)
            return 'concrete';
    return 'snow';
}
exports.expansionOverheads = [
    require("./school-site.js").schoolCanopy,
    { x: 127.1, z: -21, w: 33.4, d: 2.68, bottom: 5.86, top: 8.59 },
    ...[-.7, .7].map(dz => ({ x: -3, z: -82 + dz, w: 82, d: .48, bottom: 4.51, top: 4.99 })),
    ...exports.expansionBuildings.filter(s => s.kind === 'crane').map(s => ({ x: s.x, z: s.z, w: s.w * .92, d: s.d * .90, bottom: s.h - 4.01, top: s.h - 2.41 })),
    ...exports.bridges.flatMap(b => [-1, 1].map(side => ({ x: b.x + side * 6.85, z: 73.5, w: .48, d: 21, bottom: .12, top: b.x === 46 ? 5.24 : 2.39 })))
];
