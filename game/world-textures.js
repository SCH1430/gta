"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = random;
exports.texture = texture;
exports.grainTexture = grainTexture;
exports.districtFloor = districtFloor;
exports.facade = facade;
exports.porchTile = porchTile;
exports.occupiedPane = occupiedPane;
exports.wornTread = wornTread;
exports.garageMasonry = garageMasonry;
exports.cabinetPlate = cabinetPlate;
exports.garageDoor = garageDoor;
exports.signTexture = signTexture;
exports.opticMural = opticMural;
const THREE = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const puddles_js_1 = require("./puddles.js");
const graphics_pavement_js_1 = require("./graphics-pavement.js");
const population_parking_js_1 = require("./population-parking.js");
const canalWalk = require("./canal-walk.js");
function random(seed) {
    let state = seed >>> 0;
    return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function canvas(w, h) {
    const element = document.createElement('canvas');
    element.width = w;
    element.height = h;
    const context = element.getContext('2d');
    return { context, element };
}
function texture(image) {
    const tex = new THREE.CanvasTexture(image);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}
function grainTexture() {
    const size = 128, data = new Uint8Array(size * size), rnd = random(45);
    for (let i = 0; i < data.length; i++) {
        const grit = rnd();
        data[i] = Math.round(42 + (grit + rnd() + rnd()) * 57 + (grit > .966 ? 24 : 0));
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}
function districtFloor() {
    const { context: c, element } = canvas(2048, 2048), rnd = random(771);
    c.scale(10.24, 10.24);
    c.translate(100, 100);
    c.fillStyle = '#adbdc6';
    c.fillRect(-100, -100, 200, 200);
    (0, graphics_pavement_js_1.paintWindCrust)(c, -100, -100, 200, 200, random(1759), 190);
    function rect(x, z, w, d, color) { c.fillStyle = color; c.fillRect(x - w / 2, z - d / 2, w, d); }
    function line(x, z, x2, z2, width, color, dash = []) {
        c.beginPath();
        c.strokeStyle = color;
        c.lineWidth = width;
        c.setLineDash(dash);
        c.moveTo(x, z);
        c.lineTo(x2, z2);
        c.stroke();
        c.setLineDash([]);
    }
    rect(-19, -2, 48, 59, '#616b78');
    rect(-2, -28, 78, 28, '#57616c');
    rect(-55, 44, 47, 21, '#5b636f');
    rect(48, 16, 72, 18, '#545a65');
    rect(9, 48, 92, 21, '#707b86');
    rect(-38, 38, 12, 28, '#555d69');
    rect(13, 1, 9, 49, '#67717c');
    rect(-19, 1, 7, 51, '#626b76');
    for (let i = 0; i < 5100; i++) {
        const x = rnd() * 200 - 100, z = rnd() * 200 - 100;
        rect(x, z, rnd() * 1 + .15, rnd() * .7 + .1, rnd() > .55 ? 'rgba(225,233,235,.11)' : 'rgba(28,45,67,.12)');
    }
    const road = (x, z, w, d) => {
        rect(x, z, w + 2.7, d + 2.7, '#c0cad1');
        rect(x, z, w + 1.5, d + 1.5, '#717d89');
        rect(x, z, w, d, '#343e4a');
    };
    road(0, 30, 200, 10.8);
    road(0, -46, 200, 11);
    road(-50, -6.5, 11, 124);
    road(46, -6, 11, 126);
    road(-38, 42, 8.8, 24);
    const apron = world_layout_js_1.garageApron;
    c.save();
    c.beginPath();
    apron.forEach(([x, z], i) => {
        if (i === 0)
            c.moveTo(x, z);
        else
            c.lineTo(x, z);
    });
    c.closePath();
    c.clip();
    c.fillStyle = '#424d59';
    c.fillRect(-49, 33, 34, 24);
    for (let i = 0; i < 420; i++) {
        const x = -48 + rnd() * 29, z = 34 + rnd() * 22;
        rect(x, z, .1 + rnd() * 1.1, .035 + rnd() * .11, rnd() > .48 ? 'rgba(184,200,209,.09)' : 'rgba(15,31,43,.15)');
    }
    for (const xx of [-40.5, -37.35, -34.2]) {
        line(xx, 40.1, xx, 44.2, .075, 'rgba(201,189,150,.55)', [1.4, .12, 2, .25]);
        line(xx, 44.2, xx + .8, 44.2, .075, 'rgba(201,189,150,.55)');
    }
    for (let k = 0; k < 3; k++) {
        const x = -29.3 + k * .67, z = 37.1;
        rect(x, z, .60, .65, '#303d48');
        for (let j = 0; j < 5; j++)
            line(x - .22, z - .23 + j * .115, x + .22, z - .23 + j * .115, .031, '#76828a');
    }
    c.save();
    c.translate(-30.1, 40.5);
    c.rotate(-.32);
    c.strokeStyle = 'rgba(203,191,154,.58)';
    c.lineWidth = .09;
    c.beginPath();
    c.moveTo(-.46, .8);
    c.lineTo(.57, -.03);
    c.lineTo(-.46, -.87);
    c.stroke();
    c.restore();
    c.restore();
    for (let i = 0; i < apron.length; i++) {
        const a = apron[i], d = apron[(i + 1) % apron.length];
        if (a[1] < 36 && d[1] < 36)
            continue;
        const len = Math.hypot(d[0] - a[0], d[1] - a[1]);
        for (let j = 0; j < len * 15; j++) {
            const k = rnd(), x = a[0] + (d[0] - a[0]) * k, z = a[1] + (d[1] - a[1]) * k;
            rect(x + (rnd() - .5) * .73, z + (rnd() - .5) * .67, .12 + rnd() * .53, .07 + rnd() * .17, 'rgba(181,192,199,' + (.09 + rnd() * .27) + ')');
        }
    }
    for (const x of [-50, 46])
        for (const z of [-46, 30])
            rect(x, z, 13, 13, '#343e4a');
    rect(-38, 31, 9, 10, '#343e4a');
    for (const z of [-46, 30]) {
        for (const [x1, x2] of [[-100, -57], [-43, 38], [54, 100]]) {
            line(x1, z, x2, z, .19, '#cacbbf', [2.6, 3.8]);
            for (const q of [-4.6, 4.6])
                line(x1, z + q, x2, z + q, .13, '#adb8bb');
        }
    }
    for (const x of [-50, 46]) {
        for (const [z1, z2] of [[-71, -53], [-39, 23], [37, 54]]) {
            line(x, z1, x, z2, .19, '#cacbbf', [2.6, 3.8]);
            for (const q of [-4.7, 4.7])
                line(x + q, z1, x + q, z2, .13, '#adb8bb');
        }
    }
    for (const z of [-46, 30])
        (0, graphics_pavement_js_1.paintPlough)(c, -82, z, 164, 10.8, false, rnd);
    for (const x of [-50, 46])
        (0, graphics_pavement_js_1.paintPlough)(c, x, -66, 118, 11, true, rnd);
    for (const g of [world_layout_js_1.buildings.garage, world_layout_js_1.buildings.garage2]) {
        const front = g.x + g.w / 2;
        (0, graphics_pavement_js_1.paintDrift)(c, front + .67, g.z + g.d / 2 - .07, 2.50, 1.32, -.24, rnd);
        for (const offset of [-.27, .24]) {
            const z = g.z + g.d * offset;
            rect(front + .44, z, .78, 4.32, '#4d5460');
            for (let i = 0; i < 46; i++)
                rect(front + .15 + rnd() * .6, z + (rnd() - .5) * 4, .02 + rnd() * .10, .025, 'rgba(190,178,153,.25)');
            (0, graphics_pavement_js_1.paintDrift)(c, front + .51, z - 2.45, .83, .39, .06, rnd);
        }
    }
    for (const [cx, cz] of [[46, 30], [-50, -46]])
        for (let i = -4; i <= 4; i++) {
            const [west, east] = cx === 46 ? canalWalk.marketCrossing : [cx - 9.95, cx - 7.05];
            rect((west + east) / 2, cz + i * 1.03, east - west, .52, '#c1c8c3');
            rect(cx + i * 1.03, cz + 8.8, .52, 2.7, '#c1c8c3');
        }
    const [westCurb, eastCurb] = canalWalk.courtCrossing;
    for (let i = -4; i <= 4; i++)
        rect((westCurb + eastCurb) / 2, 30 + i * 1.03, eastCurb - westCurb, .48, '#b5bdb7');
    function pool(x, z, r, ratio, inner, outer) {
        c.save();
        c.translate(x, z);
        c.scale(1, ratio);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, inner);
        g.addColorStop(1, outer);
        c.fillStyle = g;
        c.fillRect(-r, -r, r * 2, r * 2);
        c.restore();
    }
    for (const b of [...world_layout_js_1.apartments, ...Object.values(world_layout_js_1.buildings), ...world_layout_js_1.lowBarriers]) {
        pool(b.x, b.z, Math.max(b.w, b.d) * .77, .78, 'rgba(24,31,45,.65)', 'rgba(24,31,45,0)');
        c.shadowColor = 'rgba(19,32,53,.65)';
        c.shadowBlur = 17;
        c.shadowOffsetY = 5;
        rect(b.x, b.z, b.w, b.d, '#3b4148');
        c.shadowBlur = 0;
        c.shadowOffsetY = 0;
    }
    for (let i = 0; i < 1500; i++) {
        const zroad = rnd() > .5, side = rnd() > .5;
        const x = zroad ? rnd() * 180 - 90 : (side ? 46 : -50) + (rnd() - .5) * 10;
        const z = zroad ? (side ? 30 : -46) + (rnd() - .5) * 10 : rnd() * 117 - 66;
        rect(x, z, rnd() * 2 + .1, rnd() * .21 + .04, rnd() > .5 ? 'rgba(138,159,181,.12)' : 'rgba(12,24,41,.10)');
    }
    for (const [x, z, col] of [[28, 23, '118,231,224'], [35, 22, '243,125,83'], [-44, 44, '235,171,88'], [-8.15, 18.5, '123,225,183']]) {
        pool(x, z, 6, .95, 'rgba(' + col + ',.30)', 'rgba(' + col + ',0)');
    }
    pool(-8.15, 25.5, 7.2, 1.40, 'rgba(102,185,164,.18)', 'rgba(102,185,164,0)');
    for (let i = 0; i < 48; i++) {
        const z = 18 + rnd() * 12.8, x = -8.15 + (rnd() - .5) * (1.7 + (z - 18) * .35);
        rect(x, z, .2 + rnd() * 1.65, .04 + rnd() * .085, 'rgba(161,215,187,' + (.09 + rnd() * .19) + ')');
    }
    for (const [x, z, r, tint] of [[-45.2, 42, 3.8, '111,233,235'], [-46, 48.6, 2.5, '255,88,77'], [28, 23.8, 3.5, '97,233,223'], [35.3, 24.2, 2.6, '255,104,96']]) {
        pool(x, z, r, 1.28, 'rgba(' + tint + ',.36)', 'rgba(' + tint + ',0)');
        for (let k = 0; k < 42; k++) {
            const d = (rnd() - .5) * 5.1;
            rect(x + (rnd() - .5) * (2 + Math.abs(d) * .32), z + d, .15 + rnd() * .80, .035 + rnd() * .067, 'rgba(' + tint + ',' + (.065 + rnd() * .19) + ')');
        }
    }
    puddles_js_1.districtPuddles.forEach(([x, z, rx, rz, angle, light], i) => (0, graphics_pavement_js_1.paintMeltwater)(c, x, z, rx, rz, angle, light, 739 + i * 101));
    for (const [x, z, a] of [[-33.2, 34.8, 1.57], [-23, 34.8, 1.57], [38.7, 25, 1.57], [41.2, -13, 0], [-54.8, -27, 0], [17, -51, 1.57]])
        (0, graphics_pavement_js_1.paintDrain)(c, x, z, a);
    for (let n = 0; n < 59; n++) {
        const isEast = n % 3 !== 0, sign = n % 2 === 0 ? 1 : -1;
        let x = isEast ? rnd() * 176 - 88 : (sign > 0 ? 46 : -50) + (rnd() - .5) * 9;
        let z = isEast ? (sign > 0 ? 30 : -46) + (rnd() - .5) * 8.8 : rnd() * 110 - 61;
        let bearing = rnd() * 5.9;
        c.beginPath();
        c.moveTo(x, z);
        for (let j = 0; j < 6; j++) {
            const distance = .22 + rnd() * .62;
            bearing += (rnd() - .5) * 1.1;
            x += Math.cos(bearing) * distance;
            z += Math.sin(bearing) * distance;
            c.lineTo(x, z);
        }
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(130,147,158,.22)';
        c.lineWidth = .123;
        c.stroke();
        c.strokeStyle = 'rgba(21,34,49,.67)';
        c.lineWidth = .063;
        c.stroke();
    }
    for (let n = 0; n < 10; n++) {
        const xx = [-43.2, -5.9, 34.1, 46, 46, 46, -50, -50, -7, 27][n], zz = [27, 27.5, 31.9, 17, -31, -11, -27, -8, -48.5, -43.5][n];
        c.save();
        c.translate(xx, zz);
        c.rotate(n * .83);
        c.fillStyle = '#263642';
        c.beginPath();
        c.arc(0, 0, .42, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#74828b';
        c.lineWidth = .04;
        c.beginPath();
        c.arc(0, 0, .35, 0, Math.PI * 2);
        c.stroke();
        c.lineWidth = .035;
        c.strokeStyle = '#5c6d74';
        for (let j = -2; j <= 2; j++)
            line(-.24, j * .086, .24, j * .086, .032, '#5b6972');
        c.restore();
    }
    for (const p of world_layout_js_1.snowPatches) {
        c.save();
        c.beginPath();
        p.contour.forEach(([x, z], i) => i === 0 ? c.moveTo(x, z) : c.lineTo(x, z));
        c.closePath();
        c.strokeStyle = 'rgba(152,166,171,.38)';
        c.lineWidth = .39;
        c.stroke();
        c.strokeStyle = 'rgba(113,128,134,.42)';
        c.lineWidth = .16;
        c.stroke();
        c.clip();
        const gradient = c.createLinearGradient(p.x, p.z - p.rz, p.x, p.z + p.rz);
        gradient.addColorStop(0, '#98aab6');
        gradient.addColorStop(.24, '#bbcbd1');
        gradient.addColorStop(.44, '#d7e0df');
        gradient.addColorStop(.72, '#bfced2');
        gradient.addColorStop(1, '#98a9af');
        c.fillStyle = gradient;
        c.fillRect(p.x - p.rx * 1.3, p.z - p.rz * 1.3, p.rx * 2.6, p.rz * 2.6);
        for (let k = 0; k < 85; k++)
            rect(p.x + (rnd() - .5) * p.rx * 2.55, p.z + (rnd() - .5) * p.rz * 2.55, .025 + rnd() * .15, .02 + rnd() * .045, rnd() < .6 ? 'rgba(234,241,238,.40)' : 'rgba(73,99,114,.24)');
        (0, graphics_pavement_js_1.paintWindCrust)(c, p.x - p.rx, p.z - p.rz, 2 * p.rx, 2 * p.rz, random(Math.round(6000 + 31 * p.x)), 17);
        c.restore();
    }
    canalWalk.paintWalk(c, random(1946));
    canalWalk.paintExitTracks(c);
    canalWalk.paintMarketBay(c, random(3229));
    rect(0, 74, 200, 23, '#7596a9');
    for (let i = 0; i < 390; i++) {
        const x = rnd() * 200 - 100, z = 63 + rnd() * 22;
        line(x, z, x + rnd() * 12, z + rnd() - .5, .04 + rnd() * .12, 'rgba(207,231,236,.45)');
    }
    for (let i = 0; i < 40; i++) {
        const x = rnd() * 200 - 100, z = 64 + rnd() * 18;
        line(x, z, x + 3, z + 1, .09, '#56798e');
        line(x + 3, z + 1, x + 5, z + .6, .08, '#56798e');
    }
    for (const bay of population_parking_js_1.parkingBays) {
        const halfLength = bay.kind === 'van' ? 2.83 : 2.62, ink = 'rgba(208,198,163,.61)';
        c.save();
        c.translate(bay.x, bay.z);
        c.rotate(-bay.yaw);
        for (const side of [-1, 1])
            line(side * 1.30, -halfLength, side * 1.30, halfLength, .095, ink, [1.58, .13, 1.15, .18]);
        line(-1.30, halfLength, 1.30, halfLength, .095, ink, [.84, .10, 1.03, .16]);
        c.restore();
    }
    return texture(element);
}
function glassBlocks(c, x, y, width, height, warm) {
    const cellW = width / 5, cellH = height / 7;
    c.fillStyle = warm ? '#817e69' : '#56686d';
    c.fillRect(x, y, width, height);
    for (let row = 0; row < 7; row++)
        for (let col = 0; col < 5; col++) {
            const px = x + col * cellW, py = y + row * cellH;
            c.fillStyle = (warm ? ['#d0c597', '#e0d3a9', '#c4c1a1'] : ['#90acac', '#9fb8b2', '#78969b'])[(col * 7 + row * 5) % 3];
            c.fillRect(px + .8, py + .8, cellW - 1.4, cellH - 1.4);
            c.fillStyle = warm ? '#f2e4bf' : '#b5cbc5';
            c.fillRect(px + 1.4, py + 1.4, cellW * .57, .9);
            c.fillStyle = warm ? '#b8ae89' : '#68848b';
            c.fillRect(px + cellW - 2.4, py + 2.5, 1.0, cellH - 3.4);
        }
}
function porchTile() {
    const { context: c, element } = canvas(88, 208), rnd = random(2319);
    c.fillStyle = '#89979b';
    c.fillRect(0, 0, 88, 208);
    for (let y = 0; y < 208; y += 16)
        for (let x = -4; x < 88; x += 16) {
            c.fillStyle = ['#365a74', '#486e83', '#40647b', '#52768a'][Math.floor(rnd() * 4)];
            c.fillRect(x + .8, y + .8, 14.8, 14.7);
            c.fillStyle = '#70909b';
            c.fillRect(x + 1.2, y + 1, 13.5, 1);
            if (rnd() < .16) {
                c.fillStyle = '#a49e8e';
                c.fillRect(x + 1.1, y + 12, 2.2, 3.1);
            }
        }
    return texture(element);
}
function occupiedPane(kind) {
    const { context: c, element } = canvas(80, 64);
    if (kind === 'stair')
        glassBlocks(c, 0, 0, 80, 64, true);
    else {
        const cream = kind === 'cream', glow = c.createLinearGradient(0, 0, 75, 57);
        glow.addColorStop(0, cream ? '#e7d4a9' : '#e5bd96');
        glow.addColorStop(.55, cream ? '#cfbd94' : '#d8aa7d');
        glow.addColorStop(1, '#917961');
        c.fillStyle = glow;
        c.fillRect(0, 0, 80, 64);
        c.fillStyle = 'rgba(91,83,75,.47)';
        c.beginPath();
        c.moveTo(0, 0); c.lineTo(cream ? 19 : 10, 0); c.lineTo(8, 53); c.lineTo(0, 60); c.fill();
        c.fillRect(cream ? 35 : 44, 0, 3.2, 64);
        if (cream) c.fillRect(0, 20, 80, 2.3);
        c.fillStyle = '#8e7e6c';
        c.fillRect(53, 51, 12, 7); c.fillRect(56, 44, 5, 7);
        c.fillStyle = '#a39178';
        c.fillRect(0, 59, 80, 5);
    }
    return texture(element);
}
function wornTread() {
    const { context: c, element } = canvas(256, 80), rnd = random(3107);
    const wear = c.createLinearGradient(0, 0, 256, 0);
    for (const [at, ink] of [[0, '#b3b9b9'], [.16, '#97958d'], [.34, '#807d77'], [.52, '#6c706e'], [.74, '#81837b'], [1, '#a0a5a2']])
        wear.addColorStop(at, ink);
    c.fillStyle = wear;
    c.fillRect(0, 0, 256, 80);
    for (let y = 0; y < 80; y++) {
        const width = 17 + 4 * Math.sin(y * .10) + 3 * Math.sin(y * .28);
        c.fillStyle = '#c2ced1'; c.fillRect(0, y, width, 1);
        c.fillStyle = '#cbd4d4'; c.fillRect(256 - width * .70 - 3 * Math.cos(y * .17), y, width + 4, 1);
    }
    for (let i = 0; i < 950; i++) {
        const x = 256 * rnd(), y = 80 * rnd();
        c.fillStyle = rnd() < .56 ? 'rgba(227,225,207,.33)' : 'rgba(55,68,73,.32)';
        c.fillRect(x, y, rnd() * 1.8 + .4, rnd() + .45);
    }
    return texture(element);
}
function facade(cols, rows, seed, routeFace = false, stairCol = -1) {
    const { context: c, element } = canvas(cols * 64, rows * 68), rnd = random(seed * 59 + 42);
    const w = element.width, h = element.height;
    const shades = [['#899096', '#646e78'], ['#93918d', '#657079'], ['#8b929b', '#606e7b']][seed % 3];
    function fill(x, y, a, b, color) { c.fillStyle = color; c.fillRect(x, y, a, b); }
    const backing = c.createLinearGradient(0, 0, w * .21, h);
    backing.addColorStop(0, shades[0]);
    backing.addColorStop(1, shades[1]);
    c.fillStyle = backing;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 49; i++)
        fill(rnd() * w, rnd() * h, .5 + rnd() * 2.3, .6 + rnd() * 1.2, rnd() > .42 ? 'rgba(234,224,200,.13)' : 'rgba(36,47,57,.20)');
    for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
            c.save();
            c.translate(x * 64, y * 68);
            fill(0, 0, 64, 68, 'rgba(' + (rnd() > .48 ? '29,41,53' : '240,219,187') + ',' + (.025 + rnd() * .095) + ')');
            fill(0, 0, 64, 1.5, '#535e6a');
            fill(0, 1.5, 64, .9, 'rgba(205,203,190,.56)');
            fill(0, 0, 1.4, 68, '#56616c');
            fill(1.5, 0, .8, 68, 'rgba(201,205,197,.63)');
            for (let i = 0; i < 5; i++) {
                const sx = 9 + rnd() * 48, len = 3 + rnd() * 14;
                const streak = c.createLinearGradient(0, 51, 0, 51 + len);
                streak.addColorStop(0, 'rgba(43,49,53,.26)');
                streak.addColorStop(1, 'rgba(43,49,53,0)');
                c.fillStyle = streak;
                c.fillRect(sx, 51, .6 + rnd() * 2.2, len);
            }
            if (x === stairCol) {
                if (y < rows - 1) {
                    fill(6, 3, 52, 62, '#6c797c');
                    glassBlocks(c, 9, 6, 46, 54, false);
                    fill(8, 61, 48, 2.3, '#acb5af');
                }
                c.restore();
                continue;
            }
            fill(6, 14, 51, 39, 'rgba(39,48,60,.33)');
            fill(8, 15, 48, 35, '#485460');
            fill(9, 16, 45, 32, '#243340');
            const lit = rnd() < (routeFace ? 0 : .52), amber = rnd(), slim = rnd(), seeded = rnd();
            c.save();
            c.beginPath();
            c.rect(11, 18, 41, 29);
            c.clip();
            if (lit) {
                const glow = c.createLinearGradient(10, 17, 52, 47);
                const pane = amber > .88 ? ['#d0e4d9', '#acc6c8', '#637e89'] : amber > .44 ? ['#ffe3ab', '#efb177', '#b87851'] : ['#ffebbf', '#f5cc8c', '#b98d62'];
                glow.addColorStop(0, pane[0]);
                glow.addColorStop(.54, pane[1]);
                glow.addColorStop(1, pane[2]);
                c.fillStyle = glow;
                c.fillRect(11, 18, 41, 29);
                c.fillStyle = 'rgba(99,72,63,.32)';
                c.beginPath();
                c.moveTo(11, 18);
                c.lineTo(19, 22);
                c.lineTo(19, 42);
                c.lineTo(11, 46);
                c.fill();
                fill(19, 22, 32, 1.0, 'rgba(255,229,177,.38)');
                fill(11, 42, 41, 5, 'rgba(89,63,54,.27)');
                const fx = 17 + rnd() * 23;
                if (seeded > .68) {
                    fill(fx, 36, 1.0, 10, '#756352');
                    c.fillStyle = '#eddbb0';
                    c.beginPath();
                    c.moveTo(fx - 3, 36);
                    c.lineTo(fx - 1.4, 31);
                    c.lineTo(fx + 2.4, 31);
                    c.lineTo(fx + 4, 36);
                    c.fill();
                }
                else if (seeded > .37) {
                    fill(fx, 40, 4.5, 5, '#635d5a');
                    c.strokeStyle = '#73715e';
                    c.lineWidth = .9;
                    for (let i = 0; i < 5; i++) {
                        const tilt = (i - 2) * 2;
                        c.beginPath();
                        c.moveTo(fx + 2.2, 40);
                        c.quadraticCurveTo(fx + 2 + tilt, 35, fx + 2 + tilt * 1.5, 34 + rnd() * 4);
                        c.stroke();
                    }
                }
                else {
                    fill(33, 36, 21, 1.5, 'rgba(84,63,51,.51)');
                    for (let i = 0; i < 4; i++)
                        fill(34 + i * 3.8, 31 + rnd() * 3, 1.5 + rnd(), 4 + rnd() * 1.4, 'rgba(80,62,56,.48)');
                }
                if (slim < .49) {
                    const side = slim < .23 ? 11 : 44, width = 4 + rnd() * 6;
                    const curtain = c.createLinearGradient(side, 0, side + width, 0);
                    curtain.addColorStop(0, 'rgba(93,82,81,.62)');
                    curtain.addColorStop(.42, 'rgba(226,184,144,.6)');
                    curtain.addColorStop(1, 'rgba(119,92,86,.54)');
                    c.fillStyle = curtain;
                    c.fillRect(side, 18, width, 29);
                }
                else if (slim > .80) {
                    const depth = 3 + rnd() * 10;
                    fill(11, 18, 41, depth, 'rgba(98,104,107,.63)');
                    for (let i = 0; i < depth; i += 2.1)
                        fill(11, 18 + i, 41, .53, 'rgba(201,192,166,.65)');
                }
            }
            else {
                const cool = c.createLinearGradient(8, 16, 41, 47);
                cool.addColorStop(0, amber > .36 ? '#748899' : '#586c7e');
                cool.addColorStop(.49, '#485e73');
                cool.addColorStop(1, '#273d50');
                c.fillStyle = cool;
                c.fillRect(11, 18, 41, 29);
                c.fillStyle = 'rgba(42,52,69,.62)';
                c.beginPath();
                c.moveTo(11, 36);
                c.lineTo(25, 32);
                c.lineTo(25, 29);
                c.lineTo(32, 28);
                c.lineTo(32, 31);
                c.lineTo(46, 29);
                c.lineTo(53, 32);
                c.lineTo(53, 47);
                c.lineTo(11, 47);
                c.fill();
                if (seeded > .58)
                    for (let i = 0; i < 5; i++)
                        fill(13 + i * 7, 36 + rnd() * 4, 1.6, 2, 'rgba(227,193,144,.43)');
            }
            c.restore();
            const mull = slim < .4 ? 29 : 34;
            fill(mull, 17, 2.25, 31, lit ? '#6e695e' : '#485762');
            fill(mull + .6, 18, .65, 28, 'rgba(196,198,181,.73)');
            if (amber > .51) {
                fill(11, 27, 41, 1.4, lit ? '#7e7363' : '#3a4c5a');
                fill(11, 27.9, 41, .45, 'rgba(173,183,176,.66)');
            }
            fill(8, 48, 47, 2.4, '#c5c7be');
            fill(8, 50.5, 47, 1.2, '#515e6d');
            if (lit) {
                const cast = c.createRadialGradient(31, 51, 1, 31, 51, 12);
                cast.addColorStop(0, 'rgba(240,184,121,.13)');
                cast.addColorStop(1, 'rgba(240,184,121,0)');
                c.fillStyle = cast;
                c.fillRect(18, 52, 26, 11);
            }
            if (rnd() > .81) {
                fill(42, 52, 13, 8, '#59646c');
                fill(43, 52, 12, 6, '#adb2ac');
                fill(45, 54, 6, 2, '#6d787d');
                fill(44, 53, 1.2, 4, '#6b777b');
                fill(52, 53, .8, 4, '#718086');
            }
            c.restore();
        }
    const ao = c.createLinearGradient(0, 0, 0, h);
    ao.addColorStop(0, 'rgba(29,43,66,0)');
    ao.addColorStop(.64, 'rgba(29,43,66,0)');
    ao.addColorStop(1, 'rgba(26,38,59,.34)');
    c.fillStyle = ao;
    c.fillRect(0, 0, w, h);
    return texture(element);
}
function garageMasonry() {
    const { context: c, element } = canvas(768, 208), rnd = random(422881);
    const coat = c.createLinearGradient(0, 0, 0, 208);
    coat.addColorStop(0, '#52636b');
    coat.addColorStop(.08, '#b3b6a7');
    coat.addColorStop(.48, '#aaa99a');
    coat.addColorStop(.65, '#788a83');
    coat.addColorStop(1, '#485c60');
    c.fillStyle = coat;
    c.fillRect(0, 0, 768, 208);
    for (let row = 0; row < 17; row++) {
        const y = row * 13, offset = row % 2 ? 21 : 0;
        for (let x = -offset; x < 768; x += 46) {
            c.fillStyle = rnd() > .49 ? 'rgba(45,57,59,.11)' : 'rgba(225,223,196,.10)';
            c.fillRect(x + 1, y + 1, 43, 11);
            c.fillStyle = 'rgba(54,66,68,.28)';
            c.fillRect(x, y, 46, 1.1);
            c.fillRect(x, y, 1.1, 13);
        }
    }
    c.fillStyle = '#778480';
    c.fillRect(0, 122, 768, 2.7);
    c.fillStyle = '#b1aa8c';
    c.fillRect(0, 125, 768, 1.6);
    for (let i = 0; i < 280; i++) {
        const x = rnd() * 768, y = rnd() > .45 ? 184 + rnd() * 25 : 121 + rnd() * 5;
        c.fillStyle = rnd() > .5 ? 'rgba(199,193,169,.52)' : 'rgba(94,82,69,.5)';
        c.fillRect(x, y, 1 + rnd() * 7, 1 + rnd() * 4);
    }
    for (let i = 0; i < 42; i++) {
        const x = rnd() * 768, len = 8 + rnd() * 54, g = c.createLinearGradient(0, 1, 0, len);
        g.addColorStop(0, 'rgba(56,72,77,.45)');
        g.addColorStop(1, 'rgba(56,72,77,0)');
        c.fillStyle = g;
        c.fillRect(x, 0, 1 + rnd() * 3, len);
    }
    for (let i = 0; i < 2200; i++) {
        c.fillStyle = rnd() > .5 ? 'rgba(41,54,59,.13)' : 'rgba(226,214,192,.22)';
        c.fillRect(rnd() * 768, rnd() * 208, .5 + rnd() * 2, .5 + rnd() * 1.2);
    }
    return texture(element);
}
function cabinetPlate() {
    const { context: c, element } = canvas(160, 224);
    const m = c.createLinearGradient(0, 0, 160, 224);
    m.addColorStop(0, '#768980');
    m.addColorStop(.65, '#526963');
    m.addColorStop(1, '#425956');
    c.fillStyle = m;
    c.fillRect(0, 0, 160, 224);
    c.strokeStyle = '#b5b7a0';
    c.lineWidth = 1.8;
    c.strokeRect(5, 6, 150, 210);
    c.fillStyle = '#ccb276';
    c.font = 'bold 31px K77Display';
    c.fillText('ТП-7', 20, 52);
    c.fillStyle = '#b7baac';
    c.font = 'bold 11px K77Body';
    c.fillText('КАНАЛЬНАЯ', 22, 69);
    c.fillStyle = '#d3ad57';
    c.beginPath();
    c.moveTo(78, 87);
    c.lineTo(100, 123);
    c.lineTo(56, 123);
    c.closePath();
    c.fill();
    c.fillStyle = '#374143';
    c.beginPath();
    c.moveTo(83, 92);
    c.lineTo(72, 108);
    c.lineTo(79, 108);
    c.lineTo(73, 119);
    c.lineTo(87, 103);
    c.lineTo(79, 103);
    c.closePath();
    c.fill();
    for (let y = 150; y < 190; y += 9) {
        c.fillStyle = '#314a4b';
        c.fillRect(29, y, 101, 4);
        c.fillStyle = '#8b9e92';
        c.fillRect(29, y + 4, 101, 1.5);
    }
    for (const x of [11, 148])
        for (const y of [12, 209]) {
            c.fillStyle = '#374c49';
            c.fillRect(x, y, 3, 3);
        }
    return texture(element);
}
function garageDoor(bay) {
    const { context: c, element } = canvas(448, 288), rnd = random(668 + bay);
    const cyan = bay % 2 === 1;
    const coat = c.createLinearGradient(0, 0, 448, 288);
    coat.addColorStop(0, cyan ? '#577c7e' : '#65747c');
    coat.addColorStop(.48, cyan ? '#406468' : '#536671');
    coat.addColorStop(1, '#344751');
    c.fillStyle = coat;
    c.fillRect(0, 0, 448, 288);
    for (let y = 0; y < 288; y += 20) {
        c.fillStyle = 'rgba(182,200,193,.42)';
        c.fillRect(0, y + 2, 448, 1.5);
        c.fillStyle = 'rgba(26,46,56,.58)';
        c.fillRect(0, y + 16, 448, 3);
        for (const x of [21, 426]) {
            c.fillStyle = '#344954';
            c.fillRect(x, y + 7, 2.2, 2.5);
        }
    }
    c.fillStyle = 'rgba(225,214,177,.74)';
    c.font = 'bold 83px K77Display';
    c.fillText(String(bay).padStart(2, '0'), 31, 122);
    for (let k = 0; k < 240; k++) {
        c.fillStyle = cyan ? 'rgba(64,100,104,.62)' : 'rgba(83,102,113,.62)';
        c.fillRect(32 + rnd() * 109, 56 + rnd() * 68, .5 + rnd() * 4.8, .6 + rnd() * 1.1);
    }
    c.font = 'bold 14px K77Body';
    c.fillText('КАНАЛТЕХ', 36, 145);
    for (let x = 0; x < 448; x += 31) {
        c.fillStyle = x % 2 ? '#94866c' : '#867861';
        c.beginPath();
        c.moveTo(x, 252);
        c.lineTo(x + 9, 252);
        c.lineTo(x, 263);
        c.lineTo(x - 9, 263);
        c.fill();
    }
    for (let i = 0; i < 780; i++) {
        const x = rnd() * 448, y = rnd() * 288;
        const rusty = y > 232 || (x < 32 || x > 414) && rnd() > .48;
        c.fillStyle = rusty ? 'rgba(83,61,53,.63)' : rnd() > .55 ? 'rgba(176,184,171,.32)' : 'rgba(42,55,63,.34)';
        c.fillRect(x, y, .4 + rnd() * 2, .5 + rnd() * (rusty ? 7 : 3));
    }
    for (let x = 1; x < 447; x += 3) {
        const height = 2 + Math.sin(x * .047) * 2.4 + Math.pow(rnd(), 3) * 13;
        c.fillStyle = rnd() > .48 ? '#875c48' : '#74544a';
        c.fillRect(x, 287 - height, 3.5, height);
        c.fillStyle = 'rgba(207,181,145,.64)';
        c.fillRect(x, 286 - height, 3, .75);
    }
    for (const x of [21, 426])
        for (let y = 7; y < 270; y += 40) {
            const tail = 4 + 12 * rnd(), g = c.createLinearGradient(0, y, 0, y + tail);
            g.addColorStop(0, '#8a624b');
            g.addColorStop(1, 'rgba(129,85,62,0)');
            c.fillStyle = g;
            c.fillRect(x, y, 1.7, tail);
        }
    return texture(element);
}
function signTexture(title, sub, ink, back, ratio, number = '') {
    const w = 768, h = Math.max(110, Math.round(w / ratio)), { context: c, element } = canvas(w, h);
    c.fillStyle = back;
    c.fillRect(0, 0, w, h);
    const margin = Math.round(h * .11);
    c.fillStyle = ink;
    c.fillRect(margin, margin, Math.max(3, w * .009), h - margin * 2);
    c.textBaseline = 'middle';
    const left = margin * 2 + w * .009, room = w - left - margin - (number ? w * .18 : 0);
    let size = h * (sub ? .45 : .60);
    c.font = 'bold ' + size + 'px K77Display';
    const measured = c.measureText(title).width;
    if (measured > room) {
        size *= room / measured;
        c.font = 'bold ' + size + 'px K77Display';
    }
    c.fillText(title, left, h * (sub ? .39 : .51));
    if (sub) {
        c.font = 'bold ' + Math.max(12, h * .15) + 'px K77Body';
        c.fillText(sub, left, h * .76, room);
    }
    if (number) {
        c.textAlign = 'right';
        c.font = 'bold ' + h * .57 + 'px K77Display';
        c.fillText(number, w - margin, h * .51, w * .17);
    }
    const map = texture(element);
    map.userData.signText = [title, sub, number].filter(Boolean).join(' · ');
    return map;
}
function opticMural() {
    const { context: c, element } = canvas(512, 600), rnd = random(2407);
    c.fillStyle = '#254c54';
    c.fillRect(0, 0, 512, 600);
    c.fillStyle = '#2d5660';
    c.fillRect(21, 18, 470, 564);
    c.strokeStyle = '#6b9790';
    c.lineWidth = 2;
    c.strokeRect(32, 29, 448, 542);
    for (let i = 0; i < 1100; i++) {
        c.fillStyle = i % 2 ? 'rgba(211,219,181,.07)' : 'rgba(12,29,40,.12)';
        c.fillRect(21 + rnd() * 471, 20 + rnd() * 562, 1 + rnd() * 4, 1 + rnd() * 2);
    }
    c.fillStyle = '#a8c8b6';
    c.font = 'bold 24px K77Display';
    c.fillText('ГОРОДСКАЯ ОПТИКА', 52, 80);
    c.textAlign = 'right';
    c.fillStyle = '#f2b76f';
    c.fillText('24', 460, 80);
    c.textAlign = 'left';
    const cx = 256, cy = 278;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#a4e1cb';
    c.lineWidth = 19;
    c.beginPath();
    c.moveTo(54, cy);
    c.bezierCurveTo(152, 145, 335, 128, 457, cy);
    c.bezierCurveTo(344, 408, 167, 427, 54, cy);
    c.closePath();
    c.stroke();
    c.fillStyle = '#21444d';
    c.beginPath();
    c.arc(cx, cy, 103, 0, 2 * Math.PI);
    c.fill();
    c.lineWidth = 15;
    c.strokeStyle = '#75c5b5';
    c.stroke();
    for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8;
        c.strokeStyle = i % 4 ? '#4c8c89' : '#e8b479';
        c.lineWidth = i % 4 ? 4 : 7;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 88, cy + Math.sin(a) * 88);
        c.lineTo(cx + Math.cos(a) * 75, cy + Math.sin(a) * 75);
        c.stroke();
    }
    c.strokeStyle = '#edb473';
    c.lineWidth = 11;
    c.beginPath();
    c.arc(cx, cy, 57, -.72, 5.12);
    c.stroke();
    c.fillStyle = '#94dfcd';
    c.beginPath();
    c.arc(cx, cy, 35, 0, 2 * Math.PI);
    c.fill();
    c.fillStyle = '#e0f3dc';
    c.beginPath();
    c.arc(cx + 10, cy - 13, 9, 0, 2 * Math.PI);
    c.fill();
    c.strokeStyle = '#bb9c73';
    c.lineWidth = 5;
    for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(cx + s * 61, cy - 100);
        c.lineTo(cx + s * 105, cy - 143);
        c.lineTo(cx + s * 143, cy - 143);
        c.stroke();
        c.fillStyle = '#ebc28b';
        c.beginPath();
        c.arc(cx + s * 146, cy - 143, 6, 0, 2 * Math.PI);
        c.fill();
        c.beginPath();
        c.moveTo(cx + s * 91, cy + 94);
        c.lineTo(cx + s * 125, cy + 125);
        c.lineTo(cx + s * 161, cy + 125);
        c.stroke();
    }
    c.fillStyle = '#9bdbbf';
    c.font = 'bold 45px K77Display';
    c.fillText('СЕРВИС ЗРЕНИЯ', 49, 492, 414);
    c.fillStyle = '#e0b881';
    c.font = 'bold 21px K77Display';
    c.fillText('РЕМОНТ СЕНСОРОВ', 51, 533);
    for (let i = 0; i < 7; i++) {
        c.fillStyle = i < 4 ? '#b9976e' : '#638784';
        c.fillRect(338 + i * 16, 515, 9, 17);
    }
    for (const x of [30, 482])
        for (const y of [27, 574]) {
            c.fillStyle = '#aab3a5';
            c.beginPath();
            c.arc(x, y, 3.7, 0, Math.PI * 2);
            c.fill();
        }
    return texture(element);
}
