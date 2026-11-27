"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteriorAudio = void 0;
exports.entranceRoomMix = entranceRoomMix;
const local_assets_js_1 = require("./local-assets.js");
function entranceRoomMix(room, distance, doorOpen) {
    const near = Math.max(0, 1 - Math.max(0, distance) / 6) ** 2;
    if (near < .02)
        return room;
    const open = Math.max(0, Math.min(1, doorOpen));
    return { ...room, accordion: room.accordion + near * (.22 + .54 * open),
        voices: room.voices + near * (.025 + .63 * open), clarity: .035 + .63 * open,
        toneCutoff: 510 + 4200 * open };
}
const clips = ['flat-neighbours-a', 'flat-neighbours-b', 'flat-neighbours-c'];
class InteriorAudio {
    ctx;
    beat = 0;
    note = 0;
    speechClock = 2;
    clip = 0;
    hour = -1;
    voice;
    speechLevel;
    filter;
    tones;
    pan;
    decoded = new Map();
    live = true;
    constructor(ctx, master) {
        this.ctx = ctx;
        this.speechLevel = ctx.createGain();
        this.speechLevel.gain.value = 0;
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.tones = ctx.createBiquadFilter();
        this.tones.type = 'lowpass';
        this.tones.frequency.value = 11000;
        this.tones.connect(master);
        this.pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
        if (this.pan)
            this.filter.connect(this.speechLevel).connect(this.pan).connect(master);
        else
            this.filter.connect(this.speechLevel).connect(master);
    }
    sound(hz, len, vol, wave = 'triangle', end = hz, delay = 0) {
        if (vol < .0005)
            return;
        const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), g = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(hz, now);
        osc.frequency.exponentialRampToValueAtTime(end, now + len);
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(vol, now + .04);
        g.gain.exponentialRampToValueAtTime(.0001, now + len);
        osc.connect(g).connect(this.tones);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
        osc.start(now);
        osc.stop(now + len + .01);
    }
    async speak(name) {
        if (!this.decoded.has(name))
            this.decoded.set(name, (0, local_assets_js_1.decodeAudioAsset)(this.ctx, 'audio/' + name + '.mp3').catch(() => null));
        const buf = await this.decoded.get(name);
        if (!buf || !this.live || this.voice)
            return;
        const voice = this.ctx.createBufferSource();
        this.voice = voice;
        voice.buffer = buf;
        voice.connect(this.filter);
        voice.onended = () => {
            voice.disconnect();
            if (this.voice === voice)
                this.voice = undefined;
        };
        voice.start();
    }
    update(dt, m) {
        const at = this.ctx.currentTime;
        this.speechLevel.gain.setTargetAtTime((m?.voices ?? 0) * .29, at, .17);
        this.tones.frequency.setTargetAtTime(m?.toneCutoff ?? 11000, at, .17);
        if (!m)
            return;
        this.filter.frequency.setTargetAtTime(480 + 2700 * m.clarity, at, .15);
        this.pan?.pan.setTargetAtTime(Math.max(-.8, Math.min(.8, m.pan)), at, .21);
        if (this.hour >= 0 && m.hour !== this.hour && m.station > .013) {
            this.sound(187, .98, m.station * .045, 'triangle', 178);
            this.sound(283, .76, m.station * .026, 'sine', 274, .12);
        }
        this.hour = m.hour;
        this.speechClock -= dt;
        if (this.speechClock <= 0 && m.voices > .10) {
            void this.speak(clips[this.clip++ % clips.length]);
            this.speechClock = 6.3;
        }
        this.beat -= dt;
        if (this.beat > 0)
            return;
        this.beat = .46;
        const n = this.note++ % 12;
        const tune = [261.6, 329.6, 392, 392, 349.2, 329.6, 293.7, 261.6, 246.9, 293.7, 261.6, 196][n];
        this.sound(tune, .42, m.accordion * .041);
        this.sound(tune * 1.006, .39, m.accordion * .022);
        if (n % 3 === 0)
            this.sound(tune / 2, .55, m.accordion * .033);
        if (n % 2 === 0)
            this.sound([233, 277, 349, 311, 277, 233][n / 2], .49, m.radio * .029, 'sine');
        this.sound(42, .58, m.pump * .042, 'sine');
        this.sound(74, .56, m.lift * .036, 'triangle', 81);
    }
    dispose() { this.live = false; this.voice?.stop(); this.speechLevel.disconnect(); this.filter.disconnect(); this.tones.disconnect(); this.pan?.disconnect(); this.decoded.clear(); }
}
exports.InteriorAudio = InteriorAudio;
