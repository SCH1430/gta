"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Panels = exports.Batches = void 0;
const THREE = require("../engine/three.module.min.js");
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const round = new THREE.CylinderGeometry(.5, .5, 1, 10);
const ball = new THREE.IcosahedronGeometry(.5, 0);
const taper = new THREE.ConeGeometry(.5, 1, 12);
const base = new THREE.MeshLambertMaterial({ color: 0xffffff });
const lit = new THREE.MeshBasicMaterial({ color: 0xffffff });
const shapes = { box: unitBox, round, stone: ball, taper };
const axis = new THREE.Vector3(0, 1, 0);
class Batches {
    target;
    visibility;
    lists = new Map();
    obj = new THREE.Object3D();
    constructor(target, visibility) {
        this.target = target;
        this.visibility = visibility;
    }
    piece(shape, x, y, z, w, h, d, color, ry = 0, rz = 0, rx = 0, glow = false) {
        const o = this.obj;
        o.position.set(x, y, z);
        o.scale.set(w, h, d);
        o.rotation.set(rx, ry, rz, 'YXZ');
        o.updateMatrix();
        this.entry(shape, color, glow);
    }
    box(x, y, z, w, h, d, col, ry = 0) { this.piece('box', x, y, z, w, h, d, col, ry); }
    lamp(x, y, z, w, h, d, col, ry = 0) { this.piece('box', x, y, z, w, h, d, col, ry, 0, 0, true); }
    cyl(x, y, z, d, h, color) { this.piece('round', x, y, z, d, h, d, color); }
    beam(x1, y1, z1, x2, y2, z2, r, col, box = false) {
        const o = this.obj, dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
        o.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
        o.scale.set(r, dir.length(), r);
        o.quaternion.setFromUnitVectors(axis, dir.normalize());
        o.updateMatrix();
        this.entry(box ? 'box' : 'round', col, false);
    }
    entry(shape, col, glow) {
        const key = shape + glow;
        if (!this.lists.has(key))
            this.lists.set(key, { shape, glow, entries: [] });
        this.lists.get(key).entries.push({ m: this.obj.matrix.clone(), c: new THREE.Color(col) });
    }
    flush() {
        for (const { shape, glow, entries } of this.lists.values()) {
            const mesh = new THREE.InstancedMesh(shapes[shape], glow ? lit : base, entries.length);
            entries.forEach((e, i) => { mesh.setMatrixAt(i, e.m); mesh.setColorAt(i, e.c); });
            mesh.computeBoundingSphere();
            this.visibility?.register(mesh);
            this.target.add(mesh);
        }
        this.lists.clear();
    }
}
exports.Batches = Batches;
const ATLAS = 2048;
class Panels {
    target;
    tone;
    sheets = [];
    tiles = new Map();
    constructor(target, tone = '#ffffff') {
        this.target = target;
        this.tone = tone;
    }
    newSheet() {
        const canvas = document.createElement('canvas');
        canvas.width = ATLAS;
        canvas.height = ATLAS;
        const s = { c: canvas.getContext('2d'), pos: [], uv: [], cursorX: 1, cursorY: 1, row: 0 };
        this.sheets.push(s);
        return s;
    }
    place(key, image, x, y, z, w, h, angle) {
        let t = this.tiles.get(key);
        if (!t) {
            const tex = image(), el = tex.image;
            const factor = Math.min(1, 512 / el.width, 420 / el.height), tw = Math.round(el.width * factor), th = Math.round(el.height * factor);
            let s = this.sheets[this.sheets.length - 1] || this.newSheet();
            if (s.cursorX + tw + 2 > ATLAS) {
                s.cursorX = 1;
                s.cursorY += s.row + 3;
                s.row = 0;
            }
            if (s.cursorY + th + 2 > ATLAS)
                s = this.newSheet();
            t = { s, x: s.cursorX, y: s.cursorY, w: tw, h: th, sign:tex.userData?.signText };
            s.c.drawImage(el, t.x, t.y, tw, th);
            s.cursorX += tw + 3;
            s.row = Math.max(s.row, th);
            this.tiles.set(key, t);
        }
        if (t.sign) (this.target.userData.readableSigns ??= []).push({x,y,z,w,h,angle,text:t.sign});
        const uu = (t.x + .6) / ATLAS, uu2 = (t.x + t.w - .6) / ATLAS, vv = 1 - (t.y + t.h - .6) / ATLAS, vv2 = 1 - (t.y + .6) / ATLAS;
        const dx = Math.cos(angle) * w * .5, dz = -Math.sin(angle) * w * .5;
        const corners = [[x - dx, y - h / 2, z - dz], [x + dx, y - h / 2, z + dz], [x + dx, y + h / 2, z + dz], [x - dx, y + h / 2, z - dz]];
        const uv = [[uu, vv], [uu2, vv], [uu2, vv2], [uu, vv2]];
        for (const i of [0, 1, 2, 0, 2, 3]) {
            t.s.pos.push(...corners[i]);
            t.s.uv.push(...uv[i]);
        }
    }
    flush() {
        for (const s of this.sheets) {
            let xmax = 1;
            for (let i = 0; i < s.uv.length; i += 2)
                xmax = Math.max(xmax, s.uv[i] * ATLAS);
            const next = (n) => Math.min(ATLAS, 2 ** Math.ceil(Math.log2(n)));
            const w = next(xmax + 2), h = next(s.cursorY + s.row + 2);
            let source = s.c.canvas;
            if (w !== ATLAS || h !== ATLAS) {
                const crop = document.createElement('canvas');
                crop.width = w;
                crop.height = h;
                crop.getContext('2d').drawImage(source, 0, 0, w, h, 0, 0, w, h);
                source.width = 1;
                source.height = 1;
                source = crop;
                for (let i = 0; i < s.uv.length; i += 2) {
                    s.uv[i] *= ATLAS / w;
                    s.uv[i + 1] = 1 - (1 - s.uv[i + 1]) * ATLAS / h;
                }
            }
            const tex = new THREE.CanvasTexture(source);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 4;
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(s.pos, 3));
            g.setAttribute('uv', new THREE.Float32BufferAttribute(s.uv, 2));
            const obj = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, color: this.tone }));
            this.target.add(obj);
        }
    }
}
exports.Panels = Panels;
