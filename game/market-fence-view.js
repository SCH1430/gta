"use strict";

const T = require("../engine/three.module.min.js");
const { Batch } = require("./model-geometry.js");
const { groundHeight } = require("./world-layout.js");
const { boardCount, fenceDamage, fenceLean } = require("./market-fence.js");

function createPicket(group, prop) {
    const root = new T.Group(), rails = new Batch(), boards = new Batch(), { w, h, d } = prop;
    root.name = 'Секция рыночной ограды';
    group.add(root);
    for (const x of [-w * .43, w * .43]) {
        rails.box(x, h / 2, 0, .062, h, .078, '#5b6d72');
        rails.box(x, .025, 0, .132, .046, .13, '#495758');
    }
    for (const y of [.25, .63])
        rails.box(0, y, -.024, w, .091, d * .48, '#93684d');
    const frame = rails.mesh();
    root.add(frame);
    boards.box(0, -.023, 0, .142, .594, .046, '#ba8961');
    boards.box(0, .276, 0, .124, .063, .043, '#c1986a', [0, 0, -.15]);
    boards.box(-.042, -.015, .024, .016, .51, .004, '#d8aa78');
    for (const y of [-.17, .21])
        boards.box(.023, y, .025, .013, .014, .005, '#676766');
    const template = boards.mesh(), slats = new T.InstancedMesh(template.geometry, template.material, boardCount);
    slats.name = 'Планки рыночной ограды';
    slats.instanceMatrix.setUsage(T.DynamicDrawUsage);
    slats.frustumCulled = false;
    root.add(slats);
    const pose = new T.Object3D();
    pose.rotation.order = 'YXZ';
    const tints = ['#f3e5d4', '#f1d3b8', '#fff1dc', '#dcbea3'].map(tint => new T.Color(tint));
    for (let i = 0; i < boardCount; i++)
        slats.setColorAt(i, tints[i % tints.length]);
    let lastAt, lastLean, lastX, lastZ;
    return (p, now) => {
        const damage = fenceDamage(p), age = damage ? Math.max(0, now - damage.at) : 0;
        const lean = damage ? fenceLean(damage, p.broken, Math.min(now, damage.at + 2)) : 0;
        if (lastAt === damage?.at && lastLean === lean && lastX === p.x && lastZ === p.z && (!p.broken || age > 1.3))
            return;
        lastAt = damage?.at;
        lastLean = lean;
        lastX = p.x;
        lastZ = p.z;
        const y = groundHeight(p.x, p.z);
        root.position.set(p.x, y, p.z);
        frame.rotation.x = lean;
        frame.position.y = .055 * Math.abs(Math.sin(lean));
        const boardY = .422, boardZ = .043, cos = Math.cos(lean), sin = Math.sin(lean);
        for (let i = 0; i < boardCount; i++) {
            const x = (i / (boardCount - 1) - .5) * w * .83, strip = i - (damage?.board ?? -8);
            const release = .075 + Math.abs(strip) * .055, elapsed = age - release;
            if (p.broken && Math.abs(strip) <= 1 && elapsed > 0) {
                const slide = 1 - Math.exp(-4.5 * elapsed), flight = Math.min(1, elapsed / (.38 + Math.abs(strip) * .045));
                const atRelease = fenceLean(damage, true, damage.at + release);
                const side = damage.side, travelX = x + strip * slide * .39;
                const travelZ = boardY * Math.sin(atRelease) + boardZ * Math.cos(atRelease) + side * slide * (1.06 + .25 * Math.abs(strip));
                const bounce = Math.sin(Math.PI * flight) * (.29 + .065 * Math.abs(strip));
                const floor = groundHeight(p.x + travelX, p.z + travelZ) - y + .028;
                const releaseY = boardY * Math.cos(atRelease) - boardZ * Math.sin(atRelease) + .055 * Math.abs(Math.sin(atRelease));
                pose.position.set(travelX, releaseY + (floor - releaseY) * flight + bounce, travelZ);
                pose.rotation.set(atRelease + flight * (side * Math.PI / 2 - atRelease) + Math.sin(Math.PI * flight) * side * 1.4, flight * (.22 + strip * .40), Math.sin(Math.PI * flight) * strip * .7);
            }
            else {
                pose.position.set(x, boardY * cos - boardZ * sin + frame.position.y, boardY * sin + boardZ * cos);
                pose.rotation.set(lean, 0, 0);
            }
            pose.updateMatrix();
            slats.setMatrixAt(i, pose.matrix);
        }
        slats.instanceMatrix.needsUpdate = true;
    };
}

module.exports = { createPicket };
