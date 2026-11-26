"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doorwayPair = doorwayPair;
exports.keepResidentSpace = keepResidentSpace;
const marks = [[0, 62.9, 1.15, 68.4, .42], [2, 64.5, .69, 66.55, .28], [3, 65.24, .46, 66.94, -.64], [4.6, 66.72, .31, 66.98, -.75], [5.6, 67.49, .55, 66.71, -.71], [7.5, 68.36, 1.15, 65.22, -.20], [9.3, 68.41, 1.24, 63.3, .24], [12, 68.41, 1.24, 63.3, .24]];
function doorwayPair(t) {
    const phase = (Math.max(0, t) % 24), returning = phase > 12, time = returning ? 24 - phase : phase;
    let i = 0;
    while (i < marks.length - 2 && time > marks[i + 1][0])
        i++;
    const a = marks[i], b = marks[i + 1], len = b[0] - a[0], f = (time - a[0]) / len, d = returning ? -1 : 1;
    return [1, 3].map(k => {
        const dx = b[k] - a[k], dz = b[k + 1] - a[k + 1], stopped = dx === 0 && dz === 0;
        const nod = k === 3 && time >= 2.3 && time < 4.6 ? Math.sin((time - 2.3) / 2.3 * Math.PI) : 0;
        const yaw = stopped ? (k === 1 ? -Math.PI / 2 : Math.PI / 2) : Math.atan2(-dx * d, -dz * d);
        return { x: a[k] + dx * f, z: a[k + 1] + dz * f, yaw, speed: Math.hypot(dx, dz) / len, nod, glance: nod * .62 };
    });
}
function keepResidentSpace(p, t) {
    for (const n of doorwayPair(t)) {
        const dx = p.x - n.x, dz = p.z - n.z, l = Math.hypot(dx, dz);
        if (l < .52) {
            if (l > .001) {
                p.x += dx * (.52 / l - 1);
                p.z += dz * (.52 / l - 1);
            }
            else
                p.z += .52;
        }
    }
}
