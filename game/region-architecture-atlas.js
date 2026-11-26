"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = void 0;
exports.regionalAtlas = regionalAtlas;
const THREE = require("../engine/three.module.min.js");
const world_textures_js_1 = require("./world-textures.js");
const boroughs = ['radio', 'quarry', 'water', 'dock', 'northpark', 'cargo', 'dam', 'mill'];
exports.paint = {
    radio: { base: '#728595', shade: '#384d60', bright: '#98ded8', trim: '#b2bfc5', roof: '#74838c', name: 'РАДИОГОРСК', code: 'РГ' },
    quarry: { base: '#987d69', shade: '#554c49', bright: '#ffd38d', trim: '#c1a482', roof: '#786d68', name: 'СТАРЫЙ КАРЬЕР', code: 'СК' },
    water: { base: '#8c9b9b', shade: '#475d66', bright: '#dbecd8', trim: '#b4c4ba', roof: '#778991', name: 'ОЗЁРНАЯ СЛОБОДА', code: 'ОС' },
    dock: { base: '#8a807c', shade: '#475a62', bright: '#f6c09c', trim: '#af9990', roof: '#6c7c86', name: 'СУХОЙ ДОК', code: 'СД' },
    northpark: { base: '#8a9da7', shade: '#425a6a', bright: '#b3ebd6', trim: '#acbcb8', roof: '#697d90', name: 'СЕВЕРНЫЙ ПОСЁЛОК', code: 'С-8' },
    cargo: { base: '#a2775d', shade: '#5b4f4b', bright: '#ffd19c', trim: '#b3a089', roof: '#7b7571', name: 'ЗАПАДНЫЙ ТЕРМИНАЛ', code: 'ЗТ' },
    dam: { base: '#879fa6', shade: '#4d6c77', bright: '#a1fff0', trim: '#bbcacc', roof: '#718c96', name: 'БЕЛАЯ ПЛОТИНА', code: 'БП' },
    mill: { base: '#8c795f', shade: '#554f4a', bright: '#ffd18e', trim: '#bdac90', roof: '#7b7d7b', name: 'ЛЕСНАЯ ПРОМЗОНА', code: 'ЛП' }
};
function atlasCanvas(w, h) { const img = document.createElement('canvas'); img.width = w; img.height = h; return img; }
function mapOf(img) { const tex = new THREE.CanvasTexture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex; }
function uv(x, y, w, h, img) { return [(x + 1) / img.width, 1 - (y + h - 1) / img.height, (x + w - 1) / img.width, 1 - (y + 1) / img.height]; }
function regionalAtlas(names) {
    const walls = atlasCanvas(2048, 512), c = walls.getContext('2d'), facades = new Map();
    for (const [n, district] of boroughs.entries())
        for (const home of [false, true]) {
            const p = exports.paint[district], dx = n * 256, dy = home ? 256 : 0, w = 256, h = 256, rnd = (0, world_textures_js_1.random)(5791 + n * 19 + dy);
            c.save();
            c.translate(dx, dy);
            c.beginPath();
            c.rect(0, 0, w, h);
            c.clip();
            c.fillStyle = p.base;
            c.fillRect(0, 0, w, h);
            const rect = (x, y, ww, hh, color) => { c.fillStyle = color; c.fillRect(x, y, ww, hh); };
            if (home && (district === 'quarry' || district === 'dock' || district === 'cargo' || district === 'mill')) {
                for (let y = 0; y < h; y += 8) {
                    rect(0, y, w, 1, '#665e5c');
                    for (let x = (y % 16 ? 0 : -9); x < w; x += 18)
                        rect(x, y, 1, 8, '#766a65');
                }
            }
            else if (home) {
                for (let y = 0; y < h; y += 64) {
                    rect(0, y, w, 1.5, p.shade);
                    rect(0, y + 2, w, 1, p.trim);
                }
                for (let x = 0; x < w; x += 64) {
                    rect(x, 0, 1, h, p.shade);
                    rect(x + 2, 0, 1, h, p.trim);
                }
            }
            else {
                for (let x = 0; x < w; x += 9) {
                    rect(x, 0, 2, h, 'rgba(32,49,63,.30)');
                    rect(x + 2, 0, 1, h, 'rgba(219,227,220,.36)');
                }
                rect(0, 4, w, 6, p.trim);
                rect(0, 239, w, 10, p.shade);
            }
            for (let i = 0; i < 330; i++)
                rect(rnd() * w, rnd() * h, 1 + rnd() * 6, 1 + rnd() * 3, rnd() > .5 ? 'rgba(25,44,53,.12)' : 'rgba(235,216,181,.13)');
            const columns = home ? 4 : 3, rows = home ? 3 : 2;
            for (let row = 0; row < rows; row++)
                for (let j = 0; j < columns; j++) {
                    const cw = w / columns, rh = h / rows, left = (j + .12) * cw, top = (row + (home ? .21 : .31)) * rh, ww = cw * (home ? .72 : .78), hh = rh * (home ? .53 : .46);
                    rect(left - 2, top - 2, ww + 4, hh + 5, p.shade);
                    rect(left, top, ww, hh, '#344854');
                    const panes = home ? 2 : 4;
                    for (let k = 0; k < panes; k++) {
                        const x = left + 1 + k * ww / panes, pw = ww / panes - 3, lit = rnd() > (home ? .44 : .60), g = c.createLinearGradient(0, top, 0, top + hh);
                        g.addColorStop(0, lit ? (district === 'radio' && !home ? '#c1d5be' : rnd() > .5 ? '#f3cb87' : '#e3b58a') : '#69818d');
                        g.addColorStop(1, lit ? '#ad8973' : '#3b4e5f');
                        c.fillStyle = g;
                        c.fillRect(x, top + 2, pw, hh - 4);
                        if (lit && home && rnd() > .3)
                            rect(x, top + 2, pw * (.19 + rnd() * .4), hh - 4, 'rgba(89,80,73,.46)');
                        if (!home || rnd() > .4)
                            rect(x, top + hh * .39, pw, 1.3, p.shade);
                    }
                    rect(left - 3, top + hh + 2, ww + 6, 2.6, '#c3c8c5');
                    rect(left - 1, top + hh + 5, ww + 3, 1.5, 'rgba(39,51,59,.5)');
                    if (home && district === 'water' && (row + j) % 3 === 1) {
                        rect(left - 4, top + hh - 9, ww + 7, 11, '#778b8d');
                        rect(left - 5, top + hh - 10, ww + 9, 2, '#d1d8d5');
                    }
                }
            c.restore();
            facades.set(district + (home ? 'flat' : 'works'), uv(dx + 2, dy + 2, 252, 252, walls));
        }
    const columns = 3, tw = 338, th = 68, signHeight = 2 ** Math.ceil(Math.log2(Math.max(128, Math.ceil(names.size / columns) * th + 2)));
    const signs = atlasCanvas(1024, signHeight), s = signs.getContext('2d'), captions = new Map();
    let n = 0;
    for (const [title, id] of names) {
        const p = exports.paint[id], x = n % columns * tw, y = Math.floor(n / columns) * th;
        n++;
        s.fillStyle = '#263d4b';
        s.fillRect(x, y, tw, th);
        s.fillStyle = p.bright;
        s.fillRect(x + 3, y + 4, 4, th - 8);
        s.fillStyle = '#607581';
        s.fillRect(x + 12, y + th - 8, tw - 25, 1);
        s.font = 'bold 31px K77Display, sans-serif';
        s.textBaseline = 'alphabetic';
        s.fillStyle = p.bright;
        s.fillText(title.toUpperCase(), x + 14, y + 37, tw - 28);
        s.font = 'bold 11px K77Body, sans-serif';
        s.fillStyle = '#d1dbd8';
        s.fillText(p.name + '   /   КАНАЛЬСК  2087', x + 16, y + 54, tw - 28);
        captions.set(title, uv(x + 1, y + 1, tw - 2, th - 2, signs));
    }
    return { wallMap: mapOf(walls), signMap: mapOf(signs), facades, captions };
}
