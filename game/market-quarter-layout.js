"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quarterWaymarks = exports.quarterChaseDrive = exports.quarterChaseWalk = exports.quarterWalkRoute = exports.quarterAttractions = exports.quarterVolumes = exports.quarterSolids = exports.quarterGuards = exports.quarterFloors = exports.quarterTreads = exports.quarterRoofs = exports.quarterWalls = exports.quarterSupports = exports.quarterProps = exports.quarterWorkrooms = exports.quarterDecks = exports.quarterFlights = exports.marketCanalChase = exports.marketWalkway = exports.marketIceSlip = void 0;
exports.quarterFloor = quarterFloor;
exports.quarterBlocksSight = quarterBlocksSight;
const flight = (axis, side, start, end, width, height, steps) => ({ axis, side, start, end, width, height, steps });
const raised = (x, z, w, d, bottom, top) => ({ x, z, w, d, bottom, top });
const marketLevel = 6.18, quayLevel = 2.38;
exports.marketIceSlip = 14.1;
exports.marketWalkway = {
    westernEntry: { x: -1.28, z: -9.44, y: 0, index: 0 },
    westernLanding: { x: -1.28, z: 1.6, y: marketLevel, index: 1 },
    crossing: { x: 5.8, z: 1.6, y: marketLevel, index: 2 },
    easternLanding: { x: 13.15, z: 1.6, y: marketLevel, index: 3 },
    easternEntry: { x: 13.15, z: 12.22, y: 0, index: 4 },
    listeningBoard: { x: 21.2, z: 11.5, y: 0, index: 5 }
};
exports.marketCanalChase = {
    start: { x: 48, z: 12.2, y: 0 },
    ice: { x: exports.marketIceSlip, z: 73, y: -.72 },
    parking: { x: exports.marketIceSlip, z: 89.5, y: 0 },
    stairs: { x: 8.85, z: 88.92, y: 0 },
    landing: { x: 3.65, z: 88.92, y: quayLevel },
    inside: { x: 3.65, z: 90.15, y: quayLevel },
    turn: { x: 3.65, z: 91.18, y: quayLevel },
    stairsOut: { x: -1.91, z: 91.18, y: 0 },
    shelter: { x: -4.8, z: 90.9, y: 0 },
    handoff: { x: 10.8, z: 96, y: 0 },
};
exports.quarterFlights = [
    flight('z', exports.marketWalkway.westernEntry.x, -8.83, .53, 2.16, marketLevel, 39),
    flight('z', exports.marketWalkway.easternEntry.x, 11.82, 2.66, 2.16, marketLevel, 39),
    flight('x', exports.marketCanalChase.stairs.z, 8.76, 4.73, 2.16, quayLevel, 15),
    flight('x', exports.marketCanalChase.stairsOut.z, -1.83, 2.62, 2.16, quayLevel, 15)
];
exports.quarterDecks = [
    raised(5.94, 1.60, 16.87, 2.16, marketLevel - .21, marketLevel),
    raised(3.67, 90.05, 2.11, 4.44, quayLevel - .24, quayLevel)
];
exports.quarterWorkrooms = [
    { x: 20.5, z: 7.78, w: 5.8, d: 3.26, h: 3.12, kind: 'thermal', label: 'ТЕРМОКОНТРОЛЬ', caption: 'РЕМОНТ ОБОГРЕВА' },
    { x: 32.9, z: 7.07, w: 6.1, d: 3.36, h: 3.12, kind: 'relays', label: 'СБОРКА РЕЛЕ', caption: 'ЦЕХ СВЯЗИ № 9' }
];
exports.quarterProps = [
    { x: exports.marketWalkway.listeningBoard.x + .30, z: exports.marketWalkway.listeningBoard.z - 1.34, w: 1.48, d: .19, h: 2.27 }
];
exports.quarterSupports = [
    raised(-.55, 2.58, .54, .47, 0, marketLevel - .20),
    raised(11.95, .61, .56, .46, 0, marketLevel - .20),
    raised(11.95, 2.58, .56, .48, 0, marketLevel - .20),
    raised(3.95, 88.11, .35, .35, 0, quayLevel - .22),
    raised(3.40, 92.04, .35, .33, 0, quayLevel - .22)
];
exports.quarterWalls = [
    raised(3.67, 87.83, 2.28, .20, quayLevel, 4.74),
    raised(3.67, 92.23, 2.28, .20, quayLevel, 4.74),
    raised(2.60, 88.87, .18, 2.13, quayLevel, 4.74),
    raised(4.73, 91.15, .18, 2.16, quayLevel, 4.74)
];
exports.quarterRoofs = [raised(3.67, 90.05, 2.50, 4.73, 4.72, 4.92)];
function stepBox(f, start, end, across, w, bottom, top) {
    const middle = (start + end) * .5, distance = Math.abs(end - start);
    return f.axis === 'z' ? raised(across, middle, w, distance, bottom, top) : raised(middle, across, distance, w, bottom, top);
}
const treads = [], flightGuards = [];
for (const f of exports.quarterFlights) {
    const d = (f.end - f.start) / f.steps, h = f.height / f.steps;
    for (let i = 0; i < f.steps; i++) {
        const a = f.start + d * i, end = f.start + d * (i + 1), top = h * (i + 1);
        treads.push(stepBox(f, a, end, f.side, f.width, Math.max(-.02, top - .27), top));
        for (const sign of [-1, 1])
            flightGuards.push(stepBox(f, a, end, f.side + sign * f.width * .5, .12, Math.max(-.02, top - .23), top + 1.12));
    }
}
const deckGuards = [
    raised(6.50, .52, 11.67, .13, marketLevel - .11, marketLevel + 1.13),
    raised(6.06, 2.68, 12.09, .13, marketLevel - .11, marketLevel + 1.13),
    raised(-2.48, 1.61, .14, 2.21, marketLevel - .11, marketLevel + 1.13),
    raised(14.29, 1.61, .14, 2.21, marketLevel - .11, marketLevel + 1.13),
    raised(-1.20, 2.68, 2.62, .13, marketLevel - .11, marketLevel + 1.13),
    raised(13.38, .52, 1.77, .13, marketLevel - .11, marketLevel + 1.13)
];
exports.quarterTreads = treads;
exports.quarterFloors = [...treads, ...exports.quarterDecks];
exports.quarterGuards = [...flightGuards, ...deckGuards];
exports.quarterSolids = [...exports.quarterFloors, ...exports.quarterGuards, ...exports.quarterSupports, ...exports.quarterWalls, ...exports.quarterRoofs];
exports.quarterVolumes = {
    floors: exports.quarterFloors,
    solid: [...exports.quarterGuards, ...exports.quarterSupports, ...exports.quarterWalls, ...exports.quarterRoofs]
};
const footprintContains = (b, x, z, r) => {
    const dx = Math.max(Math.abs(b.x - x) - b.w * .5, 0), dz = Math.max(Math.abs(b.z - z) - b.d * .5, 0);
    return dx * dx + dz * dz < r * r + .00000002;
};
function quarterFloor(x, z, standingHeight, radius) {
    if (x < -2.9 || x > 14.7 || z < -9.2 || z > 92.7 || z > 12.2 && z < 87.2)
        return -Infinity;
    const r = Math.max(0, radius - .016);
    let floor = -Infinity;
    for (const box of exports.quarterFloors)
        if (box.top <= standingHeight + .231 && box.top > floor && footprintContains(box, x, z, r))
            floor = box.top;
    return floor;
}
const opaqueSolids = [...exports.quarterDecks, ...exports.quarterWalls, ...exports.quarterRoofs, ...exports.quarterSupports];
function quarterBlocksSight(x, y, z, endX, endY, endZ) {
    if (Math.min(x, endX) > 14.6 || Math.max(x, endX) < -2.6 || Math.min(z, endZ) > 92.6 || Math.max(z, endZ) < -8.9)
        return false;
    const dx = endX - x, dy = endY - y, dz = endZ - z;
    for (const box of opaqueSolids) {
        if (Math.min(x, endX) > box.x + box.w * .5 || Math.max(x, endX) < box.x - box.w * .5 || Math.min(z, endZ) > box.z + box.d * .5 || Math.max(z, endZ) < box.z - box.d * .5)
            continue;
        let lo = .012, hi = .988;
        for (const [p, v, a, b] of [[x, dx, box.x - box.w * .5, box.x + box.w * .5], [y, dy, box.bottom, box.top], [z, dz, box.z - box.d * .5, box.z + box.d * .5]]) {
            if (Math.abs(v) < 1e-6) {
                if (p < a || p > b) {
                    lo = 1;
                    hi = 0;
                    break;
                }
                continue;
            }
            const e = (a - p) / v, f = (b - p) / v;
            lo = Math.max(lo, Math.min(e, f));
            hi = Math.min(hi, Math.max(e, f));
            if (lo >= hi)
                break;
        }
        if (lo < hi)
            return true;
    }
    return false;
}
exports.quarterAttractions = [
    { ...exports.marketWalkway.easternEntry, label: 'Пешеходный мост «Спектр»', area: 'Маршрут пешком' },
    { ...exports.marketWalkway.listeningBoard, label: 'Ремонтные ряды', area: 'Рынок «Спектр»' },
    { x: exports.marketIceSlip, z: 57.7, label: 'Съезд на лёд', area: 'Шлюзовой канал' },
    { ...exports.marketCanalChase.stairs, label: 'Шлюзовая лестница', area: 'Южный берег' }
];
exports.quarterWalkRoute = [
    exports.marketWalkway.westernEntry, exports.marketWalkway.westernLanding, exports.marketWalkway.easternLanding, exports.marketWalkway.easternEntry,
    { x: 13.15, z: 13.21, y: 0 }, { x: 15.1, z: 13.21, y: 0 }, { x: 15.1, z: 11.50, y: 0 },
    exports.marketWalkway.listeningBoard, { x: 41.15, z: 11.50, y: 0 }, { x: 41.15, z: 25.3, y: 0 }, { x: 31.3, z: 25.6, y: 0 },
];
exports.quarterChaseWalk = [
    exports.marketCanalChase.parking, exports.marketCanalChase.stairs, exports.marketCanalChase.landing, exports.marketCanalChase.turn,
    exports.marketCanalChase.stairsOut, exports.marketCanalChase.shelter
];
exports.quarterChaseDrive = [
    exports.marketCanalChase.start, { x: 48, z: 19.7 }, { x: 46.7, z: 24.6 }, { x: 43, z: 27.9 }, { x: 38, z: 28.8 }, { x: 25, z: 28.8 },
    { x: 20.7, z: 29.9 }, { x: 17, z: 33.5 }, { x: 14.9, z: 39.2 }, { x: exports.marketIceSlip, z: 45.7 }, exports.marketCanalChase.parking
];
exports.quarterWaymarks = [
    { x: -2.84, z: -9.0, y: 1.81, label: 'ОПТИЧЕСКИЙ ДВОР', sub: 'МОСТ К РЫНКУ  ↑', angle: Math.PI },
    { x: 6.44, z: .43, y: marketLevel + 1.74, label: 'МОСТ «СПЕКТР»', sub: 'ТРАМВАЙНАЯ ЛИНИЯ 07', angle: 0 },
    { x: 11.50, z: 10.97, y: 1.84, label: 'ПЕШЕХОДНЫЙ МОСТ', sub: 'ДВОРЫ  ‹  ›  РЫНОК', angle: 0 },
    { x: 19.1, z: 11.75, y: 1.74, label: 'РЕМОНТНЫЕ РЯДЫ', sub: 'ВЫХОД К РЫНКУ  ›', angle: 0 },
    { x: exports.marketIceSlip + 2.05, z: 58.15, y: 1.78, label: 'ШЛЮЗОВОЙ СЪЕЗД', sub: 'АВАРИЙНЫЙ ПРОЕЗД НА ЛЁД', angle: Math.PI },
    { x: 4.82, z: 90.74, y: quayLevel + 1.85, label: 'ПРОХОД 02', sub: 'РЕЧНОЙ ВОКЗАЛ', angle: Math.PI / 2 }
];
