"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soundProfiles = exports.soundProfileNames = void 0;
exports.isSoundProfile = isSoundProfile;
exports.createSoundMix = createSoundMix;
exports.soundProfileNames = { headphones: 'Наушники', speaker: 'Динамик телефона', night: 'Ночной' };
exports.soundProfiles = Object.keys(exports.soundProfileNames);
function isSoundProfile(value) {
    return typeof value === 'string' && Object.hasOwn(exports.soundProfileNames, value);
}
const presets = {
    headphones: { bass: 0, presence: .35, treble: -.45, threshold: -8, knee: 9, ratio: 5, voice: 1, world: 1, media: 1, output: 1 },
    speaker: { bass: -8.5, presence: 2.1, treble: -1.25, threshold: -12, knee: 13, ratio: 5.5, voice: 1.08, world: .90, media: .91, output: .92 },
    night: { bass: -6, presence: 1.45, treble: -2.7, threshold: -22, knee: 18, ratio: 9, voice: 1.22, world: .71, media: .59, output: .60 },
};
function createSoundMix(ctx, profile, volume) {
    const master = ctx.createGain();
    master.gain.value = volume;
    const bass = ctx.createBiquadFilter(), presence = ctx.createBiquadFilter(), treble = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 187;
    presence.type = 'peaking';
    presence.frequency.value = 2300;
    presence.Q.value = .83;
    treble.type = 'highshelf';
    treble.frequency.value = 5450;
    const limiter = ctx.createDynamicsCompressor(), output = ctx.createGain();
    limiter.attack.value = .006;
    limiter.release.value = .22;
    master.connect(bass).connect(presence).connect(treble).connect(limiter).connect(output).connect(ctx.destination);
    const world = ctx.createGain(), media = ctx.createGain(), voice = ctx.createGain();
    for (const bus of [world, media, voice])
        bus.connect(master);
    let current = profile, priority = 0;
    function sync(smooth) {
        const p = presets[current], now = ctx.currentTime;
        const apply = (param, value, time = .06) => {
            if (smooth)
                param.setTargetAtTime(value, now, time);
            else
                param.value = value;
        };
        apply(bass.gain, p.bass);
        apply(presence.gain, p.presence);
        apply(treble.gain, p.treble);
        apply(limiter.threshold, p.threshold);
        apply(limiter.knee, p.knee);
        apply(limiter.ratio, p.ratio);
        apply(output.gain, p.output);
        apply(voice.gain, p.voice);
        const release = priority === 0 ? .26 : .035;
        apply(world.gain, p.world * (1 - .31 * priority), release);
        apply(media.gain, p.media * (1 - .44 * priority), release);
    }
    sync(false);
    return { master, world, media, voice,
        setProfile(next) {
            if (next !== current) {
                current = next;
                sync(true);
            }
        },
        setVoice(level) {
            const next = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
            if (next !== priority) {
                priority = next;
                sync(true);
            }
        }
    };
}
