"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courtAtlas = courtAtlas;
const THREE = require("../engine/three.module.min.js");
const world_textures_js_1 = require("./world-textures.js");
const region_architecture_mesh_js_1 = require("./region-architecture-mesh.js");
const outer_site_layout_js_1 = require("./outer-site-layout.js");
const outer_landmarks_js_1 = require("./outer-landmarks.js");
const styles = {
    northpark: { base: '#777e83', edge: '#abb5b6', line: '#d6cbab', name: 'СЕВЕР-8', inset: 3.6, max: 40 },
    cargo: { base: '#736f70', edge: '#a49285', line: '#e3aa65', name: 'КРАСНЫЙ ПЕРЕГОН', inset: 4.3, max: 47 },
    dam: { base: '#6f8087', edge: '#acbabe', line: '#a5d1d4', name: 'БЕЛАЯ ПЛОТИНА', inset: 3.5, max: 45 },
    mill: { base: '#787875', edge: '#a5a594', line: '#d9bb8d', name: 'СЕВЕРНЫЙ ЛЕС', inset: 4.4, max: 47 }
};
function locationStamp(c, id) {
    const r = outer_site_layout_js_1.outerSiteCourts[id], style = styles[id], rand = (0, world_textures_js_1.random)(7777 + id.charCodeAt(1));
    const L = -r.w * .5, R = r.w * .5, B = -r.d * .5, F = r.d * .5;
    c.fillStyle = style.edge;
    c.fillRect(L, B, r.w, r.d);
    c.fillStyle = style.base;
    c.fillRect(L + .22, B + .22, r.w - .44, r.d - .44);
    for (let i = 0; i < 12500; i++) {
        const x = L + rand() * r.w, z = B + rand() * r.d + Math.sin(x * .4) * .08;
        c.fillStyle = i % 4 === 0 ? 'rgba(30,50,61,.16)' : 'rgba(149,160,155,.21)';
        c.fillRect(x, z, .08 + rand() * .36, .06 + rand() * .24);
    }
    c.strokeStyle = '#68747b';
    c.lineWidth = .06;
    for (let x = -r.w * .5 + 4; x < R; x += 7.4) {
        c.beginPath();
        c.moveTo(x, B);
        c.lineTo(x + .13, F);
        c.stroke();
    }
    for (let z = B + 2; z < F; z += 4.1) {
        c.beginPath();
        c.moveTo(L, z);
        c.lineTo(R, z - .14);
        c.stroke();
    }
    c.fillStyle = style.line;
    if (id === 'northpark') {
        for (let x = -style.max; x < style.max; x += 2.15) {
            c.fillRect(x, B + 1.19, 1.07, .115);
            c.fillRect(x, F - 1.22, 1.07, .115);
        }
        c.fillStyle = '#909a99';
        c.fillRect(-2.8, B, 5.6, r.d);
        for (let x = -2.61; x < 2.71; x += .66)
            for (let z = B; z < F; z += .55) {
                c.fillStyle = ((Math.floor(x / .66) + Math.floor(z / .55)) % 4 === 0 ? '#91999a' : '#8a989a');
                c.fillRect(x, z, .54, .46);
            }
        c.fillStyle = style.line;
        for (const x of [-12.5, 12.5])
            for (let i = 0; i < 5; i++)
                c.fillRect(x + i * .44, F - 4.9, .20, 3.6);
    }
    else {
        for (const side of [-1, 1]) {
            c.save();
            c.scale(side, 1);
            c.fillStyle = style.line;
            c.fillRect(5.6, B + .5, .09, r.d - .86);
            for (let x = style.inset + 5; x < style.max; x += 7.5) {
                c.fillRect(x, B + 1.15, .14, 3.2);
                c.fillRect(x, B + 4.34, 6.8, .13);
            }
            for (let j = 0; j < 6; j++) {
                const x = 15 + j * 4.65;
                c.beginPath();
                c.moveTo(x, F - 2.2);
                c.lineTo(x + 1.92, F - .58);
                c.lineTo(x + 2.19, F - .58);
                c.lineTo(x + .28, F - 2.2);
                c.fill();
            }
            c.restore();
        }
        if (id === 'cargo') {
            c.fillStyle = '#796759';
            for (const x of [-21, 21])
                c.fillRect(x - .64, B, 1.28, r.d - 5.6);
            c.fillStyle = '#aaa295';
            for (const x of [-21.51, -20.48, 20.48, 21.51])
                c.fillRect(x, B, .084, r.d - 5.65);
        }
        else if (id === 'dam') {
            c.strokeStyle = '#819ba4';
            c.lineWidth = .49;
            for (const x of [-29, 29]) {
                c.beginPath();
                c.moveTo(x, B);
                c.lineTo(x, F - 7.4);
                c.lineTo(x * .52, F - 7.35);
                c.stroke();
            }
        }
    }
    c.save();
    c.scale(.10, .10);
    c.font = 'bold 13px K77Display, sans-serif';
    c.textAlign = 'center';
    c.fillStyle = style.line;
    c.fillText(style.name, 0, 0, 98);
    c.restore();
    const color = outer_landmarks_js_1.outerLightColor[id];
    for (const [x, z, size] of [[-32, B + 4.7, 10.8], [32, B + 4.7, 10.8], [-10, B + 1.9, 12], [10, B + 1.9, 12]]) {
        const diffuse = c.createRadialGradient(x, z, .2, x, z, size);
        diffuse.addColorStop(0, color + 'ab');
        diffuse.addColorStop(.28, color + '76');
        diffuse.addColorStop(.72, color + '24');
        diffuse.addColorStop(1, color + '00');
        c.fillStyle = diffuse;
        c.fillRect(x - size, z - size, size * 2, size * 2);
    }
    for (let i = 0; i < 46; i++) {
        const x = L + rand() * r.w, z = (i % 3 === 0 ? B : F) + (i % 3 === 0 ? 1 : -1) * rand() * 1.55;
        c.fillStyle = i % 4 === 0 ? 'rgba(222,230,231,.7)' : 'rgba(194,207,209,.40)';
        c.fillRect(x, z, .2 + rand() * 2.1, .14 + rand() * .47);
    }
}
function courtAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const c = canvas.getContext('2d'), material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const ids = Object.keys(outer_site_layout_js_1.outerSiteCourts);
    for (const [i, id] of ids.entries()) {
        const r = outer_site_layout_js_1.outerSiteCourts[id], ox = (i % 2) * 1024, oz = Math.floor(i / 2) * 512;
        c.save();
        c.beginPath();
        c.rect(ox, oz, 1024, 512);
        c.clip();
        c.translate(ox + 512, oz + 256);
        c.scale(1024 / r.w, 512 / r.d);
        locationStamp(c, id);
        c.restore();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    material.map = map;
    return (id) => {
        const i = ids.indexOf(id), r = outer_site_layout_js_1.outerSiteCourts[id], g = new region_architecture_mesh_js_1.Masonry();
        const L = r.x - r.w * .5, R = r.x + r.w * .5, T = r.z - r.d * .5, B = r.z + r.d * .5, y = -.022;
        const u = (i % 2) * .5, v = 1 - (Math.floor(i / 2) + 1) * .5, pixel = .001;
        g.quad([L, y, B], [R, y, B], [R, y, T], [L, y, T], '#ffffff', [u + pixel, v + pixel, u + .5 - pixel, v + .5 - pixel]);
        const mesh = g.mesh(material);
        mesh.name = 'Подъездная площадка · ' + styles[id].name;
        mesh.userData.groundSurface = true;
        return mesh;
    };
}
