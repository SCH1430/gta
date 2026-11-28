"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreetIncidents = exports.leavesDebris = exports.crashRadius = exports.streetCrashLifetime = exports.streetCrashLimit = void 0;
exports.validCrashDebris = validCrashDebris;
const fixtures_js_1 = require("./fixtures.js");
const world_layout_js_1 = require("./world-layout.js");
exports.streetCrashLimit = 8;
exports.streetCrashLifetime = 26;
const alertTime = 3.1;
const near = (a, b, r) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2 < r * r;
const crashRadius = (event) => .53 + event.severity * .82;
exports.crashRadius = crashRadius;
const leavesDebris = (event) => event.kind === 'fence' || event.kind === 'collision' && event.severity >= .49;
exports.leavesDebris = leavesDebris;
function validCrashDebris(value) {
    return !!value && [value.dx, value.dz].every(n => Number.isFinite(n) && Math.abs(n) <= 1) &&
        (value.material === 'wood' || value.material === 'plastic') && typeof value.glass === 'boolean' && typeof value.snow === 'boolean';
}
class StreetIncidents {
    crashes = [];
    fixed = [];
    moving = [];
    hazards = [];
    fixtures;
    fixtureRefresh = Infinity;
    revision = 0;
    combinedRevision = -1;
    serial = 0;
    impact(point, now, severity, kind = 'collision', debris) {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.z) || !Number.isFinite(now) || !Number.isFinite(severity) || severity < .28 && kind === 'collision')
            return;
        const old = this.crashes.find(event => event.kind === kind && now - event.at < 1.25 && near(point, event, 1.55));
        const strongest = Math.max(.28, severity, old?.severity ?? 0);
        const fragments = old?.severity > severity ? old.debris ?? debris : debris ?? old?.debris;
        const event = { id: old?.id ?? 'crash-' + this.serial++, x: point.x, z: point.z, at: now, severity: Math.min(1, strongest), kind };
        if (validCrashDebris(fragments))
            event.debris = { dx: fragments.dx, dz: fragments.dz, material: fragments.material, glass: fragments.glass, snow: fragments.snow };
        if (old)
            this.crashes.splice(this.crashes.indexOf(old), 1);
        this.crashes.push(event);
        if (this.crashes.length > exports.streetCrashLimit)
            this.crashes.shift();
        this.rebuildCrashes();
        return event;
    }
    restore(saved, now) {
        this.crashes.length = 0;
        this.serial = 0;
        if (Array.isArray(saved))
            for (const event of saved.slice(-exports.streetCrashLimit)) {
                if (!event || typeof event !== 'object' || !Number.isFinite(event.at) || event.at > now || event.at < now - exports.streetCrashLifetime ||
                    !Number.isFinite(event.x) || !Number.isFinite(event.z))
                    continue;
                if (event.kind === 'collision' || event.kind === 'fixture' || event.kind === 'fence')
                    this.impact(event, event.at, event.severity, event.kind, event.debris);
            }
        this.rebuildCrashes();
    }
    rebuildCrashes() {
        this.moving = this.crashes.filter(e => e.kind === 'collision' && (0, exports.leavesDebris)(e)).map(e => ({
            id: e.id, x: e.x, z: e.z, y: (0, world_layout_js_1.groundHeight)(e.x, e.z), radius: (0, exports.crashRadius)(e)
        }));
        this.revision++;
    }
    debris(broken, now) {
        if (this.crashes.some(e => e.at + exports.streetCrashLifetime <= now)) {
            for (let i = this.crashes.length - 1; i >= 0; i--)
                if (this.crashes[i].at + exports.streetCrashLifetime <= now)
                    this.crashes.splice(i, 1);
            this.rebuildCrashes();
        }
        if (broken !== this.fixtures || now >= this.fixtureRefresh) {
            this.fixtures = broken;
            this.fixed = [];
            this.fixtureRefresh = Infinity;
            for (const [id, record] of Object.entries(broken)) {
                const fixture = fixtures_js_1.fixturesById.get(id);
                const clearsAt = (record.raisedAt ?? Infinity) + 4.2;
                if (!fixture || now >= clearsAt)
                    continue;
                this.fixtureRefresh = Math.min(this.fixtureRefresh, clearsAt);
                const extent = fixture.kind === 'lamp' ? 5.6 : 3.35;
                const pieces = Math.ceil(extent / .9);
                for (let i = 1; i <= pieces; i++) {
                    const length = extent * i / pieces;
                    const x = fixture.x + record.dx * length, z = fixture.z + record.dz * length;
                    this.fixed.push({ id, x, z, y: (0, world_layout_js_1.groundHeight)(x, z), radius: i === pieces ? .58 : .36 });
                }
            }
            this.revision++;
        }
        if (this.combinedRevision !== this.revision) {
            this.combinedRevision = this.revision;
            this.hazards = [...this.moving, ...this.fixed];
        }
        return this.hazards;
    }
    approach(car, now) {
        if (!this.crashes.length)
            return Infinity;
        const cos = Math.cos(car.yaw), sin = Math.sin(car.yaw);
        let speed = Infinity;
        for (const event of this.crashes) {
            const age = now - event.at, dx = event.x - car.x, dz = event.z - car.z;
            if (age < 0 || age >= alertTime || Math.abs(dx) > 17 || Math.abs(dz) > 17)
                continue;
            const ahead = -dx * sin - dz * cos, across = dx * cos - dz * sin;
            if (ahead < -1.5 || ahead > 13 + event.severity * 4 || Math.abs(across) > 3 + event.severity * .8)
                continue;
            speed = Math.min(speed, ahead < 5.8 ? 0 : Math.max(1, (ahead - 5.8) * .65), 3.6);
        }
        if (speed < Infinity)
            car.trafficHazardUntil = now + 1.55;
        return speed;
    }
}
exports.StreetIncidents = StreetIncidents;
