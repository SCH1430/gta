"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeVehicleMotion = makeVehicleMotion;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_impact_damage_js_1 = require("./vehicle-impact-damage.js");
const model_vehicle_wear_js_1 = require("./model-vehicle-wear.js");
const ride = {
    hatch: { hz: 12.0, damping: .85, dive: .0047, roll: .0056 },
    sedan: { hz: 9.9, damping: .75, dive: .0077, roll: .0075 },
    patrol: { hz: 10.8, damping: .78, dive: .0061, roll: .0068 },
    van: { hz: 8.2, damping: .62, dive: .0088, roll: .0113 },
    suv: { hz: 8.8, damping: .77, dive: .0081, roll: .0103 },
    pickup: { hz: 8.4, damping: .68, dive: .0083, roll: .0106 },
    coupe: { hz: 13.3, damping: .88, dive: .0037, roll: .0044 },
    taxi: { hz: 10.6, damping: .80, dive: .0057, roll: .0062 },
    wagon: { hz: 8.0, damping: .72, dive: .008, roll: .0098 },
    towtruck: { hz: 7.3, damping: .80, dive: .0078, roll: .0081 },
    utility: { hz: 7.0, damping: .72, dive: .0085, roll: .0090 }
};
const clamp = T.MathUtils.clamp;
class Spring {
    value = 0;
    rate = 0;
    step(target, dt, hz, damping, snap = false) {
        if (snap) {
            this.value = target;
            this.rate = 0;
            return target;
        }
        let left = Math.min(.16, dt);
        while (left > 0) {
            const h = Math.min(left, 1 / 120);
            this.rate += ((target - this.value) * hz * hz - 2 * damping * hz * this.rate) * h;
            this.value += this.rate * h;
            left -= h;
        }
        return this.value;
    }
}
let scar;
function paintScar() {
    if (!scar) {
        const b = new model_geometry_js_1.Batch();
        for (let i = 0; i < 4; i++) {
            const x = -.161 + i * .019, y = (i - 1.5) * .020;
            const z = i * .0003, peak = y + .006 + i * .001;
            b.tri([x, y, z], [.18 - i * .029, y + .024 - i * .002, z], [-.052, peak + .014, z], i === 0 ? '#d7c8b1' : '#a8aaa0', [0, 0, 1]);
            b.tri([x + .02, y - .004, z + .0001], [.15 - i * .023, y + .020, z + .0001], [-.054, peak + .002, z + .0001], '#525960', [0, 0, 1]);
        }
        scar = b.mesh();
    }
    return scar.clone();
}
function makeVehicleMotion(kind, root, shell, wheels, doors) {
    const s = vehicle_cabin_js_1.specs[kind], c = (0, vehicle_cabin_js_1.carCabin)(kind), tune = ride[kind], wheelY = [0, 0, 0, 0];
    const pitch = new Spring(), roll = new Spring(), lift = new Spring();
    const windowPanes = doors.map(d => d.getObjectByName('side-window'));
    const mirrors = doors.map(d => d.getObjectByName('folding-mirror'));
    const scars = [];
    let prevSpeed, distance = 0, accel = 0;
    let previousMarks;
    let previousPatina;
    let previousImpressions, previousDents = 0;
    function showMarks(marks, systems) {
        const patina = systems?.patina, impressions = systems?.impressions, dents = (0, model_vehicle_wear_js_1.panelWearKey)(systems);
        if (marks === previousMarks && patina === previousPatina && impressions === previousImpressions && dents === previousDents)
            return;
        previousMarks = marks;
        previousPatina = patina;
        previousImpressions = impressions;
        previousDents = dents;
        const recent = [...(patina ?? []), ...(marks?.slice(-4) ?? [])].slice(-8), damage = (0, model_vehicle_wear_js_1.displayedImpressions)(s, systems);
        for (const m of scars)
            m.visible = false;
        for (let i = 0; i < recent.length; i++) {
            const hit = recent[i], m = scars[i] ?? (scars[i] = paintScar());
            const side = hit.x < 0 ? -1 : 1, front = hit.z < 0;
            const end = front ? s.front : s.rear;
            const nearEnd = Math.abs(end - hit.z) < .35 && Math.abs(hit.x) < s.w * .87;
            m.visible = true;
            m.scale.setScalar(.55 + .8 * clamp(hit.severity ?? .5, 0, 1));
            if (nearEnd) {
                shell.add(m);
                m.rotation.y = front ? Math.PI : 0;
                m.position.set(clamp(hit.x, -s.w * .67, s.w * .67), .477, end + (front ? -.085 : .087));
            }
            else {
                const z = clamp(hit.z, s.front + .26, s.rear - .21);
                const attachDoor = z > c.hingeZ + .14 && z < c.hingeZ + c.doorLength - .12;
                const anchor = attachDoor ? doors[side < 0 ? 0 : 1] : shell;
                anchor.add(m);
                const nose = clamp((s.front + .40 - z) / .40, 0, 1);
                const tail = clamp((z - s.rear + .33) / .33, 0, 1);
                const x = side * (s.w * (1 - .18 * nose - .13 * tail) + .016);
                m.position.set(x, .585 + (i % 3) * .025, z);
                m.rotation.y = side * Math.PI / 2 + side * (tail * .30 - nose * .34);
                (0, vehicle_impact_damage_js_1.impactBodyPoint)(s, damage, m.position.x, m.position.y, m.position.z, m.position);
                if (attachDoor)
                    m.position.sub(anchor.position);
            }
            if (nearEnd)
                (0, vehicle_impact_damage_js_1.impactBodyPoint)(s, damage, m.position.x, m.position.y, m.position.z, m.position);
        }
    }
    return (dt, speed, steer, visual) => {
        const road = visual.groundHeight, theta = root.rotation.y, cos = Math.cos(theta), sin = Math.sin(theta);
        const axle = s.rw - s.fw, track = 2 * (s.w - .073);
        for (let i = 0; i < 4; i++) {
            const wheel = wheels[i], p = wheel.position;
            const ground = road ? road(root.position.x + p.x * cos + p.z * sin, root.position.z - p.x * sin + p.z * cos) : root.position.y;
            wheelY[i] = clamp(ground - root.position.y, -.35, .35);
            p.y = s.r * ((visual.systems?.punctures ?? 0) & (1 << i) ? .83 : 1) + wheelY[i];
        }
        if (prevSpeed === undefined)
            prevSpeed = speed;
        const raw = clamp((speed - prevSpeed) / Math.max(.005, dt), -14, 11);
        prevSpeed = speed;
        if (visual.snapshotPose)
            accel = 0;
        else
            accel += (raw - accel) * (1 - Math.exp(-dt * 9));
        const [fl, fr, rl, rr] = wheelY;
        const grade = (fl + fr - rl - rr) * .5 / axle, crossfall = (fr + rr - fl - rl) * .5 / track;
        distance = (distance + Math.abs(speed) * dt) % 1000;
        const ripple = .003 * Math.min(1, Math.abs(speed) * .4) * (Math.sin(distance * 2.8) + .5 * Math.sin(distance * 4.2));
        const lateral = steer * Math.min(8.8, speed * speed * .085);
        const supported = (visual.systems?.load ?? 0) + (visual.systems?.towedMass ?? 0) * .48;
        const load = supported * (visual.systems?.reinforcedSuspension ? .60 : 1), high = visual.systems?.high ?? false;
        shell.rotation.x = pitch.step(grade + accel * tune.dive + load * .000028 + (visual.impactLean?.pitch ?? 0), dt, tune.hz, tune.damping, visual.snapshotPose);
        shell.rotation.z = roll.step(crossfall + lateral * tune.roll * (1 + load / 900 + (high ? .40 : 0)) + (visual.impactLean?.roll ?? 0), dt, tune.hz, tune.damping, visual.snapshotPose);
        shell.position.y = lift.step((fl + fr + rl + rr) * .25 + ripple - load * .00014, dt, tune.hz, tune.damping, visual.snapshotPose);
        doors.forEach((d, i) => {
            const side = i === 0 ? -1 : 1;
            const opening = visual.doorSide === side ? visual.doorOpen : side === 1 ? visual.systems?.mobilityDoor : 0;
            d.rotation.y = (0, vehicle_cabin_js_1.doorAngle)(side, opening ?? 0);
        });
        for (const pane of windowPanes)
            if (pane) {
                pane.position.y += ((visual.systems?.windowsOpen ? -.62 : 0) - pane.position.y) * (visual.snapshotPose ? 1 : 1 - Math.exp(-dt * 6));
                pane.visible = pane.position.y > -.52;
            }
        mirrors.forEach((m, i) => {
            if (m) {
                const folded = i === 0 ? visual.systems?.leftMirror : visual.systems?.rightMirror;
                m.rotation.y += ((folded ? (i === 0 ? 1 : -1) * 1.38 : 0) - m.rotation.y) * (visual.snapshotPose ? 1 : 1 - Math.exp(-dt * 12));
            }
        });
        showMarks(visual.scrapes, visual.systems);
    };
}
