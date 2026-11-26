"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TouchButtons = void 0;
exports.thumbDrag = thumbDrag;
exports.gasPressure = gasPressure;
const limit = (n, min, max) => Math.max(min, Math.min(max, n));
function thumbDrag(dx, dy, reach, steering, sprinting = false) {
    if (reach <= 0)
        return { x: 0, y: 0, knobX: 0, knobY: 0, sprint: false };
    const y = steering ? 0 : dy, distance = Math.hypot(dx, y);
    if (distance === 0)
        return { x: 0, y: 0, knobX: 0, knobY: 0, sprint: false };
    const relative = distance / reach, deadzone = steering ? .09 : .115;
    const response = limit((relative - deadzone) / (1 - deadzone), 0, 1);
    const amount = response * (.66 + .34 * response), knob = Math.min(distance, reach);
    return { x: amount && dx ? dx / distance * amount : 0, y: amount && y ? -(y / distance) * amount : 0, knobX: dx / distance * knob,
        knobY: y / distance * knob, sprint: !steering && relative >= (sprinting ? .94 : 1.10) };
}
function gasPressure(y, bottom, height) {
    return height > 0 ? limit((bottom - y) / (height * .78), 0, 1) : 0;
}
class TouchButtons {
    pointers = new Map();
    start(id, action, source, pressure = 1) { this.pointers.set(id, { action, source, pressure }); }
    update(id, pressure) {
        const touch = this.pointers.get(id);
        if (touch)
            touch.pressure = pressure;
    }
    touches() { return this.pointers.entries(); }
    covers(source) {
        for (const touch of this.pointers.values())
            if (touch.source === source)
                return true;
        return false;
    }
    end(id) {
        const touch = this.pointers.get(id);
        this.pointers.delete(id);
        return touch;
    }
    clear() { this.pointers.clear(); }
    input() {
        let left = false, right = false, gas = 0, brake = false, handbrake = false, rear = false;
        for (const touch of this.pointers.values())
            switch (touch.action) {
                case 'left':
                    left = true;
                    break;
                case 'right':
                    right = true;
                    break;
                case 'gas':
                    gas = Math.max(gas, touch.pressure);
                    break;
                case 'brake':
                    brake = true;
                    break;
                case 'handbrake':
                    handbrake = true;
                    break;
                case 'rear':
                    rear = true;
                    break;
            }
        return { steer: Number(right) - Number(left), gas: brake ? 0 : gas, brake, handbrake, rear };
    }
}
exports.TouchButtons = TouchButtons;
