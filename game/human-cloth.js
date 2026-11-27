"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = void 0;
exports.tint = tint;
exports.paintCloth = paintCloth;
exports.fitShoulder = fitShoulder;
exports.attachBend = attachBend;
exports.fitWaist = fitWaist;
exports.drapeCoat = drapeCoat;
const T = require("../engine/three.module.min.js");
const human_fabric_js_1 = require("./human-fabric.js");
const mat = (0, human_fabric_js_1.wovenMaterial)();
const inkCache = new Map();
function ink(value) {
    let c = inkCache.get(value);
    if (!c) {
        c = new T.Color(value);
        inkCache.set(value, c);
    }
    return c;
}
function tint(value, factor) {
    return '#' + ink(value).clone().multiplyScalar(factor).getHexString();
}
function signedPow(x, p) { return Math.sign(x) * Math.pow(Math.abs(x), p); }
class Surface {
    pattern;
    sleeveOffset;
    pos = [];
    col = [];
    uv = [];
    mark = [];
    indices = [];
    shoulderWeights = [];
    seamPairs = [];
    constructor(pattern, sleeveOffset = 0) {
        this.pattern = pattern;
        this.sleeveOffset = sleeveOffset;
    }
    vertex(p, c, tag, shade, u, v) {
        const n = this.pos.length / 3, rgb = ink(c);
        this.pos.push(...p);
        this.col.push(rgb.r * shade, rgb.g * shade, rgb.b * shade);
        this.mark.push(tag);
        this.uv.push(u, v);
        return n;
    }
    loft(rings, color, tag = 0, segments = 16, exp = .93, shape, cap = false, cut, light) {
        const start = this.pos.length / 3, stride = segments + 1, asc = rings[rings.length - 1][0] > rings[0][0];
        for (let j = 0; j < rings.length; j++) {
            const [y, w, d, b, cx = 0, cz = 0] = rings[j];
            this.seamPairs.push([this.pos.length / 3, this.pos.length / 3 + segments]);
            for (let k = 0; k <= segments; k++) {
                const angle = 2 * Math.PI * k / segments, cs = Math.cos(angle), sn = Math.sin(angle);
                const p = [cx + w * signedPow(cs, exp), y, cz + (sn < 0 ? d : b) * signedPow(sn, exp)];
                if (shape)
                    shape(p, angle, j);
                const shade = .94 + .05 * Math.abs(cs) + .022 * Math.sin(2 * angle + .4) + .017 * Math.sin(5 * angle + 14 * y);
                this.vertex(p, color, tag, shade * (light ? light(p, angle) : 1), k / segments, (0, human_fabric_js_1.clothV)(this.pattern, p[1] + this.sleeveOffset));
            }
            if (j)
                for (let k = 0; k < segments; k++) {
                    if (cut?.(j - 1, k))
                        continue;
                    const l = k + 1, a = start + (j - 1) * stride + k, b = start + (j - 1) * stride + l, c = start + j * stride + l, d = start + j * stride + k;
                    if (asc)
                        this.indices.push(a, d, c, a, c, b);
                    else
                        this.indices.push(a, b, c, a, c, d);
                }
        }
        if (cap)
            for (const j of [0, rings.length - 1]) {
                const r = rings[j], center = this.vertex([r[4] ?? 0, r[0], r[5] ?? 0], color, tag, .88, .5, .966);
                const rim = this.pos.length / 3;
                for (let k = 0; k < segments; k++) {
                    const n = (start + j * stride + k) * 3;
                    this.vertex([this.pos[n], this.pos[n + 1], this.pos[n + 2]], color, tag, .92, .5 + .48 * Math.cos(k * 2 * Math.PI / segments), .966);
                }
                for (let k = 0; k < segments; k++) {
                    const a = rim + k, b = rim + (k + 1) % segments;
                    if ((j === 0) === asc)
                        this.indices.push(center, a, b);
                    else
                        this.indices.push(center, b, a);
                }
            }
        return this;
    }
    sleeve(rings, side, colors, tags, weights) {
        const segments = rings[0].length;
        for (let j = 1; j < rings.length; j++) {
            const start = this.pos.length / 3;
            for (const index of [j - 1, j]) {
                this.seamPairs.push([this.pos.length / 3, this.pos.length / 3 + segments]);
                for (let i = 0; i <= segments; i++) {
                    const p = rings[index][i % segments], u = side === 1 ? i / segments : 1.5 - i / segments;
                    this.vertex(p, colors[j - 1], tags[j - 1], .97 + .025 * Math.cos(i * 2 * Math.PI / segments), u, (0, human_fabric_js_1.clothV)('sleeves', p[1]));
                    this.shoulderWeights.push(weights[index]);
                }
            }
            for (let i = 0; i < segments; i++) {
                const a = start + i, b = a + 1, c = b + segments + 1, d = c - 1;
                if (side === 1)
                    this.indices.push(a, b, c, a, c, d);
                else
                    this.indices.push(a, c, b, a, d, c);
            }
            if (j > 1)
                for (let i = 0; i <= segments; i++)
                    this.seamPairs.push([start - (segments + 1) + i, start + i]);
        }
        return this;
    }
    panel(rows, color, tag = 0, back = false) {
        const start = this.pos.length / 3;
        for (let j = 0; j < rows.length; j++) {
            const [a, b] = rows[j];
            this.vertex(a, color, tag, .98, .1, .966);
            this.vertex(b, color, tag, 1, .9, .983);
            if (!j)
                continue;
            const n = start + j * 2;
            const l = n - 2, r = n - 1, up = n, ur = n + 1;
            const crossZ = (this.pos[r * 3] - this.pos[l * 3]) * (this.pos[up * 3 + 1] - this.pos[l * 3 + 1]) - (this.pos[r * 3 + 1] - this.pos[l * 3 + 1]) * (this.pos[up * 3] - this.pos[l * 3]);
            if ((crossZ > 0) === back)
                this.indices.push(l, r, ur, l, ur, up);
            else
                this.indices.push(l, ur, r, l, up, ur);
        }
        return this;
    }
    shell(rows, color, tag = 0, back = false) {
        const start = this.pos.length / 3, cols = rows[0].length;
        for (let j = 0; j < rows.length; j++)
            for (let i = 0; i < cols; i++) {
                const p = rows[j][i], shade = .92 + .08 * Math.sin(Math.PI * i / (cols - 1));
                const a = this.vertex(p, color, tag, shade, i / (cols - 1), (0, human_fabric_js_1.clothV)(this.pattern, p[1] + this.sleeveOffset));
                if (i === 0 || j === 0)
                    continue;
                const b = a - 1, c = a - cols, d = c - 1;
                if (back)
                    this.indices.push(d, c, a, d, a, b);
                else
                    this.indices.push(d, a, c, d, b, a);
            }
        return this;
    }
    fittedPatch(rows, point, color, tag, back, rise, relief) {
        const bands = [], cols = 6;
        for (let j = 0; j < rows.length; j++) {
            const [lo, hi, y] = rows[j], band = [];
            for (let k = 0; k <= cols; k++) {
                const u = k / cols, fold = Math.sin(u * Math.PI) * relief;
                band.push(point(T.MathUtils.lerp(lo, hi, u), y, rise + fold));
            }
            bands.push(band);
        }
        const reverse = (rows[0][1] < rows[0][0]) !== back;
        this.shell(bands, color, tag, reverse);
        const base = (x, y) => point(x, y, .003);
        const last = rows.length - 1;
        for (const j of [0, last]) {
            const [lo, hi, y] = rows[j];
            const bevel = bands[j].map((_, k) => base(T.MathUtils.lerp(lo, hi, k / cols), y + (j === 0 ? .002 : -.002)));
            this.shell(j === 0 ? [bevel, bands[j]] : [bands[j], bevel], tint(color, .77), tag, reverse);
        }
        for (const k of [0, cols]) {
            const bevel = rows.map(([lo, hi, y], j) => {
                const edge = bands[j][k], welt = k === 0 ? lo : hi, inner = k === 0 ? hi : lo;
                const flat = base(welt + Math.sign(inner - welt) * .002, y);
                return k === 0 ? [flat, edge] : [edge, flat];
            });
            this.shell(bevel, tint(color, .77), tag, reverse);
        }
        return this;
    }
    stroke(points, width, color, tag = 0, back = false) {
        return this.panel(points.map((p, i) => {
            const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
            const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1;
            const a = -dy * width / (2 * len), b = dx * width / (2 * len);
            return [[p[0] - a, p[1] - b, p[2]], [p[0] + a, p[1] + b, p[2]]];
        }), color, tag, back);
    }
    mesh(name) {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
        g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
        g.setAttribute('clothInk', new T.Float32BufferAttribute(this.mark, 1));
        if (this.shoulderWeights.length)
            g.setAttribute('shoulderWeight', new T.Float32BufferAttribute(this.shoulderWeights, 1));
        g.setIndex(this.indices);
        g.computeVertexNormals();
        const normals = g.getAttribute('normal'), n = new T.Vector3(), q = new T.Vector3();
        for (const [a, b] of this.seamPairs) {
            n.fromBufferAttribute(normals, a).add(q.fromBufferAttribute(normals, b)).normalize();
            normals.setXYZ(a, n.x, n.y, n.z);
            normals.setXYZ(b, n.x, n.y, n.z);
        }
        g.computeBoundingSphere();
        g.userData.humanSurface = true;
        const m = new T.Mesh(g, mat);
        m.name = name;
        return m;
    }
}
exports.Surface = Surface;
const options = require("./human-kits.js").heroCoats.map(coat => coat.dyes.map(ink));
const dyes = options[0];
const articulatedPaint = new WeakMap();
const painted = new WeakMap();
function paintCloth(mesh, original, coat) {
    const index = T.MathUtils.clamp(Math.trunc(coat), 0, 2);
    let g = original;
    if (index) {
        let map = painted.get(original);
        if (!map) {
            map = new Map();
            painted.set(original, map);
        }
        const cached = map.get(index);
        if (cached)
            g = cached;
        else {
            g = original.clone();
            const tags = g.getAttribute('clothInk'), c = g.getAttribute('color');
            for (let i = 0; i < c.count; i++) {
                const k = tags.getX(i) - 1;
                if (k < 0)
                    continue;
                const from = dyes[k], to = options[index][k];
                c.setXYZ(i, c.getX(i) * to.r / from.r, c.getY(i) * to.g / from.g, c.getZ(i) * to.b / from.b);
            }
            c.needsUpdate = true;
            map.set(index, g);
        }
    }
    if (!mesh.userData.articulated) {
        mesh.geometry = g;
        return;
    }
    let views = articulatedPaint.get(mesh);
    if (!views) {
        views = new Map([[0, mesh.geometry]]);
        articulatedPaint.set(mesh, views);
    }
    let view = views.get(index);
    if (!view) {
        const bind = views.get(0);
        view = new T.BufferGeometry();
        view.index = bind.index;
        for (const [name, attribute] of Object.entries(bind.attributes))
            view.setAttribute(name, attribute);
        view.setAttribute('color', g.getAttribute('color'));
        view.userData.humanSurface = true;
        view.boundingSphere = bind.boundingSphere;
        views.set(index, view);
    }
    mesh.geometry = view;
}
function fitShoulder(mesh, spine, shoulder, bindX) {
    const base = mesh.geometry, g = base.clone();
    const weight = base.getAttribute('shoulderWeight');
    const p = base.getAttribute('position'), n = base.getAttribute('normal');
    const pos = g.getAttribute('position'), norm = g.getAttribute('normal');
    pos.setUsage(T.DynamicDrawUsage);
    norm.setUsage(T.DynamicDrawUsage);
    g.boundingSphere = new T.Sphere(new T.Vector3(0, -.07, 0), .31);
    mesh.geometry = g;
    mesh.userData.articulated = true;
    const bind = new T.Matrix4().makeTranslation(bindX, .420, 0);
    const socket = new T.Matrix4(), last = new T.Matrix4().makeScale(0, 0, 0);
    const q = new T.Quaternion(), partial = new T.Quaternion(), rest = new T.Quaternion(), translation = new T.Vector3(), scale = new T.Vector3(), point = new T.Vector3();
    return () => {
        shoulder.updateMatrix();
        socket.copy(shoulder.matrix).invert();
        if (shoulder.parent !== spine) {
            spine.updateMatrix();
            socket.multiply(spine.matrix);
        }
        socket.multiply(bind);
        if (last.equals(socket))
            return;
        last.copy(socket);
        socket.decompose(translation, q, scale);
        let previous = -1;
        for (let i = 0; i < weight.count; i++) {
            const amount = 1 - weight.getX(i);
            if (amount < .00001)
                continue;
            if (amount !== previous) {
                partial.slerpQuaternions(rest, q, amount);
                previous = amount;
            }
            point.fromBufferAttribute(p, i).applyQuaternion(partial).addScaledVector(translation, amount);
            pos.setXYZ(i, point.x, point.y, point.z);
            point.fromBufferAttribute(n, i).applyQuaternion(partial);
            norm.setXYZ(i, point.x, point.y, point.z);
        }
        pos.needsUpdate = true;
        norm.needsUpdate = true;
    };
}
function attachBend(source, parent, joint) {
    const g = source.geometry.clone(), mesh = new T.Mesh(g, source.material);
    mesh.name = source.name;
    mesh.userData.articulated = true;
    parent.add(mesh);
    const p = source.geometry.getAttribute('position'), n = source.geometry.getAttribute('normal');
    const dst = g.getAttribute('position'), normal = g.getAttribute('normal');
    dst.setUsage(T.DynamicDrawUsage);
    normal.setUsage(T.DynamicDrawUsage);
    const levels = new Map(), pivot = joint.position.y;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), l = levels.get(y) ?? [];
        l.push(i);
        levels.set(y, l);
    }
    const heights = [...levels.keys()].sort((a, b) => b - a);
    const layers = heights.map(y => ({ indices: levels.get(y), w: T.MathUtils.smoothstep(heights[0] - y, 0, heights[0] - heights[heights.length - 1]) }));
    g.boundingSphere = new T.Sphere(new T.Vector3(0, pivot, 0), .22);
    const rotation = new T.Quaternion(), identity = new T.Quaternion(), last = new T.Quaternion(0, 0, 0, 0), v = new T.Vector3();
    return { mesh, update() {
            if (1 - Math.abs(last.dot(joint.quaternion)) < 1e-13)
                return;
            last.copy(joint.quaternion);
            for (const { indices, w } of layers) {
                rotation.slerpQuaternions(identity, joint.quaternion, w);
                for (const i of indices) {
                    v.set(p.getX(i), p.getY(i) - pivot, p.getZ(i)).applyQuaternion(rotation);
                    dst.setXYZ(i, v.x, v.y + pivot, v.z);
                    v.fromBufferAttribute(n, i).applyQuaternion(rotation);
                    normal.setXYZ(i, v.x, v.y, v.z);
                }
            }
            dst.needsUpdate = true;
            normal.needsUpdate = true;
        } };
}
function fitWaist(mesh, spine) {
    const source = mesh.geometry, g = source.clone();
    mesh.geometry = g;
    mesh.userData.articulated = true;
    const p = source.getAttribute('position'), n = source.getAttribute('normal'), pos = g.getAttribute('position'), norm = g.getAttribute('normal');
    pos.setUsage(T.DynamicDrawUsage);
    norm.setUsage(T.DynamicDrawUsage);
    const vertices = [];
    for (let i = 0; i < p.count; i++) {
        const w = (1 - T.MathUtils.smoothstep(p.getY(i), .057, .198)) * T.MathUtils.smoothstep(p.getZ(i), .002, .059);
        if (w > 0)
            vertices.push({ i, w });
    }
    const inverse = new T.Matrix4(), rotation = new T.Matrix3(), a = new T.Vector3(), b = new T.Vector3();
    return () => {
        spine.updateMatrix();
        inverse.copy(spine.matrix).invert();
        rotation.getNormalMatrix(inverse);
        for (const { i, w } of vertices) {
            a.fromBufferAttribute(p, i);
            a.lerp(b.copy(a).applyMatrix4(inverse), w);
            pos.setXYZ(i, a.x, a.y, a.z);
            a.fromBufferAttribute(n, i);
            a.lerp(b.copy(a).applyMatrix3(rotation), w).normalize();
            norm.setXYZ(i, a.x, a.y, a.z);
        }
        pos.needsUpdate = true;
        norm.needsUpdate = true;
    };
}
function drapeCoat(mesh, hips, spine, thighs) {
    const base = mesh.geometry, g = base.clone();
    mesh.geometry = g;
    mesh.userData.articulated = true;
    const p = base.getAttribute('position'), n = base.getAttribute('normal');
    const pos = g.getAttribute('position'), norm = g.getAttribute('normal');
    pos.setUsage(T.DynamicDrawUsage);
    norm.setUsage(T.DynamicDrawUsage);
    g.boundingSphere = new T.Sphere(new T.Vector3(0, -.04, 0), .43);
    const toHem = new T.Matrix4(), skin = [new T.Matrix4(), new T.Matrix4()], bind = hips.map(hip => new T.Matrix4().makeTranslation(-hip.position.x, -hip.position.y + mesh.position.y, 0));
    const legs = thighs.map(thigh => {
        thigh.geometry.computeBoundingBox();
        const bounds = thigh.geometry.boundingBox;
        return { inverse: new T.Matrix4(), rx: Math.max(-bounds.min.x, bounds.max.x) + .010, rz: Math.max(-bounds.min.z, bounds.max.z) + .008 };
    });
    function thighClearance(x, y, z, outwardX, outwardZ) {
        let limit = -Infinity;
        for (const { inverse, rx, rz } of legs) {
            const e = inverse.elements;
            const u = (e[0] * x + e[4] * y + e[8] * z + e[12]) / rx, v = (e[2] * x + e[6] * y + e[10] * z + e[14] - .006) / rz;
            const dx = (e[0] * outwardX + e[8] * outwardZ) / rx, dz = (e[2] * outwardX + e[10] * outwardZ) / rz;
            const aa = dx * dx + dz * dz, bb = u * dx + v * dz;
            const det = bb * bb - aa * (u * u + v * v - 1);
            if (det <= 0 || aa < 1e-8)
                continue;
            const half = Math.sqrt(det), hi = (half - bb) / aa, lo = (-half - bb) / aa;
            const cy = e[1] * x + e[5] * y + e[9] * z + e[13], dy = e[1] * outwardX + e[9] * outwardZ;
            if (Math.abs(dy) < 1e-7) {
                if (cy >= -.34 && cy <= .037)
                    limit = Math.max(limit, hi);
            }
            else {
                const a = (-.34 - cy) / dy, b = (.037 - cy) / dy;
                const start = Math.max(lo, Math.min(a, b)), end = Math.min(hi, Math.max(a, b));
                if (end >= start)
                    limit = Math.max(limit, end);
            }
        }
        return limit;
    }
    const restWaist = new T.Matrix4().makeTranslation(0, mesh.position.y, 0), neutral = new T.Matrix4(), toPelvis = new T.Matrix4(), neutralRotation = new T.Matrix3(), restPoint = new T.Vector3(), pelvisPoint = new T.Vector3();
    const rotations = [new T.Matrix3(), new T.Matrix3()], p0 = new T.Vector3(), n0 = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
    const w = new Float32Array(p.count), right = new Float32Array(p.count), back = new Float32Array(p.count), hemEase = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
        w[i] = T.MathUtils.smoothstep(.047 - p.getY(i), 0, .164);
        right[i] = T.MathUtils.smoothstep(p.getX(i), -.055, .055);
        back[i] = T.MathUtils.smoothstep(p.getZ(i), .005, .060);
        hemEase[i] = T.MathUtils.smoothstep(.047 - p.getY(i), 0, .060);
    }
    return () => {
        mesh.updateMatrix();
        spine.updateMatrix();
        toPelvis.multiplyMatrices(spine.matrix, mesh.matrix);
        toHem.copy(toPelvis).invert();
        neutral.multiplyMatrices(toHem, restWaist);
        neutralRotation.getNormalMatrix(neutral);
        for (let j = 0; j < 2; j++) {
            hips[j].updateMatrix();
            legs[j].inverse.copy(hips[j].matrix).invert();
            skin[j].multiplyMatrices(toHem, hips[j].matrix).multiply(bind[j]);
            rotations[j].getNormalMatrix(skin[j]);
        }
        for (let i = 0; i < p.count; i++) {
            if (!w[i] && !back[i])
                continue;
            p0.fromBufferAttribute(p, i);
            n0.fromBufferAttribute(n, i);
            a.copy(p0).applyMatrix4(skin[0]);
            b.copy(p0).applyMatrix4(skin[1]);
            p0.lerp(a.lerp(b, right[i]), w[i]);
            if (back[i]) {
                restPoint.fromBufferAttribute(p, i);
                restPoint.y += mesh.position.y;
                pelvisPoint.copy(p0).applyMatrix4(toPelvis);
                const lift = Math.max(0, pelvisPoint.z - p.getZ(i));
                restPoint.z = Math.max(restPoint.z + lift, thighClearance(restPoint.x, restPoint.y, 0, 0, 1) + .012);
                restPoint.applyMatrix4(toHem);
                p0.lerp(restPoint, back[i]);
            }
            if (hemEase[i]) {
                pelvisPoint.copy(p0).applyMatrix4(toPelvis);
                const radius = Math.max(.001, Math.hypot(pelvisPoint.x, pelvisPoint.z));
                const outwardX = pelvisPoint.x / radius, outwardZ = pelvisPoint.z / radius;
                const clearance = thighClearance(pelvisPoint.x, pelvisPoint.y, pelvisPoint.z, outwardX, outwardZ) + .012;
                if (clearance > 0) {
                    pelvisPoint.x += outwardX * clearance;
                    pelvisPoint.z += outwardZ * clearance;
                    p0.lerp(pelvisPoint.applyMatrix4(toHem), hemEase[i]);
                }
            }
            pos.setXYZ(i, p0.x, p0.y, p0.z);
            a.copy(n0).applyMatrix3(rotations[0]);
            b.copy(n0).applyMatrix3(rotations[1]);
            n0.lerp(a.lerp(b, right[i]), w[i]);
            if (back[i])
                n0.lerp(a.fromBufferAttribute(n, i).applyMatrix3(neutralRotation), back[i]);
            n0.normalize();
            norm.setXYZ(i, n0.x, n0.y, n0.z);
        }
        pos.needsUpdate = true;
        norm.needsUpdate = true;
    };
}
