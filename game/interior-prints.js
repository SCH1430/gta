"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vistas = void 0;
exports.surveyPrint = surveyPrint;
exports.tramBoard = tramBoard;
exports.projectVista = projectVista;
exports.cityWindow = cityWindow;
exports.utilityFinish = utilityFinish;
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
function paper(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, g: c.getContext('2d') }; }
function surveyPrint() {
    const { c, g } = paper(512, 340), rnd = (0, world_textures_js_1.random)(761);
    g.fillStyle = '#c8b995';
    g.fillRect(0, 0, 512, 340);
    for (let i = 0; i < 2400; i++) {
        g.fillStyle = i % 2 ? '#d2c5a6' : '#bcad8c';
        g.fillRect(rnd() * 512, rnd() * 340, rnd() * 3, 1);
    }
    g.strokeStyle = '#766f57';
    g.lineWidth = 1;
    g.strokeRect(9, 9, 494, 322);
    g.fillStyle = '#484d47';
    g.font = 'bold 22px K77Display';
    g.fillText('СХЕМА ДВОРОВ', 23, 38);
    g.font = '14px K77Body';
    g.fillText('БЮРО ИНВЕНТАРИЗАЦИИ       2060 г.', 24, 58);
    g.strokeStyle = '#8c9077';
    g.lineWidth = 15;
    g.beginPath();
    g.moveTo(50, 73);
    g.lineTo(44, 265);
    g.lineTo(481, 260);
    g.stroke();
    g.strokeStyle = '#dcd1af';
    g.lineWidth = 8;
    g.stroke();
    for (const [x, y, w, h, n] of [[120, 97, 101, 48, 23], [261, 98, 129, 43, 24], [135, 175, 72, 37, 31], [289, 166, 72, 56, 32]]) {
        g.fillStyle = '#ac9d7f';
        g.fillRect(x, y, w, h);
        g.strokeStyle = '#666d60';
        g.lineWidth = 1;
        g.strokeRect(x, y, w, h);
        g.fillStyle = '#464f47';
        g.font = 'bold 19px K77Body';
        g.fillText(String(n), x + w / 2 - 10, y + h / 2 + 6);
    }
    g.setLineDash([5, 4]);
    g.strokeStyle = '#9c503e';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(49, 164);
    g.lineTo(230, 164);
    g.lineTo(230, 237);
    g.lineTo(349, 237);
    g.lineTo(349, 259);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#794938';
    g.font = 'italic 17px K77Body';
    g.fillText('проход у прачечной', 57, 153);
    g.fillStyle = '#444d46';
    g.font = 'bold 18px K77Body';
    g.fillText('ул. ФАБРИЧНАЯ', 182, 286);
    g.font = '13px K77Body';
    g.fillText('Домоуправление № 4  ·  Экз. 2', 23, 314);
    g.strokeStyle = 'rgba(101,81,59,.23)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(252, 1);
    g.lineTo(255, 339);
    g.moveTo(0, 155);
    g.lineTo(512, 159);
    g.stroke();
    return (0, world_textures_js_1.texture)(c);
}
function tramBoard() {
    const { c, g } = paper(512, 240);
    g.fillStyle = '#344e50';
    g.fillRect(0, 0, 512, 240);
    g.strokeStyle = '#536c67';
    g.lineWidth = 1;
    for (let i = 0; i < 512; i += 16) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 240);
        g.stroke();
    }
    for (let i = 0; i < 240; i += 16) {
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(512, i);
        g.stroke();
    }
    g.fillStyle = '#e2d4a9';
    g.font = 'bold 24px K77Display';
    g.fillText('ЛИНИЯ 07  ·  СТРЕЛКИ', 22, 38);
    const route = (pts, color) => { g.beginPath(); g.lineWidth = 4; g.strokeStyle = color; pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    route([[26, 139], [150, 139], [218, 95], [463, 95]], '#e5b875');
    route([[149, 140], [200, 177], [443, 177]], '#96bab0');
    route([[283, 94], [321, 129], [404, 129]], '#82a39d');
    g.font = '14px K77Body';
    g.fillText('СЕВЕР', 27, 125);
    g.fillText('ДЕПО', 222, 78);
    g.fillText('РЫНОК', 398, 77);
    g.fillText('ЗАПАСНОЙ ПУТЬ', 292, 201);
    for (const [x, y] of [[150, 139], [215, 95], [283, 94], [410, 95]]) {
        g.fillStyle = '#e1c48c';
        g.beginPath();
        g.arc(x, y, 5, 0, Math.PI * 2);
        g.fill();
    }
    return (0, world_textures_js_1.texture)(c);
}
exports.vistas = { yard: { x: -28.8, y: 4.78, z: 16.21, yaw: Math.PI }, rail: { x: 7.95, y: 2.55, z: -33.9, yaw: Math.PI * .55 } };
function projectVista(view, x, y, z) {
    const e = exports.vistas[view], dx = x - e.x, dz = z - e.z, s = Math.sin(e.yaw), c = Math.cos(e.yaw);
    const depth = -dx * s - dz * c;
    return { u: .5 + (c * dx - s * dz) / depth * .48, v: .48 - (y - e.y) / depth * .85, depth };
}
function cityWindow(view) {
    const { c, g } = paper(512, 328), rnd = (0, world_textures_js_1.random)(546);
    const sky = g.createLinearGradient(0, 0, 0, 328);
    sky.addColorStop(0, '#647b94');
    sky.addColorStop(.47, '#a8adb0');
    sky.addColorStop(.48, '#768b97');
    sky.addColorStop(1, '#657886');
    g.fillStyle = sky;
    g.fillRect(0, 0, 512, 328);
    for (let n = 0; n < 700; n++) {
        g.fillStyle = n % 2 ? 'rgba(209,210,203,.15)' : 'rgba(102,118,128,.12)';
        g.fillRect(rnd() * 512, 160 + rnd() * 168, 2 + rnd() * 23, 1);
    }
    const e = exports.vistas[view], paint = (pts, col) => {
        const q = pts.map(([x, y, z]) => projectVista(view, x, y, z));
        if (q.some(p => p.depth < .45))
            return;
        g.fillStyle = col;
        g.beginPath();
        q.forEach((p, i) => i ? g.lineTo(p.u * 512, p.v * 328) : g.moveTo(p.u * 512, p.v * 328));
        g.closePath();
        g.fill();
    };
    for (const r of [[-174, 24, 168, 36], [-55, -130, -45, 61], [-174, -51, 168, -41], [40, -128, 52, 60], [-115, 62, 130, 84]]) {
        const [l, n, rt, so] = r;
        paint([[l, 0, n], [rt, 0, n], [rt, 0, so], [l, 0, so]], '#536571');
    }
    const items = [...world_expansion_layout_js_1.expansionBuildings, ...world_layout_js_1.apartments, ...Object.entries(world_layout_js_1.buildings).map(([id, b]) => ({ ...b, h: id.startsWith('garage') ? 4.2 : id === 'shed' ? 5.4 : id === 'power' ? 18.8 : id === 'dispatcher' ? 3.45 : 2.88 }))];
    items.sort((a, b) => Math.hypot(b.x - e.x, b.z - e.z) - Math.hypot(a.x - e.x, a.z - e.z));
    for (const b of items) {
        const x = b.x - b.w / 2, X = b.x + b.w / 2, z = b.z - b.d / 2, Z = b.z + b.d / 2, h = b.h;
        const sides = [[[x, 0, z], [X, 0, z], [X, h, z], [x, h, z]], [[X, 0, z], [X, 0, Z], [X, h, Z], [X, h, z]], [[X, 0, Z], [x, 0, Z], [x, h, Z], [X, h, Z]], [[x, 0, Z], [x, 0, z], [x, h, z], [x, h, Z]]];
        for (let j = 0; j < 4; j++) {
            if ((j === 0 && e.z >= z) || (j === 1 && e.x <= X) || (j === 2 && e.z <= Z) || (j === 3 && e.x >= x))
                continue;
            const a = sides[j];
            paint(a, ['#7c8180', '#6d787c', '#808683', '#798083'][j]);
            const w = j % 2 ? b.d : b.w, n = Math.max(1, Math.floor(w / 3.25)), rows = Math.floor((h - 1.7) / 3);
            for (let k = 0; k < n; k++)
                for (let f = 0; f < rows; f++) {
                    const t = (k + .5) / n, dx = a[1][0] - a[0][0], dz = a[1][2] - a[0][2], px = a[0][0] + dx * t, pz = a[0][2] + dz * t, hh = 1.84 + f * 3.0;
                    const wx = dx / w * .67, wz = dz / w * .67;
                    paint([[px - wx, hh, pz - wz], [px + wx, hh, pz + wz], [px + wx, hh + 1.05, pz + wz], [px - wx, hh + 1.05, pz - wz]], rnd() > .56 ? '#e3bf82' : '#556b79');
                }
        }
        paint([[x, h, z], [X, h, z], [X, h, Z], [x, h, Z]], '#afb9be');
    }
    return (0, world_textures_js_1.texture)(c);
}
function utilityFinish(zone, surface, seed) {
    const w = 512, h = surface === 'floor' ? 384 : 192, { c, g } = paper(w, h), rnd = (0, world_textures_js_1.random)(seed);
    const basement = zone === 'basement', workshop = zone === 'workshop', dispatch = zone === 'dispatch', roof = zone === 'roof', lift = zone === 'lift';
    const shopFloor = zone === 'cafe' ? '#a48e83' : zone === 'taxipark' ? '#898982' : zone === 'terminal' ? '#828e82' : zone === 'hydro' ? '#82929f' : zone === 'passage' ? '#a39f89' : null;
    if (surface === 'floor') {
        g.fillStyle = shopFloor ?? (roof ? '#b4c0c6' : lift ? '#828b84' : basement ? '#79827c' : workshop ? '#9b9c89' : '#949b8d');
        g.fillRect(0, 0, w, h);
        const sx = lift ? 42 : basement ? 97 : roof ? 76 : 46, sz = lift ? 51 : basement ? 100 : roof ? h : 42;
        for (let y = 0; y < h; y += sz)
            for (let x = 0; x < w; x += sx) {
                g.fillStyle = 'rgba(44,62,59,' + (rnd() * .105) + ')';
                g.fillRect(x + 1, y + 1, sx - 1, sz - 1);
                g.fillStyle = roof ? '#91a0a9' : 'rgba(59,76,69,.41)';
                g.fillRect(x, y, 1.5, sz);
                g.fillRect(x, y, sx, 1.4);
                g.fillStyle = 'rgba(213,219,203,.28)';
                g.fillRect(x + 1.5, y + 1.4, sx - 2, 1);
            }
        for (let k = 0; k < 1400; k++) {
            const x = rnd() * w, y = rnd() * h;
            g.fillStyle = k % 2 ? 'rgba(43,60,62,.15)' : 'rgba(220,222,206,.25)';
            g.fillRect(x, y, 1 + rnd() * (roof ? 16 : 5), 1);
        }
        for (let k = 0; k < 60; k++) {
            const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 17, fade = g.createRadialGradient(x, y, 0, x, y, r);
            fade.addColorStop(0, roof ? 'rgba(237,240,236,.44)' : basement ? 'rgba(55,79,70,.46)' : 'rgba(76,72,56,.13)');
            fade.addColorStop(1, 'rgba(96,108,99,0)');
            g.fillStyle = fade;
            g.fillRect(x - r, y - r, r * 2, r * 2);
        }
        if (basement) {
            g.fillStyle = '#697772';
            g.fillRect(72, 238, 74, 31);
            g.fillStyle = '#445953';
            for (let n = 0; n < 13; n++)
                g.fillRect(77 + n * 5, 241, 2, 25);
        }
        if (workshop || dispatch) {
            g.strokeStyle = 'rgba(201,180,126,.72)';
            g.lineWidth = 3;
            g.setLineDash([14, 8]);
            g.strokeRect(38, 40, w - 76, h - 82);
            g.setLineDash([]);
        }
    }
    else {
        const upper = zone === 'cafe' ? '#d0b9a5' : zone === 'terminal' ? '#adb6a8' : zone === 'hydro' ? '#b2c0ca' : zone === 'passage' ? '#b3a990' : lift ? '#aab6ad' : basement ? '#a3a698' : workshop ? '#c6bca4' : '#c3c4b3';
        const lower = zone === 'cafe' ? '#a47c71' : zone === 'terminal' ? '#648983' : zone === 'hydro' ? '#678096' : zone === 'passage' ? '#7c846a' : lift ? '#8d9c95' : basement ? '#788d80' : workshop ? '#6c9189' : '#798f82';
        const cut = h * .61, gradient = g.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, upper);
        gradient.addColorStop(.60, upper);
        gradient.addColorStop(.612, lower);
        gradient.addColorStop(1, lower);
        g.fillStyle = gradient;
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2100; i++) {
            const x = rnd() * w, y = rnd() * h;
            g.fillStyle = i % 2 ? 'rgba(61,71,64,.12)' : 'rgba(218,215,189,.26)';
            g.fillRect(x, y, .6 + rnd() * (basement ? 5 : 2), .6 + rnd() * (basement ? 2 : 1.1));
        }
        for (let i = 0; i < (basement ? 26 : 8); i++) {
            const x = rnd() * w, y = rnd() * h * .61, l = 16 + rnd() * 55, grad = g.createLinearGradient(x, y, x + 4, y + l);
            grad.addColorStop(0, basement ? 'rgba(95,78,59,.19)' : 'rgba(116,114,87,.12)');
            grad.addColorStop(1, 'rgba(97,104,83,0)');
            g.fillStyle = grad;
            g.fillRect(x, y, 2 + rnd() * 8, l);
        }
        for (let i = 0; i < 4; i++) {
            const x = 12 + i * 145;
            g.fillStyle = 'rgba(57,77,70,.22)';
            g.fillRect(x, 0, 1, h);
            g.fillStyle = 'rgba(212,218,194,.34)';
            g.fillRect(x + 1, 0, 1, h);
        }
        g.fillStyle = 'rgba(196,197,154,.75)';
        g.fillRect(0, cut - 1, w, 2);
        g.fillStyle = '#6a786b';
        g.fillRect(0, h - 6, w, 6);
        const light = g.createRadialGradient(w * .50, 0, 0, w * .50, 0, w * .38);
        light.addColorStop(0, 'rgba(255,228,173,.24)');
        light.addColorStop(1, 'rgba(255,230,180,0)');
        g.fillStyle = light;
        g.fillRect(0, 0, w, h);
    }
    return (0, world_textures_js_1.texture)(c);
}
