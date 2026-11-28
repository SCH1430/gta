"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regionSignals = exports.regionLamps = exports.regionObstacles = exports.regionBuildings = exports.regionLandmarks = exports.regionAprons = exports.regionPaths = exports.regionRoads = exports.regionIceSlips = exports.regionBridges = exports.outerSites = exports.regionSites = exports.regionDistrictNames = exports.innerLimits = exports.regionLimits = void 0;
exports.regionIdAt = regionIdAt;
exports.regionDistrict = regionDistrict;
exports.regionalSurfaceAt = regionalSurfaceAt;
const city_life_layout_js_1 = require("./city-life-layout.js");
const static_box_index_js_1 = require("./static-box-index.js");
const outer_site_layout_js_1 = require("./outer-site-layout.js");
const formerLimits = { minX: -540, maxX: 540, minZ: -441, maxZ: 447 };
exports.regionLimits = { minX: -1080, maxX: 1080, minZ: -885, maxZ: 891 };
exports.innerLimits = { minX: -180, maxX: 180, minZ: -145, maxZ: 151 };
exports.regionDistrictNames = {
    radio: 'Радиогорск', quarry: 'Старый карьер', water: 'Озёрная слобода', dock: 'Сухой док',
    northpark: 'Северный посёлок', cargo: 'Западный терминал', dam: 'Белая плотина', mill: 'Лесная промзона'
};
exports.regionSites = [
    { id: 'radio', district: 'radio', x: -20, z: -319, w: 32, d: 22, h: 52, label: 'Радиоцентр «Полюс»', stop: { x: -20, z: -305.5 } },
    { id: 'quarry', district: 'quarry', x: -402, z: -72, w: 36, d: 28, h: 30, label: 'Дробильня старого карьера', stop: { x: -402, z: -54 } },
    { id: 'water', district: 'water', x: 403, z: -78, w: 20, d: 20, h: 34, label: 'Озёрная водонапорная башня', stop: { x: 403, z: -64 } },
    { id: 'dock', district: 'dock', x: 76, z: 329, w: 50, d: 28, h: 30, label: 'Судоверфь «Сухой док»', stop: { x: 76, z: 310 } },
    { id: 'northpark', district: 'northpark', x: -16, z: -691, w: 48, d: 27, h: 30, label: 'Микрорайон «Север-8»', stop: { x: -16, z: -665 } },
    { id: 'cargo', district: 'cargo', x: -802, z: -141, w: 56, d: 36, h: 28, label: 'Терминал «Красный перегон»', stop: { x: -802, z: -111 } },
    { id: 'dam', district: 'dam', x: 788, z: -189, w: 56, d: 32, h: 34, label: 'Гидроузел «Белая плотина»', stop: { x: 788, z: -163 } },
    { id: 'mill', district: 'mill', x: 185, z: 647, w: 58, d: 37, h: 25, label: 'Завод «Северный лес»', stop: { x: 185, z: 677 } }
];
exports.outerSites = exports.regionSites.slice(4);
exports.regionBridges = [
    { x: -444, name: 'Карьерный мост' }, { x: 444, name: 'Озёрный мост' },
    { x: -944, name: 'Вагонный мост' }, { x: 944, name: 'Гидротехнический мост' }
];
exports.regionIceSlips = [-885, -714, -495, -272, 268, 495, 703, 884];
const line = (x1, z1, x2, z2, width, name) => ({ x1, z1, x2, z2, width, name });
const horizontal = (lo, hi, z, width, name) => line(lo, z, hi, z, width, name);
const vertical = (x, lo, hi, width, name) => line(x, lo, x, hi, width, name);
const formerRoads = [
    horizontal(-444, 444, -360, 12, 'Северное шоссе'),
    vertical(-444, -360, 366, 12, 'Карьерное шоссе'),
    horizontal(-444, 444, 366, 12, 'Южная окружная'),
    vertical(444, -360, 366, 12, 'Озёрное шоссе'),
    ...[[-117, -173, 166, 10.4, 'Северная магистраль'], [30, -174, 168, 10.8, 'Канальная улица'],
        [112, -168, 171, 11, 'Портовый проспект']].flatMap(([z, a, b, w, n]) => [
        horizontal(-444, a, z, w, n), horizontal(b, 444, z, w, n)
    ]),
    ...[[-126, -137, 142, 10.8, 'Литейный проезд'], [46, -136, 144, 11, 'Портовая улица']].flatMap(([x, a, b, w, n]) => [
        vertical(x, -360, a, w, n), vertical(x, b, 366, w, n)
    ]),
    horizontal(-444, 444, -250, 10, 'Проспект Связистов'),
    horizontal(-444, 444, 244, 10.6, 'Улица Корабелов'),
    vertical(-312, -360, 30, 9.6, 'Улица Геологов'), vertical(-312, 112, 366, 9.6, 'Шихтовый проезд'),
    vertical(312, -360, 30, 9.6, 'Рябиновый бульвар'), vertical(312, 112, 366, 9.6, 'Слипный проезд'),
    horizontal(-444, -312, -48, 8, 'Проезд Дробильщиков'), horizontal(312, 444, -58, 8, 'Слобожанская улица'),
    horizontal(-126, 46, -300, 8, 'Антенная улица'), horizontal(-126, 312, 304, 8, 'Доковая улица'),
    horizontal(-312, -126, -182, 8, 'Переулок Метеорологов'), horizontal(46, 312, -189, 8, 'Тихая аллея'),
    horizontal(-444, -126, 182, 8.5, 'Баржевая улица'), horizontal(46, 444, 183, 8, 'Улица Штурманов'),
    vertical(-232, -250, -117, 8, 'Проезд Рудокопов'), vertical(224, -250, -117, 8, 'Сиреневый переулок'),
    vertical(-236, 112, 244, 8.2, 'Малый портовый проезд'), vertical(226, 112, 244, 8.2, 'Проезд Механизаторов'),
    vertical(-510, -250, 30, 9, 'Забойная дорога'), horizontal(-510, -444, -250, 9, 'Забойная дорога'), horizontal(-510, -444, 30, 9, 'Забойная дорога'),
    vertical(508, -117, 30, 8, 'Улица Приозёрная'), horizontal(444, 508, -117, 8, 'Улица Приозёрная'), horizontal(444, 508, 30, 8, 'Улица Приозёрная'),
    vertical(-126, -412, -360, 8.2, 'Верхняя улица'), horizontal(-126, 312, -412, 8.2, 'Верхняя улица'), vertical(312, -412, -360, 8.2, 'Верхняя улица'),
    vertical(-312, 366, 418, 8.6, 'Южная набережная'), horizontal(-312, 312, 418, 8.6, 'Южная набережная'), vertical(312, 366, 418, 8.6, 'Южная набережная'),
    horizontal(-510, -444, 244, 8, 'Каменный спуск'), vertical(-510, 244, 398, 8, 'Каменный спуск'), horizontal(-510, -444, 398, 8, 'Каменный спуск'),
    vertical(-444, 366, 398, 8, 'Каменный спуск'),
    horizontal(444, 503, -360, 8, 'Улица Инея'), vertical(503, -360, -250, 8, 'Улица Инея'), horizontal(444, 503, -250, 8, 'Улица Инея')
];
const bypassRoads = [
    horizontal(-944, 944, -756, 13, 'Северный обход'),
    vertical(-944, -756, 762, 12, 'Западный обход'),
    horizontal(-944, 944, 762, 13, 'Южный обход'),
    vertical(944, -756, 762, 12, 'Восточный обход'),
    ...[-312, 46, 312].flatMap((x, i) => [
        vertical(x, -756, x === 312 ? -412 : -360, 11, ['Верхний шихтовый проезд', 'Дорога на Северный', 'Улица Подстанции'][i]),
        vertical(x, x === 46 ? 366 : 418, 762, 11, ['Просека связистов', 'Лесное шоссе', 'Южный промышленный проезд'][i])
    ]),
    ...[-360, 30, 112, 244, 366].flatMap((z, i) => [
        horizontal(-944, z === 30 || z === 244 ? -510 : -444, z, 11.4, ['Рудное шоссе', 'Складской тракт', 'Дорога к Вагонному мосту', 'Улица Монтажников', 'Карьерный тракт'][i]),
        horizontal(z === -360 ? 503 : z === 30 ? 508 : 444, 944, z, 11.4, ['Шоссе Водосброса', 'Тракт Озёрной слободы', 'Полевая трасса', 'Проспект Энергетиков', 'Портовый тракт'][i])
    ]),
    horizontal(-944, 944, -542, 10.8, 'Северный поперечный проезд'),
    horizontal(-944, 944, 535, 10.4, 'Дорога Лесного кольца'),
    vertical(-140, -756, -542, 9.2, 'Аллея Ледового дворца'),
    horizontal(-312, 46, -657, 10, 'Проспект Полярников'),
    horizontal(-140, 312, -615, 8.8, 'Улица Кедровая'),
    horizontal(-944, -444, -270, 10.8, 'Сортировочное шоссе'),
    horizontal(-944, -716, -103, 10, 'Вагонная улица'),
    vertical(-864, -270, 30, 9.2, 'Товарный проезд'), vertical(-716, -360, 30, 10, 'Терминальная улица'),
    horizontal(-864, -716, -204, 8.6, 'Улица Грузчиков'),
    horizontal(503, 944, -250, 10.6, 'Шлюзовое шоссе'),
    horizontal(702, 944, -155, 10, 'Гидротехническая улица'),
    vertical(702, -360, 30, 9.6, 'Улица Машинного зала'), vertical(866, -250, 30, 9.6, 'Дорога Водосброса'),
    horizontal(702, 866, -85, 8.8, 'Крановый проезд'),
    horizontal(46, 312, 686, 10, 'Лесопильная улица'),
    vertical(112, 535, 762, 9.3, 'Улица Сушильных камер'), vertical(270, 535, 762, 9.4, 'Дорога Весовой'),
    horizontal(112, 270, 595, 8.4, 'Просека Мастерских')
];
exports.regionRoads = [...formerRoads, ...bypassRoads];
const formerPaths = [
    vertical(-72, -360, -250, 2.4, 'Тропа радистов'), horizontal(-126, -72, -337, 2.4, 'Тропа радистов'),
    vertical(-370, -117, 30, 2.8, 'Шахтёрская тропа'), horizontal(-370, -312, -84, 2.8, 'Шахтёрская тропа'),
    vertical(366, -117, 30, 2.6, 'Тополиная аллея'), horizontal(366, 444, -21, 2.6, 'Тополиная аллея'),
    vertical(156, 244, 366, 2.8, 'Галерная улица'), horizontal(46, 156, 280, 2.8, 'Галерная улица'),
    vertical(-272, 30, 112, 2.3, 'Карьерный спуск на лёд'), vertical(268, 30, 112, 2.3, 'Озёрный спуск на лёд'),
    horizontal(-510, -272, 48, 2.4, 'Западная береговая тропа'), horizontal(268, 508, 49, 2.4, 'Восточная береговая тропа')
];
const bypassPaths = [
    horizontal(-104, 30, -635, 3.2, 'Сквер Полярников'), vertical(-70, -657, -615, 2.8, 'Тропа к скверу'),
    horizontal(-848, -748, -89, 3.0, 'Пешеходная улица Терминала'), vertical(-840, -103, -89, 2.6, 'Проход к проходной'),
    horizontal(729, 849, -125, 2.8, 'Аллея Гидротехников'), vertical(739, -155, -125, 2.7, 'Проход к смотровой'),
    horizontal(140, 245, 714, 3.2, 'Тропа Резчиков'), vertical(213, 686, 725, 2.6, 'Подход к лесной сторожке'),
    vertical(-85, -615, -592, 2.6, 'Дорожка к Ледовой арене'), vertical(-754, -218, -204, 2.7, 'Подход к Таможенному складу'),
    vertical(895, -250, -244, 2.6, 'Подход к Водосбросу № 2'), vertical(343, 535, 542, 2.8, 'Подход к Лесному депо'),
    vertical(-714, 30, 112, 2.8, 'Ледовый путь у западных причалов'), vertical(703, 30, 112, 2.8, 'Проход к восточным причалам')
];
const schoolSite = require("./school-site.js");
exports.regionPaths = [...formerPaths, ...bypassPaths, schoolSite.schoolWalk];
exports.regionAprons = [...Object.values(outer_site_layout_js_1.outerSiteCourts), ...city_life_layout_js_1.roadStopAprons];
function regionIdAt(x, z) {
    const outerWest = (formerLimits.minX - x) / 540, outerEast = (x - formerLimits.maxX) / 540, outerNorth = (formerLimits.minZ - z) / 444, outerSouth = (z - formerLimits.maxZ) / 444;
    const outerEdge = Math.max(outerWest, outerEast, outerNorth, outerSouth);
    if (outerEdge > 0) {
        if (outerEdge === outerNorth)
            return 'northpark';
        if (outerEdge === outerSouth)
            return 'mill';
        return outerEdge === outerWest ? 'cargo' : 'dam';
    }
    return formerRegionIdAt(x, z);
}
function formerRegionIdAt(x, z) {
    const west = (exports.innerLimits.minX - x) / 360, east = (x - exports.innerLimits.maxX) / 360, north = (exports.innerLimits.minZ - z) / 296, south = (z - exports.innerLimits.maxZ) / 296;
    const edge = Math.max(west, east, north, south);
    if (edge <= 0)
        return null;
    if (edge === north)
        return 'radio';
    if (edge === south)
        return 'dock';
    return edge === west ? 'quarry' : 'water';
}
function regionDistrict(x, z) {
    const id = regionIdAt(x, z);
    return id ? exports.regionDistrictNames[id] : null;
}
const block = (district, x, z, w, d, h, kind, name) => ({ district, x, z, w, d, h, kind, name });
const localSites = [
    { b: block('radio', 112, -391, 33, 18, 10, 'station', 'МЕТЕОСТАНЦИЯ'), stop: { x: 112, z: -406 }, label: 'Метеостанция' },
    { b: block('quarry', -486, -173, 28, 16, 13, 'warehouse', 'РУДНЫЙ ДВОР'), stop: { x: -503.5, z: -173 }, label: 'Рудный двор' },
    { b: block('water', 481, -33, 31, 19, 13, 'brick', 'ДОМ РЫБАКОВ'), stop: { x: 502, z: -33 }, label: 'Дом рыбаков' },
    { b: block('dock', -196, 394, 40, 21, 10, 'dock', 'ПАРОМНЫЕ МАСТЕРСКИЕ'), stop: { x: -196, z: 412 }, label: 'Паромные мастерские' },
    { b: block('northpark', -85, -574, 32, 18, 8, 'station', 'ЛЕДОВАЯ АРЕНА'), stop: { x: -85, z: -592 }, label: 'Ледовая арена' },
    { b: block('cargo', -754, -235, 29, 22, 13, 'warehouse', 'ТАМОЖЕННЫЙ СКЛАД'), stop: { x: -754, z: -218 }, label: 'Таможенный склад' },
    { b: block('dam', 895, -226, 26, 20, 16, 'plant', 'ВОДОСБРОС № 2'), stop: { x: 895, z: -244 }, label: 'Водосброс № 2' },
    { b: block('mill', 343, 565, 37, 21, 12, 'warehouse', 'ЛЕСНОЕ ДЕПО'), stop: { x: 343, z: 542 }, label: 'Лесное депо' }
];
exports.regionLandmarks = [
    ...exports.regionSites.map(s => ({ ...s.stop, label: s.label })),
    ...localSites.map(s => ({ ...s.stop, label: s.label })),
    ...exports.regionBridges.map(b => ({ x: b.x, z: 73.5, label: b.name }))
];
const overlaps = (a, b, gap) => Math.abs(a.x - b.x) < (a.w + b.w) * .5 + gap && Math.abs(a.z - b.z) < (a.d + b.d) * .5 + gap;
const strip = (r) => ({ x: (r.x1 + r.x2) / 2, z: (r.z1 + r.z2) / 2, w: r.x2 - r.x1 + r.width, d: r.z2 - r.z1 + r.width });
const footprints = exports.regionRoads.map(strip), paths = exports.regionPaths.map(strip);
const original = { x: 0, z: 3, w: 360, d: 296 };
const formerSurvey = { x: 0, z: 3, w: 1080, d: 888 };
const oldLocal = localSites.slice(0, 4), newLocal = localSites.slice(4);
const formerReserved = [original, ...exports.regionSites.slice(0, 4), ...oldLocal.map(s => s.b), { x: -402.5, z: -82.5, w: 63, d: 51 }, { x: 85.5, z: 333, w: 67, d: 40 }];
const outerReserve = exports.outerSites.map(s => ({ x: s.x, z: s.z, w: 120, d: 96 }));
const outerReserved = [formerSurvey, ...exports.outerSites, ...outerReserve, ...exports.regionAprons, ...newLocal.map(s => s.b)];
const palette = {
    radio: ['brick', 'station', 'warehouse', 'hotel', 'plant'], quarry: ['plant', 'warehouse', 'brick', 'station', 'warehouse'],
    water: ['brick', 'hotel', 'brick', 'station', 'brick'], dock: ['dock', 'warehouse', 'plant', 'brick', 'container'],
    northpark: ['brick', 'hotel', 'brick', 'station', 'hotel'], cargo: ['container', 'warehouse', 'plant', 'warehouse', 'container'],
    dam: ['station', 'brick', 'plant', 'warehouse', 'plant'], mill: ['warehouse', 'plant', 'station', 'brick', 'warehouse']
};
function placeFrontages(lots, outer) {
    let seed = outer ? 260877 : 778721;
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const bounds = outer ? exports.regionLimits : formerLimits;
    const grids = outer ? bypassRoads : formerRoads;
    const banned = outer ? outerReserved : formerReserved;
    const driving = outer ? footprints : footprints.slice(0, formerRoads.length);
    const walking = outer ? paths : paths.slice(0, formerPaths.length);
    for (const r of grids) {
        const h = r.z1 === r.z2, lo = h ? r.x1 : r.z1, hi = h ? r.x2 : r.z2, highway = outer && hi - lo >= 390;
        for (let u = lo + 20 + next() * 20; u < hi - 14; u += (highway ? 55 : 37) + next() * 30) {
            for (const side of [-1, 1]) {
                if (next() < .37)
                    continue;
                const front = 14 + next() * 17, deep = 11 + next() * 13, offset = r.width / 2 + 8 + deep / 2 + next() * 9;
                const x = Math.round(h ? u : r.x1 + side * offset), z = Math.round(h ? r.z1 + side * offset : u);
                const district = outer ? regionIdAt(x, z) : formerRegionIdAt(x, z);
                if (!district)
                    continue;
                if (highway && !exports.outerSites.some(site => Math.hypot(site.x - x, site.z - z) < 235) && next() < .64)
                    continue;
                const styles = palette[district], kind = styles[Math.floor(next() * styles.length)];
                const w = Math.round(h ? front : deep), d = Math.round(h ? deep : front);
                const lot = block(district, x, z, w, d, kind === 'container' ? 5 : Math.round(6 + next() * (kind === 'brick' || kind === 'hotel' ? 18 : 7)), kind, '');
                if (x - w / 2 < bounds.minX + 4 || x + w / 2 > bounds.maxX - 4 || z - d / 2 < bounds.minZ + 4 || z + d / 2 > bounds.maxZ - 4)
                    continue;
                if (z + d / 2 > 54 && z - d / 2 < 94)
                    continue;
                if (banned.some(b => overlaps(b, lot, 5)) || driving.some(b => overlaps(b, lot, 4)) || walking.some(b => overlaps(b, lot, 1.4)))
                    continue;
                if (lots.some(b => overlaps(b, lot, 5)))
                    continue;
                lots.push(lot);
            }
        }
    }
}
function districtLots() {
    const initial = oldLocal.map(site => site.b);
    placeFrontages(initial, false);
    const newRoads = footprints.slice(formerRoads.length), newWalks = paths.slice(formerPaths.length);
    const lots = [...initial.filter(b => !newRoads.some(r => overlaps(b, r, 4)) && !newWalks.some(r => overlaps(b, r, 1.4))), ...newLocal.map(site => site.b)];
    placeFrontages(lots, true);
    return lots;
}
function outerHousing(lot, index) {
    if (lot.name || !['northpark','water','mill'].includes(lot.district) ||
        Math.max(Math.abs(lot.x),Math.abs(lot.z)) < 330 || index%4 > 1) return lot;
    return index%4===0 ? {...lot, kind:'cottage',w:Math.min(lot.w,10),d:Math.min(lot.d,8.5),h:3.15}
        : {...lot, kind:'garages',d:Math.min(lot.d,7.3),h:2.80};
}
exports.regionBuildings = districtLots().map(schoolSite.accommodateCampus).map(outerHousing);
exports.regionObstacles = [...exports.regionBuildings, ...exports.regionSites, ...outer_site_layout_js_1.outerSiteProps, ...schoolSite.schoolShell, schoolSite.schoolBench, schoolSite.schoolPlanter];
const rowOfLights = (z, xs) => xs.map(x => ({ x, z, face: 0 }));
const sideLights = (x, zs, face) => zs.map(z => ({ x, z, face }));
exports.regionLamps = [
    ...rowOfLights(-305.6, [-98, -51, 12, 32]), ...rowOfLights(-366.8, [-192, -83, 75, 245]),
    ...rowOfLights(-53.7, [-423, -382, -333]), ...sideLights(-451.7, [-163, -91, -16, 44, 101], Math.PI / 2),
    ...rowOfLights(-63.7, [329, 354, 381, 425]), ...sideLights(451.7, [-192, -87, 10, 97], -Math.PI / 2),
    ...rowOfLights(298.2, [-80, 8, 58, 102, 186]), ...rowOfLights(359.1, [-291, -151, 14, 199, 354]),
    ...rowOfLights(-647.4, [-116, -87, -57, -15, 24]), ...rowOfLights(-763.8, [-890, -560, -250, 105, 482, 840]),
    ...rowOfLights(-93.8, [-847, -824, -802, -775, -741]),
    ...rowOfLights(-145.6, [726, 757, 788, 818, 844]),
    ...rowOfLights(695.4, [130, 154, 183, 216, 246]), ...rowOfLights(754.2, [-840, -480, -125, 85, 385, 778]),
    ...sideLights(-951.6, [-532, -326, -125, 39, 104, 287, 479, 668], Math.PI / 2),
    ...sideLights(951.6, [-532, -326, -125, 39, 104, 287, 479, 668], -Math.PI / 2)
];
exports.regionSignals = [{ x: 46, z: -250 }, { x: -312, z: 30 }, { x: 312, z: 30 }, { x: 46, z: 244 },
    { x: -716, z: -103 }, { x: 702, z: -155 }, { x: 46, z: -657 }, { x: 112, z: 686 }];
function indexGround(rects, margin) {
    return (0, static_box_index_js_1.indexStaticBoxes)(rects, exports.regionLimits, r => ({
        minX: r.x - r.w * .5 - margin, maxX: r.x + r.w * .5 + margin,
        minZ: r.z - r.d * .5 - margin, maxZ: r.z + r.d * .5 + margin
    }), 48, 0);
}
const roadPatches = indexGround(footprints, 2);
const pavingPatches = indexGround([...paths, ...exports.regionAprons, ...exports.regionObstacles.map(b => ({ ...b, w: b.w + 7.2, d: b.d + 7.2 }))], 0);
function regionalSurfaceAt(x, z) {
    let shoulder = false;
    for (const r of roadPatches(x, z, x, z)) {
        const edge = Math.max(Math.abs(x - r.x) - r.w * .5, Math.abs(z - r.z) - r.d * .5);
        if (edge <= 0)
            return 'asphalt';
        if (edge <= 2)
            shoulder = true;
    }
    if (shoulder || pavingPatches(x, z, x, z).some(r => Math.abs(x - r.x) <= r.w * .5 && Math.abs(z - r.z) <= r.d * .5))
        return 'concrete';
    return null;
}
