"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMotorWorld = createMotorWorld;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const fixtures_js_1 = require("./fixtures.js");
const street_incidents_view_js_1 = require("./street-incidents-view.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_snow_js_1 = require("./vehicle-snow.js");
const { createPicket } = require("./market-fence-view.js");
function furnishing(p) {
    const b = new model_geometry_js_1.Batch(), { w, h, d } = p;
    if (p.kind === 'cart') {
        for (const x of [-w * .39, w * .39])
            for (const z of [-d * .39, d * .39])
                b.ball(x, .09, z, .085, .09, .063, '#2f373c');
        b.box(0, .23, 0, w, .09, d, '#527773');
        for (const z of [-d * .43, d * .43])
            b.rod([w * .42, .25, z], [w * .42, h, z], .022, '#9aaca6');
        b.rod([w * .42, h, -d * .43], [w * .42, h, d * .43], .026, '#38484c');
        for (let i = 0; i < 3; i++)
            b.box(-.18 + i * .21, .31, 0, .15, .1, d * .87, '#967d5e');
    }
    else if (p.kind === 'box') {
        b.box(0, h / 2, 0, w, h, d, '#ab8761');
        for (const x of [-.22, .22]) {
            b.box(x, h + .005, 0, .034, .013, d, '#65584c');
            b.box(x, h / 2, d / 2, .034, h, .014, '#685e51');
        }
        b.box(.09, .25, d / 2 + .01, .21, .115, .015, '#dccc9b');
    }
    else {
        b.box(0, h / 2, 0, w, h, d, '#496663');
        for (const z of [-d / 2, d / 2])
            for (let i = 0; i < 15; i++)
                b.box(-w * .47 + i * w * .066, h * .54, z, .035, h * .84, .032, '#69847b');
        for (const x of [-w * .47, w * .47])
            for (const z of [-d * .49, d * .49])
                b.box(x, h / 2, z, .075, h, .08, '#a18b68');
        b.box(.8, .89, d / 2 + .028, .48, .17, .02, '#d9bc78');
    }
    return b.mesh();
}
function createMotorWorld(scene) {
    const group = new T.Group();
    group.name = 'market-props-and-driving-course';
    scene.add(group);
    const crashDebris = (0, street_incidents_view_js_1.createCrashDebris)(group);
    const props = (0, vehicle_road_js_1.streetFurniture)();
    const parts = props.map(p => {
        if (p.kind === 'picket')
            return createPicket(group, p);
        const mesh = furnishing(p);
        group.add(mesh);
        return (prop) => mesh.position.set(prop.x, (0, world_layout_js_1.groundHeight)(prop.x, prop.z), prop.z);
    });
    const b = new world_batch_js_1.Batches(group), signs = new world_batch_js_1.Panels(group), { x, z } = vehicle_road_js_1.chargingPost;
    const sign = (key, title, sub, px, py, pz, w, h, angle = 0) => {
        b.box(px, py, pz, w + .05, h + .05, .13, '#344a50', angle);
        signs.place(key, () => (0, world_textures_js_1.signTexture)(title, sub, '#f1d394', '#293d46', w / h), px + Math.sin(angle) * .071, py, pz + Math.cos(angle) * .071, w, h, angle);
    };
    b.box(x, .09, z, .68, .18, .64, '#677774');
    b.box(x, .84, z, .46, 1.34, .40, '#487e77');
    b.lamp(x, 1.6, z, .49, .12, .42, '#8acfc0');
    sign('charger', 'ЗАРЯД 77', 'ПОСТ 01', x, 1.12, z + .215, .39, .33);
    for (const side of [-1, 1])
        b.box(vehicle_road_js_1.canopy.x + side * (vehicle_road_js_1.canopy.w / 2 + .04), vehicle_road_js_1.canopy.bottom * .50, vehicle_road_js_1.canopy.z + .78, .085, vehicle_road_js_1.canopy.bottom, .09, '#546365');
    b.box(vehicle_road_js_1.canopy.x, vehicle_road_js_1.canopy.bottom + .065, vehicle_road_js_1.canopy.z, vehicle_road_js_1.canopy.w + .16, .13, vehicle_road_js_1.canopy.d, '#526c72');
    sign('duck', '1,47 М', 'НИЗКИЙ ПРОХОД', vehicle_road_js_1.canopy.x, vehicle_road_js_1.canopy.bottom + .14, vehicle_road_js_1.canopy.z + vehicle_road_js_1.canopy.d / 2, 1.28, .24);
    b.box(vehicle_road_js_1.course.x, .012, vehicle_road_js_1.course.z, vehicle_road_js_1.course.w, .024, vehicle_road_js_1.course.d, '#384956');
    b.box(vehicle_road_js_1.testIce.x, .032, vehicle_road_js_1.testIce.z, vehicle_road_js_1.testIce.w, .028, vehicle_road_js_1.testIce.d, '#819aa9');
    for (let i = 0; i < 17; i++)
        b.box(vehicle_road_js_1.testIce.x - 2.25 + (i * 7 % 13) * .34, .052, vehicle_road_js_1.testIce.z - 3.7 + (i * 5 % 17) * .43, .055, .008, .26 + i % 5 * .15, '#abb8c1', i * .7);
    b.box(-76.35, .13, -55.625, 1.3, .24, 2.75, '#89918e');
    const banks = new model_geometry_js_1.Batch();
    for (const { x, z, w, d, h } of vehicle_snow_js_1.impactSnowbanks) {
        const y = (0, world_layout_js_1.groundHeight)(x, z);
        banks.ball(x, y + .07, z, w * .52, .18, d * .61, '#8a959d');
        for (let i = 0; i < 7; i++) {
            const taper = Math.sin(Math.PI * (i + .68) / 7.3), px = x + (i - 3) * w * .126;
            banks.ball(px, y + h * .15 + taper * h * .12, z + Math.sin(i * 2.1) * d * .11, w * (.097 + taper * .055), h * (.39 + taper * .32), d * (.31 + taper * .19), i % 3 === 0 ? '#bcc6cb' : '#cbd3d6', [0, Math.sin(i * 1.5) * .2, .06 * Math.cos(i)]);
        }
    }
    const snowbanks = banks.mesh();
    snowbanks.name = 'Снежные валы автодрома';
    group.add(snowbanks);
    for (let i = 0; i < 3; i++)
        b.box(-76.35, .254, -56.65 + i * .9, 1.2, .009, .13, '#b59b6a');
    for (let i = 0; i < 7; i++)
        b.box(-82.5 + i * .47, .048, -61, .22, .01, 3.0, i % 2 ? '#364951' : '#b4bab1');
    for (let i = 0; i < vehicle_road_js_1.courseGates.length - 1; i++) {
        const [gx, gz] = vehicle_road_js_1.courseGates[i];
        if (i === 6)
            continue;
        for (const side of [-1, 1]) {
            const px = gx, pz = gz + side * 2.15;
            b.box(px, .065, pz, .48, .13, .38, '#394a4d');
            b.piece('taper', px, .40, pz, .33, .67, .33, '#bb754a');
            b.cyl(px, .45, pz, .205, .08, '#e4c69b');
        }
    }
    const swath = new T.InstancedMesh(new T.PlaneGeometry(2.26, 2.45), new T.MeshBasicMaterial({
        color: '#56646a', transparent: true, opacity: .64, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2
    }), 220);
    group.add(swath);
    swath.count = 0;
    swath.name = 'snow-cleared-lanes';
    swath.frustumCulled = false;
    const stripePose = new T.Object3D();
    stripePose.rotation.order = 'YXZ';
    stripePose.rotation.x = -Math.PI / 2;
    let stripeVersion = -1;
    const marker = new T.Mesh(new T.TorusGeometry(.42, .059, 6, 18), new T.MeshBasicMaterial({ color: '#ffbc70' }));
    group.add(marker);
    marker.visible = false;
    for (const dx of [-1.23, 1.23])
        b.box(-81 + dx, 1.06, -69.2, .11, 2.12, .1, '#618084');
    sign('track', 'АВТОДРОМ', 'ВОСЬМЁРКА  /  ТОРМОЖЕНИЕ', -81, 1.87, -69.2, 3.42, .70);
    b.flush();
    signs.flush();
    const footBatch = new model_geometry_js_1.Batch();
    footBatch.box(0, .115, 0, .49, .23, .49, '#686f70');
    for (const px of [-.17, .17])
        for (const pz of [-.17, .17])
            footBatch.box(px, .24, pz, .045, .03, .045, '#9d9c88');
    footBatch.box(0, .30, 0, .12, .15, .13, '#49545a');
    const base = footBatch.mesh(), feet = new Map();
    const cable = new T.InstancedMesh(new T.CylinderGeometry(.028, .028, 1, 6), new T.MeshLambertMaterial({ color: '#bd8a4f' }), 3);
    const cableNodes = Array.from({ length: 4 }, () => new T.Vector3()), cablePose = new T.Object3D(), cableAxis = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    group.add(cable);
    cable.frustumCulled = false;
    cable.visible = false;
    return { updateCrashDebris: crashDebris, updateFences(fences, now) {
            props.forEach((p, i) => {
                if (p.kind === 'picket') {
                    const saved = fences.find(fence => fence.id === p.id);
                    parts[i](saved ? { ...p, ...saved } : p, now);
                }
            });
        }, update(sim, _dt) {
            crashDebris(sim.streetIncidents.crashes, sim.elapsed, sim.hero);
            const snow = sim.motorPool.snow;
            if (stripeVersion !== snow.revision) {
                stripeVersion = snow.revision;
                swath.count = snow.patches.length;
                snow.patches.forEach((p, index) => {
                    stripePose.position.set(p.x, (0, world_layout_js_1.groundHeight)(p.x, p.z) + .017, p.z);
                    stripePose.rotation.y = p.yaw;
                    stripePose.updateMatrix();
                    swath.setMatrixAt(index, stripePose.matrix);
                });
                swath.instanceMatrix.needsUpdate = true;
            }
            sim.motorPool.props.forEach((p, i) => parts[i](p, sim.elapsed));
            for (const id in sim.brokenFixtures)
                if (!feet.has(id)) {
                    const f = fixtures_js_1.fixturesById.get(id);
                    if (!f)
                        continue;
                    const m = base.clone();
                    m.position.set(f.x, (0, world_layout_js_1.groundHeight)(f.x, f.z), f.z);
                    feet.set(id, m);
                    group.add(m);
                }
            for (const [id, m] of feet)
                m.visible = !!sim.brokenFixtures[id];
            const c = sim.cars.find(v => v.systems?.plugged);
            cable.visible = !!c;
            if (c) {
                const X = c.x + Math.cos(c.yaw) * .94 + Math.sin(c.yaw) * 1.26, Z = c.z - Math.sin(c.yaw) * .94 + Math.cos(c.yaw) * 1.26;
                cableNodes[0].set(x, .93, z + .23);
                cableNodes[1].set(x + .38, .07, z + .45);
                cableNodes[2].set((x + X) / 2, .055, (z + Z) / 2);
                cableNodes[3].set(X, c.y + .94, Z);
                for (let i = 0; i < 3; i++) {
                    const a = cableNodes[i], b = cableNodes[i + 1];
                    cableAxis.subVectors(b, a);
                    cablePose.position.addVectors(a, b).multiplyScalar(.5);
                    cablePose.scale.y = cableAxis.length();
                    cablePose.quaternion.setFromUnitVectors(up, cableAxis.normalize());
                    cablePose.updateMatrix();
                    cable.setMatrixAt(i, cablePose.matrix);
                }
                cable.instanceMatrix.needsUpdate = true;
            }
            const tr = sim.motorPool.trial, gate = tr && !tr.finish ? vehicle_road_js_1.courseGates[Math.min(tr.gate, vehicle_road_js_1.courseGates.length - 1)] : undefined;
            marker.visible = !!gate;
            if (gate) {
                marker.position.set(gate[0], 1.6 + .10 * Math.sin(4 * sim.elapsed), gate[1]);
                marker.rotation.y = sim.elapsed * 1.25;
            }
        } };
}
