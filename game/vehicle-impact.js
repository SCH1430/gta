"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactMass = impactMass;
exports.impactVelocity = impactVelocity;
exports.solveVehicleImpact = solveVehicleImpact;
exports.recoverImpactYaw = recoverImpactYaw;
exports.recoverImpactVelocity = recoverImpactVelocity;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const kerbMass = {
    hatch: 980, sedan: 1570, van: 2080, suv: 1710, pickup: 1940, coupe: 1270,
    taxi: 1480, wagon: 1630, towtruck: 3540, utility: 3070
};
function impactMass(c) {
    return kerbMass[c.kind] + (c.police ? 125 : 0) + (c.systems?.load ?? 0) + (c.systems?.towedMass ?? 0) * .46;
}
function chassis(c, contact, pose = c) {
    const mass = impactMass(c), s = vehicle_cabin_js_1.specs[c.kind], length = s.rear - s.front, width = s.w * 2;
    return { inverse: 1 / mass, spinInverse: 12 / (mass * (length * length + width * width)),
        x: (0, sim_navigation_js_1.clamp)(contact.x - pose.x, -length * .55, length * .55), z: (0, sim_navigation_js_1.clamp)(contact.z - pose.z, -length * .55, length * .55) };
}
function impactVelocity(c, simulated, yawRate = 0) {
    return simulated ? { x: c.vx, z: c.vz, yawRate } : { x: -Math.sin(c.yaw) * c.speed, z: -Math.cos(c.yaw) * c.speed, yawRate };
}
function solveVehicleImpact(a, b, point, n, va, vb, dryGrip, source) {
    const ka = chassis(a, point, source), kb = chassis(b, point);
    const dX = va.x + va.yawRate * ka.z - vb.x - vb.yawRate * kb.z;
    const dZ = va.z - va.yawRate * ka.x - vb.z + vb.yawRate * kb.x;
    const closing = Math.max(0, -(dX * n.x + dZ * n.z)), tx = -n.z, tz = n.x, shear = dX * tx + dZ * tz;
    const momentA = ka.z * n.x - ka.x * n.z, momentB = kb.z * n.x - kb.x * n.z;
    const tangentA = ka.z * tx - ka.x * tz, tangentB = kb.z * tx - kb.x * tz;
    const translation = ka.inverse + kb.inverse;
    const spin = closing > .62 ? 1 : 0;
    const restitution = closing > 1.35 ? .045 + Math.max(0, .071 - closing * .004) : 0;
    const normalImpulse = closing * (1 + restitution) / (translation + spin * (momentA ** 2 * ka.spinInverse + momentB ** 2 * kb.spinInverse));
    const frictionLimit = normalImpulse * (.075 + .065 * (0, sim_navigation_js_1.clamp)(dryGrip, 0, 1));
    const tangentImpulse = (0, sim_navigation_js_1.clamp)(-shear / (translation + tangentA ** 2 * ka.spinInverse + tangentB ** 2 * kb.spinInverse), -frictionLimit, frictionLimit);
    const jx = normalImpulse * n.x + tangentImpulse * tx, jz = normalImpulse * n.z + tangentImpulse * tz;
    const adjust = (k, v, sign) => ({
        x: v.x + sign * jx * k.inverse, z: v.z + sign * jz * k.inverse,
        yawRate: (0, sim_navigation_js_1.clamp)(v.yawRate + spin * sign * (k.z * jx - k.x * jz) * k.spinInverse, -2.8, 2.8)
    });
    const strength = (0, sim_navigation_js_1.clamp)((closing + Math.min(2, Math.abs(shear) * .12)) / 14, 0, 1);
    return {
        a: adjust(ka, va, 1), b: adjust(kb, vb, -1), closing, tangent: Math.abs(shear), strength,
        aShock: Math.hypot(jx, jz) * ka.inverse, bShock: Math.hypot(jx, jz) * kb.inverse
    };
}
function recoverImpactYaw(rate, grip, dt) {
    const retained = Math.exp(-dt * (.85 + 4.35 * (0, sim_navigation_js_1.clamp)(grip, 0, 1)));
    return { turn: rate * dt * (1 + retained) * .5, rate: rate * retained };
}
function recoverImpactVelocity(v, yaw, grip, dt) {
    const co = Math.cos(yaw), si = Math.sin(yaw);
    const longitudinal = (v.x * si + v.z * co) * Math.exp(-dt * (1.42 + 2.6 * grip));
    const sideways = (v.x * co - v.z * si) * Math.exp(-dt * (.75 + 3.7 * grip));
    return { x: longitudinal * si + sideways * co, z: longitudinal * co - sideways * si };
}
