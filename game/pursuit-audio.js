"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pursuitScoreMix = pursuitScoreMix;
exports.createPursuitAudio = createPursuitAudio;
function pursuitScoreMix(phase, wanted, speaking) {
    const level = Math.max(0, Math.min(3, wanted));
    const duck = speaking ? .62 : 1;
    if (!level || phase === 'clear')
        return { bed: 0, pulse: 0, cutoff: 470 };
    if (phase === 'search')
        return { bed: (.022 + .007 * level) * duck, pulse: 0, cutoff: 470 };
    if (phase === 'uncertain')
        return { bed: (.095 + .018 * level) * duck, pulse: 0, cutoff: 1500 };
    return { bed: (.168 + .025 * level) * duck, pulse: (.16 + .049 * level) * duck, cutoff: 6800 };
}
function createPursuitAudio(ctx, output, load) {
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 470;
    lowPass.connect(output);
    const bed = ctx.createGain(), pulse = ctx.createGain();
    bed.gain.value = pulse.gain.value = 0;
    bed.connect(lowPass);
    pulse.connect(output);
    const sources = [];
    let audible = false, loading = false, disposed = false, nextAttempt = 0, stopAt = 0;
    let previous = pursuitScoreMix('clear', 0, false);
    function stop() {
        for (const source of sources) {
            source.stop();
            source.disconnect();
        }
        sources.length = 0;
    }
    async function start() {
        loading = true;
        try {
            const [base, rhythm] = await Promise.all([
                load('night-pursuit'),
                load('night-pursuit-pulse').catch(() => undefined)
            ]);
            if (!audible || disposed)
                return;
            const loopEnd = Math.min(base.duration, rhythm?.duration ?? base.duration, 32 * 60 / 108);
            const when = ctx.currentTime + .015;
            function loop(buffer, destination) {
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;
                source.loopEnd = loopEnd;
                source.connect(destination);
                source.start(when);
                sources.push(source);
            }
            loop(base, bed);
            if (rhythm)
                loop(rhythm, pulse);
        }
        catch {
            stop();
        }
        finally {
            loading = false;
        }
    }
    return {
        update(phase, wanted, speaking, at) {
            if (disposed)
                return;
            const mix = pursuitScoreMix(phase, wanted, speaking);
            audible = mix.bed > 0;
            if (mix.bed !== previous.bed)
                bed.gain.setTargetAtTime(mix.bed, at, speaking ? .065 : .21);
            if (mix.pulse !== previous.pulse) {
                const fade = mix.pulse > previous.pulse ? .20 : .12;
                pulse.gain.setTargetAtTime(mix.pulse, at, speaking ? .06 : fade);
            }
            if (mix.cutoff !== previous.cutoff)
                lowPass.frequency.setTargetAtTime(mix.cutoff, at, .27);
            previous = mix;
            if (audible) {
                stopAt = at + 1.35;
                if (!sources.length && !loading && at >= nextAttempt) {
                    nextAttempt = at + 3;
                    void start();
                }
            }
            else if (sources.length && at >= stopAt)
                stop();
        },
        dispose() {
            disposed = true;
            stop();
            bed.disconnect();
            pulse.disconnect();
            lowPass.disconnect();
        }
    };
}
