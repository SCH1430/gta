"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const offline_js_1 = require("./offline.js");
const boot = document.querySelector('#boot');
let last = { phase: 'checking', loaded: 0, total: 0 };
let listener;
const size = (n) => (n / 1048576).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
void (0, offline_js_1.prepareOffline)(progress => {
    last = progress;
    if (listener) {
        listener(last);
        return;
    }
    if (last.total) {
        const percent = Math.floor(last.loaded / last.total * 100);
        boot.textContent = last.phase === 'ready' ? 'Открываем Канальные гаражи…' :
            'Загружаем район · ' + size(last.total) + ' МБ · ' + percent + '%';
    }
});
void Promise.resolve().then(() => require("./game.js")).then(({ start }) => start(boot, callback => { listener = callback; callback(last); })).catch(error => {
    console.error(error);
    boot.hidden = false;
    boot.textContent = 'Не удалось открыть 3D-район. Обновите страницу или откройте игру в актуальном браузере.';
});
