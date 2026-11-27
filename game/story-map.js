"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldPhotos = exports.portals = exports.jobPlaces = void 0;
const { marketBay } = require("./canal-walk.js");
const at = (name, x, z, space = 'street', radius = 2.3) => ({ name, x, z, space, radius });
exports.jobPlaces = {
    desk: at('Диспетчерская · архив', 98, -2.25, 'dispatch'),
    mic: at('Диспетчерская · микрофон', 94, -2.4, 'dispatch'),
    kitchen: at('Дом № 23 · кухня', 9.2, 2, 'house'),
    lounge: at('Дом № 23 · гостиная', 4.4, 2, 'house'),
    foyer: at('Дом № 23 · старый план', -2.3, 4.9, 'house'),
    pipe: at('Тепловой узел · журнал', 32, -2, 'basement'),
    pipeB: at('Средний стояк', 36, -2, 'basement'), pipeC: at('Дальний стояк', 40, -2, 'basement'),
    workbench: at('Мастерская Инны · верстак', 67, -1.8, 'workshop'),
    loading: at('Карман у рынка', marketBay.stopX, marketBay.centreZ, 'street', 6.1),
    garage: at('Канальный гараж', -43, 41.5, 'street', 5.8),
    wagons: at('Восточная · вход на сортировочную площадку', 116.8, 12.2, 'street', 3),
    wagonA: at('Первый вагон', 118, -18), wagonB: at('Средний вагон', 118, -6), wagonC: at('Крайний вагон', 118, 6),
    shift: at('Северная ТЭЦ · посадка', -55, -110.5, 'street', 5.8),
    metal: at('Дом литейщиков', -116.5, 6, 'street', 6), wharf: at('Дом портовиков', 77, 118, 'street', 5.6),
    houseStop: at('Канальная · высадка', -34, 30, 'street', 5.1),
    nearGauge: at('Портовый мост · северный устой', 54.6, 59.1, 'street', 2.6),
    iceGauge: at('Литейный мост · ледовая рейка', -116.4, 73.2, 'street', 2.6),
    portOffice: at('Южный порт · пост гидролога', -5, 104.7),
    generator: at('Рынок · передвижной генератор', 36.9, 23.7),
    station: at('Остановка · кондуктор', 16.7, 25.8, 'street', 3.0),
    recipient: at('Квартира № 7 · вход', 4.3, -4.8, 'house'),
    tapeStall: at('Рынок · кассетный ряд', 35, 22.7),
    photoA: at('Портовый мост · площадка', 53.5, 56.4, 'street', 3.15),
    photoB: at('Северная ТЭЦ · проходная', -48, -114, 'street', 3.15),
    dockManifest: at('Сухой док · ящик у северных ворот', 73, 312.8, 'street', 2.9),
    bridgeRelay: at('Озёрный пост · полосатый шкаф', 446.2, 19.5, 'street', 6),
    alleyShelter: at('Тополиная аллея · пешеходный проход', 366, -21),
    fisherHandoff: at('Дом рыбаков · восточный вход', 499.1, -30.8, 'street', 2.35),
};
exports.portals = {
    house: at('Канальная, 23 · подъезд', -34.96, 17),
    basement: at('Канальная, 23 · спуститесь в подвал', -34.96, 17),
    workshop: at('Рынок · вход в мастерскую', 28, 14.9),
    dispatch: at('Депо · войдите в диспетчерскую', 11.1, -36.95),
    roof: at('Канальная, 23 · подъём на крышу', -34.96, 17),
};
exports.oldPhotos = [
    { at: 'photoA', year: 2051, title: 'Стрела над портом', heading: Math.atan2(-(80 - 53.5), -(97 - 56.4)), clue: 'С северного устоя Портового моста за двумя передними опорами крана К-14 видна его стрела.', story: 'Негатив подписан крановщицей Зоей. Её кран первым разгружал детали для трамвайной линии.' },
    { at: 'photoB', year: 2060, title: 'Две сестры', heading: Math.atan2(-(-1 + 48), -(-94 + 114)), clue: 'У западной проходной ТЭЦ разворот дороги выводит обе градирни в один кадр.', story: 'Местные называли градирни Вера и Надя. У каждой смены был свой любимый башенный гудок.' },
];
