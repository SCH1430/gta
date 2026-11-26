"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameTrial = exports.trialStops = void 0;
const night_benchmark_js_1 = require("./night-benchmark.js");
exports.trialStops = [
    { name: 'Канальные гаражи', seconds: 7, eye: [-35, 2.8, 44], end: [-23, 2.3, 34], look: [-49, 2.1, 42] },
    { name: 'Рынок «Спектр»', seconds: 9, eye: [14, 3.5, 36], end: [40, 2.3, 31], look: [31, 2.2, 19] },
    { name: 'Портовый мост', seconds: 11, eye: [44, 2.9, 54], end: [44, 3.3, 94], look: [46, 3, 111] },
    { name: 'Двор дома № 23', seconds: 6, eye: [-24, 2.3, 27], end: [-34, 1.9, 18], look: [-34.95, 1.8, 15.8] },
    { name: 'Квартира № 7', seconds: 7, eye: [4.35, 4.55, -2.4], end: [4.20, 4.66, 1.7], look: [3, 4.55, 4.9] }
];
const lap = exports.trialStops.reduce((s, t) => s + t.seconds, 0);
const sample = () => ({ frames: 0, ms: 0, late: 0 });
function add(s, ms) {
    s.frames++;
    s.ms += ms;
    if (ms > 33.34)
        s.late++;
}
function numbers(s) { return { fps: s.ms ? +(s.frames * 1000 / s.ms).toFixed(1) : 0, slow: s.frames ? +(s.late * 100 / s.frames).toFixed(1) : 0, frames: s.frames }; }
class FrameTrial {
    long;
    mode;
    seconds = 0;
    segments;
    stops;
    lap;
    visibilityFrames = 0;
    visibilityTotal = 0;
    first = sample();
    last = sample();
    total = sample();
    drawMillis = 0;
    constructor(long, mode = 'district') {
        this.long = long;
        this.mode = mode;
        this.stops = mode === 'chase' ? night_benchmark_js_1.chaseTrialStops : mode === 'quarter' ?
            [exports.trialStops[0],exports.trialStops[3],exports.trialStops[1]].map(s=>({...s,seconds:5})) : exports.trialStops;
        this.lap = mode === 'chase' ? night_benchmark_js_1.chaseDuration : this.stops.reduce((sum,s)=>sum+s.seconds,0);
        this.segments = this.stops.map(() => sample());
    }
    get duration() { return this.long ? 900 : this.lap; }
    get done() { return this.seconds >= this.duration; }
    get stage() {
        let phase = this.seconds % this.lap;
        for (let i = 0; i < this.stops.length; i++) {
            const s = this.stops[i];
            if (phase < s.seconds)
                return { index: i, s, t: phase / s.seconds, indoor: i === 4 };
            phase -= s.seconds;
        }
        return { index: 0, s: this.stops[0], t: 0, indoor: false };
    }
    record(ms, renderMs = 0, visibility) {
        if (!Number.isFinite(ms) || ms <= 0 || this.done)
            return;
        if (Number.isFinite(visibility)) {
            this.visibilityFrames++;
            this.visibilityTotal += Math.max(0, Math.min(1, visibility));
        }
        this.drawMillis += Number.isFinite(renderMs) ? renderMs : 0;
        const stage = this.stage;
        add(this.total, ms);
        add(this.segments[stage.index], ms);
        if (this.seconds < 60)
            add(this.first, ms);
        if (this.seconds >= this.duration - 60)
            add(this.last, ms);
        this.seconds += ms / 1000;
    }
    report(renderer) {
        const parts = this.segments.map((s, i) => ({ name: this.stops[i].name, ...numbers(s) }));
        return { at: Date.now(), long: this.long, mode: this.mode, roadVisible: this.visibilityFrames ? +(100 * this.visibilityTotal / this.visibilityFrames).toFixed(1) : undefined, renderer, elapsed: Math.round(this.seconds), ...numbers(this.total), drawMs: +(this.drawMillis / Math.max(1, this.total.frames)).toFixed(1),
            worst: parts.filter(v => v.frames).sort((a, b) => a.fps - b.fps)[0]?.name ?? '', parts, first: numbers(this.first), last: numbers(this.last) };
    }
}
exports.FrameTrial = FrameTrial;
