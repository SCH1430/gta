"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticVisibility = void 0;
const THREE = require("../engine/three.module.min.js");
class StaticVisibility {
    draws = [];
    pv = new THREE.Matrix4();
    previous = new THREE.Matrix4();
    frustum = new THREE.Frustum();
    position = new THREE.Vector3();
    temp = new THREE.Box3();
    transform = new THREE.Matrix4();
    register(mesh) {
        if (mesh.count < 24 || !mesh.instanceColor)
            return;
        const m = this.transform, g = mesh.geometry;
        if (!g.boundingBox)
            g.computeBoundingBox();
        const groups = new Map();
        for (let i = 0; i < mesh.count; i++) {
            mesh.getMatrixAt(i, m);
            const e = m.elements;
            const a = Math.hypot(e[0], e[1], e[2]), b = Math.hypot(e[4], e[5], e[6]), c = Math.hypot(e[8], e[9], e[10]);
            const largest = Math.max(a, b, c), second = Math.max(Math.min(a, b), Math.min(a, c), Math.min(b, c));
            const distance = largest < 2.1 && second < .11 ? 42 : largest < 2.5 && second < .17 ? 63 : Infinity;
            const key = Math.floor(e[12] / 16) + '/' + Math.floor(e[14] / 16) + '/' + distance;
            let cell = groups.get(key);
            if (!cell) {
                cell = { bounds: new THREE.Box3(), distance, ids: [], first: 0, count: 0, shown: true };
                groups.set(key, cell);
            }
            cell.bounds.union(this.temp.copy(g.boundingBox).applyMatrix4(m));
            cell.ids.push(i);
        }
        const matrix = new Float32Array(mesh.count * 16), colors = new Float32Array(mesh.count * 3);
        const oldMatrices = mesh.instanceMatrix.array, oldColors = mesh.instanceColor.array;
        let offset = 0;
        const cells = [...groups.values()];
        for (const cell of cells) {
            cell.first = offset;
            cell.count = cell.ids.length;
            for (const i of cell.ids) {
                for (let j = 0; j < 16; j++)
                    matrix[offset * 16 + j] = oldMatrices[i * 16 + j];
                for (let j = 0; j < 3; j++)
                    colors[offset * 3 + j] = oldColors[i * 3 + j];
                offset++;
            }
            cell.ids.length = 0;
        }
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        this.draws.push({ mesh, cells, matrix, colors });
    }
    update(camera) {
        this.pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        if (this.pv.equals(this.previous))
            return;
        this.previous.copy(this.pv);
        this.frustum.setFromProjectionMatrix(this.pv);
        this.position.setFromMatrixPosition(camera.matrixWorld);
        for (const draw of this.draws) {
            let changed = false;
            for (const cell of draw.cells) {
                const visible = this.frustum.intersectsBox(cell.bounds) &&
                    (cell.distance === Infinity || cell.bounds.distanceToPoint(this.position) < cell.distance);
                if (visible !== cell.shown)
                    changed = true;
                cell.shown = visible;
            }
            if (!changed)
                continue;
            const { mesh, matrix, colors } = draw, mi = mesh.instanceMatrix, ci = mesh.instanceColor;
            let n = 0;
            for (const cell of draw.cells)
                if (cell.shown) {
                    const start = cell.first, end = start + cell.count;
                    mi.array.set(matrix.subarray(start * 16, end * 16), n * 16);
                    ci.array.set(colors.subarray(start * 3, end * 3), n * 3);
                    n += cell.count;
                }
            mesh.count = n;
            mi.clearUpdateRanges();
            ci.clearUpdateRanges();
            if (n) {
                mi.addUpdateRange(0, n * 16);
                ci.addUpdateRange(0, n * 3);
                mi.needsUpdate = true;
                ci.needsUpdate = true;
            }
        }
    }
}
exports.StaticVisibility = StaticVisibility;
