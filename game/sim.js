"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulation = exports.campaign = void 0;
const city_life_js_1 = require("./city-life.js");
const city_timetables_js_1 = require("./city-timetables.js");
const city_clock_js_1 = require("./city-clock.js");
const population_profile_js_1 = require("./population-profile.js");
const collision_js_1 = require("./collision.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const vehicle_systems_js_1 = require("./vehicle-systems.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const garage_service_js_1 = require("./garage-service.js");
const population_parking_js_1 = require("./population-parking.js");
const vehicle_handling_js_1 = require("./vehicle-handling.js");
const vehicle_impact_js_1 = require("./vehicle-impact.js");
const weather_js_1 = require("./weather.js");
const traffic_bypass_js_1 = require("./traffic-bypass.js");
const street_incidents_js_1 = require("./street-incidents.js");
const population_traffic_js_1 = require("./population-traffic.js");
const population_performance_js_1 = require("./population-performance.js");
const collision_js_2 = require("./collision.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const ui_navigation_js_1 = require("./ui-navigation.js");
const region_layout_js_1 = require("./region-layout.js");
const region_traffic_js_1 = require("./region-traffic.js");
const patrol_plan_js_1 = require("./patrol-plan.js");
const foot_patrol_js_1 = require("./foot-patrol.js");
const street_encounter_js_1 = require("./street-encounter.js");
const residence_js_1 = require("./residence.js");
const pedestrian_controller_js_1 = require("./pedestrian-controller.js");
const population_walkers_js_1 = require("./population-walkers.js");
const house_layout_js_1 = require("./house-layout.js");
const fixtures_js_1 = require("./fixtures.js");
const world_railway_js_1 = require("./world-railway.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const collision_js_3 = require("./collision.js");
const world_layout_js_1 = require("./world-layout.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const names = vehicle_cabin_js_1.vehicleNames;
const roadPace = { hatch: 6.8, sedan: 6.8, van: 5.1, suv: 6.3, pickup: 5.75, coupe: 7.6, taxi: 6.3, wagon: 6, towtruck: 4.8, utility: 4.5 };
exports.campaign = [
    { title: 'Последний рейс', reward: 1800 },
    { title: 'Холодный пуск', reward: 2400 },
    { title: 'Чужая частота', reward: 3600 }
];
const paintColors = ['#b9623f', '#638c88', '#a5b4bf', '#606a91', '#c1a14e'];
const waterReserve = { x: 451.7, z: 43.8, yaw: 0 };
const routes = [
    [{ x: 21, z: 24 }, { x: 39, z: 24 }, { x: 39, z: 36 }, { x: 20, z: 36 }],
    [{ x: -56, z: -35 }, { x: -56, z: -40 }, { x: -43, z: -40 }, { x: -43, z: -28 }],
    [{ x: -40, z: 22 }, { x: -17, z: 22 }, { x: 3, z: 22 }, { x: 3, z: 0 }, { x: -20, z: 0 }, { x: -42, z: 0 }, { x: -42, z: 22 }],
    [{ x: 9, z: -40 }, { x: 36, z: -40 }, { x: 39, z: -36 }, { x: 39, z: -15 }, { x: 37, z: -14 }, { x: 37, z: -40 }],
    [{ x: 53, z: 25 }, { x: 73, z: 25 }, { x: 73, z: 36 }, { x: 54, z: 36 }],
    [{ x: -42, z: 36 }, { x: -27, z: 36 }, { x: -23, z: 43 }, { x: -42, z: 43 }],
    ...world_expansion_layout_js_1.expansionWalks, ...region_traffic_js_1.regionalWalks
];
const firstRegionalWalk = routes.length - region_traffic_js_1.regionalWalks.length;
const finite = (n, fallback) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
const copy = (value) => JSON.parse(JSON.stringify(value));
const near = (a, b, r) => Math.abs(a.x - b.x) < r && Math.abs(a.z - b.z) < r && (0, sim_navigation_js_1.dist)(a, b) < r;
function newCar(id, kind, x, z, yaw, color) {
    return { id, kind, x, y: 0, z, yaw, color, speed: 0, steer: 0, health: 100, lights: true, braking: false, police: false, wheel: 0, vx: 0, vz: 0, auto: false, lane: 0, s: 0 };
}
function trafficCar(id, kind, lane, s, color, police = false) {
    const p = sim_navigation_js_1.lanes[lane].at(s);
    return { ...newCar(id, kind, p.x, p.z, p.yaw, color), lane, s, auto: true, police };
}
function startingCars() {
    const bay = require("./canal-walk.js").marketBay;
    const fleet = [
        newCar('garage-hatch', 'hatch', -35.1, 39, 2.36, '#c56742'),
        newCar('market-sedan', 'sedan', bay.parkedX, bay.centreZ, -Math.PI / 2, '#437c80'),
        { ...newCar('service-van', 'van', world_layout_js_1.places.damaged.x, world_layout_js_1.places.damaged.z, -3.11, '#9bb3b3'), health: 42 },
        trafficCar('traffic-1', 'sedan', 0, 91, '#6c7394'),
        trafficCar('traffic-2', 'hatch', 1, 173, '#ceac65'),
        trafficCar('traffic-3', 'van', 0, 213, '#7495a0'),
        trafficCar('traffic-4', 'hatch', 1, 47, '#905867'),
        trafficCar('patrol-1', 'sedan', 0, 137, '#d0d9d8', true),
        trafficCar('patrol-2', 'sedan', 1, 293, '#b9cbcc', true),
        trafficCar('patrol-3', 'sedan', 0, 310, '#c8d3d3', true)
    ];
    const displayFleet = [
        ['fleet-taiga', 'suv', -28.7, 48.9, Math.PI / 2, '#748479'],
        ['fleet-burevestnik', 'pickup', -825, -113, Math.PI / 2, '#aa8555'],
        ['fleet-iskra', 'coupe', -30, -666, Math.PI / 2, '#ab594b'],
        ['fleet-dam-taiga', 'suv', 815, -166, 0, '#526f6f'],
        ['fleet-mill-burevestnik', 'pickup', 167, 678, Math.PI / 2, '#546985'],
        ...vehicle_cabin_js_1.extraFleet
    ];
    for (const [id, kind, x, z, yaw, color] of displayFleet)
        fleet.push(newCar(id, kind, x, z, yaw, color));
    const disabled = newCar('fleet-story-bridge-hatch', 'hatch', 50.1, 98.5, 0, '#587681');
    disabled.health = 24;
    fleet.push(disabled);
    Object.assign(fleet[8], { x: -1.6, z: -41.2, yaw: Math.PI / 2, auto: false });
    Object.assign(fleet[9], { x: -8, z: -41.2, yaw: Math.PI / 2, auto: false });
    for (let i = 2; i < sim_navigation_js_1.firstRegionalLane; i++) {
        const kind = i % 3 === 0 ? 'van' : i % 3 === 1 ? 'sedan' : 'hatch';
        fleet.push(trafficCar('outer-' + i, kind, i, sim_navigation_js_1.lanes[i].length * (i % 2 === 0 ? .38 : .71), ['#6d9b99', '#bd7c54', '#687ca0'][i % 3]));
    }
    for (let i = 0; i < region_traffic_js_1.regionalCircuits.length; i++) {
        const lane = sim_navigation_js_1.firstRegionalLane + 2 * i, loop = sim_navigation_js_1.lanes[lane], district = region_traffic_js_1.regionalCircuitDistricts[i], site = region_layout_js_1.regionSites.find(site => site.id === district);
        const start = site ? loop.nearest(site.stop).s : loop.length * .67;
        const suburbKinds = ['coupe', 'pickup', 'suv', 'pickup', 'coupe'];
        const kind = i < 5 ? (i === 0 || i === 2 ? 'hatch' : 'van') : suburbKinds[(i - 5) % suburbKinds.length];
        const colors = ['#70a19e', '#b4925b', '#8f9ea1', '#6b8267', '#a16b52'];
        fleet.push(trafficCar('region-' + district + '-out', kind, lane, loop.wrap(start - 38), colors[i % colors.length]));
        const inbound = sim_navigation_js_1.lanes[lane + 1];
        const inboundKind = i < 5 ? 'sedan' : suburbKinds[(i - 3) % suburbKinds.length];
        fleet.push(trafficCar('region-' + district + '-in', inboundKind, lane + 1, inbound.wrap(inbound.nearest(loop.at(start)).s + 39), i < 5 ? '#a3725a' : colors[(i + 2) % colors.length]));
        if (site)
            fleet.push(trafficCar('region-' + district + '-patrol', 'sedan', lane, loop.wrap(start + 62), '#b8c8c9', true));
    }
    const beltLane = sim_navigation_js_1.firstRegionalLane + region_traffic_js_1.regionalCircuitDistricts.indexOf('belt') * 2;
    const reserve = newCar('region-water-reserve', 'sedan', waterReserve.x, waterReserve.z, waterReserve.yaw, '#b6c7c7');
    fleet.push({ ...reserve, police: true, lane: beltLane, s: sim_navigation_js_1.lanes[beltLane].nearest(reserve).s });
    for (const item of city_timetables_js_1.trafficDuties) {
        const { laneIndex, s } = (0, city_timetables_js_1.dutyLane)(item), lane = sim_navigation_js_1.lanes[laneIndex];
        for (const offset of [0, -7, 7, 13, -13, 21, -21, 31, -31]) {
            const candidate = trafficCar(item.id, item.kind, laneIndex, lane.wrap(s + offset), item.color);
            if ((0, collision_js_3.hullFits)(candidate, candidate, fleet)) {
                fleet.push(candidate);
                break;
            }
        }
    }
    return fleet;
}
function resident(id, role, p, yaw) {
    return { id, role, ...p, y: (0, world_layout_js_1.groundHeight)(p.x, p.z), yaw, speed: 0, route: 0, waypoint: 0, wait: 0 };
}
function startingPeople() {
    return [
        resident('inna', 'vendor', { x: world_layout_js_1.places.market.x + .65, z: world_layout_js_1.places.market.z - .7 }, -2.9),
        resident('semen', 'dispatcher', { x: world_layout_js_1.places.depot.x + 1.35, z: world_layout_js_1.places.depot.z + .5 }, .4),
        resident('tonya', 'mechanic', { x: world_layout_js_1.places.garage.x - .2, z: world_layout_js_1.places.garage.z + 2.3 }, .6),
        resident('lesha', 'courier', { x: world_layout_js_1.places.hideout.x - 2, z: world_layout_js_1.places.hideout.z - .4 }, -.2),
        ...city_life_js_1.addedResidents.map(p => resident(p.id, 'walker', { x: p.x, z: p.z }, .45)),
        ...city_timetables_js_1.taxiPassengers.map(p => resident(p.id, 'walker', { x: p.x, z: p.z }, .45)),
        ...routes.slice(0, firstRegionalWalk).map((r, i) => ({ ...resident('walker-' + i, 'walker', r[0], (0, sim_navigation_js_1.aim)(r[0], r[1])), route: i, waypoint: 1, wait: (i % 3) * .55 })),
        ...[0, 2, 3].map((r, i) => ({ ...resident('local-' + i, 'walker', routes[r][2], (0, sim_navigation_js_1.aim)(routes[r][2], routes[r][3])), route: r, waypoint: 3 })),
        ...region_traffic_js_1.regionalWalks.flatMap((r, i) => [0, 2].map(k => ({ ...resident('region-' + region_layout_js_1.regionSites[i].id + '-walker-' + k, 'walker', r[k], (0, sim_navigation_js_1.aim)(r[k], r[k + 1])), route: firstRegionalWalk + i, waypoint: k + 1 })))
    ];
}
const lines = {
    vendor: ['Инна', 'Паяю всё, что ещё помнит своё имя. Даже домофоны.'],
    dispatcher: ['Семён', 'Если слышишь звон, значит линия ещё жива.'],
    mechanic: ['Тоня', 'Канальный гараж открыт. Подгоняй машину к воротам.'],
    courier: ['Лёша', 'За аркой тихо. Здесь даже радио ловит только снег.'],
    walker: ['Житель', 'В депо снова ночная смена. Слышишь, как звенят рельсы?']
};
const ease = (x) => { const t = (0, sim_navigation_js_1.clamp)(x, 0, 1); return t * t * (3 - 2 * t); };
const boarding = require("./vehicle-boarding.js");
const seatCrossingTime = boarding.seatCrossingTime;
function pointAlong(route, t) {
    const lengths = route.slice(1).map((b, i) => (0, sim_navigation_js_1.dist)(route[i], b));
    let remaining = (0, sim_navigation_js_1.clamp)(t, 0, 1) * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
        if (remaining <= lengths[i] && lengths[i] > .00001) {
            const f = remaining / lengths[i], a = route[i], b = route[i + 1];
            return { x: (0, sim_navigation_js_1.lerp)(a.x, b.x, f), z: (0, sim_navigation_js_1.lerp)(a.z, b.z, f) };
        }
        remaining -= lengths[i];
    }
    return route[route.length - 1];
}
const homes = new Map(startingPeople().map(p => [p.id, { x: p.x, z: p.z, yaw: p.yaw }]));
// A save may predate this building. Move only actors whose old footprint it now occupies.
function recoverSchoolSite(sim) {
    const { overlapsSchool, hullFits, clearDisc } = collision_js_3;
    const { schoolOutside: entry } = require("./school-site.js");
    const active = sim.activeCar(), outside = !sim.home.inside && !sim.tramRider.onboard;
    const tow = sim.motorPool.towing.active;
    const people = sim.streetBodies();
    const pedestrians = outside && !active ? [...people, sim.hero] : people;
    let resetMotion = false;
    const needsMove = car => overlapsSchool(car, car);
    for (const car of sim.cars) {
        if (car.carriedBy) continue;
        const load = tow?.truck === car.id ? sim.cars.find(c => c.id === tow.car) : null;
        if (!needsMove(car) && !(load && needsMove(load))) continue;
        // The verges on either side of the entrance leave the footpath free.
        let placed = false;
        for (let row = 0; row < 12 && !placed; row++) {
            for (let slot = 0; slot < 28 && !placed; slot++) {
                const dx = (slot % 2 ? 1 : -1) * (9 + Math.floor(slot / 2) * 6);
                const x = entry.x + dx, z = entry.z + 5 + row * 6;
                const pose = { x, z, yaw: car.yaw }, y = (0, world_layout_js_1.groundHeight)(x, z);
                if (!hullFits(car, pose, sim.cars, pedestrians)) continue;
                const shiftX = x - car.x, shiftZ = z - car.z;
                if (load && !hullFits(load, { x: load.x + shiftX, z: load.z + shiftZ, yaw: load.yaw }, sim.cars, pedestrians, car)) continue;
                const proposed = { ...car, ...pose, y };
                if (!sim.door(proposed, -1, false) && !sim.door(proposed, 1, false)) continue;
                Object.assign(car, pose, { y, speed: 0, vx: 0, vz: 0, steer: 0 });
                if (load) {
                    for (const p of [tow.start, tow.end]) { p.x += shiftX; p.z += shiftZ; }
                    sim.motorPool.towing.update(sim, 0);
                }
                if (active === car && outside) {
                    Object.assign(sim.hero, pose, { y, speed: 0 });
                    resetMotion = true;
                }
                if (sim.transition?.carId === car.id) sim.transition = null;
                placed = true;
            }
        }
    }
    if (outside && !active && overlapsSchool(sim.hero)) {
        const free = p => clearDisc(p, .33, 0, sim.cars) && people.every(o => Math.hypot(o.x - p.x, o.z - p.z) > .64);
        // Start at the entrance and search the pavement if it is occupied.
        let placed = false;
        for (let row = 0; row < 8 && !placed; row++) {
            for (let slot = 0; slot < 49 && !placed; slot++) {
                const x = entry.x + (slot % 2 ? 1 : -1) * Math.ceil(slot / 2) * .95, z = entry.z + row;
                if (!free({ x, z })) continue;
                Object.assign(sim.hero, { x, z, y: (0, world_layout_js_1.groundHeight)(x, z), speed: 0 });
                placed = resetMotion = true;
            }
        }
    }
    if (resetMotion) {
        sim.jumpVelocity = 0;
        sim.transition = sim.exchange = sim.motorPool.vault = null;
        delete sim.hero.vault;
        delete sim.hero.vaultHand;
        sim.street.restore();
    }
}
class Simulation {
    cityLife = new city_life_js_1.CityLife();
    cargoRail = new cargo_rail_js_1.CargoRail();
    cityTraffic = new city_timetables_js_1.CityTraffic();
    clockOffset = 0;
    get cityMinutes() { return Math.floor(((0, city_clock_js_1.districtMinutes)(this.elapsed) + this.clockOffset) % 1440); }
    lastSpeaker;
    patrolFoot = new foot_patrol_js_1.FootPatrols();
    street = new street_encounter_js_1.StreetEncounter();
    warned = false;
    get footPatrols() { return this.patrolFoot.units; }
    patrolDoorFor(id) { return this.patrolFoot.door(id); }
    get streetPose() { return this.street.pose; }
    canStreetAction() {
        return !this.home.inside && !this.home.door && !this.driven && !this.tramRider.onboard && !this.transition && !this.exchange && !this.motorPool.vault
            && this.hero.y <= (0, collision_js_3.footFloor)(this.hero, this.hero.y, .30, this.cars) + .062;
    }
    streetActions() {
        if (!this.canStreetAction())
            return [];
        const result = [];
        if (this.street.covered)
            result.push({ id: 'street:cover', label: 'Выйти из укрытия' });
        else if (this.wanted && this.street.coverAngle(this.hero, this.cars) !== null)
            result.push({ id: 'street:cover', label: 'Укрыться' });
        if (this.wanted && this.patrolFoot.near(this.hero, this.cars, this.street.covered).length) {
            result.push({ id: 'street:strike', label: 'Оттолкнуть' });
            result.push({ id: 'street:dodge', label: 'Уклониться' });
        }
        return result;
    }
    streetAction(id) {
        if (!this.canStreetAction())
            return false;
        if (id !== 'street:cover' && !this.wanted)
            return false;
        const started = this.street.start(id, this.hero, this.cars, this.elapsed, this.footPatrols);
        if (started)
            this.pedestrian.reset();
        return started;
    }
    streetStep(input, dt) {
        if (!this.street.locked)
            return false;
        return this.street.tick(this.hero, this.cars, [...this.streetPeople, ...this.footPatrols], dt, Math.hypot(input.moveX ?? 0, input.moveY ?? 0) > .16, yaw => {
            const officer = this.patrolFoot.near(this.hero, this.cars, false)
                .filter(o => Math.abs((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(this.hero, o) - yaw)) < 1.10)
                .sort((a, b) => (0, sim_navigation_js_1.dist)(a, this.hero) - (0, sim_navigation_js_1.dist)(b, this.hero))[0];
            if (!officer)
                return;
            this.patrolFoot.stun(officer, this.elapsed, this.hero);
            this.capture = Math.max(0, this.capture - 1.35);
            this.emit('sound', 'impact');
        });
    }
    streetBodies() {
        return this.footPatrols.length ? [...this.streetPeople, ...this.footPatrols] : this.streetPeople;
    }
    responders = [];
    patrolPaths = new Map();
    patrolTurns = new Map();
    patrolPlanAt = -1;
    districtPursuit = false;
    pursuitContact = 0;
    lastSeenMotion = { x: 0, z: 0 };
    populationPressure = 0;
    distantClock = 0;
    distantStep = 0;
    queueBypasses = new traffic_bypass_js_1.QueueBypasses();
    patrolActive(c) { return c.police && (this.responders.includes(c.id) || this.elapsed < (c.releaseAt ?? 0) || this.patrolFoot.has(c.id)); }
    get pursuitStatus() {
        const total = this.wanted ? (0, patrol_plan_js_1.scanDuration)(this.wanted) : 0;
        return {
            phase: !this.wanted ? 'clear' : this.search ? 'search' : this.unseen > .45 ? 'uncertain' : 'pursuit',
            pressure: (0, sim_navigation_js_1.clamp)(this.capture / this.captureTime(), 0, 1),
            remaining: Math.max(0, total - this.searchTime), total,
            lastSeen: this.wanted ? { ...this.lastSeen } : null, vehicle: this.patrolFoot.vehicle,
            onFoot: this.footPatrols.filter(p => p.phase !== 'return').length, cover: this.street.covered,
            nearbyPatrols: this.wanted ? this.cars.filter(c => this.responders.includes(c.id) && near(c, this.hero, 65)).length : 0
        };
    }
    motorPool = new vehicle_systems_js_1.MotorPool();
    tramRider = new world_railway_js_1.TramRider();
    home = new residence_js_1.Residence();
    pedestrian = new pedestrian_controller_js_1.PedestrianController();
    get player() { return this.home.avatar ?? this.hero; }
    transition = null;
    exchange = null;
    get handoff() { return this.exchange?.t ?? -1; }
    get handoffRole() { return this.exchange?.role ?? null; }
    get handoffPoint() {
        if (!this.exchange)
            return null;
        const p = this.people.find(n => n.role === this.exchange.role);
        const end = this.exchange.to;
        return { x: (p.x + end.x) * .5, y: Math.max(p.y, (0, world_layout_js_1.groundHeight)(end.x, end.z)) + 1.08, z: (p.z + end.z) * .5 };
    }
    hero = { ...world_layout_js_1.places.spawn, y: 0, yaw: -.80, speed: 0 };
    brokenFixtures = fixtures_js_1.intact;
    streetIncidents = new street_incidents_js_1.StreetIncidents();
    populationTraffic = new population_traffic_js_1.TrafficPopulation();
    darkJunctions = new Set();
    cars = startingCars();
    people = startingPeople();
    populationWalkers = new population_walkers_js_1.AmbientWalkers();
    managedWalkers = false;
    streetPeople = this.people;
    parkingEnabled = false;
    enableParking() {
        if (this.parkingEnabled)
            return;
        this.parkingEnabled = true;
        (0, population_parking_js_1.fillParking)(this.cars, [this.hero, ...this.streetBodies()]);
    }
    updatePedestrianPopulation(frame) {
        this.managedWalkers = true;
        const changed = this.populationWalkers.update(frame, this.people, this.cars, (0, world_railway_js_1.linePose)(this.tramTime), p => {
            const witness = this.cityLife.witnesses[p.id];
            return (p.lookUntil ?? 0) > frame.elapsed || !!p.reaction || !!witness && frame.elapsed - witness.t < 38;
        });
        if (changed)
            this.streetPeople = this.people.filter(p => !p.onboard);
        return changed;
    }
    liftProbe = newCar('municipal-lift', 'van', 0, 0, 0, '#b87537');
    driven = null;
    mission = 0;
    stage = 0;
    money = 0;
    wanted = 0;
    search = null;
    tramTime = -1;
    depotHold = 0;
    railRate = 1;
    railWarned = false;
    elapsed = 0;
    savedCar = null;
    lastSeen = { ...world_layout_js_1.places.spawn };
    unseen = 0;
    searchTime = 0;
    jumpVelocity = 0;
    jumpDown = false;
    bumpTime = -10;
    impactSliding = new Map();
    impactSpin = new WeakMap();
    impactPose = new WeakMap();
    recentImpact = new WeakMap();
    reportTime = -90;
    hornTime = -90;
    capture = 0;
    checkpoint;
    events = [];
    population;
    nextPopulationAt = 0;
    populationStatus = null;
    populationRevision = 0;
    setPopulation(settings) {
        const pedestrians = (0, population_profile_js_1.isPopulationDensity)(settings.pedestrians) ? settings.pedestrians : population_profile_js_1.defaultPopulation.pedestrians;
        const traffic = (0, population_profile_js_1.isPopulationDensity)(settings.traffic) ? settings.traffic : population_profile_js_1.defaultPopulation.traffic;
        if (this.population?.pedestrians === pedestrians && this.population.traffic === traffic)
            return;
        this.population = { pedestrians, traffic };
        this.enableParking();
        this.nextPopulationAt = 0;
        this.populationRevision++;
    }
    refreshPopulation(yaw) {
        const modes = this.population;
        if (!modes || this.home.inside || this.home.door || this.elapsed < this.nextPopulationAt)
            return;
        const { x, z } = this.hero, pressure = this.populationPressure;
        const district = (0, population_profile_js_1.populationDistrict)(this.hero), minutes = this.cityMinutes;
        const target = (0, population_profile_js_1.populationTargets)(district, minutes, modes);
        const frame = { x, z, yaw, radius: population_profile_js_1.populationRadius, district, elapsed: this.elapsed,
            minutes, wanted: this.wanted, pressure, ...target };
        this.nextPopulationAt = this.elapsed + (pressure >= 2 ? 1.7 : .6);
        const changedPeople = this.updatePedestrianPopulation(frame);
        const changedTraffic = this.updateTrafficPopulation(frame);
        this.populationStatus = { district, radius: frame.radius, pressure, modes: { ...modes }, target,
            actual: (0, population_profile_js_1.populationCounts)(frame, this.people, this.cars, this.driven) };
        if (changedPeople || changedTraffic)
            this.populationRevision++;
    }
    constructor(saved, mode = 'campaign') {
        this.motorPool.restore(undefined, this.cars);
        (0, collision_js_3.setBrokenFixtures)(this.cars, this.brokenFixtures);
        (0, collision_js_3.bindCityGates)(this.cars, this.home.openedGates);
        (0, collision_js_3.setTramBody)(this.cars, (0, world_railway_js_1.linePose)(this.tramTime));
        (0, collision_js_1.bindMarketTables)(this.cars, (0, exploration_layout_js_1.marketLayouts)(this.elapsed));
        (0, collision_js_1.bindCargoRail)(this.cars, this.cargoRail.poses, this.cargoRail.barriers);
        if (this.validSave(saved)) {
            this.restore(saved);
            const cp = saved.checkpoint;
            this.checkpoint = this.validSave(cp) ? copy(cp) : this.core();
        }
        else {
            if (mode === 'campaign') {
                const { x, z, yaw, zone } = exploration_layout_js_1.entrances.school1;
                Object.assign(this.hero, { x, z, yaw, y: (0, world_layout_js_1.groundHeight)(x, z) });
                this.lastSeen = { x, z };
                this.home.enterAnnex(zone);
            }
            this.checkpoint = this.core();
        }
    }
    validSave(s) {
        const d = s;
        return !!d && d.v === 1 && Array.isArray(d.cars) && !!d.hero && Number.isFinite(d.hero.x) && Number.isFinite(d.hero.z);
    }
    core() {
        const { hero, cars, people, driven, mission, stage, money, wanted, search, lastSeen, elapsed, unseen, searchTime, tramTime, savedCar, jumpVelocity, transition, exchange, railRate } = this;
        const { districtPursuit, pursuitContact, lastSeenMotion } = this;
        return copy({ v: 1, respondingPatrols: this.responders, pursuitState: this.patrolFoot.save(), streetState: this.street.save(), districtPursuit, pursuitContact, lastSeenMotion, cityLife: this.cityLife.save(), tramRider: this.tramRider.save(), motorPool: this.motorPool.save(), residence: this.home.save(), brokenFixtures: this.brokenFixtures, streetIncidents: this.streetIncidents.crashes, populationTraffic: this.populationTraffic.save(), managedWalkers: this.managedWalkers ? true : undefined, hero, cars, people, driven, mission, stage, money, wanted, search, lastSeen, elapsed, unseen, searchTime, tramTime, savedCar, jumpVelocity, transition, exchange, railRate, depotHold: this.depotHold, freight: this.cargoRail.save() });
    }
    snapshot() { return { ...this.core(), checkpoint: copy(this.checkpoint) }; }
    restore(s) {
        const d = copy(s);
        this.nextPopulationAt = 0;
        this.populationStatus = null;
        this.populationRevision++;
        this.impactSliding.clear();
        this.pedestrian.reset();
        this.cityLife.restore(d.cityLife);
        this.lastSpeaker = undefined;
        this.tramRider.restore(d.tramRider);
        this.home.restore(d.residence);
        this.hero = { ...this.hero, ...d.hero };
        const savedCars = new Map(d.cars.map(c => [c?.id, c]));
        this.populationTraffic.restore(d.populationTraffic);
        this.cars = startingCars().filter(base => this.populationTraffic.restoreStock(base, savedCars.get(base.id))).map(base => {
            const c = savedCars.get(base.id);
            if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.z))
                return base;
            if (!c.auto && !c.returning && Math.abs(c.speed) < .001 && c.z === -42 &&
                ((c.id === 'patrol-2' && c.x === 2) || (c.id === 'patrol-3' && c.x === -4)))
                return { ...c, x: base.x, z: base.z };
            return { ...base, ...c, id: base.id, kind: base.kind, police: base.police };
        });
        this.cars.push(...this.populationTraffic.restoreVehicles(d.cars));
        (0, population_parking_js_1.restoreParking)(this.cars, savedCars);
        const savedCarSpacing = this.cars.filter(c => !c.id.startsWith('fleet-') || savedCars.has(c.id));
        for (const car of this.cars) {
            if (!car.id.startsWith('fleet-') || savedCars.has(car.id))
                continue;
            const offsets = [[0, 0], [0, -6], [0, 6], [2.5, -5], [-2.5, -5], [2.5, 5], [-2.5, 5], [0, -12], [0, 12]];
            for (const [x, z] of offsets) {
                const next = (0, collision_js_3.toWorld)(car, x, z);
                if (!(0, collision_js_3.hullFits)(car, { ...next, yaw: car.yaw }, savedCarSpacing, [this.hero]))
                    continue;
                Object.assign(car, next, { y: (0, world_layout_js_1.groundHeight)(next.x, next.z) });
                break;
            }
            savedCarSpacing.push(car);
        }
        this.motorPool.restore(d.motorPool, this.cars);
        const savedPeople = Array.isArray(d.people) ? d.people : [];
        this.managedWalkers = d.managedWalkers === true && Array.isArray(d.people);
        const byResident = new Map(savedPeople.filter(p => p && typeof p.id === 'string').map(p => [p.id, p]));
        this.people = startingPeople().flatMap(base => {
            const p = byResident.get(base.id);
            if (!p && this.managedWalkers && (0, population_walkers_js_1.isLegacyAmbientWalker)(base))
                return [];
            return [p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { ...base, ...p } : base];
        });
        this.people.push(...this.populationWalkers.restore(savedPeople));
        this.streetPeople = this.people.filter(p => !p.onboard);
        this.driven = this.cars.some(c => c.id === d.driven && !c.police) ? d.driven : null;
        this.mission = (0, sim_navigation_js_1.clamp)(Math.floor(finite(d.mission, 0)), 0, 3);
        this.stage = (0, sim_navigation_js_1.clamp)(Math.floor(finite(d.stage, 0)), 0, 2);
        this.money = Math.max(0, Math.round(finite(d.money, 0)));
        this.wanted = (0, sim_navigation_js_1.clamp)(Math.floor(finite(d.wanted, 0)), 0, 3);
        const patrols = this.cars.filter(c => c.police).map(c => c.id);
        const saved = Array.isArray(d.respondingPatrols) ? d.respondingPatrols.filter(id => patrols.includes(id)) : [];
        this.responders = [...new Set([...saved, ...patrols])].slice(0, this.wanted);
        this.patrolFoot.recover(this.cars, d.pursuitState);
        this.street.restore(d.streetState);
        this.warned = false;
        this.districtPursuit = !!d.districtPursuit && this.wanted > 0;
        this.pursuitContact = (0, sim_navigation_js_1.clamp)(finite(d.pursuitContact, 0), 0, 20);
        this.lastSeenMotion = { x: (0, sim_navigation_js_1.clamp)(finite(d.lastSeenMotion?.x, 0), -35, 35), z: (0, sim_navigation_js_1.clamp)(finite(d.lastSeenMotion?.z, 0), -35, 35) };
        this.distantClock = 0;
        this.distantStep = 0;
        this.patrolPaths.clear();
        this.patrolTurns.clear();
        this.patrolPlanAt = -1;
        this.search = d.search && Number.isFinite(d.search.radius) ? d.search : null;
        this.lastSeen = d.lastSeen && Number.isFinite(d.lastSeen.x) ? d.lastSeen : { x: this.hero.x, z: this.hero.z };
        this.elapsed = Math.max(0, finite(d.elapsed, 0));
        for (const car of this.cars)
            (0, traffic_bypass_js_1.restoreTrafficManeuver)(car, sim_navigation_js_1.lanes[car.lane], this.elapsed);
        (0, collision_js_1.bindMarketTables)(this.cars, (0, exploration_layout_js_1.marketLayouts)(this.elapsed));
        this.brokenFixtures = (0, fixtures_js_1.restoreFixtures)(d.brokenFixtures, this.elapsed);
        this.streetIncidents.restore(d.streetIncidents, this.elapsed);
        (0, collision_js_3.bindRepairRig)(this.cars, this.cityLife.repair ? (0, city_life_js_1.repairPose)(this.cityLife.repair, this.elapsed) : null);
        this.darkJunctions = (0, fixtures_js_1.brokenCircuits)(this.brokenFixtures);
        (0, collision_js_3.setBrokenFixtures)(this.cars, this.brokenFixtures);
        (0, collision_js_3.bindCityGates)(this.cars, this.home.openedGates);
        this.unseen = finite(d.unseen, 0);
        this.searchTime = finite(d.searchTime, 0);
        this.tramTime = finite(d.tramTime, -1);
        this.depotHold = (0, sim_navigation_js_1.clamp)(finite(d.depotHold, 0), 0, 18);
        this.cargoRail.restore(d.freight);
        (0, collision_js_1.bindCargoRail)(this.cars, this.cargoRail.poses, this.cargoRail.barriers);
        this.railRate = (0, sim_navigation_js_1.clamp)(finite(d.railRate, 1), 0, 1);
        this.railWarned = false;
        (0, collision_js_3.setTramBody)(this.cars, (0, world_railway_js_1.linePose)(this.tramTime));
        if (this.parkingEnabled)
            (0, population_parking_js_1.fillParking)(this.cars, [this.hero, ...this.streetBodies()]);
        this.savedCar = d.savedCar && this.cars.some(c => c.id === d.savedCar?.id) ? d.savedCar : null;
        this.jumpVelocity = finite(d.jumpVelocity, 0);
        this.transition = d.transition && this.cars.some(c => c.id === d.transition?.carId) && d.transition.route?.length ? d.transition : null;
        if (this.transition && this.transition.travelTime === undefined) {
            const tx = this.transition;
            // Older saves used a wider path outside the door. Join the new path from the saved pose.
            tx.travelTime = tx.kind === 'enter' ? 1.48 : 1.56;
            tx.crossing = tx.side === 1 ? .56 : 0;
            tx.resumeFrom = { x: this.hero.x, y: this.hero.y, z: this.hero.z, age: 0 };
        }
        this.exchange = d.exchange?.to ? d.exchange : null;
        this.capture = 0;
        this.reportTime = this.elapsed - 10;
        this.bumpTime = this.elapsed - 5;
        this.hornTime = this.elapsed - 10;
        if (this.home.inside && this.home.entry === 'school1') {
            const { x, z, yaw } = exploration_layout_js_1.entrances.school1;
            Object.assign(this.hero, { x, z, yaw, y: (0, world_layout_js_1.groundHeight)(x, z), speed: 0 });
        }
        recoverSchoolSite(this);
    }
    drainEvents() { return this.events.splice(0); }
    emit(type, text, who, clip) { this.events.push({ type, text, who, clip }); }
    stopDistrictMotion() {
        const previous = this.activeCar();
        if (previous) {
            previous.speed = 0;
            previous.vx = 0;
            previous.vz = 0;
            previous.braking = true;
        }
        this.driven = null;
        this.transition = null;
        this.exchange = null;
        this.jumpVelocity = 0;
        this.jumpDown = false;
        this.pedestrian.reset();
        this.motorPool.vault = null;
        delete this.hero.vault;
        delete this.hero.vaultHand;
        this.tramRider.restore();
        this.street.restore();
    }
    creditDistrictReward(amount) {
        if (Number.isFinite(amount) && amount > 0) {
            this.money += amount;
            this.checkpoint.money += amount;
        }
    }
    saveCheckpoint() { this.checkpoint = this.core(); this.emit('checkpoint', 'Контрольная точка'); }
    restart() {
        this.restore(this.checkpoint);
        this.events = [];
        this.emit('toast', 'Контрольная точка восстановлена');
        this.emit('checkpoint', 'Восстановление');
    }
    activeCar() { return this.cars.find(c => c.id === this.driven) ?? null; }
    updateTrafficPopulation(frame) {
        const tow = this.motorPool.towing.active, trial = this.motorPool.trial;
        const debris = this.streetIncidents.debris(this.brokenFixtures, this.elapsed);
        return this.populationTraffic.update(frame, this.cars, trafficCar, (car, pose) => this.carFits(car, pose.x, pose.z, pose.yaw), car => car.id === this.driven || car.id === this.transition?.carId || car.id === this.savedCar?.id ||
            car.id === tow?.car || car.id === tow?.truck || car.id === trial?.car || this.impactSliding.has(car) ||
            this.cityTraffic.cabDoor(car, this.elapsed) || this.people.some(p => p.cab === car.id), (index, s, pose) => {
            const lane = sim_navigation_js_1.lanes[index];
            const inWay = (p, clearance) => {
                if ((0, sim_navigation_js_1.dist)(p, pose) > 64)
                    return false;
                const at = lane.nearest(p), gap = lane.difference(s, at.s);
                return at.d < clearance && gap >= -3 && gap < 56;
            };
            return debris.some(p => inWay(p, p.radius + 1.5)) || this.cars.some(car => ((0, traffic_bypass_js_1.stalledTraffic)(car, this.elapsed) || car.impactRecovery) && inWay(car, 1.85));
        });
    }
    nearbyCar() {
        let best = null, distance = 4.65;
        for (const c of this.cars) {
            const d = (0, sim_navigation_js_1.dist)(this.hero, c);
            if (c.carriedBy || c.police || c.districtEscort || Math.abs(c.speed) > 2.6 || d >= distance || !(0, sim_navigation_js_1.visible)(this.hero, c))
                continue;
            distance = d;
            best = c;
        }
        return best;
    }
    nearbyResident() {
        let best = null, distance = 3.45;
        for (const p of this.streetPeople) {
            const d = (0, sim_navigation_js_1.dist)(this.hero, p);
            if (d < distance && (0, sim_navigation_js_1.visible)(this.hero, p)) {
                distance = d;
                best = p;
            }
        }
        return best;
    }
    atGarage() { return !this.home.inside && !this.home.door && near(this.hero, world_layout_js_1.places.garage, 7.2); }
    district() { return this.home.avatar ? (0, house_layout_js_1.houseRoom)(this.home.avatar.x, this.home.avatar.z, this.home.avatar.y) : (0, world_layout_js_1.districtAt)(this.hero.x, this.hero.z); }
    objective() {
        const goals = [
            ['Заберите блок стрелок на рынке', 'Установите блок у диспетчерской', 'Дождитесь прохода трамвая'],
            ['Найдите повреждённый фургон у депо', 'Доставьте фургон к гаражу'],
            ['Заберите кассету у Инны на рынке', 'Скройтесь от патруля', 'Отнесите кассету Лёше во дворах']
        ];
        return this.mission < 3 ? { ...exports.campaign[this.mission], goal: goals[this.mission][this.stage] ?? goals[this.mission][0] } : { title: 'Свободный город', goal: 'Исследуйте район', reward: 0 };
    }
    target() {
        if (this.home.inside)
            return null;
        let p;
        if (this.mission === 0)
            p = this.stage === 0 ? world_layout_js_1.places.market : world_layout_js_1.places.depot;
        if (this.mission === 1)
            p = this.stage === 0 ? this.cars.find(c => c.id === 'service-van') : world_layout_js_1.places.garage;
        if (this.mission === 2)
            p = this.stage === 0 ? world_layout_js_1.places.market : world_layout_js_1.places.hideout;
        if (!p)
            return null;
        return { x: p.x, z: p.z, label: this.mission === 2 && this.stage === 1 ? 'Панельные дворы' : this.objective().goal };
    }
    missionAction() {
        const target = this.target();
        if (!target || !near(this.hero, target, this.mission === 1 && this.stage === 1 ? 7.1 : 4.4) || !(0, sim_navigation_js_1.visible)(this.hero, target))
            return '';
        const car = this.activeCar();
        if (car && Math.abs(car.speed) > 2.8)
            return '';
        if (this.mission === 0 && this.stage === 0)
            return car ? 'Выйти' : 'Забрать блок';
        if (this.mission === 0 && this.stage === 1)
            return this.driven ? 'Выйти' : 'Установить блок';
        if (this.mission === 1 && this.stage === 0)
            return car && car.id !== 'service-van' ? 'Выйти' : 'Принять фургон';
        if (this.mission === 1 && this.stage === 1 && car?.id === 'service-van')
            return 'Сдать фургон';
        if (this.mission === 2 && this.stage === 0)
            return 'Забрать кассету';
        if (this.mission === 2 && this.stage === 2 && !this.wanted)
            return 'Передать кассету';
        return '';
    }
    tramHint() {
        if (this.driven || this.home.inside || this.home.door || this.transition || this.exchange)
            return '';
        return this.tramRider.hint(this.hero, this.tramTime);
    }
    tramExitFree = (x, z) => (0, collision_js_3.clearDisc)({ x, z }, .31, (0, world_layout_js_1.groundHeight)(x, z), this.cars) && !this.streetPeople.some(p => near(p, { x, z }, .54));
    tramInteract() {
        const hint = this.tramHint();
        if (!hint)
            return false;
        const text = this.tramRider.act(this.hero, this.tramTime, this.tramExitFree);
        this.emit('toast', text);
        if (hint === 'Войти в трамвай') {
            this.jumpVelocity = 0;
            this.emit('speech', 'Посадка окончена. Следующая остановка — ' + world_railway_js_1.tramStops[(0, world_railway_js_1.linePose)(this.tramTime).nextStop].title + '.', 'Линия 07', (0, world_railway_js_1.linePose)(this.tramTime).nextStop === 'market' ? 'line-to-market' : 'line-to-depot');
        }
        return true;
    }
    hint() {
        if (this.transition || this.exchange || this.home.door)
            return '';
        if (this.tramRider.onboard)
            return this.tramHint();
        const doorway = this.driven ? '' : this.home.hint(this.hero);
        if (this.home.inside || doorway)
            return doorway;
        const action = this.missionAction();
        if (action)
            return action;
        const tram = this.tramHint();
        if (tram)
            return tram;
        if (this.driven)
            return this.atGarage() && Math.abs(this.activeCar().speed) < 1.3 ? 'Гараж' : 'Выйти';
        const person = this.nearbyResident(), car = this.nearbyCar();
        if (car && (!person || (0, sim_navigation_js_1.dist)(this.hero, car) < (0, sim_navigation_js_1.dist)(this.hero, person) + 1.1))
            return 'Сесть';
        if (person)
            return 'Поговорить';
        if (car)
            return 'Сесть';
        return this.atGarage() ? 'Гараж' : '';
    }
    advance(text, who, clip) {
        this.stage++;
        this.emit('speech', text, who, clip);
        this.saveCheckpoint();
    }
    pay() {
        const { reward, title } = exports.campaign[this.mission];
        this.money += reward;
        this.mission++;
        this.stage = 0;
        this.emit('reward', title + ' · +' + reward.toLocaleString('ru-RU') + ' ₽');
        if (this.mission === 1)
            this.emit('speech', 'Стрелка встала! Тоня ищет водителя для фургона у депо. Адрес в телефоне.', 'Семён', 'reward1');
        if (this.mission === 2)
            this.emit('speech', 'Фургон вернулся. Инна на рынке просит забрать старую кассету.', 'Тоня', 'garage');
        if (this.mission === 3)
            this.emit('speech', 'Запись у меня. Пусть весь район услышит, кому продали нашу линию.', 'Лёша', 'finale');
        this.saveCheckpoint();
    }
    interactionOptions() {
        const first = this.hint();
        if (!first)
            return [];
        if (this.tramRider.onboard || this.home.inside || this.home.door || this.exchange || this.transition)
            return [first];
        const actions = new Set([first]);
        if (this.driven) {
            if (Math.abs(this.activeCar().speed) < 1.3 && this.atGarage())
                actions.add('Гараж');
            actions.add('Выйти');
        }
        else {
            const mission = this.missionAction(), door = this.home.hint(this.hero);
            const tram = this.tramHint();
            if (tram)
                actions.add(tram);
            if (mission)
                actions.add(mission);
            if (door)
                actions.add(door);
            if (this.nearbyCar())
                actions.add('Сесть');
            if (this.nearbyResident())
                actions.add('Поговорить');
            if (this.atGarage())
                actions.add('Гараж');
        }
        return [...actions];
    }
    interact(requested) {
        const action = requested ? (this.interactionOptions().includes(requested) ? requested : '') : this.hint();
        if (action && action === this.tramHint() && this.tramInteract())
            return;
        if (action === 'Войти в дом' || action === 'Выйти на улицу') {
            const started = this.home.begin(this.hero, p => (0, collision_js_3.clearDisc)(p, .31, (0, world_layout_js_1.groundHeight)(p.x, p.z), this.cars) && !this.streetPeople.some(n => near(n, p, .55)));
            if (started) {
                this.jumpVelocity = 0;
                this.emit('sound', 'hinge');
            }
            else
                this.emit('toast', 'Выход занят. Подождите у двери.');
            return;
        }
        switch (action) {
            case 'Забрать блок':
                this.beginExchange('vendor');
                break;
            case 'Установить блок':
                this.beginExchange('dispatcher');
                break;
            case 'Принять фургон': {
                const van = this.cars.find(c => c.id === 'service-van');
                if (this.driven === van.id)
                    this.acceptVan();
                else
                    this.enter(van);
                break;
            }
            case 'Сдать фургон':
                this.pay();
                break;
            case 'Забрать кассету':
                this.stage = 1;
                this.report(true);
                this.emit('speech', 'Здесь запись о закрытии депо. Патруль уже у рынка. Передай кассету Лёше во дворах.', 'Инна', 'chase');
                this.saveCheckpoint();
                break;
            case 'Передать кассету':
                this.pay();
                break;
            case 'Сесть': {
                const c = this.nearbyCar();
                if (c)
                    this.enter(c);
                break;
            }
            case 'Выйти':
                this.leaveCar();
                break;
            case 'Гараж':
                this.greetMechanic();
                this.emit('garage', 'Канальный гараж');
                break;
            case 'Поговорить': {
                const p = this.nearbyResident();
                if (p) {
                    this.lastSpeaker = p.id;
                    const memory = this.cityLife.witnesses[p.id];
                    const familiar = this.cityLife.greet(p.id, this.elapsed);
                    if (memory && this.elapsed - memory.t < 180) {
                        this.emit('speech', 'Я помню эту машину. Вон там всё и случилось.', 'Очевидец', 'witness');
                        this.emit('toast', memory.reason + ' · ' + memory.district);
                    }
                    else if (familiar) {
                        const greeting = p.role === 'walker' ? 'Мы уже встречались. Берегите ноги, у канала скользко.' : 'С возвращением. У вас ещё дело в районе?';
                        this.emit('speech', greeting, lines[p.role][0]);
                    }
                    else {
                        const district = p.id.startsWith('region-') ? (0, region_layout_js_1.regionIdAt)(p.x, p.z) : null;
                        if (district)
                            this.emit('speech', region_traffic_js_1.regionalSpeech[district].local, 'Житель', (0, region_traffic_js_1.hasRegionalVoice)(district) ? 'local-' + district : undefined);
                        else
                            this.emit('speech', lines[p.role][1], lines[p.role][0], p.role === 'walker' ? 'resident' : p.role);
                    }
                    p.wait = 3.8;
                    p.lookUntil = this.elapsed + 4;
                }
                break;
            }
        }
    }
    greetMechanic() {
        const mechanic = this.people.find(p => p.role === 'mechanic');
        if (near(mechanic, this.hero, 9))
            mechanic.lookUntil = this.elapsed + 4;
    }
    acceptVan() {
        this.advance('Батарея держит, но кузов помят. Довези до гаража у канала.', 'Тоня', 'delivery');
    }
    beginExchange(role) {
        const person = this.people.find(p => p.role === role), h = this.hero;
        const angle = Math.atan2(h.z - person.z, h.x - person.x);
        for (const offset of [0, .45, -.45, .9, -.9, 1.55, -1.55, 2.4, -2.4, Math.PI]) {
            const to = { x: person.x + .84 * Math.cos(angle + offset), z: person.z + .84 * Math.sin(angle + offset) };
            if (!(0, collision_js_3.clearDisc)(to, .31, h.y, this.cars) || !(0, collision_js_3.clearPath)(h, to, .29, h.y, this.cars))
                continue;
            this.exchange = { role, t: 0, duration: 1.3 + (0, sim_navigation_js_1.dist)(h, to) / 3.5, from: { x: h.x, z: h.z }, to, startYaw: h.yaw };
            return;
        }
        this.emit('toast', 'Подойдите к собеседнику со свободной стороны');
    }
    updateExchange(dt) {
        const e = this.exchange, h = this.hero, p = this.people.find(n => n.role === e.role);
        e.t = (0, sim_navigation_js_1.clamp)(e.t + dt / e.duration, 0, 1);
        const f = ease(e.t / .42), x = (0, sim_navigation_js_1.lerp)(e.from.x, e.to.x, f), z = (0, sim_navigation_js_1.lerp)(e.from.z, e.to.z, f);
        h.speed = Math.hypot(x - h.x, z - h.z) / dt;
        h.x = x;
        h.z = z;
        h.y = (0, world_layout_js_1.groundHeight)(x, z);
        h.yaw = e.startYaw + (0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(e.to, p) - e.startYaw) * ease(e.t / .35);
        p.yaw += (0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(p, h) - p.yaw) * Math.min(1, dt * 9);
        p.lookYaw = 0;
        p.speed = 0;
        if (e.t < 1)
            return;
        this.exchange = null;
        h.speed = 0;
        if (e.role === 'vendor')
            this.advance('Держи блок. Семён ждёт у стрелки, севернее дворов.', 'Инна', 'market');
        else {
            this.tramTime = 0;
            this.emit('sound', 'switch');
            this.advance('Контакт есть. Смотри на стрелку, последний пошёл!', 'Семён', 'depot');
        }
    }
    gripStand(c, side, open) {
        return { stand: boarding.stand(c, side, open), handle: (0, vehicle_cabin_js_1.doorHandleWorld)(c.kind, c, side, open) };
    }
    doorSweepFree(c, side, open, people) {
        const cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind), a = Math.abs((0, vehicle_cabin_js_1.doorAngle)(side, open));
        const inset = vehicle_cabin_js_1.doorHingeInset, pivot = cabin.halfWidth - inset;
        const stand = boarding.stand(c, side, open);
        if (!(0, collision_js_3.clearDisc)(stand, .30, c.y, this.cars, c) || people.some(p => near(p, stand, .55)))
            return false;
        const hinge = (0, collision_js_3.toWorld)(c, side * pivot, cabin.hingeZ);
        const tip = (0, collision_js_3.toWorld)(c, side * (pivot + Math.cos(a) * inset + Math.sin(a) * cabin.doorLength), cabin.hingeZ + Math.cos(a) * cabin.doorLength - Math.sin(a) * inset);
        if (!(0, collision_js_3.clearPath)(hinge, tip, .065, c.y, this.cars, c))
            return false;
        const dx = tip.x - hinge.x, dz = tip.z - hinge.z, len = dx * dx + dz * dz;
        return !people.some(p => {
            if (!near(p, hinge, 2))
                return false;
            const t = (0, sim_navigation_js_1.clamp)(((p.x - hinge.x) * dx + (p.z - hinge.z) * dz) / len, 0, 1);
            return Math.hypot(p.x - hinge.x - t * dx, p.z - hinge.z - t * dz) < .30;
        });
    }
    exitSill(c, side) {
        const cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind);
        return (0, collision_js_3.toWorld)(c, side * (cabin.halfWidth + .09), cabin.seatZ + .13);
    }
    exitPathFree(c, a, b, people) {
        if (!(0, collision_js_3.clearPath)(a, b, .30, c.y, this.cars, c))
            return false;
        const dx = b.x - a.x, dz = b.z - a.z, len = dx * dx + dz * dz;
        return !people.some(p => {
            const t = len ? (0, sim_navigation_js_1.clamp)(((p.x - a.x) * dx + (p.z - a.z) * dz) / len, 0, 1) : 0;
            return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz) < .54;
        });
    }
    door(c, side, entry) {
        const cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind), w = cabin.halfWidth, people = this.streetBodies();
        const spot = this.gripStand(c, side, 0).stand;
        if (!(0, collision_js_3.clearDisc)(spot, .32, (0, world_layout_js_1.groundHeight)(spot.x, spot.z), this.cars, c))
            return null;
        let opening = 0;
        for (let j = 0; j <= 16; j++) {
            const open = j / 16;
            if (!this.doorSweepFree(c, side, open, people))
                break;
            opening = open;
        }
        if (opening < .47)
            return null;
        opening = Math.min(opening, Math.asin(Math.min(.90, 1.10 / cabin.doorLength)) / 1.117);
        if (!entry) {
            const opened = this.gripStand(c, side, opening).stand;
            return this.exitPathFree(c, this.exitSill(c, side), opened, people) && this.exitPathFree(c, opened, spot, people) ? { route: [spot], opening } : null;
        }
        const start = { x: this.hero.x, z: this.hero.z }, local = (0, collision_js_3.toLocal)(c, start);
        const ends = [cabin.rear + .58, cabin.front - .58].sort((a, b) => Math.abs(a - local.z) - Math.abs(b - local.z));
        const alternatives = [[start, spot]];
        for (const z of ends) {
            const outside = (0, collision_js_3.toWorld)(c, side * (w + .50), z), opposite = (0, collision_js_3.toWorld)(c, -side * (w + .50), z);
            alternatives.push([start, outside, spot], [start, opposite, outside, spot]);
        }
        const route = alternatives.find(path => path.slice(1).every((b, i) => (0, collision_js_3.clearPath)(path[i], b, .29, c.y, this.cars)));
        return route ? { route, opening } : null;
    }
    setTransition(c, kind) {
        if (this.transition || this.exchange)
            return;
        const entry = kind === 'enter', sideOfHero = (0, collision_js_3.toLocal)(c, this.hero).x < 0 ? -1 : 1;
        const preferred = entry ? sideOfHero : -1;
        for (const side of [preferred, -preferred]) {
            const door = this.door(c, side, entry);
            if (!door)
                continue;
            const { route, opening } = door;
            const cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind);
            const travelTime = boarding.duration(cabin, entry);
            const walkLength = route.slice(1).reduce((sum, b, i) => sum + (0, sim_navigation_js_1.dist)(route[i], b), 0);
            const passengerExit = !entry && side === 1;
            const crossing = side === 1 ? seatCrossingTime : 0;
            this.transition = { carId: c.id, kind, side, t: 0, route, opening, travelTime, crossing, duration: travelTime + (entry ? walkLength / 2.85 : 0) + crossing,
                seated: entry ? 0 : 1, doorOpen: 0, reach: 0, doorDuck: 0, doorStep: 0, insideHandle: !entry, startYaw: this.hero.yaw };
            if (passengerExit) {
                this.emit('toast', 'Выход через пассажирскую дверь');
            }
            if (!entry)
                this.driven = null;
            c.auto = false;
            c.returning = false;
            c.braking = true;
            c.speed = 0;
            c.vx = 0;
            c.vz = 0;
            this.impactSliding.delete(c);
            this.impactSpin.delete(c);
            delete c.impactRecovery;
            delete c.bypass;
            delete c.trafficStalledUntil;
            delete c.releaseAt;
            this.jumpVelocity = 0;
            this.updateTransition(0);
            return;
        }
        this.emit('toast', entry ? 'У дверей нет свободного места' : 'Подъедьте к свободному месту');
    }
    enter(c) { this.setTransition(c, 'enter'); }
    leaveCar() {
        if (this.transition || this.exchange)
            return;
        const c = this.activeCar();
        if (!c)
            return;
        if (Math.max(Math.abs(c.speed), Math.hypot(c.vx, c.vz)) > 6) {
            this.emit('toast', 'Сбавьте скорость для выхода');
            return;
        }
        this.setTransition(c, 'exit');
    }
    updateCarExit(tx, c, dt) {
        const s = (0, vehicle_cabin_js_1.carCabin)(c.kind), h = this.hero, opening = tx.opening ??= 1;
        const side = tx.side, crossing = tx.crossing ?? (side === 1 ? .56 : 0);
        const previousTime = tx.t * tx.duration;
        const time = (0, sim_navigation_js_1.clamp)(previousTime + (tx.blocked ? -dt : dt), 0, tx.duration);
        const phase = (0, sim_navigation_js_1.clamp)((time - crossing) / (tx.travelTime ?? 1.56), 0, 1);
        const crossed = crossing ? Math.min(1, time / crossing) : 1;
        const previousOpen = tx.doorOpen, previousPhase = tx.phase ?? 0;
        boarding.cycle(tx, phase);
        const doorOpen = tx.doorOpen, p = 1 - phase;
        const sill = this.exitSill(c, side), stood = this.gripStand(c, side, opening).stand, finished = this.gripStand(c, side, 0).stand;
        const seat = (0, collision_js_3.toWorld)(c, side * s.seatX, s.seatZ);
        let pos = seat;
        if (crossed < 1)
            pos = (0, collision_js_3.toWorld)(c, (0, sim_navigation_js_1.lerp)(-s.seatX, s.seatX, ease(crossed)), s.seatZ - .055 * Math.sin(crossed * Math.PI));
        else if (p < .34)
            pos = boarding.stand(c, side, doorOpen);
        else
            pos = boarding.passage(c, tx, p);
        if (!tx.blocked && phase > 0) {
            const people = this.streetBodies();
            const early = p >= .746;
            const ready = previousPhase > 0 || this.doorSweepFree(c, side, opening, people) && this.exitPathFree(c, sill, stood, people) && this.exitPathFree(c, stood, finished, people);
            const sweepSafe = Math.abs(doorOpen - previousOpen) < .003 || this.doorSweepFree(c, side, doorOpen, people);
            const pathSafe = early || this.exitPathFree(c, h, pos, people);
            if (!ready || !sweepSafe || !pathSafe) {
                boarding.cycle(tx, previousPhase);
                if (side * (0, collision_js_3.toLocal)(c, h).x > s.halfWidth + .31 &&
                    (0, collision_js_3.clearDisc)(h, .30, h.y, this.cars) && !people.some(p => near(p, h, .54))) {
                    this.transition = null;
                    h.speed = 0;
                }
                else
                    tx.blocked = true;
                return;
            }
        }
        if (!tx.blocked && doorOpen > 0 && previousOpen === 0)
            this.emit('sound', 'exit');
        tx.t = time / tx.duration;
        tx.passengerSlide = crossed < 1 ? Math.sin(crossed * Math.PI) : 0;
        tx.driverSeatWeight = side === -1 ? 1 : 1 - ease(crossed);
        const grip = this.gripStand(c, side, doorOpen);
        const doorYaw = (0, sim_navigation_js_1.aim)(grip.stand, grip.handle);
        const facing = c.yaw + (0, sim_navigation_js_1.wrapAngle)(doorYaw - c.yaw) * (1 - ease((p - .30) / .41));
        h.speed = dt ? (0, sim_navigation_js_1.dist)(h, pos) / dt : 0;
        h.x = pos.x;
        h.z = pos.z;
        h.y = (0, sim_navigation_js_1.lerp)(c.y, (0, collision_js_3.footFloor)(pos, c.y, .10), 1 - tx.seated);
        h.yaw = dt ? (0, sim_navigation_js_1.wrapAngle)(h.yaw + (0, sim_navigation_js_1.wrapAngle)(facing - h.yaw) * Math.min(1, dt * 15)) : c.yaw;
        if (tx.blocked && time <= 0) {
            this.transition = null;
            this.driven = c.id;
            Object.assign(h, { x: c.x, y: c.y, z: c.z, yaw: c.yaw, speed: 0 });
            this.emit('toast', 'Дверь заблокирована · Освободите место');
        }
        else if (time >= tx.duration) {
            this.transition = null;
            h.speed = 0;
        }
    }
    updateTransition(dt) {
        const tx = this.transition, resume = tx.resumeFrom;
        if (!resume)
            return this.advanceTransition(dt);
        const h = this.hero, lastX = h.x, lastZ = h.z;
        this.advanceTransition(dt);
        if (this.transition !== tx)
            return;
        const blend = ease((resume.age += dt) / .22);
        h.x = (0, sim_navigation_js_1.lerp)(resume.x, h.x, blend);
        h.y = (0, sim_navigation_js_1.lerp)(resume.y, h.y, blend);
        h.z = (0, sim_navigation_js_1.lerp)(resume.z, h.z, blend);
        h.speed = dt ? Math.hypot(h.x - lastX, h.z - lastZ) / dt : 0;
        if (blend >= 1)
            delete tx.resumeFrom;
    }
    advanceTransition(dt) {
        const tx = this.transition, c = this.cars.find(n => n.id === tx.carId), h = this.hero;
        if (!c) {
            this.transition = null;
            this.driven = null;
            h.speed = 0;
            h.y = (0, collision_js_3.footFloor)(h, h.y, .10, this.cars);
            return;
        }
        if (tx.kind === 'exit') {
            this.updateCarExit(tx, c, dt);
            return;
        }
        const s = (0, vehicle_cabin_js_1.carCabin)(c.kind), crossing = tx.crossing ?? (tx.side === 1 ? .56 : 0);
        const doorEntryTime = tx.travelTime ?? 1.48;
        const before = tx.t;
        tx.t = (0, sim_navigation_js_1.clamp)(tx.t + (tx.blocked ? -dt : dt) / tx.duration, 0, 1);
        const approach = Math.max(0, tx.duration - doorEntryTime - crossing);
        const time = tx.t * tx.duration;
        const phase = (0, sim_navigation_js_1.clamp)((time - approach) / doorEntryTime, 0, 1);
        const crossed = crossing ? (0, sim_navigation_js_1.clamp)((time - approach - doorEntryTime) / crossing, 0, 1) : 0;
        tx.opening ??= 1;
        const previousOpen = tx.doorOpen, previousPhase = tx.phase ?? 0;
        boarding.cycle(tx, phase);
        if (!tx.blocked && Math.abs(tx.doorOpen - previousOpen) > .001 && !this.doorSweepFree(c, tx.side, tx.doorOpen, this.streetBodies())) {
            boarding.cycle(tx, previousPhase);
            tx.t = before;
            tx.blocked = true;
            return;
        }
        if (tx.doorOpen > 0 && previousOpen === 0 && !tx.blocked)
            this.emit('sound', 'enter');
        tx.passengerSlide = crossing ? Math.sin(crossed * Math.PI) : 0;
        tx.driverSeatWeight = tx.side === -1 ? 1 : ease(crossed);
        let pos, yaw;
        if (time < approach) {
            const at = t => { const k = Math.min(1, t / approach); return k <= .8 ? k / .9 : 1 - (1 - k) ** 2 / .36; };
            pos = pointAlong(tx.route, at(time));
            const ahead = pointAlong(tx.route, at(time + .08));
            yaw = (0, sim_navigation_js_1.dist)(pos, ahead) > .001 ? (0, sim_navigation_js_1.aim)(pos, ahead) : h.yaw;
        }
        else {
            const grip = this.gripStand(c, tx.side, tx.doorOpen);
            if (phase < .34)
                pos = grip.stand;
            else if (phase < 1)
                pos = boarding.passage(c, tx, phase);
            else
                pos = (0, collision_js_3.toWorld)(c, (0, sim_navigation_js_1.lerp)(tx.side * s.seatX, -s.seatX, ease(crossed)), s.seatZ - .055 * tx.passengerSlide);
            const doorYaw = (0, sim_navigation_js_1.aim)(grip.stand, grip.handle);
            yaw = doorYaw + (0, sim_navigation_js_1.wrapAngle)(c.yaw - doorYaw) * ease((phase - .30) / .41);
        }
        if (!tx.blocked && time < approach && !this.exitPathFree(c, h, pos, this.streetBodies())) {
            this.transition = null;
            h.speed = 0;
            this.emit('toast', 'Проход к двери занят');
            return;
        }
        h.speed = dt ? (0, sim_navigation_js_1.dist)(pos, h) / dt : 0;
        h.x = pos.x;
        h.z = pos.z;
        h.y = (0, sim_navigation_js_1.lerp)((0, collision_js_3.footFloor)(pos, c.y, .10), c.y, tx.seated);
        h.yaw = dt ? (0, sim_navigation_js_1.wrapAngle)(h.yaw + (0, sim_navigation_js_1.wrapAngle)(yaw - h.yaw) * Math.min(1, dt * 15)) : tx.startYaw;
        if (tx.blocked && time <= approach) {
            this.transition = null;
            h.speed = 0;
            this.emit('toast', 'У двери препятствие · Освободите место');
            return;
        }
        if (tx.t < 1)
            return;
        this.transition = null;
        h.speed = 0;
        this.driven = c.id;
        Object.assign(h, { x: c.x, y: c.y, z: c.z, yaw: c.yaw });
        this.emit('toast', names[c.kind]);
        if (this.mission === 1 && this.stage === 0 && c.id === 'service-van')
            this.acceptVan();
    }
    garageCar() {
        if (!this.atGarage())
            return null;
        const active = this.activeCar();
        if (active)
            return active;
        const parked = this.cars.filter(c => !c.police && near(c, world_layout_js_1.places.garage, 9));
        const selected = parked.find(c => c.id === this.savedCar?.id);
        return selected ?? parked.sort((a, b) => (0, sim_navigation_js_1.dist)(a, this.hero) - (0, sim_navigation_js_1.dist)(b, this.hero))[0] ?? null;
    }
    commitGarageService(c, fee) {
        this.money -= fee;
        this.savedCar = { id: c.id, kind: c.kind, color: c.color, health: c.health, systems: copy((0, vehicle_systems_js_1.equipment)(c)), scrapes: copy(c.scrapes ?? []) };
        this.saveCheckpoint();
    }
    garage(action, selection) {
        if (!this.atGarage()) {
            this.emit('toast', 'Подъедьте к гаражу у канала');
            return false;
        }
        const c = this.garageCar();
        if (!c) {
            this.emit('toast', 'Поставьте автомобиль у ворот');
            return false;
        }
        if (Math.abs(c.speed) > 1.5) {
            this.emit('toast', 'Остановите машину у ворот');
            return false;
        }
        this.greetMechanic();
        let fee = 0;
        if (action === 'repair') {
            fee = (0, vehicle_road_js_1.garageRepairCost)(c);
            if (!fee) {
                this.emit('toast', 'Машина уже исправна');
                return false;
            }
            if (this.money < fee) {
                this.emit('toast', 'Для ремонта нужно ' + fee + ' ₽');
                return false;
            }
            (0, vehicle_road_js_1.repairEquipment)(c, true);
            this.emit('toast', 'Машина отремонтирована · −' + fee + ' ₽');
        }
        else if (action === 'repairPart') {
            const result = (0, garage_service_js_1.applyWorkshopJob)(c, selection, this.money);
            if (!result) {
                this.emit('toast', 'Эта работа больше не требуется');
                return false;
            }
            fee = result.job.price;
            if (!result.done) {
                this.emit('toast', 'Для этой работы нужно ' + fee + ' ₽');
                return false;
            }
            this.emit('toast', (selection === 'polish' ? 'Царапины убраны' : 'Работа выполнена') + ' · −' + fee + ' ₽');
        }
        else if (action === 'paint') {
            if (this.money < 150) {
                this.emit('toast', 'Для окраски нужно 150 ₽');
                return false;
            }
            const next = selection && /^#[0-9a-f]{6}$/i.test(selection) ? selection : paintColors[(paintColors.indexOf(c.color) + 1) % paintColors.length];
            if (next.toLowerCase() === c.color.toLowerCase()) {
                this.emit('toast', 'Этот цвет уже выбран');
                return false;
            }
            fee = 150;
            c.color = next;
            delete (0, vehicle_systems_js_1.equipment)(c).donorDoors;
            this.emit('toast', 'Окраска готова · −150 ₽');
        }
        else
            this.emit('toast', 'Машина сохранена · ' + names[c.kind]);
        this.commitGarageService(c, fee);
        return true;
    }
    toggleLights() {
        const c = this.activeCar();
        if (c) {
            c.lights = !c.lights;
            this.emit('sound', 'switch');
        }
    }
    horn() {
        if (this.driven) {
            this.hornTime = this.elapsed;
            this.emit('sound', 'horn');
        }
    }
    jump() {
        if (this.tramRider.onboard || this.street.locked)
            return;
        if (this.home.inside || this.home.door) {
            this.home.jump();
            return;
        }
        if (!this.driven && !this.transition && !this.exchange && this.hero.y <= (0, collision_js_3.footFloor)(this.hero, this.hero.y, .30, this.cars) + .04) {
            if (this.motorPool.vault)
                return;
            const route = (0, collision_js_2.vaultRoute)(this.hero, this.cars);
            if (route) {
                this.motorPool.vault = route;
                return;
            }
            this.jumpVelocity = 5.1;
            this.hero.y += .012;
        }
    }
    tick(dt, input = {}) {
        if (!Number.isFinite(dt) || dt <= 0)
            return;
        if (input.jump && !this.jumpDown)
            this.jump();
        this.jumpDown = !!input.jump;
        let left = Math.min(dt, .20);
        while (left > 1e-6) {
            const step = Math.min(left, 1 / 40);
            this.step(step, input);
            left -= step;
        }
    }
    step(dt, input) {
        this.elapsed += dt;
        this.distantClock += dt;
        this.distantStep = this.distantClock >= (0, population_performance_js_1.distantPopulationTick)(this.populationPressure) ? this.distantClock : 0;
        if (this.distantStep)
            this.distantClock = 0;
        (0, collision_js_1.bindMarketTables)(this.cars, (0, exploration_layout_js_1.marketLayouts)(this.elapsed));
        this.motorPool.tick(this, dt);
        this.moveTram(dt);
        if (this.cargoRail.poses.length) {
            const walkers = this.driven || this.home.inside || this.tramRider.onboard ? this.streetPeople : [...this.streetPeople, this.hero];
            this.cargoRail.tick(dt, this.cars, walkers);
            (0, collision_js_1.bindCargoRail)(this.cars, this.cargoRail.poses, this.cargoRail.barriers);
        }
        const car = this.activeCar();
        if (this.street.locked && (car || this.transition || this.home.door || this.home.inside || this.tramRider.onboard))
            this.street.restore();
        if (this.tramRider.onboard || this.home.door || this.home.inside || this.transition || this.exchange || car)
            this.pedestrian.reset();
        if (this.tramRider.onboard) {
            const arrival = this.tramRider.update(dt, this.hero, this.tramTime, this.tramExitFree);
            if (arrival)
                this.emit('speech', (arrival.exited ? 'Вы вышли. ' : 'Остановка. ') + world_railway_js_1.tramStops[arrival.stop].title, 'Линия 07', arrival.stop === 'depot' ? 'line-depot' : 'line-market');
        }
        else if (this.home.door || this.home.inside)
            this.home.update(dt, input, this.hero);
        else if (this.transition)
            this.updateTransition(dt);
        else if (this.exchange)
            this.updateExchange(dt);
        else if (car)
            this.drive(car, input, dt);
        else
            this.walk(input, dt);
        this.motorPool.syncTowed(this);
        const repaired = this.cityLife.updateRepair(this.elapsed, this.brokenFixtures, p => (0, collision_js_3.hullFits)(this.liftProbe, p, this.cars, [...this.streetPeople, this.hero]), p => !this.streetPeople.some(n => near(n, p, .58)) && (!!this.driven || !near(this.hero, p, .62)) &&
            !this.cars.some(c => {
                if (!near(c, p, 3.6))
                    return false;
                const q = (0, collision_js_3.toLocal)(c, p), h = (0, vehicle_cabin_js_1.carCabin)(c.kind);
                return Math.abs(q.x) < h.halfWidth + .25 && q.z > h.front - .25 && q.z < h.rear + .25;
            }));
        const rig = this.cityLife.repair;
        if (rig) {
            (0, collision_js_3.bindRepairRig)(this.cars, (0, city_life_js_1.repairPose)(rig, this.elapsed));
            const record = this.brokenFixtures[rig.id];
            if (record && record.raisedAt === undefined && this.elapsed - rig.start >= 13) {
                this.brokenFixtures = { ...this.brokenFixtures, [rig.id]: { ...record, raisedAt: this.elapsed } };
                (0, collision_js_3.setBrokenFixtures)(this.cars, this.brokenFixtures);
            }
        }
        else if (repaired)
            (0, collision_js_3.bindRepairRig)(this.cars, null);
        if (repaired) {
            const next = { ...this.brokenFixtures };
            delete next[repaired];
            this.brokenFixtures = next;
            this.darkJunctions = (0, fixtures_js_1.brokenCircuits)(next);
            (0, collision_js_3.setBrokenFixtures)(this.cars, next);
        }
        this.moveImpactCars(dt);
        this.moveTraffic(dt);
        this.movePeople(dt);
        this.pursuit(dt);
        if (this.population)
            this.refreshPopulation(finite(input.populationYaw, finite(input.cameraYaw, this.hero.yaw)));
        if (this.mission === 0 && this.stage === 2 && this.tramTime >= 6.0)
            this.pay();
    }
    holdNextDepotDeparture(seconds) {
        if (this.tramTime >= 0 && Number.isFinite(seconds))
            this.depotHold = (0, sim_navigation_js_1.clamp)(seconds, 0, 18);
    }
    moveTram(dt) {
        if (this.tramTime < 0)
            return;
        const now = (0, world_railway_js_1.linePose)(this.tramTime);
        if (now.stop === 'works' && now.elapsedAtStop < 1 && this.tramRider.request !== 'works'
            && (this.tramRider.onboard || Math.hypot(this.hero.x - now.x, this.hero.z - now.z) > 10)) {
            this.tramTime += 14 - now.elapsedAtStop;
            return;
        }
        if (!this.tramRider.onboard && !this.driven && !this.home.inside && now.stop && now.elapsedAtStop >= 10 && now.elapsedAtStop < 12.8 && this.hero.speed > 2.5) {
            const arrival = Math.round(this.tramTime - now.elapsedAtStop);
            const platform = world_railway_js_1.tramStops[now.stop], dx = platform.x - this.hero.x, dz = platform.z - this.hero.z;
            if (this.mobilityWaitedFor !== arrival && dx*dx + dz*dz < 8.5*8.5 && -dx*Math.sin(this.hero.yaw)-dz*Math.cos(this.hero.yaw)>0) {
                this.mobilityWaitedFor = arrival;
                this.mobilityDoorHold = 3.5;
                this.emit('toast', 'Водитель заметил вас и держит двери.');
            }
        }
        if (now.stop && now.doors > .8 && this.mobilityDoorHold > 0) {
            this.mobilityDoorHold = Math.max(0, this.mobilityDoorHold - dt);
            return;
        }
        if (this.depotHold > 0 && now.service && now.stop === 'depot' && now.doors > .88) {
            this.depotHold = Math.max(0, this.depotHold - dt);
            return;
        }
        const clockStep = dt * (now.service ? (0, city_life_js_1.railShiftRate)(this.cityMinutes) : 1);
        const future = (0, world_railway_js_1.linePose)(this.tramTime + .46);
        if (now.visible && (Math.abs(now.x - future.x) + Math.abs(now.z - future.z) > .00001)) {
            const pedestrians = this.driven || this.tramRider.onboard ? this.streetPeople : [this.hero, ...this.streetPeople];
            const crossing = this.railwayCrossing(now.x, now.z, future.speed);
            const approaching = crossing && ((crossing.x - now.x) * Math.sin(now.yaw) + (crossing.z - now.z) * Math.cos(now.yaw)) * Math.sign(future.speed) > 0;
            const occupied = crossing && approaching && this.cars.some(c => Math.abs(c.z - crossing.z) < crossing.width &&
                Math.abs(c.x - crossing.x) < Math.max(-(0, vehicle_cabin_js_1.carCabin)(c.kind).front, (0, vehicle_cabin_js_1.carCabin)(c.kind).rear) + crossing.halfLength);
            const blocked = occupied || (0, collision_js_3.tramObstructed)(future, this.cars, pedestrians);
            this.railRate = (0, sim_navigation_js_1.clamp)(this.railRate + (blocked ? -3.6 : 1.6) * dt, 0, 1);
            const next = (0, world_railway_js_1.linePose)(this.tramTime + this.railRate * clockStep);
            if ((0, collision_js_3.tramObstructed)(next, this.cars, pedestrians))
                this.railRate = 0;
            if (this.railRate < .04 && !this.railWarned && near(now, this.hero, 12)) {
                this.railWarned = true;
                this.emit('sound', 'tram');
                this.emit('toast', 'Трамвай пропускает движение · Освободите путь');
            }
            else if (this.railRate > .6)
                this.railWarned = false;
        }
        else
            this.railRate = 1;
        this.tramTime += this.railRate * clockStep;
        (0, collision_js_3.setTramBody)(this.cars, (0, world_railway_js_1.linePose)(this.tramTime));
    }
    walk(input, dt) {
        const h = this.hero, yaw = input.cameraYaw ?? h.yaw;
        if (this.neighbourhoodSeated || this.neighbourhoodShelf) {
            this.pedestrian.reset(); h.speed = 0; return;
        }
        if (this.neighbourhoodCompanion) {
            if (Math.abs(input.moveX || 0) + Math.abs(input.moveY || 0) > .15)
                this.neighbourhoodReleasePair = true;
            else {
                const dx = this.neighbourhoodCompanion.x - h.x, dz = this.neighbourhoodCompanion.z - h.z;
                const d = Math.hypot(dx,dz), f = d > .14 ? Math.min(.54, d) / d : 0;
                input = { ...input, run:false, analog:true, moveX:(dx*Math.cos(yaw)-dz*Math.sin(yaw))*f, moveY:(-dx*Math.sin(yaw)-dz*Math.cos(yaw))*f };
            }
        }
        if (this.streetStep(input, dt))
            return;
        const vault = this.motorPool.vault;
        if (vault) {
            this.pedestrian.reset();
            const running = (vault.running ??= !!input.run);
            const duration = running ? .62 : .88, exitSlope = running ? 1 : 0;
            vault.t = Math.min(1, vault.t + dt / duration);
            const t = vault.t, e = t * t * (3 - 2 * t + exitSlope * (t - 1));
            const vx = (vault.to.x - vault.from.x) / duration, vz = (vault.to.z - vault.from.z) / duration;
            h.x = (0, sim_navigation_js_1.lerp)(vault.from.x, vault.to.x, e);
            h.z = (0, sim_navigation_js_1.lerp)(vault.from.z, vault.to.z, e);
            const base = (0, world_layout_js_1.groundHeight)(h.x, h.z);
            h.y = base + (vault.top - base + .28) * Math.sin(Math.PI * t);
            h.speed = Math.hypot(vx, vz) * t * (6 * (1 - t) + exitSlope * (3 * t - 2));
            h.vault = t;
            h.vaultHand = vault.hand;
            this.jumpVelocity = 0;
            if (t === 1) {
                this.motorPool.vault = null;
                delete h.vault;
                delete h.vaultHand;
                h.y = base;
                this.pedestrian.resume(h, vx * exitSlope, vz * exitSlope);
            }
            return;
        }
        const x = Number(input.moveX) || 0, z = Number(input.moveY) || 0;
        const length = Math.hypot(x, z), direction = length > .01 ? yaw + Math.atan2(-x, z) : h.yaw;
        const squeeze = (0, collision_js_2.narrowGap)(h, h.y, direction, this.cars);
        h.squeeze = (0, sim_navigation_js_1.lerp)(h.squeeze ?? 0, squeeze ? 1 : 0, Math.min(1, dt * 10));
        const head = (0, collision_js_2.headRoom)(h.x, h.z, h.y) - h.y;
        h.duck = (0, sim_navigation_js_1.lerp)(h.duck ?? 0, (0, sim_navigation_js_1.clamp)((1.8 - head) / .43, 0, 1), Math.min(1, dt * 12));
        const normalSpeed = squeeze ? 1.24 : head < 1.8 ? 1.55 : input.run ? 6.25 : 1.85;
        const urbanPose=this.neighbourhoodPose, heavy=urbanPose?.item==='box'||urbanPose?.item==='rail';
        const max = Math.min(normalSpeed,heavy?1.6:Infinity) * (1-.35*(urbanPose?.slip||0));
        const oldY = h.y;
        const wasGrounded = h.y <= (0, collision_js_3.footFloor)(h, h.y, .30, this.cars) + .035 && this.jumpVelocity <= 0;
        const winterPath = require("./culture-paths.js");
        const grip = winterPath.grip(h.x, h.z, this.cultureWeather);
        const step = this.pedestrian.command(h, grip < 1 ? { ...input, groundGrip: grip } : input, max, dt, wasGrounded);
        this.jumpVelocity -= 13 * dt;
        if (length > .025)
            this.motorPool.pushOnFoot(this, step.dx, step.dz);
        let pos = (0, collision_js_3.walkSlide)(h, step.dx, step.dz, squeeze ? .215 : .31, h.y, this.cars, this.streetBodies());
        if (this.cultureWeather?.closed && winterPath.insideWorks(pos.x, pos.z) && !winterPath.insideWorks(h.x, h.z)) {
            pos = winterPath.insideWorks(pos.x, h.z) ? { x: h.x, z: h.z } : { x: pos.x, z: h.z };
        }
        if (h.x > -263 && h.x < -245 && Math.abs(h.z - 10.2) < 1 && require("./city-additions.js").closedGate(h,pos,this.cityMinutes))
            pos.z = h.z;
        const floor = (0, collision_js_3.footFloor)(pos, oldY, .30, this.cars), canStep = floor <= oldY + .235;
        this.pedestrian.resolve(h, step, canStep ? pos.x : h.x, canStep ? pos.z : h.z, dt);
        const supported = canStep ? floor : (0, collision_js_3.footFloor)(h, oldY, .30, this.cars);
        h.y = Math.max(supported, h.y + this.jumpVelocity * dt);
        if (h.y <= supported + .008 || (wasGrounded && Math.abs(supported - oldY) < .235)) {
            h.y = supported;
            this.jumpVelocity = 0;
        }
        const ceiling = (0, collision_js_2.headRoom)(h.x, h.z, h.y);
        if (h.y + 1.39 > ceiling) {
            if (this.jumpVelocity > 1) {
                this.emit('sound', 'land');
                h.duck = 1;
            }
            h.y = Math.max(supported, ceiling - 1.39);
            this.jumpVelocity = Math.min(0, this.jumpVelocity);
        }
    }
    carFits(c, x, z, yaw) {
        const people = this.streetBodies();
        return (0, collision_js_3.hullFits)(c, { x, z, yaw }, this.cars, this.driven ? people : [...people, this.hero]);
    }
    impactLean(c) {
        const pose = this.impactPose.get(c);
        if (!pose || this.elapsed - pose.at > 1.25)
            return;
        const fade = Math.exp(-5.3 * (this.elapsed - pose.at));
        return { pitch: pose.pitch * fade, roll: pose.roll * fade };
    }
    impactYaw(c, grip, dt) {
        const old = this.impactSpin.get(c) ?? 0;
        if (Math.abs(old) < .012)
            return 0;
        const { turn, rate } = (0, vehicle_impact_js_1.recoverImpactYaw)(old, grip, dt);
        this.impactSpin.set(c, rate);
        return turn;
    }
    setImpactVelocity(c, v) {
        c.vx = v.x;
        c.vz = v.z;
        c.speed = -Math.sin(c.yaw) * v.x - Math.cos(c.yaw) * v.z;
        this.impactSpin.set(c, v.yawRate);
    }
    dentInCollision(c, pose, n, at, severity, normal, tangent) {
        const mark = (0, collision_js_3.contactPoint)(pose, n, at), scratch = { ...mark, severity }, s = (0, vehicle_systems_js_1.equipment)(c);
        const oldLeft = s.leftLamp, oldRight = s.rightLamp;
        (0, vehicle_road_js_1.recordBodyScratch)(c, scratch);
        const inward = (0, collision_js_3.toLocal)(pose, { x: pose.x + n.x, z: pose.z + n.z });
        (0, vehicle_road_js_1.recordImpact)(c, scratch, severity, normal, { ...inward, tangentSpeed: tangent });
        c.health = Math.max(c.health < 6 ? c.health : 6, c.health - severity * 12 * (s.underbody ? .87 : 1));
        s.shock = Math.max(s.shock, severity * 11);
        const load = 1 + (s.load ?? 0) / 1800, roll = c.kind === 'van' ? .24 : c.kind === 'hatch' ? .17 : .14;
        this.impactPose.set(c, { at: this.elapsed, pitch: -inward.z * severity * .12, roll: inward.x * severity * load * roll });
        return oldLeft !== s.leftLamp || oldRight !== s.rightLamp;
    }
    rememberImpact(c, withId) {
        const recent = (this.recentImpact.get(c) ?? []).filter(item => this.elapsed - item.at < .39);
        const seen = recent.some(item => item.with === withId);
        if (!seen)
            this.recentImpact.set(c, [...recent.slice(-5), { with: withId, at: this.elapsed }]);
        return seen;
    }
    resolveImpact(c, hit, grip) {
        const n = { x: hit.nx, z: hit.nz }, q = hit.contact, b = hit.car, pole = hit.fixture;
        const va = (0, vehicle_impact_js_1.impactVelocity)(c, true, this.impactSpin.get(c));
        const vb = b ? (0, vehicle_impact_js_1.impactVelocity)(b, this.impactSliding.has(b) || b.id === this.driven, this.impactSpin.get(b)) : null;
        const otherCanMove = b && b.id !== this.transition?.carId && !b.systems?.plugged;
        const pair = b && vb && otherCanMove ? (0, vehicle_impact_js_1.solveVehicleImpact)(c, b, q, n, va, vb, grip, hit.source) : null;
        const normal = pair?.closing ?? Math.max(0, -(va.x * n.x + va.z * n.z));
        const tangent = pair?.tangent ?? Math.abs(va.x * n.z - va.z * n.x);
        const strength = pair?.strength ?? (0, sim_navigation_js_1.clamp)((normal + Math.min(2, tangent * .12)) / 14, 0, 1);
        const breaks = !!pole && normal >= (0, fixtures_js_1.breakSpeed)(c.kind, pole), snow = hit.surface === 'snow';
        const prop = hit.prop, previousFence = prop?.fence;
        const movedProp = prop ? this.motorPool.strike(prop, c, normal, tangent, this.elapsed, hit) : false;
        const fenceStrike = prop?.fence && prop.fence !== previousFence, fenceFall = fenceStrike && prop.broken;
        if (fenceStrike)
            this.cityLife.witness(this.streetPeople, q, this.elapsed, city_life_js_1.fenceDamageWitness, sim_navigation_js_1.visible);
        if (pair && b) {
            this.setImpactVelocity(c, pair.a);
            if (normal > .24 && (b.id === this.driven || pair.bShock > .18 || this.impactSliding.has(b))) {
                this.setImpactVelocity(b, pair.b);
                if (b.id !== this.driven) {
                    this.impactSliding.set(b, this.elapsed + 3.4);
                    b.braking = true;
                }
            }
        }
        else {
            const retain = breaks ? .72 : movedProp ? (hit.prop?.kind === 'cart' ? .84 : .92) : snow ? .49 : normal < tangent * .35 ? .993 : .961;
            const block = breaks || movedProp ? 0 : normal * (snow ? 1.025 : 1);
            this.setImpactVelocity(c, { x: (va.x + block * n.x) * retain, z: (va.z + block * n.z) * retain, yawRate: va.yawRate * (snow ? .55 : .8) });
        }
        if (pole && breaks) {
            const length = Math.max(.001, Math.hypot(va.x, va.z));
            this.brokenFixtures = { ...this.brokenFixtures, [pole.id]: { at: this.elapsed, dx: va.x / length, dz: va.z / length } };
            if (pole.circuit)
                this.darkJunctions.add(pole.circuit);
            (0, collision_js_3.setBrokenFixtures)(this.cars, this.brokenFixtures);
            this.emit('toast', pole.kind === 'lamp' ? 'Фонарь погас' : 'Светофор повреждён · Перекрёсток без сигнала');
        }
        if (!breaks && !fenceStrike && !movedProp && normal < .88 && (normal < .02 || tangent < 4.8))
            return;
        const surface = b ? 'vehicle' : hit.surface ?? 'concrete', key = b?.id ?? pole?.id ?? hit.prop?.id ?? surface;
        if (this.rememberImpact(c, key) && !breaks && !fenceFall)
            return;
        if (b)
            this.rememberImpact(b, c.id);
        this.bumpTime = this.elapsed;
        const potency = snow ? strength * .18 : strength;
        const aSeverity = pair ? (0, sim_navigation_js_1.clamp)((normal * .52 + pair.aShock * .68 + Math.min(1.2, tangent * .095)) / 14, 0, 1) : potency;
        const aGlass = this.dentInCollision(c, { ...c, ...hit.source }, n, q, aSeverity, normal, tangent);
        let bGlass = false;
        if (b) {
            const bNormal = { x: -n.x, z: -n.z };
            const severity = pair ? (0, sim_navigation_js_1.clamp)((normal * .48 + pair.bShock * .69 + Math.min(1.2, tangent * .095)) / 14, 0, 1) : strength * .70;
            bGlass = this.dentInCollision(b, b, bNormal, q, severity, normal, tangent);
            if (b.auto && !b.police && normal > 8.4 && severity > .38)
                b.trafficStalledUntil = this.elapsed + (0, sim_navigation_js_1.clamp)(5 + normal * 1.2, 9, 27);
        }
        const travelX = va.x - (vb?.x ?? 0), travelZ = va.z - (vb?.z ?? 0), travel = Math.hypot(travelX, travelZ);
        const material = surface === 'wood' ? 'wood' : 'plastic';
        const fragments = { dx: travel > .001 ? travelX / travel : -n.x, dz: travel > .001 ? travelZ / travel : -n.z,
            material, glass: aGlass || bGlass, snow: !!fenceFall && (0, world_layout_js_1.surfaceAt)(q.x, q.z) === 'snow' };
        const crash = this.streetIncidents.impact(q, this.elapsed, potency, fenceFall ? 'fence' : breaks ? 'fixture' : 'collision', fragments);
        const player = this.driven, playerWasHit = b?.id === player, focus = playerWasHit && b ? b : c;
        const second = playerWasHit ? c : b, sign = playerWasHit ? -1 : 1;
        this.events.push({ type: 'sound', text: breaks ? 'pole' : fenceStrike ? 'fence' : 'impact', impact: {
                time: this.elapsed, ...q, y: (0, world_layout_js_1.groundHeight)(q.x, q.z) + .55, strength: Math.max(breaks ? .32 : 0, strength),
                normalSpeed: normal, tangentSpeed: tangent, nx: n.x * sign, nz: n.z * sign, carId: focus.id, otherId: second?.id, surface, glass: aGlass || bGlass || breaks,
                crash: crash && (0, street_incidents_js_1.leavesDebris)(crash) ? { kind: crash.kind, severity: crash.severity, debris: crash.debris } : undefined
            } });
        if (c.id === player) {
            if (breaks || normal > 6 || b?.police && normal > 2)
                this.report(false, breaks ? (pole.kind === 'lamp' ? 'Повреждение фонаря' : 'Повреждение светофора') : 'Столкновение');
        }
    }
    trafficContact(c, next, player, dt) {
        if (!player || c === player || Math.abs(c.speed) < 1.45 || !near(c, player, 7.5))
            return false;
        const dx = next.x - c.x, dz = next.z - c.z;
        const moved = (0, collision_js_3.moveHull)(c, dx, dz, next.yaw, this.cars, this.streetBodies());
        if (moved.hit?.car !== player)
            return false;
        c.x = moved.x;
        c.z = moved.z;
        c.yaw = moved.yaw;
        c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
        c.vx = dx / dt;
        c.vz = dz / dt;
        c.braking = true;
        this.impactSliding.set(c, this.elapsed + 3.4);
        this.resolveImpact(c, moved.hit, (0, vehicle_road_js_1.tyreGrip)(c, (x, z) => this.motorPool.snow.isCleared(x, z), (0, weather_js_1.weatherAt)(this.elapsed, this.cityMinutes)).mean);
        return true;
    }
    moveImpactCars(dt) {
        if (!this.impactSliding.size)
            return;
        const weather = (0, weather_js_1.weatherAt)(this.elapsed, this.cityMinutes);
        const crowd = this.streetBodies();
        const people = this.driven || this.home.inside || this.tramRider.onboard ? crowd : [...crowd, this.hero];
        for (const [car, until] of this.impactSliding) {
            if (car.id === this.driven || car.id === this.transition?.carId || car.carriedBy || !this.cars.includes(car)) {
                this.impactSliding.delete(car);
                if (car.id === this.transition?.carId)
                    this.impactSpin.delete(car);
                continue;
            }
            const grip = (0, vehicle_road_js_1.tyreGrip)(car, (x, z) => this.motorPool.snow.isCleared(x, z), weather).mean;
            const yaw = (0, sim_navigation_js_1.wrapAngle)(car.yaw + this.impactYaw(car, grip, dt));
            const move = (0, collision_js_3.moveHull)(car, car.vx * dt, car.vz * dt, yaw, this.cars, people);
            car.x = move.x;
            car.z = move.z;
            car.yaw = move.yaw;
            car.y = (0, world_layout_js_1.groundHeight)(car.x, car.z);
            if (move.hit)
                this.resolveImpact(car, move.hit, grip);
            const slow = (0, vehicle_impact_js_1.recoverImpactVelocity)((0, vehicle_impact_js_1.impactVelocity)(car, true, this.impactSpin.get(car)), car.yaw, grip, dt);
            this.setImpactVelocity(car, { ...slow, yawRate: this.impactSpin.get(car) ?? 0 });
            car.wheel += car.speed * dt / vehicle_cabin_js_1.specs[car.kind].r;
            (0, vehicle_systems_js_1.equipment)(car).shock *= Math.exp(-dt * 2.6);
            if (this.elapsed < until && (Math.hypot(car.vx, car.vz) > .16 || Math.abs(this.impactSpin.get(car) ?? 0) > .10))
                continue;
            this.impactSliding.delete(car);
            this.impactSpin.delete(car);
            car.vx = car.vz = car.speed = 0;
            if (car.auto) {
                const lane = sim_navigation_js_1.lanes[car.lane], entry = lane.nearest(car), next = lane.at(entry.s);
                car.s = entry.s;
                delete car.bypass;
                delete car.siding;
                if (entry.d > .14 || Math.abs((0, sim_navigation_js_1.wrapAngle)(next.yaw - car.yaw)) > .12) {
                    car.auto = false;
                    car.returning = true;
                    car.impactRecovery = true;
                    car.releaseAt = Math.max(this.elapsed + .22, car.trafficStalledUntil ?? 0);
                }
            }
        }
    }
    drive(c, input, dt) {
        const system = (0, vehicle_systems_js_1.equipment)(c);
        system.shock *= Math.exp(-dt * 2.6);
        const spray = this.cars.some(v => v !== c && Math.abs(v.speed) > 4 && Math.abs(v.x - c.x) < 3.4 && Math.abs(v.z - c.z) < 5);
        const conditions = (0, weather_js_1.weatherAt)(this.elapsed, this.cityMinutes), speed = Math.abs(c.speed);
        system.wet = (0, sim_navigation_js_1.clamp)(system.wet + dt * ((spray ? .44 : .004) + speed * .0009 - (system.wipers ? .60 : 0)), 0, 1);
        const glassWet = system.glassWet ?? system.wet;
        const precipitation = conditions.rain * .068 + conditions.snow * (.018 + conditions.wetSnow * .013);
        const deposit = precipitation + (spray ? .38 : 0), drying = (.012 + speed * .0014) * glassWet;
        system.glassWet = (0, sim_navigation_js_1.clamp)(glassWet + dt * (deposit - drying), 0, 1);
        const grip = (0, vehicle_road_js_1.tyreGrip)(c, (x, z) => this.motorPool.snow.isCleared(x, z), conditions);
        grip.mean *= this.cityTraffic.snowGrip(c, this.elapsed, this.cityMinutes);
        const yaw = (0, sim_navigation_js_1.wrapAngle)((0, vehicle_handling_js_1.stepDrive)(c, input, system, grip, dt) + this.impactYaw(c, grip.mean, dt));
        const moved = (0, collision_js_3.moveHull)(c, c.vx * dt, c.vz * dt, yaw, this.cars, this.streetBodies());
        c.x = moved.x;
        c.z = moved.z;
        c.yaw = moved.yaw;
        if (moved.hit)
            this.resolveImpact(c, moved.hit, grip.mean);
        c.braking = !!input.brake || !!input.handbrake;
        c.wheel += c.speed * dt / vehicle_cabin_js_1.specs[c.kind].r;
        if (c.speed > 5.6 && this.elapsed - this.reportTime > 7) {
            for (const s of world_layout_js_1.signalPositions) {
                const axis = Math.abs(Math.sin(c.yaw)) > .7 ? 'x' : 'z';
                if (near(c, s, 3.6) && !this.darkJunctions.has((0, fixtures_js_1.junctionKey)(s)) && !(0, world_layout_js_1.signalGreen)(axis, this.elapsed)) {
                    this.report(false, 'Проезд на красный');
                    break;
                }
            }
        }
        const front = (0, collision_js_3.toWorld)(c, 0, (0, vehicle_cabin_js_1.carCabin)(c.kind).front * .70), rear = (0, collision_js_3.toWorld)(c, 0, (0, vehicle_cabin_js_1.carCabin)(c.kind).rear * .70);
        const roadStep = Math.abs(this.motorPool.road(front.x, front.z, this) - this.motorPool.road(rear.x, rear.z, this));
        const scrape = (0, vehicle_road_js_1.underbodyContact)(c, (x, z) => this.motorPool.road(x, z, this));
        if (scrape > .015 && this.elapsed - this.bumpTime > .32) {
            const retained = 1 - Math.min(.42, scrape * (system.underbody ? 1.5 : 2.8));
            c.vx *= retained;
            c.vz *= retained;
            c.speed *= retained;
            c.health = Math.max(6, c.health - scrape * (system.underbody ? 9 : 22));
            this.bumpTime = this.elapsed;
            this.emit('sound', 'impact');
        }
        else if (c.x > -81 && c.x < -72 && c.z > -61 && c.z < -51 && roadStep > .20 && Math.abs(c.speed) > 3 && this.elapsed - this.bumpTime > .85) {
            c.health = Math.max(6, c.health - roadStep * (system.underbody ? .68 : 1.5));
            this.bumpTime = this.elapsed;
            this.emit('sound', 'impact');
        }
        c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
        (0, vehicle_road_js_1.updateSurfaceWear)(c, dt);
        Object.assign(this.hero, { x: c.x, y: c.y, z: c.z, yaw: c.yaw, speed: Math.abs(c.speed) });
    }
    railwayCrossing(x, z, speed) {
        if (!speed)
            return null;
        if (speed > 0 ? z > -59 && z < -36 : z > -56 && z < -32)
            return { x: 5, z: -46, width: 3.5, halfLength: 1.4 };
        if (z > 13 && x < 13.5)
            return { x: 10.5, z: 28.05, width: 1.5, halfLength: 5.45 };
        return null;
    }
    moveTraffic(dt) {
        const h = this.hero, active = this.activeCar(), minutes = this.cityMinutes;
        const debris = this.streetIncidents.debris(this.brokenFixtures, this.elapsed);
        const tram = this.tramTime >= 0 ? (0, world_railway_js_1.linePose)(this.tramTime + .2) : null;
        const crossing = tram && this.railwayCrossing(tram.x, tram.z, tram.speed);
        const tramHold = (car, lane, pose = car, s = car.s) => {
            if (!crossing || Math.abs(pose.z - crossing.z) >= crossing.width)
                return false;
            const ahead = (crossing.x - pose.x) * -Math.sin(pose.yaw);
            const shape = (0, vehicle_cabin_js_1.carCabin)(car.kind);
            const buffer = Math.max(-shape.front, shape.rear) + crossing.halfLength + .05;
            if (ahead <= buffer || ahead >= buffer + 15)
                return false;
            if (ahead < buffer + 10)
                return true;
            const exit = lane.at(s + ahead + buffer + 2.7);
            return this.cars.some(other => other !== car && Math.abs(other.speed) < 1.4 && near(other, exit, 4.5));
        };
        let weather;
        const ice = (x, z) => (0, weather_js_1.roadIceAt)(x, z, weather ??= (0, weather_js_1.weatherAt)(this.elapsed, minutes));
        for (const c of this.cars) {
            if (c.carriedBy || this.impactSliding.has(c))
                continue;
            if (c.police && (this.responders.includes(c.id) || this.patrolFoot.has(c.id)))
                continue;
            if (c.returning) {
                if (this.elapsed < (c.releaseAt ?? 0)) {
                    c.braking = true;
                    continue;
                }
                this.resumePatrol(c, dt);
                continue;
            }
            if (!c.auto || c.id === this.driven)
                continue;
            if ((0, traffic_bypass_js_1.stalledTraffic)(c, this.elapsed)) {
                this.cityTraffic.speedLimit(c, this.elapsed, minutes);
                c.speed = c.vx = c.vz = 0;
                c.braking = true;
                continue;
            }
            if (c.trafficStalledUntil !== undefined)
                delete c.trafficStalledUntil;
            const ambient = c.id.startsWith('population-car-');
            const regional = c.id.startsWith('region-') || c.id.startsWith('outer-') || c.id.startsWith('dispatch-taxi-') || c.id.startsWith('snow-utility-');
            const distant = (ambient || regional) && !c.siding && !c.bypass && !near(c, h, 146) && !this.populationTraffic.servicing(c);
            if (distant && !this.distantStep)
                continue;
            const lane = sim_navigation_js_1.lanes[c.lane];
            const fits = (x, z, yaw) => this.carFits(c, x, z, yaw);
            const bypassFits = (x, z, yaw) => fits(x, z, yaw) && !(0, traffic_bypass_js_1.debrisInPath)(c, { x, z, yaw }, debris);
            if (c.bypass && this.queueBypasses.step(c, lane, this.cars, this.elapsed, dt, bypassFits, ice))
                continue;
            const loose = (0, traffic_bypass_js_1.trafficDebrisAhead)(c, debris, lane);
            const incidentLimit = this.streetIncidents.approach(c, this.elapsed);
            const debrisLimit = loose && loose.gap >= 1.5 ? (0, traffic_bypass_js_1.queueApproachSpeed)(loose) : loose ? 1.4 : Infinity;
            if (loose && loose.gap < 13)
                c.trafficHazardUntil = this.elapsed + 1.55;
            else if ((c.trafficHazardUntil ?? Infinity) <= this.elapsed)
                delete c.trafficHazardUntil;
            if (distant) {
                const speed = c.police ? 6.1 : roadPace[c.kind];
                const yieldState = this.darkJunctions.size ? (0, sim_navigation_js_1.unsignalledApproach)(c, this.darkJunctions, this.cars, this.streetPeople, this.elapsed, this.distantStep) : null;
                const cruise = Math.min(speed, yieldState?.limit ?? Infinity, incidentLimit, debrisLimit, this.cityTraffic.speedLimit(c, this.elapsed, minutes), this.populationTraffic.speedLimit(c, this.elapsed));
                const step = cruise * this.distantStep;
                const hold = yieldState?.hold || (this.neighbourhoodSignal && require("./city-additions.js").trafficHold(c,this.neighbourhoodSignal)) || this.cargoRail.blocksTraffic(c) || tramHold(c, lane) || (0, sim_navigation_js_1.redAhead)(c, c.yaw, this.elapsed, this.darkJunctions);
                const middleS = c.s + step * .5;
                const middle = !hold && step > 2.7 ? lane.at(middleS) : null;
                const blocked = middle && (this.cargoRail.blocksTraffic({ ...middle, speed: cruise }) || tramHold(c, lane, middle, middleS) ||
                    (0, sim_navigation_js_1.redAhead)(middle, middle.yaw, this.elapsed, this.darkJunctions) || !bypassFits(middle.x, middle.z, middle.yaw));
                const s = lane.wrap(c.s + step), next = lane.at(s);
                if (!hold && !blocked && cruise > .01 && bypassFits(next.x, next.z, next.yaw)) {
                    Object.assign(c, next, { s, y: (0, world_layout_js_1.groundHeight)(next.x, next.z), speed: cruise, braking: false, steer: 0 });
                    c.wheel += step / vehicle_cabin_js_1.specs[c.kind].r;
                }
                else {
                    c.speed = 0;
                    c.braking = true;
                }
                continue;
            }
            if (this.populationTraffic.stepService(c, this.elapsed, dt, bypassFits))
                continue;
            if ((0, city_life_js_1.pullAside)(c, this.cars, dt, fits)) {
                c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
                continue;
            }
            const p = lane.at(c.s);
            const look = lane.at(c.s + 4.5);
            const yieldState = this.darkJunctions.size ? (0, sim_navigation_js_1.unsignalledApproach)(c, this.darkJunctions, this.cars, this.driven ? this.streetPeople : [this.hero, ...this.streetPeople], this.elapsed, dt) : null;
            let stop = !!yieldState?.hold || (this.neighbourhoodSignal && require("./city-additions.js").trafficHold(c,this.neighbourhoodSignal)) || this.cargoRail.blocksTraffic(c) || (0, sim_navigation_js_1.redAhead)(p, p.yaw, this.elapsed, this.darkJunctions) || tramHold(c, lane);
            const ahead = (q, d) => {
                const dx = q.x - c.x, dz = q.z - c.z, sin = Math.sin(c.yaw), cos = Math.cos(c.yaw);
                const f = -dx * sin - dz * cos;
                return f > 0 && f < d && Math.abs(dx * cos - dz * sin) < 1.47;
            };
            if (!stop)
                stop = near(c, h, 9.5) && ahead(h, this.driven ? 7.3 : 5.4) || this.streetPeople.some(n => near(n, look, 3.8) && ahead(n, 6.2));
            const reaction = this.cityTraffic.replyToHorn(c, active ?? undefined, this.hornTime, this.elapsed);
            if (reaction === 'reply')
                this.emit('sound', 'horn');
            const cruise = c.id.startsWith('region-') ? (c.police ? 6.1 : roadPace[c.kind]) : (c.police ? 5.1 : roadPace[c.kind] * .86);
            const localLimit = Math.min(this.cityTraffic.speedLimit(c, this.elapsed, minutes, this.cityLife.repair), this.populationTraffic.speedLimit(c));
            const roadblock = !stop && localLimit > 1.4 ? (0, traffic_bypass_js_1.trafficRoadblock)(c, this.cars, this.driven, this.elapsed, loose) : null;
            if (this.queueBypasses.tryStart(c, lane, roadblock, this.cars, this.elapsed, bypassFits, ice)) {
                c.speed = c.vx = c.vz = 0;
                c.braking = true;
                continue;
            }
            if (!stop)
                stop = this.cars.some(o => o !== c && near(c, o, 9) && ahead(o, 5.6));
            const desired = stop ? 0 : Math.min(cruise + (reaction === 'ease' ? .65 : 0), yieldState?.limit ?? Infinity, localLimit, incidentLimit, debrisLimit, roadblock ? (0, traffic_bypass_js_1.queueApproachSpeed)(roadblock) : Infinity);
            c.speed += (0, sim_navigation_js_1.clamp)(desired - c.speed, -dt * 8, dt * 2.6);
            c.braking = desired + .4 < c.speed || stop;
            const nextS = lane.wrap(c.s + c.speed * dt), next = lane.at(nextS);
            if (!this.carFits(c, next.x, next.z, next.yaw)) {
                if (this.trafficContact(c, next, active, dt))
                    continue;
                c.braking = true;
                c.speed = 0;
                if (desired > 1)
                    c.blockedGeometry = (c.blockedGeometry ?? 0) + dt;
                continue;
            }
            c.blockedGeometry = 0;
            c.s = nextS;
            c.steer = (0, sim_navigation_js_1.clamp)(-(0, sim_navigation_js_1.wrapAngle)(next.yaw - c.yaw) * 7, -1, 1);
            c.x = next.x;
            c.z = next.z;
            c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
            c.yaw = next.yaw;
            c.wheel += c.speed * dt / vehicle_cabin_js_1.specs[c.kind].r;
        }
    }
    walkingDetours = new WeakMap();
    movePeople(dt) {
        const player = this.activeCar(), others = this.driven ? this.streetPeople : [...this.streetPeople, this.hero];
        const rail = (0, world_railway_js_1.linePose)(this.tramTime + .45), currentRail = (0, world_railway_js_1.linePose)(this.tramTime), minutes = this.cityMinutes;
        for (const p of this.people) {
            const commute = this.cityTraffic.commuter(p, minutes, this.elapsed, this.cars);
            const ambient = (0, population_walkers_js_1.isAmbientWalker)(p);
            if ((ambient || p.id.startsWith('region-') || p.id.startsWith('call-cab-')) && !p.onboard && !p.platformStep && !near(p, this.hero, 130)) {
                if (this.distantStep) {
                    const path = ambient ? undefined : routes[p.route];
                    const goal = ambient ? this.populationWalkers.goal(p) : commute ?? path?.[p.waypoint];
                    const distance = goal ? (0, sim_navigation_js_1.dist)(p, goal) : 0, speed = 1.18;
                    p.wait = Math.max(0, p.wait - this.distantStep);
                    p.speed = 0;
                    if (distance < .22) {
                        if (path) {
                            p.waypoint = (p.waypoint + 1) % path.length;
                            p.wait = .7;
                        }
                    }
                    else if (goal && !p.wait) {
                        const k = Math.min(1, speed * this.distantStep / distance), step = (0, collision_js_3.walkSlide)(p, (goal.x - p.x) * k, (goal.z - p.z) * k, .27, p.y, this.cars, others);
                        p.speed = (0, sim_navigation_js_1.dist)(p, step) / this.distantStep;
                        if (p.speed > .05)
                            p.yaw = (0, sim_navigation_js_1.aim)(p, step);
                        p.x = step.x;
                        p.z = step.z;
                        p.y = (0, world_layout_js_1.groundHeight)(p.x, p.z);
                    }
                    p.reaction = undefined;
                    p.lookYaw = 0;
                }
                continue;
            }
            if (this.exchange?.role === p.role) {
                p.speed = 0;
                continue;
            }
            const home = homes.get(p.id) ?? p;
            const itinerary = this.cityExtraGoals?.[p.id] ?? (ambient ? this.populationWalkers.goal(p) : commute ?? this.cityLife.goal(p, this.people, this.elapsed, dt, currentRail, minutes));
            if (p.onboard)
                continue;
            const walking = p.role === 'walker';
            let goal = itinerary ?? (walking ? routes[p.route][p.waypoint] : home);
            const detour = this.walkingDetours.get(p);
            if (detour) {
                if ((0, sim_navigation_js_1.dist)(p, detour.points[0]) < .14)
                    detour.points.shift();
                if (detour.points.length && detour.until > this.elapsed)
                    goal = detour.points[0];
                else
                    this.walkingDetours.delete(p);
            }
            const watching = p.role === 'dispatcher' && this.tramTime >= 0 && this.tramTime < 10;
            if (watching)
                goal = { x: 7.9, z: -37.25 };
            let focus = this.elapsed < (p.lookUntil ?? 0) ? this.hero : null;
            const memory = this.cityLife.witnesses[p.id];
            const fenceImpactAge = memory?.reason === city_life_js_1.fenceDamageWitness ? this.elapsed - memory.t : Infinity;
            if (!focus && memory && fenceImpactAge >= .18 && this.elapsed - memory.t < 8)
                focus = memory;
            if (!focus && ambient)
                focus = this.populationWalkers.watching(p) ?? null;
            let speed = walking ? 1.17 + (p.route % 3) * .11 : p.role === 'dispatcher' ? .86 : 1.2;
            p.reaction = undefined;
            let hazard = null, urgency = 0;
            for (const c of this.cars) {
                const velocity = Math.abs(c.speed);
                if (velocity < .5 || !near(c, p, Math.min(17, 4 + velocity * 1.35)))
                    continue;
                const local = (0, collision_js_3.toLocal)(c, p), ahead = -local.z * Math.sign(c.speed);
                const front = Math.sign(c.speed) > 0 ? -(0, vehicle_cabin_js_1.carCabin)(c.kind).front : (0, vehicle_cabin_js_1.carCabin)(c.kind).rear;
                const time = (ahead - front) / Math.max(1, velocity);
                if (ahead < -.6 || time > 1.3 || Math.abs(local.x) > (0, vehicle_cabin_js_1.carCabin)(c.kind).halfWidth + 1.15)
                    continue;
                const risk = (1.6 - time) * Math.min(13, velocity);
                if (risk > urgency) {
                    hazard = c;
                    urgency = risk;
                }
            }
            const horn = player && this.elapsed - this.hornTime < 1.2 && near(player, p, 14) ? player : null;
            let hold = p.wait > 0;
            p.wait = Math.max(0, p.wait - dt);
            if (hazard || horn) {
                const source = (hazard ?? horn), local = (0, collision_js_3.toLocal)(source, p), v = Math.abs(source.speed);
                const distance = (0, sim_navigation_js_1.dist)(p, source);
                const flee = !!hazard && v > 5.1;
                const step = !!hazard || !!horn && v > 1.25 && distance < 7.5;
                p.reaction = flee ? 'flee' : step ? 'step' : 'look';
                focus = source;
                if (step) {
                    const side = local.x < 0 ? -1 : 1;
                    const margin = (0, vehicle_cabin_js_1.carCabin)(source.kind).halfWidth + (flee ? 2.7 : 1.15);
                    goal = (0, collision_js_3.toWorld)(source, side * margin, local.z + .35 * Math.sign(source.speed));
                    speed = flee ? 3.7 : 1.65;
                    hold = false;
                    if (hazard === player && v > 8 && distance < 3.4 && this.elapsed - this.reportTime > 6)
                        this.report(false);
                }
                else if (distance < 8)
                    hold = true;
            }
            if (this.tramTime >= 0 && rail.visible && Math.abs(rail.speed) > .05 && near(p, rail, 16)) {
                const local = (0, collision_js_3.toLocal)(rail, p), ahead = local.z * Math.sign(rail.speed);
                if (ahead > -5.8 && ahead < 5.7 + Math.abs(rail.speed) * .8 && Math.abs(local.x) < 2.45) {
                    p.reaction = 'step';
                    hold = false;
                    focus = rail;
                    speed = 2.7;
                    goal = (0, collision_js_3.toWorld)(rail, Math.sign(local.x || 1) * 2.85, local.z);
                }
            }
            const freight = this.cargoRail.hazard(p);
            if (freight) {
                p.reaction = 'step';
                hold = false;
                speed = 2.4;
                goal = freight;
            }
            let retreating = false;
            if (!p.reaction && fenceImpactAge >= 0 && fenceImpactAge < 1.55 && near(p, memory, 11)) {
                hold = true;
                if (fenceImpactAge >= .19 && fenceImpactAge < .83) {
                    const awayX = p.x - memory.x, awayZ = p.z - memory.z, length = Math.hypot(awayX, awayZ);
                    if (length > .05) {
                        goal = { x: p.x + awayX / length * .76, z: p.z + awayZ / length * .76 };
                        p.reaction = 'step';
                        retreating = true;
                        hold = false;
                        speed = 1.21;
                    }
                }
            }
            let distance = (0, sim_navigation_js_1.dist)(p, goal);
            if (walking && !itinerary && !p.reaction && !this.walkingDetours.has(p) && distance < .23) {
                p.waypoint = (p.waypoint + 1) % routes[p.route].length;
                p.wait = .25 + (p.waypoint % 2) * .6;
                hold = true;
            }
            if (walking && !p.reaction) {
                if ((0, city_timetables_js_1.cityCrossingHold)(p, goal, this.cars))
                    hold = true;
                const horizontal = Math.abs(goal.x - p.x) > Math.abs(goal.z - p.z);
                const south = !horizontal && Math.abs(p.x - 39) < 1 && Math.abs(p.z - 30) > 4.7 && (p.z - 30) * (goal.z - 30) < 0;
                const west = horizontal && Math.abs(p.z + 40) < 1 && Math.abs(p.x + 50) > 4.7 && (p.x + 50) * (goal.x + 50) < 0;
                if (south || west) {
                    const cross = world_layout_js_1.signalPositions[south ? 0 : 1];
                    const nearTraffic = this.cars.some(c => Math.abs(c.speed) > 1.1 && near(c, p, 6.3));
                    if (south && this.neighbourhoodSignal ? this.neighbourhoodSignal !== 2 || nearTraffic :
                        this.darkJunctions.has((0, fixtures_js_1.junctionKey)(cross)) ? nearTraffic : (0, world_layout_js_1.signalGreen)(south ? 'x' : 'z', this.elapsed))
                        hold = true;
                }
            }
            if (!hold && walking && !p.reaction && distance > 1.4 && !this.walkingDetours.has(p)) {
                goal = require("./culture-paths.js").walkingGoal(p, goal, this.cultureWeather);
                distance = (0, sim_navigation_js_1.dist)(p, goal);
            }
            if (!hold && distance > .07) {
                const dx = (goal.x - p.x) / distance, dz = (goal.z - p.z) / distance, step = Math.min(speed * dt, distance);
                let pos = (0, collision_js_3.walkSlide)(p, dx * step, dz * step, .27, p.y, this.cars, others);
                if ((pos.x - p.x) * dx + (pos.z - p.z) * dz < step * .55) {
                    const handed = p.route % 2 === 0 ? 1 : -1;
                    if (!this.walkingDetours.has(p))
                        for (const c of this.cars) {
                            if (Math.abs(c.speed) > .3 || !near(p, c, 5))
                                continue;
                            const side = (0, collision_js_3.toLocal)(c, p), shape = (0, vehicle_cabin_js_1.carCabin)(c.kind);
                            if (Math.abs(side.x) > shape.halfWidth + .56 || side.z < shape.front - .32 || side.z > shape.rear + .32)
                                continue;
                            const sign = Math.sign(side.x || handed), across = (0, collision_js_3.toLocal)(c, goal).x * sign < -shape.halfWidth;
                            if (!across)
                                continue;
                            const back = side.z - shape.front > shape.rear - side.z;
                            const end = back ? shape.rear + .60 : shape.front - .60;
                            const first = (0, collision_js_3.toWorld)(c, sign * (shape.halfWidth + .46), end), second = (0, collision_js_3.toWorld)(c, -sign * (shape.halfWidth + .50), end);
                            if (!(0, collision_js_3.clearPath)(p, first, .27, p.y, this.cars) || !(0, collision_js_3.clearPath)(first, second, .27, p.y, this.cars))
                                continue;
                            const fraction = Math.min(1, step / Math.max(.001, (0, sim_navigation_js_1.dist)(p, first)));
                            const alt = (0, collision_js_3.walkSlide)(p, (first.x - p.x) * fraction, (first.z - p.z) * fraction, .27, p.y, this.cars, others);
                            if ((0, sim_navigation_js_1.dist)(p, alt) > (0, sim_navigation_js_1.dist)(p, pos) + .004) {
                                this.walkingDetours.set(p, { points: [first, second], until: this.elapsed + 9 });
                                pos = alt;
                                break;
                            }
                        }
                    if ((0, sim_navigation_js_1.dist)(p, pos) < step * .55)
                        for (const angle of [.72 * handed, -.72 * handed, 1.4 * handed, -1.4 * handed]) {
                            const co = Math.cos(angle), si = Math.sin(angle), x = dx * co - dz * si, z = dx * si + dz * co;
                            if (!(0, collision_js_3.clearPath)(p, { x: p.x + x * .62, z: p.z + z * .62 }, .27, p.y, this.cars))
                                continue;
                            const alt = (0, collision_js_3.walkSlide)(p, x * step, z * step, .27, p.y, this.cars, others);
                            if ((0, sim_navigation_js_1.dist)(p, alt) > (0, sim_navigation_js_1.dist)(p, pos) + .004) {
                                pos = alt;
                                break;
                            }
                        }
                }
                const moved = (0, sim_navigation_js_1.dist)(p, pos);
                p.speed = moved / dt;
                if (moved > .001 && !retreating)
                    p.yaw = (0, sim_navigation_js_1.wrapAngle)(p.yaw + (0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(p, pos) - p.yaw) * Math.min(1, dt * 9));
                p.x = pos.x;
                p.z = pos.z;
                p.y = (0, world_layout_js_1.groundHeight)(p.x, p.z);
            }
            else {
                p.speed = 0;
                if (watching && distance < .3)
                    focus = { x: 5, z: -31 };
                if (!walking || focus || p.id.startsWith('shop-')) {
                    const yaw = focus ? (0, sim_navigation_js_1.aim)(p, focus) : p.id.startsWith('shop-') ? 0 : home.yaw;
                    p.yaw = (0, sim_navigation_js_1.wrapAngle)(p.yaw + (0, sim_navigation_js_1.wrapAngle)(yaw - p.yaw) * Math.min(1, dt * (focus ? 1.15 : 2.4)));
                }
            }
            p.lookYaw = (0, sim_navigation_js_1.lerp)(p.lookYaw ?? 0, focus ? (0, sim_navigation_js_1.clamp)((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(p, focus) - p.yaw), -.98, .98) : 0, Math.min(1, dt * 7));
        }
        this.streetPeople = this.people.filter(p => !p.onboard);
    }
    setDistrictPursuit(action, reason = 'Тревога на Озёрном посту', level = 2) {
        if (action === 'reset') {
            if (this.districtPursuit)
                this.finishPursuit(this.activePatrols());
            return;
        }
        if (this.wanted && !this.districtPursuit)
            return;
        if (this.districtPursuit)
            this.finishPursuit(this.activePatrols());
        this.districtPursuit = true;
        this.dispatch((0, sim_navigation_js_1.clamp)(Math.floor(level), 1, 3), reason);
    }
    activePatrols() {
        return this.responders.map(id => this.cars.find(c => c.id === id)).filter((c) => !!c);
    }
    report(scripted, reason = scripted ? 'Перехват кассеты' : 'Опасное вождение') {
        if (!scripted) {
            this.cityLife.witness(this.people, this.hero, this.elapsed, reason, sim_navigation_js_1.visible);
            if (this.elapsed - this.reportTime < 5)
                return;
            const witnessed = this.cars.some(c => c.police && near(c, this.hero, 35) && (0, sim_navigation_js_1.visible)(c, this.hero));
            if (!witnessed)
                return;
        }
        this.dispatch(scripted ? 2 : Math.min(3, this.wanted + 1), reason, scripted);
    }
    dispatch(level, reason, campaign = false) {
        const old = this.wanted;
        this.wanted = Math.max(old, level);
        if (!old) {
            this.patrolPaths.clear();
            this.patrolTurns.clear();
            this.patrolPlanAt = -1;
            this.warned = false;
        }
        this.lastSeen = { x: this.hero.x, z: this.hero.z };
        this.search = null;
        const car = this.activeCar();
        this.patrolFoot.observe(car);
        this.lastSeenMotion = { x: car?.vx ?? 0, z: car?.vz ?? 0 };
        this.reportTime = this.elapsed;
        this.searchTime = 0;
        this.unseen = 0;
        if (this.wanted === old)
            return;
        this.capture = 0;
        this.pursuitContact = 0;
        this.cityLife.note(this.elapsed, reason + ' · ' + (0, world_layout_js_1.districtAt)(this.hero.x, this.hero.z) + ' · розыск ' + ['', 'I', 'II', 'III'][this.wanted]);
        const patrols = this.cars.filter(c => c.police);
        const ranks = campaign && !(0, region_layout_js_1.regionIdAt)(this.hero.x, this.hero.z) ? patrols : [...patrols].sort((a, b) => (0, sim_navigation_js_1.dist)(a, this.hero) - (0, sim_navigation_js_1.dist)(b, this.hero));
        this.responders = [...new Set([...this.responders, ...ranks.map(c => c.id)])].slice(0, this.wanted);
        for (let i = 0; i < this.responders.length; i++) {
            const c = patrols.find(car => car.id === this.responders[i]);
            if (campaign && i === 0 && (0, sim_navigation_js_1.dist)(c, this.hero) > 33) {
                const lane = sim_navigation_js_1.lanes[c.lane], nearest = lane.nearest(this.hero);
                for (const offset of [22, 28, 34, 40, 48]) {
                    const spawn = lane.at(nearest.s - offset);
                    if (!this.carFits(c, spawn.x, spawn.z, spawn.yaw))
                        continue;
                    Object.assign(c, spawn, { s: lane.wrap(nearest.s - offset), speed: 5 });
                    break;
                }
            }
            if (i >= old) {
                c.auto = false;
                c.returning = false;
                c.releaseAt = undefined;
                c.siding = undefined;
                this.patrolPaths.delete(c.id);
                this.patrolTurns.delete(c.id);
            }
        }
        const call = this.wanted === 3 ? 'Экипажи выходят на соседние улицы' : old ? 'Вызван второй экипаж' : 'Патруль заметил вас';
        this.emit('toast', 'Розыск · ' + ['', 'I', 'II', 'III'][this.wanted] + '  /  ' + call);
        this.emit('sound', 'alert');
    }
    captureTime() { return this.wanted === 3 ? 3.4 : 4.6; }
    finishPursuit(cars) {
        this.wanted = 0;
        this.search = null;
        this.capture = 0;
        this.unseen = 0;
        this.searchTime = 0;
        this.districtPursuit = false;
        this.pursuitContact = 0;
        this.lastSeenMotion = { x: 0, z: 0 };
        this.responders = [];
        this.patrolPaths.clear();
        this.patrolTurns.clear();
        this.patrolPlanAt = -1;
        this.patrolFoot.standDown(this.elapsed);
        this.warned = false;
        for (const [i, c] of cars.entries()) {
            c.speed = 0;
            c.auto = false;
            c.returning = true;
            c.releaseAt = this.elapsed + .65 + i * 2.45;
        }
    }
    pursuit(dt) {
        const h = this.hero, active = this.activePatrols(), car = this.activeCar();
        const interior = this.home.inside || this.tramRider.onboard;
        const order = () => ({ hero: h, contact: this.lastSeen, motion: this.lastSeenMotion, search: this.search, time: this.elapsed,
            scanTime: this.searchTime, level: this.wanted, driving: !!car, inside: interior, covered: this.street.covered,
            airborne: h.y > (0, world_layout_js_1.groundHeight)(h.x, h.z) + .16 });
        if (!this.wanted) {
            if (this.footPatrols.length)
                this.patrolFoot.step(order(), active, this.cars, this.streetPeople, dt, () => { });
            return;
        }
        let seen = false, nearest = Infinity, nearestFoot = Infinity;
        if (!interior)
            for (const c of active) {
                if (this.patrolFoot.has(c.id))
                    continue;
                const range = (0, sim_navigation_js_1.dist)(c, h), facing = Math.abs((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(c, h) - c.yaw)) < (car ? 2.24 : 1.68);
                if (range >= (car ? 39 : 23) || !(facing || range < (car ? 15 : 7.2)))
                    continue;
                if (!this.patrolFoot.recognizes(car, range, this.unseen, facing))
                    continue;
                const eye = { x: c.x, y: c.y - .32, z: c.z };
                const target = this.street.covered ? { ...h, y: h.y - .97 } : h;
                if (!(0, sim_navigation_js_1.visible)(eye, target))
                    continue;
                if (this.street.covered && !(0, collision_js_3.clearPath)(c, h, .018, h.y + .52, this.cars, c))
                    continue;
                seen = true;
                nearest = Math.min(nearest, range);
            }
        if (!interior && !car)
            for (const officer of this.footPatrols) {
                if (!this.patrolFoot.sees(officer, h, this.cars, this.street.covered))
                    continue;
                seen = true;
                nearestFoot = Math.min(nearestFoot, (0, sim_navigation_js_1.dist)(officer, h));
            }
        if (seen) {
            if (this.search)
                this.emit('toast', 'Контакт восстановлен · Экипаж снова видит цель');
            this.unseen = 0;
            this.searchTime = 0;
            this.search = null;
            this.lastSeen = { x: h.x, z: h.z };
            this.patrolFoot.observe(car);
            this.lastSeenMotion = { x: car?.vx ?? 0, z: car?.vz ?? 0 };
            const fleeing = !!car && h.speed > 9 && nearest < 30;
            this.pursuitContact = (0, sim_navigation_js_1.clamp)(this.pursuitContact + dt * (fleeing ? 1 : -1.8), 0, 20);
            const escalateAfter = this.wanted === 1 ? 8.5 : 13;
            if (this.wanted < 3 && this.pursuitContact > escalateAfter)
                this.dispatch(this.wanted + 1, 'Продолжительное преследование');
        }
        else {
            this.unseen += dt;
            this.pursuitContact = Math.max(0, this.pursuitContact - 2 * dt);
            if (this.unseen >= 2.2) {
                if (!this.search) {
                    this.search = { ...this.lastSeen, radius: 15 + this.wanted * 6 };
                    this.emit('toast', 'Потерян контакт · Патруль прочёсывает сектор');
                    const call = (0, city_life_js_1.districtCallout)(this.lastSeen.x, this.lastSeen.z);
                    this.emit('speech', call.text, 'Дежурный', call.id);
                }
                if (this.patrolFoot.checkAbandoned(order(), this.cars, active)) {
                    this.searchTime = Math.max(0, this.searchTime - 2.4);
                    this.emit('speech', 'Машина пуста. Проверим выходы из дворов.', 'Дежурный');
                    this.cityLife.note(this.elapsed, 'Найдена машина из ориентировки');
                }
                const outside = (0, sim_navigation_js_1.dist)(h, this.search) > this.search.radius;
                this.searchTime += dt * (outside || interior ? 1.65 : .88);
            }
        }
        this.patrolFoot.step(order(), active, this.cars, this.streetPeople, dt, officer => {
            if (this.street.impact(h, officer, this.elapsed))
                this.pedestrian.reset();
            this.emit('sound', 'impact');
        });
        for (let i = 0; i < active.length; i++) {
            const crew = active[i];
            if (this.impactSliding.has(crew))
                continue;
            if (this.patrolFoot.has(crew.id)) {
                crew.braking = true;
                crew.speed = 0;
                crew.vx = 0;
                crew.vz = 0;
            }
            else
                this.patrolStep(crew, i, dt);
        }
        const arrestRange = car ? 5.35 : 3.25;
        const close = nearest < arrestRange || nearestFoot < 1.55;
        this.capture = seen && close && h.speed < 1.15 ? this.capture + dt : Math.max(0, this.capture - 2 * dt);
        if (!this.warned && seen && this.wanted === 1 && Math.min(nearest, nearestFoot) < 9) {
            this.warned = true;
            this.emit('speech', car ? 'Остановись у обочины.' : 'Остановись. Муниципальный патруль.', 'Патруль', 'patrol-stop');
            this.emit('sound', 'alert');
        }
        if (this.capture > this.captureTime()) {
            if (this.districtPursuit) {
                this.finishPursuit(this.activePatrols());
                this.emit('district-capture', 'Задержание во время районного заказа');
            }
            else
                this.restart();
            this.emit('toast', 'Патруль задержал вас · Возврат к контрольной точке');
            return;
        }
        if (this.search && this.searchTime > (0, patrol_plan_js_1.scanDuration)(this.wanted)) {
            const districtPursuit = this.districtPursuit;
            this.finishPursuit(active);
            this.cityLife.note(this.elapsed, 'Розыск снят · ' + (0, world_layout_js_1.districtAt)(this.lastSeen.x, this.lastSeen.z));
            if (this.mission !== 2 || this.stage !== 1)
                this.emit('speech', 'Поиск окончен. Возвращаемся на маршрут.', 'Дежурный', 'patrol-clear');
            this.emit('toast', 'Розыск снят');
            if (!districtPursuit && this.mission === 2 && this.stage === 1)
                this.advance('Патруль ушёл. Жду во дворах за аркой.', 'Лёша', 'clear');
        }
    }
    resumePatrol(c, dt) {
        const lane = sim_navigation_js_1.lanes[c.lane], nearest = lane.nearest(c);
        const ready = c.impactRecovery ? nearest.d < .23 && Math.abs((0, sim_navigation_js_1.wrapAngle)(lane.at(nearest.s).yaw - c.yaw)) < .36 : nearest.d < .58;
        if (ready) {
            this.patrolPaths.delete(c.id);
            c.auto = true;
            c.returning = false;
            c.s = nearest.s;
            c.speed = 0;
            delete c.impactRecovery;
            return;
        }
        const entry = lane.at(nearest.s + Math.max(c.impactRecovery ? 1.2 : 0, Math.min(4, nearest.d) * .55));
        const goal = nearest.d > 15 && (c.lane >= sim_navigation_js_1.firstRegionalLane || (0, region_layout_js_1.regionIdAt)(c.x, c.z)) ? this.streetWaypoint(c, entry) ?? entry : entry;
        const gap = (0, sim_navigation_js_1.dist)(c, goal), delta = (0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(c, goal) - c.yaw);
        const yaw = (0, sim_navigation_js_1.wrapAngle)(c.yaw + (0, sim_navigation_js_1.clamp)(delta, -dt * 2.4, dt * 2.4));
        c.speed = Math.min(3, gap * 1.4) * Math.max(0, 1 - Math.abs(delta));
        const x = c.x - Math.sin(yaw) * c.speed * dt, z = c.z - Math.cos(yaw) * c.speed * dt;
        if (this.carFits(c, x, z, yaw)) {
            c.x = x;
            c.z = z;
            c.yaw = yaw;
        }
        else
            c.speed = 0;
        c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
        c.steer = (0, sim_navigation_js_1.clamp)(-delta, -1, 1);
        c.wheel += c.speed * dt / vehicle_cabin_js_1.specs[c.kind].r;
    }
    streetWaypoint(c, destination) {
        let journey = this.patrolPaths.get(c.id);
        const stale = !journey || this.elapsed - journey.planned > 1.15 && (0, sim_navigation_js_1.dist)(journey.to, destination) > 9;
        if (stale && this.elapsed >= this.patrolPlanAt) {
            const path = (0, ui_navigation_js_1.route)(c, destination, 'drive');
            journey = { to: { ...destination }, path, next: 0, planned: this.elapsed };
            this.patrolPaths.set(c.id, journey);
            this.patrolPlanAt = this.elapsed + .14;
        }
        if (!journey)
            return;
        const path = journey.path, lookAhead = (0, sim_navigation_js_1.clamp)(1.65 + Math.abs(c.speed) * .13, 1.65, 3.1);
        while (journey.next + 1 < path.length && (0, sim_navigation_js_1.dist)(c, path[journey.next]) < lookAhead)
            journey.next++;
        return path[journey.next];
    }
    patrolStep(c, index, dt) {
        const contact = { position: this.lastSeen, motion: this.lastSeenMotion };
        const intercept = !this.search && (0, patrol_plan_js_1.shouldIntercept)(this.wanted, index, !!this.driven, contact, c);
        const bridge = (0, patrol_plan_js_1.bridgePatrolTarget)(this.wanted, index, contact, world_expansion_layout_js_1.bridges);
        const destination = bridge ?? (0, patrol_plan_js_1.patrolDestination)(contact, intercept, this.search, this.searchTime, index);
        const directDistance = (0, sim_navigation_js_1.dist)(c, destination);
        const lane = sim_navigation_js_1.lanes[c.lane], end = lane.nearest(destination);
        const needsStreet = !!bridge || intercept || directDistance > 26 || end.d > 6.4 && !this.driven || !(0, sim_navigation_js_1.visible)(c, destination);
        let goal = needsStreet ? this.streetWaypoint(c, destination) : destination;
        if (!goal) {
            const current = lane.nearest(c);
            if (current.d > 4.2)
                goal = lane.at(current.s);
            else {
                const delta = lane.difference(current.s, end.s);
                goal = lane.at(current.s + Math.sign(delta) * Math.min(Math.abs(delta), 6.2 + Math.abs(c.speed) * .28));
            }
        }
        let manoeuvre = this.patrolTurns.get(c.id);
        if (!manoeuvre) {
            manoeuvre = { blocked: 0, reverse: 0 };
            this.patrolTurns.set(c.id, manoeuvre);
        }
        const reversing = manoeuvre.reverse > 0;
        manoeuvre.reverse = Math.max(0, manoeuvre.reverse - dt);
        const gap = (0, sim_navigation_js_1.dist)(goal, c), yawError = (0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(c, goal) - c.yaw);
        const top = this.search ? 6.1 : 10.5 + this.wanted * 2.45 + (intercept ? 1.8 : 0);
        const corner = Math.abs(yawError);
        const forwardLimit = corner > 1.34 ? .85 : top / (1 + corner * 1.45);
        const cruise = Math.min(forwardLimit, gap * 2.2 + .55);
        const desiredSpeed = reversing ? -2.15 : gap < 1.05 || !!bridge && directDistance < 1.7 ? 0 : cruise;
        c.speed += (0, sim_navigation_js_1.clamp)(desiredSpeed - c.speed, -dt * 12, dt * 7.1);
        const turnLimit = dt * (1.32 + 2 / (1 + Math.abs(c.speed)));
        const yaw = (0, sim_navigation_js_1.wrapAngle)(c.yaw + (0, sim_navigation_js_1.clamp)(yawError, -turnLimit, turnLimit) * (reversing ? -.67 : 1));
        const x = c.x - Math.sin(yaw) * c.speed * dt, z = c.z - Math.cos(yaw) * c.speed * dt;
        const otherCop = this.cars.some(o => o !== c && o.police && near(o, { x, z }, 2.55) && (0, sim_navigation_js_1.dist)(o, { x, z }) < (0, sim_navigation_js_1.dist)(o, c));
        if (!otherCop && this.carFits(c, x, z, yaw)) {
            c.x = x;
            c.z = z;
            c.yaw = yaw;
            manoeuvre.blocked = Math.max(0, manoeuvre.blocked - dt);
        }
        else {
            c.speed = (0, sim_navigation_js_1.lerp)(c.speed, 0, Math.min(1, dt * 9));
            if (this.carFits(c, c.x, c.z, yaw))
                c.yaw = yaw;
            const close = (0, sim_navigation_js_1.dist)(this.hero, c) < (this.driven ? 5.5 : 3.5);
            if (!close && !reversing && desiredSpeed > 1.1) {
                manoeuvre.blocked += dt;
                if (manoeuvre.blocked > .72) {
                    manoeuvre.blocked = 0;
                    manoeuvre.reverse = .92;
                }
            }
        }
        c.y = (0, world_layout_js_1.groundHeight)(c.x, c.z);
        c.steer = (0, sim_navigation_js_1.clamp)(-yawError, -1, 1);
        c.braking = c.speed > desiredSpeed + .2;
        c.wheel += c.speed * dt / vehicle_cabin_js_1.specs[c.kind].r;
    }
}
exports.Simulation = Simulation;
