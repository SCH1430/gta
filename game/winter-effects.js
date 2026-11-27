"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entranceLight = entranceLight;
exports.streetEntranceLights = streetEntranceLights;
exports.streetWeather = streetWeather;
const THREE = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const house_layout_js_1 = require("./house-layout.js");
const winter_light_js_1 = require("./winter-light.js");
const blackout_js_1 = require("./blackout.js");
function entranceLight(parent) {
    const image = document.createElement('canvas');
    image.width = 96;
    image.height = 128;
    const c = image.getContext('2d'), pixels = c.createImageData(96, 128);
    let noise = 2087;
    for (let j = 0; j < 128; j++)
        for (let i = 0; i < 96; i++) {
            const t = (j + .5) / 128, x = 2 * (i + .5) / 96 - 1;
            noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
            const penumbra = .035 + .14 * t, edge = (.29 + .68 * t - Math.abs(x + .19 * t)) / penumbra;
            const alpha = Math.max(0, Math.min(1, edge)) * (1 - t * t) * (.76 + noise / 4294967296 * .24);
            const k = (j * 96 + i) * 4;
            pixels.data.set([255, 195 - 22 * t, 119 - 28 * t, Math.round(180 * alpha)], k);
        }
    c.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const g = new THREE.PlaneGeometry(3.92, 4.86).rotateX(-Math.PI / 2).translate(0, 0, 2.43);
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(house_layout_js_1.houseEntry.x, .045, house_layout_js_1.houseEntry.z - .24);
    mesh.name = 'Тёплый свет из тамбура';
    mesh.visible = false;
    mesh.renderOrder = 2;
    mesh.userData.dynamicScenery = true;
    parent.add(mesh);
    return (open) => { mesh.visible = open > .009; mesh.scale.set(.21 + .79 * open, 1, .52 + .48 * open); mesh.rotation.y = -.21 * (1 - open); mat.opacity = .88 * open; };
}
const vents = [[-43.2, 27, 1], [-5.9, 27.5, .63], [46, -31, .87], [-50, -8, .72], [-27.5, -84, 1.65], [99, 24, .86], [-127, 23, .82]];
function streetEntranceLights(parent, entries) {
    const image = document.createElement('canvas');
    image.width = image.height = 64;
    const c = image.getContext('2d'), glow = c.createRadialGradient(32, 37, 2, 32, 37, 31);
    glow.addColorStop(0, 'rgba(255,199,128,.77)');
    glow.addColorStop(.42, 'rgba(255,183,105,.48)');
    glow.addColorStop(1, 'rgba(255,177,89,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, 64, 64);
    const map = new THREE.CanvasTexture(image);
    map.colorSpace = THREE.SRGBColorSpace;
    const pool = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const bulb = new THREE.MeshBasicMaterial({ color: '#ffcc8f', transparent: true, depthWrite: false });
    const bulbShape = new THREE.BoxGeometry(.67, .025, .13);
    const group = new THREE.Group();
    group.name = 'Свет подъездов';
    group.userData.dynamicScenery = true;
    group.visible = false;
    parent.add(group);
    const lights = entries.map(entry => {
        const node = new THREE.Group(), positions = [], uv = [], indices = [];
        const reach = 3.24 + entry.depth * .4, half = 1.68;
        const rows = [.022];
        for (let i = 0; i < entry.steps; i++)
            rows.push(entry.landing + i * entry.tread);
        rows.push(reach);
        for (let i = 1; i < rows.length; i++) {
            const start = rows[i - 1], end = rows[i];
            const level = (0, world_layout_js_1.groundHeight)(entry.x, entry.front + (start + end) * .5) + .007;
            const width = entry.steps && end <= entry.depth + .0001 ? entry.width * .5 : half;
            const n = positions.length / 3;
            for (const offset of [start, end])
                for (const side of [-1, 1]) {
                    positions.push(side * width, level, offset);
                    uv.push(.5 + (side * width - entry.lampX) / (2 * half), 1 - offset / reach);
                }
            indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
        }
        if (entry.lampX) {
            const n = positions.length / 3, face = entry.steps ? .386 : .177;
            const bottom = entry.steps * entry.rise + .50, top = entry.lampY;
            positions.push(.76, bottom, face, 1.59, bottom, face, .76, top, face, 1.59, top, face);
            uv.push(.57, .01, .97, .01, .57, .58, .97, .58);
            indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        const floor = new THREE.Mesh(geometry, pool), lamp = new THREE.Mesh(bulbShape, bulb);
        floor.renderOrder = 1;
        lamp.position.set(entry.lampX, entry.lampY, .45);
        node.position.set(entry.x, 0, entry.front);
        node.add(floor, lamp);
        group.add(node);
        return node;
    });
    return (daylight, power) => {
        const amount = THREE.MathUtils.smoothstep(1 - daylight, .15, .82);
        group.visible = amount > .01;
        if (!group.visible)
            return;
        pool.opacity = amount * .68;
        bulb.opacity = amount;
        for (const node of lights)
            node.visible = !(0, blackout_js_1.blackoutFixture)(power, node.position.x, node.position.z);
    };
}
function vapourTexture() {
    const image = document.createElement('canvas');
    image.width = image.height = 48;
    const c = image.getContext('2d');
    for (let k = 0; k < 6; k++) {
        const x = 24 + Math.sin(k * 6.12 + 2) * 7, y = 23 + Math.cos(k * 3.61) * 7;
        const g = c.createRadialGradient(x, y, 1, x, y, 16);
        g.addColorStop(0, 'rgba(253,251,247,.42)');
        g.addColorStop(.47, 'rgba(245,245,246,.20)');
        g.addColorStop(1, 'rgba(238,239,245,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 48, 48);
    }
    return new THREE.CanvasTexture(image);
}
function streetWeather(scene) {
    const { snowRoofAt } = require("./camera-volume.js");
    const vaporMat = new THREE.MeshBasicMaterial({ map: vapourTexture(), transparent: true, depthWrite: false, opacity: .51, forceSinglePass: true });
    const vapor = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), vaporMat, vents.length * 7);
    vapor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    vapor.frustumCulled = false;
    vapor.count = 0;
    vapor.renderOrder = 3;
    scene.add(vapor);
    const litPositions = new Float32Array(50 * 3), litGeo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(litPositions, 3).setUsage(THREE.DynamicDrawUsage);
    litGeo.setAttribute('position', pos);
    const snow = new THREE.Points(litGeo, new THREE.PointsMaterial({ size: .085, map:require("./airborne-snow.js").softFlake(), color: 0xfff4c9, transparent: true, opacity: .80, depthWrite: false, blending: THREE.AdditiveBlending }));
    snow.frustumCulled = false;
    snow.renderOrder = 4;
    scene.add(snow);
    const pose = new THREE.Object3D(), color = new THREE.Color(), cold = new THREE.Color('#9aa8b7'), warm = new THREE.Color('#ffe9be');
    const beams = [];
    let time = 0;
    return (dt, cars, cam, tier, weather) => {
        time += dt;
        const limits = (0, winter_light_js_1.winterBudget)(tier);
        const litLimit = Math.ceil(limits.lit * Math.max(weather?.snow ?? 1, (weather?.rain ?? 0) * .64));
        const gustX = weather?.gustX ?? .15, gustZ = weather?.gustZ ?? .05;
        beams.length = 0;
        for (const car of cars) {
            if (!car.lights || (car.x - cam.position.x) ** 2 + (car.z - cam.position.z) ** 2 > 62 ** 2)
                continue;
            beams.push({ x: car.x, z: car.z, ground: car.y, sin: Math.sin(car.yaw), cos: Math.cos(car.yaw), left: car.systems?.leftLamp ?? true, right: car.systems?.rightLamp ?? true });
        }
        let n = 0;
        for (const [id, [x, z, strength]] of vents.entries()) {
            if ((x - cam.position.x) ** 2 + (z - cam.position.z) ** 2 > 51 ** 2)
                continue;
            const base = (0, world_layout_js_1.groundHeight)(x, z);
            for (let j = 0; j < limits.puffs; j++) {
                const t = (time * (.285 + .026 * id) + j / limits.puffs) % 1;
                const px = x + t * t * (.49 + gustX * 2.2) + Math.sin(time * 1.6 + id + j) * t * .19, py = base + .09 + strength * t * 1.88, pz = z + .17 * Math.sin(t * 5.3 + id) + t * t * gustZ * 1.7;
                let light = 0;
                for (const beam of beams)
                    light = Math.max(light, (0, winter_light_js_1.inHeadlight)(px, py, pz, beam));
                const size = (.17 + 1.15 * t) * strength * Math.sin(Math.PI * t) ** .46;
                pose.position.set(px, py, pz);
                pose.quaternion.copy(cam.quaternion);
                pose.rotateZ(id + j * .71 + t * .47);
                pose.scale.set(size * 1.12, size * .93, 1);
                pose.updateMatrix();
                vapor.setMatrixAt(n, pose.matrix);
                color.copy(cold).lerp(warm, Math.min(1, 2.3 * light));
                vapor.setColorAt(n++, color);
            }
        }
        vapor.count = n;
        vapor.visible = n > 0;
        vapor.instanceMatrix.needsUpdate = true;
        if (vapor.instanceColor)
            vapor.instanceColor.needsUpdate = true;
        n = 0;
        for (const b of beams) {
            if (!b.left && !b.right)
                continue;
            const bx = Math.floor((b.x - 7 * b.sin) / 3), bz = Math.floor((b.z - 7 * b.cos) / 3);
            for (let ix = bx - 3; ix <= bx + 3 && n < litLimit; ix++)
                for (let iz = bz - 3; iz <= bz + 3 && n < litLimit; iz++) {
                    const seed = ((Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663)) >>> 0) / 4294967296;
                    for (let k = 0; k < 5 && n < litLimit; k++) {
                        const cycle = time * (.26 + k * .014) + seed * 17 + k * .41, t = cycle - Math.floor(cycle);
                        const x = 3 * (ix + (seed * 11.73 + k * .718) % 1) + t * .52, z = 3 * (iz + (seed * 29.41 + k * .357) % 1);
                        const y = b.ground + 3.18 * (1 - t);
                        if ((0, winter_light_js_1.inHeadlight)(x, y, z, b) < .065)
                            continue;
                        if (y < snowRoofAt(x,z)) continue;
                        litPositions.set([x, y, z], n++ * 3);
                    }
                }
        }
        litGeo.setDrawRange(0, n);
        snow.visible = n > 0;
        pos.needsUpdate = true;
        snow.material.size = (weather?.rain ?? 0) > .25 ? .046 : .085;
        snow.material.opacity = (weather?.rain ?? 0) > .25 ? .46 : .80;
    };
}
