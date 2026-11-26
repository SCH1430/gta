"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnowRoutes = exports.impactSnowbanks = void 0;
const world_layout_js_1 = require("./world-layout.js");
exports.impactSnowbanks = [
    { x: -68.3, z: -70.25, w: 7.2, d: 1.40, h: .56 },
    { x: -66.5, z: -49.8, w: 6.2, d: 1.38, h: .50 }
];
const maxPatches = 220;
const life = 360;
const gap = 2.2;
const zone = 24;
const key = (x, z) => Math.floor(x / zone) + ':' + Math.floor(z / zone);
class SnowRoutes {
    patches = [];
    index = new Map();
    previous = null;
    version = 0;
    purged = 0;
    get revision() { return this.version; }
    restore(raw) {
        this.patches = (Array.isArray(raw) ? raw : []).filter(p => p && [p.x, p.z, p.yaw, p.t].every(Number.isFinite)).slice(-maxPatches);
        this.previous = this.patches.at(-1) ?? null;
        this.purged = 0;
        this.reindex();
    }
    reindex() {
        this.index.clear();
        for (const patch of this.patches)
            this.register(patch);
        this.version++;
    }
    register(p) {
        const k = key(p.x, p.z);
        const entries = this.index.get(k);
        if (entries)
            entries.push(p);
        else
            this.index.set(k, [p]);
    }
    step(car, t) {
        if (t - this.purged > 10) {
            this.purged = t;
            if (this.patches[0] && this.patches[0].t < t - life) {
                this.patches = this.patches.filter(p => p.t >= t - life);
                this.reindex();
            }
        }
        if (!car || car.kind !== 'utility' || !car.systems?.plough || car.speed < 1.35 || (0, world_layout_js_1.surfaceAt)(car.x, car.z) !== 'snow') {
            this.previous = null;
            return;
        }
        if (this.previous && Math.hypot(car.x - this.previous.x, car.z - this.previous.z) < gap)
            return;
        const point = { x: car.x, z: car.z, yaw: car.yaw, t };
        this.patches.push(point);
        this.previous = point;
        if (this.patches.length > maxPatches) {
            this.patches.splice(0, this.patches.length - maxPatches);
            this.reindex();
        }
        else {
            this.register(point);
            this.version++;
        }
    }
    isCleared(x, z) {
        for (const ox of [-3.5, 0, 3.5])
            for (const oz of [-3.5, 0, 3.5]) {
                const close = this.index.get(key(x + ox, z + oz));
                if (close?.some(p => {
                    const dx = x - p.x, dz = z - p.z;
                    if (dx * dx + dz * dz > 7.9)
                        return false;
                    const cs = Math.cos(p.yaw), si = Math.sin(p.yaw);
                    return Math.abs(dx * cs - dz * si) < 1.13 && Math.abs(dx * si + dz * cs) < 1.27;
                }))
                    return true;
            }
        return false;
    }
}
exports.SnowRoutes = SnowRoutes;
