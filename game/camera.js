"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowCamera = void 0;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const THREE = require("../engine/three.module.min.js");
const house_layout_js_1 = require("./house-layout.js");
const world_layout_js_1 = require("./world-layout.js");
const camera_volume_js_1 = require("./camera-volume.js");
const deltaAngle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const limit = THREE.MathUtils.clamp;
const ease = (rate, dt) => 1 - Math.exp(-dt * rate);
const armLengths = {
    near: { foot: 2.85, room: 1.66, car: -.95 },
    normal: { foot: 3.95, room: 2.25, car: 0 },
    far: { foot: 5.35, room: 2.92, car: 1.45 },
};
class FollowCamera {
    camera = new THREE.PerspectiveCamera(58, 1, .075, 310);
    shoulder = 1;
    rear = false;
    distancePreset = 'normal';
    carFollow = 1;
    stepMotion = 0;
    stepPhase = 0;
    yaw;
    pitch = -.035;
    lookIdle = 0;
    manualFootDirection = false;
    footIntentGrace = 0;
    footMoved = 0;
    rearBlend = 0;
    doorFocus = new THREE.Vector3();
    doorBlend = 0;
    pivot = new THREE.Vector3();
    target = new THREE.Vector3();
    sight = new THREE.Vector3();
    lagged = new THREE.Vector3();
    direction = new THREE.Vector3();
    speedView = 0;
    positioned = false;
    arm = 0;
    get lookPitch() { return this.pitch; }
    get distance() { return this.arm; }
    constructor(yaw) { this.yaw = yaw; }
    reset(yaw) {
        this.yaw = yaw;
        this.positioned = false;
        this.lookIdle = 0;
        this.speedView = 0;
        this.manualFootDirection = false;
        this.footIntentGrace = 0;
        this.footMoved = 0;
        this.rearBlend = 0;
        this.doorBlend = 0;
    }
    setFootIntent(x, y) {
        this.manualFootDirection = Math.abs(x) > .15 || y < -.16;
    }
    look(dx, dy) {
        if (!dx && !dy)
            return;
        this.yaw -= dx * .005;
        this.pitch = limit(this.pitch + dy * .004, -.21, .95);
        this.lookIdle = 2.3;
    }
    update(dt, hero, car, vehicles, ignore = car?.id, tram, inside = false, cockpit = false, doorCar, doorSide) {
        this.lookIdle -= dt;
        let doorWeight = 0;
        if (doorCar && doorSide) {
            const cabin = (0, vehicle_cabin_js_1.carCabin)(doorCar.kind);
            const x = doorSide * cabin.halfWidth, z = cabin.hingeZ + cabin.doorLength * .55;
            const co = Math.cos(doorCar.yaw), si = Math.sin(doorCar.yaw);
            this.doorFocus.set(doorCar.x + x * co + z * si, doorCar.y + cabin.seatY + .42, doorCar.z - x * si + z * co);
            const distance = Math.hypot(hero.x - this.doorFocus.x, hero.z - this.doorFocus.z);
            doorWeight = 1 - THREE.MathUtils.smoothstep(distance, 2.1, 4.8);
            if (this.lookIdle <= 0 && !this.rear) {
                // Take the shorter arc to a three-quarter view on the side actually used.
                const quarter = Math.cos(this.yaw - doorCar.yaw) >= 0 ? 1.05 : Math.PI - 1.05;
                const gap = deltaAngle(this.yaw, doorCar.yaw + doorSide * quarter);
                this.yaw += limit(gap, -1.2, 1.2) * ease(3.8, dt) * doorWeight;
            }
        }
        this.doorBlend = THREE.MathUtils.damp(this.doorBlend, doorWeight, doorCar ? 6 : 5, dt);
        this.footIntentGrace = this.manualFootDirection ? .28 : this.footIntentGrace - dt;
        this.footMoved = !car && hero.speed > .45 ? 1.55 : this.footMoved - dt;
        const rear = Number(this.rear);
        this.rearBlend = car ? rear : THREE.MathUtils.lerp(this.rearBlend, rear, ease(this.rear ? 16 : 12, dt));
        const speed = Math.abs(car?.speed ?? 0), chase = car && !cockpit && !inside;
        const pace = chase ? limit((speed - 1.5) / 20, 0, 1) : 0;
        this.speedView += (pace - this.speedView) * ease(4, dt);
        if (car && !this.freeOrbit && !this.rear && this.lookIdle <= 0 && speed > 1.4) {
            let heading = car.yaw;
            if (chase && car.speed > 3) {
                const course = Math.atan2(-car.vx, -car.vz);
                const slip = limit(deltaAngle(car.yaw, course), -.52, .52);
                heading += slip * .28 - car.steer * .15 * this.speedView;
            }
            this.yaw += deltaAngle(this.yaw, heading) * ease((3.1 + 2.2 * this.speedView)*this.carFollow, dt);
            const pitch = cockpit ? .18 : .035 + .075 * this.speedView;
            this.pitch += (pitch - this.pitch) * ease(cockpit ? .9 : 2.8, dt);
        }
        if (!car && !this.freeOrbit && !this.rear && this.lookIdle <= 0 && this.footIntentGrace <= 0 && this.footMoved > 0 && doorWeight < .05) {
            const gap = deltaAngle(this.yaw, hero.yaw);
            if (Math.abs(gap) > .035)
                this.yaw += limit(gap, -1.55, 1.55) * ease(3.1, dt);
            this.pitch += (-.035 - this.pitch) * ease(1.3, dt);
        }
        const fov = (this.camera.aspect < 1 ? 68 : 58) + (chase && !this.rear ? 1.5 + 8 * this.speedView : 0);
        if (Math.abs(this.camera.fov - fov) > .12) {
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();
        }
        const subject = car ?? hero;
        const y = car ? (0, world_layout_js_1.groundHeight)(car.x, car.z) : hero.y;
        const reverseBase = this.yaw + (car ? deltaAngle(this.yaw, car.yaw) : deltaAngle(this.yaw, hero.yaw)) * this.rearBlend;
        const angle = reverseBase + Math.PI * this.rearBlend, sin = Math.sin(angle), cos = Math.cos(angle);
        const shape = car ? vehicle_cabin_js_1.specs[car.kind] : null;
        this.stepPhase = (this.stepPhase + Math.abs(hero.speed)*dt*4.2) % (2*Math.PI);
        const stepRise = !shape ? this.stepMotion*.045*Math.min(1,Math.abs(hero.speed)/2)*Math.sin(this.stepPhase) : 0;
        const pivotRise = shape ? chase ? shape.belt + .08 * this.speedView : 1.32 : 1.48;
        this.pivot.set(subject.x, y + pivotRise + stepRise, subject.z);
        const reset = !this.positioned || this.pivot.distanceToSquared(this.lagged) > 30;
        if (reset) {
            this.lagged.copy(this.pivot);
            this.positioned = true;
        }
        this.target.copy(this.pivot);
        if (!car) {
            this.target.x += cos * .4 * this.shoulder;
            this.target.z -= sin * .4 * this.shoulder;
        }
        if (this.doorBlend > .001)
            this.target.lerp(this.doorFocus, .70 * this.doorBlend);
        const previousHeight = this.lagged.y;
        this.lagged.lerp(this.target, 1 - Math.exp(-dt * (car ? 15 : 19)));
        if (!car)
            this.lagged.y = THREE.MathUtils.damp(previousHeight, this.target.y, 8, dt);
        this.direction.subVectors(this.lagged, this.pivot);
        const radius = limit(this.camera.near * Math.tan(this.camera.fov * Math.PI / 360) * Math.hypot(1, this.camera.aspect) + .075, .17, .28);
        const shift = this.direction.length();
        if (shift > .001) {
            this.direction.divideScalar(shift);
            this.pivot.addScaledVector(this.direction, inside ? (0, house_layout_js_1.houseClearance)(this.pivot, this.direction, shift, radius + .025) : (0, camera_volume_js_1.cameraClearance)(this.pivot, this.direction, shift, radius + .025, vehicles, ignore, tram));
        }
        const lengths = armLengths[this.distancePreset];
        const normalArm = inside ? lengths.room : shape ? chase ? 5.95 + lengths.car + Math.max(0, shape.roof - 1.56) * 1.19 + (1 - this.rearBlend) * 1.7 * this.speedView : 6.55 : lengths.foot;
        const wanted = THREE.MathUtils.lerp(normalArm, Math.max(4.1, lengths.foot), this.doorBlend);
        const pitch = THREE.MathUtils.lerp(this.pitch, .085, this.rearBlend);
        const tallBody = shape ? limit((shape.roof - 1.60) / .63, 0, 1) : 0;
        const armRise = chase ? .20 - (.229 - .05 * tallBody) * this.speedView : .13;
        this.direction.set(sin * Math.cos(pitch), Math.sin(pitch) + armRise, cos * Math.cos(pitch)).normalize();
        const safe = inside ? (0, house_layout_js_1.houseClearance)(this.pivot, this.direction, wanted, radius) : (0, camera_volume_js_1.cameraClearance)(this.pivot, this.direction, wanted, radius, vehicles, ignore, tram);
        const target = safe < wanted - .005 ? Math.max(.015, safe - .22) : wanted;
        if (reset)
            this.arm = target;
        else
            this.arm += (target - this.arm) * (1 - Math.exp(-dt * (target < this.arm ? 16 : 3.4)));
        this.arm = Math.max(.001, Math.min(safe, this.arm));
        this.camera.position.copy(this.pivot).addScaledVector(this.direction, this.arm);
        this.sight.copy(this.pivot);
        if (chase && !this.rear) {
            const lead = (.43 + this.speedView * 1.48) * limit((this.arm - 1.2) / 4, 0, 1);
            this.sight.x -= sin * lead;
            this.sight.z -= cos * lead;
            const corner = THREE.MathUtils.clamp(car.steer, -1, 1) * this.speedView * .72 * limit(this.arm / 5, 0, 1);
            this.sight.x += cos * corner;
            this.sight.z -= sin * corner;
            this.sight.y += .10;
        }
        this.camera.lookAt(this.sight);
        this.camera.updateMatrixWorld();
    }
}
exports.FollowCamera = FollowCamera;
