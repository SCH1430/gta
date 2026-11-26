"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gait = exports.shortAngle = void 0;
const three_module_min_js_1 = require("../engine/three.module.min.js");
const locomotion_poses_js_1 = require("./locomotion-poses.js");
const step = (side) => ({
    side,
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    planted: true,
    stamp: 0,
    contactX: 0, contactY: 0, contactZ: 0, pivot: 0,
    anchorX: 0, anchorY: 0, anchorZ: 0,
    heelOnTread: true, toeOnTread: true, treadPivot: 0,
    goalX: 0, goalZ: 0,
    originX: 0,
    originZ: 0,
    originY: 0,
    originPitch: 0,
    originYaw: 0,
    loading: 0,
    pitch: 0,
    lift: 0
});
const shortAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
exports.shortAngle = shortAngle;
const gaitKinematics = {
    normal: { stride: 1, lift: 1, toeOut: .033, stance: 1 },
    limp: { stride: .91, lift: .93, toeOut: .047, stance: 1.07 },
    careful: { stride: .88, lift: 1.12, toeOut: .059, stance: 1.14 },
    courier: { stride: 1.035, lift: 1.06, toeOut: .019, stance: 1 },
    worker: { stride: 1.06, lift: .87, toeOut: .096, stance: 1.18 },
    commuter: { stride: .91, lift: 1.13, toeOut: .025, stance: .94 },
    patrol: { stride: 1.075, lift: 1.08, toeOut: .019, stance: 1.06 },
    quick: { stride: .86, lift: 1.17, toeOut: .018, stance: .92 },
};
const mix = three_module_min_js_1.MathUtils.lerp;
const limit = three_module_min_js_1.MathUtils.clamp;
function bootFloor(x, z, yaw, scale, sample) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    return Math.max(sample(x, z), sample(x + s * locomotion_poses_js_1.toePivot * scale, z + c * locomotion_poses_js_1.toePivot * scale), sample(x + s * locomotion_poses_js_1.heelPivot * scale, z + c * locomotion_poses_js_1.heelPivot * scale));
}
function shoeOnGround(foot, x, z, yaw, scale, sample) {
    const si = Math.sin(yaw) * scale, co = Math.cos(yaw) * scale;
    const level = sample(x, z);
    for (const pivot of [locomotion_poses_js_1.toePivot, locomotion_poses_js_1.heelPivot]) {
        const outward = Math.sign(pivot), rim = pivot + outward * .018;
        if (sample(x + si * pivot, z + co * pivot) <= level + .028 && sample(x + si * rim, z + co * rim) > level + .028) {
            x -= si * outward * .024;
            z -= co * outward * .024;
        }
    }
    foot.anchorX = x;
    foot.anchorZ = z;
    const heel = sample(x + si * locomotion_poses_js_1.heelPivot, z + co * locomotion_poses_js_1.heelPivot), toe = sample(x + si * locomotion_poses_js_1.toePivot, z + co * locomotion_poses_js_1.toePivot), middle = sample(x, z);
    foot.anchorY = Math.max(heel, toe, middle);
    const splitTread = foot.anchorY - Math.min(heel, toe, middle) > .028;
    foot.heelOnTread = !splitTread || foot.anchorY - heel < .009;
    foot.toeOnTread = !splitTread || foot.anchorY - toe < .009;
    foot.treadPivot = !splitTread || foot.anchorY - middle < .009 ? 0 : foot.heelOnTread ? locomotion_poses_js_1.heelPivot : locomotion_poses_js_1.toePivot;
    foot.yaw = yaw;
    foot.planted = true;
    foot.loading = 0;
    foot.lift = 0;
}
function rotateOnSole(foot, pitch, scale) {
    if ((pitch > 0 && !foot.heelOnTread) || (pitch < 0 && !foot.toeOnTread))
        pitch = 0;
    const pivot = pitch > .00001 ? locomotion_poses_js_1.heelPivot : pitch < -.00001 ? locomotion_poses_js_1.toePivot : foot.treadPivot;
    const si = Math.sin(foot.yaw), co = Math.cos(foot.yaw);
    const sinPitch = Math.sin(pitch), cosPitch = Math.cos(pitch);
    foot.contactX = foot.anchorX + si * pivot * scale;
    foot.contactZ = foot.anchorZ + co * pivot * scale;
    foot.contactY = foot.anchorY;
    foot.pivot = pivot;
    const offset = (locomotion_poses_js_1.soleHeight * sinPitch + pivot * cosPitch) * scale;
    foot.x = foot.contactX - si * offset;
    foot.z = foot.contactZ - co * offset;
    foot.y = foot.contactY + (pivot * sinPitch - locomotion_poses_js_1.soleHeight * cosPitch) * scale;
    foot.pitch = pitch;
}
function swingOrigin(foot) {
    foot.originX = foot.x;
    foot.originY = foot.y;
    foot.originZ = foot.z;
    foot.originPitch = foot.pitch;
    foot.originYaw = foot.yaw;
    foot.planted = false;
    foot.loading = 0;
    foot.goalX = NaN;
}
class Gait {
    feet = [step(-1), step(1)];
    footfall = null;
    phase = 0;
    speed = 0;
    acceleration = 0;
    lastX = NaN;
    lastZ = NaN;
    lastYaw = 0;
    turn = 0;
    sideSpeed = 0;
    forwardSpeed = 0;
    run = 0;
    grade = 0;
    stair = 0;
    takeoff = 0;
    landing = 0;
    onReset = false;
    previousY = 0;
    airborneTime = 0;
    landingTime = 1;
    landingForce = 0;
    fallSpeed = 0;
    leadSide = 1;
    recoverLeg = -1;
    recoverTime = 0;
    recoverDuration = 0;
    dirX = 0;
    dirZ = -1;
    elapsedStill = 0;
    pivotLeg = -1;
    pivotClock = 0;
    pivotDuration = .16;
    pivotLoad = 0;
    pivotAmount = 0;
    swing = { up: 0, trail: 0, pitch: 0 };
    get leadingSide() { return this.leadSide; }
    get approachingGround() { return three_module_min_js_1.MathUtils.smoothstep(this.fallSpeed, .75, 3.6); }
    reset() {
        this.lastX = NaN;
        this.footfall = null;
    }
    update(dt, x, y, z, yaw, scale, air, sample, style = 'normal', halfStance = .096) {
        const gait = gaitKinematics[style];
        halfStance *= gait.stance;
        this.footfall = null;
        this.onReset = false;
        const oldSpeed = this.speed;
        const dx = x - this.lastX, dz = z - this.lastZ, dist = Math.hypot(dx, dz), co = Math.cos(yaw), si = Math.sin(yaw);
        if (!Number.isFinite(dist) || dist > 1.45 || dt <= 0) {
            this.dirX = -si;
            this.dirZ = -co;
            this.lastX = x;
            this.lastZ = z;
            this.lastYaw = yaw;
            this.speed = 0;
            this.acceleration = 0;
            this.run = 0;
            this.forwardSpeed = 0;
            this.turn = this.sideSpeed = this.grade = this.takeoff = this.landing = this.stair = 0;
            this.previousY = y;
            this.airborneTime = this.fallSpeed = this.landingForce = 0;
            this.landingTime = 1;
            this.recoverLeg = this.pivotLeg = -1;
            this.pivotLoad = this.pivotAmount = 0;
            this.onReset = true;
            this.phase = 0.25;
            this.elapsedStill = 0.2;
            for (const f of this.feet) {
                shoeOnGround(f, x + f.side * co * halfStance * scale, z - f.side * si * halfStance * scale, yaw, scale, sample);
                rotateOnSole(f, 0, scale);
            }
            return;
        }
        const actual = dist / dt;
        const dy = y - this.previousY;
        this.previousY = y;
        this.sideSpeed = three_module_min_js_1.MathUtils.damp(this.sideSpeed, (dx * co - dz * si) / dt, 9, dt);
        this.forwardSpeed = three_module_min_js_1.MathUtils.damp(this.forwardSpeed, (-dx * si - dz * co) / dt, 10, dt);
        const slope = !air && actual > .2 ? limit(dy / dist, -.8, .8) : 0;
        this.grade = three_module_min_js_1.MathUtils.damp(this.grade, slope, 9, dt);
        const touchdown = !air && this.airborneTime > 0;
        if (air) {
            if (this.airborneTime === 0) {
                const [left, right] = this.feet;
                const stagger = (right.x - left.x) * -si + (right.z - left.z) * -co;
                this.leadSide = left.planted !== right.planted ? (left.planted ? 1 : -1)
                    : Math.abs(stagger) > .04 * scale ? Math.sign(stagger) : -this.leadSide;
                if (actual < .12) {
                    this.dirX = -si;
                    this.dirZ = -co;
                }
            }
            this.airborneTime += dt;
            this.fallSpeed = Math.max(this.fallSpeed, -dy / dt);
            this.takeoff = 1 - three_module_min_js_1.MathUtils.smoothstep(this.airborneTime, 0, .16);
            this.landingTime = 1;
        }
        else {
            if (touchdown) {
                this.landingTime = 0;
                this.landingForce = limit(this.fallSpeed / 4, .35, 1.2);
                this.airborneTime = this.fallSpeed = 0;
            }
            else
                this.landingTime += dt;
            this.takeoff = 0;
        }
        const landingPhase = limit(this.landingTime / .32, 0, 1);
        this.landing = Math.sin(Math.PI * Math.sqrt(landingPhase)) * (1 - landingPhase) * this.landingForce;
        this.speed = three_module_min_js_1.MathUtils.damp(this.speed, actual, 13, dt);
        this.acceleration = three_module_min_js_1.MathUtils.damp(this.acceleration, limit((this.speed - oldSpeed) / dt, -10, 10), 10, dt);
        const yawRate = (0, exports.shortAngle)(yaw - this.lastYaw) / dt;
        this.turn = three_module_min_js_1.MathUtils.damp(this.turn, limit(yawRate, -8, 8), 13, dt);
        this.lastX = x;
        this.lastZ = z;
        this.lastYaw = yaw;
        if (dist > 0.0005) {
            this.dirX = dx / dist;
            this.dirZ = dz / dist;
        }
        const tread = actual > .16 && !air ? Math.abs(sample(x + this.dirX * .40 * scale, z + this.dirZ * .40 * scale) - sample(x - this.dirX * .10 * scale, z - this.dirZ * .10 * scale)) / scale : 0;
        this.stair = three_module_min_js_1.MathUtils.damp(this.stair, three_module_min_js_1.MathUtils.smoothstep(tread, .048, .175), 9, dt);
        const travel = actual / scale;
        const lateral = Math.min(1, Math.abs(this.sideSpeed) / Math.max(.3, this.speed));
        const reverse = Math.max(0, -this.forwardSpeed / Math.max(.3, this.speed));
        this.run = three_module_min_js_1.MathUtils.damp(this.run, three_module_min_js_1.MathUtils.smoothstep(travel, 2.08, 3.75) * (1 - .49 * lateral - .42 * reverse), 8, dt);
        const run = this.run;
        const rollWeight = Math.max(0, 1 - .96 * lateral - 1.18 * reverse);
        const walkStride = limit(.50 + .414 * Math.sqrt(travel) + .239 * travel, .52, 1.63);
        const runStride = travel / (1.45 + .21 * three_module_min_js_1.MathUtils.smoothstep(travel, 2.6, 6.25));
        const corner = three_module_min_js_1.MathUtils.smoothstep(Math.abs(this.turn), 1.3, 5) * three_module_min_js_1.MathUtils.smoothstep(travel, .7, 2.9);
        const stride = scale * Math.max(.50, mix(walkStride, runStride, run)) * gait.stride * (1 - .31 * lateral - .16 * reverse) * (1 - .19 * this.stair) * (1 - .17 * corner);
        const duty = Math.min(mix(.62, .255, run), mix(.775, .785, run) * scale / stride);
        const leadPart = mix(.48, .45, run);
        const track = halfStance * scale + lateral * Math.max(0, stride * .25 + .039 * scale - halfStance * scale);
        const firstSupportPhase = Math.max(0, duty - .5) + .012;
        if (!air && this.landingTime > .2 && actual >= .12 && this.elapsedStill > .15) {
            const left = (this.feet[0].x - x) * (-si) + (this.feet[0].z - z) * (-co);
            const right = (this.feet[1].x - x) * (-si) + (this.feet[1].z - z) * (-co);
            const swing = left < right - .025 ? 0 : right < left - .025 ? 1 : (this.turn > 0 ? 1 : 0);
            this.phase = firstSupportPhase + (swing === 0 ? .5 : 0);
        }
        this.elapsedStill = actual < 0.12 ? this.elapsedStill + dt : 0;
        this.phase = (this.phase + dist / stride) % 1;
        if (touchdown)
            this.phase = firstSupportPhase + (this.leadSide === 1 ? .5 : 0);
        const turnSteps = !air && !touchdown && travel < 1.85 && Math.abs(yawRate) > 2.5;
        if (turnSteps || this.pivotLeg >= 0 && !air && !touchdown && travel < 2.15) {
            this.recoverLeg = -1;
            this.pivotStep(dt, x, z, yaw, yawRate, actual, scale, halfStance, turnSteps, sample);
            return;
        }
        this.pivotLeg = -1;
        this.pivotLoad = three_module_min_js_1.MathUtils.damp(this.pivotLoad, 0, 14, dt);
        this.pivotAmount = three_module_min_js_1.MathUtils.damp(this.pivotAmount, 0, 14, dt);
        const trailing = this.feet[this.leadSide === 1 ? 0 : 1];
        if (!air && !touchdown && this.landingTime < .21 && travel < .58 && !trailing.planted) {
            this.settle(dt, x, z, yaw, scale, halfStance, sample);
            return;
        }
        if ((actual >= .12 || air || touchdown) && this.recoverLeg >= 0) {
            this.feet[this.recoverLeg].goalX = NaN;
            this.recoverLeg = -1;
        }
        if (!air && !touchdown && actual < .12 && (this.elapsedStill > .035 || this.speed < .105)) {
            this.settle(dt, x, z, yaw, scale, halfStance, sample);
            return;
        }
        for (let i = 0; i < 2; i++) {
            const f = this.feet[i];
            const cx = x + co * f.side * track, cz = z - si * f.side * track;
            const phase = (this.phase + i * .5 + (i === 1 && style === 'limp' ? .058 : 0)) % 1;
            if (air) {
                const elevation = Math.max(0, y - bootFloor(cx, cz, yaw, scale, sample));
                const ascending = dy >= 0, front = f.side === this.leadSide;
                const launch = three_module_min_js_1.MathUtils.smoothstep(this.airborneTime, 0, .18);
                const extension = ascending ? 0 : 1 - three_module_min_js_1.MathUtils.smoothstep(elevation / scale, .035, .73);
                const travelBlend = three_module_min_js_1.MathUtils.smoothstep(travel, .4, 3.8);
                const tuck = launch * (1 - extension * (front ? 1 : .42));
                const landingReach = mix(.055, Math.min(.27, duty * leadPart * stride / scale), Math.min(1, travel));
                const reach = (front ? .20 + .14 * travelBlend : -.16 - .15 * travelBlend) * tuck + (front ? landingReach : -.055) * extension;
                const targetX = cx + this.dirX * reach * scale, targetZ = cz + this.dirZ * reach * scale;
                f.x = three_module_min_js_1.MathUtils.damp(f.x + dx, targetX, 18, dt);
                f.z = three_module_min_js_1.MathUtils.damp(f.z + dz, targetZ, 18, dt);
                f.y = y + (tuck * (front ? .31 : .14 + .065 * travelBlend) - (front ? 0 : .025) * (1 - launch)) * scale;
                f.pitch = front ? .10 * tuck + .10 * extension : -.36 * (1 - launch) - .66 * tuck;
                f.planted = false;
                f.yaw = yaw;
                f.lift = tuck;
                f.originX = f.x;
                f.originY = f.y;
                f.originZ = f.z;
                continue;
            }
            if (touchdown) {
                if (f.side !== this.leadSide) {
                    f.x += dx;
                    f.z += dz;
                    f.y = Math.max(f.y + dy, bootFloor(f.x, f.z, yaw, scale, sample) + .04 * scale);
                    swingOrigin(f);
                    continue;
                }
                const reach = mix(.055 * scale, Math.min(.27 * scale, duty * leadPart * stride), Math.min(1, travel));
                shoeOnGround(f, cx + this.dirX * reach, cz + this.dirZ * reach, yaw, scale, sample);
                rotateOnSole(f, .10 * (1 - run), scale);
                f.stamp++;
                this.footfall = f;
                continue;
            }
            if (phase < duty) {
                if (!f.planted) {
                    const reach = (duty * leadPart - phase) * stride, footYaw = yaw + f.side * gait.toeOut * (1 - lateral);
                    shoeOnGround(f, cx + this.dirX * reach, cz + this.dirZ * reach, footYaw, scale, sample);
                    f.stamp++;
                    this.footfall = f;
                }
                const pushOff = limit(this.acceleration * .023, 0, .12) * three_module_min_js_1.MathUtils.smoothstep(phase / duty, .45, .97);
                f.loading = Math.sin(Math.PI * Math.min(1, phase / (duty * .83)));
                rotateOnSole(f, ((0, locomotion_poses_js_1.supportPitch)(phase / duty, run) - pushOff) * rollWeight * (1 - .28 * this.stair), scale);
            }
            else {
                const u = (phase - duty) / (1 - duty);
                const travelWeight = (0, locomotion_poses_js_1.swingTravel)(u, stride / scale, duty, leadPart);
                const arc = (0, locomotion_poses_js_1.swingArc)(u, run, this.swing);
                const lead = (1 - phase + duty * leadPart) * stride, goalX = cx + this.dirX * lead, goalZ = cz + this.dirZ * lead;
                if (f.planted || !Number.isFinite(f.goalX)) {
                    swingOrigin(f);
                    f.goalX = goalX;
                    f.goalZ = goalZ;
                }
                const replant = 1 - Math.exp(-dt * (16 + 25 * u));
                f.goalX = mix(f.goalX, goalX, replant);
                f.goalZ = mix(f.goalZ, goalZ, replant);
                f.x = mix(f.originX, f.goalX, travelWeight);
                f.z = mix(f.originZ, f.goalZ, travelWeight);
                // During recovery the heel folds behind the hip before the knee comes through.
                const heelBack = arc.trail * .74 * run * rollWeight * (1 - this.stair) * scale;
                f.x -= this.dirX * heelBack;
                f.z -= this.dirZ * heelBack;
                const reach = Math.hypot(f.x - cx, f.z - cz), maxReach = mix(.54, .65, run) * scale;
                if (reach > maxReach) {
                    f.x = mix(cx, f.x, maxReach / reach);
                    f.z = mix(cz, f.z, maxReach / reach);
                }
                const goalFloor = bootFloor(f.goalX, f.goalZ, yaw, scale, sample);
                const stepRise = Math.max(0, goalFloor - f.originY);
                f.lift = (style === 'limp' && i === 1 ? .71 : 1) * gait.lift * (arc.up + Math.sin(Math.PI * u) * Math.min(.17, stepRise * .65 + this.stair * .040)) * scale;
                f.pitch = mix(f.originPitch, arc.pitch * rollWeight, Math.min(1, u * 5));
                f.yaw = f.originYaw + (0, exports.shortAngle)(yaw + f.side * gait.toeOut * (1 - lateral) - f.originYaw) * travelWeight;
                const clearance = Math.max(locomotion_poses_js_1.heelPivot * Math.sin(f.pitch), locomotion_poses_js_1.toePivot * Math.sin(f.pitch)) * scale;
                const currentFloor = bootFloor(f.x, f.z, f.yaw, scale, sample);
                const swingFloor = currentFloor + clearance - locomotion_poses_js_1.soleHeight * scale;
                const swingY = Math.max(mix(f.originY, goalFloor - locomotion_poses_js_1.soleHeight * scale, travelWeight), swingFloor) + f.lift;
                f.y = this.landingTime < .14 && f.side !== this.leadSide
                    ? Math.max(swingFloor, three_module_min_js_1.MathUtils.damp(f.y, swingY, 20, dt)) : swingY;
            }
        }
    }
    pivotStep(dt, x, z, yaw, yawRate, speed, scale, halfStance, turning, sample) {
        const co = Math.cos(yaw), si = Math.sin(yaw);
        if (this.pivotLeg < 0) {
            this.pivotDuration = limit(.195 - .013 * Math.abs(yawRate) - .012 * speed, .105, .195);
            const ahead = yaw + limit(yawRate * this.pivotDuration, -.95, .95);
            const cost = (f) => {
                const goalX = x + Math.cos(ahead) * f.side * halfStance * scale;
                const goalZ = z - Math.sin(ahead) * f.side * halfStance * scale;
                return Math.hypot(f.x - goalX, f.z - goalZ) + (f.planted ? 0 : .9) * scale;
            };
            this.pivotLeg = cost(this.feet[0]) >= cost(this.feet[1]) ? 0 : 1;
            this.pivotClock = 0;
            swingOrigin(this.feet[this.pivotLeg]);
        }
        const leg = this.pivotLeg, f = this.feet[leg], support = this.feet[1 - leg];
        if (!support.planted) {
            shoeOnGround(support, support.x, support.z, support.yaw, scale, sample);
            rotateOnSole(support, 0, scale);
            support.stamp++;
            this.footfall = support;
        }
        const supportReach = Math.hypot(support.x - x, support.z - z) / scale;
        const rush = three_module_min_js_1.MathUtils.smoothstep(supportReach, .38, .55);
        this.pivotClock += dt * (1 + 2 * rush);
        const t = Math.min(1, this.pivotClock / this.pivotDuration), ease = t * t * (3 - 2 * t);
        const remaining = (1 - t) * this.pivotDuration;
        const stepYaw = yaw + limit(yawRate * (remaining + .04), -.94, .94);
        const ahead = Math.min(.38 * scale, speed * (remaining + .074));
        const width = (halfStance + .025) * scale;
        const gx = x + Math.cos(stepYaw) * f.side * width + this.dirX * ahead;
        const gz = z - Math.sin(stepYaw) * f.side * width + this.dirZ * ahead;
        f.x = mix(f.originX, gx, ease);
        f.z = mix(f.originZ, gz, ease);
        const separation = ((f.x - support.x) * co - (f.z - support.z) * si) * f.side;
        const clearance = Math.max(0, .116 * scale - separation);
        f.x += co * f.side * clearance;
        f.z -= si * f.side * clearance;
        f.yaw = f.originYaw + (0, exports.shortAngle)(stepYaw - f.originYaw) * ease;
        const arc = Math.sin(Math.PI * t);
        f.pitch = mix(f.originPitch, 0, ease) + arc * .07;
        f.lift = arc * (.065 + .02 * Math.min(1, speed)) * scale;
        f.y = Math.max(mix(f.originY, bootFloor(gx, gz, stepYaw, scale, sample) - locomotion_poses_js_1.soleHeight * scale, ease), bootFloor(f.x, f.z, f.yaw, scale, sample) - locomotion_poses_js_1.soleHeight * scale) + f.lift;
        this.pivotAmount = three_module_min_js_1.MathUtils.damp(this.pivotAmount, 1, 16, dt);
        this.pivotLoad = three_module_min_js_1.MathUtils.damp(this.pivotLoad, support.side * arc, 16, dt);
        if (t === 1) {
            shoeOnGround(f, f.x, f.z, stepYaw, scale, sample);
            rotateOnSole(f, 0, scale);
            f.stamp++;
            this.footfall = f;
            this.phase = leg === 0 ? 0 : .5;
            this.pivotLeg = turning ? 1 - leg : -1;
            this.pivotClock = 0;
            if (turning || speed / scale > 2.2 || supportReach > .36)
                swingOrigin(support);
        }
    }
    settle(dt, x, z, yaw, scale, halfStance, sample) {
        const co = Math.cos(yaw), si = Math.sin(yaw);
        if (this.recoverLeg < 0) {
            let strongest = 0;
            for (let i = 0; i < 2; i++) {
                const f = this.feet[i], cx = x + co * f.side * halfStance * scale, cz = z - si * f.side * halfStance * scale;
                const shift = Math.hypot(cx - f.x, cz - f.z);
                const angle = Math.abs((0, exports.shortAngle)(f.yaw - yaw));
                if (f.planted && shift < .104 * scale && angle < .36) {
                    if (Math.abs(f.pitch) > .0001)
                        rotateOnSole(f, three_module_min_js_1.MathUtils.damp(f.pitch, 0, 16, dt), scale);
                    continue;
                }
                const need = (f.planted ? 0 : 1) + Math.max(0, shift / scale - .104) + Math.max(0, angle - .36) * .25;
                if (need > strongest) {
                    strongest = need;
                    this.recoverLeg = i;
                }
            }
            if (this.recoverLeg < 0)
                return;
            const f = this.feet[this.recoverLeg];
            const distance = Math.hypot(x + co * f.side * halfStance * scale - f.x, z - si * f.side * halfStance * scale - f.z);
            this.recoverTime = 0;
            this.recoverDuration = .13 + Math.min(.12, distance * .23);
            swingOrigin(f);
        }
        const f = this.feet[this.recoverLeg];
        const u = Math.min(1, (this.recoverTime += dt) / this.recoverDuration);
        const t = u * u * (3 - 2 * u), cx = x + co * f.side * halfStance * scale, cz = z - si * f.side * halfStance * scale;
        f.x = mix(f.originX, cx, t);
        f.z = mix(f.originZ, cz, t);
        const landingTrail = this.landingTime < .24 && f.side !== this.leadSide;
        const stepArc = landingTrail ? 0 : Math.sin(Math.PI * u);
        f.lift = stepArc * .057 * scale;
        f.pitch = mix(f.originPitch, 0, t) + stepArc * .12;
        f.yaw = f.originYaw + (0, exports.shortAngle)(yaw - f.originYaw) * t;
        const targetY = bootFloor(cx, cz, yaw, scale, sample) - locomotion_poses_js_1.soleHeight * scale;
        f.y = Math.max(mix(f.originY, targetY, t), bootFloor(f.x, f.z, f.yaw, scale, sample) - locomotion_poses_js_1.soleHeight * scale) + f.lift;
        if (u === 1) {
            shoeOnGround(f, cx, cz, yaw, scale, sample);
            rotateOnSole(f, 0, scale);
            f.stamp++;
            this.recoverLeg = -1;
            this.footfall = f;
            if (landingTrail)
                this.phase = f.side === -1 ? 0 : .5;
        }
    }
}
exports.Gait = Gait;
