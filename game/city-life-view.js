"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepairVisual = createRepairVisual;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_layout_js_1 = require("./world-layout.js");
const model_people_js_1 = require("./model-people.js");
const human_cloth_js_1 = require("./human-cloth.js");
const orange = '#c97837', metal = '#536267', white = '#d4d3bd', rubber = '#30383d';
const smooth = (a, b, x) => T.MathUtils.smoothstep(x, a, b);
function createRepairVisual(scene) {
    const base = new T.Group(), truck = new T.Group(), boom = new T.Group(), basket = new T.Group(), cones = new T.Group(), flash = new T.Group();
    base.name = 'Горсвет · выездная бригада';
    base.add(truck, cones);
    truck.add(boom, basket, flash);
    scene.add(base);
    base.visible = false;
    const shutter = new T.Group(), slats = new world_batch_js_1.Batches(shutter), g = world_layout_js_1.buildings.garage;
    shutter.name = 'Роллета мастерской Тони';
    shutter.position.set(g.x + g.w / 2 + .262, 3.055, g.z - g.d * .27);
    scene.add(shutter);
    for (let i = 0; i < 12; i++) {
        slats.box(0, -.12 - i * .240, 0, .062, .235, 4.63, i % 2 ? '#527074' : '#5b797c');
        slats.box(.037, -.215 - i * .240, 0, .014, .022, 4.59, '#41595d');
    }
    slats.box(.068, -2.78, 0, .09, .073, .47, '#b2b9b4');
    slats.flush();
    const b = new world_batch_js_1.Batches(truck);
    b.box(0, .64, 0, 1.85, .60, 4.3, metal);
    b.box(0, 1.30, -1.16, 1.78, 1.39, 1.56, orange);
    b.box(0, 1.62, -1.952, 1.51, .52, .035, '#587e88');
    for (const side of [-1, 1]) {
        b.box(side * .899, 1.63, -1.10, .025, .52, 1.05, '#52717a');
        b.box(side * .91, 1.24, -1.02, .04, .10, 1.34, white);
        for (const z of [-1.42, 1.35])
            b.piece('round', side * .89, .43, z, .76, .28, .76, rubber, 0, Math.PI / 2);
        b.lamp(side * .66, .96, -1.97, .33, .16, .035, '#ffdf9f');
        b.lamp(side * .69, .79, 2.16, .23, .17, .045, '#bd5942');
    }
    b.box(0, 1.0, .97, 1.83, .40, 2.18, '#949891');
    b.cyl(0, 1.35, .52, .87, .28, metal);
    b.flush();
    const arm = new world_batch_js_1.Batches(boom);
    arm.box(0, .08, 1.24, .32, .30, 2.70, orange);
    arm.box(0, .11, 2.93, .23, .22, 1.22, white);
    arm.flush();
    const rail = new world_batch_js_1.Batches(basket);
    rail.box(0, 0, 0, 1.03, .15, .83, '#6d7471');
    for (const x of [-.48, .48])
        for (const z of [-.37, .37])
            rail.cyl(x, .42, z, .055, .76, orange);
    for (const x of [-.48, .48])
        rail.box(x, .81, 0, .052, .06, .80, orange);
    for (const z of [-.37, .37])
        rail.box(0, .81, z, 1.02, .055, .055, orange);
    rail.box(.29, .978, -.29, .20, .090, .13, '#5e696b', -.12);
    for (const x of [.24, .30, .35])
        rail.cyl(x, 1.035, -.293, .024, .033, x === .24 ? '#c98447' : '#3a4a4f');
    rail.flush();
    let worker, previous = 0;
    let syncHelmet;
    const consolePoint = new T.Vector3(), floor = () => .075;
    function createWorker() {
        const actor = (0, model_people_js_1.createPerson)('resident', 8);
        actor.root.name = 'Электромонтёр горсвета';
        actor.root.position.set(.024, .075, .035);
        const helmet = new human_cloth_js_1.Surface();
        helmet.loft([[.203, .103, .119, .116], [.218, .106, .129, .118], [.251, .103, .118, .114],
            [.285, .089, .102, .093], [.304, .056, .066, .057], [.313, .022, .030, .025]], '#e3b44f', 0, 20, .91, undefined, true);
        helmet.loft([[.199, .108, .145, .118], [.204, .113, .150, .121], [.211, .109, .143, .118]], '#d79e40', 0, 20, .92, undefined, true);
        const hat = helmet.mesh('Каска электромонтёра');
        hat.position.set(0, -.034, -.008);
        actor.root.getObjectByName('neck')?.add(hat);
        const lod = actor.root.children[0], far = lod.levels[1].object, farHat = hat.clone();
        farHat.matrixAutoUpdate = false;
        far.add(farHat);
        syncHelmet = () => {
            hat.updateWorldMatrix(true, false);
            far.updateWorldMatrix(true, false);
            farHat.matrix.copy(far.matrixWorld).invert().multiply(hat.matrixWorld);
            farHat.matrixWorldNeedsUpdate = true;
        };
        basket.add(actor.root);
        return actor;
    }
    boom.position.set(0, 1.47, .50);
    const safety = new world_batch_js_1.Batches(cones);
    for (const [x, z] of [[.85, -3.1], [-.95, -3.1], [.95, 3.13], [-1.10, 3.13]]) {
        safety.box(x, .04, z, .39, .08, .39, rubber);
        safety.piece('taper', x, .285, z, .34, .47, .34, orange);
        safety.cyl(x, .29, z, .17, .074, white);
    }
    safety.flush();
    const beacon = new world_batch_js_1.Batches(flash);
    beacon.lamp(0, 2.09, -1.16, .36, .15, .23, '#ffc467');
    beacon.flush();
    return { update(job, time, shutterOpen = 1) {
            shutter.scale.y = 1 - .95 * T.MathUtils.clamp(shutterOpen, 0, 1);
            base.visible = !!job;
            if (!job) {
                previous = time;
                return;
            }
            const t = time - job.start, approach = smooth(0, 8, t), depart = smooth(41, 49, t);
            const dx = -Math.sin(job.yaw) * 1.8, dz = -Math.cos(job.yaw) * 1.8;
            base.position.set(job.x + dx, (0, world_layout_js_1.groundHeight)(job.x + dx, job.z + dz), job.z + dz);
            base.rotation.y = job.yaw + Math.PI / 2;
            truck.position.z = 11 * (1 - approach) - 11 * depart;
            cones.visible = t > 7 && t < 42;
            flash.visible = Math.sin(t * 12) > .0;
            const raised = smooth(9, 16, t) * (1 - smooth(32, 40, t)), ang = .10 + raised * 1.03;
            boom.rotation.x = -ang;
            boom.rotation.y = raised * .62;
            const reach = 3.51 * Math.cos(ang);
            basket.position.set(Math.sin(boom.rotation.y) * reach, 1.49 + 3.51 * Math.sin(ang), .50 + Math.cos(boom.rotation.y) * reach);
            worker ??= createWorker();
            basket.localToWorld(consolePoint.set(.285, 1.05, -.292));
            const pressing = (1 - raised * .70) * (.79 + .19 * Math.cos(t * 2.8));
            worker.update(Math.min(.09, Math.max(.001, time - previous)), 0, false, {
                ground: floor, glance: raised * .76 + .16 * Math.sin(t * .41), pushDoor: { amount: pressing, target: consolePoint }
            });
            syncHelmet?.();
            previous = time;
        } };
}
