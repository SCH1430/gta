"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acousticRoom = acousticRoom;
exports.doorwayDistance = doorwayDistance;
exports.acousticMix = acousticMix;
const house_layout_js_1 = require("./house-layout.js");
const clamp = (value) => Math.max(0, Math.min(1, value));
function acousticRoom(zone, player) {
    if (zone === 'house') {
        if (player.x >= 1.65)
            return 'flat';
        return player.z >= house_layout_js_1.housePlan.stairs.z2 ? 'entrance' : 'stairs';
    }
    if (zone === 'street' || zone === 'stairs' || zone === 'basement' || zone === 'lift' || zone === 'roof')
        return zone;
    return 'workroom';
}
function doorwayDistance(player, inside) {
    const door = inside ? house_layout_js_1.housePlan.entrance : house_layout_js_1.houseEntry;
    return Math.hypot(player.x - door.x, player.z - door.z);
}
const reflections = {
    street: 0, entrance: .47, stairs: .64, flat: .16, workroom: .28, basement: .56, lift: .41, roof: .02
};
function acousticMix({ inside, room, doorOpen, doorDistance, lookout, train, cabinSeal, concrete, courtyardShelter }) {
    const roomEcho = inside ? reflections[room ?? 'workroom'] : clamp(concrete ?? 0) * .24;
    if (inside) {
        const proximity = 1 / (1 + (Math.max(0, doorDistance ?? 0) / 2.8) ** 2);
        const aperture = Math.max(lookout ? .76 : 0, clamp(doorOpen ?? 0) * proximity);
        return { worldGain: .115 + .71 * aperture, worldCutoff: 510 + 6120 * aperture, stepEcho: roomEcho };
    }
    if (train)
        return { worldGain: .40, worldCutoff: 2700, stepEcho: .13 };
    const seal = clamp(cabinSeal ?? 0), shelter = clamp(courtyardShelter ?? 0);
    return { worldGain: (1 - .55 * seal) * (1 - .84 * shelter), worldCutoff: (9800 - 8340 * seal) * (1 - .80 * shelter), stepEcho: roomEcho };
}
