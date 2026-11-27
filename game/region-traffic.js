"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regionalSpeech = exports.regionalWalks = exports.hasRegionalVoice = exports.regionalCircuitDistricts = exports.regionalCircuits = void 0;
const region_layout_js_1 = require("./region-layout.js");
function rectangle(west, east, north, south) {
    return [{ x: west, z: south }, { x: east, z: south }, { x: east, z: north }, { x: west, z: north }];
}
const circuits = [
    ['radio', rectangle(-126, 46, -360, -300)], ['quarry', rectangle(-444, -312, -117, -48)],
    ['water', rectangle(312, 444, -117, -58)], ['dock', rectangle(46, 312, 304, 366)], ['belt', rectangle(-444, 444, -360, 366)],
    ['northpark', rectangle(-140, 46, -756, -657)], ['cargo', rectangle(-864, -716, -270, -103)],
    ['dam', rectangle(702, 866, -250, -155)], ['mill', rectangle(112, 270, 686, 762)], ['express', rectangle(-944, 944, -756, 762)]
];
exports.regionalCircuits = circuits.map(([, route]) => route);
exports.regionalCircuitDistricts = circuits.map(([id]) => id);
const hasRegionalVoice = (id) => id === 'radio' || id === 'quarry' || id === 'water' || id === 'dock';
exports.hasRegionalVoice = hasRegionalVoice;
exports.regionalWalks = region_layout_js_1.regionSites.map(site => {
    const { x, z } = site.stop;
    const street = region_layout_js_1.regionRoads.filter(r => r.z1 === r.z2 && x - 17 >= r.x1 && x + 17 <= r.x2)
        .reduce((near, r) => Math.abs(r.z1 - z) < Math.abs(near.z1 - z) ? r : near);
    const across = street.z1 + Math.sign(street.z1 - z) * (street.width / 2 + 1.6);
    return [{ x: x - 17, z }, { x: x + 17, z }, { x: x + 17, z: across }, { x: x - 17, z: across }];
});
exports.regionalSpeech = {
    radio: { local: 'Слышите треск в приёмнике? Это «Полюс» начинает вечернюю передачу.', patrol: 'Радиогорск. Осмотрите подъезд к радиоцентру.' },
    quarry: { local: 'Смену на карьере за рекой слышно. Особенно когда дробилку включают.', patrol: 'Старый карьер. Проверьте дорогу возле дробильни.' },
    water: { local: 'Заблудитесь в слободе — ищите башню. От неё видно дорогу на мост.', patrol: 'Озёрная слобода. Осмотрите улицу у водонапорной башни.' },
    dock: { local: 'На ремонт в док заводят даже зимой. Лёд у ворот первым ломают.', patrol: 'Сухой док. Проверьте проходную судоверфи.' },
    northpark: { local: 'В Северном не бойтесь заблудиться. За синим двором сразу видно огни ледовой арены.', patrol: 'Северный посёлок. Проверьте проспект Полярников.' },
    cargo: { local: 'Зелёный модуль принимает смену. Красные контейнеры идут дальше, к мосту.', patrol: 'Западный терминал. Проверьте выезд на Сортировочное шоссе.' },
    dam: { local: 'Если загорелись янтарные фонари, начинается сброс. С мостика всё видно.', patrol: 'Белая плотина. Проверьте Водосброс и подходы к гидроузлу.' },
    mill: { local: 'Сушильные камеры работают всю ночь. В лесу за заводом этот гул слышно ещё километр.', patrol: 'Лесная промзона. Осмотрите Лесопильную улицу и Весовую.' }
};
