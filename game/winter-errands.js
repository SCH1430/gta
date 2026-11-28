'use strict';

const { surfaceAt } = require('./world-layout.js');
const step = (x, z, label, reply, quiz) => ({ x, z, label, reply, quiz });
const question = (prompt, right, wrong) => ({ prompt, right, wrong });

const errands = [
    { id: 'plough', title: 'Проезд для трактора', pay: 450, steps: [
        step(-38.8, 17.18, 'Расспросить дворника у дома № 23', 'Серый универсал загородил въезд. Сосед у скамьи знает, чей он.'),
        step(-35.4, .4, 'Поговорить с соседом у дома № 31', '«Вадим сегодня дома. Вторая дверь, четвёртый этаж, квартира 18. Скажите, что трактор уже здесь».'),
        step(-34.96, 16.6, 'Вызвать хозяина по домофону', 'Вадим забрал ключи и переставил универсал. Дворнику освободили проезд.',
            question('На домофоне дома № 23 наберите квартиру Вадима.', 'Квартира 18', 'Квартира 8')) ] },
    { id: 'track', title: 'Обход с путейцем', pay: 680, steps: [
        step(7.8, -38.4, 'Получить обходной лист у путейца', 'Идём от депо к рынку. Сверь состояние рельса, настила и стыка. Мастер будет ждать у каждой отметки.'),
        step(6.8, -32, 'Осмотреть головку рельса', 'На рельсе корка льда. Мастер ставит в журнале отметку о зачистке.'),
        step(6.2, -9, 'Проверить край деревянного настила', 'Один конец доски качается. Путеец помечает доску мелом для плотников.'),
        step(10.5, 23.1, 'Сверить свежий стык с журналом', 'Сверка окончена. Старый стык заменён в первую смену, дорожная бригада получила две заявки.') ] },
    { id: 'post', title: 'Стёртый адрес', pay: 510, steps: [
        step(141.3, -18.2, 'Взять посылку в ночном окне', 'На этикетке остались «Кан…» и номер 4. В квитанции под скрепкой есть ещё одна подсказка.'),
        step(141.3, -18.2, 'Посмотреть квитанцию', 'Квитанция № 214. Получатель — мастер, отправитель — завод измерительных приборов.'),
        step(141.3, -18.2, 'Найти накладную в книге поступлений', 'В строке 214 указан киоск № 4 на радиорынке. Инна распишется за приём.',
            question('Строка 214 — Канальный рынок, № 4. Строка 241 — Канальная улица, дом 4. Куда отправить посылку?', 'Киоск № 4, радиорынок', 'Дом 4, Канальная улица')),
        step(30, 25.3, 'Получить подпись Инны', 'Инна приняла измеритель и подписала квитанцию. Почтовое отправление доставлено.') ] },
    { id: 'water', title: 'Проба до закрытия', pay: 740, steps: [
        step(134.2, 120.7, 'Взять пробу у речного лаборанта', 'Пломба № 16, вода взята у причала. Передвижная лаборатория у метеостанции принимает до 19:00.'),
        step(117.8, -401.55, 'Передать опломбированную пробу', 'Пломба цела, температура вписана в журнал. Лаборатория приняла пробу текущей смены.') ] },
    { id: 'glass', title: 'Стекло для сменного фургона', pay: 810, steps: [
        step(-40, 42, 'Принять ящик в Канальных гаражах', 'Склад подготовил лобовое стекло в деревянной раме. Подгоните автомобиль к месту выдачи.'),
        step(-40, 42, 'Закрепить ящик в машине', 'Ящик закреплён в вашей машине. Сохраняйте скорость на ровном асфальте, сбрасывайте перед колеёй. Разгрузка у депо.'),
        step(12, -39, 'Разгрузить стекло у депо', 'Механик снял защитную раму. Стекло поступило на замену в сменный фургон.') ] },
    { id: 'gate', title: 'Последний день проходной', pay: 620, steps: [
        step(-55, -117, 'Расспросить смену у ТЭЦ', 'Старая проходная закрывается. Узнай, где договорились встречаться рабочие, и принеси адрес к концу смены.'),
        step(-24.5, -23.8, 'Записать воспоминания у хлебного окна', 'Раньше машинисты встречали первую смену здесь. Пекарь говорит, что вечером они идут в столовую у порта.'),
        step(-146, 103.5, 'Расспросить портового сменщика', '«Теперь встречаемся у хлебного окна по пятницам. Это место найдёт и мастер, и ученик».'),
        step(-55, -117, 'Передать договорённость рабочим', 'На проходной вывесили записку о встречах у хлебного окна. Рабочие разных смен знают новый адрес.') ] },
    { id: 'mitten', title: 'Варежка с биркой', pay: 320, steps: [
        step(-73.3, -607, 'Поднять варежку у борта', 'В синюю варежку вшита бирка «Секция 07». На доске у входа есть расписание.'),
        step(-66.3, -607, 'Свериться с расписанием секций', 'Группа 07 собирается у сквера Полярников после занятия. Тренер ждёт у дорожки.',
            question('07 — фигурное катание, сбор в сквере. 17 — хоккей, сбор у раздевалки. Где искать владельца?', 'У дорожки в сквере', 'У хоккейной раздевалки')),
        step(-70, -634, 'Вернуть варежку тренеру', 'На второй варежке такая же бирка. Тренер передал пару хозяйке и снял объявление о пропаже.') ] }
];
const within = (p, q, radius) => Math.hypot(p.x - q.x, p.z - q.z) <= radius;
const guides = errands.map(job => [job.title, job.steps[0].x, job.steps[0].z, job.steps[0].label]);

function createErrands() {
    let stages = {}, waterDay = -1, glassCar = null, trackAt = null, nextRattle = 0, lastSpeed = 0;
    const index = job => stages[job.id] ?? 0;
    function restore(raw) {
        stages = {};
        for (const job of errands) {
            const value = raw?.stages?.[job.id];
            if (Number.isInteger(value) && value >= 0 && value <= job.steps.length) stages[job.id] = value;
        }
        waterDay = Number.isInteger(raw?.waterDay) ? raw.waterDay : -1;
        glassCar = typeof raw?.glassCar === 'string' ? raw.glassCar : null;
        trackAt = Number.isFinite(raw?.trackAt) && raw.trackAt >= 0 ? raw.trackAt : null;
        nextRattle = lastSpeed = 0;
    }
    function nearby(c, job) {
        const i = index(job), s = job.steps[i];
        if (!s || c.zone !== 'street' || c.sim.tramRider?.onboard) return false;
        if (job.id === 'glass' && i >= 1)
            return !!c.car && (i === 1 || glassCar === c.car.id) && Math.abs(c.car.speed) < 1 && within(c.player, s, 7.2);
        return !c.car && within(c.player, s, 2.8);
    }
    function actions(c) {
        return errands.filter(j => nearby(c,j)).map(job => ({ id: job.id, label: job.steps[index(job)].label }));
    }
    function act(id, c) {
        const job = errands.find(j => j.id === id);
        if (!job || !nearby(c, job)) return;
        const i = index(job), s = job.steps[i], day = Math.floor(c.calendarMinutes / 1440);
        const wait = (time, label, message) => c.choose(job.title, [
            { label, run() { c.waitUntil(time); } }, { label: 'Вернуться позже', run() {} }
        ], message);
        if (id === 'post' && i === 0 && c.minutes >= 360 && c.minutes < 1260)
            return wait(1260, 'Дождаться 21:00', 'Ночное окно работает с 21:00 до 06:00.');
        if (id === 'water' && i === 0 && (c.minutes < 480 || c.minutes >= 1110))
            return wait(480, 'Дождаться 08:00', 'Пробы выдают с 08:00 до 18:30. Приёмная закрывается в 19:00.');
        if (id === 'water' && i === 1 && (day !== waterDay || c.minutes >= 1140)) {
            stages.water = 0;
            c.notify('Приёмная уже закрылась. Эту пробу списали. Следующую можно взять утром на причале.');
            c.persist();
            return;
        }
        const finish = () => {
            if (index(job) !== i) return;
            stages[id] = i + 1;
            if (id === 'track') trackAt = c.sim.elapsed;
            if (id === 'water' && i === 0) waterDay = day;
            if (id === 'glass' && i === 1) glassCar = c.car.id;
            const next = job.steps[i + 1];
            if (next) c.addMapPin(next.x, next.z, next.label);
            else c.sim.money += job.pay;
            const text = s.reply + (next ? '' : ' Оплата ' + job.pay + ' ₽.');
            c.record(job.title + ' · ' + text);
            c.notify(text);
            c.persist();
        };
        if (!s.quiz) return finish();
        const options = [ { label: s.quiz.right, run: finish }, { label: s.quiz.wrong, run() { c.notify('Подсказка не совпала. Запись осталась в блокноте.'); } } ];
        c.choose(job.title, id === 'post' ? options.reverse() : options, s.quiz.prompt);
    }
    function update(c) {
        if (stages.glass !== 2 || !glassCar) return;
        if (!c.sim.cars.some(v => v.id === glassCar)) {
            stages.glass = 1;
            glassCar = null;
            c.notify('Машину вывезли со стоянки. В гаражах подготовили запасную раму.');
            c.persist();
            return;
        }
        if (c.car?.id !== glassCar) return;
        const speed = Math.abs(c.car.speed);
        const surface = surfaceAt(c.car.x, c.car.z);
        if (c.sim.elapsed >= nextRattle && speed > 5 && (surface !== 'asphalt' || Math.abs(speed - lastSpeed) > 1.6)) {
            c.audio?.effect?.('cargo-glass');
            c.notify('Стекло звякнуло в раме. Притормозите у колеи.');
            nextRattle = c.sim.elapsed + 8;
        }
        lastSpeed = speed;
    }
    function agenda() {
        return errands.filter(j => index(j) > 0 && index(j) < j.steps.length).map(j => ({ title: j.title, goal: j.steps[index(j)].label }));
    }
    return { restore, save: () => ({ stages: { ...stages }, glassCar, waterDay, trackAt }), act, actions, agenda, update,
        get glassVehicle() { return glassCar; },
        get trackAt() { return trackAt; },
        stage: id => stages[id] ?? 0, complete: id => errands.some(j => j.id === id && index(j) === j.steps.length) };
}

module.exports = { errands, guides, createErrands };
