"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Masonry = void 0;
const THREE = require("../engine/three.module.min.js");
const plain = [0, 0, 1, 1];
const inks = new Map();
class Masonry {
    enabled;
    points = [];
    colors = [];
    uvs = [];
    indices = [];
    ox = 0;
    oz = 0;
    constructor(enabled = true) {
        this.enabled = enabled;
    }
    quad(a, b, c, d, ink, tile = plain) {
        if (!this.enabled)
            return;
        let color = inks.get(ink);
        if (!color) {
            color = new THREE.Color(ink);
            inks.set(ink, color);
        }
        const i = this.points.length / 3;
        for (const p of [a, b, c, d]) {
            this.points.push(p[0] + this.ox, p[1], p[2] + this.oz);
            this.colors.push(color.r, color.g, color.b);
        }
        this.indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
        const [u, v, U, V] = tile;
        this.uvs.push(u, v, U, v, U, V, u, V);
    }
    box(x, y, z, w, h, d, ink) {
        if (!this.enabled)
            return;
        const l = x - w / 2, r = x + w / 2, b = y - h / 2, t = y + h / 2, n = z - d / 2, s = z + d / 2;
        this.quad([l, b, s], [r, b, s], [r, t, s], [l, t, s], ink);
        this.quad([r, b, n], [l, b, n], [l, t, n], [r, t, n], ink);
        this.quad([r, b, s], [r, b, n], [r, t, n], [r, t, s], ink);
        this.quad([l, b, n], [l, b, s], [l, t, s], [l, t, n], ink);
        this.quad([l, t, s], [r, t, s], [r, t, n], [l, t, n], ink);
        if (b > .02)
            this.quad([l, b, n], [r, b, n], [r, b, s], [l, b, s], ink);
    }
    beam(a, b, width, ink, depth = width) {
        if (!this.enabled)
            return;
        const axis = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        const side = axis.clone().cross(Math.abs(axis.y) > .97 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
        const up = axis.clone().cross(side).normalize().multiplyScalar(depth * .5);
        side.multiplyScalar(width * .5);
        const at = (p, s, t) => [p[0] + side.x * s + up.x * t, p[1] + side.y * s + up.y * t, p[2] + side.z * s + up.z * t];
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]], lo = corners.map(([s, t]) => at(a, s, t)), hi = corners.map(([s, t]) => at(b, s, t));
        for (let k = 0; k < 4; k++) {
            const n = (k + 1) % 4;
            this.quad(lo[k], lo[n], hi[n], hi[k], ink);
        }
        this.quad(hi[0], hi[1], hi[2], hi[3], ink);
        this.quad(lo[3], lo[2], lo[1], lo[0], ink);
    }
    vessel(x, z, rings, sides = 16) {
        if (!this.enabled)
            return;
        const row = (j, i) => { const [y, rx, rz] = rings[j], a = (i + .5) / sides * Math.PI * 2; return [x + rx * Math.cos(a), y, z + rz * Math.sin(a)]; };
        for (let j = 0; j < rings.length - 1; j++)
            for (let i = 0; i < sides; i++)
                this.quad(row(j, i), row(j + 1, i), row(j + 1, i + 1), row(j, i + 1), rings[j][3]);
        const j = rings.length - 1, center = [x, rings[j][0], z];
        for (let i = 0; i < sides; i++)
            this.quad(row(j, i + 1), row(j, i), center, center, rings[j][3]);
    }
    frontage(x, y, z, w, h, angle, ink, tile) {
        if (!this.enabled)
            return;
        const a = Math.cos(angle) * w / 2, b = -Math.sin(angle) * w / 2;
        this.quad([x - a, y - h / 2, z - b], [x + a, y - h / 2, z + b], [x + a, y + h / 2, z + b], [x - a, y + h / 2, z - b], ink, tile);
    }
    mesh(material) {
        if (!this.indices.length)
            return null;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.points, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        if (material.map)
            g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
        g.setIndex(this.indices);
        g.computeVertexNormals();
        g.computeBoundingSphere();
        g.computeBoundingBox();
        return new THREE.Mesh(g, material);
    }
}
exports.Masonry = Masonry;
