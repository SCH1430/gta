"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lipArea = exports.uvOf = exports.faceHeight = exports.faceTop = exports.faceWidth = void 0;
exports.rgbaTexture = rgbaTexture;
exports.featureMaterial = featureMaterial;
const T = require("../engine/three.module.min.js");
const human_albedo_data_js_1 = require("./human-albedo-data.js");
exports.faceWidth = .212, exports.faceTop = .279, exports.faceHeight = .292;
const uvOf = (x, y) => [.5 - x / exports.faceWidth, (exports.faceTop - y) / exports.faceHeight];
exports.uvOf = uvOf;
const rgba = [], materials = new Map();
const clamp = (n) => Math.min(1, Math.max(0, n));
function decode() {
    if (rgba.length)
        return;
    const colors = atob(human_albedo_data_js_1.palette64), packed = atob(human_albedo_data_js_1.indices64);
    for (let i = 0; i < 4; i++)
        rgba.push(new Uint8Array(human_albedo_data_js_1.albedoWidth * human_albedo_data_js_1.albedoHeight * 4));
    let i = 0, at = 0;
    function put(c) {
        const n = at % (140 * 112), dst = rgba[Math.floor(at / (140 * 112))], p = 4 * ((77 + Math.floor(n / 140)) * human_albedo_data_js_1.albedoWidth + 42 + n % 140);
        dst[p] = colors.charCodeAt(3 * c);
        dst[p + 1] = colors.charCodeAt(3 * c + 1);
        dst[p + 2] = colors.charCodeAt(3 * c + 2);
        dst[p + 3] = 255;
        at++;
    }
    while (i < packed.length) {
        const entry = packed.charCodeAt(i++);
        if (entry < 128) {
            for (let j = 0; j <= entry; j++)
                put(packed.charCodeAt(i++));
        }
        else {
            const c = packed.charCodeAt(i++);
            for (let j = 0; j < entry - 125; j++)
                put(c);
        }
    }
}
function rgbaTexture(data, w, h) {
    const map = new T.DataTexture(data, w, h, T.RGBAFormat);
    map.colorSpace = T.SRGBColorSpace;
    map.magFilter = T.LinearFilter;
    map.generateMipmaps = true;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.needsUpdate = true;
    return map;
}
function surface(data, w, h) {
    return new T.MeshLambertMaterial({ map: rgbaTexture(data, w, h), side: T.FrontSide });
}
exports.lipArea = [.30, .535, .70, .728];
function featureMaterial(id, amount) {
    const key = id + '/' + amount;
    let mat = materials.get(key);
    if (mat)
        return mat;
    decode();
    const [u0, v0, u1, v1] = exports.lipArea, w = Math.ceil((u1 - u0) * human_albedo_data_js_1.albedoWidth), h = Math.ceil((v1 - v0) * human_albedo_data_js_1.albedoHeight);
    const output = new Uint8Array(w * h * 4), source = rgba[id];
    for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
            const u = u0 + (u1 - u0) * i / (w - 1), v = v0 + (v1 - v0) * j / (h - 1);
            const x = (.5 - u) * exports.faceWidth, y = exports.faceTop - v * exports.faceHeight;
            const across = Math.abs(x) / .030, edge = Math.max(0, 1 - across * across);
            const mid = .0972 - .0008 * across + .0007 * Math.cos(2 * Math.PI * across);
            const aperture = .0088 * amount / 5 * edge, upper = mid + aperture * .15, lower = mid - aperture * .85;
            let sy = y, cavity = 0, teeth = 0;
            if (y < upper && y > lower && edge > 0) {
                cavity = clamp((upper - y) / .0009) * clamp((y - lower) / .0009);
                teeth = clamp((upper - y - .0005) / .0009) * clamp((.0030 * amount / 5 - (upper - y)) / .0014) * edge * .7;
                sy = mid;
            }
            else if (y <= lower && aperture > 0)
                sy = y + (mid - lower) * clamp((y - .065) / (lower - .065));
            else if (y >= upper && aperture > 0)
                sy = y - (upper - mid) * clamp((.112 - y) / (.112 - upper));
            const px = clamp(u) * (human_albedo_data_js_1.albedoWidth - 1), py = clamp((exports.faceTop - sy) / exports.faceHeight) * (human_albedo_data_js_1.albedoHeight - 1);
            const ix = Math.min(human_albedo_data_js_1.albedoWidth - 2, px | 0), iy = Math.min(human_albedo_data_js_1.albedoHeight - 2, py | 0), fx = px - ix, fy = py - iy;
            const p = (iy * human_albedo_data_js_1.albedoWidth + ix) * 4, d = (j * w + i) * 4, mouth = [69 + teeth * 111, 39 + teeth * 108, 37 + teeth * 93];
            for (let c = 0; c < 3; c++) {
                const a = source[p + c] * (1 - fx) + source[p + c + 4] * fx, b = source[p + c + human_albedo_data_js_1.albedoWidth * 4] * (1 - fx) + source[p + c + human_albedo_data_js_1.albedoWidth * 4 + 4] * fx;
                output[d + c] = (a * (1 - fy) + b * fy) * (1 - cavity) + mouth[c] * cavity;
            }
            output[d + 3] = 255;
        }
    mat = surface(output, w, h);
    materials.set(key, mat);
    return mat;
}
