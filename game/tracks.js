"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTracks = createTracks;
const THREE = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const puddles_js_1 = require("./puddles.js");
const winter_light_js_1 = require("./winter-light.js");
const range = 31, fadeStart = 20, lifetime = 52;
const levels = [.12, .28, .46, .64];
const { canal } = require("./world-expansion-layout.js");
const clampUnit = n => Math.max(0, Math.min(1, n));
const ground = world_layout_js_1.groundHeight;
function snowUnder(x, z) {
    if (z >= canal.north + 2 && z <= canal.south - 2) return false;
    return world_layout_js_1.surfaceAt(x, z) === 'snow';
}
const tyreTypes = {
    hatch: ['hatch', .188], sedan: ['sedan', .224], patrol: ['sedan', .224],
    van: ['van', .267], suv: ['offroad', .252], pickup: ['offroad', .266],
    coupe: ['sedan', .241], taxi: ['sedan', .221], wagon: ['sedan', .222],
    towtruck: ['van', .289], utility: ['offroad', .294]
};
const sprayLimit = 144;
const sprayStyles = {
    water: { color: '#c4d8e0', size: .051, opacity: .65, spread: 1.3, lift: 1.15, gravity: 4.9, life: .46 },
    snow: { color: '#e2eef3', size: .083, opacity: .60, spread: 1.04, lift: .88, gravity: 3.5, life: .59 },
    slush: { color: '#a49e91', size: .078, opacity: .78, spread: 1.64, lift: 1.38, gravity: 4.9, life: .52 }
};
function treadTexture(side, pattern) {
    const w = 48, h = 96, data = new Uint8Array(w * h * 4);
    const tracksSnow = pattern !== 'water' && pattern !== 'skid';
    for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
            const u = (i + .5) / w * 2 - 1, v = (j + .5) / h;
            let alpha = 0, lip = 0, compression = 0;
            const grain = Math.sin(i * 53.17 + j * 31.08) * Math.sin(i * 7.37 - j * 11.9);
            if (side) {
                const x = u * side * 1.14;
                const fore = Math.hypot((x - .03) / .92, (v - .68) / .31);
                const heel = Math.hypot((x + .05) / .69, (v - .177) / .157);
                const waist = Math.hypot((x - .31) / .42, (v - .394) / .17);
                const inset = 1 - Math.min(fore, heel, waist) + .029 * grain;
                const cleat = (v * 11 + .29 * Math.abs(x - .10)) % 1;
                const groove = (v < .31 || v > .47) && cleat < .24 && Math.abs(x) < .71;
                lip = clampUnit(1 - Math.abs(inset + .04) * 8);
                compression = clampUnit(inset * 9) * (groove ? .36 : .95);
                alpha = Math.max(lip * .80, clampUnit((inset + .06) * 10));
            }
            else {
                const edge = Math.max(0, Math.min(1, (1 - Math.abs(u)) * 9));
                const tread = (v * 4 + .53 * Math.abs(u)) % 1;
                if (pattern === 'water')
                    alpha = edge * (.56 + .36 * Math.sin(u * 31 + Math.sin(v * 8)) ** 2) * (1 - Math.abs(u) ** 2);
                else if (pattern === 'skid')
                    alpha = edge * (.69 + .27 * Math.sin(u * 32 + v * .52) ** 2);
                else if (pattern === 'sedan')
                    alpha = edge * (Math.abs(Math.sin(u * 7.8)) < .33 ? .22 : .74 + .17 * Math.sin(v * 31 + u * 2.3));
                else if (pattern === 'offroad')
                    alpha = edge * (tread < .38 || Math.abs(u) < .15 ? .23 : .95);
                else if (pattern === 'van')
                    alpha = edge * ((v * 4 + (u > 0 ? .48 : 0)) % 1 < .27 || Math.abs(u) < .091 ? .16 : .97);
                else
                    alpha = edge * (Math.abs(Math.abs(u) - .4) < .095 ? .24 : tread < .25 ? .45 : .95);
                if (tracksSnow) {
                    // Dense wheel bed, with a narrow berm along each outside edge.
                    lip = clampUnit(1 - Math.abs(Math.abs(u) - .87 + grain * .015) * 14);
                    compression = alpha * clampUnit((.94 - Math.abs(u)) * 10);
                    alpha = Math.max(lip * .78, edge * .93);
                }
            }
            const k = (j * w + i) * 4;
            const shade = 157 - compression * 64 + lip * 62 + grain * 5;
            data[k] = tracksSnow ? shade : 188;
            data[k + 1] = tracksSnow ? shade + 12 : 209;
            data[k + 2] = tracksSnow ? shade + 21 : 226;
            data[k + 3] = Math.round(alpha * 255);
        }
    const t = new THREE.DataTexture(data, w, h);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
}
class Marks {
    limit;
    layers;
    marks = [];
    next = 0;
    count = 0;
    constructor(group, geometry, side, limit, pattern = 'hatch') {
        this.limit = limit;
        this.snow = pattern !== 'water' && pattern !== 'skid';
        const texture = treadTexture(side, pattern);
        this.layers = levels.map(opacity => {
            const Material = this.snow ? THREE.MeshLambertMaterial : THREE.MeshBasicMaterial;
            const material = new Material({ map: texture, color: this.snow ? 0xffffff : pattern === 'skid' ? 0x171f27 : 0x273948, transparent: true, opacity,
                depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, forceSinglePass: true, side: THREE.DoubleSide });
            const mesh = new THREE.InstancedMesh(geometry, material, limit);
            mesh.count = 0;
            mesh.frustumCulled = false;
            mesh.renderOrder = 1;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            group.add(mesh);
            return mesh;
        });
    }
    push(matrix, x, z, born, snowfall) {
        let mark = this.marks[this.next];
        if (!mark) {
            mark = { matrix: new THREE.Matrix4(), x, z, born };
            this.marks.push(mark);
        }
        mark.matrix.copy(matrix);
        mark.x = x;
        mark.z = z;
        mark.born = born;
        mark.snowfall = snowfall;
        this.next = (this.next + 1) % this.limit;
    }
    refresh(time, focus, radius, snowfall) {
        for (const layer of this.layers)
            layer.count = 0;
        this.count = 0;
        for (const mark of this.marks) {
            const age = this.snow ? snowfall - mark.snowfall : time - mark.born;
            if (age < 0 || age >= lifetime)
                continue;
            const d = Math.hypot(focus.x - mark.x, focus.z - mark.z);
            if (d >= radius)
                continue;
            const fade = Math.min(1, (lifetime - age) / (this.snow ? 39 : 18), (radius - d) / Math.min(range - fadeStart, radius * .39));
            const layer = this.layers[Math.min(levels.length - 1, Math.floor(fade * levels.length))];
            layer.setMatrixAt(layer.count++, mark.matrix);
            this.count++;
        }
        for (const layer of this.layers) {
            layer.visible = layer.count > 0;
            if (layer.count) {
                layer.instanceMatrix.clearUpdateRanges();
                layer.instanceMatrix.addUpdateRange(0, layer.count * 16);
                layer.instanceMatrix.needsUpdate = true;
            }
        }
    }
    clear() {
        this.marks.length = 0;
        this.next = 0;
        this.count = 0;
        for (const layer of this.layers) {
            layer.count = 0;
            layer.visible = false;
        }
    }
}
const axleOffset = (spec, wheel) => wheel < 2 ? spec.fw : spec.rw;
function createTracks(scene) {
    const group = new THREE.Group();
    group.name = 'Следы на снегу';
    scene.add(group);
    const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const left = new Marks(group, plane, -1, 56), right = new Marks(group, plane, 1, 56);
    const tyres = {
        hatch: new Marks(group, plane, 0, 88, 'hatch'), van: new Marks(group, plane, 0, 84, 'van'),
        sedan: new Marks(group, plane, 0, 88, 'sedan'), offroad: new Marks(group, plane, 0, 88, 'offroad'), skid: new Marks(group, plane, 0, 104, 'skid'), water: new Marks(group, plane, 0, 72, 'water')
    };
    const pools = [left, right, ...Object.values(tyres)];
    const sprays = Object.fromEntries(Object.entries(sprayStyles).map(([name, style]) => {
        const geometry = new THREE.BufferGeometry();
        const position = new THREE.BufferAttribute(new Float32Array(sprayLimit * 3), 3).setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position', position);
        geometry.setDrawRange(0, 0);
        const { color, size, opacity } = style;
        const mesh = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size, opacity, transparent: true, depthWrite: false }));
        mesh.name = 'wheel-spray-' + name;
        mesh.frustumCulled = false;
        mesh.visible = false;
        group.add(mesh);
        return [name, { mesh, position, style, written: 0 }];
    }));
    const sprayBatches = Object.values(sprays);
    const droplets = [];
    let dropIndex = 0, qualityRadius = range;
    function splash(c, x, z, time, side, kind, quality) {
        const speed = Math.abs(c.speed), strength = Math.min(1.25, speed * .12);
        const spray = sprays[kind], { style } = spray;
        const count = quality >= 2 && speed > 7 ? 3 : quality > 0 ? 2 : 1;
        const co = Math.cos(c.yaw), si = Math.sin(c.yaw), y = ground(x, z) + .08;
        const behind = Math.sign(c.speed) * (.28 + strength * .52);
        for (let i = 0; i < count; i++) {
            const k = dropIndex + 1;
            const across = side * style.spread * (.34 + Math.abs(Math.sin(k * 2.41)) * strength);
            const p = droplets[dropIndex] ??= {};
            p.x = x;
            p.y = y;
            p.z = z;
            p.vx = across * co + behind * si + .13 * c.vx;
            p.vy = (.85 + Math.abs(Math.sin(k * 3.62)) * 1.34) * style.lift * Math.max(.48, strength);
            p.vz = -across * si + behind * co + .13 * c.vz;
            p.born = time;
            p.spray = spray;
            dropIndex = (dropIndex + 1) % sprayLimit;
        }
    }
    const matrix = new THREE.Matrix4(), previous = new Map();
    let previousTime = -1, refreshTime = -Infinity, dirty = false;
    // The integral ages existing impressions as the weather changes, including across indoor visits.
    let snowfall = 0, fillRate = 1;
    const exposureAt = time => snowfall + (previousTime < 0 ? 0 : Math.max(0, time - previousTime) * fillRate);
    function clear() {
        for (const p of pools)
            p.clear();
        previous.clear();
        droplets.length = 0;
        dropIndex = 0;
        for (const spray of sprayBatches)
            spray.mesh.visible = false;
        previousTime = -1;
        snowfall = 0;
        fillRate = 1;
        refreshTime = -Infinity;
        dirty = false;
    }
    function rewind(time) {
        if (previousTime >= 0 && time < previousTime - .001)
            clear();
    }
    function footprint(f, time) {
        rewind(time);
        const fx = f.anchorX ?? f.x, fz = f.anchorZ ?? f.z;
        if (f.planted === false || !snowUnder(fx, fz)) return;
        const y = ground(fx, fz);
        if (Math.abs((f.anchorY ?? f.y) - y) > .10) return;
        const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
        const x = fx - s * .043, z = fz - c * .043;
        const toeX = x - s * .144, toeZ = z - c * .144, heelX = x + s * .144, heelZ = z + c * .144;
        if (!snowUnder(toeX, toeZ) || !snowUnder(heelX, heelZ)) return;
        const toeY = ground(toeX, toeZ), heelY = ground(heelX, heelZ);
        const across = ground(x + c * .086, z - s * .086) - ground(x - c * .086, z + s * .086);
        if (Math.abs(across) > .09 || Math.abs(heelY - toeY) > .16) return;
        matrix.set(c * .172, 0, s * .288, x, across, 1, heelY - toeY, (toeY + heelY) * .5 + .014, -s * .172, 0, c * .288, z, 0, 0, 0, 1);
        const soles = f.side < 0 ? left : right;
        soles.push(matrix, x, z, time, exposureAt(time));
        dirty = true;
    }
    function trace(ax, az, bx, bz, yaw, time, car, wet, skid, leadingOnStraight) {
        let dx = bx - ax, dz = bz - az;
        const aSnow = snowUnder(ax, az), bSnow = snowUnder(bx, bz);
        if ((aSnow || bSnow) && leadingOnStraight) return;
        const [tread, w] = tyreTypes[car.kind];
        const mode = aSnow || bSnow ? tread : wet ? 'water' : 'skid';
        if (!aSnow && !bSnow && !wet && !skid)
            return;
        if (aSnow !== bSnow) {
            let lo = 0, hi = 1;
            for (let i = 0; i < 4; i++) {
                const mid = (lo + hi) * .5;
                if (snowUnder(ax + dx * mid, az + dz * mid) === aSnow)
                    lo = mid;
                else
                    hi = mid;
            }
            const t = (lo + hi) * .5;
            if (aSnow) {
                bx = ax + dx * t;
                bz = az + dz * t;
            }
            else {
                ax += dx * t;
                az += dz * t;
            }
            dx = bx - ax;
            dz = bz - az;
        }
        if (dx * dx + dz * dz < .0025)
            return;
        const x = (ax + bx) * .5, z = (az + bz) * .5, c = Math.cos(yaw), s = Math.sin(yaw);
        const sign = dx * s + dz * c < 0 ? -1 : 1;
        const aY = ground(ax, az), bY = ground(bx, bz);
        const across = ground(x + w * c * .5, z - w * s * .5) - ground(x - w * c * .5, z + w * s * .5);
        if (Math.abs(across) > .13 || Math.abs(bY - aY) > Math.hypot(dx, dz) * .65 + .02) return;
        matrix.set(w * c, 0, sign * dx, x, across, 1, sign * (bY - aY), (aY + bY) * .5 + .017, -w * s, 0, sign * dz, z, 0, 0, 0, 1);
        tyres[mode].push(matrix, x, z, time, snowfall);
        dirty = true;
    }
    function sample(car, time, quality, weather) {
        if (!tyreTypes[car.kind] || (Number.isFinite(car.y) && Math.abs(car.y - ground(car.x, car.z)) > .45)) {
            previous.delete(car.id);
            return;
        }
        const last = previous.get(car.id);
        if (!last) {
            previous.set(car.id, { x: car.x, z: car.z, yaw: car.yaw, steer: car.steer, seen: time, wetUntil: -1 });
            return;
        }
        const dx = car.x - last.x, dz = car.z - last.z, distance = Math.hypot(dx, dz);
        const angle = Math.atan2(Math.sin(car.yaw - last.yaw), Math.cos(car.yaw - last.yaw));
        const gap = time - last.seen;
        last.seen = time;
        if (distance < .54 && Math.abs(angle) < .10)
            return;
        if (distance < Math.max(2.8, Math.min(.3, gap) * 36) && Math.abs(angle) < .95 && gap < .55) {
            const spec = vehicle_cabin_js_1.specs[car.kind];
            const steps = Math.max(1, Math.ceil(distance / .70));
            const speed = Math.abs(car.speed), wetSnow = (weather?.wetSnow ?? 0) > .30;
            const wetRoad = (weather?.rain ?? 0) > .16 && (weather?.wet ?? 0) > .68;
            for (let k = 0; k < steps; k++) {
                const t0 = k / steps, t1 = (k + 1) / steps, ya = last.yaw + angle * t0, yb = last.yaw + angle * t1;
                const sa = Math.sin(ya), ca = Math.cos(ya), sb = Math.sin(yb), cb = Math.cos(yb);
                const forward = dx * sb + dz * cb < 0, sideways = Math.abs(car.vx * cb - car.vz * sb);
                const straight = Math.abs(angle) < .028 && Math.abs(car.steer) < .11 && sideways < .45;
                for (let wheel = 0; wheel < 4; wheel++) {
                    const u = (wheel % 2 === 0 ? -1 : 1) * (spec.w - .073), v = axleOffset(spec, wheel);
                    const ax = last.x + dx * t0 + u * ca + v * sa, az = last.z + dz * t0 - u * sa + v * ca;
                    const bx = last.x + dx * t1 + u * cb + v * sb, bz = last.z + dz * t1 - u * sb + v * cb;
                    const steer = wheel < 2 ? (last.steer + (car.steer - last.steer) * (t0 + t1) * .5) * .48 : 0;
                    const water = (0, puddles_js_1.puddleAt)(bx, bz);
                    if (water)
                        last.wetUntil = time + .78;
                    const skid = (car.braking && Math.abs(car.speed) > 5.0) || sideways > 2.9;
                    // A trailing wheel follows the same rut on a straight; both axles cut their own arc in a turn.
                    const leading = (wheel < 2) === forward;
                    if (k === steps - 1 && !leading && speed > 1.7) {
                        const side = wheel % 2 === 0 ? -1 : 1;
                        if (speed > 2.25 && snowUnder(bx, bz))
                            splash(car, bx, bz, time, side, wetSnow || water ? 'slush' : 'snow', quality);
                        else if (water || wetRoad && speed > 5)
                            splash(car, bx, bz, time, side, 'water', quality);
                    }
                    trace(ax, az, bx, bz, (ya + yb) * .5 - steer, time, car, time < last.wetUntil, skid, leading && straight);
                }
            }
        }
        last.x = car.x;
        last.z = car.z;
        last.yaw = car.yaw;
        last.steer = car.steer;
    }
    return {
        root: group, footprint, clear,
        get activeCount() { return pools.reduce((n, p) => n + p.count, 0); },
        update(time, focus, cars, quality = 2, weather) {
            rewind(time);
            snowfall = exposureAt(time);
            fillRate = weather ? .23 + (weather.snow ?? 0) * (.95 + (weather.wind ?? 0) * .72 + (weather.wetSnow ?? 0) * .28) + (weather.rain ?? 0) * 1.34 : 1;
            previousTime = time;
            const radius = (0, winter_light_js_1.winterBudget)(quality).tracks;
            if (qualityRadius !== radius) {
                qualityRadius = radius;
                dirty = true;
            }
            for (const car of cars) {
                if ((car.x - focus.x) ** 2 + (car.z - focus.z) ** 2 < (radius + 3) ** 2)
                    sample(car, time, quality, weather);
                else
                    previous.delete(car.id);
            }
            for (const spray of sprayBatches)
                spray.written = 0;
            for (const p of droplets) {
                const t = time - p.born, spray = p.spray;
                if (t < 0 || t > spray.style.life)
                    continue;
                const y = p.y + p.vy * t - spray.style.gravity * t * t;
                if (y < p.y - .045)
                    continue;
                spray.position.setXYZ(spray.written++, p.x + p.vx * t, y, p.z + p.vz * t);
            }
            for (const { mesh, position, written } of sprayBatches) {
                mesh.geometry.setDrawRange(0, written);
                mesh.visible = written > 0;
                if (written) {
                    position.clearUpdateRanges();
                    position.addUpdateRange(0, written * 3);
                    position.needsUpdate = true;
                }
            }
            for (const [id, p] of previous)
                if (time - p.seen > .55)
                    previous.delete(id);
            if ((dirty && time - refreshTime >= 1 / 20) || time - refreshTime >= .35) {
                for (const pool of pools)
                    pool.refresh(time, focus, radius, snowfall);
                refreshTime = time;
                dirty = false;
            }
        }
    };
}
