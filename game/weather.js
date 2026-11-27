"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frozenRoads = exports.weatherNames = void 0;
exports.daylightAt = daylightAt;
exports.roadIceAt = roadIceAt;
exports.weatherAt = weatherAt;
exports.footstepSurface = footstepSurface;
exports.effectsQuality = effectsQuality;
const city_clock_js_1 = require("./city-clock.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const cycle = [
    { id: 'snow', seconds: 96, snow: .58, flurry: .33, rain: 0, wind: .29, mist: .39, wet: .68, temp: -1.1, dayRise: 2.4, runoff: .10 },
    { id: 'drizzle', seconds: 120, snow: 0, rain: .82, wind: .41, mist: .63, wet: .98, temp: 1.8, dayRise: 6.8, runoff: 1.0 },
    { id: 'wind', seconds: 136, snow: .35, rain: 0, wind: .94, mist: .29, wet: .74, temp: -5.5, dayRise: 3.4, runoff: .91 },
    { id: 'clear', seconds: 300, snow: 0, rain: 0, wind: .15, mist: .10, wet: .41, temp: -4.3, dayRise: 6.8, runoff: .74 },
    { id: 'snow', seconds: 128, snow: .52, flurry: .45, rain: 0, wind: .34, mist: .32, wet: .59, temp: -2.6, dayRise: 2.4, runoff: .28 },
    { id: 'wind', seconds: 102, snow: .16, rain: 0, wind: .83, mist: .24, wet: .48, temp: -1.5, dayRise: 3.4, runoff: .14 }
];
exports.weatherNames = { snow: 'Лёгкий снег', drizzle: 'Морось', clear: 'Ясно', wind: 'Сильный ветер' };
const weatherCycle = cycle.reduce((total, part) => total + part.seconds, 0);
const blendSeconds = 22;
const smooth = (n) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function daylightAt(clock) {
    const hour = ((clock % 1440 + 1440) % 1440) / 60;
    return smooth((hour - 6.05) / 1.45) * (1 - smooth((hour - 16.15) / 2.55));
}
exports.frozenRoads = [
    { x: 44.45, z: 12.8, across: 2.25, along: 7.2, yaw: 0, shade: .82, name: 'Поворот под эстакадой' },
    { x: 47.84, z: 71.8, across: 2.72, along: 12.5, yaw: 0, shade: 1, name: 'Портовый мост' },
    { x: 132.1, z: 7.8, across: 3.29, along: 9.4, yaw: 0, shade: .76, name: 'Грузовой проезд' },
    { x: -55.9, z: -118.7, across: 2.35, along: 12.7, yaw: Math.PI / 2, shade: .63, name: 'Северная магистраль' },
];
function roadIceAt(x, z, weather) {
    if (weather.roadIce < .015)
        return 0;
    let strongest = 0;
    for (const sheet of exports.frozenRoads) {
        if (Math.abs(x - sheet.x) > 16 || Math.abs(z - sheet.z) > 16)
            continue;
        const dx = x - sheet.x, dz = z - sheet.z, co = Math.cos(sheet.yaw), si = Math.sin(sheet.yaw);
        const across = (dx * co - dz * si) / sheet.across, along = (dx * si + dz * co) / sheet.along;
        const field = smooth((1 - across * across - along * along) / .41);
        const grit = 1 - weather.clearedRoad * .96 * smooth((.54 - Math.abs(across)) / .18);
        strongest = Math.max(strongest, field * weather.roadIce * sheet.shade * grit);
    }
    return strongest;
}
function weatherAt(elapsed, clock) {
    const seconds = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
    let time = seconds % weatherCycle;
    let index = 0;
    while (time >= cycle[index].seconds) {
        time -= cycle[index].seconds;
        index++;
    }
    const current = cycle[index], next = cycle[(index + 1) % cycle.length];
    const t = smooth(1 - (current.seconds - time) / blendSeconds);
    const minutes = Number.isFinite(clock) ? clock : (0, city_clock_js_1.districtMinutes)(seconds), daylight = daylightAt(minutes);
    const hour = ((minutes % 1440 + 1440) % 1440) / 60;
    // Cloud cover limits daytime warming while the front is depositing snow.
    const temperature = lerp(current.temp, next.temp, t) + daylight * lerp(current.dayRise, next.dayRise, t);
    const flurry = current.flurry ? current.flurry * smooth((time - 6) / 20) *
        (1 - smooth((time - current.seconds * .57) / 18)) : 0;
    const incomingSnow = lerp(current.snow + flurry, next.snow, t), incomingRain = lerp(current.rain, next.rain, t);
    const melting = smooth((temperature - .45) / 2.2), freezing = smooth((-temperature - .8) / 2.5);
    const snow = incomingSnow * (1 - melting) + incomingRain * freezing;
    const rain = incomingRain * (1 - freezing) + incomingSnow * melting;
    const wetSnow = snow > 0 ? smooth((temperature + 1.7) / 3.1) : 0;
    const runoff = lerp(current.runoff, next.runoff, t);
    const roadIce = smooth(-temperature / 4.5) * runoff;
    const clearedRoad = smooth((hour - 5.05) / 1.67) * (1 - smooth((hour - 15.4) / 2.62));
    const wind = lerp(current.wind, next.wind, t), direction = .78 + .46 * Math.sin(seconds * .0032);
    const gust = (.63 + .25 * Math.sin(seconds * .71) + .12 * Math.sin(seconds * 1.42)) * wind;
    return { id: t < .5 ? current.id : next.id, daylight, wind,
        snow, rain, wetSnow,
        mist: lerp(current.mist, next.mist, t) + flurry * .44 * (1 - melting), wet: lerp(current.wet, next.wet, t),
        gustX: Math.cos(direction) * gust, gustZ: Math.sin(direction) * gust, temperature, roadIce, clearedRoad };
}
function footstepSurface(surface, x, z, weather) {
    if (surface === 'snow' && z >= world_expansion_layout_js_1.canal.north + 2 && z <= world_expansion_layout_js_1.canal.south - 2 && Number.isFinite(x))
        return 'ice';
    if (surface === 'snow' && weather.temperature > .5 && weather.wet > .5)
        return 'slush';
    if (surface === 'asphalt' && roadIceAt(x, z, weather) > .26)
        return 'ice';
    if (surface === 'asphalt' && weather.wet > .55)
        return 'wet';
    return surface;
}
function effectsQuality(preferred, busy, fast) {
    const level = Math.max(0, Math.min(2, Math.round(preferred) || 0));
    return busy && fast ? Math.max(0, level - 1) : level;
}
