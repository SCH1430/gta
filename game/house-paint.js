"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rugPrint = void 0;
exports.floorPrint = floorPrint;
exports.wallPaper = wallPaper;
exports.houseWindow = houseWindow;
exports.foyerPrint = foyerPrint;
const world_textures_js_1 = require("./world-textures.js");
function painted(w, h, draw) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const c = cv.getContext('2d');
    draw(c);
    return (0, world_textures_js_1.texture)(cv);
}
function floorPrint(kind, w, d) {
    const px = Math.min(1024, Math.ceil(w * 75)), py = Math.min(1024, Math.ceil(d * 75));
    const rand = (0, world_textures_js_1.random)(kind === 'parquet' ? 340 : 174);
    return painted(px, py, c => {
        c.scale(px / w, py / d);
        if (kind === 'parquet') {
            c.fillStyle = '#5d4938';
            c.fillRect(0, 0, w, d);
            const colors = ['#ac8866', '#b59172', '#a98665', '#b49572', '#c09b77', '#af886a'];
            c.save();
            c.translate(w * .5, d * .5);
            c.rotate(-Math.PI / 4);
            const pitch = .32, fw = pitch / 3;
            for (let i = -50; i <= 50; i++)
                for (let j = -50; j <= 50; j++) {
                    const x = (i + j) * pitch, z = (i - j) * pitch;
                    if (Math.abs(x) > w + d || Math.abs(z) > w + d)
                        continue;
                    for (let finger = 0; finger < 3; finger++)
                        for (const vertical of [false, true]) {
                            const tx = x + (vertical ? pitch + finger * fw : 0), tz = z + (vertical ? 0 : finger * fw);
                            if (tx < -w || tz < -d || tx > w || tz > d)
                                continue;
                            const l = vertical ? fw : pitch, h = vertical ? pitch : fw;
                            c.fillStyle = colors[Math.floor(rand() * colors.length)];
                            c.fillRect(tx + .004, tz + .004, l - .007, h - .007);
                            c.fillStyle = 'rgba(76,44,27,.18)';
                            const f = rand() * .8 + .08;
                            if (vertical)
                                c.fillRect(tx + f * l, tz + .018, .007, h * .68);
                            else
                                c.fillRect(tx + .014, tz + f * h, l * .78, .007);
                        }
                }
            c.restore();
        }
        else {
            c.fillStyle = kind === 'tile' ? '#86877d' : '#918f83';
            c.fillRect(0, 0, w, d);
            const side = kind === 'tile' ? .415 : .62, gap = kind === 'tile' ? .016 : .008;
            for (let z = 0, n = 0; z < d; z += side, n++)
                for (let x = 0, i = 0; x < w; x += side, i++) {
                    c.fillStyle = kind === 'tile' ? ((n + i) % 2 ? '#abb4a8' : '#c3c3b3') : ['#979689', '#99978b', '#9d9b8f'][Math.floor(rand() * 3)];
                    c.fillRect(x + gap, z + gap, side - gap, side - gap);
                }
            if (kind === 'terrazzo')
                for (let i = 0; i < w * d * 60; i++) {
                    c.fillStyle = i % 2 ? 'rgba(71,75,71,.36)' : 'rgba(225,217,191,.41)';
                    c.fillRect(rand() * w, rand() * d, .014 + rand() * .022, .012 + rand() * .025);
                }
        }
        const edge = c.createLinearGradient(0, 0, w, 0);
        edge.addColorStop(0, 'rgba(34,33,31,.28)');
        edge.addColorStop(.07, 'rgba(34,33,31,0)');
        edge.addColorStop(.93, 'rgba(34,33,31,0)');
        edge.addColorStop(1, 'rgba(34,33,31,.24)');
        c.fillStyle = edge;
        c.fillRect(0, 0, w, d);
        if (kind === 'parquet' || kind === 'tile') {
            c.fillStyle = 'rgba(244,202,139,.21)';
            c.beginPath();
            c.moveTo(w * .29, d);
            c.lineTo(w * .84, d);
            c.lineTo(w * .79, d * .64);
            c.lineTo(w * .20, d * .62);
            c.fill();
            c.fillStyle = 'rgba(85,75,68,.13)';
            c.fillRect(w * .51, d * .64, .039, d * .36);
        }
    });
}
const rugPrint = () => painted(480, 310, c => {
    const colors = ['#995448', '#ab6e59', '#c69472', '#c9ab86', '#73675c', '#544a48', '#885844'];
    const seed = (0, world_textures_js_1.random)(920);
    c.fillStyle = colors[0];
    c.fillRect(0, 0, 480, 310);
    for (let i = 0; i < 6; i++) {
        const pad = 3 + i * 4;
        c.strokeStyle = colors[[4, 3, 6, 3, 1, 4][i]];
        c.lineWidth = i === 3 ? 4 : 2;
        c.strokeRect(pad, pad, 480 - 2 * pad, 310 - 2 * pad);
    }
    function diamond(cx, cy, r, v) {
        for (let k = 0; k < 5; k++, r *= .70) {
            c.fillStyle = colors[(k + v) % colors.length];
            c.beginPath();
            c.moveTo(cx, cy - r);
            c.lineTo(cx + r * 1.28, cy);
            c.lineTo(cx, cy + r);
            c.lineTo(cx - r * 1.28, cy);
            c.fill();
        }
    }
    for (let i = 0; i < 9; i++)
        for (let j = 0; j < 6; j++)
            diamond(39 + i * 50 + (j % 2) * 17, 36 + j * 46, 7, 2);
    diamond(118, 155, 65, 4);
    diamond(240, 155, 100, 2);
    diamond(361, 155, 65, 4);
    for (let i = 0; i < 2400; i++) {
        c.fillStyle = i % 2 ? 'rgba(231,210,179,.09)' : 'rgba(55,42,37,.10)';
        c.fillRect(seed() * 480, seed() * 310, 1 + seed() * 10, .8);
    }
});
exports.rugPrint = rugPrint;
function wallPaper() {
    return painted(192, 320, c => {
        const grad = c.createLinearGradient(0, 0, 0, 320);
        grad.addColorStop(0, '#a7947e');
        grad.addColorStop(.08, '#c7b398');
        grad.addColorStop(.7, '#c9b99e');
        grad.addColorStop(1, '#a99c89');
        c.fillStyle = grad;
        c.fillRect(0, 0, 192, 320);
        for (let y = -25; y < 360; y += 50)
            for (let n = -1; n < 4; n++) {
                const x = 16 + 64 * n + (Math.floor((y + 25) / 50) % 2) * 32;
                c.strokeStyle = 'rgba(117,93,69,.28)';
                c.lineWidth = 1.4;
                c.beginPath();
                c.moveTo(x, y - 16);
                c.bezierCurveTo(x + 20, y - 3, x + 12, y + 3, x, y + 20);
                c.bezierCurveTo(x - 13, y + 3, x - 20, y - 3, x, y - 16);
                c.stroke();
                c.beginPath();
                c.moveTo(x, y + 11);
                c.quadraticCurveTo(x + 9, y - 3, x, y - 7);
                c.quadraticCurveTo(x - 6, y - 1, x, y + 6);
                c.stroke();
            }
        const rand = (0, world_textures_js_1.random)(297);
        for (let i = 0; i < 900; i++) {
            c.fillStyle = 'rgba(79,74,67,.08)';
            c.fillRect(rand() * 192, rand() * 320, 1, 2);
        }
    });
}
function houseWindow(seed) {
    return painted(640, 400, c => {
        const r = (0, world_textures_js_1.random)(seed);
        const sky = c.createLinearGradient(0, 0, 0, 400);
        sky.addColorStop(0, '#617e9b');
        sky.addColorStop(.53, '#a0acb6');
        sky.addColorStop(.77, '#d5beb2');
        sky.addColorStop(1, '#8b969b');
        c.fillStyle = sky;
        c.fillRect(0, 0, 640, 400);
        for (let layer = 0; layer < 3; layer++) {
            let x = -18;
            while (x < 660) {
                const w = 29 + r() * 69, h = 55 + r() * (48 + layer * 19), y = 300 + layer * 33 - h;
                c.fillStyle = ['#8996a2', '#748594', '#566a78'][layer];
                c.fillRect(x, y, w, h + 65);
                c.fillStyle = ['#b6b8b9', '#a6adb1', '#a4adb2'][layer];
                c.fillRect(x - 2, y - 2, w + 3, 2.2);
                for (let yy = y + 5; yy < y + h; yy += 11)
                    for (let xx = x + 5; xx < x + w - 6; xx += 10) {
                        const warm = r();
                        c.fillStyle = warm > .68 ? ['#dec8aa', '#e4bb8f', '#c4b99b'][Math.floor(r() * 3)] : warm > .28 ? '#72838e' : '#5d707d';
                        c.fillRect(xx, yy, 4.3, 5.1);
                    }
                x += w + r() * 15;
            }
        }
        for (let i = 0; i < 3; i++) {
            const x = 80 + 171 * i + r() * 30, h = 44 + r() * 40;
            c.fillStyle = '#788691';
            c.fillRect(x, 155 - h, 5, h);
            c.fillStyle = '#a0908b';
            for (let k = 0; k < 3; k++)
                c.fillRect(x, 155 - h + 5 + 9 * k, 5, 3);
            c.fillStyle = '#d28d81';
            c.fillRect(x + 1, 150 - h, 2, 3);
        }
        c.strokeStyle = '#73818a';
        c.lineWidth = 1.4;
        for (let n = 0; n < 3; n++) {
            c.beginPath();
            c.moveTo(0, 270 + n * 9);
            c.quadraticCurveTo(355, 335 + n * 8, 640, 260 + n * 9);
            c.stroke();
        }
        const frost = c.createLinearGradient(0, 380, 0, 250);
        frost.addColorStop(0, 'rgba(196,217,220,.65)');
        frost.addColorStop(1, 'rgba(196,217,220,0)');
        c.fillStyle = frost;
        c.fillRect(0, 245, 640, 155);
        for (let i = 0; i < 410; i++) {
            c.fillStyle = 'rgba(226,237,237,.22)';
            const x = r() * 640, y = 400 - r() ** 2 * 160;
            c.fillRect(x, y, 1, 2 + r() * 6);
        }
    });
}
function foyerPrint(kind) {
    return painted(416, 320, c => {
        if (kind === 'portal') {
            c.fillStyle = '#25363a';
            c.fillRect(0, 0, 416, 320);
            c.fillStyle = '#59635d';
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(160, 65);
            c.lineTo(160, 220);
            c.lineTo(0, 320);
            c.fill();
            c.fillStyle = '#747268';
            c.beginPath();
            c.moveTo(416, 0);
            c.lineTo(292, 65);
            c.lineTo(292, 220);
            c.lineTo(416, 320);
            c.fill();
            c.fillStyle = '#988870';
            c.fillRect(160, 65, 132, 155);
            c.fillStyle = '#6e7e74';
            c.fillRect(173, 82, 93, 137);
            c.fillStyle = '#e1bf81';
            c.fillRect(183, 32, 76, 6);
            c.fillStyle = '#998b75';
            c.beginPath();
            c.moveTo(0, 320);
            c.lineTo(160, 220);
            c.lineTo(292, 220);
            c.lineTo(416, 320);
            c.fill();
            return;
        }
        if (kind === 'picture') {
            const g = c.createLinearGradient(0, 0, 0, 320);
            g.addColorStop(0, '#839f9c');
            g.addColorStop(.58, '#e8bb91');
            g.addColorStop(1, '#8b6f59');
            c.fillStyle = g;
            c.fillRect(0, 0, 416, 320);
            c.fillStyle = '#d69b69';
            c.beginPath();
            c.arc(287, 128, 39, 0, 2 * Math.PI);
            c.fill();
            for (let j = 0; j < 3; j++) {
                c.fillStyle = ['#a6a498', '#898e83', '#536563'][j];
                c.beginPath();
                c.moveTo(0, 320);
                for (let x = 0; x <= 420; x += 12)
                    c.lineTo(x, 185 + j * 27 + Math.sin(x * .016 + 2 * j) * 16 + Math.sin(x * .041 + j) * 8);
                c.lineTo(416, 320);
                c.fill();
            }
            c.fillStyle = '#485859';
            c.fillRect(119, 110, 4, 124);
            c.fillRect(112, 112, 56, 4);
            c.fillRect(158, 114, 3, 28);
            return;
        }
        c.fillStyle = '#795f48';
        c.fillRect(0, 0, 416, 320);
        const notes = [[15, 18, 181, 133, '#d9d1b8', 'СОБРАНИЕ'], [213, 18, 181, 83, '#a4bbbb', 'ДЕПО · 07'], [216, 115, 174, 181, '#c7be9b', 'ДЕЖУРСТВА'], [19, 167, 172, 130, '#c5b198', 'РЕМОНТ']];
        for (const row of notes) {
            const [x, y, w, h] = row.slice(0, 4);
            c.fillStyle = String(row[4]);
            c.fillRect(x + 2, y + 3, w, h);
            c.fillStyle = '#595e58';
            c.font = 'bold 15px K77Body';
            c.fillText(String(row[5]), x + 12, y + 25);
            for (let i = 0; i < Math.floor((h - 33) / 13); i++)
                c.fillRect(x + 11, y + 39 + i * 13, w * (.42 + ((i + 1) % 3) * .11), 2);
            c.fillStyle = '#887557';
            c.beginPath();
            c.arc(x + w / 2, y + 7, 3.2, 0, Math.PI * 2);
            c.fill();
        }
    });
}
