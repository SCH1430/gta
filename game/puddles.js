"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outerPuddles = exports.districtPuddles = void 0;
exports.puddleAt = puddleAt;
exports.districtPuddles = [
    [-33.8, 39.3, 3.08, 1.02, -.41, 'amber'], [-29, 37.65, 2.74, .74, -.60, 'jade'],
    [-37.1, 44.7, 2.9, .94, .13, 'ice'], [-24.7, 40.2, 1.28, .62, -.42, 'ice'],
    [-41.8, 41.3, 1.05, 2.07, .17, 'jade'], [-18.7, 31.8, 6.52, 1.61, -.05, 'amber'],
    [-36.1, 27.5, 4.46, .76, .015, 'amber'], [-6.4, 27.1, 4.05, 1.23, -.09, 'jade'],
    [24.1, 31.8, 3.19, 1.35, .11, 'jade'], [49.1, 1.2, 1.17, 6.12, -.02, 'ice'],
    [43.62, -20.4, 1.21, 4.31, .02, 'amber'], [44.7, -40.9, 1.77, 1.68, .27, 'ice'],
    [11.2, -48.8, 5.16, 1.12, -.03, 'amber'], [-19.9, -42.9, 3.17, .69, .02, 'ice'],
    [-52.4, -12.3, .98, 4.81, .03, 'amber'], [-18.3, 20.65, 2.47, .76, .12, 'jade'],
    [24.9, 23.7, 3.53, .78, -.06, 'jade'], [36.8, 22.5, 1.23, 1.57, .11, 'amber']
];
exports.outerPuddles = [[-112, 26, 4, 1.4, .14, 'amber'], [-131, -4, 1.4, 5, .14, 'amber'],
    [98, -42, 4.2, 1.3, .14, 'jade'], [104, 28, 3, 1.1, .14, 'amber'], [-34, -113, 4.7, 1.2, .14, 'ice'],
    [-7, 107, 4, 1, .14, 'amber'], [74, 115, 3.2, 1, .14, 'amber'], [48.5, 131, .9, 3.1, .14, 'ice']];
const pools = [...exports.districtPuddles, ...exports.outerPuddles].map(([x, z, rx, rz, a]) => ({ x, z, rx, rz, c: Math.cos(a), s: Math.sin(a) }));
function puddleAt(x, z) {
    return pools.some(p => {
        const dx = x - p.x, dz = z - p.z;
        if (Math.abs(dx) > p.rx + p.rz || Math.abs(dz) > p.rx + p.rz)
            return false;
        return ((p.c * dx + p.s * dz) / p.rx) ** 2 + ((p.c * dz - p.s * dx) / p.rz) ** 2 < .74;
    });
}
