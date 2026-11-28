"use strict";

const { marketOpen } = require('./market-hours.js');
const { schoolOutside } = require('./school-site.js');

const orders = [
    { caller: 'Семён', place: 'Рынок «Спектр» → трамвайное депо', due: 'До прохода последнего вагона', form: 'Накладная', item: 'Реле управления стрелкой · 1 шт.', text: 'У Инны запасное реле. Забери его с прилавка и принеси дежурному путейцу в депо.' },
    { caller: 'Мастер гаража', place: 'Стоянка фургона → Канальные гаражи', due: 'До возврата машины в парк', form: 'Путевой лист', item: 'Служебный фургон · возвращение с линии', text: 'Фургон встал после смены. Осмотри его на стоянке. Запасной аккумулятор лежит у нас в гараже.' },
    { caller: 'Лёша', place: 'Радиорынок → диспетчерская → Восточная', due: 'К сдаче сменного журнала', form: 'Квитанция', item: 'Запись переговоров дежурных · 1 кассета', text: 'На рынке оставили запись переговоров. В диспетчерской есть магнитофон. Послушай, куда отвели вагон.' }
];
const clockText = value => [Math.floor(value / 60) % 24, value % 60].map(n => String(n).padStart(2, '0')).join(':');

class ShiftJournal {
    constructor(saved) {
        this.opening = Number.isInteger(saved?.opening) ? Math.min(3, Math.max(0, saved.opening)) : 0;
        this.restoreWalk = this.opening === 1 || this.opening === 2;
        this.messages = Array.isArray(saved?.messages) ? saved.messages.filter(m => m && typeof m.from === 'string' &&
            typeof m.text === 'string' && Number.isSafeInteger(m.time) && m.time >= 0)
            .slice(-40).map(m => ({ from: m.from.slice(0, 64), text: m.text.slice(0, 340), time: m.time, call: m.call === true })) : [];
        this.lastOrder = Number.isInteger(saved?.lastOrder) ? saved.lastOrder : -1;
    }
    add(from, text, time, call = false) {
        const last = this.messages.at(-1);
        if (!text || (last?.text === text && last.from === from && time - last.time < 3)) return false;
        this.messages.push({ from, text, time, call });
        if (this.messages.length > 40) this.messages.shift();
        return true;
    }
    order(index, time) {
        if (index <= this.lastOrder || !orders[index]) return false;
        this.lastOrder = index;
        return this.add(orders[index].caller, orders[index].text, time, true);
    }
    walk(sim, time) {
        if (sim.stage || sim.mission || this.opening === 3 || sim.home.inside || sim.transition || sim.home.door) return;
        const { x, z } = sim.player;
        if (this.restoreWalk) {
            this.restoreWalk = false;
            return { route: true };
        }
        if (this.opening === 0 && Math.hypot(x - schoolOutside.x, z - schoolOutside.z) < 16) {
            this.opening = 1;
            const text = 'Выходи на Канальную и иди к трамвайной остановке у «Спектра». Моё окно под полосатым навесом.';
            this.add('Инна', text, time);
            return { text, route: true };
        }
        if (this.opening === 1 && Math.hypot(x - 16, z - 24) < 32) {
            this.opening = 2;
            return { text: 'За поворотом — остановка 07. Слышен звон вагона со стороны депо.', bell: true };
        }
        if (this.opening && Math.hypot(x - 30, z - 26) < 8) {
            this.opening = 3;
            const text = marketOpen(time) ? 'Инна · Реле на прилавке. Сейчас упакую, и можно закрываться.' :
                'Инна · Ряды уже закрыты. Я дождалась тебя у таблички «Выдача», держи реле.';
            return { text, arrived: true };
        }
    }
    save() { return { opening: this.opening, lastOrder: this.lastOrder, messages: this.messages.map(m => ({ ...m })) }; }
}

function correspondence(messages, escape) {
    return messages.slice().reverse().map(m => `<article class="k-handset-entry"><header><strong>${escape(m.from)}</strong><time>${clockText(m.time)}</time></header><small>${m.call ? 'Входящий звонок' : 'Сообщение'}</small><p>${escape(m.text)}</p></article>`).join('');
}

function documentSheet(index, title, reward, complete, escape) {
    const order = orders[index];
    const fields = [['Заказчик', order.caller], ['Адрес', order.place], ['Срок', order.due], ['Предмет', order.item],
        ['Оплата', Number(reward).toLocaleString('ru-RU') + ' ₽'], ['Отметка', complete ? 'Исполнено' : 'Выдано на смену']];
    return `<details class="k-order-paper"><summary>${order.form} № ${index + 1}</summary><article><small>КАНАЛЬСК · 2022</small><h3>${escape(title)}</h3><dl>${fields.map(([field, value]) => '<dt>' + field + '</dt><dd>' + escape(value) + '</dd>').join('')}</dl></article></details>`;
}
module.exports = { ShiftJournal, orders, correspondence, documentSheet };
