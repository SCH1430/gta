"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addOuterWoodlands = addOuterWoodlands;
const T = require("../engine/three.module.min.js");
const outer_woodlands_js_1 = require("./outer-woodlands.js");
function crown(detail) {
    const points = [], colors = [], index = [];
    const fir = new T.Color('#455c58'), snow = new T.Color('#bccbd1'), shade = new T.Color();
    const sides = detail ? 14 : 8;
    const tiers = detail ? 5 : 3;
    for (let tier = 0; tier < tiers; tier++) {
        const y = .19 + tier * .59 / tiers, size = 1 - tier * .74 / tiers, first = points.length / 3;
        const rows = [[-.024, .39], [.009, 1], [.065, .66], [.27, 0.005]];
        for (let row = 0; row < rows.length; row++) {
            const [lift, radius] = rows[row];
            for (let side = 0; side < sides; side++) {
                const a = side * Math.PI * 2 / sides + tier * .46;
                const irregular = 1 + .21 * Math.sin(side * 2.53 + tier * .71), jag = row === 1 ? .028 * Math.sin(side * 2.41 + tier) : 0;
                const span = radius * size * irregular;
                points.push(span * Math.cos(a), Math.min(1, y + lift + jag), span * Math.sin(a));
                const frost = row === 2 ? .77 + .23 * Math.sin(a - .9) ** 2 : row === 3 ? .65 : row === 1 ? .21 : .04;
                shade.copy(fir).lerp(snow, frost * (.79 + .21 * Math.cos(a + .9) ** 2));
                colors.push(shade.r, shade.g, shade.b);
                if (row) {
                    const i = first + (row - 1) * sides + side, j = first + (row - 1) * sides + (side + 1) % sides;
                    index.push(i, i + sides, j, j, i + sides, j + sides);
                }
            }
        }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
}
function addOuterWoodlands(parent) {
    const fine = crown(true), rough = crown(false), mat = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
    const trunks = new T.CylinderGeometry(.078, .13, 1, 6);
    const bark = new T.MeshLambertMaterial({ color: '#515d62' });
    const cells = new Map();
    for (const t of outer_woodlands_js_1.outerTrees) {
        const key = Math.floor(t.x / 64) + '/' + Math.floor(t.z / 64), list = cells.get(key);
        if (list)
            list.push(t);
        else
            cells.set(key, [t]);
    }
    const pose = new T.Object3D(), color = new T.Color();
    const batches = [...cells].map(([key, list]) => {
        const group = new T.Group();
        group.name = 'Ельник · ' + key;
        group.userData.regionalCell = true;
        const a = new T.InstancedMesh(fine, mat, list.length), b = new T.InstancedMesh(rough, mat, list.length);
        const c = new T.InstancedMesh(trunks, bark, list.length);
        const bounds = new T.Box3();
        list.forEach((tree, i) => {
            const { x, z, h, radius, turn, tone } = tree;
            pose.position.set(x, -.015, z);
            pose.rotation.set(0, turn, 0);
            pose.scale.set(radius, h, radius);
            pose.updateMatrix();
            color.setRGB(.78 + tone * .20, .87 + tone * .12, .91 + tone * .09);
            a.setMatrixAt(i, pose.matrix);
            b.setMatrixAt(i, pose.matrix);
            a.setColorAt(i, color);
            b.setColorAt(i, color);
            pose.position.y = h * .17;
            pose.scale.set(h * .145, h * .35, h * .145);
            pose.updateMatrix();
            c.setMatrixAt(i, pose.matrix);
            bounds.expandByPoint(new T.Vector3(x - radius * 1.3, 0, z - radius * 1.3));
            bounds.expandByPoint(new T.Vector3(x + radius * 1.3, h, z + radius * 1.3));
        });
        for (const mesh of [a, b, c]) {
            mesh.computeBoundingSphere();
            group.add(mesh);
        }
        parent.add(group);
        return { group, bounds, a, b, c };
    });
    const projection = new T.Matrix4(), frustum = new T.Frustum(), eye = new T.Vector3();
    return (camera) => {
        eye.setFromMatrixPosition(camera.matrixWorld);
        frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        for (const { group, bounds, a, b, c } of batches) {
            const distance = bounds.distanceToPoint(eye);
            group.visible = distance < 255 && frustum.intersectsBox(bounds);
            a.visible = c.visible = group.visible && distance < 62;
            b.visible = group.visible && !a.visible;
        }
    };
}
