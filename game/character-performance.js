"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterPerformance = exports.principalGaits = void 0;
const three_module_min_js_1 = require("../engine/three.module.min.js");
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
