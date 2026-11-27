"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrashDebris = createCrashDebris;
const T = require("../engine/three.module.min.js");
const street_incidents_js_1 = require("./street-incidents.js");
const world_layout_js_1 = require("./world-layout.js");
const perCrash = 7;
const material = new T.MeshLambertMaterial({ color: 0xffffff });
const geometry = new T.IcosahedronGeometry(1, 0);
const colors = ['#a4bebf', '#6c8489', '#4a525a', '#38383c', '#b8c0ba'].map(value => new T.Color(value));
function createCrashDebris(scene) {
    const mesh = new T.InstancedMesh(geometry, material, street_incidents_js_1.streetCrashLimit * perCrash);
    mesh.name = 'Обломки кузова и стекла';
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.count = 0;
    mesh.visible = false;
    scene.add(mesh);
    const transform = new T.Object3D();
    return (crashes, now, focus) => {
        let index = 0;
        for (const crash of crashes) {
            if (!(0, street_incidents_js_1.leavesDebris)(crash) || (crash.x - focus.x) ** 2 + (crash.z - focus.z) ** 2 > 57 ** 2)
                continue;
            const age = now - crash.at;
            if (age < 0 || age >= street_incidents_js_1.streetCrashLifetime)
                continue;
            const flight = Math.min(1, age / .48), spread = .26 + .74 * flight;
            const shrink = Math.min(1, (street_incidents_js_1.streetCrashLifetime - age) / 1.1);
            const seed = crash.x * .78 + crash.z * 1.31;
            for (let i = 0; i < perCrash; i++) {
                const side = seed + i * 2.39996, radius = spread * (0, street_incidents_js_1.crashRadius)(crash) * (.32 + .10 * i);
                const x = crash.x + Math.cos(side) * radius, z = crash.z + Math.sin(side) * radius;
                const jump = Math.sin(Math.PI * flight) * (.14 + .037 * i);
                transform.position.set(x, (0, world_layout_js_1.groundHeight)(x, z) + .024 + jump, z);
                transform.rotation.set((1 - flight) * i * .53, side + flight * 1.7, (1 - flight) * side * .42 + .16);
                transform.scale.set((.042 + i * .009) * shrink, .018 * shrink, (.099 - i * .004) * shrink);
                transform.updateMatrix();
                mesh.setMatrixAt(index, transform.matrix);
                mesh.setColorAt(index++, colors[i % colors.length]);
            }
        }
        mesh.count = index;
        mesh.visible = index > 0;
        if (index) {
            mesh.instanceMatrix.needsUpdate = true;
            mesh.instanceColor.needsUpdate = true;
        }
    };
}
