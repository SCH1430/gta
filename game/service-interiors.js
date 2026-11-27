"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServiceRoom = isServiceRoom;
exports.addServiceInterior = addServiceInterior;
const interior_layout_js_1 = require("./interior-layout.js");
function isServiceRoom(zone) {
    return Object.hasOwn(design, zone);
}
const design = {
    taxipark: { title: 'ТАКСОПАРК', tag: 'СМЕНЫ · ПОДАЧА МАШИН', body: '#6a7c72', top: '#b49268', trim: '#d3a95c', lamp: '#f4c66e' },
    cafe: { title: 'ГОРЯЧИЙ ЛЁД', tag: 'ЧАЙ · ПИРОЖКИ', body: '#a1746a', top: '#b59a78', trim: '#d6b980', lamp: '#f6c096' },
    terminal: { title: 'ДЕЖУРКА ТЕРМИНАЛА', tag: 'ПРОПУСКА · УЧЁТ ГРУЗА', body: '#607a78', top: '#8f9992', trim: '#bc8d60', lamp: '#91d5c7' },
    hydro: { title: 'БЕЛАЯ ПЛОТИНА', tag: 'ГИДРОТЕХНИЧЕСКИЙ ПОСТ', body: '#576c82', top: '#8a9da7', trim: '#b7b19f', lamp: '#a1def3' },
    passage: { title: 'ДОМ № 23', tag: 'СКВОЗНОЙ ПОДЪЕЗД', body: '#777e70', top: '#b4aa86', trim: '#b49264', lamp: '#e8b466' },
    'river-station': { title: 'РЕЧНОЙ ВОКЗАЛ', tag: 'ЗАЛ ОЖИДАНИЯ · ЮЖНЫЙ ПОРТ', body: '#435e67', top: '#b19574', trim: '#aa8659', lamp: '#b8decf' },
    'metal-hall': { title: 'ДК «МЕТАЛЛУРГ»', tag: 'МАЛЫЙ ЗАЛ · РЕПЕТИЦИЯ 18—22', body: '#755250', top: '#a88367', trim: '#b98955', lamp: '#efbb75' },
};
function addServiceInterior(b, sign, room) {
    const p = interior_layout_js_1.annexes[room], style = design[room], x = p.entrance.x, z = p.bounds.minZ;
    sign(style.title, style.tag, x, room === 'river-station' || room === 'metal-hall' ? 2.96 : 2.33, z + .125, Math.min(4, (p.bounds.maxX - p.bounds.minX) * .75), .60, 0, style.body, style.lamp);
    if (room === 'passage') {
        const back = z + .06;
        b.box(x, 1.12, back, 1.53, 2.24, .09, '#6c8478');
        b.box(x, 1.60, back + .06, 1.17, .61, .032, '#a7a394');
        b.box(x + .54, 1.10, back + .087, .16, .045, .045, '#c7aa80');
        for (const offset of [-3.2, 0, 3.2]) {
            const line = p.furniture[0].x + .12;
            b.beam(line, 1.54, offset - 1.6, line, 1.54, offset + 1.6, .13, '#997e57');
            b.beam(line + .1, 1.32, offset - 1.6, line + .1, 1.32, offset + 1.6, .084, '#71808b');
            b.lamp(x, 2.62, offset, .52, .044, .31, style.lamp);
        }
        for (const [y, i] of [[.014, 0], [.015, 1], [.016, 2]])
            b.box(x - .64 + i * .63, y, 0, .038, .012, 9.2, '#b6a177');
        return;
    }
    for (const f of p.furniture) {
        if (f.kind === 'counter') {
            b.box(f.x, .508, f.z, f.w, 1.016, f.d, style.body);
            b.box(f.x, 1.057, f.z, f.w + .12, .071, f.d + .13, style.top);
            b.box(f.x, .15, f.z + f.d / 2, f.w, .055, .022, style.trim);
            for (const dx of [-f.w * .29, 0, f.w * .29]) {
                b.box(f.x + dx, .52, f.z + f.d / 2 + .018, 1.10, .58, .034, style.top);
                b.box(f.x + dx, .32, f.z + f.d / 2 + .038, 1.04, .026, .02, style.trim);
            }
            continue;
        }
        if (f.kind === 'seating') {
            b.box(f.x, .495, f.z, f.w - .04, .19, f.d, style.top);
            b.box(f.x + f.w * .40, .715, f.z, .114, .43, f.d, style.trim);
            for (const dx of [-1, 1])
                b.box(f.x, .226, f.z + dx * f.d * .40, .13, .43, .11, style.body);
            continue;
        }
        if (f.kind === 'bench-row') {
            const side = f.x < x ? -1 : 1;
            b.box(f.x, .46, f.z, f.w, .15, f.d, style.top);
            b.box(f.x + side * (f.w / 2 - .07), .73, f.z, .12, .51, f.d, style.body);
            for (const end of [-1, 0, 1])
                b.box(f.x, .23, f.z + end * f.d * .41, f.w * .74, .42, .10, style.body);
            continue;
        }
        if (f.kind === 'stage') {
            b.box(f.x, f.h / 2, f.z, f.w, f.h, f.d, style.top);
            b.box(f.x, f.h * .60, f.z + f.d / 2, f.w, f.h, .08, style.body);
            for (const side of [-1, 1]) {
                b.box(f.x + side * 4.18, 2.06, f.z - 1.31, .58, 3.27, .36, '#864d4b');
                for (let fold = -2; fold <= 2; fold++)
                    b.box(f.x + side * 4.18 + .09 * fold, 2.06, f.z - 1.08, .035, 3.27, .14, '#693f3f');
                b.box(f.x + side * 4.55, 2.82, f.z - .31, .46, .31, .20, '#473833');
                b.lamp(f.x + side * 4.55, 2.64, f.z - .28, .29, .036, .13, style.lamp);
            }
            b.box(f.x, 3.56, f.z - 1.3, f.w, .21, .34, '#693f3f');
            continue;
        }
        if (f.kind === 'cafe-table') {
            const cols = ['#a78c72', '#b59072'];
            b.box(f.x, .751, f.z, f.w - .06, .11, f.d * .48, style.top);
            b.box(f.x, .36, f.z, .115, .72, .115, style.body);
            for (const [i, side] of [-1, 1].entries()) {
                b.box(f.x, .423, f.z + side * f.d * .41, f.w - .15, .11, .27, cols[i]);
                b.box(f.x, .23, f.z + side * f.d * .41, f.w * .64, .45, .15, style.body);
            }
            b.cyl(f.x - .33, .828, f.z + .10, .13, .032, '#e0c3a2');
            b.cyl(f.x + .23, .860, f.z - .14, .126, .10, '#879494');
            continue;
        }
        if (f.kind === 'rack') {
            for (const zSide of [-1, 1])
                for (const xSide of [-1, 1])
                    b.box(f.x + xSide * f.w * .45, 1.08, f.z + zSide * f.d * .48, .055, 2.16, .063, style.body);
            for (let j = 0; j < 4; j++) {
                const y = .285 + .50 * j;
                b.box(f.x, y, f.z, f.w, .042, f.d, style.top);
                for (let k = 0; k < 5; k++) {
                    const zz = f.z + (k - 2) * f.d * .17;
                    const dy = .12 + ((j + k) % 3) * .037;
                    b.box(f.x - .064, y + dy, zz, f.w * .62, dy * 1.85, f.d * .14, k % 2 ? style.trim : style.body);
                    b.box(f.x + (f.x > x ? -f.w * .36 : f.w * .36), y + dy, zz, .028, .059, f.d * .095, style.top);
                }
            }
            continue;
        }
        b.box(f.x, f.h / 2, f.z, f.w, f.h, f.d, style.body);
        b.box(f.x, f.h, f.z, f.w + .04, .065, f.d + .04, style.top);
        if (f.kind === 'generator') {
            for (let i = 0; i < 10; i++)
                b.box(f.x - f.w / 2 - .009, .96, f.z + (i - 4.5) * .202, .036, .23, .085, '#394e5f');
            for (const end of [-1, 1])
                b.cyl(f.x, f.h + .059, f.z + end * f.d * .33, .255, .095, style.trim);
        }
        else
            for (const zSide of [-1, 1])
                b.box(f.x, .381, f.z + zSide * (f.d / 2 + .018), f.w - .10, .093, .038, style.trim);
    }
    if (room === 'taxipark') {
        for (let i = 0; i < 10; i++) {
            const y = 1.1 + .085 * i;
            b.box(x + 3.90, y, z + .19, .75, .055, .022, i % 4 === 0 ? style.lamp : style.trim);
        }
        sign('СМЕНА № 2', 'КРАСНЫЙ ПЕРЕГОН · СЕВЕР-8', x + 3.9, 2.18, z + .157, 1.22, .36);
    }
    else if (room === 'cafe') {
        for (let i = 0; i < 4; i++) {
            const u = x + (i - 1.5) * .78;
            b.cyl(u, 1.21, -2.87, .21, .25, i % 2 ? '#9ca89c' : '#af8471');
            b.cyl(u, 1.34, -2.87, .23, .036, style.trim);
        }
        b.box(x + 3.72, 1.45, z + .101, .90, 1.67, .045, '#667778');
        for (let i = 0; i < 4; i++)
            b.box(x + 3.72, 1.15 + .22 * i, z + .133, .83, .059, .03, '#bf9d78');
        sign('МЕНЮ', 'ЧАЙ · БУЛОЧКИ · СУП', x + 3.72, 2.37, z + .13, .87, .28, 0, '#8b6155', '#f6d5a5');
    }
    else if (room === 'terminal' || room === 'hydro') {
        for (let i = 0; i < 8; i++) {
            const flag = x + (i - 3.5) * .45;
            b.box(flag, 1.14, -3.03, .27, .18, .32, '#566765');
            b.lamp(flag, 1.241, -2.976, .10, .024, .083, i % 3 === 0 ? '#e6b376' : style.lamp);
        }
        sign(room === 'terminal' ? 'КН-327' : 'СБРОС № 2', room === 'terminal' ? 'ГРУЗОВЫЕ ЯЧЕЙКИ' : 'ОСНОВНОЙ / РЕЗЕРВ', x - 3.79, 2.18, z + .157, 1.23, .36);
    }
    for (const side of [-1, 1]) {
        const bx = x + side * 3.45;
        b.box(bx, 2.92, 1.1, .54, .09, .81, style.body);
        b.lamp(bx, 2.859, 1.1, .36, .041, .67, style.lamp);
    }
}
