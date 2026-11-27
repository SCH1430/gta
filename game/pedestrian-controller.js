"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedestrianController = void 0;
exports.passingAngle = passingAngle;
const angle = (value) => Math.atan2(Math.sin(value), Math.cos(value));
function passingAngle(actor, neighbours) {
    const sine = Math.sin(actor.yaw), cosine = Math.cos(actor.yaw);
    let turn = 0;
    for (const other of neighbours) {
        if (actor === other || Math.abs(other.y - actor.y) > .70)
            continue;
        const dx = other.x - actor.x, dz = other.z - actor.z;
        const ahead = -dx * sine - dz * cosine, lateral = dx * cosine - dz * sine;
        if (ahead < -.32 || ahead > 1.08 || Math.abs(lateral) > .73)
            continue;
        const strength = (1 - Math.abs(lateral) / .76) * Math.min(1, (1.08 - ahead) / .63, (ahead + .32) / .43);
        if (strength > Math.abs(turn))
            turn = (lateral < -.001 ? -1 : 1) * strength;
    }
    return turn;
}
class PedestrianController {
    vx = 0;
    vz = 0;
    lastX = Infinity;
    lastZ = Infinity;
    nudge = null;
    reset() { this.vx = 0; this.vz = 0; this.nudge = null; }
    resume(pose, vx, vz) {
        this.vx = vx;
        this.vz = vz;
        this.lastX = pose.x;
        this.lastZ = pose.z;
        pose.speed = Math.hypot(vx, vz);
    }
    command(pose, input, maximum, dt, grounded) {
        if (Math.abs(pose.x - this.lastX) + Math.abs(pose.z - this.lastZ) > .30)
            this.reset();
        const x = Number.isFinite(input.moveX) ? input.moveX : 0;
        const z = Number.isFinite(input.moveY) ? input.moveY : 0;
        const magnitude = Math.hypot(x, z), moving = magnitude > (input.analog ? .085 : .025);
        const yaw = Number.isFinite(input.cameraYaw) ? input.cameraYaw : pose.yaw;
        let heading = moving ? angle(yaw + Math.atan2(-x, z)) : null;
        let strength = moving ? Math.min(1, magnitude) : 0;
        const speed = Math.hypot(this.vx, this.vz);
        if (!grounded || input.run)
            this.nudge = null;
        else if (moving && heading !== null) {
            if (!this.nudge && speed < .1 && (input.analog || magnitude < .85))
                this.nudge = { x: pose.x, z: pose.z, heading, held: 0, released: false };
            if (this.nudge) {
                if (this.nudge.released || Math.abs(angle(heading - this.nudge.heading)) > .50)
                    this.nudge = null;
                else {
                    this.nudge.held += dt;
                    if (this.nudge.held <= .16)
                        strength = Math.min(strength, .98 / maximum);
                }
            }
        }
        else if (this.nudge) {
            const step = this.nudge;
            const span = (step.x - pose.x) * Math.sin(step.heading) + (step.z - pose.z) * Math.cos(step.heading);
            if (step.held <= .16 && span < .17) {
                step.released = true;
                heading = step.heading;
                strength = Math.min(.56, .92 / maximum);
            }
            else
                this.nudge = null;
        }
        const turn = heading === null ? 0 : Math.abs(angle(heading - pose.yaw));
        const turnScale = Math.max(.33, 1 - Math.max(0, turn - 1.12) * .67);
        const target = maximum * strength * turnScale;
        const targetX = heading === null ? 0 : -Math.sin(heading) * target;
        const targetZ = heading === null ? 0 : -Math.cos(heading) * target;
        const changeX = targetX - this.vx, changeZ = targetZ - this.vz;
        const change = Math.hypot(changeX, changeZ);
        const braking = this.vx * changeX + this.vz * changeZ < 0;
        const groundedRate = braking ? speed > 2.25 ? 34 : 19 : input.run ? 20 : 16;
        const airRate = braking ? 24 : input.run ? 31 : 22;
        const rate = grounded ? groundedRate * (input.groundGrip ?? 1) : airRate;
        const push = Math.min(dt, change / rate), weight = change ? push * rate / change : 0;
        const nextX = this.vx + changeX * weight, nextZ = this.vz + changeZ * weight;
        const dx = (this.vx + nextX) * .5 * push + nextX * (dt - push);
        const dz = (this.vz + nextZ) * .5 * push + nextZ * (dt - push);
        return { dx, dz, nextX, nextZ, heading };
    }
    resolve(pose, step, x, z, dt) {
        const dx = x - pose.x, dz = z - pose.z;
        const expected = Math.hypot(step.dx, step.dz), moved = Math.hypot(dx, dz);
        const alignment = expected > 1e-6 && moved > 1e-6 ? (dx * step.dx + dz * step.dz) / (expected * moved) : 0;
        const travelling = alignment > .16;
        this.lastX = pose.x = x;
        this.lastZ = pose.z = z;
        pose.speed = travelling ? Math.min(moved, expected) / dt : 0;
        if (!travelling)
            this.reset();
        else if (alignment > .9995 && moved >= expected - .0004) {
            this.vx = step.nextX;
            this.vz = step.nextZ;
        }
        else {
            const along = Math.max(0, (step.nextX * dx + step.nextZ * dz) / moved);
            this.vx = along * dx / moved;
            this.vz = along * dz / moved;
        }
        const followsMotion = travelling && (pose.speed > 2.1 || (alignment < .84 && pose.speed > .45));
        const heading = followsMotion ? Math.atan2(-dx, -dz) : step.heading ?? (travelling && pose.speed > .20 ? Math.atan2(-dx, -dz) : null);
        if (heading !== null) {
            const difference = angle(heading - pose.yaw);
            const smoothing = 1 - Math.exp(-dt * (pose.speed > 3 ? 14 : 21));
            const limit = dt * (pose.speed > 3 ? 10.5 : 16.5);
            pose.yaw = angle(pose.yaw + Math.max(-limit, Math.min(limit, difference * smoothing)));
        }
    }
}
exports.PedestrianController = PedestrianController;
