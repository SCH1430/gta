"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleRattleRate = void 0;
exports.vehicleWave = vehicleWave;
exports.vehicleAudioFrame = vehicleAudioFrame;
exports.vehicleRattleSample = vehicleRattleSample;
exports.createVehicleAudio = createVehicleAudio;
const street_audio_js_1 = require("./street-audio.js");
const clamp = (n, max = 1) => Math.max(0, Math.min(max, n));
const motors = {
    hatch: { wave: [1, .46, .36, .21, .16, .065, .053], engine: 1.04, detail: .35, isolation: .87, body: 96, trim: .78, pitch: 1.08 },
    sedan: { wave: [1, .35, .14, .055, .029], engine: .92, detail: .19, isolation: .57, body: 73, trim: .21, pitch: .83 },
    van: { wave: [1, .045, .12, .034, .025], engine: .64, detail: .68, isolation: .81, body: 109, trim: .29, electric: true },
    suv: { wave: [1, .51, .24, .16, .14], engine: 1.03, detail: .22, isolation: .67, body: 78, trim: .26 },
    pickup: { wave: [1, .62, .4, .22, .12], engine: 1.18, detail: .25, isolation: .84, body: 60, trim: .62 },
    coupe: { wave: [1, .39, .48, .19, .23, .11, .095], engine: 1.1, detail: .35, isolation: .82, body: 111, trim: .27 },
    taxi: { wave: [1, .43, .19, .14, .057], engine: .92, detail: .22, isolation: .63, body: 84, trim: .39 },
    wagon: { wave: [1, .36, .19, .13, .058], engine: 1.02, detail: .24, isolation: .75, body: 87, trim: .53 },
    towtruck: { wave: [1, .075, .20, .036, .054], engine: .77, detail: .52, isolation: .87, body: 92, trim: .49, electric: true },
    utility: { wave: [1, .67, .46, .12, .21, .072], engine: 1.15, detail: .21, isolation: .95, body: 61, trim: .60 }
};
function vehicleWave(kind) { return motors[kind].wave; }
function vehicleAudioFrame(road, speed) {
    const velocity = Math.abs(speed);
    const frame = (0, street_audio_js_1.driveSound)(road, velocity), tone = motors[road?.kind ?? 'hatch'];
    const pedal = clamp(road?.accelerator ?? 0), load = clamp(road?.load ?? 0), turn = Math.abs(road?.turn ?? 0);
    const left = clamp(road?.wearLeft ?? 0), right = clamp(road?.wearRight ?? 0), damage = Math.max(left, right);
    const shock = clamp(road?.shock ?? 0), motion = clamp((velocity - .15) / 12), scale = 1 - frame.seal * (1 - tone.isolation);
    const ragged = clamp(turn * .42 + (road?.slip ?? 0) * .34 + shock);
    const charge = pedal * (.58 + .42 * load);
    const electricPull = tone.electric ? clamp(velocity / 17 + pedal * .52) : 0;
    const pitch = tone.electric ? 121 + electricPull * 155 + 19 * charge : frame.fundamental * (tone.pitch ?? 1);
    const detail = tone.electric ? 389 + electricPull * 480 + 370 * charge + (1 - pedal) * clamp(velocity / 18) * 116 :
        frame.harmonic * (tone.pitch ?? 1) * (1 + (damage * .018 + load * .019) * pedal);
    const loaded = road?.cargo !== undefined && road.cargo !== 'empty';
    const cargo = loaded ? clamp(load * 3.0 + .20) : 0;
    return { ...frame, pitch, detail, body: tone.body + frame.fundamental * .25,
        engineLevel: frame.gain * tone.engine * scale,
        detailLevel: tone.detail * (tone.electric ? .35 + pedal * .54 + motion * .10 : .63 + pedal * .39),
        bodyLevel: (tone.electric ? .13 : .24) * (.24 + load * .48 + frame.seal * .28),
        engineFilter: tone.electric ? frame.cutoff + 390 + 480 * charge : frame.cutoff,
        trimLevel: tone.trim * motion * (.034 + ragged * .115), cargoLevel: cargo * motion * (.060 + ragged * .38),
        damageLevel: damage > .10 ? damage * motion * (.12 + ragged * .31) : 0,
        damagePan: (right - left) * .72, shock,
        treadIce: road?.surface === 'ice' ? motion * (.25 + clamp(road.slip) * .75) : 0
    };
}
const rattlePresets = {
    trim: { duration: .17, body: 255, edge: 1369, noise: .40, decay: 58, delays: [0, .031, .082] },
    'wood-crate': { duration: .206, body: 137, edge: 557, noise: .52, decay: 34, delays: [0, .063] },
    toolbox: { duration: .236, body: 198, edge: 1837, noise: .59, decay: 36, delays: [0, .024, .071, .14] },
    'damaged-panel': { duration: .28, body: 178, edge: 1103, noise: .63, decay: 29, delays: [0, .035, .096, .164] },
    'tread-ice': { duration: .13, body: 73, edge: 2151, noise: .91, decay: 42, delays: [0, .014, .033, .052] }
};
exports.vehicleRattleRate = 24000;
function vehicleRattleSample(kind) {
    const preset = rattlePresets[kind];
    const data = new Float32Array(Math.ceil(preset.duration * exports.vehicleRattleRate));
    let seed = preset.body + 1533, low = 0, mid = 0;
    for (let i = 0; i < data.length; i++) {
        const t = i / exports.vehicleRattleRate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        low += .12 * (noise - low);
        mid += .51 * (noise - mid);
        let impulse = 0;
        for (const [index, delay] of preset.delays.entries()) {
            const age = t - delay;
            if (age <= 0)
                continue;
            const edge = Math.sin(age * Math.PI * 2 * preset.edge * (1 - index * .055)) * Math.exp(-age * 68);
            const knock = Math.sin(age * Math.PI * 2 * preset.body * (1 - index * .051)) * (kind === 'tread-ice' ? .05 : .34);
            const grain = kind === 'tread-ice' ? (noise - mid) * Math.max(0, noise + .43) * 1.6 : noise - mid + low * .30;
            const envelope = Math.min(1, age * 1400) * Math.exp(-age * preset.decay) / (1 + index * .41);
            impulse += (knock + edge * .21 + grain * preset.noise) * envelope;
        }
        data[i] = Math.max(-.87, Math.min(.87, impulse)) * Math.min(1, (data.length - i) / 240);
    }
    return data;
}
function createVehicleAudio(ctx, destination) {
    const output = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const engine = ctx.createGain(), harmonics = ctx.createGain(), body = ctx.createGain();
    const motor = ctx.createOscillator(), detail = ctx.createOscillator(), shell = ctx.createOscillator();
    filter.type = 'lowpass';
    filter.frequency.value = 680;
    for (const gain of [engine, harmonics, body])
        gain.gain.value = 0;
    motor.connect(engine).connect(filter);
    detail.type = 'sine';
    detail.connect(harmonics).connect(filter);
    shell.type = 'triangle';
    shell.connect(body).connect(filter);
    filter.connect(output).connect(destination);
    for (const oscillator of [motor, detail, shell])
        oscillator.start();
    const waves = new Map();
    const samples = new Map();
    let current, split = 0, nextTrim = 0, nextDamage = 0, nextCargo = 0, nextIce = 0;
    function play(kind, level, pan, at) {
        let sample = samples.get(kind);
        if (!sample) {
            const wave = vehicleRattleSample(kind);
            sample = ctx.createBuffer(1, wave.length, exports.vehicleRattleRate);
            sample.getChannelData(0).set(wave);
            samples.set(kind, sample);
        }
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const position = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
        gain.gain.value = level;
        gain.connect(output);
        if (position) {
            position.pan.value = pan;
            source.connect(position).connect(gain);
        }
        else
            source.connect(gain);
        source.buffer = sample;
        source.playbackRate.value = .92 + (split++ % 5) * .041;
        source.onended = () => { source.disconnect(); position?.disconnect(); gain.disconnect(); };
        source.start(at);
    }
    return {
        output,
        update(road, frame, speed, train, duck, lift, at) {
            const kind = road?.kind;
            if (kind !== current) {
                current = kind;
                if (kind) {
                    let wave = waves.get(kind);
                    if (!wave) {
                        const parts = vehicleWave(kind);
                        wave = ctx.createPeriodicWave(new Float32Array(parts.length + 1), Float32Array.from([0, ...parts]));
                        waves.set(kind, wave);
                    }
                    motor.setPeriodicWave(wave);
                }
                else
                    motor.type = 'triangle';
                nextTrim = nextDamage = nextCargo = nextIce = at + .13;
            }
            const drive = road ? frame.engineLevel + lift : train ? .044 : 0;
            engine.gain.setTargetAtTime(drive * duck, at, .092);
            harmonics.gain.setTargetAtTime(road ? drive * frame.detailLevel * duck : 0, at, .11);
            body.gain.setTargetAtTime(road ? drive * frame.bodyLevel * duck : 0, at, .11);
            motor.frequency.setTargetAtTime(train ? 62 + speed * 2 : frame.pitch, at, .10);
            detail.frequency.setTargetAtTime(frame.detail, at, .115);
            shell.frequency.setTargetAtTime(frame.body, at, .12);
            filter.frequency.setTargetAtTime(frame.engineFilter, at, .155);
            if (!road)
                return;
            if (frame.trimLevel > .021 && at >= nextTrim) {
                nextTrim = at + .53 + (split % 4) * .085;
                play('trim', frame.trimLevel * duck, -.25, at);
            }
            if (frame.cargoLevel > .027 && at >= nextCargo) {
                nextCargo = at + .53 + (split % 3) * .11 - frame.shock * .24;
                play(road.cargo === 'tools' ? 'toolbox' : 'wood-crate', frame.cargoLevel * duck, .14, at);
            }
            if (frame.damageLevel > .012 && at >= nextDamage) {
                nextDamage = at + .46 + (split % 4) * .085 - frame.shock * .19;
                play('damaged-panel', frame.damageLevel * duck, frame.damagePan, at);
            }
            if (frame.treadIce > .035 && at >= nextIce) {
                nextIce = at + .50 - frame.treadIce * .29 + (split % 3) * .05;
                play('tread-ice', frame.treadIce * .19 * (1 - frame.seal * .41) * duck, split % 2 ? .43 : -.43, at);
            }
        },
        dispose() {
            for (const oscillator of [motor, detail, shell]) {
                oscillator.stop();
                oscillator.disconnect();
            }
            for (const node of [engine, harmonics, body, filter, output])
                node.disconnect();
            samples.clear();
            waves.clear();
        }
    };
}
