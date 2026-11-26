"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixturePose = fixturePose;
exports.createFixtures = createFixtures;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const fixtures_js_1 = require("./fixtures.js");
const world_layout_js_1 = require("./world-layout.js");
const blackout_js_1 = require("./blackout.js");
const up = new T.Vector3(0, 1, 0);
const lampHeight = 6.08;
const clamp = (v) => Math.max(0, Math.min(1, v));
function fixturePose(f, broken, elapsed, out) {
    const y = (0, world_layout_js_1.groundHeight)(f.x, f.z) + .105;
    out.scale.set(1, 1, 1);
    out.position.set(f.x, y, f.z);
    out.rotation.set(0, f.face, 0);
    if (broken) {
        const age = Math.max(0, elapsed - broken.at), t = clamp(age / .77);
        const forward = t * t * (1.52 - .52 * t);
        const bounce = age > .77 ? .12 * Math.abs(Math.sin((age - .77) * 14)) * Math.exp(-7 * (age - .77)) : 0;
        const raised = broken.raisedAt === undefined ? 0 : T.MathUtils.smoothstep(elapsed - broken.raisedAt, 0, 10);
        const angle = (Math.PI * .498) * (forward - bounce) * (1 - raised);
        const toward = Math.atan2(broken.dx, broken.dz);
        const side = Math.sin(f.face - toward) >= 0 ? 1 : -1;
        const turn = Math.atan2(Math.sin(toward + side * Math.PI / 2 - f.face), Math.cos(toward + side * Math.PI / 2 - f.face));
        const twist = clamp((t - .45) / .55);
        out.rotation.y = f.face + turn * twist * twist * (3 - 2 * twist) * (1 - raised);
        axis.set(broken.dz, 0, -broken.dx);
        fallRotation.setFromAxisAngle(axis, angle);
        out.quaternion.premultiply(fallRotation);
    }
    out.updateMatrix();
    return out.matrix;
}
const axis = new T.Vector3(), fallRotation = new T.Quaternion();
function poleMesh(lamp, near) {
    const b = new model_geometry_js_1.Batch();
    if (lamp) {
        b.rod([0, 0, 0], [0, 5.57, 0], .087, '#74838a');
        b.rod([0, 5.48, 0], [0, lampHeight, 1.82], .07, '#6b7c82');
        b.box(0, lampHeight, 2.13, .53, .17, 1.0, '#51636b');
        if (near) {
            b.rod([0, .01, 0], [0, .52, 0], .14, '#66787c');
            b.box(.01, .83, .088, .093, .23, .019, '#4b5e68');
            b.box(.01, .87, .103, .053, .026, .012, '#cdb776');
            b.rod([0, 5.07, 0], [0, 5.81, 1.05], .022, '#7b8a8c');
            b.box(0, lampHeight + .095, 2.12, .48, .026, .86, '#b8c6ca');
            b.box(0, lampHeight - .095, 2.14, .41, .043, .82, '#778588');
        }
    }
    else {
        b.rod([0, 0, 0], [0, 3.52, 0], .068, '#7c8788');
        b.box(0, 3.01, .04, .43, 1.08, .31, '#293a43');
        if (near) {
            b.add(model_geometry_js_1.box, [0, .19, 0], [.19, .27, .17], '#59666c');
            b.box(.088, 1.52, .01, .13, .21, .15, '#6d7264');
            for (const y of [2.78, 3.21]) {
                b.rod([0, y, .184], [0, y, .207], .134, '#263641');
                b.box(0, y + .135, .235, .30, .036, .21, '#303e44');
                b.box(-.138, y + .075, .215, .033, .11, .15, '#414f53');
            }
            b.box(0, 3.57, .04, .42, .048, .29, '#aab8be');
        }
    }
    return b.mesh().geometry;
}
function wetReflection() {
    const w = 64, h = 96, data = new Uint8Array(w * h * 4);
    let seed = 44075;
    for (let row = 0; row < h; row++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const streak = .15 + (seed / 4294967296) ** 7 * .78;
        for (let col = 0; col < w; col++) {
            const x = (col + .5) / w * 2 - 1, z = (row + .5) / h * 2 - 1, r = x * x + z * z, i = (row * w + col) * 4;
            const halo = Math.max(0, 1 - r) ** 2;
            const line = Math.exp(-13 * x * x) * streak * halo;
            data[i] = 255;
            data[i + 1] = data[i + 2] = 255;
            data[i + 3] = Math.min(166, Math.round(halo * 52 + line * 138));
        }
    }
    const tex = new T.DataTexture(data, w, h);
    tex.magFilter = T.LinearFilter;
    tex.minFilter = T.LinearFilter;
    tex.colorSpace = T.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}
class Instances {
    mesh;
    constructor(parent, name, g, material, max) {
        this.mesh = new T.InstancedMesh(g, material, max);
        this.mesh.name = name;
        this.mesh.count = 0;
        this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        this.mesh.frustumCulled = false;
        parent.add(this.mesh);
    }
    push(m, color) {
        const ix = this.mesh.count++;
        this.mesh.setMatrixAt(ix, m);
        if (color)
            this.mesh.setColorAt(ix, color);
    }
    finish() {
        this.mesh.visible = this.mesh.count > 0;
        if (this.mesh.count) {
            this.mesh.instanceMatrix.needsUpdate = true;
            if (this.mesh.instanceColor)
                this.mesh.instanceColor.needsUpdate = true;
        }
    }
}
const lampInk = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const sodiumBulb = new T.Color('#ffe2a0'), sodiumPool = new T.Color('#ff9645');
const crossingBulb = new T.Color('#ddf2ff'), crossingPool = new T.Color('#abd9f5');
const signalInk = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const debrisMat = new T.MeshLambertMaterial({ color: 0xffffff });
const red = new T.Color('#ff6750'), green = new T.Color('#75e4b6'), dark = new T.Color('#39484d');
const glassA = new T.Color('#9dbbb9'), glassB = new T.Color('#657d83');
const sparkInk = new T.MeshBasicMaterial({ color: '#ffcd81', toneMapped: false });
const local = new T.Matrix4(), result = new T.Matrix4(), temp = new T.Object3D();
function part(root, x, y, z, sx, sy, sz) {
    local.makeScale(sx, sy, sz).setPosition(x, y, z);
    return result.multiplyMatrices(root, local);
}
function createFixtures(scene) {
    const group = new T.Group();
    group.userData.dynamicScenery = true;
    group.name = 'Опоры и дорожные сигналы';
    scene.add(group);
    const count = fixtures_js_1.fixtures.length;
    const lamp = new Instances(group, 'Опоры освещения', poleMesh(true, true), model_geometry_js_1.solid, count);
    const silLamp = new Instances(group, 'Фонари вдали', poleMesh(true, false), model_geometry_js_1.solid, count);
    const signal = new Instances(group, 'Светофорные стойки', poleMesh(false, true), model_geometry_js_1.solid, count);
    const silSignal = new Instances(group, 'Светофоры вдали', poleMesh(false, false), model_geometry_js_1.solid, count);
    const shoes = new Instances(group, 'Монтажные плиты', model_geometry_js_1.box, new T.MeshLambertMaterial({ color: '#788790' }), count);
    const lamps = new Instances(group, 'Работающие фонари', model_geometry_js_1.box, lampInk, count);
    const lenses = new Instances(group, 'Сигнальные линзы', new T.CylinderGeometry(.118, .118, .042, 10).rotateX(Math.PI / 2), signalInk, count * 2);
    const pools = new Instances(group, 'Отражения фонарей', new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: wetReflection(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false }), count * 2);
    pools.mesh.renderOrder = 1;
    const debris = new Instances(group, 'Осколки рассеивателей', model_geometry_js_1.box, debrisMat, count * 5);
    const sparks = new Instances(group, 'Искры контакта', model_geometry_js_1.box, sparkInk, count * 8);
    const draws = [lamp, silLamp, signal, silSignal, shoes, lamps, lenses, pools, debris, sparks];
    const pose = new T.Object3D();
    let old, oldPhase = -1, x0 = Infinity, z0 = Infinity, animateUntil = -1, last = -1, circuits = new Set();
    let cut = false;
    const info = { lampsOn: 0, signalsDark: 0, falling: 0 };
    function fragments(f, record, age, base, index) {
        const lamp = f.kind === 'lamp', dir = record, extent = lamp ? 5.9 : 3.2;
        const offset = lamp ? 1.6 : .1, side = Math.sin(f.face - Math.atan2(dir.dx, dir.dz)) >= 0 ? 1 : -1;
        const headX = f.x + dir.dx * extent + dir.dz * side * offset, headZ = f.z + dir.dz * extent - dir.dx * side * offset;
        if (age > .63) {
            const flight = clamp((age - .63) / .48);
            for (let k = 0; k < 5; k++) {
                const a = index * .61 + k * 2.4, d = (.24 + .19 * k) * flight, h = .03 + Math.sin(Math.PI * flight) * (.20 + .04 * k);
                temp.position.set(headX + Math.sin(a) * d, base + h, headZ + Math.cos(a) * d);
                temp.rotation.set(flight * k, a + flight * 2, .11);
                temp.scale.set(.08 + k * .014, .028, .07);
                temp.updateMatrix();
                debris.push(temp.matrix, k % 2 ? glassA : glassB);
            }
        }
        if (age > .41)
            return;
        for (let k = 0; k < 8; k++) {
            const t = Math.max(0, age - .010 * k), a = k * 2.40 + index * .51;
            temp.position.set(f.x + Math.sin(a) * t * 2.67, base + .4 + t * (2.5 + .11 * k) - 7.5 * t * t, f.z + Math.cos(a) * t * 2.67);
            temp.rotation.set(0, a, .7 - k * .20);
            temp.scale.set(.016, .13 * (1 - clamp(t / .42)), .016);
            temp.updateMatrix();
            sparks.push(temp.matrix);
        }
    }
    return {
        state: () => ({ ...info }),
        update(elapsed, broken = fixtures_js_1.intact, focus, power = 'normal', daylight = 0) {
            pools.mesh.material.opacity = .05 + .79 * (1 - daylight);
            const x = focus?.x ?? 0, z = focus?.z ?? 0, phase = ((0, world_layout_js_1.signalGreen)('x', elapsed) ? 1 : 0) + ((0, world_layout_js_1.signalGreen)('z', elapsed) ? 2 : 0);
            const changed = broken !== old || elapsed < last;
            const cutChanged = cut !== (power !== 'normal');
            cut = power !== 'normal';
            if (changed) {
                circuits = (0, fixtures_js_1.brokenCircuits)(broken);
                animateUntil = -1;
                for (const record of Object.values(broken))
                    animateUntil = Math.max(animateUntil, record.at + 1.7, (record.raisedAt ?? -20) + 10.05);
            }
            const moving = elapsed <= animateUntil || last <= animateUntil;
            last = elapsed;
            if (!changed && !cutChanged && !moving && phase === oldPhase && (x - x0) ** 2 + (z - z0) ** 2 < 6.25)
                return;
            x0 = x;
            z0 = z;
            old = broken;
            oldPhase = phase;
            info.lampsOn = 0;
            info.signalsDark = 0;
            info.falling = 0;
            for (const d of draws)
                d.mesh.count = 0;
            fixtures_js_1.fixtures.forEach((f, index) => {
                const record = broken[f.id], lampPost = f.kind === 'lamp', disabled = !!(f.circuit && circuits.has(f.circuit));
                const powered = lampPost && !record && !(0, blackout_js_1.blackoutFixture)(power, f.x, f.z);
                if (powered)
                    info.lampsOn++;
                if (!lampPost && disabled)
                    info.signalsDark++;
                const d = (x - f.x) ** 2 + (z - f.z) ** 2;
                if (d > 130 ** 2)
                    return;
                const base = (0, world_layout_js_1.groundHeight)(f.x, f.z), near = d < 42 ** 2;
                const m = fixturePose(f, record, elapsed, pose);
                (lampPost ? (near ? lamp : silLamp) : (near ? signal : silSignal)).push(m);
                if (near)
                    shoes.push(local.makeScale(.40, .105, .40).setPosition(f.x, base + .048, f.z));
                if (powered) {
                    lamps.push(part(m, 0, lampHeight - .105, 2.14, .39, .037, .81), f.crosswalk ? crossingBulb : sodiumBulb);
                    if (d < 57 ** 2) {
                        const sine = Math.sin(f.face), cosine = Math.cos(f.face);
                        const px = f.crosswalk?.x ?? f.x + sine * 3.55, pz = f.crosswalk?.z ?? f.z + cosine * 3.55;
                        const ink = f.crosswalk ? crossingPool : sodiumPool;
                        temp.position.set(px, (0, world_layout_js_1.groundHeight)(px, pz) + .039, pz);
                        temp.rotation.set(0, f.face, 0);
                        temp.scale.set(f.crosswalk ? 7.2 : 6.4, 1, f.crosswalk ? 12.5 : 9.0);
                        temp.updateMatrix();
                        pools.push(temp.matrix, ink);
                        const sx = f.x + sine * .50, sz = f.z + cosine * .50;
                        temp.position.set(sx, (0, world_layout_js_1.groundHeight)(sx, sz) + .023, sz);
                        temp.scale.set(3.2, 1, 3.4);
                        temp.updateMatrix();
                        pools.push(temp.matrix, ink);
                    }
                }
                if (!lampPost) {
                    const go = (0, world_layout_js_1.signalGreen)(f.axis, elapsed);
                    lenses.push(part(m, 0, 3.21, .206, 1, 1, 1), !disabled && !go ? red : dark);
                    lenses.push(part(m, 0, 2.78, .206, 1, 1, 1), !disabled && go ? green : dark);
                }
                if (record) {
                    const age = Math.max(0, elapsed - record.at);
                    if (age < .77)
                        info.falling++;
                    if (near)
                        fragments(f, record, age, base, index);
                }
            });
            for (const d of draws)
                d.finish();
        }
    };
}
