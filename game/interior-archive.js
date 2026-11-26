"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveFigure = archiveFigure;
const interior_prints_js_1 = require("./interior-prints.js");
let image = '';
function archiveFigure() {
    if (!image) {
        const paper = (0, interior_prints_js_1.surveyPrint)();
        image = paper.image.toDataURL('image/png');
        paper.dispose();
    }
    return '<figure style="max-width:38rem;margin:.6rem auto"><img width="512" height="340" style="display:block;width:100%;height:auto" alt="Архивная схема: Фабричная, дома 23, 24, 31 и 32. Пунктир у прачечной обозначает проход на улицу Мастеров." src="' + image + '"><figcaption>Бюро инвентаризации, 2060 год. На нынешней Канальной сохранился проход за прачечной у дома № 23.</figcaption></figure>';
}
