"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driveSound = driveSound;
exports.streetSound = streetSound;
const cap = (n, max = 1) => Math.max(0, Math.min(max, n));
const engineTuning = {
    hatch: { idle: 52, shift: 11, cutoff: 630, harmonic: 2.72, volume: 1 },
    sedan: { idle: 38, shift: 13, cutoff: 470, harmonic: 2.16, volume: 1.13 },
    van: { idle: 40, shift: 60, cutoff: 970, harmonic: 4.05, volume: .47, electric: true },
    suv: { idle: 34, shift: 11, cutoff: 420, harmonic: 2.49, volume: 1.21 },
    pickup: { idle: 31, shift: 14, cutoff: 385, harmonic: 1.97, volume: 1.28 },
    coupe: { idle: 55, shift: 15, cutoff: 865, harmonic: 2.82, volume: 1.13 },
    taxi: { idle: 42, shift: 12, cutoff: 516, harmonic: 2.07, volume: 1.16 },
    wagon: { idle: 46, shift: 10.4, cutoff: 492, harmonic: 2.25, volume: 1.04 },
    towtruck: { idle: 33, shift: 26, cutoff: 755, harmonic: 4.34, volume: .77, electric: true },
    utility: { idle: 28, shift: 8.8, cutoff: 380, harmonic: 2.07, volume: 1.31 }
};
const tyreFrequencies = { snow: 570, slush: 960, wet: 1310, ice: 2410, metal: 980 };
function driveSound(road, speed) {
    const tuning = engineTuning[road?.kind ?? 'hatch'] ?? engineTuning.hatch;
    const throttle = cap(road?.accelerator ?? 0), load = cap(road?.load ?? 0);
    const seal = cap(road?.enclosure ?? (road?.interior ? .91 : 0));
    const gear = Math.floor(Math.max(0, speed - 1) / tuning.shift);
    const rpm = tuning.electric ? cap(speed / (tuning.shift * .6)) : cap(.12 + speed / (gear + 1) / tuning.shift);
    const braking = tuning.electric ? (1 - throttle) * cap(speed / 7) : 0;
    const fundamental = tuning.idle + (tuning.electric ? 125 : 96) * rpm + throttle * (27 - 10 * load);
    const tyreHz = tyreFrequencies[road?.surface] ?? 920;
    const slip = cap(road?.slip ?? 0) * cap(speed / 7);
    const tyreGain = road ? cap(speed * .005 + slip * .21, .205) * (1 - .48 * seal) : 0;
    const cyclical = road?.punctures ? cap(speed / 12) * .046 : 0;
    return { fundamental, harmonic: fundamental * tuning.harmonic * (1 + .13 * throttle + .15 * braking),
        cutoff: (tuning.cutoff + 538 * throttle + 215 * braking) * (1 - .38 * seal),
        gain: (.044 + cap(speed * .006, .108) + throttle * (.069 + load * .038) + braking * .029) * tuning.volume * (1 - .30 * seal),
        tyreHz: (tyreHz + slip * 980) * (1 - .30 * seal), tyreGain, cyclical, seal };
}
const common = { noise: .082, filter: 415, drone: 73.4, low: .014 };
const profiles = {
    'Канальные гаражи': { noise: .13, filter: 760, drone: 49, low: .019 },
    'Рынок «Спектр»': { noise: .063, filter: 580, drone: 109.8, low: .021 },
    'Литейный квартал': { noise: .095, filter: 438, drone: 54.7, low: .036 },
    'Северная ТЭЦ': { noise: .104, filter: 541, drone: 54.7, low: .041 },
    'Старый карьер': { noise: .127, filter: 443, drone: 54.7, low: .047 },
    'Сухой док': { noise: .133, filter: 770, drone: 39.3, low: .032 },
    'Белая плотина': { noise: .135, filter: 625, drone: 48.2, low: .049 },
    'Западный терминал': { noise: .074, filter: 420, drone: 64.2, low: .030 },
    'Лесная промзона': { noise: .124, filter: 370, drone: 61.6, low: .023 },
    'Северный посёлок': { noise: .053, filter: 510, drone: 112.4, low: .024 }
};
function streetSound(district, weather) {
    const profile = profiles[district] ?? common;
    const snow = cap(weather?.snow ?? 0), rain = cap(weather?.rain ?? 0), wind = cap(weather?.wind ?? 0);
    return { noise: (profile.noise + wind * .118 + rain * .075) * (1 - .36 * snow),
        filter: (profile.filter + rain * 510 + wind * 285) * (1 - .39 * snow),
        drone: profile.drone, low: profile.low };
}
