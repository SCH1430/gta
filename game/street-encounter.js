"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreetEncounter = void 0;
const collision_js_1 = require("./collision.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const actionDuration = { strike: .54, dodge: .38, fall: 1.75 };
const ease = (t) => { const n = (0, sim_navigation_js_1.clamp)(t, 0, 1); return n * n * (3 - 2 * n); };
class StreetEncounter {
    cover = null;
    act = null;
    ready = 0;
    poise = 0;
    sinceHit = 0;
    get covered() { return this.cover !== null; }
    get locked() { return !!this.act || this.covered; }
    get pose() {
        const act = this.act;
        const progress = act ? Math.max(.001, (0, sim_navigation_js_1.clamp)(act.elapsed / actionDuration[act.kind], 0, 1)) : 0;
        return { strike: act?.kind === 'strike' ? progress : 0, dodge: act?.kind === 'dodge' ? progress : 0,
            dodgeSide: act?.kind === 'dodge' ? act.side : undefined,
            getUp: act?.kind === 'fall' ? { phase: progress, side: act.side } : undefined, covered: this.covered };
    }
    save() { return { cover: this.cover }; }
    restore(save) {
        this.cover = typeof save?.cover === 'number' && Number.isFinite(save.cover) ? (0, sim_navigation_js_1.wrapAngle)(save.cover) : null;
        this.act = null;
        this.ready = this.poise = this.sinceHit = 0;
    }
    leaveCover() { this.cover = null; }
    obstacle(hero, angle, cars) {
        const step = { x: hero.x - .78 * Math.sin(angle), z: hero.z - .78 * Math.cos(angle) };
        return !(0, collision_js_1.clearPath)(hero, step, .075, hero.y + .46, cars);
    }
    coverAngle(hero, cars) {
        for (const offset of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, 3 * Math.PI / 4, -3 * Math.PI / 4, Math.PI]) {
            const yaw = (0, sim_navigation_js_1.wrapAngle)(hero.yaw + offset);
            if (this.obstacle(hero, yaw, cars))
                return yaw;
        }
        return null;
    }
    start(action, hero, cars, now, officers) {
        if (this.act)
            return false;
        if (action === 'street:cover') {
            if (this.covered) {
                this.leaveCover();
                return true;
            }
            this.cover = this.coverAngle(hero, cars);
            if (this.cover !== null)
                hero.yaw = (0, sim_navigation_js_1.wrapAngle)(this.cover + Math.PI * .5);
            return this.covered;
        }
        if (now < this.ready)
            return false;
        this.leaveCover();
        const nearest = officers.filter(o => o.phase !== 'return' && o.phase !== 'disabled' && (0, sim_navigation_js_1.dist)(o, hero) < 2.1)
            .sort((a, b) => (0, sim_navigation_js_1.dist)(a, hero) - (0, sim_navigation_js_1.dist)(b, hero))[0];
        if (action === 'street:strike') {
            this.act = { kind: 'strike', elapsed: 0, yaw: nearest ? (0, sim_navigation_js_1.aim)(hero, nearest) : hero.yaw, side: 1, landed: false };
            this.ready = now + .63;
        }
        else if (action === 'street:dodge') {
            const side = nearest && Math.sin((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(hero, nearest) - hero.yaw)) < 0 ? -1 : 1;
            this.act = { kind: 'dodge', elapsed: 0, yaw: (0, sim_navigation_js_1.wrapAngle)(hero.yaw + side * Math.PI * .5), side, landed: false };
            this.ready = now + .54;
        }
        else
            return false;
        return true;
    }
    impact(hero, actor, now) {
        if (this.act?.kind === 'dodge' || this.act?.kind === 'fall' || now - this.sinceHit < .36)
            return false;
        this.poise = now - this.sinceHit < 3.8 ? this.poise + 1 : 1;
        this.sinceHit = now;
        if (this.poise < 2)
            return false;
        const from = (0, sim_navigation_js_1.aim)(hero, actor), side = Math.sin((0, sim_navigation_js_1.wrapAngle)(from - hero.yaw)) > 0 ? -1 : 1;
        this.leaveCover();
        this.act = { kind: 'fall', elapsed: 0, yaw: (0, sim_navigation_js_1.wrapAngle)(from + Math.PI), side, landed: false };
        this.ready = now + 1.83;
        this.poise = 0;
        return true;
    }
    tick(hero, cars, people, dt, moving, hit) {
        if (this.cover !== null && (moving || !this.obstacle(hero, this.cover, cars)))
            this.leaveCover();
        const act = this.act;
        if (!act) {
            if (this.covered)
                hero.speed = 0;
            return this.covered;
        }
        const duration = actionDuration[act.kind], old = act.elapsed / duration;
        act.elapsed += dt;
        const p = (0, sim_navigation_js_1.clamp)(act.elapsed / duration, 0, 1);
        if (act.kind === 'strike') {
            hero.yaw = act.yaw;
            hero.speed = 0;
            if (!act.landed && p >= .38) {
                act.landed = true;
                hit(act.yaw);
            }
        }
        else {
            const stride = act.kind === 'dodge' ? 1.18 : .49;
            const advance = act.kind === 'dodge' ? ease(p) - ease(old) : ease(p / .34) - ease(old / .34);
            const displacement = stride * advance;
            const moved = (0, collision_js_1.walkSlide)(hero, -Math.sin(act.yaw) * displacement, -Math.cos(act.yaw) * displacement, .31, hero.y, cars, people);
            hero.speed = (0, sim_navigation_js_1.dist)(moved, hero) / dt;
            Object.assign(hero, moved, { y: (0, collision_js_1.footFloor)(moved, hero.y, .31, cars) });
        }
        if (p >= 1)
            this.act = null;
        return true;
    }
}
exports.StreetEncounter = StreetEncounter;
