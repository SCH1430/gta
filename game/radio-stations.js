"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRadioStation = exports.radioStations = void 0;
exports.stationTrack = stationTrack;
exports.stationBulletin = stationBulletin;
const broadcasts_js_1 = require("./broadcasts.js");
exports.radioStations = { night: 'Северная волна', dispatch: 'Диспетчер 77', district: 'Канальный FM' };
const isRadioStation = (id) => typeof id === 'string' && Object.hasOwn(exports.radioStations, id);
exports.isRadioStation = isRadioStation;
exports.streetBulletins = {
    'canal-lost-keys':'Канальный FM · Связка ключей в зелёном футляре у диспетчера депо.',
    'canal-weather-snow':'Канальный FM · Снегопад, на подъездах к мосту снежная каша.',
    'canal-weather-thaw':'Канальный FM · Оттепель. На тротуарах вода.',
    'canal-weather-wind':'Канальный FM · Сильный ветер со стороны канала.',
    'canal-weather-clear':'Канальный FM · У станции проясняется, дальний берег снова видно.',
    'dispatch-yard-call':'Депо вызывает Вышку. Требуется машина к воротам.',
    'dispatch-yard-reply':'Вышка отвечает Депо. Адрес принят.'
};
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
function stationBulletin(id, slot, news = [], archive = false, city = {}) {
    if (id === 'night')
        return [];
    if (id === 'district') {
        if (slot%5===0 && city.weather) {
            const w=city.weather;
            const outlook=w.snow>.25 ? 'snow' : w.rain>.20 || w.wet>.55 && w.temperature>0 ? 'thaw' : w.wind>.54 ? 'wind' : 'clear';
            return ['canal-weather-'+outlook];
        }
        if (slot%5===1 && !city.depotKeysReturned) return ['canal-lost-keys'];
        return (0, broadcasts_js_1.nextProgramme)(slot, news, archive);
    }
    if (slot%4===0) return ['dispatch-yard-call','dispatch-yard-reply'];
    const updates = news.filter(broadcasts_js_1.isProgramme);
    return slot % 3 === 1 && updates.length ? updates : [desk[slot % desk.length]];
}
