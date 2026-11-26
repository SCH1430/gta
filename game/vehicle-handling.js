"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepDrive = stepDrive;
const sim_navigation_js_1 = require("./sim-navigation.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const chassis = {
    hatch: { acceleration: 6.9, topSpeed: 26, brake: 13.5, wheelbase: 2.24, steeringLock: .58,
        steeringResponse: 9.5, lateralGrip: 7.2, handbrakeGrip: .34, handbrakeYaw: 1.5, slowSpeedTorque: .19 },
    sedan: { acceleration: 5.4, topSpeed: 29, brake: 10.9, wheelbase: 2.80, steeringLock: .49,
        steeringResponse: 7.8, lateralGrip: 5.1, handbrakeGrip: .28, handbrakeYaw: 1.48, slowSpeedTorque: .08 },
    van: { acceleration: 4.1, topSpeed: 21, brake: 8.4, wheelbase: 3.04, steeringLock: .52,
        steeringResponse: 7.0, lateralGrip: 4.3, handbrakeGrip: .44, handbrakeYaw: 1.28, slowSpeedTorque: .23 },
    suv: { acceleration: 5.65, topSpeed: 25, brake: 10.4, wheelbase: 2.76, steeringLock: .56,
        steeringResponse: 7.1, lateralGrip: 7.2, handbrakeGrip: .53, handbrakeYaw: 1.23, slowSpeedTorque: .29, payloadBase: 1150, winterDrive: .31 },
    pickup: { acceleration: 5.01, topSpeed: 24, brake: 9.2, wheelbase: 3.13, steeringLock: .51,
        steeringResponse: 6.3, lateralGrip: 4.65, handbrakeGrip: .30, handbrakeYaw: 1.66, slowSpeedTorque: .25, payloadBase: 1360, winterDrive: .18 },
    coupe: { acceleration: 8.85, topSpeed: 34, brake: 14.8, wheelbase: 2.74, steeringLock: .51,
        steeringResponse: 12.3, lateralGrip: 5.7, handbrakeGrip: .21, handbrakeYaw: 1.88, slowSpeedTorque: .12, payloadBase: 840, winterDrive: -.28 },
    taxi: { acceleration: 6.0, topSpeed: 28, brake: 12.6, wheelbase: 2.85, steeringLock: .53,
        steeringResponse: 10.1, lateralGrip: 6.2, handbrakeGrip: .37, handbrakeYaw: 1.34, slowSpeedTorque: .17, winterDrive: .10 },
    wagon: { acceleration: 5.18, topSpeed: 24, brake: 9.2, wheelbase: 2.95, steeringLock: .55,
        steeringResponse: 7.5, lateralGrip: 5.45, handbrakeGrip: .28, handbrakeYaw: 1.5, slowSpeedTorque: .16, winterDrive: .06 },
    towtruck: { acceleration: 4.8, topSpeed: 19.9, brake: 8.7, wheelbase: 4.41, steeringLock: .61,
        steeringResponse: 6.0, lateralGrip: 6.0, handbrakeGrip: .51, handbrakeYaw: 1.09, slowSpeedTorque: .27, payloadBase: 3150, winterDrive: .20 },
    utility: { acceleration: 3.9, topSpeed: 16.5, brake: 8.2, wheelbase: 3.68, steeringLock: .56,
        steeringResponse: 5.5, lateralGrip: 6.55, handbrakeGrip: .48, handbrakeYaw: 1.12, slowSpeedTorque: .30, payloadBase: 2700, winterDrive: .34 }
};
function stepDrive(c, input, system, tyres, dt) {
    const model = chassis[c.kind], gas = (0, sim_navigation_js_1.clamp)(Number(input.gas) || 0, 0, 1), brake = (0, sim_navigation_js_1.clamp)(Number(input.brake) || 0, 0, 1);
    if (system.bedMoving || c.mobilityPassengerBusy) {
        c.speed = 0;
        c.vx = 0;
        c.vz = 0;
        return c.yaw;
    }
    const mass = 1 + (system.load + system.towedMass + (c.mobilityCargoKg || 0)) / (model.payloadBase ?? (c.kind === 'van' ? 1120 : 920));
    const motorGrip = tyres.mean + (1 - tyres.mean) * (model.winterDrive ?? 0);
    const powered = !system.plugged && (c.kind !== 'van' || system.charge > 0);
    if (system.plugged) {
        c.speed = 0;
        c.vx = 0;
        c.vz = 0;
    }
    if ((gas || brake) && system.boot)
        system.boot = false;
    if (c.kind === 'van')
        system.charge = Math.max(0, system.charge - Math.abs(c.speed) * dt * (.0027 + .0012 * gas) * mass);
    const speed = Math.abs(c.speed), manoeuvre = system.manoeuvre;
    const handbrake = Boolean(input.handbrake);
    const torque = manoeuvre ? 1 : 1 + model.slowSpeedTorque * Math.max(0, 1 - speed / 11);
    const gentleVanPedal = c.kind === 'van' && gas < .32 ? .74 : 1;
    const engine = model.acceleration * (.58 + .42 * c.health / 100) * torque * gentleVanPedal;
    const throttle = powered ? Math.min(gas, manoeuvre ? .4 : 1) : 0;
    const launch = handbrake ? Math.min(1, speed / 2) : 1;
    const power = throttle * launch * Math.min(1, motorGrip + .2) * (c.speed < -.5 ? model.brake : engine);
    const stopping = c.speed > .25 ? model.brake * tyres.mean : powered ? model.acceleration * .59 : 0;
    let acceleration = (power - (system.plugged ? 0 : brake * stopping)) / mass;
    if (manoeuvre && speed > 1.95)
        acceleration -= Math.sign(c.speed) * Math.min(8, 2 + 4 * (speed - 1.95));
    if (manoeuvre && gas && c.speed >= 1.95)
        acceleration = Math.min(0, acceleration);
    if (manoeuvre && brake && c.speed <= -1.95)
        acceleration = Math.max(0, acceleration);
    const regen = c.kind === 'van' && gas < .045 && c.speed > 1.0 ? 1.62 : 0;
    if (regen && !system.plugged)
        system.charge = Math.min(100, system.charge + Math.abs(c.speed) * dt * .0014);
    const flats = (system.punctures & 1) + ((system.punctures >> 1) & 1) + ((system.punctures >> 2) & 1) + ((system.punctures >> 3) & 1);
    const drag = (handbrake ? 7.1 : c.kind === 'pickup' ? .46 : .60) + .0055 * c.speed * c.speed + regen + flats * .72 + (system.plough ? .94 : 0);
    const driven = c.speed + acceleration * dt;
    c.speed = (0, sim_navigation_js_1.clamp)(Math.sign(driven) * Math.max(0, Math.abs(driven) - drag * dt), -6.8, model.topSpeed * (.66 + .34 * c.health / 100) * (1 - flats * .114) * (system.plough ? .66 : 1) / (1 + system.towedMass / 8800));
    const steering = (0, sim_navigation_js_1.clamp)(input.steer ?? 0, -1, 1);
    c.steer += (steering - c.steer) * (1 - Math.exp(-dt * model.steeringResponse));
    const turn = model.steeringLock * c.steer / (1 + speed * .043 + speed * speed * .00022);
    const leftFlat = (system.punctures & 1) + ((system.punctures >> 2) & 1), rightFlat = ((system.punctures >> 1) & 1) + ((system.punctures >> 3) & 1);
    const pull = -brake * tyres.difference * .46 * Math.min(1, speed / 3) + ((0, vehicle_road_js_1.wheelSteeringFault)(system) + (leftFlat - rightFlat) * .009) * c.speed;
    const yaw = (0, sim_navigation_js_1.wrapAngle)(c.yaw + dt * (pull - c.speed * Math.tan(turn) / model.wheelbase * tyres.mean * (handbrake ? model.handbrakeYaw : 1)));
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const longitudinal = -sin * c.vx - cos * c.vz;
    const lateral = cos * c.vx - sin * c.vz;
    const brakingGrip = brake && c.speed >= 0 ? 1.22 : 1;
    const driveGrip = (6.7 + model.lateralGrip * .44) * Math.sqrt(tyres.mean) * brakingGrip / Math.sqrt(mass);
    const slideGrip = model.lateralGrip * (model.winterDrive === undefined ? tyres.mean : (tyres.mean * .7 + motorGrip * .3)) * (handbrake ? model.handbrakeGrip : 1) / mass;
    const along = c.speed + (longitudinal - c.speed) * Math.exp(-dt * driveGrip);
    const across = lateral * Math.exp(-dt * slideGrip);
    c.vx = -sin * along + cos * across;
    c.vz = -cos * along - sin * across;
    return yaw;
}
