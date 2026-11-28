const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createVehicle } = require('../game/model-cars.js');
const { specs, ladogaSeries } = require('../game/vehicle-cabin.js');
const { Simulation } = require('../game/sim.js');
const { vehicleAction, vehiclePanel } = require('../game/vehicle-tools.js');

test('exterior details follow the real window, lamp and wheel assemblies', () => {
    const car = createVehicle('coupe');
    const { root } = car;
    const wheel = root.getObjectByName('steered-wheel');
    const rotor = wheel.getObjectByName('brake-rotor'), caliper = wheel.getObjectByName('brake-caliper');
    const window = root.getObjectByName('side-window'), glassEdge = window.getObjectByName('side-glass-thickness');
    const lens = root.getObjectByName('headlamp-clear-shell'), broken = root.getObjectByName('cracked-left-headlamp');
    assert.equal(caliper.parent, wheel);
    assert.equal(rotor.parent.parent, wheel);
    assert.equal(glassEdge.parent, window);
    assert.equal(lens.visible, true);
    assert.equal(broken.visible, false);

    car.update(.12, 8, .4, true, false, .6, {
        cameraDistance: 4, systems: { leftLamp: false, windowsOpen: true, dents: { frontLeft: .45 } }
    });

    assert.notEqual(rotor.parent.rotation.x, 0);
    assert.notEqual(wheel.rotation.y, 0);
    assert.equal(Math.abs(caliper.rotation.x), 0);
    assert.ok(window.position.y < 0);
    assert.equal(lens.visible, false);
    assert.equal(broken.visible, true);
    assert.equal(root.getObjectByName('tyre-tread-and-marking').visible, true);
    car.update(.12, 8, 0, false, false, 0, { cameraDistance: 20, systems: {} });
    assert.equal(lens.visible, true);
    assert.equal(broken.visible, false);
    assert.equal(root.getObjectByName('tyre-tread-and-marking').visible, false);
    car.dispose();
});

test('the common fleet retains low detail meshes and fitted exterior geometry', () => {
    for (const kind of Object.keys(specs)) {
        const car = createVehicle(kind);
        const { root } = car;
        const parts = ['headlamp-reflector', 'window-frit-and-demister', 'charging-flap-paint', 'wheel-arch-liners', 'undercarriage-and-protection'];
        if (kind === 'hatch') parts.push('liftgate-demister');
        if (kind === 'suv') parts.push('visible-suspension');
        for (const name of parts) {
            const detail = root.getObjectByName(name);
            assert.ok(detail?.geometry.getAttribute('position').array.every(Number.isFinite), `${kind} ${name}`);
        }
        assert.ok(root.getObjectByName('low-panel-skin').geometry.getAttribute('position').count > 0, kind);
        car.dispose();
    }
});

test('the garage opens and saves the fitted hood while Ladoga variants stay tied to the vehicle', () => {
    const sim = new Simulation(undefined, 'free-drive');
    const car = sim.cars.find(car => car.id === 'garage-hatch');
    sim.home.avatar = null;
    Object.assign(sim.hero, { x: car.x - 1.8, z: car.z + .5 });
    assert.match(vehiclePanel(sim), /Поднять капот/);
    assert.equal(vehicleAction(sim, 'motor-hood').inspectHood, true);
    assert.equal(car.systems.hood, true);
    const loaded = new Simulation(JSON.parse(JSON.stringify(sim.snapshot())), 'free-drive');
    const saved = loaded.cars.find(vehicle => vehicle.id === car.id);
    assert.equal(saved.systems.hood, true);
    const model = createVehicle(saved.kind, saved.color, false, saved.id);
    model.update(.1, 0, 0, false, false, 0, { systems: saved.systems, snapshotPose: true });
    assert.ok(model.root.getObjectByName('service-hood').rotation.x > 1);
    assert.equal(model.root.getObjectByName('power-unit').visible, true);
    assert.equal(model.root.userData.ladogaSeries, ladogaSeries(car.id));
    model.update(.1, 3, 0, false, false, 0, { systems: saved.systems, snapshotPose: true });
    assert.equal(model.root.getObjectByName('service-hood').rotation.x, 0);
    assert.equal(model.root.getObjectByName('power-unit').visible, false);
    model.dispose();
});
