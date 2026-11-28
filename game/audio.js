"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameAudio = void 0;
const voice_visemes_js_1 = require("./voice-visemes.js");
const dialogue_js_1 = require("./dialogue.js");
const sound_mix_js_1 = require("./sound-mix.js");
const interior_audio_js_1 = require("./interior-audio.js");
const acoustic_space_js_1 = require("./acoustic-space.js");
const local_soundscape_js_1 = require("./local-soundscape.js");
const broadcasts_js_1 = require("./broadcasts.js");
const radio_stations_js_1 = require("./radio-stations.js");
const street_audio_js_1 = require("./street-audio.js");
const local_assets_js_1 = require("./local-assets.js");
const directional_audio_js_1 = require("./directional-audio.js");
const cargo_rail_audio_js_1 = require("./cargo-rail-audio.js");
const impact_sound_js_1 = require("./impact-sound.js");
const vehicle_audio_js_1 = require("./vehicle-audio.js");
const pursuit_audio_js_1 = require("./pursuit-audio.js");
function gainNode(ctx, destination, level = 0) {
    const g = ctx.createGain();
    g.gain.value = level;
    g.connect(destination);
    return g;
}
function oscillator(ctx, destination, type, hz) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz;
    o.connect(destination);
    o.start();
    return o;
}
function filter(ctx, destination, type, frequency, q = .7) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    f.connect(destination);
    return f;
}
function noiseBuffer(ctx) {
    const b = ctx.createBuffer(1, 32000, 16000);
    const data = b.getChannelData(0);
    let seed = 4727;
    for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        data[i] = (seed / 4294967296) * 2 - 1;
    }
    return b;
}
function shoeSample(ctx, surface, variant) {
    const rate = 22050, size = Math.ceil(rate * (surface === 'metal' ? .42 : .31));
    const buffer = ctx.createBuffer(1, size, rate), samples = buffer.getChannelData(0);
    const pitch = 1 + (variant - 1) * .043, toe = .064 + variant * .006;
    let seed = 37 + variant * 571, low = 0, mid = 0, grains = 0;
    for (let i = 0; i < size; i++) {
        const t = i / rate, t2 = t - toe, attack = Math.min(1, t * 380);
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        low += .052 * (noise - low);
        mid += .34 * (noise - mid);
        const heel = attack * Math.exp(-t * 42), roll = t2 > 0 ? Math.min(1, t2 * 220) * Math.exp(-t2 * 41) : 0;
        const tread = heel + .56 * roll, high = noise - mid, tau = t * Math.PI * 2 * pitch;
        const thud = Math.sin(tau * (68 + 38 * Math.exp(-22 * t))) * heel;
        let value;
        switch (surface) {
            case 'snow': {
                grains = grains * .965 + (noise > .968 ? .48 : 0);
                value = .085 * thud + tread * (1.1 * low + (.065 + grains * .58) * high) + .06 * mid * Math.exp(-t * 13) * attack;
                break;
            }
            case 'slush': {
                // Moist snow compresses under the heel, then releases water at toe-off.
                const release = t2 > 0 ? Math.min(1, t2 * 65) * Math.exp(-t2 * 24) : 0;
                grains = grains * .89 + (noise > .978 ? .23 : 0);
                value = .14 * thud + (.94 * low + .25 * (mid - low)) * tread
                    + (.34 * (mid - low) + (.10 + grains * .46) * high) * release;
                break;
            }
            case 'ice': {
                const skid = t > .01 ? Math.sin(tau * (891 + 173 * Math.exp(-11 * t))) * Math.exp(-t * 18) * attack : 0;
                grains = grains * .83 + (noise > .986 ? .73 : 0);
                value = .19 * thud + .11 * skid * tread + .34 * (high * grains + (mid - low) * .4) * tread;
                break;
            }
            case 'wet': {
                const splash = .36 * high * (tread + .5 * Math.exp(-t * 21) * attack) * (.63 + .37 * Math.sin(8 * tau * 11));
                value = .13 * thud + .65 * splash + .28 * low * tread;
                break;
            }
            case 'metal': {
                const ring = (Math.sin(tau * 318) * .15 + Math.sin(tau * 532) * .091 + Math.sin(tau * 1099) * .051) * attack * Math.exp(-t * 16);
                value = .09 * thud + .28 * high * tread + ring;
                break;
            }
            case 'concrete': {
                const echo = t > .034 ? Math.sin((t - .034) * Math.PI * 2 * 128 * pitch) * Math.exp(-(t - .034) * 47) * .055 : 0;
                value = .235 * thud + .46 * (mid - low) * tread + echo;
                break;
            }
            default:
                value = .16 * thud + .38 * (mid - low) * tread + .11 * high * roll;
        }
        samples[i] = value;
    }
    return buffer;
}
class GameAudio {
    ctx;
    master;
    mix;
    soundProfile = 'headphones';
    roomAudio;
    roadEcho;
    programme = [];
    programmeLevel = .75;
    station = 'district';
    radioGate;
    radioMusicGate;
    streetGate;
    streetLevel;
    stepBus;
    stepReflections;
    localSoundscape;
    directionalAudio;
    freightAudio;
    stationVoiceGain;
    nextBroadcast = 0;
    nextTownNews = 0;
    nextDistrictBroadcast = 0;
    radioAudible = false;
    throttleRelease = 0;
    lastThrottle = 0;
    stationSpeaking = false;
    slot = 0;
    windFilter;
    windGain;
    vehicleAudio;
    tyreGain;
    tyreFilter;
    siren;
    sirenGain;
    sirenPan;
    humGain;
    hum;
    musicGain;
    music;
    musicLoading = false;
    pursuitAudio;
    previousTracking = false;
    pursuitAudible = false;
    voiceGain;
    speech;
    speechFade;
    line;
    dialogueNoise = new dialogue_js_1.DialogueNoise();
    onDialogueResume;
    onDistrictBulletin;
    noise;
    wind;
    clips = new Map();
    volume = .78;
    radioEnabled = true;
    disposed = false;
    paused = false;
    pendingVoice;
    get isSpeaking() { return !!this.line; }
    get playingSpeech() { return this.speech && this.line ? (this.line.foreground ? 1 : .52) : 0; }
    elapsed = 0;
    audioTick = 0;
    steps = new Map();
    impacts = new Map();
    stepVariant = 0;
    ambienceClock = 17;
    textureClock = 5;
    breakDue = false;
    track = 0;
    radioCount = 0;
    constructor() {
        document.addEventListener('visibilitychange', this.visibility);
    }
    visibility = () => {
        if (!this.ctx || this.ctx.state === 'closed')
            return;
        const quiet = this.paused || document.hidden;
        if (quiet && this.ctx.state === 'running')
            void this.ctx.suspend().catch(() => { });
        if (!quiet && this.ctx.state === 'suspended')
            void this.ctx.resume().catch(() => { });
    };
    unlock() {
        if (this.disposed)
            return;
        if (!this.ctx) {
            const browser = window;
            const Ctor = window.AudioContext || browser.webkitAudioContext;
            if (!Ctor)
                return;
            let ctx;
            try {
                ctx = new Ctor({ latencyHint: 'interactive' });
            }
            catch {
                return;
            }
            this.ctx = ctx;
            const mix = this.mix = (0, sound_mix_js_1.createSoundMix)(ctx, this.soundProfile, this.volume);
            const master = this.master = mix.master;
            this.roomAudio = new interior_audio_js_1.InteriorAudio(ctx, mix.world);
            this.noise = noiseBuffer(ctx);
            this.streetLevel = gainNode(ctx, mix.world, 1);
            this.streetGate = filter(ctx, this.streetLevel, 'lowpass', 9800);
            this.localSoundscape = (0, local_soundscape_js_1.createLocalSoundscape)(ctx, this.streetGate);
            this.stepBus = gainNode(ctx, mix.world, 1);
            this.stepReflections = gainNode(ctx, mix.world);
            for (const [seconds, level, hz] of [[.042, .65, 2700], [.084, .33, 1960], [.139, .15, 1380]]) {
                const tap = ctx.createDelay(.18);
                tap.delayTime.value = seconds;
                this.stepBus.connect(tap).connect(filter(ctx, gainNode(ctx, this.stepReflections, level), 'lowpass', hz));
            }
            this.directionalAudio = (0, directional_audio_js_1.createDirectionalAudio)(ctx, this.streetGate);
            this.radioGate = filter(ctx, mix.voice, 'lowpass', 7400);
            this.windGain = gainNode(ctx, this.streetGate, .06);
            this.windFilter = filter(ctx, this.windGain, 'lowpass', 470);
            this.wind = ctx.createBufferSource();
            this.wind.buffer = this.noise;
            this.wind.loop = true;
            this.wind.connect(this.windFilter);
            this.wind.start();
            this.vehicleAudio = (0, vehicle_audio_js_1.createVehicleAudio)(ctx, master);
            this.roadEcho = gainNode(ctx, master);
            for (const [seconds, level] of [[.048, .64], [.103, .33]]) {
                const tap = ctx.createDelay(.2);
                tap.delayTime.value = seconds;
                this.vehicleAudio.output.connect(tap).connect(filter(ctx, gainNode(ctx, this.roadEcho, level), 'lowpass', 1600));
            }
            this.tyreGain = gainNode(ctx, this.streetGate);
            this.tyreFilter = filter(ctx, this.tyreGain, 'bandpass', 940, .65);
            this.wind.connect(this.tyreFilter);
            this.sirenPan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : undefined;
            this.sirenPan?.connect(this.streetGate);
            this.sirenGain = gainNode(ctx, this.sirenPan ?? this.streetGate);
            this.siren = oscillator(ctx, this.sirenGain, 'sine', 680);
            this.humGain = gainNode(ctx, this.streetGate, .018);
            this.hum = oscillator(ctx, this.humGain, 'triangle', 73.4);
            this.radioMusicGate = filter(ctx, mix.media, 'lowpass', 7400);
            this.musicGain = gainNode(ctx, this.radioMusicGate);
            this.stationVoiceGain = gainNode(ctx, this.radioGate);
            this.pursuitAudio = (0, pursuit_audio_js_1.createPursuitAudio)(ctx, this.mix?.media ?? master, stem => this.clip(stem));
            this.voiceGain = gainNode(ctx, mix.voice, .88);
        }
        if (!this.paused && !document.hidden)
            void this.ctx.resume().catch(() => { });
        const voice = this.pendingVoice;
        this.pendingVoice = undefined;
        if (voice)
            this.voice(voice.id, voice.actor, voice.scene);
        else if (this.programme.length && !this.isSpeaking)
            this.nextSegment();
    }
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : .78));
        if (this.ctx && this.master)
            this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, .045);
    }
    setSoundProfile(value) {
        if (!(0, sound_mix_js_1.isSoundProfile)(value))
            return;
        this.soundProfile = value;
        this.mix?.setProfile(value);
    }
    setRadio(enabled) {
        this.radioEnabled = enabled;
        if (!enabled) {
            this.stopStation();
            if (this.ctx && this.musicGain)
                this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, .08);
        }
    }
    setStation(id) {
        if (!(0, radio_stations_js_1.isRadioStation)(id) || this.station === id)
            return;
        this.station = id;
        this.track = 0;
        this.slot = 0;
        this.nextBroadcast = 0;
        this.nextDistrictBroadcast = 0;
        this.breakDue = false;
        this.stopStation();
        this.stopMusic();
    }
    stopMusic() {
        const music = this.music;
        this.music = undefined;
        if (music) {
            try {
                music.stop();
            }
            catch { }
            music.disconnect();
        }
    }
    stopStation() {
        if (!this.stationSpeaking)
            return;
        this.stationSpeaking = false;
        this.programme = [];
        if (this.line?.station)
            this.clearSpeech();
    }
    async clip(name) {
        if (!this.ctx)
            throw new Error('Audio device has not been opened');
        const ctx = this.ctx;
        let pending = this.clips.get(name);
        if (!pending) {
            pending = name === 'dk-metal-theme'
                ? Promise.resolve().then(() => require('./venues-music.js').createMetalTheme(ctx, 'radio'))
                : (0, local_assets_js_1.decodeAudioAsset)(ctx, 'audio/' + name + (name === 'fm-vodosbros' ? '.wav' : '.mp3'));
            this.clips.set(name, pending);
            pending.catch(() => this.clips.delete(name));
        }
        return pending;
    }
    async startMusic() {
        if (this.musicLoading || this.music || !this.ctx || !this.musicGain)
            return;
        const station = this.station, name = (0, radio_stations_js_1.stationTrack)(station, this.track);
        if (!name)
            return;
        this.musicLoading = true;
        try {
            const buffer = await this.clip(name);
            if (this.disposed || !this.radioAudible || station !== this.station)
                return;
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.musicGain);
            source.onended = () => {
                source.disconnect();
                if (this.music === source) {
                    this.music = undefined;
                    this.breakDue = true;
                }
            };
            this.track++;
            source.start();
            this.music = source;
        }
        catch { }
        finally {
            this.musicLoading = false;
        }
    }
    updateStreetMix(state, speed, at) {
        const speaking = this.playingSpeech > 0;
        const road = state.road;
        const drive = (0, vehicle_audio_js_1.vehicleAudioFrame)(road, speed);
        const throttle = road?.accelerator ?? 0;
        if (this.lastThrottle > .62 && throttle < .16 && speed > 3.5)
            this.throttleRelease = at + .27;
        this.lastThrottle = throttle;
        const lift = Math.max(0, this.throttleRelease - at) * .09;
        this.vehicleAudio?.update(road, drive, speed, !!state.train, speaking ? .40 : 1, lift, at);
        this.tyreFilter.frequency.setTargetAtTime(drive.tyreHz, at, .15);
        const flatThump = drive.cyclical * (1 + Math.sin(this.elapsed * speed * 3.2)) * .5;
        this.tyreGain.gain.setTargetAtTime((drive.tyreGain + flatThump) * (speaking ? .43 : 1), at, .15);
        const radioCutoff = 7800 - drive.seal * 1900;
        this.radioGate.frequency.setTargetAtTime(radioCutoff, at, .22);
        this.radioMusicGate.frequency.setTargetAtTime(radioCutoff, at, .22);
        const distance = state.pursuit?.distance ?? Infinity;
        const siren = state.inside || !state.wanted ? 0 : .19 * (1 - Math.min(1, distance / 106)) ** 1.75;
        const pan = Math.max(-1, Math.min(1, state.pursuit?.side ?? 0));
        this.sirenGain.gain.setTargetAtTime(siren * (speaking ? .48 : 1), at, .22);
        this.sirenPan?.pan.setTargetAtTime(pan * .8, at, .17);
        const pulse = (.5 + .5 * Math.sin(this.elapsed * (state.wanted > 1 ? 10.1 : 5.1))) ** 1.8;
        this.siren.frequency.setTargetAtTime(608 + pulse * 290, at, .059);
        const phase = state.inside || !state.wanted ? 'clear' : state.pursuit?.phase ?? (state.pursuit?.tracking ? 'pursuit' : 'search');
        const tracking = phase === 'pursuit';
        this.pursuitAudible = phase !== 'clear';
        if (this.previousTracking && !tracking && this.pursuitAudible) {
            this.tone(482, 425, .22, .038, 'triangle');
            this.tone(320, 285, .21, .024, 'triangle', .19);
        }
        this.previousTracking = tracking;
        this.pursuitAudio?.update(phase, state.wanted, speaking, at);
    }
    mouth(actorId) {
        const line = this.line;
        return this.speech && this.ctx && line?.actor === actorId ?
            (0, voice_visemes_js_1.speechAperture)(line.id, line.offset + this.ctx.currentTime - line.started) : 0;
    }
    mouthShape(actorId) {
        const line = this.line;
        return this.speech && this.ctx && line?.actor === actorId ?
            (0, voice_visemes_js_1.speechShape)(line.id, line.offset + this.ctx.currentTime - line.started) : 0;
    }
    broadcast(ids, level = .85, fromCar = false) {
        const clips = ids.filter(broadcasts_js_1.isProgramme);
        if (!clips.length)
            return;
        this.programme = clips;
        this.programmeLevel = level;
        this.stationSpeaking = fromCar;
        this.nextSegment();
    }
    nextSegment() {
        if (!this.ctx)
            return;
        const next = this.programme.shift();
        if (next)
            this.say(next, this.programmeLevel, { foreground: !this.stationSpeaking });
        else
            this.stationSpeaking = false;
    }
    voice(id, actorId, scene = {}) {
        if (!this.ctx) {
            this.pendingVoice = { id, actor: actorId, scene };
            return;
        }
        const delivery = (0, dialogue_js_1.dialogueDelivery)(id, scene);
        if (delivery.incidental && this.line?.foreground)
            return;
        const actor = actorId ?? delivery.actor;
        if (!this.dialogueNoise.accept(id, actor, this.ctx.currentTime))
            return;
        this.programme = [];
        this.stationSpeaking = false;
        const fallback = id === 'radio' && (this.radioCount++ % 2 === 1) ? 'radio2' : id;
        const distance = scene.distance ?? 0;
        this.say(delivery.take ?? fallback, delivery.phone ? 1 : Math.max(.68, 1 - distance * .047), {
            actor: delivery.phone ? undefined : actor,
            pan: delivery.phone ? undefined : scene.pan,
            yielding: delivery.yielding,
            subtitle: scene.subtitle,
            foreground: true,
            fallback
        });
    }
    interruptDialogue(strength) {
        if (!this.ctx)
            return;
        this.dialogueNoise.impact(this.ctx.currentTime, strength);
        this.updateDialogue(this.ctx.currentTime);
    }
    resetDialogue() {
        this.pendingVoice = undefined;
        this.programme = [];
        this.stationSpeaking = false;
        this.dialogueNoise.reset();
        this.clearSpeech();
    }
    say(id, level, options = {}) {
        if (!this.ctx || !this.voiceGain || options.incidental && this.isSpeaking)
            return;
        this.clearSpeech();
        const line = {
            id, actor: options.actor, subtitle: options.subtitle, pan: options.pan, level, station: this.stationSpeaking,
            foreground: options.foreground ?? false, yielding: options.yielding ?? !!options.incidental,
            offset: 0, started: 0, resumed: false
        };
        this.line = line;
        let buffer = this.clip(id);
        const fallback = options.fallback;
        if (fallback && fallback !== id)
            buffer = buffer.catch(() => { line.id = fallback; return this.clip(fallback); });
        void buffer.then(decoded => {
            if (this.disposed || this.line !== line)
                return;
            line.buffer = decoded;
            this.updateDialogue(this.ctx.currentTime);
        }).catch(() => {
            if (this.line !== line)
                return;
            this.clearSpeech();
            this.nextSegment();
        });
    }
    clearSpeech() {
        this.line = undefined;
        this.stopSpeechSource();
    }
    stopSpeechSource(fade = 0) {
        const source = this.speech, volume = this.speechFade;
        this.speech = undefined;
        this.speechFade = undefined;
        if (source) {
            const at = this.ctx.currentTime;
            if (fade > 0 && volume) {
                volume.gain.cancelScheduledValues(at);
                volume.gain.setTargetAtTime(0, at, fade * .38);
            }
            try {
                source.stop(at + fade);
            }
            catch { }
        }
        this.mix?.setVoice(0);
    }
    updateDialogue(at) {
        const line = this.line;
        if (!line?.buffer || !this.ctx || !this.voiceGain)
            return;
        if (line.yielding && this.dialogueNoise.blocked(at)) {
            if (this.speech) {
                line.offset = Math.min(line.buffer.duration, line.offset + Math.max(0, at - line.started));
                line.resumed = line.offset > 0;
                this.stopSpeechSource(.034);
            }
            return;
        }
        if (this.speech)
            return;
        if (line.offset >= line.buffer.duration - .012) {
            this.clearSpeech();
            this.nextSegment();
            return;
        }
        const ctx = this.ctx;
        const voiceGain = line.station && this.stationVoiceGain ? this.stationVoiceGain : this.voiceGain;
        voiceGain.gain.setValueAtTime(1, at);
        const positional = typeof ctx.createStereoPanner === 'function' && Math.abs(line.pan ?? 0) > .025 ? ctx.createStereoPanner() : undefined;
        if (positional) {
            positional.pan.value = Math.max(-1, Math.min(1, line.pan ?? 0)) * .78;
            positional.connect(voiceGain);
        }
        const source = ctx.createBufferSource(), fade = gainNode(ctx, positional ?? voiceGain);
        this.speech = source;
        this.speechFade = fade;
        source.buffer = line.buffer;
        source.connect(fade);
        line.started = at + (line.foreground ? .045 : .015);
        fade.gain.setValueAtTime(0, line.started);
        fade.gain.linearRampToValueAtTime(line.level, line.started + .024);
        source.onended = () => {
            source.disconnect();
            fade.disconnect();
            positional?.disconnect();
            if (this.speech !== source || this.line !== line)
                return;
            this.speech = undefined;
            this.speechFade = undefined;
            this.line = undefined;
            this.mix?.setVoice(0);
            this.nextSegment();
        };
        this.mix?.setVoice(this.playingSpeech);
        source.start(line.started, line.offset);
        if (line.resumed) {
            line.resumed = false;
            if (line.subtitle)
                this.onDialogueResume?.(line.subtitle);
        }
    }
    tone(from, to, seconds, level, type = 'sine', delay = 0, output = this.master) {
        if (!this.ctx || !output)
            return;
        const ctx = this.ctx;
        const at = ctx.currentTime + delay;
        const g = gainNode(ctx, output);
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(from, at);
        o.frequency.exponentialRampToValueAtTime(to, at + seconds);
        o.connect(g);
        g.gain.setValueAtTime(.0001, at);
        g.gain.exponentialRampToValueAtTime(Math.max(.0002, level), at + .012);
        g.gain.exponentialRampToValueAtTime(.0001, at + seconds);
        o.onended = () => { o.disconnect(); g.disconnect(); };
        o.start(at);
        o.stop(at + seconds + .01);
    }
    burst(hz, seconds, level, delay = 0, q = .8, output = this.master) {
        if (!this.ctx || !output || !this.noise)
            return;
        const ctx = this.ctx;
        const at = ctx.currentTime + delay;
        const g = gainNode(ctx, output);
        const f = filter(ctx, g, 'bandpass', hz, q);
        const s = ctx.createBufferSource();
        s.buffer = this.noise;
        s.connect(f);
        g.gain.setValueAtTime(.0001, at);
        g.gain.exponentialRampToValueAtTime(level, at + .007);
        g.gain.exponentialRampToValueAtTime(.0001, at + seconds);
        s.onended = () => { s.disconnect(); f.disconnect(); g.disconnect(); };
        s.start(at, Math.random());
        s.stop(at + seconds + .01);
    }
    footstep(surface, running = false) {
        const ctx = this.ctx;
        if (!ctx || !this.master || this.disposed || this.paused || document.hidden || ctx.state !== 'running')
            return;
        const variant = this.stepVariant++ % 3, key = surface + variant;
        let sample = this.steps.get(key);
        if (!sample) {
            const school = surface === 'school-tile' || surface === 'school-vinyl';
            sample = shoeSample(ctx, school ? 'concrete' : surface, variant);
            this.steps.set(key, sample);
            if (school) {
                const path = 'audio/' + surface + '-' + (variant + 1) + '.wav';
                (0, local_assets_js_1.decodeAudioAsset)(ctx, path).then(buffer => {
                    if (!this.disposed && this.ctx === ctx)
                        this.steps.set(key, buffer);
                }).catch(() => {});
            }
        }
        const source = ctx.createBufferSource(), gain = gainNode(ctx, this.stepBus ?? this.master, running ? .97 : .72);
        source.buffer = sample;
        source.playbackRate.value = (running ? 1.085 : 1) + (variant - 1) * .021;
        source.connect(gain);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start();
    }
    vehicleImpact(surface, strength, pan, tangential, glass, audibility, seal = 0) {
        const ctx = this.ctx;
        if (!ctx || !this.master || this.disposed || this.paused || document.hidden || ctx.state !== 'running')
            return;
        if (audibility <= 0)
            return;
        const at = ctx.currentTime;
        for (const layer of (0, impact_sound_js_1.impactLayers)(surface, strength, pan, tangential, glass, seal)) {
            let sample = this.impacts.get(layer.kind);
            if (!sample) {
                const wave = (0, impact_sound_js_1.impactSample)(layer.kind);
                sample = ctx.createBuffer(1, wave.length, impact_sound_js_1.impactSampleRate);
                sample.getChannelData(0).set(wave);
                this.impacts.set(layer.kind, sample);
            }
            const gain = gainNode(ctx, this.master, layer.gain * audibility), source = ctx.createBufferSource();
            const tone = filter(ctx, gain, 'lowpass', layer.cutoff);
            source.buffer = sample;
            source.playbackRate.value = layer.rate;
            const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
            if (panner) {
                panner.pan.value = layer.pan;
                source.connect(panner).connect(tone);
            }
            else
                source.connect(tone);
            source.onended = () => { source.disconnect(); panner?.disconnect(); tone.disconnect(); gain.disconnect(); };
            source.start(at + layer.delay);
        }
    }
    tramBell(pan, gain) {
        if (!this.ctx || !this.streetGate || this.paused || document.hidden || this.ctx.state !== 'running' || gain <= 0)
            return;
        (0, local_soundscape_js_1.playTramBell)(this.ctx, this.streetGate, pan, gain);
    }
    effect(id) {
        switch (id) {
            case 'horn':
                this.tone(330, 326, .44, .14, 'sawtooth');
                this.tone(411, 408, .43, .09, 'triangle');
                break;
            case 'jump':
                this.burst(1250, .15, .12);
                break;
            case 'land':
                this.burst(460, .22, .27);
                this.tone(95, 42, .15, .13);
                break;
            case 'door':
            case 'enter':
            case 'exit':
                this.burst(580, .13, .3);
                this.tone(105, 45, .15, .25);
                break;
            case 'pole':
                this.burst(900, .23, .47);
                this.tone(241, 119, .37, .16, 'triangle');
                this.burst(3300, .13, .19, .20);
                this.tone(143, 83, .38, .23, 'triangle', .55);
                break;
            case 'hinge':
                this.tone(188, 304, .32, .035, 'triangle');
                this.burst(850, .08, .11, .03);
                this.burst(520, .12, .21, .93);
                break;
            case 'impact':
                this.burst(760, .4, .54);
                this.tone(98, 36, .36, .38, 'triangle');
                break;
            case 'repair':
                this.burst(2100, .2, .19);
                this.burst(1500, .23, .21, .19);
                this.tone(625, 910, .18, .09, 'sine', .4);
                break;
            case 'cash':
                [587, 740, 988].forEach((f, i) => this.tone(f, f, .23, .1, 'sine', i * .075));
                break;
            case 'alert':
                this.tone(520, 700, .16, .085, 'triangle');
                this.tone(520, 700, .16, .082, 'triangle', .2);
                break;
            case 'notify':
                this.tone(740, 740, .11, .07);
                this.tone(988, 988, .18, .08, 'sine', .12);
                break;
            case 'tram':
                this.tone(1260, 1230, .85, .12, 'sine');
                this.tone(1950, 1890, .64, .045, 'sine', .04);
                this.burst(1700, .75, .11, .15);
                break;
            case 'switch':
                this.burst(1200, .08, .2);
                this.tone(310, 160, .08, .09, 'triangle');
                break;
        }
    }
    update(dt, state) {
        if (this.paused !== !!state.paused) {
            this.paused = !!state.paused;
            this.visibility();
        }
        const ctx = this.ctx;
        if (!ctx || this.paused || document.hidden || ctx.state !== 'running')
            return;
        const delayed = (state.tramTime ?? -1) < 0;
        if (!delayed && this.line?.id === 'stop') {
            this.clearSpeech();
        }
        this.dialogueNoise.update(ctx.currentTime, state.dialogueNoise ?? 0);
        this.updateDialogue(ctx.currentTime);
        const voicePriority = this.playingSpeech, speaking = voicePriority > 0;
        this.mix?.setVoice(voicePriority);
        const step = Math.min(Math.max(dt, 0), .25);
        this.elapsed += step;
        this.audioTick += step;
        if (this.audioTick < 1 / 15)
            return;
        const delta = this.audioTick;
        this.audioTick = 0;
        const at = ctx.currentTime;
        const room = state.roomMix;
        this.roomAudio?.update(delta, room && !state.inside && !state.driving && !state.train
            ? (0, interior_audio_js_1.entranceRoomMix)(room, state.doorDistance ?? Infinity, state.doorOpen ?? 0) : room);
        const air = (0, broadcasts_js_1.roadAcoustics)(state.x ?? 0, state.z ?? 0);
        const speed = Math.abs(state.speed);
        const acoustics = (0, acoustic_space_js_1.acousticMix)({ inside: state.inside, room: state.acousticRoom,
            doorOpen: state.doorOpen, doorDistance: state.doorDistance, lookout: state.lookout, train: state.train,
            cabinSeal: state.road?.enclosure ?? (state.road?.interior ? .91 : 0), concrete: air.concrete, courtyardShelter: state.courtyardShelter });
        this.streetLevel.gain.setTargetAtTime(acoustics.worldGain, at, .21);
        this.streetGate.frequency.setTargetAtTime(acoustics.worldCutoff, at, .21);
        this.stepReflections.gain.setTargetAtTime(acoustics.stepEcho, at, .18);
        this.localSoundscape?.(state.landmarks ?? [], at, speaking);
        const market = /рынок|спектр|market/i.test(state.district);
        const depot = /депо|depot/i.test(state.district);
        const industrial = state.district === 'Северная ТЭЦ' || state.district === 'Литейный квартал' || state.district === 'Старый карьер';
        const shipping = state.district === 'Южный порт' || state.district === 'Сухой док', station = state.district === 'Грузовая станция';
        const exterior = (0, street_audio_js_1.streetSound)(state.district, state.weather);
        this.windGain.gain.setTargetAtTime(exterior.noise + .10 * air.bridge + .012 * Math.sin(this.elapsed * .41), at, .5);
        this.windFilter.frequency.setTargetAtTime(exterior.filter + speed * 8 + air.bridge * 1150, at, .38);
        this.hum.frequency.setTargetAtTime(state.inside ? 49.7 : depot ? 98 : market ? 109.8 : exterior.drone, at, .3);
        const power = 1 - Math.max(0, Math.min(1, state.blackout ?? 0)) * .84;
        this.humGain.gain.setTargetAtTime((state.inside ? .012 : industrial ? .042 : depot ? .047 : market ? .021 : exterior.low) * power, at, .5);
        this.roadEcho.gain.setTargetAtTime(air.concrete * .76, at, .18);
        this.updateStreetMix(state, speed, at);
        this.directionalAudio?.(state.soundGuide ?? [], at, speaking);
        if (state.cargoRail && this.streetGate)
            this.freightAudio ??= (0, cargo_rail_audio_js_1.createCargoTrainAudio)(ctx, this.streetGate);
        this.freightAudio?.(state.cargoRail, at);
        const radio = this.radioAudible = state.driving && this.radioEnabled;
        const open = 1 - (state.road?.enclosure ?? (state.road?.interior ? .91 : 0));
        this.musicGain.gain.setTargetAtTime(radio ? (speaking ? .04 : this.pursuitAudible ? .085 : .29 + open * .09) : 0, at, speaking ? .07 : .4);
        if (!radio)
            this.stopStation();
        const localNews = radio && this.station !== 'night' && !state.wanted && !this.isSpeaking && at >= this.nextTownNews
            ? state.townNews?.take() : undefined;
        let districtReport;
        if (!localNews && radio && this.station !== 'night' && !state.wanted && !this.isSpeaking && !this.musicLoading && at >= this.nextDistrictBroadcast) {
            districtReport = state.districtRadio?.().find(report => report.station === this.station);
            this.nextDistrictBroadcast = at + (districtReport ? 95 : 2);
        }
        if (localNews) {
            this.nextTownNews = at + 7;
            this.nextBroadcast = at + 17;
            this.breakDue = false;
            this.broadcast([localNews], .82 + open * .08, true);
        }
        else if (districtReport) {
            this.stopMusic();
            this.nextBroadcast = at + 17;
            this.breakDue = false;
            this.programme = [];
            this.stationSpeaking = true;
            this.say(districtReport.id, .75 + open * .10, { subtitle: districtReport.subtitle });
            if (districtReport.subtitle)
                this.onDistrictBulletin?.(districtReport.subtitle);
        }
        else if (radio && !this.music && !this.musicLoading && !this.isSpeaking) {
            const talk = this.station === 'dispatch';
            if (!state.wanted && (talk ? at >= this.nextBroadcast : this.breakDue)) {
                this.breakDue = false;
                const bulletin = (0, radio_stations_js_1.stationBulletin)(this.station, this.slot++, state.broadcast, state.archive);
                if (bulletin.length) {
                    this.nextBroadcast = at + 17;
                    this.broadcast(bulletin, .74 + open * .11, true);
                }
                else if (!talk)
                    void this.startMusic();
            }
            else if (!talk) {
                this.breakDue = false;
                void this.startMusic();
            }
        }
        this.textureClock -= delta;
        if (this.textureClock <= 0) {
            if (state.inside) {
                this.tone(485, 469, .17, .009, 'sine');
                this.burst(350, .16, .024, .22);
            }
            const tone = (from, to, seconds, level, type = 'sine', delay = 0) => this.tone(from, to, seconds, level, type, delay, this.streetGate);
            const burst = (hz, seconds, level, delay = 0, q = .8) => this.burst(hz, seconds, level, delay, q, this.streetGate);
            if (state.district === 'Литейный квартал') {
                tone(298, 280, .50, .022, 'triangle');
                burst(1120, .19, .04, .07);
            }
            if (state.district === 'Северная ТЭЦ')
                burst(490, 1.30, .047, 0, .56);
            if (state.district === 'Радиогорск') {
                tone(782, 782, .09, .015);
                tone(987, 987, .13, .014, 'sine', .20);
            }
            if (state.district === 'Старый карьер') {
                burst(220, 1.15, .040, .06, .45);
                tone(83, 58, .27, .025, 'triangle', .24);
            }
            if (state.district === 'Озёрная слобода') {
                tone(928, 924, .46, .009);
                tone(1162, 1159, .32, .006, 'sine', .17);
            }
            if (station) {
                tone(620, 409, .81, .018, 'triangle');
                burst(1820, .28, .031, .45);
            }
            if (shipping) {
                tone(112, 105, 1.18, .031);
                tone(168, 157, 1.03, .015, 'sine', .046);
            }
            if (state.district === 'Белая плотина') {
                tone(87, 83, 1.7, .039, 'triangle');
                burst(485, 1.27, .040, .12, .48);
            }
            if (state.district === 'Западный терминал') {
                burst(2500, .12, .038, .08);
                tone(248, 170, .29, .032, 'triangle', .38);
                burst(1040, .29, .027, .53);
            }
            if (state.district === 'Лесная промзона') {
                burst(460, 1.5, .038, 0, .60);
                tone(156, 150, 1.32, .023, 'sawtooth', .08);
            }
            if (state.district === 'Северный посёлок') {
                burst(1700, .18, .021);
                tone(775, 775, .12, .013, 'sine', .20);
            }
            this.textureClock = 4 + Math.random() * 5;
        }
        this.ambienceClock -= delta;
        if (this.ambienceClock < 0 && !state.inside && !state.driving && !state.wanted && !this.isSpeaking) {
            if (depot && delayed)
                this.say('stop', .43, { incidental: true });
            else if (market)
                this.say('market_amb', .43, { incidental: true });
            this.ambienceClock = 28;
        }
    }
    dispose() {
        document.removeEventListener('visibilitychange', this.visibility);
        this.disposed = true;
        this.roomAudio?.dispose();
        this.pursuitAudio?.dispose();
        this.vehicleAudio?.dispose();
        this.resetDialogue();
        for (const source of [this.music, this.wind, this.hum, this.siren]) {
            if (source) {
                try {
                    source.stop();
                }
                catch { }
                source.disconnect();
            }
        }
        if (this.ctx && this.ctx.state !== 'closed')
            void this.ctx.close().catch(() => { });
        this.clips.clear();
        this.steps.clear();
        this.impacts.clear();
    }
}
exports.GameAudio = GameAudio;
