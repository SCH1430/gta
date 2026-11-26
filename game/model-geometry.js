"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Batch = exports.glass = exports.lit = exports.solid = exports.ring = exports.oval = exports.tube = exports.box = void 0;
exports.shell = shell;
exports.stencil = stencil;
const T = require("../engine/three.module.min.js");
exports.box = new T.BoxGeometry(1, 1, 1);
exports.tube = new T.CylinderGeometry(.5, .5, 1, 10, 1);
exports.oval = new T.SphereGeometry(1, 10, 7);
exports.ring = new T.TorusGeometry(1, .115, 5, 14);
exports.solid = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
exports.lit = new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, toneMapped: false });
exports.glass = new T.MeshStandardMaterial({ color: 0x7d9ea5, metalness: .19, roughness: .16, envMapIntensity: .95, transparent: true, opacity: .39, depthWrite: false, side: T.DoubleSide });
const colors = new Map();
function colorFor(s) {
    let c = colors.get(s);
    if (!c) {
        c = new T.Color(s);
        colors.set(s, c);
    }
    return c;
}
const obj = new T.Object3D(), p = new T.Vector3(), n = new T.Vector3(), nm = new T.Matrix3();
class Batch {
    pos = [];
    norm = [];
    cols = [];
    add(g, at, scale, tint, rot = [0, 0, 0], quat) {
        obj.position.fromArray(at);
        obj.rotation.set(...rot);
        if (quat)
            obj.quaternion.copy(quat);
        obj.scale.fromArray(scale);
        obj.updateMatrix();
        nm.getNormalMatrix(obj.matrix);
        const a = g.getAttribute('position'), b = g.getAttribute('normal'), c = colorFor(tint), ix = g.index;
        const count = ix ? ix.count : a.count;
        for (let i = 0; i < count; i++) {
            const k = ix ? ix.getX(i) : i;
            p.fromBufferAttribute(a, k).applyMatrix4(obj.matrix);
            n.fromBufferAttribute(b, k).applyMatrix3(nm).normalize();
            this.pos.push(p.x, p.y, p.z);
            this.norm.push(n.x, n.y, n.z);
            this.cols.push(c.r, c.g, c.b);
        }
    }
    box(x, y, z, w, h, d, c, rot = [0, 0, 0]) { this.add(exports.box, [x, y, z], [w, h, d], c, rot); }
    ball(x, y, z, w, h, d, c, rot = [0, 0, 0]) { this.add(exports.oval, [x, y, z], [w, h, d], c, rot); }
    rod(a, b, r, c, square = false) {
        const delta = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const len = delta.length();
        if (len < 1e-5)
            return;
        const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.divideScalar(len));
        this.add(square ? exports.box : exports.tube, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [r * 2, len, r * 2], c, [0, 0, 0], q);
    }
    tri(a, b, c, col, outward) {
        const first = new T.Vector3(...a), v = new T.Vector3(...b).sub(first), w = new T.Vector3(...c).sub(first);
        const norm = v.cross(w).normalize();
        if (outward && norm.dot(new T.Vector3(...outward)) < 0) {
            [b, c] = [c, b];
            norm.negate();
        }
        const color = colorFor(col);
        for (const t of [a, b, c]) {
            this.pos.push(...t);
            this.norm.push(norm.x, norm.y, norm.z);
            this.cols.push(color.r, color.g, color.b);
        }
    }
    quad(a, b, c, d, col, out) { this.tri(a, b, c, col, out); this.tri(a, c, d, col, out); }
    mesh(material = exports.solid) {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('normal', new T.Float32BufferAttribute(this.norm, 3));
        g.setAttribute('color', new T.Float32BufferAttribute(this.cols, 3));
        g.computeBoundingSphere();
        return new T.Mesh(g, material);
    }
}
exports.Batch = Batch;
function shell(b, rows, color, aperture) {
    const rings = rows.map(([z, w, lo, s, hi]) => [[-w * .85, lo, z], [w * .85, lo, z], [w, lo + (s - lo) * .24, z], [w, s, z], [w * .88, hi, z], [-w * .88, hi, z], [-w, s, z], [-w, lo + (s - lo) * .24, z]]);
    for (let j = 0; j < rings.length - 1; j++)
        for (let i = 0; i < 8; i++) {
            if (aperture === 'top' && i === 4)
                continue;
            const a = rings[j][i], bb = rings[j][(i + 1) % 8], c = rings[j + 1][(i + 1) % 8], d = rings[j + 1][i];
            const yy = (rows[j][2] + rows[j][4] + rows[j + 1][2] + rows[j + 1][4]) * .25;
            b.quad(a, bb, c, d, color, [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2 - yy, 0]);
        }
    for (const j of [0, rings.length - 1]) {
        if (aperture === 'rear' && j > 0)
            continue;
        const r = rings[j];
        for (let i = 1; i < r.length - 1; i++)
            b.tri(r[0], r[i], r[i + 1], color, [0, 0, j === 0 ? -1 : 1]);
    }
}
const patterns = { '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '011', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'], '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'], 'В': ['110', '101', '110', '101', '110'], 'К': ['101', '110', '100', '110', '101'], 'Т': ['111', '010', '010', '010', '010'], 'Р': ['110', '101', '110', '100', '100'], 'М': ['101', '111', '111', '101', '101'], 'А': ['010', '101', '111', '101', '101'], '-': ['000', '000', '111', '000', '000'], ' ': ['000', '000', '000', '000', '000'] };
function stencil(b, text, at, size, tint, facing = 1) {
    const start = -(text.length * 4 - 1) * size * .5;
    [...text].forEach((letter, i) => {
        const pattern = patterns[letter];
        if (!pattern)
            return;
        pattern.forEach((row, yy) => {
            for (let xx = 0; xx < row.length;) {
                if (row[xx] !== '1') {
                    xx++;
                    continue;
                }
                let end = xx + 1;
                while (row[end] === '1')
                    end++;
                const X = at[0] + facing * (start + (i * 4 + (xx + end) / 2) * size), Y = at[1] + (2 - yy) * size, w = (end - xx) * size;
                b.quad([X - w / 2, Y - size / 2, at[2]], [X + w / 2, Y - size / 2, at[2]], [X + w / 2, Y + size / 2, at[2]], [X - w / 2, Y + size / 2, at[2]], tint, [0, 0, facing]);
                xx = end;
            }
        });
    });
}
