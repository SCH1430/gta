"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paintMeltwater = paintMeltwater;
exports.paintDrain = paintDrain;
exports.paintPlough = paintPlough;
exports.paintDrift = paintDrift;
exports.paintWindCrust = paintWindCrust;
const ripples = { amber: ['#e7b480', '#cf8d67'], ice: ['#a0bdc8', '#819fb4'], jade: ['#83c7b0', '#79aeae'] };
function paintMeltwater(c, x, z, rx, rz, angle, tint, seed) {
    let state = seed >>> 0;
    const rnd = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
    const phase = rnd() * Math.PI * 2, phase2 = rnd() * 6.2;
    c.save();
    c.translate(x, z);
    c.rotate(angle);
    c.scale(rx, rz);
    c.beginPath();
    for (let i = 0; i <= 64; i++) {
        const a = i * Math.PI / 32;
        const shape = .82 + .105 * Math.sin(3 * a + phase) + .09 * Math.sin(5 * a - phase2) + .056 * Math.cos(7 * a + phase) + .035 * Math.sin(13 * a + phase2);
        const u = shape * Math.cos(a), v = shape * Math.sin(a);
        if (i === 0)
            c.moveTo(u, v);
        else
            c.lineTo(u, v);
    }
    c.closePath();
    c.strokeStyle = 'rgba(31,46,56,.91)';
    c.lineWidth = .105;
    c.stroke();
    c.strokeStyle = 'rgba(123,144,155,.58)';
    c.lineWidth = .025;
    c.stroke();
    c.clip();
    const water = c.createLinearGradient(-.28, -.96, .36, .99);
    const horizon = tint === 'amber' ? '#9b8a83' : tint === 'jade' ? '#779697' : '#7a91a3';
    water.addColorStop(0, '#596e83');
    water.addColorStop(.35, '#485b70');
    water.addColorStop(.72, horizon);
    water.addColorStop(1, '#405767');
    c.fillStyle = water;
    c.fillRect(-1.15, -1.15, 2.3, 2.3);
    let u = -1.25;
    while (u < 1.16) {
        const breadth = .19 + rnd() * .37, depth = -.6 + rnd() * .93;
        c.fillStyle = rnd() > .45 ? 'rgba(31,48,68,.77)' : 'rgba(38,54,71,.84)';
        c.beginPath();
        c.moveTo(u - .075, -1.1);
        c.lineTo(u + breadth - .075, -1.1);
        c.lineTo(u + breadth, depth);
        c.lineTo(u + .008, depth + .025);
        c.closePath();
        c.fill();
        for (let column = u + .05; column < u + breadth - .005; column += .094) {
            for (let v = -.87; v < depth - .03; v += .145) {
                if (rnd() > .61)
                    continue;
                const drift = .042 * (v + 1) + .022 * Math.sin(16 * v + phase);
                c.globalAlpha = .3 + .46 * rnd();
                c.fillStyle = ripples[tint][rnd() > .6 ? 1 : 0];
                c.fillRect(column + drift, v, .046 + rnd() * .043, .030 + rnd() * .061);
            }
        }
        c.globalAlpha = 1;
        u += breadth + .013;
    }
    const centre = .18 * Math.sin(phase);
    for (let i = 0; i < 27; i++) {
        const v = .05 + rnd() * .87, w = .07 + rnd() * .25, px = centre + (rnd() - .5) * (.19 + .32 * v);
        c.globalAlpha = (.06 + rnd() * .22) * (1 - v * .48);
        c.fillStyle = ripples[tint][0];
        c.fillRect(px - w * .5, v, w, .014 + rnd() * .022);
    }
    c.globalAlpha = 1;
    for (let i = 0; i < 95; i++) {
        const px = rnd() * 2.2 - 1.1, pz = rnd() * 2.15 - 1.1;
        c.fillStyle = i % 4 === 0 ? 'rgba(183,202,210,.35)' : i % 3 === 0 ? 'rgba(112,136,151,.48)' : 'rgba(46,61,78,.42)';
        c.fillRect(px, pz, .025 + rnd() * .19, .009 + rnd() * .019);
    }
    c.restore();
}
function paintDrain(c, x, z, angle) {
    c.save();
    c.translate(x, z);
    c.rotate(angle);
    c.fillStyle = '#404a52';
    c.fillRect(-.47, -.68, .94, 1.36);
    c.fillStyle = '#172b38';
    c.fillRect(-.40, -.59, .80, 1.18);
    for (let i = 0; i < 8; i++) {
        const v = -.55 + i * .151;
        c.fillStyle = '#66777c';
        c.fillRect(-.37, v, .74, .068);
        c.fillStyle = '#9da69f';
        c.fillRect(-.37, v, .74, .022);
    }
    for (const u of [-.2, .2]) {
        c.fillStyle = '#53646c';
        c.fillRect(u, -.59, .04, 1.18);
    }
    c.restore();
}
function paintPlough(c, x, z, length, width, vertical, random) {
    c.save();
    c.translate(x, z);
    if (vertical)
        c.rotate(Math.PI / 2);
    for (let at = 0; at < length; at += .68) {
        const pick = random(), v = pick < .32 ? (random() - .5) * 1.12 : (pick < .66 ? -1 : 1) * (width * .5 - .29 - random() * .46);
        c.fillStyle = pick < .32 ? 'rgba(126,117,103,.38)' : 'rgba(154,149,137,.48)';
        c.fillRect(at, v, .31 + random() * 2.22, .04 + random() * .13);
        c.fillStyle = 'rgba(223,222,204,.24)';
        c.fillRect(at + .11, v + .04, random() * .46, .045);
    }
    c.restore();
}
function paintDrift(c, x, z, rx, rz, angle, random) {
    c.save();
    c.translate(x, z);
    c.rotate(angle);
    c.scale(rx, rz);
    c.beginPath();
    const phase = random() * 6.28, lobes = 3 + Math.floor(random() * 3);
    for (let i = 0; i < 46; i++) {
        const a = i * Math.PI / 23, tail = Math.max(0, Math.cos(a));
        const rough = 1 + .10 * Math.sin(lobes * a + phase) + .05 * Math.sin(11 * a - phase);
        const u = Math.cos(a) * (1 + .45 * tail) * rough;
        const v = Math.sin(a) * (.79 - .43 * tail) * rough + .10 * tail;
        if (i) c.lineTo(u, v); else c.moveTo(u, v);
    }
    c.closePath();
    const ink = c.createLinearGradient(0, -.85, .23, .71);
    ink.addColorStop(0, '#899ca8');
    ink.addColorStop(.28, '#c1ced3');
    ink.addColorStop(.58, '#d9e0dc');
    ink.addColorStop(.82, '#b3c1c7');
    ink.addColorStop(1, '#8798a3');
    c.fillStyle = ink;
    c.fill();
    c.clip();
    paintWindCrust(c, -1, -.76, 2.4, 1.55, random, 12);
    c.restore();
}
// Wind scours short, tapering hollows into the crust. Everything is baked into the ground atlas.
function paintWindCrust(c, x, z, w, d, random, count) {
    for (let i = 0; i < count; i++) {
        const u = x + random() * w, v = z + random() * d;
        const stretch = Math.min(w * .22, .48) + w * (.018 + .046 * random());
        const rise = Math.min(d * .034, .045) + d * (.0018 + .0042 * random());
        c.save();
        c.translate(u, v);
        c.rotate(-.22 + random() * .18);
        for (let j = 0, n = 2 + Math.floor(random() * 4); j < n; j++) {
            const left = stretch * (random() - .65), len = stretch * (.48 + random());
            const y = (j - 1) * rise * .92, depth = rise * (.45 + random() * .65);
            const gradient = c.createLinearGradient(0, y - depth, 0, y + depth);
            gradient.addColorStop(0, 'rgba(222,232,231,0)');
            gradient.addColorStop(.39, 'rgba(224,233,230,.27)');
            gradient.addColorStop(.56, 'rgba(122,145,160,.28)');
            gradient.addColorStop(1, 'rgba(122,145,160,0)');
            c.fillStyle = gradient;
            c.beginPath();
            c.moveTo(left, y);
            c.bezierCurveTo(left + len * .32, y - depth, left + len * .67, y - depth * .7, left + len, y + depth * .14);
            c.bezierCurveTo(left + len * .58, y - depth * .16, left + len * .31, y + depth * .88, left, y);
            c.fill();
        }
        c.restore();
    }
}
