"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAtmosphere = createAtmosphere;
const fixtures_js_1 = require("./fixtures.js");
const winter_effects_js_1 = require("./winter-effects.js");
const road_light_js_1 = require("./road-light.js");
const winter_light_js_1 = require("./winter-light.js");
const THREE = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const local_assets_js_1 = require("./local-assets.js");
const weather_js_1 = require("./weather.js");
const blackout_js_1 = require("./blackout.js");
const frost_sheets_js_1 = require("./frost-sheets.js");
function makeShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
            const u = 2 * (x + .5) / canvas.width - 1, v = (y + .5) / canvas.height;
            const d = Math.hypot(u, (v - .5) * 2);
            const alpha = Math.pow(Math.max(0, 1 - d * d), 2);
            const i = (y * canvas.width + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
            img.data[i + 3] = Math.round(255 * alpha);
        }
    ctx.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(canvas);
}
function createShadows(max) {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: makeShadowTexture(), color: 0x111924, opacity: .52,
        transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -2 });
    const mesh = new THREE.InstancedMesh(g, mat, max);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return mesh;
}
function lampMist(scene) {
    const width = 32, height = 64, texels = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++)
        for (let col = 0; col < width; col++) {
            const t = (row + .5) / height, x = Math.abs(2 * (col + .5) / width - 1);
            const angle = .095 + .85 * t, edge = Math.max(0, 1 - x / angle);
            const scatter = Math.sin(Math.PI * t) ** .9 * (1 - .66 * t) * edge * edge;
            const i = (row * width + col) * 4;
            texels[i] = texels[i + 1] = texels[i + 2] = 255;
            texels[i + 3] = Math.round(57 * scatter);
        }
    const map = new THREE.DataTexture(texels, width, height);
    map.flipY = true;
    map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, 12);
    mesh.name = 'Морось в свете фонарей';
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    return mesh;
}
function streetHalos(scene, snowLamps) {
    const marks = [];
    for (const f of fixtures_js_1.fixtures)
        if (f.kind === 'lamp') {
            marks.push({ id: f.id, grid: f, x: f.x + Math.sin(f.face) * 2.14, y: (0, world_layout_js_1.groundHeight)(f.x, f.z) + 6.08, z: f.z + Math.cos(f.face) * 2.14, size: 1.35, color: winter_light_js_1.lampPalette[winter_light_js_1.lampFamily(f)][0] });
        }
    for (const stall of [world_layout_js_1.buildings.kiosk, world_layout_js_1.buildings.booth])
        marks.push({ x: stall.x, y: 2.448, z: stall.z + stall.d * .5 + 1.51, size: .81, market: true, color: '#ffdfad' });
    marks.push({ x: 25, y: 21.77, z: -29, size: .75, color: '#ff6847' });
    const tex = document.createElement('canvas');
    tex.width = tex.height = 64;
    const c = tex.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.97)');
    g.addColorStop(.055, 'rgba(255,255,255,.86)');
    g.addColorStop(.17, 'rgba(255,255,255,.39)');
    g.addColorStop(.44, 'rgba(255,255,255,.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    const m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tex), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85 });
    const batch = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m, marks.length);
    const mist = lampMist(scene);
    const pose = new THREE.Object3D(), viewDir = new THREE.Vector3();
    batch.frustumCulled = false;
    batch.renderOrder = 4;
    scene.add(batch);
    const tinted = marks.map(mark => ({ ...mark, ink: new THREE.Color(mark.color) }));
    const crossings = tinted.filter(p => p.grid?.crosswalk);
    // One shadowless source lights the people and vehicles at the crossing in view.
    const sideLight = new THREE.SpotLight('#f1eae1', 0, 24, .57, .78, 2);
    sideLight.name = 'Боковой свет пешеходного перехода';
    scene.add(sideLight, sideLight.target);
    scene.userData.crossingLight = sideLight;
    const eyeObserver = new THREE.Vector3();
    scene.userData.eyeObserver = eyeObserver;
    return (cam, broken, radius, quality, power, daylight, moisture, marketLit) => {
        eyeObserver.copy(cam.position);
        const evening = THREE.MathUtils.smoothstep(1 - daylight, .12, .84);
        snowLamps.length = 0;
        m.opacity = (.08 + evening * .47) * (.30 + .70 * moisture);
        mist.material.opacity = evening * moisture * .65;
        let nearest, rangeSq = 48 * 48;
        for (const p of crossings) {
            const { x, z } = p.grid.crosswalk;
            const d = (x - cam.position.x) ** 2 + (z - cam.position.z) ** 2;
            if (d < rangeSq && !broken[p.id] && !(0, blackout_js_1.blackoutFixture)(power, p.grid.x, p.grid.z)) {
                nearest = p;
                rangeSq = d;
            }
        }
        sideLight.intensity = nearest ? 165 * evening * (1 - THREE.MathUtils.smoothstep(rangeSq, 36 * 36, 48 * 48)) : 0;
        sideLight.visible = sideLight.intensity > .05;
        if (sideLight.visible) {
            const target = nearest.grid.crosswalk;
            sideLight.position.set(nearest.x, nearest.y - .10, nearest.z);
            sideLight.target.position.set(target.x, .65, target.z);
        }
        let n = 0;
        mist.count = 0;
        const mistLimit = quality === 0 ? 4 : 12, mistRange = quality === 0 ? 26 : 42;
        for (const p of tinted) {
            const dx = cam.position.x - p.x, dz = cam.position.z - p.z, distanceSq = dx * dx + dz * dz;
            const grid = p.grid ?? p;
            if (p.market && !marketLit || p.id && broken[p.id] || distanceSq > radius * radius || (0, blackout_js_1.blackoutFixture)(power, grid.x, grid.z))
                continue;
            if (evening > .01 && p.grid && distanceSq < 36 * 36) snowLamps.push(p);
            pose.position.set(p.x, p.y, p.z);
            viewDir.copy(cam.position).sub(pose.position).normalize();
            pose.position.addScaledVector(viewDir, .23);
            pose.quaternion.copy(cam.quaternion);
            const size = p.size * (1 + .48 * moisture * Math.max(0, 1 - distanceSq / 625));
            pose.scale.set(size, size, 1);
            pose.updateMatrix();
            batch.setMatrixAt(n, pose.matrix);
            batch.setColorAt(n++, p.ink);
            if (evening > .01 && p.id && distanceSq > 4 && distanceSq < mistRange * mistRange && mist.count < mistLimit) {
                pose.position.set(p.x, p.y - 2.94, p.z);
                pose.rotation.set(0, Math.atan2(dx, dz), 0);
                pose.scale.set(6.15, 5.83, 1);
                pose.updateMatrix();
                mist.setMatrixAt(mist.count, pose.matrix);
                mist.setColorAt(mist.count++, p.ink);
            }
        }
        batch.count = n;
        batch.instanceMatrix.needsUpdate = true;
        if (batch.instanceColor)
            batch.instanceColor.needsUpdate = true;
        mist.visible = mist.count > 0;
        if (mist.count) {
            mist.instanceMatrix.needsUpdate = true;
            mist.instanceColor.needsUpdate = true;
        }
    };
}
function rainMap() {
    const side = 32, data = new Uint8Array(side * side * 4);
    for (let y = 0; y < side; y++)
        for (let x = 0; x < side; x++) {
            const offset = (x + y * side) * 4;
            const intensity = Math.max(0, 1 - Math.abs(x - (20 - y * .34)) * .75) * Math.sin(Math.PI * (y + .5) / side);
            data.set([255, 255, 255, Math.round(255 * intensity)], offset);
        }
    const map = new THREE.DataTexture(data, side, side);
    map.needsUpdate = true;
    return map;
}
function createAtmosphere(scene) {
    scene.background = new THREE.Color(0x767b7b);
    const fog = new THREE.Fog(0x626769, 55, 244);
    scene.fog = fog;
    new THREE.TextureLoader().load((0, local_assets_js_1.assetUrl)('sky/november.webp'), t => {
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        scene.background = t;
        scene.environment = t;
        scene.environmentIntensity = .73;
    });
    const skyLight = new THREE.HemisphereLight(0xc6dbff, 0x646575, 1.34);
    scene.add(skyLight);
    const key = new THREE.DirectionalLight(0xe0e8ff, 1.47);
    key.position.set(64, 39, -28);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb97f, .76);
    rim.position.set(-55, 18, 64);
    scene.add(rim);
    const updateWeather = (0, winter_effects_js_1.streetWeather)(scene);
    const updateIce = (0, frost_sheets_js_1.createFrostSheets)(scene);
    const snowLamps = [];
    scene.userData.eyeLights = snowLamps;
    const updateHalos = streetHalos(scene, snowLamps);
    const updateSnow = require("./airborne-snow.js").createSnowfall(scene, (0, winter_light_js_1.winterBudget)(2).flakes);
    const updateRoadLights = (0, road_light_js_1.createRoadLights)(scene);
    const shadows = createShadows(80);
    scene.add(shadows);
    const pose = new THREE.Object3D();
    function stamp(batch, x, z, yaw, w, d) {
        if (batch.count >= batch.instanceMatrix.count)
            return;
        pose.position.set(x, (0, world_layout_js_1.groundHeight)(x, z) + .061, z);
        pose.rotation.set(0, yaw, 0);
        pose.scale.set(w, 1, d);
        pose.updateMatrix();
        batch.setMatrixAt(batch.count++, pose.matrix);
    }
    let seed = 2724449785;
    const rand = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
    const rainPositions = new Float32Array(119 * 3);
    for (let i = 0; i < rainPositions.length; i += 3) {
        rainPositions[i] = (rand() - .5) * 30;
        rainPositions[i + 1] = rand() * 12;
        rainPositions[i + 2] = (rand() - .5) * 30;
    }
    const rainGeo = new THREE.BufferGeometry();
    const rainAttr = new THREE.BufferAttribute(rainPositions, 3).setUsage(THREE.DynamicDrawUsage);
    rainGeo.setAttribute('position', rainAttr);
    const drops = new THREE.Points(rainGeo, new THREE.PointsMaterial({ map: rainMap(), color: 0xb7d4e7, size: .21, opacity: 0, transparent: true, depthWrite: false, alphaTest: .035 }));
    drops.userData.rainStreak = true;
    drops.frustumCulled = false;
    drops.visible = false;
    scene.add(drops);
    const nightFog = new THREE.Color(0x626769), dayFog = new THREE.Color(0xbac0bd), rainFog = new THREE.Color(0x909693);
    const coldSky = new THREE.Color(0xd6dfe4), dawnSky = new THREE.Color(0xf9d5aa);
    const dawnFog = new THREE.Color(0xd3c8b8), { marketOpen } = require('./market-hours.js');
    return function update(dt, hero, driven, cars, people, elapsed, camera, broken = fixtures_js_1.intact, quality = 2, isPatrolActive, options = {}) {
        const conditions = options.weather ?? (0, weather_js_1.weatherAt)(elapsed);
        const tier = (0, weather_js_1.effectsQuality)(quality, (options.wanted ?? 0) > 0, !!options.fast);
        const limits = (0, winter_light_js_1.winterBudget)(tier);
        const daylight = Number.isFinite(options.clock) ? (0, weather_js_1.daylightAt)(options.clock) : conditions.daylight;
        const phase = options.blackout ?? 'normal';
        const shade = (0, blackout_js_1.blackoutField)(phase, hero.x, hero.z);
        const roadFocus = driven ? THREE.MathUtils.clamp((Math.abs(hero.speed) - 3) / 12, 0, 1) : 0;
        fog.color.copy(nightFog).lerp(dayFog, daylight * .92).lerp(rainFog, conditions.rain * .33);
        const calendar = options.clock ?? (1065 + elapsed / 2);
        const hour = (calendar % 1440) / 60;
        const dawn = Math.max(0, 1 - Math.abs(hour - 7.35) / 1.3);
        fog.color.lerp(dawnFog, dawn * .56);
        key.color.copy(coldSky).lerp(dawnSky, dawn);
        key.position.set(64 + 17 * dawn, 39 - 24 * dawn, -28);
        const canalAir = 1 - THREE.MathUtils.smoothstep(Math.abs(hero.z - 74), 12, 91);
        fog.near = 70 - 14 * canalAir - 29 * conditions.mist + roadFocus * (10 - 3 * conditions.mist);
        fog.far = Math.max(141 + 22 * roadFocus, 266 - 22 * canalAir - 142 * conditions.mist);
        skyLight.intensity = (1.13 + daylight * .65 - conditions.rain * .24) * (1 - .21 * shade);
        key.intensity = (1.39 + daylight * .8 - conditions.rain * .38) * (1 - .27 * shade);
        rim.intensity = (.89 - .37 * daylight) * (1 - .55 * shade);
        scene.backgroundIntensity = (.85 + daylight * .36 - conditions.rain * .12) * (1 - .12 * shade);
        scene.environmentIntensity = (.62 + daylight * .26) * (1 - .17 * shade);
        scene.userData.localExposure = 1 - .29 * shade;
        const dropCount = Math.ceil(Math.min(119, limits.flakes * 1.16) * conditions.rain);
        rainGeo.setDrawRange(0, dropCount);
        drops.visible = conditions.rain > .015;
        drops.material.opacity = .20 + .34 * conditions.rain;
        updateHalos(camera, broken, limits.halo, tier, phase, daylight, Math.min(1, conditions.snow + conditions.rain), marketOpen(calendar));
        updateWeather(dt, cars, camera, tier, conditions);
        updateIce(conditions, camera);
        updateRoadLights(cars, camera, elapsed, tier, isPatrolActive, conditions.wet, daylight, driven ? hero : undefined);
        shadows.count = 0;
        const castDawnShadow = person => {
            if(dawn>.05) stamp(shadows,person.x-1.28*dawn,person.z+.44*dawn,-1.23,.60,1.1+3.1*dawn);
        };
        if (!driven) {
            stamp(shadows, hero.x, hero.z, hero.yaw, .95, 1.5);
            castDawnShadow(hero);
        }
        for (const p of people)
            if (!p.onboard && (p.x - camera.position.x) ** 2 + (p.z - camera.position.z) ** 2 < 110 ** 2)
                { stamp(shadows, p.x, p.z, p.yaw, .89, 1.16); castDawnShadow(p); }
        for (const c of cars) {
            if ((c.x - camera.position.x) ** 2 + (c.z - camera.position.z) ** 2 > 145 ** 2)
                continue;
            const { front, rear, w } = vehicle_cabin_js_1.specs[c.kind], len = (rear - front) * 1.07;
            stamp(shadows, c.x, c.z, c.yaw, w * 3.04, len * 1.12);
        }
        shadows.instanceMatrix.needsUpdate = true;
        updateSnow(dt, elapsed, camera, conditions, limits, daylight, snowLamps, cars);
        drops.position.set(camera.position.x, Math.max(0, hero.y - .5), camera.position.z);
        if (drops.visible) {
            for (let i = 0; i < dropCount * 3; i += 3) {
                rainPositions[i] += conditions.gustX * 5.0 * dt;
                rainPositions[i + 2] += conditions.gustZ * 3.9 * dt;
                if (rainPositions[i] > 15)
                    rainPositions[i] -= 30;
                if (rainPositions[i + 2] > 15)
                    rainPositions[i + 2] -= 30;
                rainPositions[i + 1] -= (7.2 + .4 * (i % 5)) * dt;
                if (rainPositions[i + 1] < 0)
                    rainPositions[i + 1] += 12;
            }
            rainAttr.needsUpdate = true;
        }
    };
}
