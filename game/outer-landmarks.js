"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outerLandmarkArt = exports.outerLightColor = void 0;
exports.outerProp = outerProp;
const snow = '#d8dfe1', concrete = '#8d9aa0';
const ink = {
    northpark: { warm: '#efbc78', accent: '#b9fff3', tone: '#8ca6a6', shade: '#566d7a' },
    cargo: { warm: '#ffc978', accent: '#ff984c', tone: '#b67b54', shade: '#6a514b' },
    dam: { warm: '#58dfdc', accent: '#99f9f1', tone: '#829fa0', shade: '#496875' },
    mill: { warm: '#ffbd73', accent: '#ffe0a2', tone: '#b08662', shade: '#62574d' }
};
exports.outerLightColor = {
    northpark: '#f3c28e', cargo: '#f7a254', dam: '#72e2e4', mill: '#eeb277'
};
const normalize = (v, from, to) => from + (to - from) * v;
const facade = (el, x, y, z, w, h, col) => {
    el.quad([x - w * .5, y - h * .5, z], [x + w * .5, y - h * .5, z], [x + w * .5, y + h * .5, z], [x - w * .5, y + h * .5, z], col);
};
function portholeFace(b, cx, cy, z, r, color, sides = 18) {
    const p = (i) => [cx + Math.cos(i / sides * 2 * Math.PI) * r, cy + Math.sin(i / sides * 2 * Math.PI) * r, z];
    for (let i = 0; i < sides; i++)
        b.quad([cx, cy, z], p(i), p(i + 1), [cx, cy, z], color);
}
function gateRail(b, x1, x2, y, z, c, step = 3.1) {
    b.beam([x1, y + 1, z], [x2, y + 1, z], .12, c);
    b.beam([x1, y + .54, z], [x2, y + .54, z], .075, c);
    const divisions = Math.ceil((x2 - x1) / step);
    for (let i = 0; i <= divisions; i++) {
        const x = normalize(i / divisions, x1, x2);
        b.beam([x, y, z], [x, y + 1.08, z], .105, c);
    }
}
function panelTower(b, d, l, clad, x, w, h, front, style) {
    const windowRows = Math.round((h - 4) / 3);
    b.box(x, h * .5, -1, w, h, front * 2 + 2, style ? '#779798' : '#92a3aa');
    b.box(x, h + .11, -1, w + .25, .22, front * 2 + 2.25, snow);
    b.box(x - 2.6, h + .91, -3.1, w * .44, 1.44, 9, '#879a9f');
    b.box(x - 2.6, h + 1.68, -3.1, w * .45, .17, 9.18, snow);
    for (const side of [-1, 1]) {
        const edge = x + side * (w * .5 + .02), a = side * Math.PI / 2;
        for (let y = 4.5; y < h - 1; y += 8.85) {
            const tall = Math.min(8.85, h - y);
            clad(edge, y + tall * .5, -1, front * 2 + .8, tall, a);
        }
    }
    for (let i = 0; i < windowRows; i++) {
        const y = 4.48 + 2.92 * i;
        b.box(x, y - 1.38, front + .14, w - .10, .15, .26, style ? '#bac7c4' : '#c6cdce');
        for (let j = 0; j < 4; j++) {
            const cx = x + (j - 1.5) * (w * .22), lit = (i * 3 + j + style * 2) % 7 < 4;
            const glow = lit ? l : b;
            b.box(cx, y, front + .07, w * .19, 1.58, .15, '#526572');
            facade(glow, cx, y + .02, front + .16, w * .168, 1.25, lit ? (j % 3 === 0 ? '#de9e66' : '#f9d4a0') : '#5d7782');
            d.box(cx + w * .011, y + .02, front + .185, .095, 1.31, .04, '#7c8c8b');
            d.box(cx, y + .40, front + .185, w * .167, .065, .04, lit ? '#dac4a6' : '#839698');
            d.box(cx, y - .66, front + .20, w * .184, .09, .13, snow);
            if (lit) {
                const curtain = ((i + 2 * j) % 5) * .006;
                d.box(cx + w * (.061 - curtain * .8), y + .05, front + .188, w * (.024 + curtain), 1.12, .04, '#d2ab8c');
                d.box(cx + w * (.060 - curtain * .75), y + .05, front + .214, w * .006, 1.13, .012, '#c59877');
                if ((i + j) % 3 === 0)
                    d.box(cx - w * .052, y - .42, front + .209, .40, .31, .029, '#9c8f73');
            }
            else {
                facade(d, cx - w * .03, y - .23, front + .184, w * .084, .56, '#4a6875');
                facade(d, cx + w * .037, y + .066, front + .184, w * .057, .96, '#57727d');
            }
            if (j === 1 && i % 2 === style) {
                b.box(cx, y - .74, front + .51, 3.57, .17, 1.17, style ? '#718f90' : '#a1adad');
                d.box(cx, y - .36, front + 1.06, 3.53, .65, .085, style ? '#8aafad' : '#7c9097');
                d.box(cx, y - .005, front + 1.08, 3.66, .068, .115, snow);
            }
        }
    }
}
function northpark(b, d, sign, clad, l) {
    const c = ink.northpark;
    b.box(0, .275, 0, 48, .55, 27, concrete);
    panelTower(b, d, l, clad, 12.35, 22.5, 28, 10.3, 0);
    panelTower(b, d, l, clad, -12.9, 21.25, 18.7, 10.3, 1);
    b.box(0, 2.2, 10.9, 48, 4.4, 5.2, '#788f95');
    b.box(0, 4.43, 11.0, 48, .27, 5.26, snow);
    for (const x of [-23.62, -5.5, 5.5, 23.62]) {
        b.box(x, 2.21, 13.71, .38, 3.74, .43, '#8fa7aa');
        d.box(x, 1.07, 13.96, .47, .53, .15, '#68898d');
    }
    for (const x of [-17.3, -9.6, 10.1, 17.6]) {
        b.box(x, 2.02, 13.49, 5.25, 2.48, .18, '#485968');
        facade(l, x, 2.12, 13.595, 4.96, 2.20, c.warm);
        for (const dx of [-1.6, 0, 1.6])
            d.box(x + dx, 2.12, 13.619, .13, 2.40, .09, '#56717a');
        d.box(x - .45, 1.27, 13.64, .9, .25, .10, '#e6d3af');
        for (let j = 0; j < 5; j++) {
            const sx = x + (j - 2) * .86;
            d.box(sx, 1.33 + (j % 2) * .13, 13.633, .65, .31 + (j % 2) * .18, .082, ['#a99073', '#b1a587', '#ceab8d'][j % 3]);
        }
        d.box(x, 1.72, 13.667, 5.0, .08, .13, '#8b8780');
    }
    b.box(0, 1.94, 13.555, 7.2, 3.05, .17, '#485e68');
    for (const x of [-2.15, 2.15]) {
        facade(l, x, 2.38, 13.66, 2.65, 1.48, c.accent);
        d.box(x, 2.33, 13.69, .094, 1.64, .08, c.shade);
    }
    b.box(0, 4.11, 14.01, 15.3, .21, 1.75, '#7a9f9f');
    b.box(0, 4.265, 14.02, 15.45, .10, 1.89, snow);
    facade(l, 0, 4.07, 14.92, 13.9, .095, c.accent);
    sign(0, 5.58, 13.59, 15, 1.69);
    for (let i = 0; i < 9; i++) {
        const y = 5.9 + i * 2.44;
        b.box(2.42, y, 10.46, 1.83, 1.69, .10, '#4b6871');
        facade(l, 2.42, y, 10.52, 1.60, 1.50, i % 3 ? c.accent : '#8bbcbf');
    }
    for (const x of [2.04, 2.8])
        d.box(x, 16.22, 10.594, .09, 22.24, .11, '#829999');
    for (const x of [-20, 19])
        b.box(x, 7.04, 10.56, .42, 4.8, .36, '#87a2a8');
    for (const x of [-19, 19])
        facade(l, x, 7.55, 10.76, .56, 1.78, c.accent);
}
function container(b, d, x, y, z, w, h, depth, color) {
    b.box(x, y + h * .5, z, w, h, depth, color);
    for (const dx of [-1, 1]) {
        const rx = x + dx * w * .5;
        d.box(rx, y + h * .53, z, .10, h + .11, depth + .1, '#a1a9a4');
        for (const zz of [-1, 1])
            d.box(rx - dx * .13, y + h * .53, z + zz * depth * .49, .32, h + .12, .19, '#5d605e');
    }
    const n = Math.floor(w / 1.08);
    for (let i = 1; i < n; i++) {
        const xx = x + w * (i / n - .5);
        d.box(xx, y + h * .51, z + depth / 2, .12, h * .85, .09, '#6c706d');
    }
    b.box(x, y + h + .035, z, w - .36, .073, depth - .20, '#b4bcba');
}
function cargo(b, d, sign, clad, l) {
    const c = ink.cargo;
    b.box(0, .37, 0, 56, .74, 36, '#8b8982');
    const marks = ['#687f86', '#9f6247', '#8e9a8f', '#536e70'];
    for (const [i, x] of [-18.5, -.1, 17.8].entries()) {
        for (const [j, z] of [-9, -2.6, 4.6, 11.2].entries())
            container(b, d, x, .78, z, 15.4, 2.64, 3.19, marks[(i + j) % 4]);
        for (const [j, z] of [-9, 4.6].entries())
            container(b, d, x, 3.46, z, 15.4, 2.64, 3.19, marks[(i + j + 1) % 4]);
        if (i !== 1)
            container(b, d, x, 6.1, -9, 15.4, 2.64, 3.19, marks[i === 0 ? 1 : 2]);
    }
    b.box(0, 1.4, 17.3, 35.4, 2.25, 1.37, '#596161');
    b.box(0, 2.61, 17.58, 35.58, .23, 1.17, snow);
    facade(b, 0, 1.54, 18.03, 6.85, 1.75, '#45545a');
    for (const side of [-1, 1]) {
        for (let j = 0; j < 5; j++)
            d.box(side * (4.5 + j * 2.85), 1.48, 18.035, .09, 2.10, .08, '#7a7973');
        for (const x of [7.8, 14.1])
            facade(l, x * side, 1.84, 18.069, 1.28, .12, c.warm);
    }
    for (const x of [-2.48, 2.48])
        d.box(x, 1.82, 18.17, .17, 2.29, .16, c.accent);
    sign(0, 4.89, 18.035, 19.0, 1.72);
    const fuselage = c.tone;
    for (const side of [-1, 1]) {
        const x = side * 22.8;
        for (const z of [-12.1, 12.1]) {
            b.box(x, 1.27, z, 5.9, 1.05, 3.5, '#757c79');
            b.beam([x, .76, z], [x - side * 1.6, 22.4, z * .73], 1.12, fuselage, .98);
            b.beam([x, .87, z], [x - side * 2.3, 15.6, -z * .25], .30, '#795a50');
            d.beam([x + side * 1.1, 3.05, z], [x - side * .35, 21.38, z * .75], .09, '#d39958');
        }
        b.beam([x - side * 1.15, 12.3, -11], [x - side * 1.15, 12.3, 11], .63, fuselage, .85);
        for (const z of [-12.4, 12.4])
            l.box(x - side * .85, 12.17, z, .43, .31, .21, c.warm);
    }
    for (const z of [-8.7, 8.7]) {
        b.box(0, 21.42, z, 43.5, .61, 1.15, '#b88059');
        b.box(0, 25.83, z, 43.5, .52, 1.03, '#c88f60');
        b.box(0, 26.14, z, 43.54, .11, 1.07, snow);
        for (let i = -4; i <= 4; i++) {
            const x = i * 4.75, next = x + 4.75;
            b.beam([x - 2.16, 21.68, z], [x + .44, 25.57, z], .33, '#ac713f');
            b.beam([x + .44, 25.57, z], [next - 2.16, 21.68, z], .25, '#90735d');
            l.box(x, 21.23, z + .56, .63, .16, .13, i % 2 === 0 ? c.warm : c.accent);
        }
    }
    b.box(-5.8, 22.6, 11.28, 5.75, 2.61, 5.4, '#a66a47');
    facade(l, -5.8, 23.04, 14.006, 4.52, 1.05, '#ffcf91');
    b.box(-5.8, 23.94, 11.28, 5.95, .17, 5.53, snow);
    b.box(6.77, 21.4, -.5, 8.40, 1.0, 18.66, '#866052');
    for (const x of [5.0, 8.6])
        for (const z of [-2.55, 2.55])
            b.beam([x, 20.75, z], [x, 13.61, z], .14, '#435359');
    b.box(6.8, 13.4, 0, 5.8, .35, 8, '#b48658');
    gateRail(d, -20, 20, 21.66, 9.1, '#e2ad7f', 3.8);
    clad(-15.25, 1.57, 18.070, 3.2, 1.50);
}
function dam(b, d, sign, clad, l) {
    const c = ink.dam;
    b.box(0, .475, 0, 56, .95, 32, concrete);
    b.box(0, 2.05, -4, 55.9, 2.31, 23.6, '#97a6ac');
    for (const [i, x] of [-21, -10.5, 0, 10.5, 21].entries()) {
        b.box(x, 5.6, -.6, 10.23, 5.8, 6.16, '#8a9b9e');
        b.box(x, 8.65, -.6, 10.4, .34, 6.46, snow);
        b.box(x, 4.65, 2.54, 8.65, 5.31, .17, '#4e666f');
        for (let rib = 0; rib < 8; rib++)
            d.box(x, 2.35 + rib * .64, 2.67, 8.6, .13, .12, '#7a9095');
        b.box(x, 3.3, 8.84, 9.58, .47, 8.71, '#65868d');
        for (let j = 0; j < 4; j++) {
            const z = 8.4 + j * 1.55;
            b.box(x, 3.44 - j * .48, z, 9.48, .14, 1.51, j % 2 ? '#79a5ac' : '#70969f');
            d.beam([x - 4.75, 3.51 - j * .48, z + 1.35], [x + 4.72, 3.51 - j * .48, z + 1.54], .068, '#c1d3d5');
        }
        b.box(x + 4.8, 5.02, 8.22, 1.10, 8.13, 13.75, '#95a5a8');
        b.box(x + 4.8, 9.10, 8.25, 1.18, .16, 13.86, snow);
        for (let j = 0; j < 8; j++) {
            const yy = 1.95 + j * .94;
            d.box(x + 4.8, yy, 15.14, 1.055, .045, .055, '#7c9196');
            d.box(x + 4.8 + (j % 3) * .14 - .17, yy - .30, 15.17, .13, .43, .055, '#889b9c');
        }
        b.box(x, 13.8, -5.2, 4.24, 10.38, 7.0, i % 2 ? '#81a0a5' : '#758f97');
        b.box(x, 19.05, -5.26, 4.51, .26, 7.34, snow);
        for (const z of [-8.78, -1.66])
            b.box(x, 15.19, z, 3.29, 2.11, .07, '#466975');
        facade(l, x, 15.31, -1.60, 2.98, 1.53, i % 2 ? c.warm : c.accent);
        l.box(x, 8.22, 2.65, 6.85, .19, .14, i % 2 ? c.warm : c.accent);
    }
    for (const [i, x] of [-23.9, 23.9].entries()) {
        b.box(x, 12.4, -8, 3.7, 22.9, 7.15, '#a2abad');
        b.box(x, 23.98, -8, 3.86, .25, 7.32, snow);
        b.box(x, 25.03, -8, 2.94, 2.09, 5.54, '#71858c');
        b.beam([x, 25.83, -8], [x, 33.6, -8], .24, '#6f858c');
        l.box(x, 33.42, -8, .56, .29, .54, i === 1 ? '#ffc77b' : '#f18260');
    }
    b.box(0, 20.32, -8.5, 47, .49, 1.9, '#728a90');
    gateRail(d, -23.65, 23.65, 20.59, -7.39, '#c2d2d1', 3.3);
    sign(0, 10.73, 6.0, 18, 1.91);
    b.box(0, 10.74, 5.89, 18.5, 2.25, .16, '#73858a');
    for (const [i, x] of [-11.6, 11.6].entries()) {
        b.box(x, 9.9, 6.82, .48, 2.46, 1.67, '#859da0');
        l.box(x, 10.7, 7.70, .62, .71, .16, i % 2 ? c.accent : c.warm);
    }
    clad(-23.91, 4.2, 15.23, 6, 4.1);
    b.box(0, 1.30, 15.46, 55.9, 1.65, .95, '#73888e');
    gateRail(d, -27.65, 27.65, 2.14, 15.73, '#a6bbbc');
}
function log(b, d, x, y, z, r, len, col) {
    const sides = 8, front = z + len * .5, back = z - len * .5;
    for (let i = 0; i < sides; i++) {
        const pt = (j, zz) => [x + Math.cos(j / sides * 2 * Math.PI) * r, y + Math.sin(j / sides * 2 * Math.PI) * r, zz];
        b.quad(pt(i, back), pt(i + 1, back), pt(i + 1, front), pt(i, front), i % 3 ? col : '#846954');
    }
    portholeFace(b, x, y, front + .004, r * .99, '#c29870', sides);
    portholeFace(d, x, y, front + .014, r * .76, '#ae815e', sides);
    portholeFace(d, x + r * .061, y + r * .085, front + .023, r * .64, '#c09267', sides);
    portholeFace(d, x + r * .084, y + r * .101, front + .031, r * .36, '#a87b58', sides);
    portholeFace(d, x + r * .097, y + r * .095, front + .04, r * .19, '#bd936b', sides);
    d.beam([x + r * .08, y + r * .11, front + .054], [x + r * .84, y - r * .32, front + .054], .035, '#7c6250');
}
function mill(b, d, sign, clad, l) {
    const c = ink.mill;
    b.box(0, .39, 0, 58, .78, 37, '#8c9089');
    b.box(-2.3, 4.52, -.5, 51.0, 8.9, 31.61, '#87785f');
    for (const x of [-15, -6.3, 2.4, 11.1, 19.8]) {
        const left = x - 5, right = x + 4.4;
        b.quad([left, 8.96, -16.26], [left, 8.96, 15.39], [right, 13.28, 15.39], [right, 13.28, -16.26], snow);
        b.quad([right, 13.28, -16.26], [right, 13.28, 15.39], [right, 8.94, 15.39], [right, 8.94, -16.26], '#768e90');
        b.beam([left, 8.96, 15.42], [right, 13.28, 15.42], .22, '#a39173');
        b.beam([right, 13.28, 15.42], [right, 8.91, 15.42], .22, '#9a8567');
        facade(l, right - .56, 10.82, 15.46, .87, 2.71, c.warm);
    }
    for (const [i, x] of [-21, -12.45, -3.9, 4.65, 13.2, 21.75].entries()) {
        b.box(x, 4.08, 15.36, 6.35, 6.11, .21, '#5d5950');
        if (i % 3 === 1) {
            facade(l, x, 6.32, 15.485, 6.06, 1.0, c.accent);
            for (let slat = 0; slat < 9; slat++)
                d.box(x, .97 + slat * .49, 15.48, 6.16, .12, .075, '#857969');
            d.box(x + .8, .91, 15.52, .43, .25, .15, '#b7a78a');
        }
        else {
            facade(l, x, 5.80, 15.49, 5.95, 1.73, i % 2 ? c.warm : '#dfaa7b');
            for (let dx = -1; dx <= 1; dx++)
                d.box(x + dx * 1.62, 5.80, 15.51, .12, 1.86, .05, '#776e5d');
            facade(b, x, 2.71, 15.475, 5.89, 3.54, '#786d5d');
            for (let j = 0; j < 7; j++) {
                const y = 1.22 + j * .46;
                const stagger = (j % 2) * .11;
                d.box(x + stagger, y, 15.51, 5.63 - stagger, .071, .067, j % 3 ? '#99907d' : '#c0a881');
                if (j % 2)
                    d.box(x - 1.62 + stagger, y + .22, 15.54, .074, .40, .05, '#665b4f');
            }
            if (i === 3)
                clad(x + 1.17, 3.32, 15.54, 1.21, 1.24, 0);
        }
        b.box(x - 3.51, 4.78, 15.54, .49, 8.43, .55, '#a48a69');
    }
    b.box(0, 7.99, 15.59, 28.1, .22, .76, '#9a8568');
    sign(-1.8, 8.99, 15.64, 22.0, 1.67);
    for (const [i, x] of [-22, 22].entries()) {
        const z = i === 0 ? -11 : -10, y = i === 0 ? 23.6 : 19.9;
        b.vessel(x, z, [[8.92, 2.26, 2.26, '#665c52'], [14.6, 2.04, 2.04, '#7e6d60'], [18.2, 1.55, 1.55, '#8a7f74'], [y, 1.36, 1.36, snow]], 14);
        l.box(x, y + .45, z, .39, .23, .39, '#f29663');
        b.beam([x, 10.21, z], [x * .71, 11.4, z + 5.1], .94, '#6b7b78');
    }
    b.box(1.0, 1.06, 17.5, 55.7, .48, 1.68, '#827a69');
    for (let i = 0; i < 4; i++)
        log(b, d, 26.4 - (i % 2) * .9, 1.40 + Math.floor(i / 2) * 1.0, 11.63, .71, 9.24, '#978266');
}
exports.outerLandmarkArt = { northpark, cargo, dam, mill };
function outerProp(p, b, d, l) {
    const w = p.w, h = p.h, depth = p.d;
    const c = ink[p.district];
    if (p.kind === 'kiosk') {
        b.box(0, .20, 0, w, .40, depth, c.shade);
        b.box(0, 1.72, 0, w - .30, 2.71, depth - .36, '#738d92');
        b.box(0, 3.20, 0, w, .32, depth, '#a7babe');
        b.box(0, 3.43, 0, w + .04, .14, depth + .05, snow);
        facade(b, 0, 2.05, depth * .5 - .17, w * .88, 1.63, '#51656d');
        for (const x of [-2.81, 0, 2.81])
            facade(l, x, 2.05, depth * .5 - .15, w * .274, 1.48, x === 0 ? c.accent : c.warm);
        for (const x of [-4.22, -1.4, 1.4, 4.22])
            d.box(x, 1.97, depth * .5 - .08, .15, 2.10, .095, '#61797e');
        b.box(0, 1.15, depth * .5 + .09, w * .72, .15, .65, '#8f9790');
        b.box(0, .79, depth * .5 + .32, w * .66, .08, .25, snow);
    }
    else if (p.kind === 'container') {
        b.box(0, .20, 0, w, .40, depth, '#7a7a70');
        container(b, d, 0, .40, -1.45, w, 2.55, 3.92, '#797f7a');
        container(b, d, 0, .40, 1.55, w, 2.55, 3.96, '#a6664d');
        container(b, d, 0, 2.95, 1.48, w * .975, 2.40, 3.95, '#527178');
        if (h > 6.0)
            container(b, d, 0, 5.35, -1.45, w * .95, 2.48, 3.92, '#a08563');
    }
    else if (p.kind === 'turbine') {
        b.box(0, .26, 0, w, .52, depth, '#929fa3');
        b.vessel(0, 0, [[.52, 5.7, 5.7, '#6b8289'], [5.55, 5.7, 5.7, '#789197'], [6.4, 4.25, 4.25, '#93afb0'], [7.30, 1.28, 1.28, snow]], 16);
        b.box(0, 1.73, 5.8, 3.75, 2.91, .39, '#4b656c');
        facade(l, 0, 3.07, 6.005, 3.48, .37, c.warm);
    }
    else {
        b.box(0, .17, 0, w, .34, depth, '#868078');
        for (let row = 0; row < 5; row++) {
            const size = 5 - row, y = 1.02 + row * 1.05;
            for (let j = 0; j < size; j++)
                log(b, d, (j - (size - 1) * .5) * 2.09, y, .35, (.86 + (j % 3) * .055), 11.39, '#9b785a');
        }
    }
}
