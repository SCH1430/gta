"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDirectionalAudio = createDirectionalAudio;
function speaker(ctx, bus) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const local = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    if (local) {
        gain.connect(local);
        local.connect(bus);
    }
    else
        gain.connect(bus);
    return { gain, pan: local?.pan };
}
function harmonic(ctx, destination, hz, type, level) {
    const shape = ctx.createOscillator(), gain = ctx.createGain();
    shape.type = type;
    shape.frequency.value = hz;
    gain.gain.value = level;
    shape.connect(gain);
    gain.connect(destination);
    shape.start();
    return shape;
}
function createDirectionalAudio(ctx, bus) {
    const generator = speaker(ctx, bus), relay = speaker(ctx, bus), tram = speaker(ctx, bus);
    const motor = harmonic(ctx, generator.gain, 53, 'triangle', .69);
    const motorWhine = harmonic(ctx, generator.gain, 181, 'sawtooth', .19);
    const strike = (destination, time, pitch, decay, level) => {
        const bell = ctx.createOscillator(), gain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.value = pitch;
        bell.connect(gain);
        gain.connect(destination);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(level, time + .007);
        gain.gain.exponentialRampToValueAtTime(.0001, time + decay);
        bell.start(time);
        bell.stop(time + decay + .025);
        bell.onended = () => { bell.disconnect(); gain.disconnect(); };
    };
    let relayAt = 0, tramAt = 0;
    const locate = (next, unit, at, level) => {
        unit.gain.gain.setTargetAtTime((next?.strength ?? 0) * level, at, .12);
        unit.pan?.setTargetAtTime((next?.pan ?? 0) * .92, at, .14);
    };
    return (directions, at, duck) => {
        const source = (kind) => directions.find(p => p.kind === kind);
        const starter = source('generator'), relayCue = source('relay'), tramCue = source('tram');
        const struggle = .50 + .50 * Math.sin(at * 12.3) * Math.sin(at * 4.3);
        const urgency = Math.max(0, Math.sin(at * 3.6)) ** 1.6;
        const level = duck ? .51 : 1;
        locate(starter, generator, at, level * (.10 + .15 * urgency + .046 * struggle));
        motor.frequency.setTargetAtTime(53 + 9 * struggle, at, .15);
        motorWhine.frequency.setTargetAtTime(163 + 49 * urgency, at, .10);
        locate(relayCue, relay, at, level * .35);
        locate(tramCue, tram, at, level * .32);
        if ((relayCue?.strength ?? 0) > .027 && at >= relayAt) {
            relayAt = at + 3.25;
            for (const offset of [.055, .31]) {
                strike(relay.gain, at + offset, 1247, .54, .53);
                strike(relay.gain, at + offset + .012, 1865, .39, .21);
            }
        }
        if ((tramCue?.strength ?? 0) > .029 && at >= tramAt) {
            tramAt = at + 5.1;
            strike(tram.gain, at + .075, 860, .8, .47);
            strike(tram.gain, at + .09, 1351, .59, .23);
        }
    };
}
