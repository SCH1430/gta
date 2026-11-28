"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.furnishHouse = furnishHouse;
const house_layout_js_1 = require("./house-layout.js");
const world_textures_js_1 = require("./world-textures.js");
const house_paint_js_1 = require("./house-paint.js");
function furnishHouse(b, labels) {
    const wood = '#927257', edge = '#705741', iron = '#586467', cream = '#d1c3a9';
    const box = (x, y, z, w, h, d, col, ry = 0) => b.box(x, house_layout_js_1.houseUpper + y, z, w, h, d, col, ry);
    const cyl = (x, y, z, w, h, col) => b.cyl(x, house_layout_js_1.houseUpper + y, z, w, h, col);
    const dot = (x, y, z, w, h, d, col, ry = 0, rz = 0, rx = 0) => b.piece('stone', x, house_layout_js_1.houseUpper + y, z, w, h, d, col, ry, rz, rx);
    const label = (word, small, x, y, z, w, h, ry = 0, ink = '#eee8cc', bg = '#494d48') => labels.place('home-' + word + small, () => (0, world_textures_js_1.signTexture)(word, small, ink, bg, w / h), x, y, z, w, h, ry);
    box(1.62, 1.16, -6.00, .29, 2.32, .12, '#795e48');
    box(1.62, 1.16, -3.85, .29, 2.32, .12, '#795e48');
    box(1.64, 2.34, -4.91, .29, .17, 2.27, '#685340');
    box(1.65, 2.83, -4.92, .18, .94, 2.15, '#c4b8a2');
    box(2.42, 1.09, -6.16, 1.48, 2.18, .078, '#8b7056');
    for (const y of [.54, 1.48])
        box(2.42, y, -6.114, 1.17, .70, .028, '#9b8066');
    box(3.02, 1.03, -6.064, .15, .05, .086, '#b5ab93');
    label('7', 'КВАРТИРА', 1.544, house_layout_js_1.houseUpper + 1.74, -3.54, .55, .35, -Math.PI / 2, '#f0dba8', '#534e43');
    box(4.75, .29, -6.43, 2.11, .52, .59, wood);
    box(4.75, .58, -6.43, 2.21, .075, .67, cream);
    for (const x of [4.24, 5.26]) {
        box(x, .31, -6.108, .93, .37, .02, '#a08669');
        box(x + .30, .40, -6.086, .17, .025, .043, iron);
    }
    box(4.76, 1.70, -6.74, 2.22, .16, .09, wood);
    for (let k = 0; k < 5; k++) {
        const x = 3.95 + k * .4;
        box(x, 1.69, -6.62, .043, .10, .17, iron);
    }
    for (const [x, col, l] of [[4.23, '#697d85', .76], [5.04, '#a47559', .61]]) {
        dot(x, 1.30, -6.59, .39, l, .16, col);
        dot(x - .15, 1.37, -6.57, .11, .42, .13, col, 0, -.32);
        dot(x + .16, 1.33, -6.57, .11, .43, .13, col, 0, .22);
    }
    for (const x of [4.39, 4.61])
        dot(x, .69, -6.45, .17, .17, .32, '#564a40');
    box(7.48, 1.09, -6.45, 1.65, 2.18, .59, '#836c57');
    for (const x of [7.08, 7.89]) {
        box(x, 1.12, -6.137, .75, 2, .033, '#9f846a');
        box(x + (x < 7.5 ? .24 : -.24), 1.04, -6.10, .034, .26, .048, '#4d5757');
    }
    for (let n = 0; n < 7; n++)
        labels.place('apartment-wallpaper', house_paint_js_1.wallPaper, 1.743, house_layout_js_1.houseUpper + 1.60, -2.23 + n * 1.34, 1.34, 3.08, Math.PI / 2);
    for (let n = 0; n < 4; n++)
        labels.place('apartment-wallpaper', house_paint_js_1.wallPaper, 2.40 + n * 1.435, house_layout_js_1.houseUpper + 1.60, 6.967, 1.44, 3.08, Math.PI);
    box(1.76, .094, 2, .10, .17, 9.75, '#876e5b');
    box(4.66, .09, 6.93, 5.87, .16, .11, '#876e5b');
    for (const x of [2.03, 2.92])
        for (const z of [1.57, 3.68])
            cyl(x, .12, z, .095, .24, '#655246');
    box(2.44, .37, 2.62, 1.18, .44, 2.56, '#6c7878');
    box(2.00, .74, 2.62, .26, .68, 2.57, '#81908a');
    for (const z of [1.39, 3.85]) {
        box(2.43, .60, z, 1.17, .39, .20, '#7f8d86');
        box(2.43, .80, z, 1.09, .055, .21, '#97a299');
    }
    for (const z of [1.86, 2.62, 3.38]) {
        box(2.54, .57, z, .89, .17, .72, '#95a29a');
        box(2.98, .572, z, .019, .036, .69, '#b5b6a0');
        dot(2.17, .80, z, .25, .45, .71, '#919d92', 0, 0, -.09);
    }
    dot(2.30, .83, 3.47, .22, .44, .50, '#c39170', -.22, 0, .06);
    for (let k = 0; k < 9; k++)
        box(2.64, .672, 1.81 + k * .035, .61, .018, .037, k % 3 ? '#b4a58b' : '#846d5a');
    for (const x of [4.04, 5.00])
        for (const z of [2.87, 3.34])
            box(x, .204, z, .058, .40, .058, edge);
    box(4.51, .435, 3.10, 1.23, .077, .77, wood);
    box(4.61,.48,2.94,.29,.008,.21,'#e4dec6',.12);
    label('СМЕНЫ', 'ФЕВРАЛЬ · 18 / 21 / 24',4.56,house_layout_js_1.houseUpper+1.43,-6.70,.77,.44,0,'#55574c','#e5dfc8');
    label('КУПИТЬ', 'ХЛЕБ · МОЛОКО · ЧАЙ',9.94,house_layout_js_1.houseUpper+1.59,6.93,.43,.41,Math.PI,'#4e5148','#e3d7b5');
    for (let i = 0; i < 3; i++)
        box(4.24, .489 + i * .031, 3.1, .35, .029, .22, ['#77675e', '#b8a68b', '#648284'][i], .10 - i * .08);
    cyl(4.74, .49, 3.14, .148, .027, '#c5b99c');
    cyl(4.74, .56, 3.14, .09, .118, '#c8c8af');
    box(4.803, .56, 3.14, .036, .043, .042, '#a9a897');
    box(6.99, .45, 3.87, .63, .77, 2.23, wood);
    box(6.99, .85, 3.87, .71, .09, 2.31, edge);
    for (let i = 0; i < 4; i++) {
        box(6.653, .46, 3.06 + i * .53, .025, .59, .46, '#a78c70');
        box(6.627, .58, 3.03 + i * .53, .025, .033, .16, iron);
    }
    box(7.02, 1.12, 3.65, .40, .47, .94, '#747979');
    box(6.80, 1.14, 3.61, .04, .36, .82, '#bbc0af');
    for (const z of [3.40, 3.81]) {
        b.piece('round', 6.764, house_layout_js_1.houseUpper + 1.17, z, .24, .033, .24, '#e1d6bc', 0, Math.PI / 2);
        b.piece('round', 6.742, house_layout_js_1.houseUpper + 1.17, z, .073, .021, .073, '#4d5a58', 0, Math.PI / 2);
    }
    box(6.754, .998, 3.62, .03, .046, .35, iron);
    box(6.96, 1.04, 4.55, .41, .30, .63, '#6e5c50');
    box(6.744, 1.08, 4.50, .033, .102, .41, '#bad1b5');
    for (let k = 0; k < 4; k++)
        box(6.744, .99, 4.39 + k * .089, .023, .047, .05, iron);
    b.beam(7.11, house_layout_js_1.houseUpper + 1.17, 4.75, 7.14, house_layout_js_1.houseUpper + 1.63, 4.91, .023, '#a2aba4');
    box(1.78, 1.75, 2.63, .11, 1.0, 1.46, edge);
    labels.place('home-print', () => (0, house_paint_js_1.foyerPrint)('picture'), 1.843, house_layout_js_1.houseUpper + 1.75, 2.63, 1.31, .86, Math.PI / 2);
    windowBay(4.78, 6.91, 3.15, Math.PI, 1);
    windowBay(9.47, 6.91, 2.20, Math.PI, 2);
    windowBay(11.03, .87, 2.03, -Math.PI / 2, 3);
    function windowBay(x, z, w, rot, seed) {
        const co = Math.cos(rot), si = Math.sin(rot);
        function part(dx, y, depth, ww, h, d, col) {
            box(x + co * dx + si * depth, y, z - si * dx + co * depth, ww, h, d, col, rot);
        }
        part(0, 1.89, 0, w + .20, 1.77, .11, '#6c786f');
        labels.place('home-window-' + seed, () => (0, house_paint_js_1.houseWindow)(seed), x + si * .067, house_layout_js_1.houseUpper + 1.89, z + co * .067, w, 1.60, rot);
        for (const dx of [-w * .5, 0, w * .5])
            part(dx, 1.90, .112, .061, 1.70, .074, '#ddd5bc');
        for (const yy of [1.07, 2.34, 2.71])
            part(0, yy, .113, w + .11, .054, .072, '#d9d5bd');
        part(0, 1.005, .133, w + .30, .095, .36, '#cec5ae');
        part(0, 2.89, .17, w + .56, .050, .06, iron);
        for (const side of [-1, 1])
            for (let g = 0; g < 3; g++)
                part(side * (w * .50 + g * .041), 1.92, .19 + (g % 2) * .036, .09, 1.86, .069, g % 2 ? '#c9be9d' : '#a79e86');
    }
    for (let k = 0; k < 13; k++)
        box(3.85 + k * .19, .45, 6.82, .127, .56, .20, '#c8c4a7');
    for (const y of [.29, .62])
        box(5.0, y, 6.75, 2.57, .046, .052, '#a9aaa0');
    b.piece('taper', 6.70, house_layout_js_1.houseUpper + .26, 6.21, .39, .50, .40, '#b07b60', 0, Math.PI);
    cyl(6.70, .48, 6.21, .41, .05, '#a26d55');
    for (let k = 0; k < 10; k++) {
        const a = k * 2.39, x = 6.70 + Math.cos(a) * .25, y = .69 + k * .082, z = 6.21 + Math.sin(a) * .25;
        b.beam(6.70, house_layout_js_1.houseUpper + .44, 6.21, x, house_layout_js_1.houseUpper + y, z, .024, '#657666');
        dot(x, y + .05, z, .32, .095, .17, k % 2 ? '#738875' : '#586e63', a, 0, .35);
    }
    box(10.74, .49, 1.33, .69, .86, 3.72, '#939e94');
    for (let k = 0; k < 5; k++) {
        const z = -.10 + k * .70;
        box(10.38, .49, z, .035, .72, .64, k % 2 ? '#91a29a' : '#a3aca0');
        box(10.35, .71, z - .18, .045, .042, .19, iron);
    }
    box(10.71, .94, 1.33, .82, .092, 3.80, '#d3c5ab');
    box(10.67, .988, .55, .51, .016, .62, '#85999a');
    box(10.67, 1.00, .55, .39, .018, .48, '#637a80');
    cyl(10.99, 1.06, .27, .045, .19, iron);
    b.beam(10.99, house_layout_js_1.houseUpper + 1.15, .27, 10.81, house_layout_js_1.houseUpper + 1.18, .42, .030, iron);
    box(10.68, 1.006, 1.87, .56, .026, .85, '#536367');
    for (const z of [1.67, 2.09]) {
        cyl(10.67, 1.023, z, .31, .025, '#38474a');
        cyl(10.67, 1.04, z, .22, .01, '#747e77');
    }
    box(10.79, 1.93, 2.50, .51, .55, .98, '#c0bca6');
    box(10.52, 1.86, 2.50, .025, .13, .80, '#666f66');
    box(10.68, .97, -1.17, .80, 1.91, .86, '#bec6b3');
    box(10.258, .64, -1.17, .048, 1.18, .81, '#d1d4bc');
    box(10.258, 1.60, -1.17, .048, .60, .81, '#d2d1b8');
    box(10.21, 1.13, -1.45, .045, .24, .046, iron);
    label('ЛИНИЯ 07', '', 10.222, house_layout_js_1.houseUpper + 1.59, -1.12, .33, .13, -Math.PI / 2, '#a95143', '#d5c5a9');
    for (const x of [8.86, 9.90])
        for (const z of [4.22, 4.92])
            box(x, .38, z, .073, .76, .073, edge);
    box(9.38, .80, 4.57, 1.32, .074, .94, '#b99775');
    for (const x of [8.47, 10.27]) {
        box(x, .48, 4.64, .44, .066, .46, '#ad8969');
        box(x + (x < 9 ? -.17 : .17), .72, 4.64, .055, .40, .42, '#9f8065');
        for (const xx of [-.15, .15])
            for (const zz of [-.16, .16])
                box(x + xx, .236, 4.64 + zz, .046, .47, .046, edge);
    }
    box(9.35, .844, 4.56, .55, .02, .59, '#c9b793', -.07);
    cyl(9.35, .927, 4.56, .22, .16, '#869d99');
    cyl(9.35, 1.027, 4.56, .17, .038, '#b9c4ac');
    b.beam(9.34, house_layout_js_1.houseUpper + .97, 4.55, 9.18, house_layout_js_1.houseUpper + .97, 4.55, .044, '#9caf9f');
    cyl(9.63, .895, 4.47, .10, .09, '#d0c8a8');
    for (const [x, z] of [[4.8, 2.6], [9.37, 4.58]]) {
        cyl(x, 2.90, z, .025, .64, iron);
        b.piece('taper', x, house_layout_js_1.houseUpper + 2.57, z, .51, .28, .51, x < 7 ? '#b18458' : '#739084');
        b.lamp(x, house_layout_js_1.houseUpper + 2.437, z, .36, .022, .36, '#ffe3ae');
    }
}
