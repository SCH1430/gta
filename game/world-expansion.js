"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCityExpansion = addCityExpansion;
const THREE = require("../engine/three.module.min.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const world_expansion_floor_js_1 = require("./world-expansion-floor.js");
const world_expansion_facades_js_1 = require("./world-expansion-facades.js");
const region_layout_js_1 = require("./region-layout.js");
const region_wayfinding_js_1 = require("./region-wayfinding.js");
const region_architecture_js_1 = require("./region-architecture.js");
const outer_woodland_view_js_1 = require("./outer-woodland-view.js");
const snow = '#d3dbe1', steel = '#526572', rust = '#986f5f', brass = '#c4a779';
const floorCount = (f) => f.kind === 'warehouse' ? 1 : f.kind === 'plant' ? 2 : Math.max(1, Math.round(f.h / 3.5));
function frontage(f) {
    let best = Infinity, angle = 0;
    for (const r of world_expansion_layout_js_1.expansionRoads) {
        if (r.x1 === r.x2) {
            if (f.z < r.z1 || f.z > r.z2)
                continue;
            const dist = Math.abs(r.x1 - f.x) - f.w / 2;
            if (dist < best) {
                best = dist;
                angle = Math.sign(r.x1 - f.x) * Math.PI / 2;
            }
        }
        else {
            if (f.x < r.x1 || f.x > r.x2)
                continue;
            const dist = Math.abs(r.z1 - f.z) - f.d / 2;
            if (dist < best) {
                best = dist;
                angle = r.z1 > f.z ? 0 : Math.PI;
            }
        }
    }
    const { x, z, w, d } = f, s = Math.sin(angle), c = Math.cos(angle), front = (Math.abs(s) * w + Math.abs(c) * d) / 2, width = Math.abs(s) * d + Math.abs(c) * w;
    const point = (l, ahead) => ({ x: x + l * c + (front + ahead) * s, z: z - l * s + (front + ahead) * c });
    return { angle, width, point };
}
function regularBuilding(f, n, b, walls, sign) {
    const { x, z, h, w, d, kind } = f;
    const industrial = kind === 'plant', residential = kind === 'brick' || kind === 'hotel', corrugated = kind === 'warehouse' || kind === 'dock';
    const col = kind === 'brick' ? '#846c65' : kind === 'hotel' ? '#8b9093' : kind === 'dock' ? '#987a69' : '#727e86';
    b.box(x, h / 2, z, w, h, d, col);
    const fl = floorCount(f);
    for (const [ax, az, width, ang] of [[x, z + d / 2 + .012, w, 0], [x, z - d / 2 - .012, w, Math.PI], [x + w / 2 + .012, z, d, Math.PI / 2], [x - w / 2 - .012, z, d, -Math.PI / 2]]) {
        const cols = Math.max(2, Math.min(7, Math.round(width / (industrial ? 6.5 : residential ? 3.1 : 5.3))));
        const seed = cols * 117 + fl * 235 + (kind.charCodeAt(0) - 96) * 37 + n % 2;
        walls.place('exp' + kind + cols + '_' + fl + '_' + n % 2, () => (0, world_expansion_facades_js_1.workFacade)(kind, cols, fl, seed), ax, h * .506, az, width - .05, h - .17, ang);
    }
    b.box(x, h - .12, z, w + .29, .28, d + .29, steel);
    b.box(x, h + .095, z, w + .35, .16, d + .35, snow);
    const front = frontage(f);
    const local = (l, y, a, ww, hh, dd, colour) => {
        const p = front.point(l, a);
        b.box(p.x, y, p.z, ww, hh, dd, colour, front.angle);
    };
    if (industrial) {
        const bays = Math.max(3, Math.round(d / 7)), dz = (d - .9) / bays;
        for (let j = 0; j < bays; j++) {
            const rz = z - d / 2 + .45 + dz * (j + .5);
            b.piece('box', x, h + .54, rz, w - .8, .15, dz * .98, snow, 0, 0, -.138);
            b.box(x, h + .49, rz - dz * .49, w - .82, .87, .14, '#4e6671');
            b.lamp(x, h + .56, rz - dz * .49 - .1, w * .71, .26, .025, '#c1ae84');
        }
        if (f.name === 'ЛИТЕЙНАЯ № 3') {
            for (let i = 0; i < 4; i++) {
                const az = z - 18 + i * 11.0;
                b.box(x, h + 1.48, az, w - .76, 2.96, .19, '#475863');
                b.box(x, h + 1.91, az - .13, w - 1.15, 1.35, .075, '#a0b5b4');
                for (let u = -11; u <= 11; u += 3.14)
                    b.box(x + u, h + 1.88, az - .18, .10, 1.49, .09, steel);
                b.piece('box', x, h + 1.70, az + 3.55, w - .76, .19, 7.54, snow, 0, 0, .346);
            }
        }
        const cx = x + w * .27, cz = z + d * .27;
        b.cyl(cx, h + 4.85, cz, 1.46, 9.7, '#8a6e68');
        b.cyl(cx, h + 6.3, cz, 1.49, 1.24, '#d0c3b0');
        b.cyl(cx, h + 8.8, cz, 1.49, 1.30, '#d0c3b0');
        b.lamp(cx, h + 9.84, cz, .19, .21, .19, '#f29e74');
        local(-front.width * .28, 2.30, .09, 4.0, 4.6, .19, '#455b68');
        for (let j = 0; j < 6; j++)
            local(-front.width * .28, .48 + j * .60, .20, 3.78, .055, .06, '#7f8d92');
        local(-front.width * .28, 4.98, .35, 4.8, .18, .94, '#687b86');
    }
    else if (residential) {
        b.box(x + w * .21, h + .75, z, w * .34, 1.35, d * .23, '#7c858a');
        b.box(x + w * .21, h + 1.48, z, w * .34 + .13, .16, d * .23 + .20, snow);
        local(-front.width * .22, 1.18, .11, 1.42, 2.35, .16, '#36515c');
        local(-front.width * .22, 2.49, .25, 2.21, .17, .65, '#89999d');
        for (let j = 1; j < fl; j++)
            local(front.width * .24, j * h / fl + .20, .27, 2.35, .55, .66, '#888e96');
        if (kind === 'hotel') {
            b.cyl(x - w * .23, h + 1.8, z, .12, 3.6, steel);
            b.box(x - w * .23, h + 3.28, z, 1.8, .057, .06, brass);
        }
    }
    else {
        const loading = kind === 'station';
        for (let k = -1; k <= 1; k += 2) {
            local(k * front.width * .27, 1.63, .10, 2.6, 3.26, .22, '#405562');
            for (let row = 0; row < 4; row++)
                local(k * front.width * .27, .42 + row * .69, .23, 2.43, .046, .031, '#75888e');
        }
        local(0, 3.53, .56, front.width * .82, .16, 1.35, '#829294');
        if (loading) {
            local(0, 3.66, .57, front.width * .84, .09, 1.49, snow);
            for (const l of [-.34, .34])
                local(l * front.width, 2.43, .96, .12, 2.45, .12, '#667d85');
        }
        if (corrugated) {
            b.cyl(x - w * .27, h + .54, z, .80, 1.10, '#60717b');
            b.cyl(x + w * .25, h + .48, z, .66, .95, '#627680');
        }
    }
    if (f.name) {
        const width = Math.min(front.width - 1.2, Math.max(5.2, f.name.length * .60)), sy = industrial ? h * .78 : residential ? h * .55 : h * .77;
        const ink = kind === 'brick' || industrial ? '#ffd49a' : kind === 'dock' ? '#c8e7e0' : '#9fe1da';
        local(0, sy, .19, width + .27, 1.53, .20, '#3c535b');
        const badge = front.point(0, .31);
        sign(f.name, industrial ? 'СЕВПРОМ · ПРОМЫШЛЕННАЯ ЛИНИЯ' : kind === 'dock' ? 'УПРАВЛЕНИЕ РЕЧНОГО ФЛОТА' : 'КАНАЛЬСК · ГОРОДСКАЯ СЕТЬ', ink, '#354952', badge.x, sy, badge.z, width, 1.31, front.angle);
        local(0, sy - .78, .18, width * .77, .045, .11, industrial ? '#d7a96f' : '#7cc7c3');
    }
    b.cyl(x + w / 2 + .08, h / 2, z + d * .40, .12, h - .2, '#667781');
}
function coolingTower(parent, b, f, sign) {
    const { x, z, h, w } = f, r = w / 2;
    const silhouette = [[.0, .93], [.13, 1], [.28, .83], [.50, .65], [.70, .56], [.86, .57], [1, .63]];
    const points = silhouette.map(([y, k]) => new THREE.Vector2(k * r, h * y));
    const g = new THREE.LatheGeometry(points, 22), pos = g.getAttribute('position'), colors = [], shade = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / h, angle = Math.atan2(pos.getZ(i), pos.getX(i)), band = (Math.round(angle * 22 / (2 * Math.PI)) % 3 === 0 ? .96 : 1);
        shade.set(y < .14 ? '#727e83' : y > .85 ? '#a88e82' : '#b0a29b').multiplyScalar(band);
        colors.push(shade.r, shade.g, shade.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    mesh.position.set(x, 0, z);
    parent.add(mesh);
    b.cyl(x, h - .20, z, r * 1.24, .47, '#7a8184');
    b.cyl(x, h + .06, z, r * 1.27, .15, snow);
    b.cyl(x, h + .151, z, r * 1.10, .055, '#48545e');
    for (let k = 0; k < 16; k++) {
        const a = 2 * Math.PI * k / 16;
        b.beam(x + Math.cos(a) * r * .95, .25, z + Math.sin(a) * r * .95, x + Math.cos(a + .105) * r * .98, 3.10, z + Math.sin(a + .105) * r * .98, .22, '#6c787d', true);
    }
    if (f.name)
        sign('ТЭЦ 08', 'ТЕПЛОСЕТЬ КАНАЛЬСКА', '#ffd293', '#52575b', x, h * .36, z + r * .80, 5.92, 1.56);
}
function gantry(b, f, sign) {
    const { x, z, h, w, d } = f, ink = '#b58468';
    for (const a of [-1, 1])
        for (const c of [-1, 1]) {
            const dx = w * .44 * a, dz = d * .44 * c;
            b.beam(x + dx, .09, z + dz, x + dx * .68, h - 4, z + dz * .72, .62, ink, true);
            b.beam(x + dx, 1.7, z + dz, x - dx * .72, h - 5, z + dz * .72, .18, '#8b7971', true);
            b.box(x + dx, .36, z + dz, .96, .72, .86, '#65727a');
        }
    b.box(x, h - 3.3, z, w * .90, 1.42, d * .88, '#a07e68');
    b.box(x, h - 2.48, z, w * .92, .15, d * .90, snow);
    b.box(x + .8, h - 1.44, z, 2.52, 2.04, 2.26, '#a68870');
    b.box(x + .8, h - 1.27, z - 1.18, 2.16, 1.01, .095, '#99b7b7');
    for (const a of [-1, 1]) {
        b.beam(x, h - .35, z + .93, x + a * 1.76, h + 5.45, z + 3.62, .20, ink, true);
        b.beam(x + a * 1.76, h + 5.45, z + 3.62, x + a * .42, h + 1.66, z - 12.2, .052, steel, true);
    }
    const tipZ = z - 12.4;
    for (const side of [-.72, .72]) {
        b.beam(x + side, h - 2.0, z + 3, x + side, h + 1, tipZ, .25, ink, true);
        b.beam(x + side, h + .52, z + 2.9, x + side, h + 1.73, tipZ, .22, ink, true);
        for (let i = 0; i < 5; i++) {
            const t = i / 5, next = (i + 1) / 5;
            b.beam(x + side, h - 2 + t * 3, z + 3 - 15.4 * t, x + side, h + .52 + next * 1.21, z + 3 - 15.4 * next, .11, '#a68b76', true);
        }
    }
    b.beam(x, h + 1.2, tipZ, x, h - 7.15, tipZ, .06, steel, true);
    b.box(x, h - 7.23, tipZ, 1.3, .24, .35, '#bca278');
    sign(f.name, 'ПОРТОВЫЙ КРАН', '#f5ce93', '#625c59', x, h - 3.16, z + d * .44 + .015, 2.19, .81);
}
function cargo(b, f) {
    const { x, z, w, d, h } = f;
    for (let j = 0; j < Math.round(h / 2.7); j++) {
        const y = j * 2.7, c = (j === 0 ? (x > 145 ? '#527778' : '#9b795e') : '#aa7e64');
        b.box(x, y + 1.31, z, w, 2.62, d, c);
        b.box(x, y + 2.63, z, w + .09, .09, d + .09, snow);
        for (let k = -w * .46; k < w * .48; k += 1.38)
            b.box(x + k, y + 1.31, z + d * .50, .11, 2.55, .11, '#52666a');
        for (const e of [-1, 1])
            b.box(x + e * w * .5, y + 1.3, z, .10, 2.57, d * .76, '#607477');
        b.box(x - w * .32, y + 1.56, z + d / 2 + .07, 2.1, .39, .024, '#c4c1a4');
    }
}
function riverfront(b, parent, sign) {
    for (const [a, end] of world_expansion_layout_js_1.bankSegments) {
        const wide = end - a, x = (a + end) * .5;
        for (const z of [world_expansion_layout_js_1.canal.north, world_expansion_layout_js_1.canal.south]) {
            b.box(x, -.22, z, wide, 1.12, .71, '#687986');
            b.box(x, .37, z, wide, .13, .82, '#acb9c3');
            b.box(x, 1.38, z, wide, .09, .09, '#758691');
            b.box(x, .96, z, wide, .065, .08, '#71838d');
            for (let xx = a + .26; xx < end; xx += 4.8)
                b.box(xx, .86, z, .13, 1.18, .13, steel);
        }
    }
    for (const x of world_expansion_layout_js_1.iceSlips) {
        for (const z of [world_expansion_layout_js_1.canal.north, world_expansion_layout_js_1.canal.south]) {
            const side = z === world_expansion_layout_js_1.canal.north ? 1 : -1;
            if (x === market_quarter_layout_js_1.marketIceSlip) {
                for (let j = 0; j < 8; j++) {
                    const a = z + side * (j * .51 + .12), c = a + side * .44, h1 = (0, world_expansion_layout_js_1.shoreHeight)(a), h2 = (0, world_expansion_layout_js_1.shoreHeight)(c);
                    b.beam(x - 1.57, h1 + .027, a, x - 1.57, h2 + .027, c, .077, '#c49462', true);
                    b.beam(x + 1.57, h1 + .027, a, x + 1.57, h2 + .027, c, .077, '#c49462', true);
                }
                continue;
            }
            for (let k = 0; k < 5; k++)
                b.box(x, -.12 - k * .115, z + side * k * .69, 3.25, .13, .61, '#8b9ca6');
            sign('СПУСК НА ЛЁД', 'ШЛЮЗОВОЙ КАНАЛ', '#d9d6b2', '#425b6a', x - 1.37, 1.03, z - .38, 1.77, .64, side === 1 ? Math.PI : 0);
        }
    }
    sign('КАНАЛ № 2', 'ГЛУБИНА 4,2 М', '#d2dfde', '#435b67', -33, 1.25, 60.75, 2.65, .65, Math.PI);
    for (const [i, bridge] of world_expansion_layout_js_1.bridges.entries()) {
        const { x, name } = bridge, patina = ['#957064', '#577e80', '#a0694b', '#547f88', '#875947', '#628995'][i] ?? steel;
        (0, world_expansion_floor_js_1.bridgeDeck)(parent, x);
        for (const side of [-1, 1]) {
            const sx = x + side * 6.85, runs = (0, world_expansion_layout_js_1.bridgeRailingRuns)(x);
            for (const [start, end] of runs) {
                const rz = [start, ...[63, 84].filter(z => z > start && z < end), end];
                for (let k = 1; k < rz.length; k++) {
                    const a = rz[k - 1], d = rz[k], ya = (0, world_expansion_layout_js_1.bridgeHeight)(x, a), yd = (0, world_expansion_layout_js_1.bridgeHeight)(x, d);
                    b.beam(sx, ya + .16, a, sx, yd + .16, d, .41, '#6f818b', true);
                    b.beam(sx, ya + 1.12, a, sx, yd + 1.12, d, .12, patina, true);
                    b.beam(sx, ya + .76, a, sx, yd + .76, d, .075, patina, true);
                }
                for (let z = start; z <= end; z += 3) {
                    const h = (0, world_expansion_layout_js_1.bridgeHeight)(x, z) ?? 0;
                    b.box(sx, h + .57, z, .14, 1.16, .14, patina);
                    b.lamp(sx - side * .079, h + .49, z, .034, .125, .13, side > 0 ? '#deb16f' : '#c6d9d7');
                }
            }
            b.box(sx, .60, 73.5, .48, .88, 21, steel);
            if (i === 1) {
                const heights = [2.08, 4.5, 5.24, 5.24, 4.5, 2.08];
                for (let k = 0; k < 5; k++) {
                    const z = 61.5 + 4.8 * k, end = z + 4.8;
                    b.beam(sx, heights[k], z, sx, heights[k + 1], end, .25, patina, true);
                    b.beam(sx, 1.5, z, sx, heights[k + 1], end, .165, '#759596', true);
                    b.beam(sx, heights[k], z, sx, 1.5, z, .20, patina, true);
                }
                for (const z of [64.8, 82.2])
                    b.lamp(sx, 3.10, z, .17, .23, .19, '#e6bd82');
            }
            else if (i === 4) {
                for (const z of [59.3, 72.8, 86.4]) {
                    b.beam(sx, (0, world_expansion_layout_js_1.bridgeHeight)(x, z) + .26, z, sx, 6.41, z, .34, patina, true);
                    b.beam(sx - side * .47, 6.30, z, sx, 5.25, z, .18, '#a46b4f', true);
                    b.lamp(sx - side * .17, 5.24, z, .19, .17, .22, '#e4ad68');
                    b.box(sx, 6.46, z, .43, .075, .64, snow);
                }
                b.beam(sx, 6.42, 59.3, sx, 6.42, 86.4, .23, patina, true);
                for (const z of [59.3, 72.8]) {
                    b.beam(sx, 1.72, z, sx, 6.33, z + 13.5, .13, patina, true);
                    b.beam(sx, 6.33, z, sx, 1.72, z + 13.5, .11, '#a26b53', true);
                }
            }
            else if (i === 5) {
                for (const z of [61.6, 84.2]) {
                    b.box(sx + side * 1.93, .03, z, 2.68, 3.2, 3.56, '#637783');
                    b.box(sx + side * 1.95, 2.39, z, 1.96, 4.18, 2.69, '#a5b2b8');
                    b.box(sx + side * 1.95, 4.51, z, 2.25, .12, 2.94, snow);
                    b.lamp(sx + side * 1.95, 3.64, z + .1 * side, 1.07, .21, 2.75, '#9dd2d5');
                    b.box(sx + side * .86, 2.08, z, .42, 1.44, .21, patina);
                }
                for (const z of [66.2, 73.5, 79.7])
                    b.lamp(sx, 2.45, z, .22, .27, .22, '#b8ddeb');
            }
            else if (i >= 2) {
                const faceColor = i === 2 ? '#946446' : '#639092';
                for (let z = 63; z < 84; z += 4.2) {
                    b.box(sx, 2.28, z + 2.1, .20, .17, 4.2, patina);
                    b.beam(sx, 1.43, z, sx, 2.23, z + 4.2, .14, faceColor, true);
                    if (i === 3)
                        b.beam(sx, 2.23, z, sx, 1.43, z + 4.2, .11, faceColor, true);
                }
                for (const z of [62, 73.5, 85])
                    b.lamp(sx, 2.32, z, .23, .13, .48, i === 2 ? '#dbb875' : '#b7ddd4');
            }
            else {
                for (const z of [63, 84]) {
                    b.box(sx, .42, z, 1.19, 2.15, 1.49, '#758794');
                    b.box(sx, 1.61, z, 1.40, .26, 1.70, snow);
                }
            }
        }
        if (i === 4)
            for (const z of [59.3, 72.8, 86.4])
                b.beam(x - 6.85, 6.41, z, x + 6.85, 6.41, z, .26, patina, true);
        const xsign = x + 8.5;
        b.box(xsign, .85, 57, .11, 1.7, .13, steel);
        b.box(xsign, 1.87, 57, 3.31, .94, .12, '#405864');
        sign(name.toUpperCase(), 'ШЛЮЗОВОЙ КАНАЛ', '#c7e7dc', '#38525c', xsign, 1.88, 56.92, 3.19, .83, Math.PI);
    }
}
function freightTerminal(b, sign) {
    const middle = 127.1, span = 33.4, z = -21;
    b.box(middle, 6.05, z, span, .38, 2.46, steel);
    b.box(middle, 8.49, z, span + .14, .20, 2.68, snow);
    for (const side of [-1, 1]) {
        const face = z + side * 1.12;
        b.box(middle, 7.14, face, span, 1.88, .08, '#83999e');
        b.box(middle, 6.47, face + side * .06, span, .55, .11, '#6b7c83');
        for (let start = -16.4; start < 15.8; start += 3.25) {
            b.box(middle + start, 7.25, face + side * .09, .095, 2.16, .11, steel);
            b.beam(middle + start, 6.21, face + side * .12, middle + start + 3.22, 8.36, face + side * .12, .11, steel, true);
        }
    }
    b.box(112.4, 2.86, 13, 1.3, 5.72, 2.08, '#73838a');
    b.box(112.4, 5.64, 13, 2.05, .58, 6.92, steel);
    for (const dz of [-1.52, 1.52]) {
        b.box(100.4, 7.08, 13 + dz, 23.6, .15, .18, '#6c777d');
        b.box(112.65, 7.41, 13 + dz, .46, .81, .91, '#a06f59');
        b.beam(111.4, 7.05, 13 + dz, 112.5, 7.9, 13 + dz, .22, steel, true);
    }
    b.box(112.65, 7.91, 13, .42, .24, 4.3, '#b68d56');
    b.box(111, 6.38, 16.86, 3.6, 1, .16, '#3c555d');
    sign('ТОВАРНАЯ', 'ГРУЗОВОЙ ТУПИК', '#d2e2d1', '#425965', 111, 6.38, 16.98, 3.45, .91);
    for (const z of [-23, -2.7]) {
        b.box(111.19, 5.42, z, .30, 1.16, 1.70, '#354a54');
        sign('20·47', 'ПОСТ ВОСТОЧНЫЙ', '#e9bc80', '#324b53', 111.36, 5.42, z, 1.55, .98, Math.PI / 2);
        b.lamp(111.37, 4.9, z, .05, .046, 1.12, '#dfab72');
    }
}
function pipeRack(b) {
    for (const x of [-42, -2, 36]) {
        b.box(x, 2.24, -82, .26, 4.48, .40, steel);
        b.box(x, 4.32, -82, .38, .28, 3.5, '#6d8088');
    }
    for (const dz of [-.70, .70]) {
        b.beam(-44, 4.75, -82 + dz, 38, 4.75, -82 + dz, .48, '#a7a899');
        for (let x = -42; x < 39; x += 7.6)
            b.box(x, 4.75, -82 + dz, .13, .61, .58, '#77878a');
    }
}
function perimeter(b, sign) {
    const { minX, maxX, minZ, maxZ } = region_layout_js_1.regionLimits;
    function line(ax, az, bx, bz) {
        const length = Math.hypot(bx - ax, bz - az), count = Math.ceil(length / 22), horizontal = az === bz;
        for (let i = 0; i < count; i++) {
            const t = (i + .5) / count, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
            const w = horizontal ? length / count : .75, d = horizontal ? .75 : length / count;
            b.box(x, .66, z, w, 1.32, d, '#788592');
            b.box(x, 1.37, z, w + .08, .12, d + .08, snow);
            b.box(x, .86, z, horizontal ? .57 : .95, 1.72, horizontal ? .95 : .57, '#72808a');
            if (i % 3 === 0)
                b.lamp(x, 1.22, z, horizontal ? .24 : 1.02, .12, horizontal ? 1.02 : .24, '#dca466');
        }
    }
    for (const x of [minX - .50, maxX + .50]) {
        line(x, minZ, x, world_expansion_layout_js_1.canal.north);
        line(x, world_expansion_layout_js_1.canal.south, x, maxZ);
        for (let z = world_expansion_layout_js_1.canal.north + 2; z < world_expansion_layout_js_1.canal.south; z += 3.4) {
            b.cyl(x, .12, z, .26, 1.72, '#e2d5bb');
            b.cyl(x, .63, z, .28, .30, '#aa735c');
        }
    }
    line(minX, minZ - .5, maxX, minZ - .5);
    line(minX, maxZ + .5, maxX, maxZ + .5);
    for (const [x, z, angle] of [[-510, minZ + .47, 0], [maxX - .47, 30, -Math.PI / 2], [46, maxZ - .47, Math.PI], [minX + .47, -117, Math.PI / 2]]) {
        sign('ГРАНИЦА ОКРУГА', 'СЛУЖЕБНЫЙ ПЕРИМЕТР', '#e5dab5', '#53616c', x, 1.00, z, 3.4, .74, angle);
    }
}
function regionalSigns(b, sign) {
    for (const s of region_wayfinding_js_1.directionSigns) {
        const green = s.code === 'К-77' ? '#315752' : '#394f60', ink = s.code === 'К-77' ? '#e0d9a6' : '#d4e8dd';
        const nx = Math.sin(s.yaw), nz = Math.cos(s.yaw);
        b.box(s.x, 1.63, s.z, .22, 3.26, .22, '#6d808b');
        b.box(s.x, 2.57, s.z, 5.14, 1.36, .115, steel, s.yaw);
        b.box(s.x, 3.27, s.z, 5.25, .10, .24, snow, s.yaw);
        sign(s.title, s.subtitle, ink, green, s.x + nx * .064, 2.57, s.z + nz * .064, 5.01, 1.23, s.yaw, s.code);
        sign(s.back, '↑  ПРЯМО ПО УЛИЦЕ', '#cddbd9', green, s.x - nx * .064, 2.57, s.z - nz * .064, 5.01, 1.23, s.yaw + Math.PI);
    }
}
function addCityExpansion(parent, b, walls, sign) {
    (0, world_expansion_floor_js_1.addCityGround)(parent);
    riverfront(b, parent, sign);
    pipeRack(b);
    freightTerminal(b, sign);
    perimeter(b, sign);
    regionalSigns(b, sign);
    world_expansion_layout_js_1.expansionBuildings.forEach((s, i) => {
        if (s.kind === 'crane')
            gantry(b, s, sign);
        else if (s.kind === 'tower')
            coolingTower(parent, b, s, sign);
        else if (s.kind === 'container')
            cargo(b, s);
        else if (s.kind === 'tank') {
            b.cyl(s.x, s.h / 2, s.z, s.w, s.h, '#9caba9');
            b.cyl(s.x, s.h + .03, s.z, s.w + .13, .14, snow);
            for (const h of [1.05, 5.1, 10.5, s.h - .36])
                b.cyl(s.x, h, s.z, s.w + .13, .19, '#6a8386');
            sign('РЕЗЕРВ 04', 'ТЕПЛОНОСИТЕЛЬ', '#d6dec8', '#526b71', s.x, s.h * .54, s.z + s.d / 2 + .025, 3.18, 1.18);
        }
        else
            regularBuilding(s, i, b, walls, sign);
    });
    const cullSchool = require("./school-exterior.js").addSchoolExterior(parent);
    const cullArchitecture = (0, region_architecture_js_1.addRegionalArchitecture)(parent), cullWoodlands = (0, outer_woodland_view_js_1.addOuterWoodlands)(parent);
    return (camera) => { cullArchitecture(camera); cullWoodlands(camera); cullSchool(camera); };
}
