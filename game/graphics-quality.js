"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphicsQuality = exports.graphicsMode = exports.graphicsModes = void 0;
exports.graphicsPanel = graphicsPanel;
exports.graphicsModes = {
    auto: { name: 'Авто', description: 'Подстраивает чёткость и эффекты под частоту кадров.' },
    smooth: { name: 'Плавность', description: 'Уменьшает нагрузку от снега, всплесков и разрешения.' },
    detail: { name: 'Детали', description: 'Даёт больше разрешения и дальности эффектов, когда хватает производительности.' },
};
const graphicsMode = (value) => typeof value === 'string' && Object.hasOwn(exports.graphicsModes, value) ? value : 'auto';
exports.graphicsMode = graphicsMode;
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const batteryFrameMs = 1000 / 30;
class FrameClock {
    constructor(now) {
        this.reset(now);
    }
    reset(now) {
        this.lastFrame = now;
        this.nextDue = null;
    }
    take(now, limited) {
        if (limited) {
            const due = this.nextDue ?? this.lastFrame + batteryFrameMs;
            // Allow sub-millisecond rounding in requestAnimationFrame timestamps.
            const lateness = now + .5 - due;
            if (lateness < 0)
                return null;
            // Keep the original cadence and skip expired slots after a stall.
            this.nextDue = due + (1 + Math.floor(lateness / batteryFrameMs)) * batteryFrameMs;
        }
        else {
            this.nextDue = null;
        }
        const elapsed = (now - this.lastFrame) / 1000;
        this.lastFrame = now;
        return Math.max(0, elapsed);
    }
}
exports.FrameClock = FrameClock;
class GraphicsQuality {
    mode;
    frameLimit = 60;
    scale = 1;
    quality = 2;
    time = 0;
    count = 0;
    delayed = 0;
    slow = 0;
    fast = 0;
    ceiling = 1;
    deviceCeiling = 1;
    pixelBudget = Infinity;
    effects = 2;
    measured = null;
    constructor(mode, device) {
        this.mode = mode;
        this.select(mode, device);
    }
    select(mode, { coarse, software, ratio, width, height }) {
        this.mode = mode;
        const budget = software ? (mode === 'smooth' ? .79 : 1) : mode === 'smooth' ? .92 : mode === 'detail' ? (coarse ? 1.5 : 1.65) : (coarse ? 1.25 : 1.5);
        this.deviceCeiling = clamp(Number.isFinite(ratio) ? ratio : 1, .62, budget);
        this.pixelBudget = coarse || software || mode === 'detail' ? Infinity : mode === 'smooth' ? 1250000 : 2100000;
        this.setViewport(width, height);
        this.effects = mode === 'smooth' ? 1 : 2;
        const startRatio = mode === 'auto' && !coarse && !software && width > 0 && height > 0
            ? Math.max(.48, Math.sqrt(1500000 / (width * height))) : this.ceiling;
        this.scale = Math.min(this.ceiling, mode === 'auto' && coarse ? 1.02 : mode === 'smooth' ? .83 : startRatio);
        this.quality = mode === 'auto' && coarse ? 1 : this.effects;
        this.measured = null;
        this.discard();
        this.slow = 0;
        this.fast = 0;
    }
    setViewport(width, height) {
        const limit = width > 0 && height > 0 ? Math.max(.48, Math.sqrt(this.pixelBudget / (width * height))) : Infinity;
        this.ceiling = Math.min(this.deviceCeiling, limit);
        this.scale = Math.min(this.scale, this.ceiling);
    }
    discard() { this.time = 0; this.count = 0; this.delayed = 0; }
    sample(seconds, frameLimit = this.frameLimit) {
        if (frameLimit !== this.frameLimit) {
            this.frameLimit = frameLimit;
            this.discard();
            this.fast = this.slow = 0;
        }
        if (!Number.isFinite(seconds) || seconds <= 0 || seconds > .48) {
            this.discard();
            return null;
        }
        this.time += seconds;
        this.count++;
        if (seconds > 1 / 30 + .001)
            this.delayed++;
        if (this.time < 1.55)
            return null;
        const average = this.count / this.time, longFrames = this.delayed / this.count;
        const capped = frameLimit === 30;
        // At a 30 FPS cap, even on-time frames may span more than 33 ms on a 75 Hz display.
        const slow = capped ? average < 25 : average < 31 || (average < 39 && longFrames > .35);
        const fast = capped ? average >= 28.5 : average > 48 && longFrames < .11;
        this.slow = slow ? this.slow + 1 : 0;
        this.fast = fast ? this.fast + 1 : 0;
        if (this.slow >= 2 || average < 23) {
            if (this.quality > 0)
                this.quality--;
            else
                this.scale = Math.max(.48, this.scale * (average < 25 ? .80 : .90));
            this.slow = 0;
            this.fast = 0;
        }
        else if (this.fast >= 3) {
            if (this.scale < this.ceiling - .025)
                this.scale = Math.min(this.ceiling, this.scale * 1.07);
            else
                this.quality = Math.min(this.effects, this.quality + 1);
            this.fast = 0;
        }
        this.measured = { fps: Math.round(average * 10) / 10, longFrames: Math.round(longFrames * 100), frameLimit, quality: this.quality, scale: this.scale };
        this.discard();
        return this.measured;
    }
    get last() { return this.measured; }
}
exports.GraphicsQuality = GraphicsQuality;
function graphicsPanel(quality, renderer) {
    const render = quality.last;
    const modes = Object.entries(exports.graphicsModes).map(([key, preset]) => `<button class="k-job-btn${quality.mode === key ? ' is-main' : ''}" type="button" data-action="graphics-set" data-value="${key}" aria-pressed="${quality.mode === key}">${preset.name}</button>`).join('');
    return `<div class="k-tour"><div class="k-job-choices" role="group" aria-label="Режим изображения">${modes}</div>
    <p>${exports.graphicsModes[quality.mode].description}</p>
    <p>${renderer} · масштаб ${Math.round(quality.scale * 100)}% · эффекты ${quality.quality + 1} из 3</p>
    ${render ? `<p>Последний замер · <strong>${render.fps} кадр/с</strong> · ${render.longFrames}% кадров дольше 33 мс</p>` : '<p>Замер появится после нескольких секунд игры.</p>'}
    <button class="k-job-btn" type="button" data-action="graphics-test">Проверить в ночной погоне</button></div>`;
}
