"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populationRadius = exports.defaultPopulation = exports.densityModes = exports.densityNames = void 0;
exports.isPopulationDensity = isPopulationDensity;
exports.populationDistrict = populationDistrict;
exports.populationTargets = populationTargets;
exports.populationVisible = populationVisible;
exports.populationCanEnter = populationCanEnter;
exports.populationCanLeave = populationCanLeave;
exports.populationCounts = populationCounts;
const region_layout_js_1 = require("./region-layout.js");
const world_layout_js_1 = require("./world-layout.js");
exports.densityNames = { low: 'Редко', normal: 'Обычно', high: 'Густо' };
exports.densityModes = Object.keys(exports.densityNames);
exports.defaultPopulation = { pedestrians: 'normal', traffic: 'normal' };
function isPopulationDensity(value) {
    return typeof value === 'string' && Object.hasOwn(exports.densityNames, value);
}
exports.populationRadius = 80;
const bands = {
    'Рынок «Спектр»': { pedestrians: [12, 20], traffic: [4, 8], parked: [6, 11] },
    'Трамвайное депо': { pedestrians: [5, 10], traffic: [7, 12], parked: [4, 9] },
    'Панельные дворы': { pedestrians: [6, 12], traffic: [1, 4], parked: [5, 10] },
    'Канальные гаражи': { pedestrians: [2, 6], traffic: [1, 3], parked: [4, 8] },
    'Кольцевая дорога': { pedestrians: [0, 3], traffic: [10, 16], parked: [0, 3] },
    'Шлюзовой канал': { pedestrians: [2, 4], traffic: [3, 8], parked: [1, 4] },
    'Северный посёлок': { pedestrians: [6, 14], traffic: [3, 7], parked: [4, 10] },
    'Озёрная слобода': { pedestrians: [4, 9], traffic: [2, 6], parked: [4, 8] },
};
const industrial = { pedestrians: [3, 8], traffic: [4, 9], parked: [3, 8] };
const densityMultiplier = { low: .54, normal: 1, high: 1.50 };
const ringRoads = region_layout_js_1.regionRoads.filter((road, index) => index < 4 || road.name.endsWith('обход'));
const wave = (minute, peak, width) => Math.max(0, 1 - Math.abs(minute - peak) / width);
function populationDistrict({ x, z }) {
    if (ringRoads.some(road => {
        const a = road.x1 === road.x2 ? z : x, b = road.x1 === road.x2 ? x : z;
        const lo = road.x1 === road.x2 ? road.z1 : road.x1, hi = road.x1 === road.x2 ? road.z2 : road.x2;
        const center = road.x1 === road.x2 ? road.x1 : road.z1;
        return a >= Math.min(lo, hi) - 3 && a <= Math.max(lo, hi) + 3 && Math.abs(b - center) < road.width * .50 + 1.25;
    }))
        return 'Кольцевая дорога';
    return (0, world_layout_js_1.districtAt)(x, z);
}
function populationTargets(district, minutes, modes) {
    const minute = ((minutes % 1440) + 1440) % 1440, profile = bands[district] ?? industrial;
    const rush = Math.max(wave(minute, 470, 116), wave(minute, 1060, 145));
    const daylight = wave(minute, 790, 465), market = Math.max(wave(minute, 765, 245), wave(minute, 1065, 160));
    const pedestrianPeak = district === 'Рынок «Спектр»' ? market : Math.max(daylight * .62, rush);
    const roadPeak = Math.max(rush, daylight * .58);
    const level = ([lo, hi], amount) => lo + (hi - lo) * amount;
    return {
        pedestrians: Math.round(level(profile.pedestrians, pedestrianPeak) * densityMultiplier[modes.pedestrians]),
        traffic: Math.round(level(profile.traffic, roadPeak) * densityMultiplier[modes.traffic]),
        parked: Math.round(level(profile.parked, daylight)),
    };
}
function populationVisible(frame, point) {
    const x = point.x - frame.x, z = point.z - frame.z, r = Math.hypot(x, z);
    if (r <= 17)
        return true;
    if (r > 174)
        return false;
    return (-x * Math.sin(frame.yaw) - z * Math.cos(frame.yaw)) / r > .24;
}
function populationCanEnter(frame, point, minDistance = 24, maxDistance = 138) {
    const r = Math.hypot(point.x - frame.x, point.z - frame.z);
    return r >= minDistance && r <= maxDistance && !populationVisible(frame, point);
}
function populationCanLeave(frame, point, minDistance = 34) {
    return Math.hypot(point.x - frame.x, point.z - frame.z) >= minDistance && !populationVisible(frame, point);
}
function populationCounts(frame, people, cars, driven) {
    const nearby = (point) => (point.x - frame.x) ** 2 + (point.z - frame.z) ** 2 <= frame.radius ** 2;
    let pedestrians = 0, traffic = 0, parked = 0;
    for (const p of people)
        if (!p.onboard && !p.cab && nearby(p))
            pedestrians++;
    for (const c of cars) {
        if (c.carriedBy || c.police || c.id === driven || !nearby(c))
            continue;
        if (c.auto || c.returning || c.bypass || Math.abs(c.speed) > .4)
            traffic++;
        else
            parked++;
    }
    return { pedestrians, traffic, parked };
}
