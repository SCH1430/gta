"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCityGround = addCityGround;
exports.coreGroundGeometry = coreGroundGeometry;
exports.bridgeDeck = bridgeDeck;
const THREE = require("../engine/three.module.min.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const world_textures_js_1 = require("./world-textures.js");
const region_roadview_js_1 = require("./region-roadview.js");
const region_layout_js_1 = require("./region-layout.js");
const puddles_js_1 = require("./puddles.js");
const graphics_pavement_js_1 = require("./graphics-pavement.js");
const { minX: x0, maxX: x1, minZ: z0, maxZ: z1 } = region_roadview_js_1.oldAtlas;
function cityGroundAtlas() {
    const image = document.createElement('canvas');
    image.width = 2048;
    image.height = 1728;
    const c = image.getContext('2d'), rnd = (0, world_textures_js_1.random)(12877);
    c.scale(image.width / (x1 - x0), image.height / (z1 - z0));
    c.translate(-x0, -z0);
    const fill = (x, z, w, d, ink) => { c.fillStyle = ink; c.fillRect(x, z, w, d); };
    function stroke(ax, az, bx, bz, width, ink, dash = []) {
        c.strokeStyle = ink;
        c.lineWidth = width;
        c.setLineDash(dash);
        c.beginPath();
        c.moveTo(ax, az);
        c.lineTo(bx, bz);
        c.stroke();
        c.setLineDash([]);
    }
    fill(x0, z0, x1 - x0, z1 - z0, '#adbbc7');
    (0, graphics_pavement_js_1.paintWindCrust)(c, x0, z0, x1-x0, z1-z0, (0, world_textures_js_1.random)(724), 270);
    for (let n = 0; n < 13500; n++) {
        const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
        fill(x, z, .3 + rnd() * 2.1, .12 + rnd() * .53, n % 3 ? 'rgba(209,221,229,.15)' : 'rgba(52,67,89,.16)');
    }
    const edgeLots = region_layout_js_1.regionBuildings.filter(b => b.x + b.w / 2 >= x0 - 4 && b.x - b.w / 2 <= x1 + 4 && b.z + b.d / 2 >= z0 - 4 && b.z - b.d / 2 <= z1 + 4);
    for (const [lots, lotRand] of [[world_expansion_layout_js_1.expansionBuildings, rnd], [edgeLots, (0, world_textures_js_1.random)(207734)]])
        for (const b of lots) {
            const l = b.x - b.w / 2 - 3.6, t = b.z - b.d / 2 - 3.6;
            fill(l, t, b.w + 7.2, b.d + 7.2, '#747e89');
            for (let n = 0; n < b.w * b.d * .32; n++) {
                fill(l + lotRand() * (b.w + 7.2), t + lotRand() * (b.d + 7.2), .13 + lotRand() * .62, .1 + lotRand() * .42, n % 2 ? '#7c8892' : '#626f7d');
            }
            (0, graphics_pavement_js_1.paintDrift)(c, b.x + b.w / 2 + .49, b.z + b.d / 2 - .24, 2.7, .95, -.24, lotRand);
            const grad = c.createRadialGradient(b.x, b.z, Math.min(b.w, b.d) * .34, b.x, b.z, Math.max(b.w, b.d) * .73 + 4);
            grad.addColorStop(0, 'rgba(24,33,47,.36)');
            grad.addColorStop(1, 'rgba(35,43,58,0)');
            c.fillStyle = grad;
            c.fillRect(b.x - b.w - 4, b.z - b.d - 4, b.w * 2 + 8, b.d * 2 + 8);
        }
    const ice = c.createLinearGradient(0, world_expansion_layout_js_1.canal.north, 0, world_expansion_layout_js_1.canal.south);
    ice.addColorStop(0, '#687a8b');
    ice.addColorStop(.13, '#516a7c');
    ice.addColorStop(.48, '#6e8d9d');
    ice.addColorStop(.92, '#4e6878');
    ice.addColorStop(1, '#748797');
    c.fillStyle = ice;
    c.fillRect(x0, world_expansion_layout_js_1.canal.north, x1 - x0, world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
    c.save();
    c.beginPath();
    c.rect(x0, world_expansion_layout_js_1.canal.north, x1 - x0, world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
    c.clip();
    for (let k = 0; k < 530; k++) {
        let x = x0 + rnd() * (x1 - x0), z = world_expansion_layout_js_1.canal.north + rnd() * (world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
        for (let a = 0; a < 4; a++) {
            const nx = x + 1.2 + rnd() * 2.3, nz = z + (rnd() - .5) * 2.3;
            stroke(x, z, nx, nz, .045 + rnd() * .055, a % 3 ? '#9ab4c2' : '#506c82');
            x = nx;
            z = nz;
        }
    }
    for (let i = 0; i < 1000; i++)
        fill(x0 + rnd() * (x1 - x0), world_expansion_layout_js_1.canal.north + rnd() * 25, .12 + rnd() * 1.8, .07 + rnd() * .34, 'rgba(227,235,238,.24)');
    c.restore();
    for (const [extra, col] of [[3.6, '#a9b3bd'], [2.8, '#838c96'], [0, '#36414e']]) {
        for (const r of world_expansion_layout_js_1.expansionRoads) {
            const w = r.width + extra;
            fill(r.x1 - w / 2, r.z1 - w / 2, r.x2 - r.x1 + w, r.z2 - r.z1 + w, col);
        }
    }
    for (const r of world_expansion_layout_js_1.expansionRoads) {
        const horiz = r.z1 === r.z2, a = horiz ? r.x1 : r.z1, b = horiz ? r.x2 : r.z2, axis = horiz ? r.z1 : r.x1;
        const at = (u, v) => horiz ? [u, axis + v] : [axis + v, u];
        (0, graphics_pavement_js_1.paintPlough)(c, r.x1, r.z1, b - a, r.width, !horiz, rnd);
        const intersections = world_expansion_layout_js_1.expansionRoads.filter(other => other !== r && (other.z1 === other.z2) !== horiz &&
            (horiz ? other.z1 <= axis && other.z2 >= axis : other.x1 <= axis && other.x2 >= axis)).map(other => horiz ? other.x1 : other.z1);
        for (let u = a + 1; u < b; u += 5.7) {
            if (intersections.some(v => Math.abs(v - u) < 8))
                continue;
            const [x, z] = at(u, 0), [xx, zz] = at(Math.min(b, u + 2.65), 0);
            stroke(x, z, xx, zz, .205, '#c0c1b2');
            for (const side of [-1, 1]) {
                const edge = side * (r.width * .5 - .57);
                const [edgeX, edgeZ] = at(u, edge), [endX, endZ] = at(Math.min(b, u + 4.05), edge);
                stroke(edgeX, edgeZ, endX, endZ, .14, '#aeb7b8');
            }
        }
        for (let u = a; u < b; u += .9) {
            const s = rnd() > .5 ? 1 : -1;
            const [x, z] = at(u, s * (r.width * .5 + rnd() * 1.28));
            if (!intersections.some(v => Math.abs(v - u) < 7))
                fill(x, z, .15 + rnd() * .76, .10 + rnd() * .43, 'rgba(227,231,235,.67)');
            for (let k = 0; k < 3; k++) {
                const [tx, tz] = at(u + rnd(), (rnd() - .5) * (r.width - .7));
                fill(tx, tz, .09 + rnd() * .68, .05 + rnd() * .17, k % 2 ? 'rgba(142,161,181,.16)' : 'rgba(20,29,40,.20)');
            }
        }
        for (let u = a + 7; u < b; u += 22) {
            if (intersections.some(v => Math.abs(v - u) < 8))
                continue;
            const [x, z] = at(u, r.width * .5 - 1);
            c.beginPath();
            c.ellipse(x, z, .45, .47, .15, 0, Math.PI * 2);
            c.fillStyle = '#252e37';
            c.fill();
            for (let j = -2; j <= 2; j++)
                stroke(x - .27, z + j * .11, x + .26, z + j * .11, .04, '#75818a');
        }
    }
    for (const { x, z } of world_expansion_layout_js_1.expansionSignals)
        for (let j = -4; j <= 4; j++) {
            fill(x - 10, z + j * 1.04, 3, .53, '#bac3be');
            fill(x + j * 1.04, z + 8.8, .53, 3, '#bac3be');
        }
    for (const x of [117.2, 120.6]) {
        fill(x - 1.45, -37, 2.9, 61, '#626b75');
        for (let z = -37; z < 23; z += 1.65)
            fill(x - 1.31, z, 2.62, .24, '#494e55');
        for (const dx of [-.77, .77])
            stroke(x + dx, -37, x + dx, 24, .12, '#adb7ba');
    }
    for (const [x, z, rx, rz, angle, tint] of puddles_js_1.outerPuddles) {
        (0, graphics_pavement_js_1.paintMeltwater)(c, x, z, rx, rz, angle, tint, Math.abs(Math.round(881 + x * 14 + z * 3)));
    }
    return (0, world_textures_js_1.texture)(image);
}
function addCityGround(parent) {
    const yRows = [z0, -74, 59, world_expansion_layout_js_1.canal.north, world_expansion_layout_js_1.canal.north + 4, world_expansion_layout_js_1.canal.south - 4, world_expansion_layout_js_1.canal.south, z1], cols = [x0, -83, 83, x1];
    const points = [], uv = [], idx = [];
    for (let j = 0; j < yRows.length; j++) {
        const z = yRows[j];
        for (const x of cols) {
            points.push(x, (0, world_expansion_layout_js_1.shoreHeight)(z) - .038, z);
            uv.push((x - x0) / (x1 - x0), 1 - (z - z0) / (z1 - z0));
        }
        if (j > 0)
            for (let k = 0; k < 3; k++) {
                if (k === 1 && j === 2)
                    continue;
                const a = (j - 1) * cols.length + k;
                idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5);
            }
    }
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const ground = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: cityGroundAtlas(), color: '#c9d2de' }));
    ground.name = 'Промышленный район — покрытие и лёд';
    parent.add(ground);
    (0, region_roadview_js_1.addRegionalGround)(parent);
}
function coreGroundGeometry() {
    const w = 166, h = 133, zCentre = -7.5, g = new THREE.PlaneGeometry(w, h);
    const pos = g.getAttribute('position'), uv = g.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        uv.setXY(i, (x + 100) / 200, (100 + y - zCentre) / 200);
        pos.setY(i, y - zCentre);
    }
    return g;
}
function bridgeDeck(parent, x) {
    if (region_layout_js_1.regionBridges.some(b => b.x === x))
        return (0, region_roadview_js_1.addRegionalBridgeDeck)(parent, x);
    const points = [], colors = [], idx = [];
    function strip(left, right, a, b, color, lift = .007) {
        const rows = [a, ...[63, 84].filter(z => z > a && z < b), b];
        const col = new THREE.Color(color);
        const start = points.length / 3;
        for (const z of rows) {
            for (const dx of [left, right]) {
                points.push(x + dx, (0, world_expansion_layout_js_1.bridgeHeight)(x, z) + lift, z);
                colors.push(col.r, col.g, col.b);
            }
        }
        for (let i = start; i < start + 2 * (rows.length - 1); i += 2)
            idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
    const lanes = [[-7.15, -5.37, '#84929d'], [-5.37, -5.22, '#bfc4ba'], [-5.22, 5.22, '#414d59'], [5.22, 5.37, '#bfc4ba'], [5.37, 7.15, '#84929d']];
    for (const [left, right, color] of lanes)
        strip(left, right, 54, 93, color);
    for (const [a, b] of [[54.8, 57.05], [62, 64.4], [68.4, 70.9], [74.4, 76.9], [80.6, 83.1], [87.6, 90.1]])
        strip(-.113, .113, a, b, '#d7ceae', .014);
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const deck = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true }));
    deck.name = 'Профиль и разметка мостового пролёта';
    deck.userData.groundSurface = true;
    parent.add(deck);
}
