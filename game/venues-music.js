'use strict';

const metalTrack = 'dk-metal-theme';
const metalTitle = 'Литейный вальс';
const beat = .43;
const melody = [
    [0, 62, 1], [1, 65, .75], [2, 69, 1], [3, 72, 1.5], [4.5, 70, .5], [5, 69, 1],
    [6, 67, 1.5], [7.5, 65, .5], [8, 64, 1], [9, 65, 1], [10, 69, 1], [11, 74, 1],
    [12, 72, 1.5], [13.5, 69, .5], [14, 65, 1], [15, 67, 1], [16, 64, 1], [17, 62, 1.7],
];
const chords = [[50, 57, 65], [46, 53, 62], [48, 55, 64], [53, 57, 65], [50, 57, 65], [45, 52, 64]];

function createMetalTheme(context, variant = 'hall') {
    const rate = 22050;
    const buffer = context.createBuffer(1, Math.ceil(19 * beat * rate), rate);
    const samples = buffer.getChannelData(0);
    function note(midi, start, length, level, reed) {
        const frequency = 440 * 2 ** ((midi - 69) / 12);
        const begin = Math.round(start * beat * rate);
        const span = length * beat;
        const end = Math.min(samples.length, begin + Math.ceil((span + .17) * rate));
        for (let i = begin; i < end; i++) {
            const t = (i - begin) / rate;
            const envelope = Math.min(1, t / .038) * Math.exp(-Math.max(0, t - span) * 28);
            const phase = Math.PI * 2 * frequency * t + .17 * Math.sin(t * 31);
            const wave = Math.sin(phase) + (reed ? .31 * Math.sin(phase * 2) + .13 * Math.sin(phase * 3) : .12 * Math.sin(phase * 2));
            samples[i] += level * envelope * wave;
        }
    }
    for (const [start, midi, length] of melody) {
        note(midi, start, length, .19, true);
        if (variant === 'radio' && start >= 9)
            note(midi - (midi === 64 ? 4 : 3), start + .025, length, .057, true);
    }
    chords.forEach(([bass, low, high], bar) => {
        note(bass, bar * 3, .72, .105, false);
        for (const pulse of [1, 2]) {
            note(low, bar * 3 + pulse, .36, .045, false);
            note(high, bar * 3 + pulse, .38, .038, false);
        }
    });
    return buffer;
}

function createRehearsalSound() {
    let playing;
    const buffers = new WeakMap();
    function stop() {
        if (!playing)
            return;
        const { audio, source, level, filter } = playing;
        const now = audio.ctx.currentTime;
        level.gain.setTargetAtTime(0, now, .05);
        source.stop(now + .16);
        source.onended = () => { source.disconnect(); filter.disconnect(); level.disconnect(); };
        playing = undefined;
    }
    return function update(audio, volume, inside) {
        const context = audio?.ctx;
        if (!context || !audio.master || audio.disposed || volume < .005) {
            stop();
            return;
        }
        if (playing && playing.audio !== audio)
            stop();
        if (context.state !== 'running' || audio.paused)
            return;
        if (!playing) {
            if (!buffers.has(context))
                buffers.set(context, createMetalTheme(context));
            const source = context.createBufferSource(), filter = context.createBiquadFilter(), level = context.createGain();
            source.buffer = buffers.get(context);
            source.loop = true;
            filter.type = 'lowpass';
            level.gain.value = 0;
            source.connect(filter).connect(level).connect(audio.mix?.media ?? audio.master);
            source.start();
            playing = { audio, source, filter, level };
        }
        const now = context.currentTime;
        playing.filter.frequency.setTargetAtTime(inside ? 3650 : 690, now, .14);
        playing.level.gain.setTargetAtTime(volume, now, .12);
    };
}

module.exports = { metalTrack, metalTitle, createMetalTheme, createRehearsalSound };
