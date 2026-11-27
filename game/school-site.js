"use strict";
// Map the playable campus directly onto the north side of Kanalnaya Street.
const campus = require("./campus-layout.js").campus;
const centreX = -234, centreZ = -24, height = campus.heights[2] + campus.floors.school3.ceiling;
const wings = campus.shell.map(s => ({
    ...s, x:centreX + s.x - 1000, z:centreZ + s.z, h:height
}));
const central = wings.find(s => s.kind === 'wing' && s.wing === 'central');
const front = central.z + central.d / 2;
const lobby = { x:central.x, z:front + 1.2, w:8.4, d:2.4, h:5.45, kind:'lobby' };
const doors = lobby.z + lobby.d / 2;
exports.schoolShell = [...wings, lobby];
exports.schoolCentre = central;
exports.schoolLobby = lobby;
exports.schoolBench = { x:central.x - 6.85, z:doors + 1.25, w:2.85, d:.74, h:.92 };
exports.schoolPlanter = { x:central.x + 6.35, z:doors + .88, w:1.36, d:1.36, h:.58 };
exports.schoolOutside = { x:lobby.x, z:doors + 1, yaw:Math.PI, zone:'school1', label:'Школа № 1430' };
exports.schoolWalk = { x1:lobby.x, x2:lobby.x, z1:doors, z2:24.6, width:4.6, name:'Дорожка к школе' };
exports.schoolCanopy = { x:lobby.x, z:doors + .64, w:6.04, d:1.58, bottom:2.74, top:3.02 };
// This unnamed warehouse moves with all of its generated facade details. Keep the
// rest of the seeded district intact, including building ordering and named sites.
const quarryLot = {x:-283, z:-72, w:21, d:24, h:12};
exports.relocatedQuarryLot = quarryLot;
exports.accommodateCampus = lot => lot.district === 'quarry' && lot.kind === 'brick' &&
    lot.name === '' && lot.x === -283 && lot.z === -58 ? {...lot, ...quarryLot} : lot;
