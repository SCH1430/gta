"use strict";
exports.tramRoute = require('./tram-navigation.js').tramRoute;
const bindings = exports.bindings = {
    KeyW:'Вперёд / газ', KeyS:'Назад / тормоз', KeyA:'Влево', KeyD:'Вправо', ShiftLeft:'Бег', Space:'Прыжок / ручник',
    KeyE:'Действие', KeyT:'Все действия рядом', KeyX:'Выйти из машины', KeyF:'Фары', KeyH:'Сигнал', KeyV:'Взгляд назад',
    KeyI:'Камера вверх',KeyK:'Камера вниз',KeyU:'Камера влево',KeyO:'Камера вправо',KeyY:'Зафиксировать свободный обзор',
    KeyM:'Карта',KeyJ:'Телефон',KeyP:'Личный блокнот',KeyL:'Прочитать вывеску',KeyC:'Радио',KeyR:'Следующая станция',
    KeyB:'Дальность обзора',KeyQ:'Плечо камеры',KeyG:'Удар',KeyN:'Уклонение',KeyZ:'Укрытие'
};
const validCode = code => /^(Key[A-Z]|Digit[0-9]|ShiftLeft|Space|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal)$/.test(code);
exports.cleanBindings = function(raw) {
    const keys=Object.keys(bindings), used=new Set();
    const next={};
    for(const k of keys) {
        const v=raw?.[k] ?? k;
        if(!validCode(v) || used.has(v)) return {};
        next[k]=v; used.add(v);
    }
    return next;
};
exports.bindKey = function(old, canonical, physical) {
    if(!Object.hasOwn(bindings,canonical) || !validCode(physical)) return null;
    const map={...exports.cleanBindings(old)};
    const other=Object.keys(bindings).find(k=>(map[k]??k)===physical);
    if(other) map[other]=map[canonical]??canonical;
    map[canonical]=physical;
    return map;
};
exports.resolveKey = function(map, physical) {
    return Object.keys(bindings).find(k=>(map?.[k]??k)===physical) ?? (Object.hasOwn(bindings,physical) ? '' : physical);
};
exports.keyName = code => code.replace(/^Key|^Digit/,'').replace('ShiftLeft','Shift').replace('Space','Space');
