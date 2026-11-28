"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explorationObstacles = exports.entranceIntercom = exports.swapCabinet = exports.marketTables = exports.bankFinds = exports.passageFront = exports.serviceEntries = exports.entrances = void 0;
exports.marketLayouts = marketLayouts;
exports.marketPassBlocked = marketPassBlocked;
const city_clock_js_1 = require("./city-clock.js");
const { river, metal } = require('./venue-layout.js');
exports.entrances = {
    ...Object.fromEntries(Object.entries(require('./neighborhood-shops.js').shops).map(([zone, shop]) => [zone, { x: shop.x, z: shop.z, yaw: shop.yaw, label: shop.label, zone }])),
    school1: require('./school-site.js').schoolOutside,
    house: { x: -34.96, z: 17, yaw: Math.PI, zone: 'house', label: 'Дом № 23' },
    workshop: { x: 28, z: 14.82, yaw: 0, zone: 'workshop', label: 'Мастерская Инны' },
    dispatch: { x: 11.1, z: -36.95, yaw: 0, zone: 'dispatch', label: 'Диспетчерская' },
    taxipark: { x: 16, z: 141.75, yaw: 0, zone: 'taxipark', label: 'Таксопарк «Канальный»' },
    cafe: { x: -101, z: 38.84, yaw: Math.PI, zone: 'cafe', label: 'Кафе «Горячий лёд»' },
    terminal: { x: -802, z: -121.65, yaw: 0, zone: 'terminal', label: 'Дежурка терминала' },
    hydro: { x: 788, z: -171.8, yaw: 0, zone: 'hydro', label: 'Диспетчерская плотины' },
    'river-station': river.door,
    'metal-hall': metal.door,
    passage: { x: -34.96, z: 3.4, yaw: Math.PI, zone: 'passage', label: 'Сквозной проход дома № 23' }
};
exports.serviceEntries = ['taxipark', 'cafe', 'terminal', 'hydro', 'river-station', 'metal-hall', 'school1', ...Object.keys(require('./neighborhood-shops.js').shops)];
exports.passageFront = { x: -33.1, z: 16.95, yaw: 0 };
exports.bankFinds = [
    { id: 'box', x: -115, z: 72.8, name: 'Ящик рыбака', description: 'В жестяном ящике — пробковый поплавок, карта глубин и билет на старый трамвай.' },
    { id: 'flood', x: -33.70, z: 79.8, name: 'Отметки паводка', description: 'На столбе три риски. Верхняя подписана «Май 1999». Ниже — след талой воды.' },
    { id: 'pump', x: 35.5, z: 70, name: 'Люк старой насосной', description: 'Под закрытым люком гудит вода. На табличке сохранился номер шлюза.' }
];
exports.marketTables = [54, 64, 73].map(x => ({ x, z: 14.7, w: .92, d: 1.9, h: .87 }));
const empty = [];
const { marketOpen } = require('./market-hours.js');
function marketLayouts(elapsed, calendar = (0, city_clock_js_1.districtCalendarMinutes)(elapsed)) {
    return marketOpen(calendar) ? exports.marketTables : empty;
}
function marketPassBlocked(x, z, r, elapsed, calendar) { return marketLayouts(elapsed, calendar).some(p => Math.abs(x - p.x) < p.w / 2 + r && Math.abs(z - p.z) < p.d / 2 + r); }
exports.swapCabinet = { x: -38.2, z: 17.1 };
exports.entranceIntercom = { x: -34.01, z: 16.53 };
exports.explorationObstacles = [
    { x: -38.2, z: 15.78, w: 1.13, d: .46, h: 1.96 },
    { x: exports.bankFinds[0].x, z: exports.bankFinds[0].z, w: .82, d: .55, h: .55 },
    { x: exports.bankFinds[1].x, z: exports.bankFinds[1].z, w: .22, d: .22, h: 2.01 }
];
