"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.letters = letters;
exports.wheel = wheel;
exports.shell = shell;
exports.basement = basement;
exports.workshop = workshop;
exports.dispatch = dispatch;
const world_textures_js_1 = require("./world-textures.js");
const interior_layout_js_1 = require("./interior-layout.js");
const interior_prints_js_1 = require("./interior-prints.js");
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
function letters(p) {
    return (s, sub, x, y, z, w, h, a = 0, bg = '#435e61', ink = '#eddbb5') => p.place('label' + s + sub, () => (0, world_textures_js_1.signTexture)(s, sub, ink, bg, w / h), x, y, z, w, h, a);
}
function wheel(b, x, y, z, r, col) {
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, k = (i + 1) * Math.PI / 4;
        b.beam(x + Math.cos(a) * r, y + Math.sin(a) * r, z, x + Math.cos(k) * r, y + Math.sin(k) * r, z, .036, col);
        if (i % 2 === 0)
            b.beam(x, y, z, x + Math.cos(a) * r, y + Math.sin(a) * r, z, .024, col);
    }
    b.piece('round', x, y, z, .084, .065, .084, '#a49981', 0, 0, Math.PI / 2);
}
function shell(zone, b, sign) {
    const r = interior_layout_js_1.annexes[zone], q = r.bounds, f = r.floor, l = q.minX, e = q.maxX, n = q.minZ, s = q.maxZ, w = e - l, d = s - n, x = (l + e) / 2, z = (n + s) / 2;
    if (zone === 'stairs') {
        const min = 3.06, max = 20.9;
        for (const xx of [l, e])
            b.box(xx, (min + max) / 2, z, .16, max - min, d, '#bcbbaa');
        for (const zz of [n, s])
            b.box(x, (min + max) / 2, zz, w, max - min, .16, '#b6b6a5');
        for (let k = 0; k < 5; k++) {
            const xx = interior_layout_js_1.stairBaseX + k * interior_layout_js_1.laneWidth, dir = k % 2 ? 1 : -1, y0 = min + k * interior_layout_js_1.riseFlight;
            const start = dir === 1 ? -2.8 : 2.8, end = -start;
            for (const [zz, h] of [[start + Math.sign(start) * .67, y0], [end + Math.sign(end) * .67, y0 + interior_layout_js_1.riseFlight]]) {
                b.box(xx, h - .083, zz, interior_layout_js_1.laneWidth, .165, 1.36, '#898e87');
            }
            for (let j = 0; j < 18; j++) {
                const h = y0 + (j + 1) * interior_layout_js_1.riseFlight / 18, zz = start + dir * (j + .5) * 5.6 / 18;
                b.box(xx, h - .143, zz, interior_layout_js_1.laneWidth, .287, 5.6 / 18 + .006, '#a2a497');
                b.box(xx, h + .002, zz - dir * .136, interior_layout_js_1.laneWidth - .035, .014, .040, j === 0 || j === 17 ? '#d8b170' : '#c4c5b3');
            }
            const railx = xx + (k === 4 ? .57 : .70);
            b.beam(railx, y0 + .91, start, railx, y0 + interior_layout_js_1.riseFlight + .91, end, .08, '#8b7559');
            for (let j = 0; j <= 6; j++) {
                const zz = start + dir * j * 5.6 / 6, y = y0 + j * interior_layout_js_1.riseFlight / 6;
                b.beam(railx, y, zz, railx, y + .88, zz, .038, '#717c73');
            }
            b.box(xx, y0 + 2.01, dir === 1 ? n + .095 : s - .095, .51, .77, .035, '#4c645e');
            sign(String(k + 2), k === 4 ? 'КРОВЛЯ' : 'ЭТАЖ', xx, y0 + 2.01, dir === 1 ? n + .12 : s - .12, .47, .70, dir === 1 ? 0 : Math.PI);
            b.lamp(xx, y0 + 2.57, dir === 1 ? n + .14 : s - .14, .72, .072, .13, '#efd6a3');
        }
        return;
    }
    const roof = zone === 'roof', cabin = zone === 'lift', bottom = roof ? '#a9b5bc' : zone === 'basement' ? '#737b77' : cabin ? '#858e88' : '#868c80';
    b.box(x, f - .081, z, w, .162, d, bottom);
    if (roof) {
        for (let j = 0; j < 6; j++)
            b.box(x, f + .009, n + .5 + j * 1.69, w - .19, .018, .025, '#86949d');
        for (const xx of [l, e]) {
            b.box(xx, f + .32, z, .18, .63, d, '#819197');
            b.box(xx, f + .69, z, .27, .10, d, '#c5cbd0');
        }
        for (const zz of [n, s]) {
            b.box(x, f + .32, zz, w, .63, .18, '#819197');
            b.box(x, f + .69, zz, w, .10, .27, '#c5cbd0');
        }
        for (const q of r.furniture) {
            b.box(q.x, f + q.h / 2, q.z, q.w, q.h, q.d, '#768488');
            b.box(q.x, f + q.h + .02, q.z, q.w + .15, .09, q.d + .13, '#b9c4c9');
            if (q.kind === 'headhouse') {
                b.box(q.x, f + 1.04, q.z - q.d / 2 - .01, 1.16, 2.05, .07, '#637878');
                sign('ЛЕСТНИЦА', 'КАНАЛЬНАЯ, 23', q.x, f + 1.65, q.z - q.d / 2 - .06, .88, .28, Math.PI);
            }
            else
                for (let j = 0; j < 6; j++)
                    b.box(q.x, f + .22 + j * .105, q.z + q.d / 2 + .013, q.w * .72, .049, .022, '#435862');
        }
        b.cyl(-85.3, f + 1.4, -3.2, .066, 2.8, '#879698');
        for (let j = 0; j < 4; j++)
            b.beam(-85.85 + j * .04, f + 2.2 + j * .16, -3.2, -84.72 - j * .04, f + 2.2 + j * .16, -3.2, .027, '#9aa5a4');
        const dx = -61, dz = -10;
        for (const a of [...world_layout_js_1.apartments.filter(a => a.id !== 23), ...world_expansion_layout_js_1.expansionBuildings, ...Object.values(world_layout_js_1.buildings).map(a => ({ ...a, h: 4.4 }))]) {
            const ax = a.x + dx, az = a.z + dz;
            if ('kind' in a && (a.kind === 'tank' || a.kind === 'tower')) {
                b.cyl(ax, a.h * .5, az, a.w * .87, a.h, '#9e9b90');
                continue;
            }
            b.box(ax, a.h / 2, az, a.w, a.h, a.d, '#7a858a');
            b.box(ax, a.h + .01, az, a.w + .08, .11, a.d + .08, '#b4bfc3');
            if (a.h >= 10)
                for (let wx = 0; wx < Math.floor(a.w / 3.2); wx++)
                    for (let wy = 1; wy < a.h / 3; wy++)
                        if ((wx + wy) % 3)
                            b.lamp(ax - a.w / 2 + 1.2 + wx * 3.2, wy * 3, az + (a.z > 10 ? -1 : 1) * (a.d / 2 + .015), 1.1, 1.20, .026, (wx + wy) % 4 ? '#a7a392' : '#e7c58a');
        }
        b.box(-61, -.25, -10, 365, .4, 300, '#768995');
        b.box(-61, -.019, 64, 360, .05, 24.4, '#9db2bf');
        return;
    }
    const h = r.ceiling, wall = zone === 'basement' ? '#83908b' : cabin ? '#9fa9a3' : zone === 'dispatch' ? '#bfbea9' : '#c7bea4';
    for (const xx of [l, e]) {
        b.box(xx, f + h / 2, z, .13, h, d, wall);
        b.box(xx + (xx === l ? .077 : -.077), f + .56, z, .028, 1.12, d, cabin ? '#8d9994' : '#71887e');
        b.box(xx + (xx === l ? .095 : -.095), f + 1.13, z, .034, .06, d, cabin ? '#c7c9b4' : '#9ba996');
    }
    for (const zz of [n, s]) {
        b.box(x, f + h / 2, zz, w, h, .13, wall);
        b.box(x, f + .56, zz + (zz === n ? .079 : -.079), w, 1.12, .031, cabin ? '#8d9994' : '#788c80');
        b.box(x, f + 1.13, zz + (zz === n ? .098 : -.098), w, .060, .033, '#a8ac94');
    }
    b.box(x, f + h + .013, z, w, .12, d, '#c0beb0');
    for (let j = 0; j < (cabin ? 1 : 3); j++) {
        const xx = cabin ? x : l + w * (j + .5) / 3;
        b.box(xx, f + h - .086, 0, cabin ? .72 : 1.19, .082, .22, '#778680');
        b.lamp(xx, f + h - .138, 0, cabin ? .60 : 1.05, .035, .15, zone === 'basement' ? '#efc897' : '#eddfb4');
    }
    for (let j = 1; j < Math.ceil(w); j++)
        b.box(l + j, f + .004, z, .011, .009, d, '#77817b');
    for (let j = 1; j < Math.ceil(d); j++)
        b.box(x, f + .005, n + j, w, .009, .012, '#758079');
    if (!cabin && zone !== 'basement') {
        b.box(x, 1.065, s - .105, 1.22, 2.13, .065, '#58736e');
        b.box(x, 1.54, s - .15, .73, .73, .028, '#829a96');
        b.box(x - .44, .98, s - .17, .15, .04, .052, '#c9b99b');
        sign('ВЫХОД', 'ВО ДВОР', x, 2.33, s - .094, 1, .29, Math.PI);
    }
    if (cabin) {
        b.box(l + .13, f + .84, 0, .082, .072, d - .36, '#bdbfb0');
        b.box(e - .13, f + .84, 0, .082, .072, d - .36, '#bdbfb0');
        b.box(e - .105, f + 1.35, -.38, .075, .68, .36, '#566360');
        for (let i = 0; i < 4; i++) {
            b.lamp(e - .158, f + 1.11 + i * .13, -.38, .035, .058, .074, i === 2 ? '#e4b67d' : '#bbbc9f');
        }
        sign('ЛИФТ № 1', 'КАНАЛЬНАЯ, 23', x, 1.72, s - .10, 1.23, .34, Math.PI);
    }
}
function basement(b, sign) {
    const f = interior_layout_js_1.annexes.basement.floor;
    for (let i = 0; i < 3; i++) {
        const x = 32 + 4 * i, y = f + 1.14, z = -3.17;
        b.beam(x, f + .05, z, x, f + 2.36, z, .22, '#8e7765');
        b.beam(x, y, z, x, y, z + .28, .14, '#71796d');
        wheel(b, x, y, z + .3, .27, '#a6594b');
        b.piece('round', x + .40, f + 1.72, z + .11, .30, .09, .30, '#465652', 0, 0, Math.PI / 2);
        b.piece('round', x + .40, f + 1.72, z + .174, .25, .035, .25, '#d7d4b6', 0, 0, Math.PI / 2);
        b.beam(x + .40, f + 1.72, z + .20, x + .463, f + 1.79, z + .20, .020, '#74594d');
        sign(['ПОДАЧА', 'СТОЯК Б', 'ОБРАТКА'][i], 'ТЕПЛОВОЙ УЗЕЛ · 23', x, f + 2.11, -3.87, 1.35, .32);
        for (const yy of [.35, .79, 1.87])
            b.cyl(x, f + yy, z, .29, .057, '#a19a83');
    }
    for (const y of [.42, 1.82])
        b.beam(30.63, f + y, -3.62, 41.44, f + y, -3.62, .204, '#947b6a');
    const x = 31.02, z = .12;
    b.box(x, f + .12, z, 1.55, .24, 1.50, '#758180');
    b.piece('round', x, f + .58, z, .65, 1.25, .65, '#597878', 0, 0, Math.PI / 2);
    for (let j = 0; j < 9; j++)
        b.piece('round', x, f + .58, z - .51 + j * .109, .74, .036, .74, '#78908a', 0, 0, Math.PI / 2);
    b.box(41.16, f + .81, .14, .74, 1.61, 1.02, '#71847e');
    b.box(40.775, f + 1.04, .14, .04, .53, .66, '#495c5d');
    b.beam(30.4, f + 2.39, -3.14, 30.4, f + 2.39, 3.80, .14, '#a89879');
    sign('В ПОДЪЕЗД', 'ЛЕСТНИЦА', 34.17, f + 1.5, 3.90, .97, .30, Math.PI);
}
function workshop(b, sign) {
    for (const q of interior_layout_js_1.annexes.workshop.furniture) {
        if (q.kind === 'partition') {
            b.box(q.x, 1.33, q.z, q.w, 2.66, q.d, '#8c9c91');
            b.box(q.x, 1.10, q.z, q.w + .033, .075, q.d, '#b4b69e');
        }
    }
    b.box(65.68, 2.57, 0, .18, .23, 2.94, '#758277');
    sign('СТЕНД', 'ПО ОДНОМУ', 65.538, 2.46, -.26, .98, .25, -Math.PI / 2);
    b.box(67, .91, -3.42, 4.15, .10, .97, '#ab9c7c');
    for (const dx of [-1.87, 1.87])
        for (const dz of [-.36, .36])
            b.box(67 + dx, .43, -3.42 + dz, .087, .86, .087, '#5d736d');
    b.box(67.05, 1.27, -3.58, .90, .53, .3, '#72857f');
    b.box(67.05, 1.31, -3.414, .65, .33, .026, '#284c4c');
    for (let i = 0; i < 17; i++)
        b.lamp(66.77 + i * .034, 1.31 + Math.sin(i * .82) * .054, -3.391, .04, .014, .013, '#9bd8af');
    for (let j = 0; j < 3; j++)
        b.box(66.20 + j * .19, .992, -3.13, .15, .044, .18, '#527e68');
    b.beam(68.34, 1.0, -3.66, 68.17, 1.71, -3.62, .045, '#94a39a');
    b.beam(68.17, 1.71, -3.62, 67.77, 1.60, -3.27, .045, '#94a39a');
    b.box(67.76, 1.57, -3.26, .38, .11, .24, '#63807a');
    for (let j = 0; j < 4; j++) {
        b.box(70.35, .22 + j * .57, -.12, .96, .068, 4.14, '#829087');
        for (let k = 0; k < 7; k++) {
            const z = -1.73 + k * .51;
            b.box(70.31, .37 + j * .57, z, .67, .23, .40, ['#84988b', '#a69a7b', '#6b807f'][(j + k) % 3]);
            b.box(69.96, .38 + j * .57, z, .021, .073, .20, '#c0baa1');
        }
    }
    for (const z of [-2.1, 1.84])
        b.box(70.35, 1.13, z, .93, 2.26, .067, '#647973');
    b.box(61.72, .56, .43, .86, 1.02, 3.24, '#536f70');
    b.box(61.72, 1.09, .43, .91, .071, 3.30, '#b1ae94');
    b.beam(65.47, 1.00, -3.50, 65.67, 1.27, -3.46, .020, '#9a998d');
    wheel(b,65.71,1.36,-3.44,.115,'#777769');
    b.beam(67.76,.99,-3.20,68.04,.99,-3.31,.044,'#79624d');
    b.beam(68.04,.99,-3.31,68.19,.99,-3.37,.015,'#a7a698');
    for(let i=0;i<3;i++) b.box(65.86+i*.025,.98+i*.007,-3.25,.23,.006,.29,'#e1d7bd');
    sign('КВИТАНЦИИ', 'ВЫДАЧА У СТОЙКИ',65.46,1.77,-3.89,1.09,.30);
    sign('ИННА · РЕМОНТ', 'ТЕЛЕФОНЫ / МАГНИТОЛЫ', 67, 2.15, -3.90, 2.72, .54, 0, '#475e58');
    sign('ОБМЕН', 'ПРИЁМНИКИ ДЛЯ СОСЕДЕЙ', 63.84, 1.65, -3.88, 1.50, .40);
    b.box(63.84, .83, -3.7, 1.22, .079, .44, '#8d927c');
}
function dispatch(b, p, sign) {
    b.box(93.8, .44, -3.29, 4.05, .87, 1.03, '#607a77');
    b.piece('box', 93.8, .94, -3.29, 4.11, .14, 1.09, '#9b9d86', 0, 0, -.09);
    for (let i = 0; i < 14; i++) {
        b.box(92.22 + i * .225, 1.051, -3.44, .135, .059, .116, i % 4 === 1 ? '#b9745c' : '#5c6c64');
        if (i % 3 === 0)
            b.lamp(92.22 + i * .225, 1.067, -3.20, .082, .038, .052, '#e6bb7c');
    }
    b.beam(94.5, 1.04, -3.22, 94.48, 1.32, -3.43, .023, '#4e605c');
    b.piece('stone', 94.48, 1.32, -3.43, .10, .14, .075, '#44575b');
    b.box(93.86, 1.94, -3.89, 3.96, 1.61, .15, '#60716b');
    p.place('tram-control', interior_prints_js_1.tramBoard, 93.86, 1.94, -3.80, 3.79, 1.49, 0);
    b.box(98.62, 1.07, -3.51, 1.66, 2.13, .78, '#677d78');
    for (let i = 0; i < 5; i++) {
        const y = .25 + i * .406;
        b.box(98.62, y, -3.096, 1.50, .35, .052, '#86958a');
        b.box(98.62, y, -3.054, .30, .035, .063, '#c2b999');
    }
    b.box(96.93,1.81,-3.82,1.33,.76,.08,'#aca38c');
    for (let i=0;i<5;i++) {
        const xx=96.46+i*.22;
        b.box(xx,1.84,-3.75,.043,.15,.052,'#797c72');
        b.box(xx+.025,1.73,-3.73,.063,.065,.026,'#c7b278');
        b.box(xx,1.68,-3.72,.108,.065,.016,'#d9d2bc');
    }
    sign('КЛЮЧИ', 'ПОСТЫ И СТРЕЛКИ',96.93,2.31,-3.79,1.36,.27);
    sign('ДЕЖУРЯТ СЕГОДНЯ', 'СЕМЁН · БРИГАДА 07',90.96,1.79,-3.80,1.36,.54,0,'#d1ccb4','#4a5548');
    for(let i=0;i<3;i++) b.cyl(90.41+i*.53,2.068,-3.77,.063,.033,'#887857');
    sign('АРХИВ', 'КАРТОТЕКА', 98.62, 2.42, -3.89, 1.49, .35);
    b.box(90.31, .90, .32, .76, 1.85, 2.66, '#6d8079');
    for (let k = 0; k < 5; k++)
        for (let j = 0; j < 8; j++)
            b.box(90.71, .22 + k * .34, -.73 + j * .29, .065, .24, .20, (k + j) % 3 === 0 ? '#ad9e79' : '#819187');
}
