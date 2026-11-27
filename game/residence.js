"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Residence = void 0;
const campus = require("./campus-layout.js").campus;
const campusMotion = require("./campus-movement.js");
const house_layout_js_1 = require("./house-layout.js");
const interior_residents_js_1 = require("./interior-residents.js");
const interior_life_js_1 = require("./interior-life.js");
const pedestrian_controller_js_1 = require("./pedestrian-controller.js");
const limit = (x) => Math.max(0, Math.min(1, x));
const ease = (v) => { const x = limit(v); return x * x * (3 - 2 * x); };
const angle = (n) => Math.atan2(Math.sin(n), Math.cos(n));
const pose = (x, z, yaw) => ({ x, z, yaw, y: (0, house_layout_js_1.houseFloor)(x, z), speed: 0 });
const mix = (a, b, t) => a + (b - a) * t;
class Residence extends interior_life_js_1.InteriorLife {
    door = null;
    pedestrian = new pedestrian_controller_js_1.PedestrianController();
    vertical = 0;
    get inside() { return this.avatar !== null; }
    get open() {
        const t = this.door?.t ?? 0;
        return Math.max(this.cultureHold ?? 0, this.neighbourHold || 0, ease((t - .12) / .33) * (1 - ease((t - .69) / .31)));
    }
    get grip() {
        const d = this.door;
        if (!d || d.entering === this.inside)
            return null;
        return { amount: ease(d.t / .15) * (1 - ease((d.t - .37) / .11)), target: (0, house_layout_js_1.houseDoorGrip)(this.inside, this.open) };
    }
    get fade() { const t = this.door?.t ?? 0; return .93 * ease((t - .435) / .10) * (1 - ease((t - .535) / .11)); }
    save() { return { ...this.domainSave(), avatar: this.avatar, door: this.door, vertical: this.vertical }; }
    restore(state) {
        this.pedestrian.reset();
        this.avatar = state?.avatar && Number.isFinite(state.avatar.x) && Number.isFinite(state.avatar.z) ? { ...state.avatar } : null;
        this.domainRestore(state);
        this.door = state?.door?.origin && state.door.landing && Number.isFinite(state.door.t) ? structuredClone(state.door) : null;
        this.vertical = Number.isFinite(state?.vertical) ? state.vertical : 0;
        if (this.avatar && this.entry === 'school1') {
            const a = this.avatar;
            const oldFloor = Math.round((a.x - 300) / 60);
            const legacy = oldFloor >= 0 && oldFloor <= 2 && Math.abs(a.x - (300 + oldFloor * 60)) <= 13 && Math.abs(a.z) <= 12;
            if (legacy || !campusMotion.validSpawn(a.x, a.z, a.y)) {
                const id = legacy ? 'school' + (1 + oldFloor) : campusMotion.zoneFor(a.x, a.z, a.y);
                const floor = campus.floors[id] ?? campus.floors.school1;
                Object.assign(a, floor.entrance, { y: floor.floor, speed: 0 });
                this.vertical = 0;
            }
        }
    }
    options(outside, elapsed, minutes) { return this.door ? [] : super.options(outside, elapsed, minutes); }
    hint(outside) {
        if (this.door)
            return '';
        if (this.avatar)
            return this.zone === 'house' && (0, house_layout_js_1.canExitHouse)(this.avatar.x, this.avatar.z) ? 'Выйти на улицу' : '';
        return (0, house_layout_js_1.canEnterHouse)(outside.x, outside.z) ? 'Войти в дом' : '';
    }
    begin(outside, exitSafe) {
        if (this.door || !this.hint(outside))
            return false;
        const origins = [house_layout_js_1.houseOutside, ...[-.65, .65, -1.05, 1.05].map(dx => ({ x: house_layout_js_1.houseOutside.x + dx, z: house_layout_js_1.houseOutside.z + .28 }))];
        const landing = this.avatar ? origins.find(exitSafe) : house_layout_js_1.houseOutside;
        if (!landing)
            return false;
        this.pedestrian.reset();
        this.entry = 'house';
        this.door = { entering: !this.inside, t: 0, origin: { ...(this.avatar ?? outside) }, landing };
        return true;
    }
    act(id, outside, elapsed, exitSafe, minutes) {
        if (this.door || !this.options(outside, elapsed, minutes).some(o => o.id === id))
            return null;
        if (id === 'home:door-house' || id === 'home:exit-house') {
            return this.begin(outside, exitSafe) ? { text: '', sound: 'hinge' } : { text: 'Проход временно занят' };
        }
        this.vertical = 0;
        this.pedestrian.reset();
        return this.operate(id.slice(5), outside, elapsed, exitSafe);
    }
    jump() {
        const a = this.avatar;
        if (a && !this.door && a.y <= (0, house_layout_js_1.houseFloor)(a.x, a.z, a.y) + .035) {
            this.vertical = 3.6;
            a.y += .012;
        }
    }
    update(dt, input, outside) {
        this.tickLife(dt);
        if (this.peek)
            return;
        const d = this.door;
        if (d) {
            const before = d.t;
            d.t = Math.min(1, d.t + dt / 1.22);
            if (before < .535) {
                const active = this.avatar ?? outside, grip = (0, house_layout_js_1.houseDoorGrip)(this.inside, this.open);
                const yaw = d.entering ? 0 : Math.PI, normal = d.entering ? 1 : -1;
                const advance = ease(d.t / .32);
                const x = mix(d.origin.x, grip.x + (d.entering ? -.17 : .17), advance);
                const z = mix(d.origin.z, grip.z + normal * (.43 - .21 * ease((d.t - .32) / .21)), advance);
                active.speed = Math.hypot(x - active.x, z - active.z) / dt;
                active.x = x;
                active.z = z;
                active.yaw = d.origin.yaw + angle(yaw - d.origin.yaw) * advance;
                if (d.t >= .535) {
                    this.vertical = 0;
                    if (d.entering) {
                        this.avatar = pose(house_layout_js_1.houseSpawn.x, house_layout_js_1.houseSpawn.z, house_layout_js_1.houseSpawn.yaw);
                        Object.assign(outside, house_layout_js_1.houseOutside, { y: 0, speed: 0 });
                    }
                    else {
                        this.avatar = null;
                        Object.assign(outside, d.landing, { y: 0, yaw: house_layout_js_1.houseOutside.yaw, speed: 0 });
                    }
                }
            }
            if (d.t >= 1)
                this.door = null;
            return;
        }
        const a = this.avatar;
        if (!a)
            return;
        const wasGrounded = a.y <= (0, house_layout_js_1.houseFloor)(a.x, a.z, a.y) + .045 && this.vertical <= 0;
        const step = this.pedestrian.command(a, input, input.run ? 3.9 : 1.65, dt, wasGrounded);
        let moved = (0, house_layout_js_1.moveInHouse)(a.x, a.z, step.dx, step.dz, .30, a.y);
        if (this.zone === 'workshop') {
            const before = { ...moved };
            (0, interior_residents_js_1.keepResidentSpace)(moved, this.indoorClock);
            moved = (0, house_layout_js_1.moveInHouse)(before.x, before.z, moved.x - before.x, moved.z - before.z, .30, a.y);
        }
        const floor = moved.y ?? (0, house_layout_js_1.houseFloor)(moved.x, moved.z, a.y);
        this.pedestrian.resolve(a, step, moved.x, moved.z, dt);
        this.vertical -= 13 * dt;
        if (wasGrounded || a.y + this.vertical * dt <= floor) {
            a.y = floor;
            this.vertical = 0;
        }
        else {
            const top = campusMotion.isCampusX(a.x) ? campusMotion.headroom(a.x, a.z, floor) - 1.70 : Infinity;
            const next = Math.min(floor + .65, a.y + this.vertical * dt);
            a.y = Math.max(floor, Math.min(next, top));
            if (this.vertical > 0 && next >= top) this.vertical = 0;
        }
    }
}
exports.Residence = Residence;
