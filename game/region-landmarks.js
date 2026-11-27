"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.landmarkArt = void 0;
const outer_landmarks_js_1 = require("./outer-landmarks.js");
const snow = '#ccd7d9', steel = '#536b77', iron = '#3d505b', rust = '#ae745c', ivory = '#d9d5c0';
function dish(b, x, y, z, r) {
    const cos = .72, sin = Math.sqrt(1 - cos * cos), n = 16;
    function p(u, v, h) { return [x + u, y + v * sin + h * cos, z - v * cos + h * sin]; }
    const point = (rad, i) => { const a = 2 * Math.PI * i / n; return p(rad * Math.cos(a), rad * Math.sin(a), .36 * r * (rad / r) ** 2); };
    b.beam([x, y - 4.1, z - .7], p(0, 0, -.5), 1.1, steel);
    for (let i = 0; i < n; i++) {
        const j = i + 1, c = i % 4 === 0 ? '#bac8c8' : '#d6ddda';
        b.quad(point(0, i), point(r * .54, i), point(r * .54, j), point(0, j), c);
        b.quad(point(r * .54, i), point(r, i), point(r, j), point(r * .54, j), c);
        b.quad(point(0, j), point(r * .54, j), point(r, j), point(r, i), i % 2 ? '#758d93' : '#82979d');
        b.beam(point(r, i), point(r, j), .13, '#e2e7dc');
        if (i % 2 === 0)
            b.beam(point(0, i), point(r, i), .10, steel);
        if (i % 4 === 0)
            b.beam(point(r * .91, i), p(0, 0, r * .95), .15, iron);
    }
    b.beam(p(0, 0, r * .65), p(0, 0, r), .52, '#b48e63');
}
function radio(b, detail, sign, clad) {
    b.box(0, 3.05, 0, 32, 6.1, 22, '#738998');
    b.box(0, .52, 0, 32.15, 1.04, 22.15, steel);
    b.box(0, 5.76, 0, 32.1, .29, 22.08, '#aab9bd');
    b.box(0, 6.17, 0, 32.36, .20, 22.36, snow);
    for (let i = 0; i < 7; i++) {
        const x = -13.25 + 4.33 * i;
        b.box(x, 3.72, 11.035, 3.52, 1.58, .10, '#465e69');
        detail.box(x, 3.72, 11.093, .11, 1.59, .045, ivory);
        detail.box(x, 3.36, 11.09, 3.48, .075, .045, '#a8b1ab');
    }
    b.box(-7, 1.45, 11.09, 2.24, 2.90, .17, '#394a54');
    sign(1, 5.16, 11.09, 13.9, 1.52);
    for (const side of [-1, 1])
        clad(side * 16.02, 3.4, 0, 21.8, 5.17, side * Math.PI / 2);
    clad(0, 3.4, -11.02, 30.9, 5.17, Math.PI);
    for (const x of [-15.4, -10.95, -6.55, -2.2, 2.2, 6.55, 10.95, 15.4])
        detail.box(x, 3.25, 11.055, .13, 4.40, .11, '#a1acaa');
    detail.box(-7, 3.01, 11.15, 4.3, .25, 1.12, snow);
    detail.box(-5.46, 1.40, 11.14, .32, .50, .16, '#8ea0a2');
    detail.box(-7, 2.07, 11.20, 1.68, .69, .075, '#91a8a8');
    detail.box(-7, .95, 11.195, .065, 1.80, .06, ivory);
    detail.box(-13.1, 1.17, 11.14, 3.62, .48, .23, steel);
    detail.box(10.9, 1.17, 11.14, 3.62, .48, .23, steel);
    b.box(7, 7.34, 0, 6.4, 2.25, 6.25, steel);
    dish(b, 7.8, 12, 1.2, 5.4);
    const tx = -7, tz = -2.8, levels = [[6.2, 3.55], [13, 2.76], [20.1, 2.1], [27.1, 1.50], [34, .93], [40.6, .54], [46, .31]];
    for (let j = 1; j < levels.length; j++) {
        const [h0, r0] = levels[j - 1], [h1, r1] = levels[j], col = j % 2 ? '#a66059' : '#d0cfbd';
        for (const [sx, sz] of [[-1, -1], [-1, 1], [1, 1], [1, -1]]) {
            const foot = [tx + sx * r0, h0, tz + sz * r0], cap = [tx + sx * r1, h1, tz + sz * r1], next = [tx - sz * r1, h1, tz + sx * r1];
            b.beam(foot, cap, Math.max(.17, .43 - j * .03), col);
            b.beam(cap, next, .17, col);
            b.beam(foot, next, Math.max(.11, .23 - j * .014), col);
        }
    }
    for (const y of [19.95, 33.90]) {
        const w = y < 24 ? 4.9 : 2.6;
        b.box(tx, y, tz, w, .31, w, '#526b72');
        detail.box(tx, y + .47, tz + w * .46, w, .065, .065, ivory);
    }
    for (let i = 0; i < 3; i++) {
        const y = 35.8 + i * 1.1;
        b.box(tx + 1.1, y, tz, 2.1, .13, .15, ivory);
        b.box(tx + 2.1, y, tz, .14, .16, 2.0 - i * .23, ivory);
    }
    b.beam([tx, 46, tz], [tx, 51.8, tz], .19, iron);
    b.vessel(tx, tz, [[51.58, .23, .23, '#e08059'], [52, .18, .18, '#ffc99b']], 6);
}
function quarry(b, detail, sign, clad) {
    b.box(0, 1.05, 0, 36, 2.1, 28, '#77766e');
    b.box(0, 2.19, 0, 36.2, .23, 28.05, '#afb3ad');
    b.box(-8, 6.55, -1, 17.8, 8.55, 22.4, '#887563');
    b.box(-8, 10.94, -1, 18.2, .32, 22.8, snow);
    for (let i = 0; i < 5; i++)
        b.box(-14.75 + i * 3.4, 7.65, 10.22, 2.3, 1.37, .1, '#697f84');
    b.box(-8.5, 4.45, 10.23, 7.15, 4.38, .17, '#4b595b');
    b.box(-8.5, 6.67, 10.46, 7.65, .23, .77, '#b9b4a4');
    clad(-16.915, 6.65, -1, 21.8, 8.1, -Math.PI / 2);
    clad(-8, 6.65, -12.22, 17.5, 8.1, Math.PI);
    for (let y = 2.69; y < 6.45; y += .51)
        detail.box(-8.5, y, 10.332, 6.9, .065, .04, '#9a9584');
    for (const x of [-16.15, -12.9, -9.6, -6.3, -3, .12])
        detail.box(x, 9.05, 10.32, .14, 3.5, .09, '#af9984');
    sign(-8, 9.38, 10.34, 15.0, 1.45);
    const frame = '#916e50', sides = [4.4, 13.6];
    for (const x of sides)
        for (const z of [-6.5, 5.6]) {
            b.box(x, 10.5, z, .8, 16.6, .8, frame);
            b.box(x, 2.44, z, 1.67, .52, 1.60, ivory);
            b.beam([x, 5.5, z], [x, 15.8, z > 0 ? -6.5 : 5.6], .37, '#b28b62');
        }
    for (const z of [-6.5, 5.6]) {
        b.beam([4.4, 5.5, z], [13.6, 15.8, z], .46, frame);
        b.beam([13.6, 5.5, z], [4.4, 15.8, z], .4, frame);
    }
    b.vessel(9, -.4, [[8.3, 1.55, 1.5, '#67594e'], [14.6, 5.5, 5.4, '#c39970'], [17.3, 5.6, 5.4, '#716657'], [17.65, 5.7, 5.6, '#9d9b88']], 8);
    b.box(9.0, 19.7, -.35, 10.5, 4.0, 10.4, '#8f8b75');
    b.box(9.0, 21.83, -.35, 11, .25, 10.9, snow);
    for (const z of [-5.59, 4.88])
        b.box(9, 20.04, z, 8.85, 1.4, .13, '#75898a');
    for (const z of [-5.66, 4.96]) {
        for (const x of [5.0, 6.99, 8.98, 10.97, 12.96])
            detail.box(x, 20.04, z, .105, 1.48, .075, '#c9c8b6');
        detail.box(9, 18.39, z, 9.58, .34, .10, '#b99768');
    }
    for (let i = 0; i < 8; i++) {
        const a = (i + .5) * Math.PI / 4, x = Math.cos(a), z = Math.sin(a);
        detail.beam([9 + 1.56 * x, 8.51, -.4 + 1.52 * z], [9 + 5.54 * x, 14.61, -.4 + 5.44 * z], .24, '#a38162');
        detail.beam([9 + 5.54 * x, 14.61, -.4 + 5.44 * z], [9 + 5.62 * x, 17.33, -.4 + 5.42 * z], .19, '#cbc1a3');
    }
    b.vessel(11.9, -3.35, [[21.94, .78, .78, '#816858'], [28.8, .68, .68, '#b0a18c'], [29.7, .86, .86, '#775c4e'], [30, .86, .86, '#6d615b']], 10);
    const from = [-15.6, 5.2, -8.9], to = [8.3, 20.4, -6.6];
    b.beam(from, to, 3.1, '#78695b', 2.5);
    for (let i = 1; i <= 7; i++) {
        const t = i / 8, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t, z = from[2] + (to[2] - from[2]) * t;
        detail.beam([x - .4, y + 1.0, z - 1.58], [x + .17, y + .05, z - 1.58], .19, '#bb986a');
        if (i % 3 === 0)
            b.beam([x, 2.32, z], [x, y - 1, z], .55, frame);
    }
    for (let i = 0; i < 3; i++) {
        const x = -15.2 + i * 4.8, z = 12.35;
        b.vessel(x, z, [[2.30, 2.56, 1.42, '#72665e'], [3.0 + i * .31, 2.18, 1.10, '#a89886'], [3.12 + i * .31, 1.85, .80, '#bdc0b6']], 7);
    }
}
function water(b, detail, sign, clad) {
    b.box(0, 1.7, 0, 20, 3.4, 20, '#8b9390');
    b.box(0, .28, 0, 20.13, .56, 20.13, '#676e6a');
    b.box(0, 3.50, 0, 20.24, .20, 20.24, snow);
    b.box(0, 2.05, 10.10, 2.48, 2.6, .15, '#506965');
    for (const x of [-6.3, 6.3])
        b.box(x, 2.04, 10.07, 3.2, 1.45, .10, '#acb9ad');
    for (const side of [-1, 1])
        clad(side * 10.03, 1.94, 0, 19.8, 2.85, side * Math.PI / 2);
    for (const x of [-6.3, 6.3]) {
        detail.box(x, 2.04, 10.15, 3.02, 1.26, .07, '#6b8383');
        detail.box(x, 2.04, 10.197, .11, 1.25, .05, '#cdd1bd');
        detail.box(x, 1.83, 10.195, 2.99, .10, .05, '#bdc6b9');
        detail.box(x, 1.29, 10.16, 3.56, .15, .31, '#b3beb2');
    }
    for (const x of [-9.62, -3.53, 3.53, 9.62])
        detail.box(x, 1.90, 10.07, .33, 2.88, .26, '#9caa9f');
    sign(0, 4.06, 9.96, 11.2, 1.45);
    b.vessel(0, -1, [[3.60, 4.2, 4.2, '#97766a'], [4.30, 4.2, 4.2, '#ae8974'], [5.0, 3.54, 3.54, '#ab8875'], [17.8, 2.95, 2.95, '#9b796b'], [19.9, 4.70, 4.70, '#5f7c7d'], [21.1, 5.1, 5.1, '#779593'], [24.3, 7.50, 7.50, '#819e96'], [29.1, 7.5, 7.5, '#698d88'], [30.1, 7.8, 7.8, '#c5cec3'], [32.4, 3.9, 3.9, '#a2b9b3'], [33.35, .77, .77, '#758e88'], [34, .48, .48, '#c5d0c7']], 22);
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, x = Math.sin(a), z = Math.cos(a);
        b.beam([x * 5.5, 3.62, -1 + z * 5.5], [x * 3.12, 17.80, -1 + z * 3.12], .34, '#839b93');
        detail.beam([x * 3.2, 11.5, -1 + z * 3.2], [x * 3.65, 11.5, -1 + z * 3.65], .12, steel);
        const next = a + Math.PI / 4;
        b.beam([x * 6, 21.9, -1 + z * 6], [Math.sin(next) * 6, 21.9, -1 + Math.cos(next) * 6], .15, steel);
    }
    for (let i = 0; i < 12; i++) {
        const a = (i + .5) * 2 * Math.PI / 12, x = Math.cos(a), z = Math.sin(a), next = a + Math.PI / 6;
        detail.beam([x * 7.49, 24.5, -1 + z * 7.49], [x * 7.49, 29.07, -1 + z * 7.49], .085, '#a0b5a6');
        detail.beam([x * 6.06, 21.9, -1 + z * 6.06], [x * 6.06, 22.63, -1 + z * 6.06], .075, ivory);
        detail.beam([x * 6.06, 22.63, -1 + z * 6.06], [Math.cos(next) * 6.06, 22.63, -1 + Math.sin(next) * 6.06], .07, ivory);
    }
    b.quad([-.92, 26.54, 6.525], [0, 25.65, 6.525], [.92, 26.54, 6.525], [0, 28.11, 6.525], '#d8ded0');
    b.quad([-.40, 26.53, 6.54], [0, 26.12, 6.54], [.40, 26.53, 6.54], [0, 27.28, 6.54], '#698a86');
    for (const y of [25, 28.4])
        b.vessel(0, -1, [[y, 7.52, 7.52, '#a7bcb0'], [y + .13, 7.56, 7.56, '#97b1a7']], 22);
    for (let j = 0; j < 4; j++) {
        const yy = 6.25 + j * 2.8;
        b.box(.04, yy, 2.43 - j * .1, 1.07, 1.53, .12, '#566870');
        detail.box(.04, yy + .42, 2.51 - j * .1, .99, .065, .04, '#b2a793');
    }
}
function dock(b, detail, sign) {
    b.box(0, 1.22, 0, 50, 2.44, 28, '#7c817b');
    b.box(0, 2.56, 0, 50.1, .24, 28.1, '#a5aca9');
    for (const side of [-1, 1])
        for (let i = 0; i < 3; i++)
            b.box(0, 2.78 + i * .24, side * (8.9 + i * .85), 44.6, .37, 1.1, i % 2 ? '#b0b4aa' : '#818e8b');
    const stations = [[-21, .65], [-18, 3.6], [-11, 5.10], [0, 5.45], [12.4, 5.0], [17.8, 3.0], [21, .24]];
    for (let i = 1; i < stations.length; i++) {
        const [x0, q] = stations[i - 1], [x1, r] = stations[i];
        for (const side of [-1, 1]) {
            const levels = [[3.6, .34], [5.0, .68], [6.55, .94], [8.65, 1], [8.9, 1.03]];
            for (let j = 1; j < levels.length; j++) {
                const [y0, k] = levels[j - 1], [y1, m] = levels[j];
                const ring = [[x0, y0, q * k * side], [x1, y0, r * k * side], [x1, y1, r * m * side], [x0, y1, q * m * side]];
                if (side < 0)
                    ring.reverse();
                b.quad(ring[0], ring[1], ring[2], ring[3], ['', rust, '#9b695d', '#3d5458', '#b6b8aa'][j]);
            }
        }
        b.quad([x0, 8.9, q], [x1, 8.9, r], [x1, 8.9, -r], [x0, 8.9, -q], '#929a93');
    }
    for (const side of [-1, 1]) {
        for (let i = 1; i < stations.length; i++) {
            const [x0, r0] = stations[i - 1], [x1, r1] = stations[i], edge = (x, y, r) => [x, y, r * side];
            const stripe = [edge(x0, 7.94, r0 * .987 + .036), edge(x1, 7.94, r1 * .987 + .036), edge(x1, 8.14, r1 * .992 + .036), edge(x0, 8.14, r0 * .992 + .036)];
            if (side < 0)
                stripe.reverse();
            b.quad(stripe[0], stripe[1], stripe[2], stripe[3], '#a9b8ab');
            detail.beam(edge(x0, 9.66, r0), edge(x1, 9.66, r1), .085, ivory);
            for (const t of [.12, .60]) {
                const x = x0 + (x1 - x0) * t, r = r0 + (r1 - r0) * t;
                detail.beam(edge(x, 8.9, r), edge(x, 9.71, r), .067, ivory);
                if (r > 2.9)
                    detail.box(x, 7.40, side * (r * .975 + .05), .43, .36, .09, '#afbab1');
            }
        }
        detail.box(1.43, 9.26, side * 3.19, 3.85, .66, .79, '#71847d');
        detail.box(-8, 10.51, side * 3.16, 8.58, .50, .10, '#778f90');
    }
    b.box(-8, 10.27, .1, 9.5, 2.7, 6.0, '#b0afa0');
    b.box(-8.9, 12.53, .1, 6.6, 1.85, 5.2, '#c4c5b4');
    b.box(-8.9, 13.5, .1, 7.0, .23, 5.53, snow);
    for (const z of [-2.55, 2.75])
        b.box(-8.9, 12.65, z, 5.85, .78, .08, '#5d7880');
    b.box(-15.1, 10.90, 0, 1.7, 3.95, 2.15, '#a0755e');
    b.box(-15.1, 12.95, 0, 1.82, .22, 2.21, iron);
    b.beam([8, 8.94, 0], [8.7, 14.98, 0], .18, iron);
    for (const s of [-1, 1]) {
        const x = 10.5, footZ = s * 12.0, capZ = s * 10.4;
        for (const end of [-1, 1]) {
            const fx = x + end * 5.5, tx = x + end * 1.8;
            b.box(fx, 3.09, footZ, 2.75, .95, 1.42, iron);
            b.beam([fx, 3.55, footZ], [tx, 23.9, capZ], .88, rust, .7);
        }
        b.beam([x - 4.25, 9.0, footZ - s * .4], [x + 2.5, 18.0, capZ + s * .5], .41, '#ad826a');
    }
    for (const x of [8.65, 12.35]) {
        b.box(x, 23.95, .3, .60, .77, 27.5, rust);
        b.box(x, 27.55, .3, .60, .66, 27.5, '#bb8870');
        for (let i = 0; i < 8; i++) {
            const a = -13.2 + i * 3.4;
            b.beam([x, 24.2, a], [x, 27.25, a + 3.35], .32, rust);
            if (i % 2 === 0)
                b.beam([x, 27.25, a], [x, 24.2, a], .25, iron);
        }
    }
    b.box(10.5, 27.98, .3, 4.43, .26, 27.7, snow);
    b.box(10.5, 28.98, 7.0, 3.8, 1.93, 4.0, '#a87d69');
    b.box(10.55, 29.96, 7, 4.1, .13, 4.2, snow);
    b.box(10.5, 22.75, -5, 4.0, 2.35, 3.4, '#b38c76');
    b.box(10.5, 22.86, -6.73, 3.25, 1.12, .07, '#829b9c');
    detail.beam([8.8, 23, 1.4], [8.8, 12.65, 1.4], .14, iron);
    detail.beam([10.8, 23, 1.4], [10.8, 12.65, 1.4], .14, iron);
    b.box(9.8, 12.44, 1.4, 2.2, .42, .62, '#c7a773');
    sign(-6, 1.47, -14.025, 17.3, 1.75, Math.PI);
    sign(-7, 6.99, 5.4, 10.35, 1.06);
}
exports.landmarkArt = { radio, quarry, water, dock, ...outer_landmarks_js_1.outerLandmarkArt };
