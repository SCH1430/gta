"use strict";

const T = require("../engine/three.module.min.js");
const { Batch, shell, tube } = require("./model-geometry.js");

function splitFrontShell(paint, hood, rows) {
    shell(paint, rows, '#ffffff', 'top');
    for (let i = 1; i < rows.length; i++) {
        const panel = ([z, w, , , y], side) => [side * (w * .88 - .010), y - .002, z];
        const a = rows[i - 1], b = rows[i];
        hood.quad(panel(a, -1), panel(a, 1), panel(b, 1), panel(b, -1), '#ffffff', [0, 1, 0]);
    }
}

function foldedEdge(hood) {
    const edges = new Map(), positions = hood.pos;
    const key = p => p.map(n => Math.round(n * 10000)).join(',');
    for (let i = 0; i < positions.length; i += 9) {
        const corners = [positions.slice(i, i + 3), positions.slice(i + 3, i + 6), positions.slice(i + 6, i + 9)];
        for (let j = 0; j < 3; j++) {
            const first = corners[j], last = corners[(j + 1) % 3];
            const id = [key(first), key(last)].sort().join('|');
            if (edges.has(id))
                edges.delete(id);
            else
                edges.set(id, [first, last]);
        }
    }
    const lip = p => [p[0], p[1] - .027, p[2]];
    for (const [a, b] of edges.values())
        hood.quad(a, b, lip(b), lip(a), '#c6cdca');
}

function buildHood(kind, spec, cabin, hood, hardware) {
    const { front, belt, w, a } = spec, pivotY = belt + .015, pivotZ = cabin.hingeZ;
    const compartment = new Batch(), liner = new Batch();
    const length = pivotZ - front, center = (pivotZ + front) * .5, y = belt - .27;
    const short = length < .79, hatch = kind === 'hatch';
    const unitW = w * (short ? .76 : .64), depth = length * .59;
    compartment.box(0, y - .12, center, w * 1.33, .071, length * .85, '#222d32');
    compartment.box(0, y + .017, center - length * .03, unitW, .23, depth, short ? '#666c63' : '#4c5856');
    compartment.box(0, y + .137, center - length * .03, unitW * .91, .037, depth * .91, '#87918b');
    const pins = short ? 6 : 8;
    for (let i = 0; i < pins; i++) {
        const x = (-.41 + .82 * i / (pins - 1)) * unitW;
        compartment.box(x, y + .159, center - length * .03, .013, .012, depth * .73, '#546461');
    }
    const relayX = w * .53;
    compartment.box(-relayX, y - .015, center + length * .08, .198, .18, length * .34, '#303f45');
    compartment.box(-relayX, y + .075, center + length * .08, .181, .032, length * .29, '#566861');
    for (const x of [-.049, .057])
        compartment.add(tube, [-relayX + x, y + .101, center + length * .02], [.042, .028, .042], x > 0 ? '#b0715f' : '#a6aca1');
    compartment.add(tube, [relayX, y + .022, center + length * .22], [.141, .168, .141], '#d5cdb6');
    compartment.add(tube, [relayX, y + .119, center + length * .22], [.089, .028, .089], '#816e55');
    for (let i = 0; i < 3; i++) {
        const x = .125 + i * .060, z = center - depth * .38 + i * .04;
        const path = [[x, y + .116, z], [x + .080, y + .108, z - .077], [relayX, y + .079, front + length * .22 + i * .036],
            [relayX + .05, y + .066, center + length * .06]];
        for (let j = 1; j < path.length; j++)
            compartment.rod(path[j - 1], path[j], .015, hatch ? '#484143' : '#c97949');
    }
    for (const side of [-1, 1]) {
        const x = side * w * .631;
        compartment.rod([x, y + .105, front + length * .12], [x, y + .206, a + .045], .029, '#788175', true);
        compartment.add(tube, [x - side * .075, y + .154, front + length * .77], [.125, .03, .125], '#697672');
    }
    compartment.box(0, y + .104, front + length * .165, w * 1.10, .045, .071, '#374245');
    for (let i = -6; i <= 6; i++)
        compartment.box(i * w * .076, y + .138, front + length * .165, .017, .009, .056, '#94988a');
    const edge = front + .035, middle = front + length * .52, near = pivotZ - .040;
    const low = belt - (hatch ? .153 : .091);
    for (const s of [-1, 1]) {
        liner.rod([s * .17, low - .014, edge], [s * w * .48, low + .078, middle], .022, '#58625e', true);
        liner.rod([s * w * .48, low + .078, middle], [s * .19, belt - .015, near], .020, '#58625e', true);
    }
    liner.rod([-w * .45, low + .079, middle], [w * .45, low + .079, middle], .018, '#606a64', true);
    liner.box(0, low - .015, edge + .021, .19, .036, .059, '#283335');
    liner.box(w * .28, low + .107, middle + .09, .13, .009, .062, '#c6b68b');

    foldedEdge(hood);
    const skin = hood.mesh(), ribs = liner.mesh(), trim = hardware.mesh(), bay = compartment.mesh();
    return (paint) => {
        const root = new T.Group(), leaf = new T.Group(), surface = skin.clone();
        surface.name = 'hood-panel-skin';
        surface.material = paint;
        surface.position.set(0, -pivotY, -pivotZ);
        const underside = ribs.clone(), decor = trim.clone(), equipment = bay.clone();
        underside.position.copy(surface.position);
        decor.position.copy(surface.position);
        underside.name = 'bonnet-stamped-bracing';
        equipment.name = 'power-unit';
        equipment.visible = underside.visible = false;
        leaf.name = 'service-hood';
        leaf.position.set(0, pivotY, pivotZ);
        leaf.add(surface, decor, underside);
        root.add(equipment, leaf);
        let opening = 0;
        return { root, surface, update(dt, visual, parked) {
            const target = parked && visual.systems?.hood ? 1 : 0;
            opening = visual.snapshotPose ? target : T.MathUtils.damp(opening, target, 9, dt);
            leaf.rotation.x = opening * 1.19;
            equipment.visible = underside.visible = opening > .035;
        } };
    };
}

module.exports = { splitFrontShell, buildHood };
