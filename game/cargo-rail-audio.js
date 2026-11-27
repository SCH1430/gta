"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCargoTrainAudio = createCargoTrainAudio;
function createCargoTrainAudio(ctx, output) {
    const directional = ctx.createStereoPanner();
    directional.connect(output);
    const rumble = ctx.createGain();
    rumble.gain.value = 0;
    rumble.connect(directional);
    const traction = ctx.createOscillator();
    traction.type = 'triangle';
    traction.frequency.value = 41;
    traction.connect(rumble);
    traction.start();
    const samples = ctx.createBuffer(1, 22050, 22050), data = samples.getChannelData(0);
    let seed = 77580, grain = 0;
    for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const raw = seed / 2 ** 31 - 1;
        grain += .064 * (raw - grain);
        data[i] = grain * .94 + (raw - grain) * .18;
    }
    const hiss = ctx.createBufferSource();
    hiss.buffer = samples;
    hiss.loop = true;
    const steel = ctx.createBiquadFilter();
    steel.type = 'lowpass';
    steel.frequency.value = 1500;
    const rattle = ctx.createGain();
    rattle.gain.value = 0;
    hiss.connect(steel).connect(rattle).connect(directional);
    hiss.start();
    let nextBell = 0;
    return (cue, at) => {
        const level = cue ? (1 - cue.distance / 83) ** 2 : 0;
        const speed = cue?.speed ?? 0;
        const rhythm = cue ? Math.pow(Math.max(0, Math.cos(cue.position * Math.PI * 2 / 2.80)), 9) : 0;
        directional.pan.setTargetAtTime(cue?.pan ?? 0, at, .20);
        traction.frequency.setTargetAtTime(41 + speed * 3.4, at, .29);
        rumble.gain.setTargetAtTime(level * (.027 + speed * .0083), at, .17);
        steel.frequency.setTargetAtTime(340 + speed * 91, at, .24);
        rattle.gain.setTargetAtTime(level * (.04 + speed * .018 * (1 + rhythm * .65)), at, .09);
        if (!cue?.crossing || at < nextBell)
            return;
        nextBell = at + .53;
        for (const [pitch, amount] of [[770, .060], [1179, .033]]) {
            const tone = ctx.createOscillator(), amp = ctx.createGain();
            tone.type = 'sine';
            tone.frequency.value = pitch;
            amp.gain.setValueAtTime(.0001, at);
            amp.gain.linearRampToValueAtTime(amount * level + .0001, at + .006);
            amp.gain.exponentialRampToValueAtTime(.0001, at + .30);
            tone.connect(amp).connect(directional);
            tone.start(at);
            tone.stop(at + .31);
        }
    };
}
