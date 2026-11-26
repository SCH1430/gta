"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eyeCenters = exports.skinTint = void 0;
exports.complexion = complexion;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_profile_data_js_1 = require("./human-profile-data.js");
const skin = new Map();
const maps = new Map();
let sheet;
function studySheet() {
    if (sheet)
        return sheet;
    const packed = atob(human_profile_data_js_1.photos64), p = atob(human_profile_data_js_1.colors64);
    sheet = new Uint8Array(human_profile_data_js_1.portraitWidth * (human_profile_data_js_1.portraitHeight * 4 + human_profile_data_js_1.neckHeight * 4) * 4);
    let at = 0, i = 0;
    function pixel(color) {
        const k = color * 3;
        sheet[at++] = p.charCodeAt(k);
        sheet[at++] = p.charCodeAt(k + 1);
        sheet[at++] = p.charCodeAt(k + 2);
        sheet[at++] = 255;
    }
    while (i < packed.length) {
        const token = packed.charCodeAt(i++);
        if (token < 128) {
            for (let j = 0; j <= token; j++)
                pixel(packed.charCodeAt(i++));
        }
        else {
            const color = packed.charCodeAt(i++);
            for (let j = 0; j < token - 125; j++)
                pixel(color);
        }
    }
    return sheet;
}
const tones = ['#eed4ba', '#f5d9bb', '#edeeeb', '#e6baa0', '#e7c7a6', '#f8e6d4', '#d9b294',
    '#f8e5d8', '#edd4b8', '#d6a88d', '#e7ddcf', '#eee1dd', '#e1be9b', '#f5dbc2', '#deccbe', '#f2dfce'].map(c => new T.Color(c));
const neutral = new T.Color(0xffffff);
const skinTint = (variant) => variant ? tones[(variant - 1) % tones.length] : neutral;
exports.skinTint = skinTint;
exports.eyeCenters = [[[255, 137], [382, 137]], [[254, 135], [385, 135]], [[256, 136], [382, 136]], [[251, 136], [387, 136]]];
function paintSkin(source, w, h, id, clearEyes) {
    const out = source.slice();
    if (clearEyes) {
        for (const [cx, cy] of exports.eyeCenters[id])
            for (let x = cx - 45; x <= cx + 45; x++) {
                const span = Math.sqrt(Math.max(0, 1 - ((x - cx) / 45) ** 2));
                const top = cy - 2 - 6 * span, bottom = cy + 2 + 8 * span;
                const crease = (Math.floor(top) - 2) * w * 4 + x * 4;
                const cheek = (Math.ceil(bottom) + 2) * w * 4 + x * 4;
                for (let y = Math.ceil(top); y < bottom; y++) {
                    const mix = T.MathUtils.smoothstep(Math.min(y - top, bottom - y), 0, 4);
                    const across = T.MathUtils.smoothstep((y - top) / (bottom - top), 0, .85);
                    const pos = (y * w + x) * 4;
                    for (let c = 0; c < 3; c++) {
                        const under = (2 * source[cheek + c] + source[cheek + c - 16] + source[cheek + c + 16]) * .25;
                        const over = (2 * source[crease + c] + source[crease + c - 16] + source[crease + c + 16]) * .25;
                        const shade = T.MathUtils.lerp(Math.max(under * .80, over), under, across);
                        out[pos + c] = T.MathUtils.lerp(source[pos + c], shade, mix);
                    }
                }
            }
    }
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const p = (y * w + x) * 4;
            const hash = Math.imul(x + 31, 1640531513) ^ Math.imul(y + id * 137 + 9, 1597334677);
            const pore = ((hash >>> 4 ^ (hash >>> 19)) & 7) - 3.5;
            const scale = T.MathUtils.clamp((out[p] - 54) / 94, 0, 1);
            const value = pore * scale * .53;
            out[p] = T.MathUtils.clamp(out[p] + value, 0, 255);
            out[p + 1] = T.MathUtils.clamp(out[p + 1] + value * .82, 0, 255);
            out[p + 2] = T.MathUtils.clamp(out[p + 2] + value * .91, 0, 255);
        }
    return out;
}
function complexion(id, neck = false, variant, clearEyes = false) {
    const mapKey = [neck ? 'neck' : clearEyes ? 'orbital-head' : 'head', id].join('/');
    const key = [mapKey, variant ?? 0].join('/');
    let material = skin.get(key);
    if (material)
        return material;
    let map = maps.get(mapKey);
    if (!map) {
        const data = studySheet(), w = neck ? human_profile_data_js_1.neckWidth : human_profile_data_js_1.portraitWidth, h = neck ? human_profile_data_js_1.neckHeight : human_profile_data_js_1.portraitHeight;
        const y = neck ? human_profile_data_js_1.portraitHeight * 4 + id * human_profile_data_js_1.neckHeight : id * human_profile_data_js_1.portraitHeight;
        const out = neck ? new Uint8Array(w * h * 4) : data.subarray(y * w * 4, (y + h) * w * 4);
        if (neck)
            for (let j = 0; j < h; j++)
                out.set(data.subarray((y + j) * human_profile_data_js_1.portraitWidth * 4, ((y + j) * human_profile_data_js_1.portraitWidth + w) * 4), j * w * 4);
        map = (0, human_albedo_js_1.rgbaTexture)(paintSkin(out, w, h, id, clearEyes && !neck), w, h);
        map.wrapS = T.RepeatWrapping;
        maps.set(mapKey, map);
    }
    material = new T.MeshLambertMaterial({ map, color: (0, exports.skinTint)(variant ?? 0) });
    skin.set(key, material);
    return material;
}
