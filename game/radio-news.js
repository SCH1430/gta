"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TownRadioNews = void 0;
const sim_navigation_js_1 = require("./sim-navigation.js");
const onLane = (point, reach) => sim_navigation_js_1.lanes.some(lane => lane.nearest(point).d < reach);
class TownRadioNews {
    world;
    time = 0;
    tramRunning = false;
    nextRoadCheck = 0;
    debris;
    debrisBlocksLane = false;
    laneBlocked = false;
    laneChangeAt;
    transit;
    street;
    update(world) {
        const now = world.elapsed, tramRunning = world.tramTime >= 0;
        if (world !== this.world || now < this.time) {
            this.world = world;
            this.tramRunning = tramRunning;
            this.nextRoadCheck = now;
            this.debris = undefined;
            this.debrisBlocksLane = false;
            this.laneBlocked = false;
            this.laneChangeAt = undefined;
            this.transit = undefined;
            this.street = undefined;
        }
        this.time = now;
        if (tramRunning && !this.tramRunning)
            this.transit = { clip: 'fm-route-restored', expires: now + 95 };
        if (!tramRunning)
            this.transit = undefined;
        this.tramRunning = tramRunning;
        if (now < this.nextRoadCheck)
            return;
        this.nextRoadCheck = now + .3;
        const debris = world.streetIncidents.debris(world.brokenFixtures, now);
        if (debris !== this.debris) {
            this.debris = debris;
            this.debrisBlocksLane = debris.some(piece => onLane(piece, piece.radius + .9));
        }
        const blocked = this.debrisBlocksLane || world.cars.some(car => !car.carriedBy &&
            ((car.trafficStalledUntil ?? 0) > now || car.impactRecovery) && onLane(car, 1.35));
        if (blocked === this.laneBlocked) {
            this.laneChangeAt = undefined;
            return;
        }
        this.laneChangeAt ??= now;
        if (now - this.laneChangeAt < (blocked ? .6 : 1.15))
            return;
        this.laneChangeAt = undefined;
        this.laneBlocked = blocked;
        this.street = { clip: blocked ? 'fm-lane-blocked' : 'fm-lane-clear', expires: blocked ? Infinity : now + 48 };
    }
    take() {
        if (this.laneChangeAt === undefined && this.street && this.time <= this.street.expires) {
            const report = this.street;
            this.street = undefined;
            return report.clip;
        }
        if (this.transit && this.time <= this.transit.expires) {
            const report = this.transit;
            this.transit = undefined;
            return report.clip;
        }
    }
}
exports.TownRadioNews = TownRadioNews;
