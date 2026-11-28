const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../engine/three.module.min.js');
const { Simulation } = require('../game/sim.js');
const { moveHull } = require('../game/collision.js');
const { strikeFence } = require('../game/market-fence.js');
const { createPicket } = require('../game/market-fence-view.js');
const { createCrashDebris } = require('../game/street-incidents-view.js');
const { streetFurniture } = require('../game/vehicle-road.js');
const { ReplayRecorder, replayAt, validReplay } = require('../game/replay.js');

test('a van bends and then breaks the market fence, whose fallen frame remains solid after loading', () => {
    const sim = new Simulation(undefined, 'free-drive');
    const section = sim.motorPool.props[2], car = sim.cars.find(c => c.kind === 'van');
    Object.assign(car, { x: section.x, z: section.z + 3.2, y: 0, yaw: 0, vx: 0, vz: -2.2, speed: 2.2 });
    const impact = moveHull(car, 0, -3.1, 0, sim.cars).hit;
    const prop = impact.prop;
    assert.equal(prop.kind, 'picket');
    sim.resolveImpact(car, impact, .8);
    assert.equal(prop.broken, false);
    assert(prop.fence.angle > .2);

    sim.elapsed += 1.5;
    Object.assign(car, { vx: 0, vz: -7.5, speed: 7.5 });
    sim.resolveImpact(car, impact, .8);
    assert.equal(prop.broken, true);
    const crash = sim.streetIncidents.crashes.at(-1);
    assert.equal(crash.kind, 'fence');
    assert.equal(crash.debris.material, 'wood');
    assert.equal(crash.debris.dz, -1);
    assert.equal(crash.debris.snow, true);

    const loaded = new Simulation(JSON.parse(JSON.stringify(sim.snapshot())), 'free-drive');
    const loadedCar = loaded.cars.find(c => c.id === car.id), loadedProp = loaded.motorPool.props.find(p => p.id === prop.id);
    assert.deepEqual(loadedProp.fence, prop.fence);
    assert.deepEqual(loaded.streetIncidents.crashes.at(-1).debris, crash.debris);
    assert.equal(moveHull(loadedCar, 0, -3.1, 0, loaded.cars).hit.prop, loadedProp);
});

test('market slats detach and clear their frame while impact effects stay in a forward fan', () => {
    const group = new T.Group(), p = streetFurniture()[0], updatePicket = createPicket(group, p);
    strikeFence(p, 6, 0, 1, p, -1);
    updatePicket(p, 2.5);
    const [frame, boards] = group.children[0].children, matrix = new T.Matrix4();
    const detached = new T.Vector3(), attached = new T.Vector3();
    boards.getMatrixAt(p.fence.board, matrix);
    detached.setFromMatrixPosition(matrix);
    boards.getMatrixAt(0, matrix);
    attached.setFromMatrixPosition(matrix);
    assert(frame.rotation.x < -1.4);
    assert(detached.z < attached.z - .5);
    assert(detached.y < attached.y);

    const scene = new T.Scene(), updateDebris = createCrashDebris(scene);
    const crash = { x: p.x, z: p.z, at: 1, kind: 'fence', severity: .5, debris: { dx: 0, dz: -1, material: 'wood', glass: true, snow: true } };
    updateDebris([crash], 1.27, p);
    const [plastic, wood, glass, snow] = scene.children;
    assert.equal(plastic.count, 0);
    for (const mesh of [wood, glass, snow]) {
        assert(mesh.count > 0);
        for (let i = 0; i < mesh.count; i++) {
            mesh.getMatrixAt(i, matrix);
            assert(detached.setFromMatrixPosition(matrix).z < crash.z);
        }
    }
    updateDebris([{ ...crash, kind: 'collision', debris: { ...crash.debris, material: 'plastic', glass: false, snow: false } }], 1.27, p);
    assert(plastic.count > 0);
    assert.equal(wood.count + glass.count + snow.count, 0);
});

test('a replay records the fallen section and only shows it once the hit occurs', () => {
    const replay = new ReplayRecorder(), props = streetFurniture(), p = props[0];
    const hero = { x: p.x, y: 0, z: p.z - 4, yaw: 0, speed: 0 };
    const frame = { clock: 1080, tram: 0, wanted: 0, driven: null, hero, props, cars: [], people: [] };
    replay.capture({ ...frame, time: 1 });
    strikeFence(p, 7, 0, 1.71, p, -1);
    const crash = { kind: 'fence', severity: .5, debris: { dx: 0, dz: -1, material: 'wood', glass: false, snow: true } };
    replay.capture({ ...frame, time: 2, impacts: [{ time: 1.71, x: p.x, z: p.z, strength: .5, carId: 'test-van', crash }] });
    const clip = JSON.parse(JSON.stringify(replay.clip()));
    assert(validReplay(clip));
    assert.deepEqual(clip.impacts[0].crash, crash);
    assert.deepEqual(replayAt(clip, .6).fences, []);
    assert.deepEqual(replayAt(clip, .8).fences[0].fence, p.fence);
});
