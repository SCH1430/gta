"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailor = tailor;
exports.setInSleeve = setInSleeve;
const human_cloth_js_1 = require("./human-cloth.js");
const sections = 28, top = 11, bottom = 5, edge = 3;
const exp = .87;
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const signed = (x, p) => Math.sign(x) * Math.abs(x) ** p;
const hill = (v, centre, radius) => Math.exp(-(((v - centre) / radius) ** 2));
const smooth = (a, b, t) => a + (b - a) * t;
function tailor(rings, cut, fit) {
    function sculpt(p, a) {
        const y = p[1], x = Math.abs(p[0]), rear = Math.sin(a), flank = Math.abs(Math.cos(a));
        const fold = cut === 'quilted' ? .38 : cut === 'wool' ? .42 : cut === 'workwear' ? .95 : 1;
        const tension = hill(y, .137 + .051 * flank, .024) * hill(x, .116, .045);
        const hollow = hill(y, .289, .043) * flank ** 4;
        if (rear > 0) {
            const scapula = hill(y, .366, .087) * hill(x, .088, .056);
            const spine = hill(x, 0, .038) * hill(y, .306, .160);
            const lumbar = hill(y, .154, .067) * hill(x, .08, .045);
            p[2] += rear * (.018 * scapula - .009 * spine + .008 * lumbar + fold * .008 * tension - .008 * hollow);
        }
        else {
            const pectoral = hill(y, .326, .069) * hill(x, .077, .052);
            const abdomen = hill(y, .173, .063) * hill(x, 0, .092);
            p[2] += rear * (.016 * pectoral + .007 * abdomen - .006 * hill(x, 0, .042) * hill(y, .31, .12) + fold * .014 * tension - .006 * hollow);
            if (fit?.pocketSide * p[0] > 0) {
                const load = fit.pocketLoad * hill(y, .135, .043) * hill(x, .110, .042);
                p[1] -= load * .44;
                p[2] += rear * load;
            }
            if (fit?.packStraps) {
                const strap = hill(x, .105, .019) * clamp((y - .15) * 11) * clamp((.50 - y) * 16);
                p[2] -= rear * (cut === 'quilted' ? .014 : .007) * strap;
            }
        }
    }
    function light(p, a) {
        const x = Math.abs(p[0]), y = p[1], back = Math.max(0, Math.sin(a)), side = Math.abs(Math.cos(a));
        const armpit = hill(y, .288, .063) * side ** 4;
        const yoke = hill(y, .36, .017) * back;
        const waist = hill(y, .155, .083) * hill(x, .107, .051);
        const blade = hill(y, .375, .088) * hill(x, .083, .057) * back;
        return 1 - .25 * armpit - .07 * yoke - .10 * waist + .06 * blade;
    }
    function vertex(row, k) {
        const [y, w, f, b, x = 0, z = 0] = rings[row], a = k * 2 * Math.PI / sections, c = Math.cos(a), s = Math.sin(a);
        const p = [x + w * signed(c, exp), y, z + (s < 0 ? f : b) * signed(s, exp)];
        sculpt(p, a);
        return p;
    }
    function point(x, y, offset = .003, back = false) {
        let j = 1;
        while (j < rings.length - 1 && rings[j][0] < y)
            j++;
        const a = rings[j - 1], b = rings[j], t = clamp((y - a[0]) / (b[0] - a[0]));
        const mix = (i) => smooth(a[i] ?? 0, b[i] ?? 0, t);
        const angle = (back ? 1 : -1) * Math.acos(signed(clamp(x / mix(1), -1, 1), 1 / exp)), s = Math.sin(angle);
        const p = [x, y, mix(5) + (s < 0 ? mix(2) : mix(3)) * signed(s, exp) + (back ? offset : -offset)];
        sculpt(p, angle);
        return p;
    }
    function atAngle(y, angle, clearance = .003) {
        let j = 1;
        while (j < rings.length - 1 && rings[j][0] < y)
            j++;
        const a = rings[j - 1], b = rings[j], t = clamp((y - a[0]) / (b[0] - a[0]));
        const mix = (i) => smooth(a[i] ?? 0, b[i] ?? 0, t), c = Math.cos(angle), s = Math.sin(angle);
        const p = [(mix(1) + clearance) * signed(c, exp), y, mix(5) + (mix(s < 0 ? 2 : 3) + clearance) * signed(s, exp)];
        sculpt(p, angle);
        return p;
    }
    function armhole(side) {
        const ring = [];
        const put = (j, k) => ring.push(vertex(j, side === 1 ? k : sections / 2 - k));
        for (let k = 0; k < edge; k++)
            put(top, k);
        for (let j = top; j > bottom; j--)
            put(j, edge);
        for (let k = edge; k > -edge; k--)
            put(bottom, k);
        for (let j = bottom; j < top; j++)
            put(j, -edge);
        for (let k = -edge; k < 0; k++)
            put(top, k);
        return ring;
    }
    function cutSocket(j, k) {
        const a = (k + .5) * Math.PI * 2 / sections;
        return j >= bottom && j < top && Math.abs(Math.sin(a)) < Math.sin(edge * Math.PI * 2 / sections);
    }
    return { point, atAngle, armhole, cut: cutSocket, sculpt, light };
}
function setInSleeve(side, socket, shoulderX, arms, main, accent, hero, cut) {
    const segments = socket.length;
    const bands = Array.from({ length: 10 }, () => []);
    const sleeve = new human_cloth_js_1.Surface('sleeves');
    const band = cut === 'windbreaker';
    for (let i = 0; i < segments; i++) {
        const angle = Math.PI * 2 * i / segments, c = Math.cos(angle), s = Math.sin(angle);
        const socketVertex = socket[i];
        const root = [socketVertex[0] - shoulderX, socketVertex[1] - .420, socketVertex[2]];
        bands[0].push(root);
        const underarm = Math.max(0, -c);
        // Drop the inner edge below the armpit; the outer edge rounds continuously into the upper arm.
        const drop = .094 * underarm;
        for (const [j, row] of [[4, 4], [5, 5], [6, 5], [7, 5], [8, 6], [9, 7]]) {
            const [y, r, f, b, dx = 0, dz = 0] = arms[row];
            const offset = j === 5 ? .013 : j === 6 ? .004 : j === 7 ? -.006 : 0;
            const bulge = j === 9 ? 1 : 1 + .024 * Math.cos(i * 4 * Math.PI / segments) + (cut === 'quilted' ? .04 : 0);
            const underarmDrop = drop * clamp((y + .190) / .129);
            const p = [dx + side * r * signed(c, .90) * bulge, y + offset - underarmDrop + (j > 4 && j < 8 ? .007 * s : 0), dz + (s < 0 ? f : b) * signed(s, .90) * bulge];
            if (j === 4) {
                for (let band = 1; band <= 3; band++) {
                    const u = band / 4, across = 1 - (1 - u) ** 1.75;
                    bands[band].push([smooth(root[0], p[0], across), smooth(root[1], p[1], u * (.74 + .26 * u)), smooth(root[2], p[2], across)]);
                }
            }
            bands[j].push(p);
        }
    }
    const yoke = (0, human_cloth_js_1.tint)(main, hero ? .96 : 1);
    const colors = [yoke, yoke, yoke, yoke, main, main, band ? (0, human_cloth_js_1.tint)(accent, .83) : main, main, main];
    return sleeve.sleeve(bands, side, colors, colors.map(() => 1), [0, .18, .44, .72, .93, 1, 1, 1, 1, 1]).mesh('jacket-upper-sleeve');
}
