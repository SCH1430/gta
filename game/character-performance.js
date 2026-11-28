"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterPerformance = exports.principalGaits = void 0;
exports.streetPerformancePose = streetPerformancePose;
const three_module_min_js_1 = require("../engine/three.module.min.js");
const { fenceDamageWitness } = require("./city-life.js");
const { tramStops } = require("./world-railway.js");
const { shortAngle } = require("./model-gait.js");
const stationBoards = Object.values(tramStops).map(stop => stop.board);
function streetPerformancePose(person, conditions, witness, elapsed) {
    if (person.onboard || person.platformStep)
        return {};
    const wind = Math.hypot(conditions.gustX, conditions.gustZ);
    const windSide = Math.sign(conditions.gustX * Math.cos(person.yaw) - conditions.gustZ * Math.sin(person.yaw)) || 1;
    const directionTo = point => shortAngle(Math.atan2(person.x - point.x, person.z - point.z) - person.yaw);
    let board;
    if (person.speed < .25) {
        let closest = 5.4 ** 2;
        for (const candidate of stationBoards) {
            const distance = (person.x - candidate.x) ** 2 + (person.z - candidate.z) ** 2;
            if (distance < closest) {
                closest = distance;
                board = candidate;
            }
        }
    }
    const impactAge = witness?.reason === fenceDamageWitness && witness.t <= elapsed ? elapsed - witness.t : Infinity;
    return {
        wind, windSide, cold: conditions.temperature < 2,
        boardAngle: board ? directionTo(board) : undefined,
        boardPitch: board ? Math.atan2(board.y - person.y - 1.55, Math.hypot(person.x - board.x, person.z - board.z)) : 0,
        impactAge, impactAngle: impactAge < 3 ? directionTo(witness) : undefined
    };
}
exports.principalGaits = {
    vendor: 'careful', mechanic: 'worker', dispatcher: 'limp', courier: 'courier'
};
function envelope(at, inStart, inEnd, outStart, outEnd) {
    return three_module_min_js_1.MathUtils.smoothstep(at, inStart, inEnd) * (1 - three_module_min_js_1.MathUtils.smoothstep(at, outStart, outEnd));
}
class CharacterPerformance {
    role;
    phase = 2;
    strength = 0;
    listen = 0;
    wipe = 0;
    show = 0;
    shoulder = 0;
    wasNear = false;
    wasSpeaking = false;
    wasRail = false;
    nearbyFor = 0;
    constructor(role) {
        this.role = role;
    }
    reset() {
        this.phase = 2;
        this.strength = this.listen = this.wipe = this.show = this.shoulder = 0;
        this.wasNear = this.wasSpeaking = this.wasRail = false;
        this.nearbyFor = 0;
    }
    tick(dt, pose, available) {
        if (this.role === 'hero' || this.role === 'resident')
            return;
        const near = !!pose.anticipation, speaking = !!pose.conversation, rail = !!pose.railNear;
        this.nearbyFor = near ? this.nearbyFor + dt : 0;
        const arrived = near && !this.wasNear;
        const addressed = speaking && !this.wasSpeaking;
        const bell = rail && !this.wasRail;
        const interrupted = this.role === 'dispatcher' && bell && (near || speaking);
        const welcomed = this.role === 'mechanic' && (arrived || addressed && !this.wasNear || addressed && this.nearbyFor > 7);
        const demonstration = (this.role === 'courier' || this.role === 'vendor' || this.role === 'dispatcher') && addressed;
        if (available > .32 && this.phase > 1.15 && (interrupted || welcomed || demonstration))
            this.phase = 0;
        this.phase = Math.min(2, this.phase + dt);
        this.wasNear = near && (this.wasNear || available > .32);
        this.wasSpeaking = speaking;
        this.wasRail = rail;
        this.strength = three_module_min_js_1.MathUtils.damp(this.strength, available, 16, dt);
        this.wipe = this.role === 'mechanic' ? this.strength * envelope(this.phase, .06, .27, .82, 1.21) : 0;
        this.listen = this.role === 'dispatcher' ? this.strength * (rail ? envelope(this.phase, .03, .25, .95, 1.38) : envelope(this.phase, .44, .71, 1.05, 1.48)) : 0;
        this.show = this.role === 'vendor' ? this.strength * envelope(this.phase, .09, .32, .93, 1.42) : 0;
        this.shoulder = this.role === 'courier' ? this.strength * envelope(this.phase, .06, .33, .61, 1.06) : 0;
    }
}
exports.CharacterPerformance = CharacterPerformance;
