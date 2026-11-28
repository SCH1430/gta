"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadLoop = exports.places = void 0;
exports.createWorld = createWorld;
const fixtures_view_js_1 = require("./fixtures-view.js");
const fixtures_js_1 = require("./fixtures.js");
const blackout_view_js_1 = require("./blackout-view.js");
const THREE = require("../engine/three.module.min.js");
const house_js_1 = require("./house.js");
const winter_effects_js_1 = require("./winter-effects.js");
const world_batch_js_1 = require("./world-batch.js");
const world_culling_js_1 = require("./world-culling.js");
const world_tram_js_1 = require("./world-tram.js");
const world_street_js_1 = require("./world-street.js");
const world_paving_js_1 = require("./world-paving.js");
const world_expansion_js_1 = require("./world-expansion.js");
const street_detail_js_1 = require("./street-detail.js");
const world_expansion_floor_js_1 = require("./world-expansion-floor.js");
const world_expansion_facades_js_1 = require("./world-expansion-facades.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
var world_layout_js_2 = require("./world-layout.js");
Object.defineProperty(exports, "places", { enumerable: true, get: function () { return world_layout_js_2.places; } });
Object.defineProperty(exports, "roadLoop", { enumerable: true, get: function () { return world_layout_js_2.roadLoop; } });
function createWorld(scene) {
    const district = new THREE.Group();
    district.name = 'Район Канальный';
    district.userData.staticScenery = true;
    scene.add(district);
    const visibility = new world_culling_js_1.StaticVisibility();
    const b = new world_batch_js_1.Batches(district, visibility), labels = new world_batch_js_1.Panels(district), walls = new world_batch_js_1.Panels(district, '#d1d5da'), rnd = (0, world_textures_js_1.random)(208777);
    const sign = (title, sub, ink, back, x, y, z, w, h, ry = 0, num = '') => {
        labels.place([title, sub, ink, back, num].join('|'), () => (0, world_textures_js_1.signTexture)(title, sub, ink, back, w / h, num), x, y, z, w, h, ry);
    };
    const { marketOpen } = require('./market-hours.js');
    const { districtCalendarMinutes } = require('./city-clock.js');
    const dawnTint = { value: 0 };
    const metal = '#54616d', snow = '#d9dfe1', dark = '#343f4a';
    const paving = new THREE.MeshBasicMaterial({ map: (0, world_textures_js_1.districtFloor)(), color: '#c9d2de' });
    const aggregate = (0, world_textures_js_1.grainTexture)();
    paving.onBeforeCompile = shader => {
        shader.uniforms.pavingAggregate = { value: aggregate };
        shader.vertexShader = 'varying vec3 vPavingView;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vPavingView = cameraPosition - (modelMatrix * vec4(transformed,1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPavingView;\nuniform sampler2D pavingAggregate;')
            .replace('#include <map_fragment>', `#include <map_fragment>
        float aggregate = texture2D(pavingAggregate,vMapUv*66.).r;
        float asphalt = 1.0-smoothstep(.052,.21,dot(diffuseColor.rgb,vec3(.24,.61,.15)));
        float grazing = pow(1.0-clamp(normalize(vPavingView).y,.0,1.),3.);
        diffuseColor.rgb *= .82+.36*aggregate;
        diffuseColor.rgb += vec3(.012,.024,.041)*(asphalt*grazing)*(.28+.72*aggregate);`);
    };
    const ground = new THREE.Mesh((0, world_expansion_floor_js_1.coreGroundGeometry)(), paving);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.016;
    district.add(ground);
    (0, world_paving_js_1.addPaving)(district);
    const cullRegion = (0, world_expansion_js_1.addCityExpansion)(district, b, walls, sign);
    const cullStreetDetail = (0, street_detail_js_1.addStreetDetail)(district);
    function bench(x, z, ry = 0) {
        const s = Math.sin(ry), c = Math.cos(ry);
        const local = (a, y, d, w, h, l, color) => b.box(x + a * c + d * s, y, z - a * s + d * c, w, h, l, color, ry);
        local(0, .46, 0, 2.25, .15, .6, '#887a70');
        local(0, .79, -.26, 2.25, .31, .12, '#8d7f73');
        for (const a of [-.82, .82])
            local(a, .24, 0, .12, .48, .45, metal);
    }
    function crate(x, z, w = 1, col = '#677b78', base = 0) {
        b.box(x, base + w * .39, z, w, w * .76, w * .82, col);
        b.box(x, base + w * .77, z, w * 1.04, .055, w * .86, '#a2a79f');
        for (const side of [-1, 1])
            b.box(x + side * w * .32, base + w * .39, z, .045, w * .79, w * .84, metal);
    }
    const accessibleDoor = (0, house_js_1.createHouseDoor)(district), spill = (0, winter_effects_js_1.entranceLight)(district);
    const litEntries = [], entryLampIds = [18, 19, 23, 31, 42, 13];
    const windowLayer = new THREE.Group(), windows = new world_batch_js_1.Panels(windowLayer);
    windowLayer.userData.dynamicScenery = true;
    windowLayer.name = 'Вечерние окна Канальной';
    district.add(windowLayer);
    function occupiedFlats(x, y, z, width, height, angle, cols, rows, seed, stairCol) {
        const direction = Math.cos(angle), storey = height / rows, bay = width / cols;
        const top = y + height / 2, faceZ = z + direction * .015;
        for (let col = 0; col < cols; col++) {
            const stair = col === stairCol;
            if (!stair && (col + seed) % 3 === 1)
                continue;
            const from = (col * 3 + seed) % Math.max(1, rows - 3), count = 2 + (seed + col) % 2;
            for (let row = 0; row < rows - 1; row++) {
                if (!stair && (row < from || row >= from + count))
                    continue;
                const kind = stair ? 'stair' : ['kitchen', 'amber', 'reading', 'cream'][(row + col + seed) % 4];
                const cx = x + direction * ((col + (stair ? .5 : 31.5 / 64)) * bay - width * .5);
                const cy = top - (row + (stair ? 33 : 32.5) / 68) * storey;
                windows.place(kind, () => (0, world_textures_js_1.occupiedPane)(kind),
                    cx, cy, faceZ, bay * (stair ? 46 : 41) / 64, storey * (stair ? 54 : 29) / 68, angle);
            }
        }
    }
    const lowerFronts = {
        flush: { stone: '#818384', sill: '#a4a6a0', jamb: '#777f80', canopy: 2.64, depth: 1.16 },
        canopy: { stone: '#727e83', sill: '#9ca9ac', jamb: '#546b72', canopy: 2.95, depth: 1.42 },
        stoop: { stone: '#8d807a', sill: '#a49b90', jamb: '#7c7771', canopy: 2.78, depth: 1.34 }
    };
    for (const a of world_layout_js_1.apartments) {
        const { x, z, w, d, h, id } = a;
        const entry = (0, world_layout_js_1.apartmentEntry)(a), { x: ex, front, steps, rise } = entry;
        const finish = lowerFronts[entry.type], doorBase = steps * rise;
        b.box(x, h / 2, z, w, h, d, '#82858a');
        b.box(x, .38, z, w + .14, .76, d + .14, '#69727e');
        const courtyard = [23, 24, 31, 32].includes(id), frontCols = Math.max(3, Math.round(w / 2.85));
        const stairBay = Math.floor(((ex - x) / w + .5) * frontCols);
        const stairX = x + ((stairBay + .5) / frontCols - .5) * (w - .09);
        for (const [cx, cz, wide, ang] of [[x, z + d / 2 + .008, w, 0], [x, z - d / 2 - .008, w, Math.PI], [x + w / 2 + .008, z, d, Math.PI / 2], [x - w / 2 - .008, z, d, -Math.PI / 2]]) {
            const cols = Math.max(3, Math.round(wide / 2.85)), rows = Math.round(h / 2.95);
            const stairCol = courtyard && ang === 0 ? stairBay : -1;
            const routeFace = stairCol >= 0 || ((id === 19 || id === 20) && ang === Math.PI);
            const key = cols + '_' + rows + '_' + (id % 3) + (routeFace ? '_canal_' + stairCol : '');
            walls.place(key, () => (0, world_textures_js_1.facade)(cols, rows, id, routeFace, stairCol), cx, h * .5 + .16, cz, wide - .09, h - .5, ang);
            if (routeFace)
                occupiedFlats(cx, h * .5 + .16, cz, wide - .09, h - .5, ang, cols, rows, id, stairCol);
        }
        b.box(x, h - .14, z, w + .26, .29, d + .26, '#54636e');
        b.box(x, h + .06, z, w + .28, .17, d + .28, snow);
        b.box(x + w * .18, h + .65, z, Math.min(w * .42, 7), 1.17, 3.3, '#777e82');
        b.box(x + w * .18, h + 1.28, z, Math.min(w * .42, 7) + .20, .16, 3.5, snow);
        b.box(x - w * .28, h + .38, z - 2, 1.3, .76, 1.4, '#50616d');
        b.cyl(x - w * .23, h + 1.9, z + 1, .09, 3.8, '#788893');
        b.beam(x - w * .23 - 1, h + 3.3, z + 1, x - w * .23 + 1, h + 3.3, z + 1, .045, metal);
        for (const k of [-1, 1])
            b.cyl(x + k * (w / 2 - .22), h / 2, z + d / 2 + .12, .15, h, id%4===0 && k>0 ? '#acb5b2' : metal);
        const floors = Math.round(h / 2.95);
        for (let n = 1; n < floors; n++) {
            const y = (n + .1) * (h - .5) / floors;
            for (const j of (id % 3 === 0 ? [-.26, .26] : [.24])) {
                const bx = x + w * j, bz = z + d / 2 + .35;
                if (courtyard && Math.abs(bx - stairX) < 1.24 + w / frontCols * .36)
                    continue;
                b.box(bx, y, bz, 2.43, .20, .92, '#88939c');
                b.box(bx, y + .53, bz + .38, 2.40, .77, .11, n % 3 === 0 ? '#697e89' : '#8d959a');
                for (const k of [-1, 1])
                    b.box(bx + k * 1.12, y + .52, bz, .11, .73, .75, '#7d8991');
                b.box(bx, y + .95, bz + .38, 2.46, .07, .14, snow);
                if ((n + id) % 3 === 1) {
                    b.box(bx, y + 1.67, bz + .37, 2.26, 1.36, .055, '#91a2a1');
                    for (const v of [-1.12, -.35, .36, 1.12])
                        b.box(bx + v, y + 1.64, bz + .415, .051, 1.40, .075, '#ded8bd');
                    b.box(bx, y + 2.37, bz + .06, 2.45, .085, .79, '#b8b9ab');
                } else if ((n+id)%4===0) {
                    for (const side of [-1,1])
                        b.box(bx+side*.89,y+1.16,bz+.06,.32,.36,.29,'#a18468');
                }
            }
        }
        if (id !== 24) {
            const bays = Math.max(3, Math.round(w / 3.25)), bay = w / bays;
            for (let i = 0; i < bays; i++) {
                const cx = x - w * .5 + (i + .5) * bay;
                if (Math.abs(cx - ex) < bay * .5 + 1.42)
                    continue;
                if (id === 23 && Math.abs(cx + 29.5) < .1) {
                    b.box(cx, 1.42, front + .08, bay - .07, 2.63, .16, finish.stone);
                    continue;
                }
                const width = bay * (i % 3 === 1 ? .81 : .69);
                b.box(cx, 1.42, front + .08, width, 2.63, .16, finish.stone);
                b.box(cx, 1.59, front + .178, width * .78, 1.18, .06, '#354954');
                for (const side of [-1, 1])
                    b.box(cx + side * width * .416, 1.59, front + .17, width * .055, 1.23, .18, finish.jamb);
                b.box(cx, 2.21, front + .18, width * .92, .10, .24, '#626d71');
                b.box(cx, .99, front + .21, width * .91, .11, .26, finish.sill);
                b.box(cx, 1.58, front + .213, .044, 1.14, .026, '#869092');
            }
            b.box(x, 2.86, front + .108, w - .32, .15, .24, finish.stone);
            b.box(x, 2.75, front + .108, w - .36, .061, .22, '#535e62');
        }
        if (id === 23) {
            for (const side of [-1, 1]) {
                const tileX = ex + side * 1.25;
                b.box(tileX, 1.25, front + .094, .91, 2.50, .15, '#617581');
                walls.place('porch-23-tile', world_textures_js_1.porchTile, tileX, 1.25, front + .173, .89, 2.47, 0);
            }
        }
        else {
            b.box(ex, doorBase + 1.22, front + .085, 1.72, 2.44, .18, '#384856');
            b.box(ex, doorBase + 1.24, front + .20, 1.19, 2.19, .13, ['#585e50', '#6b594b', '#465956'][id % 3]);
            b.box(ex + .41, doorBase + 1.02, front + .30, .06, .26, .085, '#b4b7b6');
            for (const side of [-1, 1])
                b.box(ex + side * .80, doorBase + 1.24, front + .22, .17, 2.49, .32, finish.jamb);
        }
        if (steps) {
            const treadMaterial = id === 31 ? new THREE.MeshBasicMaterial({ map: (0, world_textures_js_1.wornTread)() }) : null;
            for (let i = 0; i < steps; i++) {
                const stepStart = i === 0 ? 0 : entry.landing + (i - 1) * entry.tread;
                const stepDepth = i === 0 ? entry.landing : entry.tread;
                const top = (steps - i) * rise;
                const edge = front + stepStart + stepDepth;
                b.box(ex, top * .5, edge - stepDepth * .5, entry.width, top, stepDepth, finish.stone);
                b.box(ex, top - .02, edge - .025, entry.width - .10, .038, .045, finish.sill);
                if (treadMaterial) {
                    const skin = new THREE.Mesh(new THREE.PlaneGeometry(entry.width - .045, stepDepth - .008), treadMaterial);
                    skin.rotation.x = -Math.PI / 2;
                    skin.position.set(ex, top + .003, edge - stepDepth * .5);
                    district.add(skin);
                }
            }
            for (const side of [-1, 1]) {
                const rail = ex + side * entry.width * .5;
                for (const [offset, bottom] of [[.2, doorBase], [entry.depth - .13, rise]])
                    b.cyl(rail, bottom + .44, front + offset, .08, .88, metal);
                b.beam(rail, doorBase + .88, front + .12, rail, rise + .85, front + entry.depth, .065, '#919d9f', true);
                if (id === 31) {
                    const hand = t => [rail, doorBase + .914 - (doorBase - rise + .03) * t, front + .12 + (entry.depth - .12) * t];
                    for (const [from, to] of [[.22, .44], [.48, .65]])
                        b.beam(...hand(from), ...hand(to), .037, '#bcb6a4', true);
                }
            }
        }
        const awningY = doorBase + finish.canopy, awningD = finish.depth, awningW = entry.type === 'canopy' ? 3.20 : 2.82;
        b.box(ex, awningY, front + awningD * .42, awningW, .21, awningD, finish.jamb);
        b.box(ex, awningY + .13, front + awningD * .42, awningW + .04, .06, awningD + .025, snow);
        b.box(ex, awningY - .119, front + awningD * .42, awningW - .12, .045, awningD - .08, '#495359');
        const lampX = id === 23 || id === 31 ? .36 : 0;
        b.box(ex + lampX, awningY - .156, front + .45, .76, .055, .16, '#8c7b64');
        if (entryLampIds.includes(id))
            litEntries.push({ ...entry, lampX, lampY: awningY - .19 });
        const intercom = (0, world_street_js_1.intercomMount)(a);
        b.box(intercom.x, 1.42, intercom.z - .116, .42, .68, .205, '#344550');
        b.box(intercom.x, 1.55, intercom.z - .006, .34, .31, .065, '#293c49');
        b.lamp(intercom.x - .151, 1.42, intercom.z + .032, .027, .44, .028, '#a9ae80');
        sign('ВЫЗОВ', 'ДОМОФОН', '#a4dacf', '#354954', intercom.x, 1.205, intercom.z + .002, .34, .14);
        if (id === 23) {
            b.box(ex, awningY + .26, front + awningD * .92, 1.10, .54, .085, '#435b69');
            sign('23', 'КАНАЛЬНАЯ', '#f1e9ce', '#325467', ex, awningY + .26, front + awningD * .92 + .046, 1.05, .50);
        }
        else
            sign(String(id), 'КАНАЛЬНАЯ', '#d9e1de', '#435963', x + w * .34, 2.43, front + .282, 1.18, .70);
    }
    require('./district-winter-details.js').addDistrictDetails(b, sign, world_layout_js_1);
    windows.flush();
    windowLayer.visible = false;
    for (const pane of windowLayer.children) {
        pane.material.transparent = true;
        pane.material.depthWrite = false;
    }
    const entryLights = (0, winter_effects_js_1.streetEntranceLights)(district, litEntries);
    b.box(-19.56, 5.1, 10, 4.28, 2.0, 7, '#7a858d');
    b.box(-19.56, 6.18, 10, 4.35, .17, 7.16, snow);
    for (const sx of [-21.6, -17.5])
        b.box(sx, 2.23, 10, .85, 4.46, 7, '#727b86');
    for (let i = 0; i < world_layout_js_1.steps.count; i++) {
        const h = (i + 1) * world_layout_js_1.steps.rise, near = world_layout_js_1.steps.z1 + i * world_layout_js_1.steps.tread, far = world_layout_js_1.steps.z2 - i * world_layout_js_1.steps.tread;
        for (const [edge, side] of [[near, 1], [far, -1]]) {
            b.box(world_layout_js_1.steps.x, h * .5, edge + side * world_layout_js_1.steps.tread * .5, world_layout_js_1.steps.width, h, world_layout_js_1.steps.tread, '#939ca5');
            b.box(world_layout_js_1.steps.x, h - .026, edge - side * .005, world_layout_js_1.steps.width - .10, .037, .014, i === 0 ? '#d3b57e' : '#b9c2c2');
        }
    }
    const flight = world_layout_js_1.steps.tread * world_layout_js_1.steps.count, landing = world_layout_js_1.steps.count * world_layout_js_1.steps.rise;
    b.box(world_layout_js_1.steps.x, landing * .5, 10, world_layout_js_1.steps.width, landing, world_layout_js_1.steps.z2 - world_layout_js_1.steps.z1 - flight * 2, '#969da4');
    for (const edge of [-1, 1]) {
        const x = world_layout_js_1.steps.x + edge * (world_layout_js_1.steps.width / 2 + .05);
        for (const [z, h] of [[3.24, .155], [5.84, .62], [14.16, .62], [16.76, .155]])
            b.cyl(x, h + .46, z, .084, .92, '#617581');
        b.beam(x, 1.08, 3.07, x, 1.55, 5.84, .093, '#99aaa9');
        b.beam(x, 1.55, 5.84, x, 1.55, 14.16, .093, '#99aaa9');
        for (const [from, to] of [[5.9, 6.7], [8.2, 9.65], [11.6, 12.35], [13.46, 14.11]]) {
            b.beam(x, 1.565, from, x, 1.565, to, .095, '#bbc1b5');
            b.beam(x, 1.575, from + .09, x, 1.575, to - .07, .073, '#ced0bc');
        }
        b.beam(x, 1.55, 14.16, x, 1.08, 16.93, .093, '#99aaa9');
    }
    b.lamp(-19.56, 3.99, 10, 1.48, .09, .20, '#ffe2a4');
    sign('ДВОР 24', 'ПЕШЕХОДНЫЙ ПРОХОД', '#d6d5b3', '#445963', -19.58, 5.12, 13.53, 3.45, .92);
    bench(-28, 17.1);
    bench(-6, 17.2);
    bench(-16, -17, Math.PI);
    for (const o of world_layout_js_1.lowBarriers) {
        b.box(o.x, .065, o.z, o.w + .12, .13, o.d + .10, '#68747d');
        b.box(o.x, .332, o.z, o.w, .49, o.d, '#92999b');
        b.box(o.x, .596, o.z, o.w - .035, .065, o.d - .03, snow);
        for (const side of [-1, 1]) {
            b.box(o.x, .36, o.z + side * (o.d / 2 + .008), o.w - .13, .13, .023, '#53616a');
            for (const offset of [-.36, .36])
                b.lamp(o.x + o.w * offset, .36, o.z + side * (o.d / 2 + .024), .22, .095, .015, '#eec18b');
        }
    }
    const roofEnds = [];
    for (const [j, g] of [world_layout_js_1.buildings.garage, world_layout_js_1.buildings.garage2].entries()) {
        const { x, z, w, d } = g, fx = x + w / 2;
        b.box(x, 2.04, z, w, 4.08, d, '#747c7d');
        walls.place('garage-brick', world_textures_js_1.garageMasonry, fx + .009, 2.04, z, d - .06, 4.035, Math.PI / 2);
        b.box(x, 4.18, z, w + .48, .24, d + .48, '#465560');
        b.box(x, 4.33, z, w + .52, .13, d + .52, snow);
        for (const roof of (0, world_layout_js_1.garageRoofSections)(g)) {
            const low = roof.bottom + .10, slope = roof.top - low, front = roof.z - roof.d / 2, back = roof.z + roof.d / 2;
            b.box(roof.x, (roof.bottom + roof.top) / 2, front, roof.w, roof.top - roof.bottom, .09, '#42535b');
            b.box(roof.x, roof.top - slope * .44, front - .055, roof.w - .15, slope * .70, .05, '#7c9293');
            for (let dx = -roof.w * .5 + .11; dx < roof.w * .5; dx += 1.50)
                b.box(roof.x + dx, roof.top - slope * .44, front - .09, .08, slope * .75, .08, '#526166');
            b.piece('box', roof.x, (roof.top + low) / 2, roof.z, roof.w + .18, .10,
                Math.hypot(roof.d, slope) + .15, snow, 0, 0, Math.atan2(slope, roof.d));
            for (const side of [-1, 1]) {
                const endX = roof.x + side * roof.w / 2;
                const near = [endX, roof.bottom, front], high = [endX, roof.top, front], far = [endX, low, back];
                const foot = [endX, roof.bottom, back];
                roofEnds.push(...(side < 0 ? [near, far, high, near, foot, far] : [near, high, far, near, far, foot]).flat());
            }
        }
        for (const dz of [-.27, .24]) {
            const door = z + d * dz;
            const bay = j * 2 + (dz < 0 ? 1 : 2), bayWidth = bay === 1 ? 4.66 : Math.min(d * .40, 6);
            b.box(fx + .055, 1.65, door, .16, 3.25, bayWidth + .44, '#364551');
            if (bay !== 1) {
                b.box(fx + .153, 1.55, door, .12, 2.93, bayWidth, '#56777a');
                walls.place('garage-ribs-' + bay, () => (0, world_textures_js_1.garageDoor)(bay), fx + .217, 1.56, door, bayWidth - .04, 2.89, Math.PI / 2);
                for (let y = .34; y < 3.02; y += .52)
                    b.box(fx + .223, y, door, .018, .014, bayWidth - .02, '#526a6d');
                b.box(fx + .235, 1.12, door, .07, .10, .49, '#939b98');
            }
            else {
                b.box(fx + .141, 1.56, door, .018, 2.94, 4.65, '#27353c');
                for (const y of [.39, 1.06, 1.79])
                    b.box(fx + .160, y, door + .12, .029, .054, 3.90, '#5d625b');
                for (const [y, dz, col] of [[.60, -1.25, '#9a7b51'], [.63, -.75, '#7e734f'], [1.25, .33, '#737f73'], [1.24, 1.28, '#ac6c43']])
                    b.box(fx + .18, y, door + dz, .034, .34, .40, col);
                b.box(fx + .19, 2.82, door, .031, .057, 2.23, '#80817b');
                sign('БОКС 01', 'МАСТЕРСКАЯ', '#c0d2bb', '#36484a', fx + .19, 2.13, door, 1.31, .38, Math.PI / 2);
            }
            b.box(fx + .26, 3.27, door, .25, .15, bayWidth + .50, metal);
            if (bay === 1)
                b.box(fx + .28, 3.20, door, .18, .065, 2.16, '#868a82');
            else
                b.lamp(fx + .28, 3.20, door, .19, .055, 2.12, '#ffe0a3');
        }
        for (let zz = z - d / 2 + .35; zz < z + d / 2; zz += 3.0)
            b.box(fx + .08, 2.0, zz, .20, 4, .14, '#56666a');
        const front = z - d / 2;
        for (let xx = x - w / 2 + .4; xx < x + w / 2; xx += .41)
            b.box(xx, 1.8, front - .038, .08, 3.6, .09, '#647676');
        if (j === 0) {
            b.box(fx + .21, 4.03, z, .33, 1.10, 8.15, '#384853');
            sign('КАНАЛЬНЫЕ ГАРАЖИ', 'РЕМОНТ · ПОКРАСКА', '#e8ddbc', '#4b574a', fx + .39, 4.02, z, 7.95, .97, Math.PI / 2);
            b.box(fx + .396, 3.53, z - .29, .082, .045, 7.20, '#827b6b');
            const bladeX = fx + .90, bladeZ = front + .83;
            b.beam(fx, 3.07, bladeZ, bladeX + .60, 3.07, bladeZ, .13, metal, true);
            b.box(bladeX, 2.53, bladeZ, 1.22, 1.23, .22, '#37505a');
            for (const side of [-1, 1])
                sign('СТО', '24 ЧАСА', '#e1d5b3', '#525a50', bladeX, 2.54, bladeZ + side * .116, 1.16, 1.10, side < 0 ? Math.PI : 0);
            b.box(bladeX + .64, 2.54, bladeZ, .06, 1.19, .22, '#8b8977');
            for (const az of [-3.12, 3.12])
                b.box(fx + .20, 1.92, z + d * .24 + az, .13, 2.63, .062, '#8f8170');
            b.lamp(fx + .25, 3.17, z + d * .24, .1, .085, .73, '#ffe0b6');
            sign('ГАРАЖИ', 'КАНАЛЬНАЯ УЛИЦА', '#deb98c', '#3f5458', x, 2.55, front - .105, 7.4, 1.35, Math.PI);
            b.cyl(fx - .45, 2.14, z + d / 2 + .2, .17, 4.23, '#66777b');
        }
        b.box(x - w * .27, 4.85, z, 1.36, 1.01, 1.16, '#64717a');
    }
    const gables = new THREE.BufferGeometry();
    gables.setAttribute('position', new THREE.Float32BufferAttribute(roofEnds, 3));
    gables.computeVertexNormals();
    district.add(new THREE.Mesh(gables, new THREE.MeshLambertMaterial({ color: '#69777b' })));
    b.box(-20.4, .16, 42.3, 2.15, .32, 1.3, '#849098');
    b.box(-20.4, 1.07, 42.3, 1.8, 1.68, .96, '#738383');
    b.box(-20.4, 1.96, 42.3, 1.9, .13, 1.04, snow);
    walls.place('cabinet-side', world_textures_js_1.cabinetPlate, -21.308, 1.08, 42.3, .90, 1.58, -Math.PI / 2);
    for (const dx of [-.43, .43]) {
        b.box(-20.4 + dx, 1.10, 42.81, .81, 1.45, .065, '#657978');
        for (let j = 0; j < 5; j++)
            b.box(-20.4 + dx, .68 + j * .105, 42.86, .42, .046, .04, '#465d60');
    }
    sign('380 В', '', '#f0cf8e', '#5b6057', -20.81, 1.48, 42.861, .42, .22);
    const shed = world_layout_js_1.buildings.shed;
    b.box(shed.x, 3.63, shed.z, shed.w, 7.24, shed.d, '#896f69');
    for (let x = -31; x < -4; x += 3.52) {
        b.box(x, 4.5, -25.44, 2.78, 3.7, .12, '#40535c');
        for (let k = 0; k < 3; k++)
            b.box(x - .90 + k * .90, 4.66, -25.33, .74, 2.62, .12, k % 2 ? '#b6a184' : '#879ca2');
        b.box(x, 5.13, -25.22, 2.75, .06, .07, '#52666c');
        b.piece('box', x, 7.66, -32, 3.57, .24, 13.25, '#b7c3c6', 0, .12);
    }
    for (const xx of [-30, -23, -16, -9]) {
        b.box(xx, 3.17, -38.55, 5.85, 6.18, .17, '#49606c');
        for (let y = .55; y < 5.9; y += .32)
            b.box(xx, y, -38.66, 5.66, .09, .07, '#526b75');
        b.lamp(xx, 6.5, -38.66, 2.55, .15, .13, '#ffc989');
    }
    sign('ТРАМВАЙНОЕ ДЕПО', 'ГОРОДСКОЙ ЭЛЕКТРОТРАНСПОРТ', '#ffe0a1', '#594d47', -18.8, 6.63, -25.34, 11.3, 1.23);
    sign('ДЕПО', 'СТРЕЛОЧНЫЙ ПОСТ 07', '#f0ca8f', '#485b63', -17, 7.19, -38.66, 7.65, 1.07, Math.PI);
    const cb = world_layout_js_1.buildings.dispatcher;
    b.box(cb.x, 1.65, cb.z, cb.w, 3.3, cb.d, '#859696');
    b.box(cb.x, 3.39, cb.z, 6.43, .21, 5.89, snow);
    for (const xx of [9.75, 11.2]) {
        b.box(xx, 1.97, -35.8, 1.32, 1.19, .15, '#52656a');
        b.lamp(xx, 2.02, -35.91, 1.11, .88, .04, '#d4b27f');
    }
    b.box(13.4, 1.14, -35.81, .98, 2.28, .17, '#42636a');
    sign('ПОСТ 07', 'СТРЕЛКИ', '#ffcf89', '#415156', 11.4, 2.96, -35.9, 3.44, .57, Math.PI);
    b.box(13.2, .71, -37, .75, 1.42, .55, '#5d767c');
    b.lamp(13.2, 1.06, -37.29, .48, .34, .03, '#8adbce');
    b.box(25, 2.4, -29, 14, 4.8, 12, '#6e7e86');
    b.box(25, 4.87, -29, 14.3, .19, 12.3, snow);
    for (let j = 0; j < 4; j++) {
        const x = 20.8 + j * 2.65;
        b.box(x, 2.33, -22.93, 2.1, 3.6, .16, '#435a69');
        for (let k = 0; k < 9; k++)
            b.box(x, .79 + k * .37, -22.80, 1.78, .10, .15, '#73858b');
    }
    for (const a of [-1, 1])
        for (const c of [-1, 1]) {
            b.beam(25 + 3 * a, 4.9, -29 + 3 * c, 25 + 2 * a, 15.8, -29 + 2 * c, .30, '#66757c');
            b.beam(25 + 3 * a, 5.1, -29 + 3 * c, 25 - 2 * a, 15, -29 + 2 * c, .16, '#7a7c7c');
        }
    b.cyl(25, 15.74, -29, 7.8, .49, '#4d6470');
    b.cyl(25, 17.40, -29, 7.4, 3.16, '#ba8262');
    b.cyl(25, 18.65, -29, 7.5, .33, '#e0bc8f');
    b.piece('taper', 25, 19.8, -29, 7.95, 1.72, 7.95, '#b0bec4');
    b.cyl(25, 21.06, -29, .13, 1.32, metal);
    b.lamp(25, 21.74, -29, .24, .17, .24, '#ed885f');
    sign('77', '', '#e8d2b0', '#a47a63', 25, 17.35, -25.27, 2.06, 1.28);
    b.box(63, 6.38, 13, 102, 1.04, 7.5, '#697682');
    b.box(63, 6.96, 13, 102, .15, 7.75, '#8b969d');
    for (const vz of [9.15, 16.85]) {
        b.box(63, 7.30, vz, 102, .62, .29, '#77838a');
        b.box(63, 7.66, vz, 102, .09, .32, snow);
        b.box(63, 5.88, vz + (vz < 13 ? .26 : -.26), 102, .48, .29, '#495b67');
    }
    for (const x of [17, 39, 57, 78, 100]) {
        b.box(x, 2.8, 13, 1.42, 5.6, 1.8, '#778289');
        b.box(x, 5.58, 13, 2.15, .53, 6.88, '#6b7882');
        b.box(x, .68, 13, 1.6, 1.36, 2.03, '#4c6570');
        for (const s of [-1, 1])
            b.beam(x, 4.35, 13, x, 5.73, 13 + s * 2.75, .38, '#79858c', true);
        if (x < 82)
            sign('Р-77', '', '#e3c29b', '#536575', x, 3.65, 13.94, .99, .5);
    }
    b.beam(13, 5.8, 16.96, 111, 5.8, 16.96, .23, '#9e796b');
    for (let x = 14; x < 112; x += 4)
        b.box(x, 5.87, 16.94, .12, .42, .41, '#657780');
    const poweredMarket = new THREE.Group();
    poweredMarket.name = 'Освещение торговых рядов';
    poweredMarket.userData.dynamicScenery = true;
    district.add(poweredMarket);
    const marketLight = new world_batch_js_1.Batches(poweredMarket);
    const spektrLight = require("./spektr-frontage.js").addSpektrFrontage(b, marketLight, sign, poweredMarket);
    const stalls = [
        { g: world_layout_js_1.buildings.kiosk, tag: 'СПЕКТР', sub: 'РАДИОДЕТАЛИ · МОДУЛИ', light: '#f1ddae', awning: '#366d70' },
        { g: world_layout_js_1.buildings.booth, tag: 'РЕМОНТ ТЕЛЕФОНОВ', sub: 'ИННА · МАГНИТОЛЫ И ПРИЁМНИКИ', light: '#eedfc0', awning: '#9c5854' },
        { g: world_layout_js_1.buildings.booth2, tag: 'ПАЯЛЬНАЯ', sub: 'МАСТЕРСКАЯ № 4', light: '#ffeeae', awning: '#888455' },
        { g: world_layout_js_1.buildings.booth3, tag: 'СВЯЗЬ', sub: 'БЫТОВАЯ ЭЛЕКТРОНИКА', light: '#a5cfdf', awning: '#517b8e' }
    ];
    for (const [n, m] of stalls.entries()) {
        const { x, z, w, d } = m.g, front = z + d / 2;
        b.box(x, 1.44, z, w, 2.88, d, '#4e6368');
        b.box(x, 1.64, front + .04, w - .52, 1.8, .14, '#344954');
        b.box(x, 2.01, front + .14, w - .85, .85, .12, '#718889');
        for (let i = 0; i < 6; i++) {
            const dx = x - w * .37 + i * w * .145;
            b.box(dx, 1.75, front + .22, .64, .55, .12, ['#374e5b', '#6d7778', '#7c776b'][i % 3]);
            b.box(dx, 1.77, front + .295, .40, .29, .025, i % 2 ? '#85aaa9' : '#bdad86');
        }
        b.box(x, .64, front + .47, w - .45, 1.23, 1.16, '#657577');
        b.box(x, 1.30, front + .47, w - .32, .12, 1.22, '#b1b0a3');
        for (let j = 0; j < 5; j++) {
            if (n === 0 && j < 2)
                continue;
            const dx = x - w * .34 + j * w * .164;
            b.box(dx, 1.48, front + .64, .57, .24, .39, ['#475b63', '#a6a391', '#8f7366'][j % 3]);
            if (j % 2 === 0)
                b.box(dx, 1.51, front + .84, .23, .09, .025, m.light);
        }
        const goods = [['Провод, м', '30'],['Телефон б/у','900'],['Лампа','45'],['Приёмник','350']][n];
        const tx=x+w*.25;
        b.box(tx,1.39,front+.97,.51,.27,.032,'#b5a789');
        labels.place('ticket-'+n,()=>world_textures_js_1.handTicket(...goods),tx,1.39,front+.99,.49,.25,0);
        if (n===1) {
            b.box(x,1.44,front+.74,.47,.17,.23,'#8b7d5d');
            b.box(x-.08,1.45,front+.862,.19,.08,.019,'#62635a');
            for(let i=0;i<3;i++) b.box(x+.08+i*.034,1.46,front+.863,.014,.091,.016,'#504e46');
            b.beam(x+.16,1.52,front+.75,x+.41,1.82,front+.77,.018,'#a6aaa0');
            b.piece('box',x-.37,1.385,front+.81,.12,.028,.22,'#454c48',-.20);
        }
        if (n >= 2) {
            b.piece('box', x, 2.81, front + .78, w + .62, .16, 2.1, m.awning, 0, 0, .12);
            b.box(x, 2.64, front + 1.76, w + .62, .34, .10, m.awning);
            for (let j = 0; j < 9; j++)
                if (j % 2 === 0)
                    b.box(x - w * .47 + j * w * .117, 2.63, front + 1.83, w * .074, .36, .04, '#b6ada0');
            marketLight.lamp(x, 2.64, front + .89, w * .80, .07, .10, m.light);
        }
        b.box(x, 3.32, z + .35, w + .34, 1.0, .35, '#354950');
        sign(m.tag, m.sub, m.light, n === 1 ? '#583a42' : '#2a4a51', x, 3.32, z + .55, w + .17, .9);
        b.box(x, 3.79, z + .56, w - .20, .056, .075, '#888575');
        if (n < 2) {
            const edge = x + w / 2 - .19;
            b.box(edge + .23, 2.0, front + 1.14, .65, .88, .16, '#34444d');
            sign(n === 0 ? 'Ω' : 'Р', 'СЕРВИС', m.light, n === 1 ? '#583a42' : '#295156', edge + .23, 2.01, front + 1.237, .59, .79);
            b.box(edge + .57, 2.0, front + 1.16, .045, .84, .19, m.light);
        }
    }
    marketLight.flush();
    const blackoutProps = (0, blackout_view_js_1.createBlackoutProps)(district);
    for (const post of world_layout_js_1.marketMasts)
        b.cyl(post.x, 1.31, post.z, .09, 2.62, '#6c8887');
    sign('РЫНОК СПЕКТР', 'РАДИОРЯДЫ · ВОСТОЧНЫЙ ВХОД', '#e4d9b4', '#365653', 31, 6.21, 17.04, 11.4, 1.26);
    const ox = -8.15, front = 15.68;
    const { spectacleFrame } = require('./neighborhood-shops.js');
    b.box(ox, 9.30, front, 6.15, 7.26, .31, '#334b54');
    labels.place('canal-tram-mosaic', world_textures_js_1.tramMosaic, ox, 9.30, front + .18, 5.89, 6.96, 0);
    for (const side of [-1, 1]) {
        b.box(ox + side * 3.09, 9.28, front + .08, .13, 7.34, .36, '#687b7c');
        b.box(ox + side * 3.10, 9.34, front + .28, .066, 6.85, .075, '#827d70');
    }
    b.box(ox, 2.05, 15.97, 8.45, 3.90, .85, '#374e52');
    for (const dx of [-2.91, -1.13, .69]) {
        b.box(ox + dx, 1.95, 16.45, 1.63, 2.15, .10, '#476a70');
        b.box(ox + dx, 1.97, 16.52, 1.38, 1.77, .06, dx < 0 ? '#82a6a2' : '#989b84');
        b.box(ox + dx, 2.36, 16.56, 1.42, .065, .06, '#536c70');
        for (let row=0;row<2;row++){
            const y = 1.35 + row*.43;
            b.box(ox+dx,y,16.61,1.30,.035,.15,'#a99b87');
            for (let n=-1;n<=1;n++)
                spectacleFrame(b,ox+dx+n*.39,y+.105,16.72,1.13,n===0?'#715349':'#4d514a');
        }
        b.box(ox + dx, .68, 16.51, 1.61, .27, .10, '#647675');
    }
    b.box(ox + 2.72, 1.39, 16.47, 1.56, 2.74, .16, '#3c5058');
    b.box(ox + 2.72, 1.70, 16.57, 1.16, 1.58, .045, '#6b8b8b');
    b.box(ox + 3.18, 1.16, 16.63, .066, .48, .095, '#c7c7b1');
    b.box(ox, 3.75, 16.47, 8.79, .65, 1.33, '#374c50');
    b.box(ox, 3.37, 16.99, 8.38, .075, .16, '#8e8e80');
    b.box(ox, 4.58, 16.09, 8.85, 1.37, .55, '#344951');
    sign('ГОРОДСКАЯ ОПТИКА', 'ПОДБОР ОЧКОВ · РЕМОНТ ОПРАВ', '#f0e4c3', '#525d51', ox, 4.58, 16.39, 8.60, 1.23, 0, '24');
    b.box(ox - 4.40, 4.57, 16.35, .09, 1.34, .11, '#aaa189');
    sign('ПРИЁМ', '09—19 · ПН—СБ', '#e8c38a', '#49625d', ox + .68, 1.78, 16.60, 1.02, .47);
    const sx = world_street_js_1.stop.x, sz = world_street_js_1.stop.z;
    b.box(sx, 1.25, sz - 1.1, 4.75, 2.31, .13, '#647984');
    for (const dx of [-2.46, 2.46])
        b.box(sx + dx, 1.38, sz, .13, 2.77, 2.27, '#708692');
    b.box(sx, 2.82, sz, 5.37, .19, 2.58, '#71828a');
    b.box(sx, 2.95, sz, 5.41, .10, 2.61, snow);
    b.box(sx + .59, 2.28, sz - 1.0, 3.24, .87, .12, dark);
    sign('ТЕПЛО', 'ПОДОГРЕВ СИДЕНЬЯ', '#e9b88a', '#405157', sx - 1.66, 1.45, sz - .99, .83, .41);
    bench(sx, sz - .42);
    b.cyl(sx - 2.88, 1.6, sz + .25, .095, 3.20, metal);
    sign('Т', '07', '#ebedda', '#387184', sx - 2.88, 2.93, sz + .25, .55, .65);
    const fixtureView = (0, fixtures_view_js_1.createFixtures)(district);
    for (const [x, z] of world_layout_js_1.streetBins) {
        b.cyl(x, .57, z, .66, 1.15, '#667a7b');
        b.cyl(x, 1.17, z, .74, .10, '#869a95');
        b.box(x, .74, z + .32, .32, .18, .05, '#3e535c');
    }
    for (const c of world_layout_js_1.crates)
        crate(c.x, c.z, c.size, c.color, c.base);
    for (const [x, z] of world_layout_js_1.streetTrees) {
        const h = 3.4 + rnd() * 1.4;
        b.beam(x, .04, z, x + .1, h, z - .15, .20, '#666d72');
        for (let i = 0; i < 9; i++) {
            const a = rnd() * Math.PI * 2, baseY = h * (.43 + rnd() * .41), l = .65 + rnd() * 1.0;
            const tx = x + Math.sin(a) * l, tz = z + Math.cos(a) * l, ty = baseY + .68 + rnd() * .98;
            b.beam(x + .07, baseY, z, tx, ty, tz, .082, '#6d7478');
            b.beam(tx, ty, tz, tx + .22 + Math.sin(a + .4) * .45, ty + .61, tz + Math.cos(a + .4) * .4, .049, '#949ea1');
            b.beam(tx, ty, tz, tx + Math.sin(a - .6) * .40, ty + .37, tz + Math.cos(a - .6) * .43, .043, '#929b9f');
        }
    }
    for (const { x, z } of world_layout_js_1.utilityMasts) {
        b.cyl(x, 3.84, z, .21, 7.68, '#786e69');
        b.box(x, 7.11, z, 1.66, .15, .19, metal);
        if (x < 64)
            for (const zz of [-.07, .25]) {
                b.beam(x, 7.32, 23 + zz, x + 11.5, 6.84, 23 + zz, .034, '#465260');
                b.beam(x + 11.5, 6.84, 23 + zz, x + 23, 7.32, 23 + zz, .034, '#465260');
            }
    }
    const far = new world_batch_js_1.Batches(district, visibility);
    for (let n = 0; n < 48; n++) {
        const side = n % 4, x = side === 0 ? world_layout_js_1.bounds.minX - 20 - rnd() * 31 : side === 1 ? world_layout_js_1.bounds.maxX + 20 + rnd() * 31 : world_layout_js_1.bounds.minX + rnd() * (world_layout_js_1.bounds.maxX - world_layout_js_1.bounds.minX);
        const z = side === 2 ? world_layout_js_1.bounds.minZ - 21 - rnd() * 31 : side === 3 ? world_layout_js_1.bounds.maxZ + 21 + rnd() * 32 : world_layout_js_1.bounds.minZ + rnd() * (world_layout_js_1.bounds.maxZ - world_layout_js_1.bounds.minZ);
        const w = 8 + rnd() * 13, d = 8 + rnd() * 15, h = 9 + rnd() * 26;
        far.box(x, h / 2, z, w, h, d, ['#81909c', '#7e8997', '#8a929a', '#8c909b'][n % 4]);
        far.box(x, h + .13, z, w + .42, .28, d + .42, '#adb7c0');
        const rows = Math.max(3, Math.round(h / 3.6));
        for (const [px, pz, ww, angle] of [[x + w / 2 + .018, z, d, Math.PI / 2], [x - w / 2 - .018, z, d, -Math.PI / 2], [x, z + d / 2 + .018, w, 0], [x, z - d / 2 - .018, w, Math.PI]]) {
            walls.place('outer' + rows, () => (0, world_expansion_facades_js_1.workFacade)('hotel', 4, rows, 184 + rows), px, h * .5, pz, ww, h - .1, angle);
        }
    }
    for (const [x, z, h] of [[-112, world_layout_js_1.bounds.minZ - 24, 43], [-103, world_layout_js_1.bounds.minZ - 28, 37], [8, world_layout_js_1.bounds.minZ - 31, 34], [63, world_layout_js_1.bounds.minZ - 26, 48], [73, world_layout_js_1.bounds.minZ - 28, 40], [world_layout_js_1.bounds.maxX + 28, -72, 39]]) {
        far.cyl(x, h / 2, z, 3.03, h, '#9b8580');
        far.cyl(x, h - 5, z, 3.09, 3.5, '#bdc0b9');
        far.lamp(x, h + .25, z, .31, .31, .31, '#e98375');
    }
    const devices = (0, world_street_js_1.createStreetDevices)(district, b), tram = (0, world_tram_js_1.addTram)(district, b);
    b.flush();
    far.flush();
    const firstWallSheet = district.children.length;
    walls.flush();
    for (const sheet of district.children.slice(firstWallSheet)) {
        sheet.material.onBeforeCompile = shader => {
            shader.uniforms.dawnTint = dawnTint;
            shader.vertexShader = 'varying float facadeHeight;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n facadeHeight=position.y;');
            shader.fragmentShader = 'varying float facadeHeight; uniform float dawnTint;\n' + shader.fragmentShader.replace('#include <map_fragment>',
                '#include <map_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.17,1.05,.95)+vec3(.018,.008,.0),dawnTint*smoothstep(9.,22.,facadeHeight));');
        };
    }
    labels.flush();
    return { setTramCabin: tram.setCabin, setHouseDoor(open) { accessibleDoor.update(open); spill(open); }, cull(camera) { visibility.update(camera); cullRegion(camera); cullStreetDetail(camera); }, isBlocked: world_layout_js_1.isBlocked, groundHeight: world_layout_js_1.groundHeight, surfaceAt: world_layout_js_1.surfaceAt, signalGreen: world_layout_js_1.signalGreen, districtAt: world_layout_js_1.districtAt, obstacles: world_layout_js_1.obstacles, bounds: world_layout_js_1.bounds, getTramPosition: tram.getPosition, getStreetState: devices.state, getFixtureState: fixtureView.state,
        update(t, tramTime, subject, broken = fixtures_js_1.intact, power = 'normal', daylight = 0, calendar = districtCalendarMinutes(t), wet = .65) {
            dawnTint.value = Math.max(0,1-Math.abs(calendar%1440/60-7.35)/1.3);
            const rail = tram.update(tramTime);
            poweredMarket.visible = power === 'normal' && marketOpen(calendar);
            spektrLight(daylight);
            blackoutProps(power, t);
            fixtureView.update(t, broken, subject, power, daylight, wet);
            entryLights(daylight, power);
            const dusk = THREE.MathUtils.smoothstep(1 - daylight, .18, .82);
            windowLayer.visible = dusk > .012;
            if (windowLayer.visible)
                for (const pane of windowLayer.children)
                    pane.material.opacity = dusk * .94;
            return devices.update(t, tramTime, rail.phase, subject);
        }
    };
}
