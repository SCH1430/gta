"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.landmarkSoundField = landmarkSoundField;
exports.landmarkTransient = landmarkTransient;
exports.playTramBell = playTramBell;
exports.createLocalSoundscape = createLocalSoundscape;
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const sources = [
    { key: 'substation-depot', kind: 'substation', x: 26.4, z: -34.2, range: 49, gain: .87, period: 1, offset: 0, length: 1 },
    { key: 'shutter-market-west', kind: 'shutter', x: 35.5, z: 20.5, range: 28, gain: .76, period: 6.3, offset: 1.05, length: .92 },
    { key: 'shutter-market-east', kind: 'shutter', x: 59, z: 20.8, range: 31, gain: .70, period: 7.1, offset: 3.7, length: .92 },
    { key: 'ice-garages', kind: 'ice', x: -46, z: world_expansion_layout_js_1.canal.north + 3.2, range: 34, gain: .67, period: 8.1, offset: 2.8, length: 1.00 },
    { key: 'ice-bridge', kind: 'ice', x: 30, z: world_expansion_layout_js_1.canal.north + 5.8, range: 38, gain: .66, period: 8.6, offset: 7.4, length: 1.00 },
    { key: 'ice-port', kind: 'ice', x: 72, z: world_expansion_layout_js_1.canal.south - 5, range: 32, gain: .63, period: 9.4, offset: 5.1, length: 1.00 },
];
const clamp = (value) => Math.max(0, Math.min(1, value));
function landmarkSoundField(listener, elapsed, weather, blackout = 0) {
    const audible = [];
    const co = Math.cos(listener.yaw), si = Math.sin(listener.yaw);
    for (const source of sources) {
        const dx = source.x - listener.x, dz = source.z - listener.z, distance = Math.hypot(dx, dz);
        if (distance >= source.range)
            continue;
        const side = dx * co - dz * si, ahead = -dx * si - dz * co;
        const bearing = distance < .05 ? 0 : Math.atan2(side, ahead);
        const rear = Math.cos(bearing) < -.35;
        const wind = weather?.wind ?? .28, snow = weather?.snow ?? 0;
        const material = source.kind === 'substation' ? 1 - .92 * clamp(blackout) :
            source.kind === 'shutter' ? .52 + .80 * wind : .54 + .46 * clamp((3 - (weather?.temperature ?? -2)) / 8);
        const strength = clamp(source.gain * ((1 - distance / source.range) ** 1.36) * material * (1 - .24 * snow) * (rear ? .84 : 1));
        if (strength < .012)
            continue;
        const time = Math.max(0, elapsed) + source.offset, cycle = Math.floor(time / source.period);
        audible.push({ kind: source.kind, key: source.key, bearing, pan: Math.sin(bearing), distance, rear, strength, cycle,
            active: time - cycle * source.period < source.length });
    }
    return audible;
}
const sampleRate = 22050;
const shutterStrikes = [0, .10, .147, .280, .411, .460], iceStrikes = [0, .066, .191, .310];
function landmarkTransient(kind) {
    const data = new Float32Array(Math.round(sampleRate * (kind === 'shutter' ? .70 : .79)));
    let seed = kind === 'shutter' ? 2805 : 1409, low = 0, mid = 0;
    for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const white = seed / 2147483648 - 1, t = i / sampleRate;
        low += .045 * (white - low);
        mid += .25 * (white - mid);
        if (kind === 'shutter') {
            const shiver = shutterStrikes.reduce((sum, at, index) => {
                const dt = t - at;
                return dt < 0 ? sum : sum + Math.min(1, dt * 360) * Math.exp(-dt * (21 + index * 2));
            }, 0);
            const hollow = Math.sin(t * 1323) + .52 * Math.sin(t * 3172) + .31 * Math.sin(t * 5259);
            data[i] = shiver * (.13 * hollow + .29 * (mid - low) + .12 * (white - mid));
        }
        else {
            const split = iceStrikes.reduce((sum, at, index) => {
                const dt = t - at;
                return dt < 0 ? sum : sum + (1 - index * .18) * Math.min(1, dt * 480) * Math.exp(-dt * 35);
            }, 0);
            const crack = .39 * (white - mid) + .16 * mid;
            const stress = .42 * Math.sin((248 * t + 120 * (1 - Math.exp(-t * 7)) / 7) * Math.PI * 2);
            data[i] = split * crack + stress * Math.min(1, t * 120) * Math.exp(-t * 8.5) * (.33 + 1.42 * Math.abs(low));
        }
        data[i] *= Math.min(1, (data.length - i) / 380);
    }
    return data;
}
function playTramBell(ctx, bus, position, strength) {
    const partials = [[860, .52, .37], [1387, .44, .21], [2168, .32, .11], [2771, .26, .055]];
    const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
    if (pan) {
        pan.pan.value = Math.max(-.96, Math.min(.96, position));
        pan.connect(bus);
    }
    let remaining = partials.length;
    for (const [hz, decay, volume] of partials) {
        const bell = ctx.createOscillator(), gain = ctx.createGain(), at = ctx.currentTime;
        bell.frequency.value = hz;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * clamp(strength)), at + .006);
        gain.gain.exponentialRampToValueAtTime(.0001, at + decay);
        bell.connect(gain).connect(pan ?? bus);
        bell.start(at);
        bell.stop(at + decay + .02);
        bell.onended = () => {
            bell.disconnect();
            gain.disconnect();
            if (--remaining === 0)
                pan?.disconnect();
        };
    }
}
function createLocalSoundscape(ctx, bus) {
    const hum = ctx.createGain();
    hum.gain.value = 0;
    const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
    if (pan)
        hum.connect(pan).connect(bus);
    else
        hum.connect(bus);
    for (const [hz, level, form] of [[50, .56, 'sine'], [100, .30, 'triangle'], [315, .16, 'sine']]) {
        const motor = ctx.createOscillator(), mix = ctx.createGain();
        motor.type = form;
        motor.frequency.value = hz;
        mix.gain.value = level;
        motor.connect(mix).connect(hum);
        motor.start();
    }
    const buffers = new Map(), played = new Map();
    return (marks, at, duck) => {
        const loudness = duck ? .42 : 1;
        const power = marks.find(mark => mark.kind === 'substation');
        hum.gain.setTargetAtTime((power?.strength ?? 0) * (.16 + .020 * Math.sin(at * 3.1)) * loudness, at, .18);
        pan?.pan.setTargetAtTime((power?.pan ?? 0) * .89, at, .18);
        for (const mark of marks) {
            if (mark.kind === 'substation' || !mark.active || mark.strength < .044 || played.get(mark.key) === mark.cycle)
                continue;
            played.set(mark.key, mark.cycle);
            let sound = buffers.get(mark.kind);
            if (!sound) {
                const sample = landmarkTransient(mark.kind);
                sound = ctx.createBuffer(1, sample.length, sampleRate);
                sound.getChannelData(0).set(sample);
                buffers.set(mark.kind, sound);
            }
            const hit = ctx.createBufferSource(), level = ctx.createGain();
            const side = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
            hit.buffer = sound;
            hit.playbackRate.value = .93 + (mark.cycle % 4) * .047;
            level.gain.value = mark.strength * (mark.kind === 'ice' ? .45 : .41) * loudness;
            if (side) {
                side.pan.value = mark.pan * .92;
                hit.connect(side).connect(level);
            }
            else
                hit.connect(level);
            level.connect(bus);
            hit.onended = () => { hit.disconnect(); side?.disconnect(); level.disconnect(); };
            hit.start();
        }
    };
}
