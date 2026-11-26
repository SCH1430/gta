"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seatedLegs = seatedLegs;
const T = require("../engine/three.module.min.js");
const human_cloth_js_1 = require("./human-cloth.js");
const poses = new WeakMap();
function seatedLegs(t, kind) {
    let cache = poses.get(t.seat.geometry);
    if (!cache) {
        cache = new Map();
        poses.set(t.seat.geometry, cache);
    }
    const known = cache.get(kind);
    if (known)
        return known.clone();
    const fixed = new T.Group(), deformed = [];
    const driving = require("./vehicle-cabin.js").carCabin(kind).drivingPose;
    fixed.add(t.seat.clone());
    for (let i = 0; i < 2; i++) {
        const sign = i ? 1 : -1, hip = new T.Group(), knee = new T.Group(), ankle = new T.Group();
        const thighAngle = driving.thigh, shinAngle = driving.shins[i];
        hip.position.set(sign * t.hipWidth, .006, 0);
        hip.rotation.order = 'ZXY';
        hip.rotation.z = sign * .065;
        hip.rotation.x = thighAngle;
        knee.position.y = -.410;
        knee.rotation.x = shinAngle - thighAngle;
        ankle.position.y = -.425;
        ankle.rotation.x = -shinAngle + .12;
        const shoe = t.feet[i].clone();
        shoe.position.y = -.09;
        hip.add(t.lUpper[i].clone(), knee);
        knee.add(t.lLower[i].clone(), ankle);
        ankle.add(shoe);
        const bend = (0, human_cloth_js_1.attachBend)(t.legBends[i], hip, knee);
        bend.update();
        deformed.push(bend.mesh.geometry);
        fixed.add(hip);
    }
    fixed.updateMatrixWorld(true);
    const positions = [], normals = [], colors = [], uvs = [], indices = [];
    const v = new T.Vector3(), nm = new T.Matrix3();
    fixed.traverse(item => {
        if (!(item instanceof T.Mesh))
            return;
        const g = item.geometry, p = g.getAttribute('position'), n = g.getAttribute('normal'), c = g.getAttribute('color'), uv = g.getAttribute('uv');
        const start = positions.length / 3;
        nm.getNormalMatrix(item.matrixWorld);
        for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(item.matrixWorld);
            positions.push(v.x, v.y, v.z);
            v.fromBufferAttribute(n, i).applyNormalMatrix(nm);
            normals.push(v.x, v.y, v.z);
            colors.push(c.getX(i), c.getY(i), c.getZ(i));
            uvs.push(uv.getX(i), uv.getY(i));
        }
        for (let i = 0; i < (g.index?.count ?? p.count); i++)
            indices.push(start + (g.index ? g.index.getX(i) : i));
    });
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    geometry.userData.humanSurface = true;
    for (const g of deformed)
        g.dispose();
    const mesh = new T.Mesh(geometry, t.seat.material);
    mesh.name = 'seated-trousers-and-boots';
    cache.set(kind, mesh);
    return mesh.clone();
}
