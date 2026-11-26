"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulationPerformance = exports.distantPopulationTick = void 0;
exports.populationPoseInterval = populationPoseInterval;
const distantTicks = [.35, .48, .66];
const distantPopulationTick = (pressure) => distantTicks[pressure];
exports.distantPopulationTick = distantPopulationTick;
class PopulationPerformance {
    slow = 0;
    fast = 0;
    pressure = 0;
    measure({ fps, longFrames, frameLimit }) {
        if (!Number.isFinite(fps) || !Number.isFinite(longFrames) || fps <= 0)
            return this.pressure;
        const capped = frameLimit === 30;
        const slow = capped ? fps < 25 : fps < 30 || (fps < 37 && longFrames >= 46);
        const fast = capped ? fps >= 28.5 : fps >= 45 && longFrames < 16;
        this.slow = slow ? this.slow + 1 : 0;
        this.fast = fast ? this.fast + 1 : 0;
        if (this.slow >= 2) {
            this.pressure = this.pressure === 0 ? 1 : 2;
            this.slow = this.fast = 0;
        }
        else if (this.fast >= 3) {
            this.pressure = this.pressure === 2 ? 1 : 0;
            this.slow = this.fast = 0;
        }
        return this.pressure;
    }
}
exports.PopulationPerformance = PopulationPerformance;
function populationPoseInterval(distanceSquared, pressure, actor, critical = false) {
    if (critical)
        return 0;
    if (actor === 'car') {
        if (!pressure || distanceSquared <= 40 ** 2)
            return 0;
        return distanceSquared > 57 ** 2
            ? (pressure === 2 ? 1 / 10 : 1 / 15)
            : (pressure === 2 ? 1 / 18 : 1 / 24);
    }
    if (distanceSquared <= 46 ** 2)
        return 0;
    if (distanceSquared > 88 ** 2)
        return pressure === 2 ? 1 / 8 : pressure === 1 ? 1 / 10 : 1 / 12;
    return pressure === 2 ? 1 / 14 : pressure === 1 ? 1 / 18 : 1 / 24;
}
