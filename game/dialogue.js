"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueNoise = void 0;
exports.dialogueActor = dialogueActor;
exports.dialogueDelivery = dialogueDelivery;
exports.dialogueNoiseAt = dialogueNoiseAt;
const characters = {
    vendor: 'inna', market: 'inna', chase: 'inna',
    dispatcher: 'semen', order: 'semen', depot: 'semen', reward1: 'semen',
    mechanic: 'tonya', delivery: 'tonya', garage: 'tonya',
    courier: 'lesha', clear: 'lesha', finale: 'lesha'
};
const takes = {
    vendor: ['inna-face'], dispatcher: ['semen-face'],
    mechanic: ['tonya-face'], courier: ['lesha-face'],
    order: ['order-phone'], market: ['market-face', 'market-phone'],
    depot: ['depot-relief', 'depot-phone'], reward1: ['reward-phone'],
    delivery: ['delivery-face', 'delivery-phone'], garage: ['garage-relief', 'garage-phone'],
    chase: ['chase-face', 'chase-phone'], clear: ['clear-relief'], finale: ['finale-relief']
};
const phoneLines = new Set(['order', 'reward1', 'clear']);
const greetings = new Set(['vendor', 'dispatcher', 'mechanic', 'courier', 'resident', 'witness']);
function dialogueActor(id) {
    return Object.hasOwn(characters, id) ? characters[id] : undefined;
}
function dialogueDelivery(id, scene = {}) {
    const phone = phoneLines.has(id) || !!scene.phone;
    const options = Object.hasOwn(takes, id) ? takes[id] : undefined;
    const take = options ? `dialogue-${phone ? (options[1] ?? options[0]) : options[0]}` : undefined;
    const incidental = greetings.has(id) || id.startsWith('local-');
    return { take, phone, incidental, actor: dialogueActor(id), yielding: !phone && (!!options || incidental) };
}
const unit = (n) => Math.max(0, Math.min(1, n));
function dialogueNoiseAt(position, tram, cargoDistance = Infinity, cargoLevel = 0, sealed = 0) {
    const distance = Math.hypot(position.x - tram.x, position.z - tram.z);
    const moving = unit((Math.abs(tram.speed) - 1.25) / 4.0);
    const street = tram.visible === false ? 0 : moving * unit((18 - distance) / 12);
    const freight = unit(cargoLevel) * unit((28 - cargoDistance) / 18);
    return Math.max(street, freight) * (1 - unit(sealed) * .76);
}
class DialogueNoise {
    until = 0;
    nearRail = false;
    cooldown = new Map();
    update(at, rail) {
        this.nearRail = rail >= (this.nearRail ? .42 : .57);
        if (this.nearRail)
            this.until = Math.max(this.until, at + .31);
    }
    impact(at, force) {
        if (force >= .28)
            this.until = Math.max(this.until, at + .38 + unit(force) * .54);
    }
    blocked(at) { return this.until > at; }
    accept(id, actor, now) {
        const key = id + '|' + (actor ?? '');
        if ((this.cooldown.get(key) ?? -Infinity) > now)
            return false;
        if (this.cooldown.size >= 24) {
            for (const [old, until] of this.cooldown) {
                if (until <= now)
                    this.cooldown.delete(old);
            }
            if (this.cooldown.size >= 24)
                this.cooldown.delete(this.cooldown.keys().next().value);
        }
        this.cooldown.set(key, now + (dialogueDelivery(id).incidental ? 7 : 2.75));
        return true;
    }
    reset() {
        this.until = 0;
        this.nearRail = false;
        this.cooldown.clear();
    }
}
exports.DialogueNoise = DialogueNoise;
