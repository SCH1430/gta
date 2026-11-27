"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaving = addPaving;
const THREE = require("../engine/three.module.min.js");
const canalWalk = require("./canal-walk.js");
const world_layout_js_1 = require("./world-layout.js");
const world_textures_js_1 = require("./world-textures.js");
function stripTexture(strip) {
    const image = document.createElement('canvas');
    image.width = 1024;
    image.height = strip.surface === 'metal' ? 192 : 96;
    const c = image.getContext('2d'), w = image.width, h = image.height, rnd = (0, world_textures_js_1.random)(strip.surface === 'metal' ? 357 : 391);
    const metal = strip.surface === 'metal';
    c.fillStyle = metal ? '#283640' : '#858c8e';
    c.fillRect(0, 0, w, h);
    if (metal) {
        for (let y = 0; y < h; y += 19) {
            c.fillStyle = '#51626a';
            c.fillRect(0, y, w, 3);
            c.fillStyle = '#788889';
            c.fillRect(0, y, w, 1);
        }
        for (let x = 0; x < w; x += 7) {
            c.fillStyle = '#50636e';
            c.fillRect(x, 0, 3, h);
            c.fillStyle = '#a8b6b1';
            c.fillRect(x, 0, 1, h);
        }
        for (let x = 0; x < w; x += 128) {
            c.fillStyle = '#34424c';
            c.fillRect(x, 0, 6, h);
            c.fillStyle = '#84918f';
            c.fillRect(x + 7, 0, 3, h);
        }
        for (const y of [2, h - 8]) {
            c.fillStyle = '#82908c';
            c.fillRect(0, y, w, 5);
            for (let x = 7; x < w; x += 31) {
                c.fillStyle = '#47565d';
                c.fillRect(x, y + 1, 3, 2);
            }
        }
    }
    else {
        for (let x = 0; x < w; x += 65) {
            c.fillStyle = '#46525b';
            c.fillRect(x, 0, 2, h);
            c.fillStyle = '#a5a7a1';
            c.fillRect(x + 2, 0, 2, h);
        }
        for (let i = 0; i < 2600; i++) {
            c.fillStyle = rnd() > .48 ? 'rgba(211,217,209,.29)' : 'rgba(40,51,61,.25)';
            c.fillRect(rnd() * w, rnd() * h, rnd() * 3 + 1, rnd() + .5);
        }
        c.fillStyle = 'rgba(59,72,82,.65)';
        c.fillRect(0, 0, w, 6);
        c.fillStyle = '#afb2a6';
        c.fillRect(0, 6, w, 3);
        for (let i = 0; i < 8; i++) {
            c.fillStyle = i % 2 ? '#756957' : '#c3ac77';
            c.fillRect(4 + i * 17, 10, 15, 6);
            c.fillRect(w - 142 + i * 17, 10, 15, 6);
        }
        if (strip.garage) {
            const x0 = strip.x[0][0], z0 = strip.z[0][0];
            c.scale(w / (strip.x[strip.x.length - 1][0] - x0), h / (strip.z[strip.z.length - 1][0] - z0));
            c.translate(-x0, -z0);
            canalWalk.paintExitTracks(c);
        }
    }
    return (0, world_textures_js_1.texture)(image);
}
function curbTexture() {
    const image = document.createElement('canvas');
    image.width = 256;
    image.height = 128;
    const c = image.getContext('2d'), rnd = (0, world_textures_js_1.random)(221);
    c.fillStyle = '#899398';
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = '#616c74';
    c.fillRect(0, 118, 256, 10);
    c.fillStyle = '#b6c0c3';
    c.fillRect(0, 114, 256, 5);
    c.fillStyle = '#a1a9aa';
    c.fillRect(0, 109, 256, 5);
    c.fillStyle = 'rgba(38,50,60,.34)';
    for (let x = 0; x < 256; x += 64)
        c.fillRect(x, 0, 1, 128);
    for (const y of [16, 58, 108])
        c.fillRect(0, y, 256, 1);
    for (let i = 0; i < 1700; i++) {
        c.fillStyle = rnd() < .55 ? 'rgba(213,219,213,.26)' : 'rgba(42,51,58,.22)';
        c.fillRect(rnd() * 256, rnd() * 128, .6 + rnd() * 1.8, 1);
    }
    const map = (0, world_textures_js_1.texture)(image);
    map.wrapS = THREE.RepeatWrapping;
    return map;
}
function roadsideSnowTexture() {
    const image = document.createElement('canvas');
    image.width = 128; image.height = 64;
    const c = image.getContext('2d'), pixels = c.createImageData(image.width, image.height);
    const rnd = (0, world_textures_js_1.random)(17943);
    const tones = [[79,85,87], [104,104,98], [150,150,140], [194,201,199], [192,207,212], [151,169,177]];
    const noise = Array.from({length:13}, () => Array.from({length:16}, () => rnd()-.5));
    function grain(x,y) {
        const i = Math.floor(x), j = Math.floor(y), tx = x-i, ty = y-j;
        const a = noise[j][i%16] * (1-tx) + noise[j][(i+1)%16] * tx;
        const b = noise[j+1][i%16] * (1-tx) + noise[j+1][(i+1)%16] * tx;
        return a * (1-ty) + b * ty;
    }
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        const u = x/image.width, v = y/(image.height-1);
        const coarse = grain(u*16, v*9), grit = rnd()-.5;
        // Break the wet/dry boundary into dirty lumps with small pockets of clean crust.
        const lean = .085 * Math.sin(u*6*Math.PI + 3*v) + .036 * Math.sin(u*16*Math.PI - 4*v);
        const t = Math.max(0,Math.min(4.999,5*(v + lean + coarse*.31 + grit*.075)));
        const k = Math.floor(t), f = t-k, light = 12*grit + 18*coarse + (grit > .46 ? 15 : 0);
        const offset = 4*(y*image.width+x);
        for (let i=0; i<3; i++) pixels.data[offset+i] = tones[k][i]*(1-f) + tones[k+1][i]*f + light;
        pixels.data[offset+3] = 255;
    }
    c.putImageData(pixels, 0, 0);
    const map = (0, world_textures_js_1.texture)(image);
    map.wrapS = THREE.RepeatWrapping;
    return map;
}
function addRoadsideSnow(scene) {
    const positions = [], colors = [], uv = [], indices = [];
    const rnd = (0, world_textures_js_1.random)(62412);
    function ridge(strip, alongX, side, start, length) {
        const sections = Math.max(3, Math.ceil(length / 1.38));
        const crest = .060 + .086 * rnd(), spread = .67 + .43 * rnd(), phase = 6.28 * rnd();
        const first = positions.length / 3;
        for (let s = 0; s <= sections; s++) {
            const t = s / sections, at = start + t * length;
            const taper = Math.min(1, .09 + 3.9 * Math.min(t, 1-t));
            const width = spread * taper * (.81 + .15 * Math.sin(t * 8 + phase) + .17 * rnd());
            const height = crest * taper * (.80 + .28 * Math.sin(t * 11 + phase) + .22 * rnd());
            const curb = strip.curb.edge + (strip.bay ? canalWalk.bayOffset(at) : 0);
            const cuts = [-.58 - rnd() * .20, -.31, -.095, .065, .21, .38 + .12 * rnd()];
            const lift = [.006, .10 * height, .53 * height, height, .74 * height, .006];
            const grime = .04 + rnd() * .17;
            for (let k = 0; k < cuts.length; k++) {
                const across = curb + side * cuts[k] * width;
                const x = alongX ? at : across, z = alongX ? across : at;
                positions.push(x, (0, world_layout_js_1.groundHeight)(x, z) + .013 + lift[k], z);
                const shade = .98 - grime*.48 + .07*rnd();
                colors.push(shade, shade, shade);
                uv.push(at/3.85 + phase, 1 - k/(cuts.length-1));
                if (!s || !k) continue;
                const d = first + s * cuts.length + k, b = d - cuts.length, a = b - 1, c = d - 1;
                if (alongX === (side > 0)) indices.push(a, b, c, c, b, d);
                else indices.push(a, c, b, c, d, b);
            }
        }
    }
    for (const strip of world_layout_js_1.pavedStrips) {
        if (!strip.curb || strip.height < .12) continue;
        const alongX = strip.curb.axis === 'x', run = alongX ? strip.x : strip.z, cross = alongX ? strip.z : strip.x;
        const side = Math.sign((cross[0][0] + cross[cross.length-1][0]) * .5 - strip.curb.edge);
        let begin;
        for (let i = 1; i < run.length; i++) {
            // Leave the sloped ends, dropped kerbs and crossing approaches shovel-clear.
            const full = run[i-1][1] > .99 && run[i][1] > .99;
            if (full && begin === undefined) begin = run[i-1][0];
            if (begin === undefined || full && i + 1 < run.length) continue;
            const end = run[full ? i : i-1][0] - .38;
            for (let at = begin + .38; at + 1.75 < end;) {
                const length = Math.min(3.5 + 5.3 * rnd(), end - at);
                ridge(strip, alongX, side, at, length);
                at += length + .65 + 3.1 * rnd();
            }
            begin = undefined;
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const snow = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({map:roadsideSnowTexture(), vertexColors:true}));
    snow.name = 'Снег вдоль расчищенных бордюров';
    snow.userData.groundSurface = true;
    scene.add(snow);
}
function addPaving(scene) {
    addRoadsideSnow(scene);
    const curb = new THREE.MeshBasicMaterial({ map: curbTexture() });
    const batches = new Map();
    for (const strip of world_layout_js_1.pavedStrips) {
        const key = strip.curb ? strip.curb.axis + Math.sign(strip.curb.edge) : strip.surface;
        if (!batches.has(key)) batches.set(key, { positions: [], uv: [], indices: [], strip });
        const { positions, uv, indices } = batches.get(key), first = positions.length / 3;
        const x0 = strip.x[0][0], z0 = strip.z[0][0], width = strip.x[strip.x.length - 1][0] - x0, depth = strip.z[strip.z.length - 1][0] - z0;
        for (const [z, zh] of strip.z)
            for (const [x, xh] of strip.x) {
                positions.push(x, strip.height * xh * zh, z + (strip.bay ? canalWalk.bayOffset(x) : 0));
                if (strip.curb) {
                    const along = strip.curb.axis === 'x' ? x : z, across = strip.curb.axis === 'x' ? z : x;
                    uv.push(along / 5.2, Math.abs(across - strip.curb.edge) / strip.curb.width);
                }
                else
                    uv.push((x - x0) / width, 1 - (z - z0) / depth);
            }
        const columns = strip.x.length;
        for (let j = 0; j < strip.z.length - 1; j++)
            for (let i = 0; i < columns - 1; i++) {
                const a = first + j * columns + i, b = a + 1, c = a + columns, d = c + 1;
                indices.push(a, c, b, b, c, d);
            }
    }
    for (const { positions, uv, indices, strip } of batches.values()) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(indices);
        const mesh = new THREE.Mesh(geo, strip.curb ? curb : new THREE.MeshBasicMaterial({ map: stripTexture(strip) }));
        mesh.name = strip.curb ? 'Тротуар и понижения' : strip.surface === 'metal' ? 'Настил рынка' : 'Пониженный бордюр у гаража';
        scene.add(mesh);
    }
}
