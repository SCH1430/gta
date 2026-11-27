"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRadioStation = exports.radioStations = void 0;
exports.stationTrack = stationTrack;
exports.stationBulletin = stationBulletin;
const broadcasts_js_1 = require("./broadcasts.js");
exports.radioStations = { night: 'Северная волна', dispatch: 'Диспетчер 77', district: 'Канальный FM' };
const isRadioStation = (id) => typeof id === 'string' && Object.hasOwn(exports.radioStations, id);
exports.isRadioStation = isRadioStation;
const library = {
    night: ['radio-north', 'radio-ice'],
    dispatch: [],
    district: ['radio-canal', 'radio-ice']
};
const desk = ['fm-weather', 'fm-ledger', 'fm-gauge', 'fm-power', 'fm-heat', 'fm-night', 'fm-hockey'];
function stationTrack(id, count) {
    const tracks = library[id];
    return tracks.length ? tracks[count % tracks.length] : null;
}
function stationBulletin(id, slot, news = [], archive = false) {
    if (id === 'night')
        return [];
    if (id === 'district')
        return (0, broadcasts_js_1.nextProgramme)(slot, news, archive);
    const updates = news.filter(broadcasts_js_1.isProgramme);
    return slot % 3 === 1 && updates.length ? updates : [desk[slot % desk.length]];
}
