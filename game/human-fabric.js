"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clothV = clothV;
exports.wovenMaterial = wovenMaterial;
const T = require("../engine/three.module.min.js");
const width = 256, height = 512, band = 56;
const bands = { outerwear: 0, sleeves: 1, trousers: 2, wool: 3, quilted: 4, leather: 5, boot: 6, waxed: 7, knit: 8 };
function clothV(pattern, y) {
    if (!pattern)
        return .995;
    const v = pattern === 'sleeves' ? (y + .46) / .53 : pattern === 'trousers' ? (y + .81) / .87 :
        pattern === 'leather' ? (y + .34) / .75 : pattern === 'boot' ? y / .20 : pattern === 'knit' ? y * 14 : (y + .25) / .82;
    return (bands[pattern] * band + 2 + Math.min(1, Math.max(0, v)) * (band - 4)) / height;
}
function texture(bytes, colorSpace = T.NoColorSpace) {
    const map = new T.DataTexture(bytes, width, height);
    map.colorSpace = colorSpace;
    map.wrapS = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    return map;
}
function materialGrain(page, x, y, angle) {
    const cross = Math.cos(x * Math.PI / 2) * Math.cos(y * Math.PI / 2);
    const twill = Math.sin((x - 2 * y) * Math.PI / 4);
    switch (page) {
        case bands.trousers: return 3.4 * twill + 1.3 * cross;
        case bands.wool: return 3.9 * Math.sin(x * 1.82 + .7 * Math.sin(y * .92)) * (.65 + .35 * Math.cos(y * 1.71)) + 2 * twill;
        case bands.quilted: return 1.2 * cross + 2.2 * Math.cos(y * .83 + .55 * Math.cos(angle * 2));
        case bands.waxed: return 1.4 * twill + 2.2 * Math.cos(angle * 21 - y * .42) * Math.sin(y * 1.1);
        case bands.knit: return 8.0 * Math.sin(x * Math.PI / 4) + 2.6 * Math.sin(y * Math.PI / 2) * Math.sin(x * Math.PI / 4);
        case bands.leather:
        case bands.boot: return 1.7 * Math.sin(x * .91 + Math.sin(y * .78)) * Math.sin(y * .91 + Math.cos(x * .56));
        default: return 1.6 * cross + 1.1 * twill;
    }
}
let fabric;
function wovenMaterial() {
    if (fabric)
        return fabric;
    const light = new Float32Array(width * height), relief = new Float32Array(width * height);
    const albedo = new Uint8Array(width * height * 4), normals = new Uint8Array(width * height * 4);
    function fold(page, u0, v0, u1, v1, bow, radius, depth) {
        const px = u0 * width, py = v0 * band, dx = (u1 - u0) * width, dy = (v1 - v0) * band, len = Math.hypot(dx, dy);
        const nx = -dy / len, ny = dx / len, spread = radius * 3 + Math.abs(bow);
        for (let y = Math.max(1, Math.floor(Math.min(py, py + dy) - spread)); y < Math.min(band - 1, Math.ceil(Math.max(py, py + dy) + spread)); y++) {
            for (let x = Math.floor(Math.min(px, px + dx) - spread); x < Math.ceil(Math.max(px, px + dx) + spread); x++) {
                const u = ((x - px) * dx + (y - py) * dy) / (len * len);
                if (u <= 0 || u >= 1)
                    continue;
                const fade = Math.sin(Math.PI * u), distance = ((x - px) * nx + (y - py) * ny - bow * fade) / (radius * (.62 + .38 * fade));
                if (Math.abs(distance) > 3.3)
                    continue;
                const ridge = .56 * Math.exp(-((distance - .88) ** 2) / .56), hollow = Math.exp(-((distance + .25) ** 2) / .72);
                light[(bands[page] * band + y) * width + ((x % width + width) % width)] += depth * fade * (ridge - hollow);
            }
        }
    }
    const clothing = [
        [.55, .24, .71, .34, 1.4, 1.8, 34], [.58, .24, .71, .22, -1.2, 1.1, 29], [.66, .35, .73, .44, 1.5, 1.8, 22],
        [.76, .28, .93, .39, -1.9, 1.8, 37], [.79, .28, .90, .30, -1.1, 1.2, 25], [.83, .43, .93, .54, -1.4, 1.6, 19],
        [.59, .48, .65, .66, 1.2, 1.5, 21], [.82, .57, .95, .70, -.9, 1.7, 26], [.52, .54, .60, .73, -1.6, 1.2, 25],
        [.78, .35, .84, .62, 1.3, 2.2, 17], [.61, .72, .69, .85, -1.0, 1.3, 18], [.89, .71, .94, .84, 1.4, 1.3, 25],
        [.02, .35, .18, .44, 1.6, 2.1, 30], [.20, .28, .40, .39, -1.7, 1.4, 28], [.31, .30, .46, .32, -1, 1.6, 24],
        [.06, .51, .18, .72, 2.6, 2.2, 20], [.32, .50, .46, .67, -2, 2.3, 22], [.15, .30, .19, .59, 1.7, 1.1, 18]
    ];
    for (const spec of clothing) {
        fold('outerwear', ...spec);
        const [u0, v0, u1, v1, bow, radius, depth] = spec;
        fold('wool', u0, v0, u1, v1, bow, radius * 1.24, depth * .70);
        fold('quilted', u0, v0, u1, v1, bow, radius * .91, depth * .52);
        fold('waxed', u0, v0, u1, v1, bow * .76, radius * .74, depth * .91);
    }
    for (let i = 0; i < 8; i++) {
        const u = i / 8, t = (i % 3) * .026;
        fold('sleeves', u - .07, .42 + t, u + .09, .49 + t, i % 2 ? 1.4 : -1, 1.5, 30);
        fold('sleeves', u - .02, .38 - t, u + .09, .405 - t, .7, 1.2, 25);
        fold('sleeves', u + .01, .13 + t, u + .10, .21 + t, -1.4, 1.1, 23);
        fold('sleeves', u + .015, .64, u + .12, .775, -1.1, 1.7, 16);
        fold('trousers', u - .07, .405 + t, u + .12, .50 + t, i % 2 ? 1.3 : -1.5, 1.5, 38);
        fold('trousers', u - .035, .43 - t, u + .09, .465 - t, -1.1, 1.0, 28);
        fold('trousers', u - .015, .09 + t, u + .13, .15 + t, 1.2, 1.3, 35);
        fold('trousers', u - .041, .06, u + .07, .087, 1.15, 1.15, 29);
    }
    fold('trousers', .67, .51, .69, .77, 2.9, 1.7, 27);
    fold('trousers', .82, .80, .96, .93, -1.5, 1.1, 24);
    fold('trousers', .22, .21, .245, .39, -1.5, 1.4, 21);
    for (const [u, v] of [[.03, .27], [.43, .56], [.75, .42], [.60, .24], [.21, .62]]) {
        fold('leather', u, v, u + .17, v + .12, 1.4, 1.6, 22);
        fold('boot', u, v, u + .17, v + .10, 1.3, 1.22, 19);
    }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const i = y * width + x, page = Math.floor(y / band), row = y % band, v = row / band, a = x / width * Math.PI * 2;
            const grain = (Math.imul(x + 193, 374761393) ^ Math.imul(y + 37, 668265263)) >>> 0;
            const weave = materialGrain(page, x, row, a);
            const faded = 4.2 * Math.sin(a * 3 + .3) * Math.sin(v * 19) + 3 * Math.sin(a * 11 + 8 * v);
            const pleat = page === bands.quilted ? 8 * Math.sin(v * 49 + .9 * Math.sin(a * 2)) ** 7 : 0;
            const n = page > bands.knit ? 250 : T.MathUtils.clamp(Math.round(241 + light[i] + faded + weave + pleat + ((grain >>> 6) % 7 - 3)), 150, 255);
            const offset = i * 4;
            albedo[offset] = n;
            albedo[offset + 1] = n;
            albedo[offset + 2] = n;
            albedo[offset + 3] = 255;
            if (page <= bands.knit)
                relief[i] = light[i] * .60 + weave * .85 + pleat * .55;
        }
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const i = y * width + x, row = y % band;
            const x1 = y * width + (x + 1) % width, x0 = y * width + (x + width - 1) % width;
            const y1 = row === band - 1 || y === height - 1 ? i : i + width, y0 = row === 0 ? i : i - width;
            const nx = (relief[x0] - relief[x1]) * .047, ny = (relief[y0] - relief[y1]) * .047;
            const length = Math.hypot(nx, ny, 1);
            const offset = i * 4;
            normals[offset] = Math.round(128 + 127 * nx / length);
            normals[offset + 1] = Math.round(128 + 127 * ny / length);
            normals[offset + 2] = Math.round(128 + 127 / length);
            normals[offset + 3] = 255;
        }
    fabric = new T.MeshPhongMaterial({
        vertexColors: true, side: T.DoubleSide, map: texture(albedo, T.SRGBColorSpace), normalMap: texture(normals),
        normalScale: new T.Vector2(.55, .55), specular: 0x232323, shininess: 13
    });
    return fabric;
}
