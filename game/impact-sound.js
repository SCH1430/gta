"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactSampleRate = void 0;
exports.impactLayers = impactLayers;
exports.impactSample = impactSample;
exports.impactSampleRate = 24000;
const duration = { vehicle: .33, metal: .38, glass: .37, snow: .24, concrete: .28, wood: .28, debris: .33 };
const resonance = { vehicle: 74, metal: 149, glass: 371, snow: 43, concrete: 62, wood: 112, debris: 193 };
const limit = (n, min, max) => Math.max(min, Math.min(max, n));
function impactLayers(surface, strength, pan, tangential, glass, seal) {
    const hit = limit(strength, 0, 1), closed = limit(seal, 0, 1), rate = 1.09 - .18 * hit;
    const directional = limit(pan, -1, 1);
    const layers = [];
    function add(kind, gain, delay, width, hz, speed) {
        layers.push({ kind, gain: gain * (1 - closed * .35), delay, pan: limit(directional * width, -1, 1), rate: rate * speed, cutoff: hz * (1 - closed * .62) });
    }
    add(surface, .23 + .67 * hit, 0, 1, 10600, 1);
    if (tangential && surface === 'vehicle')
        add('metal', .27 + .51 * hit, .024, 1.08, 9100, .98);
    if (glass && surface !== 'glass')
        add('glass', .17 + .41 * hit, .042 + .023 * hit, 1.12, 11400, 1.10);
    if (hit > .39 && (surface === 'vehicle' || surface === 'metal' || surface === 'wood' || glass))
        add('debris', .095 + .25 * hit, .115 + .046 * hit, .76, 8800, .93);
    return layers;
}
function impactSample(surface) {
    const data = new Float32Array(Math.ceil(duration[surface] * exports.impactSampleRate));
    const body = resonance[surface];
    let seed = 45679 + body, low = 0, mid = 0, grains = 0;
    for (let i = 0; i < data.length; i++) {
        const t = i / exports.impactSampleRate;
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        low += .027 * (noise - low);
        mid += .28 * (noise - mid);
        const high = noise - mid;
        const strike = Math.min(1, t * 580) * Math.exp(-t * 32);
        const ringing = Math.min(1, t * 240) * Math.exp(-t * 14);
        const shell = Math.sin(Math.PI * 2 * (body * t + 1 - Math.exp(-t * 24)));
        const grit = mid - low;
        let sample;
        switch (surface) {
            case 'snow':
                grains = grains * .962 + (noise > .977 ? .25 : 0);
                sample = strike * (.17 * shell + 1.65 * low + .32 * grains * high);
                break;
            case 'concrete':
                sample = strike * (.42 * shell + 1.20 * low + .48 * grit) + ringing * .11 * grit;
                break;
            case 'wood':
                grains = grains * .935 + (noise > .962 ? .45 : 0);
                sample = strike * (.31 * shell + .54 * grit) + ringing * grains * .58 * high;
                break;
            case 'metal': {
                const rasp = (.58 + .42 * Math.sin(t * 153)) * Math.min(1, t * 78) * Math.exp(-t * 10);
                const partials = Math.sin(t * 1834) + .58 * Math.sin(t * 2410) + .38 * Math.sin(t * 4540);
                sample = .24 * shell * strike + rasp * (.47 * grit + .23 * high + .048 * partials);
                break;
            }
            case 'glass': {
                grains = grains * .984 + (noise > .986 ? .58 : 0);
                const chips = .060 * Math.sin(t * 17512) + .052 * Math.sin(t * 23137) + .043 * Math.sin(t * 33139);
                sample = (.66 * grains * high + chips) * ringing + .18 * high * strike;
                break;
            }
            case 'debris': {
                sample = 0;
                for (const [index, delay] of [0, .038, .083, .136, .199].entries()) {
                    const age = t - delay;
                    if (age <= 0)
                        continue;
                    const envelope = Math.min(1, age * 1320) * Math.exp(-age * (44 + index * 12)) / (1 + index * .52);
                    const tick = Math.sin(age * Math.PI * 2 * (807 + 217 * index)) * .23;
                    const knock = Math.sin(age * Math.PI * 2 * (130 + 37 * index)) * .16;
                    sample += (tick + knock + high * .48) * envelope;
                }
                break;
            }
            case 'vehicle':
                sample = strike * (.39 * shell + .91 * low + .32 * grit) + .12 * ringing * (grit + Math.sin(t * 729));
                break;
        }
        data[i] = Math.max(-1, Math.min(1, sample)) * Math.min(1, (data.length - i) / 240);
    }
    return data;
}
