"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundCaptions = void 0;
const blackout_js_1 = require("./blackout.js");
const momentary = {
    impact: { text: 'Столкновение', priority: 5, range: 31, hold: 2.75, cooldown: 1.9 },
    glass: { text: 'Удар и звон стекла', priority: 6, range: 32, hold: 3, cooldown: 2.2 },
    fixture: { text: 'Падение опоры', priority: 6, range: 34, hold: 3, cooldown: 2.2 },
    bell: { text: 'Звонок трамвая', priority: 4, range: 37, hold: 2.9, cooldown: 1.8 },
    crossing: { text: 'Предупреждение у переезда', priority: 5, range: 35, hold: 3.1, cooldown: 7.5 },
    siren: { text: 'Сирена патруля', priority: 3, range: 42, hold: 3, cooldown: 8 },
    warning: { text: 'Предупредительный сигнал', priority: 2, range: 18, hold: 2.6, cooldown: 3.5 }
};
const landmarkName = { substation: 'Гул подстанции', shutter: 'Дребезг роллеты', ice: 'Треск льда' };
const audible = .16;
function directional(label, signal, near = 2.6) {
    return { text: label + ' · ' + (0, blackout_js_1.soundDirectionLabel)(signal.bearing, signal.distance, near), bearing: signal.distance < near ? undefined : signal.bearing };
}
function objectiveLine(signal) {
    if (signal.kind === 'generator' && signal.strength > .015)
        return directional('Гул генератора', signal);
    return { text: (0, blackout_js_1.soundCaption)(signal), bearing: signal.distance < 2.6 || signal.strength <= .015 ? undefined : signal.bearing };
}
class SoundCaptions {
    pulses = new Map();
    landmarksSeen = new Map();
    ambientKey = '';
    ambientUntil = 0;
    nextAmbient = 0;
    lastTime = -Infinity;
    reset() {
        this.pulses.clear();
        this.landmarksSeen.clear();
        this.ambientKey = '';
        this.ambientUntil = 0;
        this.nextAmbient = 0;
        this.lastTime = -Infinity;
    }
    pulse(kind, at, source) {
        if (!Number.isFinite(at))
            return;
        if (at < this.lastTime)
            this.reset();
        const previous = this.pulses.get(kind);
        if (previous && at - previous.at < momentary[kind].cooldown) {
            if (source && (kind === 'siren' || kind === 'crossing'))
                previous.source = { x: source.x, z: source.z };
            return;
        }
        this.pulses.set(kind, { at, source: source ? { x: source.x, z: source.z } : undefined });
    }
    lines(time, listener, objective, clues = [], landmarks = []) {
        if (time < this.lastTime)
            this.reset();
        this.lastTime = time;
        const result = objective ? [objectiveLine(objective)] : [];
        let strongest;
        for (const [kind, pulse] of this.pulses) {
            const spec = momentary[kind], age = time - pulse.at;
            if (age > Math.max(spec.cooldown, spec.hold) + .1) {
                this.pulses.delete(kind);
                continue;
            }
            if (age < 0 || age > spec.hold)
                continue;
            const rank = spec.priority - age * .22;
            if (strongest && rank <= strongest.rank)
                continue;
            const where = pulse.source ? (0, blackout_js_1.soundDirection)(kind, listener, pulse.source, spec.range) : undefined;
            if (where && where.distance >= spec.range)
                continue;
            const near = kind === 'impact' || kind === 'glass' || kind === 'fixture' ? .38 : 2.6;
            strongest = { line: where ? directional(spec.text, where, near) : { text: spec.text }, rank };
        }
        if (strongest)
            result.push(strongest.line);
        if (result.length >= 2)
            return result;
        const clue = clues.find(cue => cue !== objective && cue.strength > .20);
        if (clue && !strongest)
            result.push(objectiveLine(clue));
        if (result.length)
            return result;
        for (const [key, seenAt] of this.landmarksSeen)
            if (time - seenAt > 7)
                this.landmarksSeen.delete(key);
        let nearest;
        for (const landmark of landmarks) {
            if (landmark.strength < audible)
                continue;
            const seen = this.landmarksSeen.has(landmark.key);
            if (seen)
                this.landmarksSeen.set(landmark.key, time);
            if (!seen && landmark.active && (!nearest || landmark.strength > nearest.strength))
                nearest = landmark;
        }
        if (nearest && time >= this.nextAmbient) {
            this.ambientKey = nearest.key;
            this.ambientUntil = time + 2.6;
            this.nextAmbient = time + 6;
            this.landmarksSeen.set(nearest.key, time);
        }
        if (time <= this.ambientUntil) {
            const last = landmarks.find(landmark => landmark.key === this.ambientKey && landmark.strength >= audible * .75);
            if (last)
                result.push(directional(landmarkName[last.kind], last));
        }
        return result;
    }
}
exports.SoundCaptions = SoundCaptions;
