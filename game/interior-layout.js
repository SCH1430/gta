"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zoneAt = exports.annexAt = exports.annexes = exports.riseFlight = exports.laneWidth = exports.stairLanes = exports.stairBaseX = void 0;
exports.interiorAtlas = interiorAtlas;
exports.annexFloor = annexFloor;
exports.moveInAnnex = moveInAnnex;
exports.annexClearance = annexClearance;
const campus = require("./campus-layout.js").campus;
const campusMotion = require("./campus-movement.js");
const house_layout_js_1 = require("./house-layout.js");
const { river, metal } = require('./venue-layout.js');
const v = (kind, x, z, w, d, h) => ({ kind, x, z, w, d, h });
const lab = (x, z, name) => ({ x, z, name });
function room(name, x, z, w, d, floor, ceiling, furniture, labels, entrance) {
    const l = x - w / 2, r = x + w / 2, n = z - d / 2, s = z + d / 2;
    return { name, floor, ceiling, entrance, bounds: { minX: l, maxX: r, minZ: n, maxZ: s }, furniture, labels, walls: [
            { x1: l, z1: n, x2: r, z2: n }, { x1: r, z1: n, x2: r, z2: s }, { x1: r, z1: s, x2: l, z2: s }, { x1: l, z1: s, x2: l, z2: n }
        ] };
}
exports.stairBaseX = -49, exports.stairLanes = 5, exports.laneWidth = 1.55, exports.riseFlight = (18.2 - 3.06) / exports.stairLanes;
const stairWalls = Array.from({ length: exports.stairLanes - 1 }, (_, i) => v('stairRail', exports.stairBaseX + (i + .5) * exports.laneWidth, i % 2 === 0 ? .71 : -.71, .11, 6.48, 1.04));
exports.annexes = {
    ...campus.floors,
    ...Object.fromEntries(Object.entries(require('./neighborhood-shops.js').shops).map(([id, shop]) => {
        const x = shop.centre;
        const items = id === 'locker' ? [v('lockers', x, -3.48, 6.4, .82, 2.0), v('dryer', x + 3.46, -.42, .24, 1.0, .86)] :
            [v('counter', x, -2.86, 3.6, .92, 1.1)];
        if (id === 'grocery') items.push(v('fridge',x-3.29,-3.39,1.49,.92,2.08), v('bread',x+3.38,-3.43,1.25,.77,1.0));
        if (id === 'optician') items.push(v('frames',x-3.30,-3.55,2.25,.5,1.68));
        if (id === 'canteen') for (const k of [-1,1]) items.push(v('cafe-table',x+k*2.83,1.18,1.47,1.74,.84));
        return [id,room(shop.label,x,0,10,8,0,3.12,items,[lab(x,2.97,'Выход')],{x,z:2.97})];
    })),
    basement: room('Подвал · тепловой узел', 36, 0, 12, 8, -2.75, 2.65, [
        v('manifold', 36, -3.55, 10.7, .65, 1.64), v('pump', 31.02, .12, 1.55, 1.52, .98), v('meter', 41.16, .14, .73, 1.08, 1.61)
    ], [lab(32, -2, 'Подача'), lab(36, -2, 'Стояк Б'), lab(40, -2, 'Обратка'), lab(36, 3.02, 'Лифт')], { x: 36, z: 2.85 }),
    workshop: room('Мастерская Инны', 66, 0, 10, 8, 0, 3.06, [
        v('bench', 67, -3.42, 4.15, .95, .94), v('shelves', 70.35, -.12, .94, 4.15, 2.32), v('display', 61.72, .43, .86, 3.24, 1.05), v('partition', 65.68, 2.71, .12, 2.58, 2.66), v('partition', 65.68, -2.66, .12, 2.68, 2.66)
    ], [lab(67, -1.8, 'Стенд'), lab(64, 2.5, 'Прилавок'), lab(66, 3.30, 'Выход')], { x: 66, z: 2.97 }),
    dispatch: room('Диспетчерская Семёна', 95, 0, 10.6, 8, 0, 3.2, [
        v('console', 93.8, -3.29, 4.05, 1.03, .89), v('archive', 98.62, -3.51, 1.66, .78, 2.13), v('rack', 90.31, .32, .76, 2.66, 1.85)
    ], [lab(94, -2.4, 'Стрелки'), lab(98, -2.25, 'Архив'), lab(95, 3.30, 'Выход')], { x: 95, z: 2.97 }),
    taxipark: room('Таксопарк «Канальный»', 126, 0, 11.2, 9.4, 0, 3.24, [
        v('counter', 126, -2.86, 5.35, .93, 1.08), v('seating', 130.96, .48, .63, 3.2, .93), v('rack', 121.0, -1.20, .64, 4.0, 2.25)
    ], [lab(126, -1.65, 'Стойка'), lab(130, 1.1, 'Ожидание'), lab(126, 3.75, 'Выход')], { x: 126, z: 3.45 }),
    cafe: room('Кафе «Горячий лёд»', 153, 0, 10.8, 9.4, 0, 3.24, [
        v('counter', 153, -2.86, 5.1, .93, 1.08), v('cafe-table', 149.64, .72, 1.45, 1.72, .82),
        v('cafe-table', 156.36, .72, 1.45, 1.72, .82), v('seating', 157.88, 1.25, .61, 3.9, .93)
    ], [lab(153, -1.65, 'Стойка'), lab(149.5, .72, 'Столики'), lab(153, 3.75, 'Выход')], { x: 153, z: 3.45 }),
    terminal: room('Дежурка терминала', 180, 0, 10.8, 9.4, 0, 3.24, [
        v('counter', 180, -2.86, 5.1, .93, 1.08), v('rack', 184.7, -.34, 1.0, 3.61, 2.21),
        v('crate-stack', 175.60, .25, .88, 1.4, .79)
    ], [lab(180, -1.65, 'Пропуска'), lab(177, 1.20, 'Груз'), lab(183, 1.20, 'Площадка'), lab(180, 3.75, 'Выход')], { x: 180, z: 3.45 }),
    hydro: room('Диспетчерская плотины', 207, 0, 11.5, 9.4, 0, 3.24, [
        v('counter', 207, -2.86, 5.3, .93, 1.08), v('generator', 211.64, -1.20, 1.15, 3.2, 1.44),
        v('rack', 202.2, -.58, .75, 3.4, 2.13)
    ], [lab(207, -1.65, 'Пульт'), lab(211, -.4, 'Генератор'), lab(207, 3.75, 'Выход')], { x: 207, z: 3.45 }),
    passage: room('Сквозной вход · Канальная, 23', 234, 0, 4.4, 11.4, 0, 2.8, [
        v('pipe', 232.08, .3, .32, 7.35, 1.71)
    ], [lab(234, 4.5, 'Канальная'), lab(234, -4.5, 'Панельный двор')], { x: 234, z: 4.48 }),
    'river-station': room(river.door.label, river.centre, 0, 12.6, 9.2, 0, 3.30, [
        v('counter', river.dispatcher.x, river.dispatcher.z + .76, 4.2, .76, .99),
        v('bench-row', 252.5, 1.15, .66, 3.52, .84),
        v('bench-row', 263.5, 1.25, .66, 3.52, .84),
        v('luggage', 253.8, -3.86, 1.64, .68, 1.15),
    ], [lab(river.centre, -3.15, 'Табло'), lab(254.3, 1.6, 'Зал ожидания'), lab(river.centre, 3.45, 'Выход')], { x: river.centre, z: 3.55 }),
    'metal-hall': room(metal.door.label, metal.centre, 0, 14, 11.6, 0, 3.85, [
        v('stage', metal.centre, -3.65, 8.65, 3.15, .41),
        v('bench-row', 277.25, 2.45, .72, 4.28, .84),
        v('bench-row', 288.75, 2.45, .72, 4.28, .84),
        v('instrument-case', 287.98, -3.7, 1.80, .86, .52),
    ], [lab(metal.centre, -3.3, 'Сцена'), lab(metal.centre, -.8, 'Репетиция'), lab(metal.centre, 4.60, 'Выход')], { x: metal.centre, z: 4.65 }),
    roof: room('Крыша · Канальная, 23', -92, 0, 17.6, 10.6, 18.2, 80, [
        v('vent', -95, -2.52, 1.21, 1.18, 1.24), v('vent', -88.13, .20, .93, .79, .95), v('headhouse', -98.3, 2.75, 2.50, 2.32, 2.74)
    ], [lab(-98., .65, 'Лестница'), lab(-92, 4, 'Лифт'), lab(-86, -3.8, 'Панорама')], { x: -98.0, z: .80 }),
    stairs: room('Служебная лестница', exports.stairBaseX + 2 * exports.laneWidth, 0, exports.stairLanes * exports.laneWidth, 8.4, 3.06, 24, stairWalls, [lab(exports.stairBaseX, 3.35, 'Этаж 2'), lab(exports.stairBaseX + 4 * exports.laneWidth, -3.35, 'Крыша')], { x: exports.stairBaseX, z: 3.55 }),
    lift: room('Лифт · Канальная, 23', -65, 0, 2.38, 2.55, 0, 2.56, [], [lab(-65, 0, 'Кабина')], { x: -65, z: .5 }),
};
const shopZones = Object.keys(require('./neighborhood-shops.js').shops);
function shopAt(x) {
    return shopZones.find(id => x >= exports.annexes[id].bounds.minX && x <= exports.annexes[id].bounds.maxX);
}
const annexAt = (x, z = 0, y = 0) => x >= 455 && x <= 525 ? shopAt(x) ?? null : campusMotion.isCampusX(x) ? campusMotion.zoneFor(x, z, y) : x > 270 ? 'metal-hall' : x > 246 ? 'river-station' : x > 220 ? 'passage' : x > 193 ? 'hydro' : x > 166 ? 'terminal' : x > 139 ? 'cafe' : x > 110 ? 'taxipark' : x < -78 ? 'roof' : x < -56 ? 'lift' : x < -30 ? 'stairs' : x > 83 ? 'dispatch' : x > 53 ? 'workshop' : x > 22 ? 'basement' : null;
exports.annexAt = annexAt;
const zoneAt = (x, z = 0, y = 0) => (0, exports.annexAt)(x, z, y) ?? 'house';
exports.zoneAt = zoneAt;
function interiorAtlas(zone) {
    if (Object.hasOwn(exports.annexes, zone))
        return exports.annexes[zone];
    return { name: 'Канальная, 23', ...house_layout_js_1.housePlan };
}
function annexFloor(zone, x, z) {
    if (zone !== 'stairs')
        return exports.annexes[zone].floor;
    const lane = Math.max(0, Math.min(4, Math.floor((x - exports.stairBaseX + exports.laneWidth * .5) / exports.laneWidth)));
    const t = Math.max(0, Math.min(1, (lane % 2 ? z + 2.8 : 2.8 - z) / 5.6));
    return 3.06 + exports.riseFlight * (lane + Math.ceil(t * 18 - .000001) / 18);
}
const clamp = (a, l, h) => Math.max(l, Math.min(h, a));
function collide(p, s, r) {
    const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, z0 = s.z - s.d / 2, z1 = s.z + s.d / 2;
    const dx = p.x - clamp(p.x, x0, x1), dz = p.z - clamp(p.z, z0, z1), l = Math.hypot(dx, dz);
    if (l >= r)
        return;
    if (l > .00001) {
        p.x += dx * (r / l - 1);
        p.z += dz * (r / l - 1);
        return;
    }
    const sides = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z], side = sides.indexOf(Math.min(...sides));
    if (side === 0)
        p.x = x0 - r;
    else if (side === 1)
        p.x = x1 + r;
    else if (side === 2)
        p.z = z0 - r;
    else
        p.z = z1 + r;
}
function moveInAnnex(zone, x, z, dx, dz, r) {
    const area = exports.annexes[zone], b = area.bounds, steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .14)), p = { x, z };
    for (let i = 0; i < steps; i++) {
        p.x = clamp(p.x + dx / steps, b.minX + r + .076, b.maxX - r - .076);
        p.z = clamp(p.z + dz / steps, b.minZ + r + .076, b.maxZ - r - .076);
        for (const s of area.furniture)
            collide(p, s, r);
    }
    return p;
}
function annexClearance(zone, start, dir, end, r) {
    const a = exports.annexes[zone], b = a.bounds;
    const n = Math.max(1, Math.ceil(end / .075));
    for (let i = 1; i <= n; i++) {
        const t = i / n * end, x = start.x + dir.x * t, y = start.y + dir.y * t, z = start.z + dir.z * t, f = annexFloor(zone, x, z);
        if (y < f + r || y > a.floor + a.ceiling - r)
            return (i - 1) / n * end;
        if ((zone !== 'roof' || y < a.floor + 1.08 + r) && (x < b.minX + r || x > b.maxX - r || z < b.minZ + r || z > b.maxZ - r))
            return (i - 1) / n * end;
        if (a.furniture.some(o => Math.abs(x - o.x) < o.w / 2 + r && Math.abs(z - o.z) < o.d / 2 + r && y < f + o.h + r))
            return (i - 1) / n * end;
    }
    return end;
}
