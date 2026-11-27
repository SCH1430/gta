"use strict";

const THREE = require('../engine/three.module.min.js');
const { createPerson } = require('./model-people.js');

const cube = new THREE.BoxGeometry();
const disc = new THREE.CylinderGeometry(1, 1, 1, 16);
const cloud = new THREE.IcosahedronGeometry(1, 0);
const enamel = color => new THREE.MeshStandardMaterial({ color, roughness: .82 });
const glow = (color, options = {}) => new THREE.MeshBasicMaterial({ color, ...options });

function mesh(group, geometry, material, x, y, z, w, h, d) {
    const detail = new THREE.Mesh(geometry, material);
    detail.position.set(x, y, z);
    detail.scale.set(w, h, d);
    group.add(detail);
    return detail;
}

function box(group, material, x, y, z, w, h, d) {
    return mesh(group, cube, material, x, y, z, w, h, d);
}

function place(scene, x, z, name) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.name = name;
    scene.add(group);
    return group;
}

function sign(group, x, y, z, w, h, rows, accent) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1e313a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(13, 13, 486, 230);
    ctx.textAlign = 'center';
    rows.forEach((row, index) => {
        ctx.fillStyle = index === 0 ? '#f2eee2' : accent;
        ctx.font = `700 ${index === 0 ? 43 : 34}px system-ui`;
        ctx.fillText(row, 256, 100 + index * 60, 462);
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const face = mesh(group, new THREE.PlaneGeometry(), glow('#ffffff', { map: texture }), x, y, z, w, h, 1);
    face.rotation.y = Math.PI;
}

function peopleAround(group, positions) {
    return positions.map(({ x, z, yaw, variant }) => {
        const person = createPerson('resident', variant);
        person.root.position.set(x, .055, z);
        person.root.rotation.y = yaw;
        group.add(person.root);
        return person;
    });
}

function createHockeyView(scene, skver, hockey, board) {
    const rink = place(scene, hockey.x, hockey.z, 'Ледовая арена · площадка');
    const scores = place(scene, board.x, board.z, 'Ледовая арена · доска результатов');
    const direction = place(scene, skver.x + .9, skver.z - .8, 'Сквер Полярников · указатель');
    const metal = enamel('#435963'), white = enamel('#c3d7df'), boards = enamel('#184959');
    const ice = enamel('#8eb3c2'), stripe = glow('#d6f1ee'), red = enamel('#a34548');
    const dark = enamel('#213943'), amber = glow('#ffc67f'), muted = glow('#42585b');
    const scoreLight = glow('#80e8c8'), puckMaterial = enamel('#182730');
    let players;
    let practiceTime = 0;

    box(rink, ice, 0, .014, 0, 12.4, .055, 16.6);
    box(rink, white, 0, .02, .02, 12.7, .025, 16.9);
    box(rink, stripe, 0, .047, hockey.launch + .64, 11.7, .008, .08);
    box(rink, red, 0, .047, -.6, 11.7, .009, .095);
    box(rink, red, 0, .48, hockey.goal + .37, 10.2, .08, .085);
    box(rink, red, 0, 1.14, hockey.goal + .37, 10.2, .08, .085);
    box(rink, dark, 0, .61, hockey.goal + .8, 10.4, 1.19, .12);
    box(rink, white, 0, .053, hockey.goal - .88, 11.7, .009, .075);
    for (const x of [-5.02, 5.02]) {
        box(rink, red, x, .66, hockey.goal + .29, .12, 1.33, .13);
        box(rink, boards, x * 1.11, .22, 2.07, .19, .41, 11.88);
        box(rink, white, x * 1.11, .43, 2.07, .2, .075, 11.88);
        box(rink, metal, x * 1.08, 1.82, hockey.goal + .73, .11, 3.65, .12);
        const lamp = box(rink, muted, x * 1.08, 3.61, hockey.goal + .57, .66, .16, .46);
        lamp.name = 'rink lamp';
    }
    const lamps = rink.children.filter(node => node.name === 'rink lamp');
    const pads = hockey.lanes.map(lane => {
        const mark = box(rink, boards, lane, .052, hockey.launch, 1.92, .011, .82);
        box(rink, stripe, lane, .057, hockey.launch, .24, .01, .33);
        box(rink, boards, lane, .053, -.03, .10, .01, 4.47);
        const circle = mesh(rink, disc, stripe, lane, .61, hockey.goal + .67, .5, .09, .5);
        circle.rotation.x = Math.PI / 2;
        const center = mesh(rink, disc, boards, lane, .61, hockey.goal + .61, .29, .095, .29);
        center.rotation.x = circle.rotation.x;
        return mark;
    });
    const blocker = new THREE.Group();
    blocker.position.z = hockey.goal - 1;
    rink.add(blocker);
    box(blocker, red, 0, .41, 0, 2.35, .76, .27);
    for (const x of [-.67, 0, .67]) box(blocker, white, x, .43, -.151, .155, .54, .035).rotation.z = -.42;
    const puck = mesh(rink, disc, puckMaterial, 0, .15, hockey.launch, .22, .125, .22);
    const puckRim = mesh(rink, disc, amber, 0, .18, hockey.launch, .224, .038, .224);

    for (const x of [-1.12, 1.12]) box(scores, metal, x, .79, 0, .105, 1.58, .13);
    box(scores, dark, 0, 1.5, 0, 2.68, 1.58, .15);
    sign(scores, 0, 1.87, -.08, 2.58, .68, ['СЕВЕР-8', 'ЛУЧШИЕ СЕРИИ'], '#80e8c8');
    const lights = Array.from({ length: 3 }, (_, index) => Array.from({ length: 3 }, (_, shot) =>
        mesh(scores, disc, muted, -.75 + shot * .75, 1.48 - index * .27, -.10, .084, .048, .084)));
    for (const lamp of lights.flat()) lamp.rotation.x = Math.PI / 2;

    box(direction, metal, 0, .74, 0, .12, 1.48, .14);
    box(direction, dark, 0, 1.47, 0, 1.52, .58, .11);
    sign(direction, 0, 1.47, -.061, 1.51, .565, ['ЛЕДОВАЯ АРЕНА', 'ПРЯМО ПО ТРОПЕ'], '#a8dfd4');
    box(rink, metal, -7.35, .2, 2.55, .52, .34, 2.6);
    box(rink, enamel('#7b6957'), -7.35, .403, 2.55, .67, .10, 2.6);

    return {
        drawScores(results) {
            lights.forEach((row, rank) => row.forEach((lamp, shot) => {
                lamp.material = results[rank] === undefined ? muted : shot < results[rank] ? scoreLight : dark;
            }));
        },
        drawHockey(near, evening, round, lane, flyingPuck, blockerX, dt) {
            rink.visible = scores.visible = near;
            if (!near) return;
            for (const lamp of lamps) lamp.material = evening ? scoreLight : muted;
            pads.forEach((mark, index) => { mark.material = round && hockey.lanes[index] === lane ? amber : boards; });
            blocker.position.x = blockerX;
            const used = flyingPuck ?? (round && lane !== null ? { lane, z: hockey.launch + .78 } : null);
            puck.visible = puckRim.visible = !!used;
            if (used) {
                puck.position.set(used.lane, .115, used.z);
                puckRim.position.set(used.lane, .169, used.z);
            }
            if (evening && !players && typeof document !== 'undefined') {
                players = peopleAround(rink, [
                    { x: -7.32, z: -.9, yaw: -1.64, variant: 5 },
                    { x: 6.82, z: .65, yaw: 1.58, variant: 11 }
                ]);
                for (const player of players) {
                    box(player.root, enamel('#a28462'), .34, .49, -.24, .037, 1.04, .039).rotation.x = -.28;
                    box(player.root, enamel('#31383e'), .34, .065, -.46, .045, .066, .31);
                }
            }
            if (players) {
                practiceTime += dt;
                players.forEach((player, index) => {
                    player.root.visible = evening;
                    if (!evening) return;
                    const sway = practiceTime * .61 + index * Math.PI;
                    player.root.position.z = (index ? .65 : -.9) + Math.sin(sway) * 1.85;
                    player.root.rotation.y = index ? 1.60 + Math.cos(sway) * .36 : -1.60 - Math.cos(sway) * .36;
                    player.update(dt, .95 * Math.abs(Math.cos(sway)));
                });
            }
        }
    };
}

function createWaterView(scene, dam) {
    const work = place(scene, dam.gateX, dam.gateZ, 'Водосброс № 2 · канал');
    const lookout = place(scene, dam.x, dam.z, 'Водосброс № 2 · смотровая');
    const concrete = enamel('#757f84'), steel = enamel('#405861'), rail = enamel('#89aeb2');
    const gate = enamel('#243d45'), back = enamel('#172b37'), panel = enamel('#273b44');
    const amber = glow('#ffbf64'), standby = enamel('#705336');
    const water = glow('#8bcdde', { transparent: true, opacity: .88, depthWrite: false });
    const stream = glow('#bce5ea', { transparent: true, opacity: .82, depthWrite: false });
    let spectators;

    box(work, concrete, 0, .04, -2.4, 8.9, .08, 5.75);
    box(work, back, 0, .092, -2.71, 7.23, .05, 5.17);
    box(work, steel, 0, 1.53, -.22, 7.23, 3.06, .39);
    box(work, back, 0, 1.34, -.431, 6.21, 2.16, .09);
    box(work, rail, 0, 2.82, -.47, 7.71, .2, .42);
    box(work, water, 0, .138, -2.74, 7.03, .022, 5.04).name = 'water pool';
    const shutters = [], bulbs = [];
    for (const x of [-2, 0, 2]) {
        shutters.push(box(work, gate, x, 1.32, -.518, 1.84, 1.96, .09));
        box(work, rail, x, 1.42, -.583, .12, 2.35, .11);
    }
    for (const x of [-4.1, 4.1]) {
        box(work, concrete, x, .38, -2.45, .45, .76, 5.52);
        box(work, steel, x, 1.76, -.61, .22, 3.52, .24);
        bulbs.push(box(work, standby, x, 3.49, -.75, .55, .22, .38));
    }
    const pool = work.getObjectByName('water pool');
    const jets = Array.from({ length: 12 }, (_, index) => {
        const jet = box(work, index % 3 ? water : stream, 0, 0, 0, .31, .44, 1);
        jet.rotation.x = -.55;
        return jet;
    });
    const steam = Array.from({ length: 10 }, () => mesh(work, cloud,
        glow('#e8f1ec', { transparent: true, opacity: .16, depthWrite: false }), 0, 0, 0, .64, .38, .48));

    box(lookout, concrete, 0, .019, 0, 5.88, .052, 3.48);
    box(lookout, rail, 2.14, .77, .48, .10, .10, 2.92);
    for (const z of [-.94, 1.92]) box(lookout, steel, 2.14, .43, z, .11, .86, .11);
    box(lookout, steel, -.84, .62, .94, .18, 1.24, .15);
    box(lookout, panel, -.84, 1.22, .94, 1.62, .86, .18);
    sign(lookout, -.84, 1.22, .845, 1.59, .82, ['ВОДОСБРОС № 2', 'МЕСТНОЕ РАДИО'], '#ffbf64');
    box(lookout, steel, -.28, 1.67, .94, .043, .61, .042).rotation.z = -.24;

    return function drawWater(near, phase, time, dt) {
        work.visible = lookout.visible = near;
        if (!near) return;
        const running = phase === 'running';
        for (const bulb of bulbs) bulb.material = phase === 'idle' ? standby : amber;
        for (const shutter of shutters) shutter.position.y = running ? 2.26 : 1.32;
        pool.visible = running;
        jets.forEach((jet, index) => {
            jet.visible = running;
            if (!running) return;
            const t = (time * 2.15 + index * .31) % 1;
            const x = (Math.floor(index / 4) - 1) * 2 + ((index % 4) - 1.5) * .30;
            jet.position.set(x, 1.45 * (1 - t * t) + .12, -.54 - 3.75 * t);
            jet.scale.set(.31 + t * .55, .21 + .16 * t, .9 + .68 * t);
        });
        steam.forEach((puff, index) => {
            puff.visible = running;
            if (!running) return;
            const t = (time * .39 + index * .171) % 1;
            puff.position.set((index - 4.5) * .62 + t * 1.12, .22 + t * 2.9, -3.45 - t * 1.2);
            puff.scale.set(.51 + .75 * t, .36 + .24 * t, .43 + .59 * t);
            puff.material.opacity = Math.sin(t * Math.PI) * .35;
        });
        if (phase !== 'idle' && !spectators && typeof document !== 'undefined') {
            spectators = peopleAround(lookout, [
                { x: 1.50, z: 1.46, yaw: -2.05, variant: 7 },
                { x: 1.47, z: -1.07, yaw: -2.24, variant: 10 },
                { x: .24, z: 1.72, yaw: -2.08, variant: 1 }
            ]);
        }
        spectators?.forEach((person, index) => {
            person.root.visible = phase === 'warning' ? index < 2 : running;
            if (person.root.visible) person.update(dt, 0);
        });
    };
}

function createOutskirtsView(scene, { skver, hockey, scoreBoard, dam }) {
    return { ...createHockeyView(scene, skver, hockey, scoreBoard), drawWater: createWaterView(scene, dam) };
}

module.exports = { createOutskirtsView };
