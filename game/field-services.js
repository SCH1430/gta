"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldServices = void 0;
const storage_js_1 = require("./storage.js");
const offline_js_1 = require("./offline.js");
const local_assets_js_1 = require("./local-assets.js");
const escape = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function button(id, title, value = '') {
    return `<button type="button" class="k-panel-row" data-action="desk-${id}" data-value="${escape(value)}"><span>${escape(title)}</span></button>`;
}
class FieldServices {
    snapshot;
    refresh;
    begin;
    reportAudit;
    audit;
    busy = false;
    message = '';
    pending;
    importRequest = 0;
    leaving = false;
    report;
    get changing() { return this.leaving; }
    constructor(snapshot, refresh, begin, reportAudit) {
        this.snapshot = snapshot;
        this.refresh = refresh;
        this.begin = begin;
        this.reportAudit = reportAudit;
        void (0, storage_js_1.readLocalReport)().then(value => { this.report = value; }).catch(() => { });
    }
    draw() {
        const slot = (0, storage_js_1.activeProfile)(), audit = this.audit, r = this.report, direct = (0, local_assets_js_1.isStandalone)();
        const loaded = storage_js_1.canSaveGame();
        const recovery = loaded ? '' : '<p>Автосохранение приостановлено. Выберите профиль, чтобы восстановить игру.</p>';
        const profiles = recovery + [1, 2, 3].map(i => loaded && i === slot ? `<strong>Профиль ${i} · открыт</strong>` : button('profile', 'Открыть профиль ' + i, String(i))).join('');
        const damaged = direct ? '' : audit?.bad.map(p => button('repair', 'Докачать ' + p, p)).join('') ?? '';
        const importNotice = loaded ? 'Текущая запись останется резервной.' : 'Сохранение заменит нечитаемую запись профиля.';
        const confirmation = this.pending ? `<p>Импорт в профиль ${slot} · ${this.pending.game.money} ₽ · завершено основных заказов ${this.pending.game.mission}/3. ${importNotice}</p>${button('confirm', 'Применить сохранение')}${button('cancel', 'Отмена')}` : '';
        const comparison = r?.long ? `<p>Первая минута ${r.first.fps} FPS · пятнадцатая ${r.last.fps} FPS</p>` : '';
        const portability = direct ? '<p>Перед переносом HTML в другую папку или на другое устройство экспортируйте профиль в JSON. Его можно открыть и в веб-версии игры.</p>' : '';
        const packTitle = direct ? 'Ресурсы внутри HTML' : 'Офлайн-пакет';
        const packButton = this.busy ? 'Проверка…' : direct ? 'Проверить встроенные ресурсы' : 'Проверить целостность файлов';
        return `<section class="field-desk"><h3>Профили</h3><div class="k-list">${profiles}</div><h3>Перенос игры</h3>${portability}${button('export', 'Экспортировать JSON')}${button('import', 'Выбрать сохранение')}${confirmation}<h3>${packTitle}</h3>${audit ? `<p>Готово файлов ${audit.good} из ${audit.files} · ${(audit.total / 1048576).toFixed(2)} МиБ</p>` : ''}${button('audit', packButton)}${damaged}<p role="status">${escape(this.message)}</p><h3>Один круг по Канальному</h3><p>Одинаковый маршрут через гараж, рынок, мост и квартиру. Тест занимает 40 секунд. Для проверки нагрева выберите 15 минут.</p>${button('short', 'Начать круг · 40 с')}${button('long', 'Сравнить первую и пятнадцатую минуты')}${button('chase', 'Ночная погоня · 32 с')}${r ? `<p>${escape(r.renderer)} · ${r.fps} FPS · кадров дольше 33 мс — ${r.slow}%${r.drawMs ? ` · отрисовка ${r.drawMs} мс` : ''}</p><p>Самый тяжёлый участок — ${escape(r.worst)}. Измерено ${r.frames} кадров.</p>${r.roadVisible !== undefined ? `<p>В кадре и без преград ${r.roadVisible}% контрольных точек дороги перед автомобилем.</p>` : ''}${comparison}` : ''}</section>`;
    }
    async remember(result) { this.report = result; this.refresh(); await (0, storage_js_1.writeLocalReport)(result); }
    handles(id) { return id.startsWith('desk-'); }
    async act(id, value) {
        if (this.leaving)
            return;
        try {
            switch (id) {
                case 'desk-export':
                    (0, storage_js_1.downloadSession)(this.snapshot());
                    return;
                case 'desk-profile':
                    this.leaving = true;
                    if (storage_js_1.canSaveGame())
                        await (0, storage_js_1.saveGame)(this.snapshot());
                    await (0, storage_js_1.switchProfile)(Number(value));
                    location.reload();
                    return;
                case 'desk-import': {
                    const request = ++this.importRequest;
                    this.pending = undefined;
                    this.message = '';
                    if (storage_js_1.activeProfile() === null) {
                        this.message = 'Сначала выберите профиль для импорта.';
                        break;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json,application/json';
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        let session, message = '';
                        try {
                            session = await (0, storage_js_1.readExport)(file);
                        }
                        catch (e) {
                            message = e instanceof Error ? e.message : String(e);
                        }
                        if (request !== this.importRequest || this.leaving) return;
                        this.pending = session;
                        this.message = message;
                        this.refresh();
                    };
                    input.click();
                    return;
                }
                case 'desk-confirm':
                    if (this.pending) {
                        this.leaving = true;
                        if (storage_js_1.canSaveGame())
                            await (0, storage_js_1.saveGame)(this.snapshot());
                        await (0, storage_js_1.saveGame)(this.pending, { confirmedImport: true });
                        location.reload();
                    }
                    return;
                case 'desk-cancel':
                    ++this.importRequest;
                    this.pending = undefined;
                    break;
                case 'desk-short':
                case 'desk-long':
                case 'desk-chase':
                    this.begin(id === 'desk-long', id === 'desk-chase' ? 'chase' : 'district');
                    return;
                case 'desk-audit':
                case 'desk-repair':
                    if (this.busy)
                        return;
                    this.busy = true;
                    this.message = 'Проверяем SHA-256 файлов…';
                    this.refresh();
                    this.audit = await (0, offline_js_1.auditOffline)(id === 'desk-repair' ? [String(value)] : []);
                    this.reportAudit(this.audit);
                    this.message = this.audit.bad.length ? ((0, local_assets_js_1.isStandalone)() ? 'Часть встроенных ресурсов повреждена. Распакуйте HTML заново.' : 'Пакету требуются перечисленные файлы.') : 'Все файлы проверены. Можно играть офлайн.';
                    break;
            }
        }
        catch (e) {
            this.leaving = false;
            this.message = e instanceof Error ? e.message : String(e);
        }
        finally {
            this.busy = false;
            this.refresh();
        }
    }
}
exports.FieldServices = FieldServices;
