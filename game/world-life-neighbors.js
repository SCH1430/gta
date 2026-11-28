"use strict";

const T = require('../engine/three.module.min.js');
const { Batch, lit } = require('./model-geometry.js');
const { groundHeight } = require('./world-layout.js');
const { houseUpper, houseOutside } = require('./house-layout.js');
const { signTexture, texture } = require('./world-textures.js');
const { createPerson } = require('./model-people.js');
const { neighborhoodKiosk, plantShelf } = require('./world-life-neighbor-layout.js');

const dispatch = { x: -99.5, z: 38.1 };
const stops = [
    { x: 10.5, z: -38.25, name: 'Дежурный депо', role: 'dispatcher', style: 0, line: 'Семён наливает чай в крышку термоса и возвращается к пульту. На Портовой сегодня проверяют насосы до утра.' },
    { x: 42, z: 21.45, name: 'Пост у «Спектра»', role: 'resident', style: 12, line: 'Дежурная устраивает кружку на подоконнике. В это время у задних ворот обычно разгружают последние коробки.' },
    { x: 137, z: 122.2, name: 'Портовая смена', role: 'mechanic', style: 0, line: 'Мастер зовёт напарника с эстакады. Термос оставляют на ночь рядом с журналом насосной.' }
];
const plants = [
    { name: 'Традесканция', owner: 'Вера из восьмой', pot: '#aa775d', leaf: '#8e6f8d' },
    { name: 'Мята', owner: 'Алексей из десятой', pot: '#839994', leaf: '#70a36e' },
    { name: 'Очиток', owner: 'Тамара из девятой', pot: '#bb9c65', leaf: '#96a882' }
];
const kiosks = {
    tea: { name: 'Чайное окно', sign: 'ЧАЙ У ТРЕТЬЕГО', small: 'ГОРЯЧИЙ ЧАЙ · ПИРОЖКИ', color: '#945444', light: '#ffd38b', patrons: [2, 14], detail: 'У окна встречаются жильцы после смены. Чай наливают в кружки с номерами квартир.' },
    shoes: { name: 'Ремонт обуви', sign: 'ПОДОШВА', small: 'НАБОЙКИ · ШНУРКИ', color: '#627360', light: '#d4e1ac', patrons: [8, 16], detail: 'У стекла стоят ботинки с бирками. Мастер меняет набойки, пока соседи ждут на лавке.' },
    skates: { name: 'Прокат коньков', sign: 'КОНЬКИ НА ЧАС', small: 'ПРОКАТ · ЗАТОЧКА', color: '#4d6d88', light: '#bbdce9', patrons: [3, 10], detail: 'На полке висят коньки с номерками. Посетители сверяют размеры перед прогулкой к арене.' }
};
const boardStories = [
    ['Кто взял лестницу? Верните к пятнице.', 'Ищу вторую синюю лыжу. Вера, кв. 8.', 'Во дворе опять погас свет.'],
    ['Лестница у второго подъезда. Спасибо!', 'Лыжу видели под лавкой у № 31.', 'Мастер посмотрит свет после смены.'],
    ['Лестница на месте, можно брать до вечера.', 'Лыжу вернули. Вера благодарит двор.', 'Балконный свет починили.'],
    ['Лестницу занесли в подвал на просушку.', 'У Веры есть пара лыж для обмена.', 'У фонаря новая лампа. Горит с 18:00.']
];
const boardSite = { x: -38.8, z: 17.18 };
const birdsSite = { x: 20.1, z: 89.9 };
const kioskSite = { x: neighborhoodKiosk.x, z: 3.10 };
const plantSite = { x: -2.10, z: -3.30, y: houseUpper };
const nightShift = c => c.minutes >= 19 * 60 || c.minutes < 5 * 60;
const dayOf = c => Math.floor(c.calendarMinutes / 1440);
const shiftOf = c => Math.floor((c.calendarMinutes - 5 * 60) / 1440);
const isNear = (c, spot, range) => Math.hypot(c.x - spot.x, c.z - spot.z) < range;

function outdoorGroup(scene, name, x, z) {
    const group = new T.Group();
    group.name = name;
    group.position.set(x, groundHeight(x, z), z);
    scene.add(group);
    return group;
}

function placard(parent, map, x, y, z, w, h, rotation = 0) {
    const material = new T.MeshBasicMaterial({ map, side: T.DoubleSide, toneMapped: false });
    const sign = new T.Mesh(new T.PlaneGeometry(w, h), material);
    sign.position.set(x, y, z);
    sign.rotation.y = rotation;
    parent.add(sign);
    return sign;
}

function thermos(batch, x, y, z, hue) {
    batch.add(new T.CylinderGeometry(.080, .086, .275, 10), [x, y + .138, z], [1, 1, 1], hue);
    batch.add(new T.CylinderGeometry(.081, .079, .051, 10), [x, y + .292, z], [1, 1, 1], '#aeb4a8');
    batch.box(x + .079, y + .14, z, .051, .14, .035, '#29363b');
}

function deliveryPoint(scene, point, i) {
    const group = outdoorGroup(scene, i < 0 ? 'Выдача ночных термосов' : point.name, point.x + .76, point.z - .58);
    const body = new Batch(), flasks = new Batch();
    body.box(0, .48, 0, 1.13, .96, .47, '#4e6463');
    body.box(0, .98, 0, 1.28, .085, .59, '#9a9d83');
    body.box(0, .45, .243, .81, .55, .018, '#627571');
    placard(group, signTexture(i < 0 ? 'ТЕРМОСЫ' : 'ДЕЖУРНЫЙ ПОСТ', i < 0 ? 'НОЧНОЙ ОБХОД' : 'НОЧНАЯ СМЕНА', '#e6ce9a', '#465c5b', 3.3), 0, .69, .256, .74, .224);
    for (let j = 0; j < (i < 0 ? 3 : 1); j++)
        thermos(flasks, (j - (i < 0 ? 1 : 0)) * .240, 1.028, -.026, ['#9c5e4d', '#517776', '#718451'][j]);
    const delivered = flasks.mesh();
    group.add(body.mesh(), delivered);
    let actor;
    return (c, active, served) => {
        delivered.visible = i < 0 ? active : served;
        if (i < 0)
            return;
        const nearby = c.zone === 'street' && (active || served) && isNear(c, point, 32);
        if (nearby && !actor) {
            actor = createPerson(point.role, point.style);
            actor.root.position.set(.55, 0, -.71);
            actor.root.rotation.y = Math.PI;
            group.add(actor.root);
        }
        if (actor) {
            actor.root.visible = nearby;
            if (nearby)
                actor.update(c.dt, 0, false, { conversation: isNear(c, point, 2.8), carry: served ? 'cup' : undefined });
        }
    };
}

function potted(batch, plant, x, y, z, size) {
    const pot = .18 * size, top = y + pot;
    batch.add(new T.CylinderGeometry(.115, .083, .18, 8), [x, y + pot * .5, z], [size, size, size], plant.pot);
    batch.ball(x, top, z, .216 * size, .018 * size, .216 * size, '#413d33');
    for (let j = 0; j < 7; j++) {
        const angle = j * 2.4, d = (.07 + j % 3 * .014) * size, h = (.14 + j % 4 * .045) * size;
        const end = [x + Math.sin(angle) * d, top + h, z + Math.cos(angle) * d];
        batch.rod([x, top, z], end, .009 * size, '#6c8958');
        batch.ball(...end, .14 * size, .066 * size, .077 * size, plant.leaf, [0, angle, .36]);
    }
}

function planting(scene) {
    const sill = outdoorGroup(scene, 'Подоконник с черенками', houseOutside.x + .16, 15.60);
    const window = new Batch();
    window.box(0, 3.90, 0, 1.33, .73, .045, '#776a50');
    window.box(0, 3.51, .065, 1.47, .055, .18, '#a9a999');
    const furniture = window.mesh();
    sill.add(furniture);
    const displayed = plants.map((plant, i) => {
        const batch = new Batch();
        potted(batch, plant, (i - 1) * .35, 3.552, .085, .84);
        const model = batch.mesh();
        sill.add(model);
        return model;
    });
    let shelf;
    return (c, deliveredPlants) => {
        if (c.indoorScene && !shelf) {
            const structure = new Batch();
            shelf = new T.Group();
            shelf.name = 'Полка обмена на втором этаже';
            shelf.position.set(plantShelf.x, houseUpper, plantShelf.z);
            structure.box(0, .88, 0, .29, .064, 1.22, '#8f6c52');
            structure.box(0, .28, 0, .28, .045, 1.22, '#775744');
            for (const z of [-.56, .56])
                structure.box(0, .45, z, .24, .90, .063, '#726758');
            plants.forEach((plant, i) => {
                const z = (i - 1) * .37;
                potted(structure, plant, 0, .913, z, .63);
                structure.box(.14, .953, z, .025, .044, .15, '#e2d7b5');
            });
            shelf.add(structure.mesh());
            placard(shelf, signTexture('ЧЕРЕНКИ', 'ОБМЕН СОСЕДЕЙ', '#edddb5', '#576d60', 3.8), -.022, 1.18, 0, .88, .234, Math.PI / 2);
            c.indoorScene.add(shelf);
        }
        let occupied = false;
        displayed.forEach((mesh, i) => {
            mesh.visible = deliveredPlants[i] != null && dayOf(c) >= deliveredPlants[i] + 2;
            occupied ||= mesh.visible;
        });
        furniture.visible = occupied;
    };
}

function noticeboard(scene) {
    const root = outdoorGroup(scene, 'Табло Канальной, 23', boardSite.x, 15.74), b = new Batch();
    b.box(0, 1.49, 0, 1.80, 1.06, .13, '#546360');
    b.box(0, 2.04, .025, 1.93, .055, .25, '#475452');
    root.add(b.mesh());
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const g = canvas.getContext('2d'), map = texture(canvas);
    placard(root, map, 0, 1.49, .074, 1.68, 1.01);
    let previous = -1;
    return day => {
        const phase = day % boardStories.length;
        if (phase === previous)
            return;
        previous = phase;
        g.fillStyle = '#4d615d';
        g.fillRect(0, 0, 512, 320);
        g.fillStyle = '#e4d9b8';
        g.font = 'bold 22px sans-serif';
        g.fillText('КАНАЛЬНАЯ, 23  /  ОБЪЯВЛЕНИЯ', 20, 36);
        boardStories[phase].forEach((line, i) => {
            g.save();
            g.translate(25 + (i % 2) * 10, 58 + i * 81);
            g.rotate(i % 2 ? -.016 : .012);
            g.fillStyle = ['#dcc99a', '#bbcdba', '#e2d8b8'][i];
            g.fillRect(0, 0, 441, 61);
            g.fillStyle = '#293b3b';
            g.font = '20px sans-serif';
            g.fillText(line, 12, 37, 415);
            g.fillStyle = '#a36149';
            g.fillRect(214, 2, 13, 7);
            g.restore();
        });
        map.needsUpdate = true;
    };
}

const birdOutlines = [
    [[-1.02,.54],[-.55,.85],[-.25,.57],[.21,.40],[.52,.49],[.73,.78],[.94,.75],[1.13,.59],[.87,.52],[.67,.24],[.08,.19],[-.41,.35],[-1.02,.54]],
    [[-1.00,.42],[-.55,.52],[-.10,.86],[.22,.50],[.60,.54],[.83,.81],[1.02,.72],[.94,.36],[.24,.22],[-.41,.25],[-1.00,.42]],
    [[-.99,.69],[-.42,.57],[-.20,.92],[.24,.51],[.53,.51],[.73,.73],[.99,.60],[.82,.42],[.58,.24],[.04,.22],[-.99,.69]]
];

function birdWorkshop(scene) {
    const group = outdoorGroup(scene, 'Рабочий стол дворовой мастерской', birdsSite.x, birdsSite.z - .65), work = new Batch();
    work.box(0, .88, 0, 1.92, .12, .64, '#726449');
    for (const x of [-.78, .78]) {
        work.box(x, .43, 0, .13, .86, .56, '#516562');
        work.box(x, .97, .10, .31, .058, .25, '#4c5450');
    }
    const spare = new Batch();
    for (const [x, color] of [[-.60, '#a95d50'], [-.34, '#c1ac69'], [-.08, '#6aab90']]) {
        work.box(x, 1.02, 0, .22, .16, .20, '#373d40');
        work.ball(x, 1.107, 0, .154, .045, .154, color);
    }
    spare.rod([.12, .97, -.15], [.73, .97, .17], .030, '#d4d693', true);
    const lastLamp = spare.mesh();
    group.add(work.mesh(), lastLamp);
    placard(group, signTexture('СВЕТОВЫЕ ПТИЦЫ', 'ДВОРОВАЯ МАСТЕРСКАЯ', '#e7d6aa', '#465c58', 3.6), 0, .61, .333, 1.52, .42);

    const colors = ['#f5c574', '#a3e1bd', '#e79478', '#c8dbea'];
    const birds = colors.map((color, i) => {
        const x = 16.55 + i * 2.53, stand = outdoorGroup(scene, 'Световая птица ' + (i + 1), x, 86.50);
        const frames = new Batch(), points = new Batch(), outline = birdOutlines[i % birdOutlines.length];
        frames.box(0, .088, 0, .82, .17, .39, '#59666b');
        frames.rod([0, .12, 0], [0, 1.34, 0], .041, '#6c7373', true);
        for (let k = 1; k < outline.length; k++) {
            const [a, b] = outline[k - 1], [d, e] = outline[k];
            frames.rod([a, b + .91, .01], [d, e + .91, .01], .024, '#77827c');
            points.rod([a, b + .91, .041], [d, e + .91, .041], .013, color);
            points.rod([a, b + .91, -.041], [d, e + .91, -.041], .013, color);
        }
        const glow = points.mesh(lit);
        stand.add(frames.mesh(), glow);
        const reflection = new Batch();
        for (let j = 0; j < 23; j++) {
            const depth = .18 + j * .121, px = x + Math.sin(j * 2.3 + i) * (.11 + depth * .10), pz = 85.10 - depth;
            reflection.box(px, groundHeight(px, pz) + .052, pz, (.56 - depth * .104) * (.52 + .48 * Math.cos(j * 2.4) ** 2), .006, .027, color);
        }
        const shimmer = reflection.mesh(new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .21, depthWrite: false, toneMapped: false }));
        scene.add(shimmer);
        return { stand, glow, shimmer };
    });
    return (c, assembled) => {
        const night = c.minutes >= 18 * 60 || c.minutes < 6 * 60;
        const phase = c.elapsed % 9;
        lastLamp.visible = !assembled;
        birds.forEach(({ stand, glow, shimmer }, i) => {
            stand.visible = i !== birds.length - 1 || assembled;
            glow.visible = stand.visible && night && phase >= i * 1.02;
            shimmer.visible = glow.visible;
            if (glow.visible)
                shimmer.material.opacity = .16 + .06 * Math.sin(c.elapsed * 2.1 + i);
        });
    };
}

function kioskView(scene) {
    const { x, z, w, d, h } = neighborhoodKiosk;
    const root = outdoorGroup(scene, 'Дворовый киоск', x, z), body = new Batch(), props = {};
    body.box(0, 1.21, -.27, w, 2.35, d - .52, '#526968');
    body.box(0, .54, .49, w, 1.04, .64, '#526968');
    body.box(0, 2.41, 0, w + .27, .16, d + .25, '#374b51');
    for (const a of [-1.41, 1.41])
        body.box(a, 1.73, .51, .21, 1.32, .63, '#667a73');
    body.box(0, 1.08, .84, 2.60, .085, .30, '#aaa590');
    body.box(0, 2.12, .826, 2.67, .21, .14, '#354951');
    body.box(0, .075, 1.1, 2.9, .15, .60, '#7e9290');
    root.add(body.mesh());
    const closedMap = signTexture('КИОСК № 31', 'РЕШЕНИЕ ДВОРА', '#eddbb4', '#536964', 5.5);
    const title = placard(root, closedMap, 0, h - .31, .907, 2.55, .46);
    const blind = new Batch();
    blind.box(0, 1.595, .789, 2.63, .966, .056, '#7f918f');
    for (let y = 1.16; y < 2; y += .082)
        blind.box(0, y, .823, 2.63, .020, .016, '#4d686c');
    const shutter = blind.mesh();
    root.add(shutter);
    for (const [key, kind] of Object.entries(kiosks)) {
        const cabinet = new Batch(), lights = new Batch(), stock = new T.Group();
        cabinet.box(0, 1.50, .286, 2.60, .82, .09, kind.color);
        for (const a of [-1.19, 1.19])
            cabinet.box(a, .56, .849, .38, .75, .023, kind.color);
        lights.box(0, 2.015, .64, 2.27, .049, .045, kind.light);
        for (let i = 0; i < 6; i++) {
            const at = -.75 + i * .29;
            if (key === 'tea') {
                thermos(cabinet, at, 1.13, .65, i % 2 ? '#898e75' : '#ad745b');
                cabinet.ball(at, 1.15, .82, .15, .06, .08, '#c49356');
            } else if (key === 'shoes') {
                cabinet.box(at, 1.23, .61, .15, .18, .28, i % 2 ? '#85745f' : '#424546');
                cabinet.box(at, 1.15, .67, .16, .04, .31, '#354345');
            } else {
                cabinet.box(at, 1.33, .54, .14, .28, .18, i % 2 ? '#d1d1bd' : '#567695');
                cabinet.box(at, 1.178, .59, .142, .021, .31, '#a4b5b8');
            }
        }
        stock.add(cabinet.mesh(), lights.mesh(lit));
        stock.visible = false;
        root.add(stock);
        props[key] = { stock, map: signTexture(kind.sign, kind.small, '#f2dbac', kind.color, 5.5), actors: [] };
    }
    let previous;
    return (c, choice) => {
        const theme = props[choice], open = !!theme && c.minutes >= 7 * 60 && c.minutes < 23 * 60;
        if (choice !== previous) {
            title.material.map = theme?.map ?? closedMap;
            previous = choice;
        }
        shutter.visible = !open;
        const nearby = c.zone === 'street' && isNear(c, kioskSite, 36);
        for (const [key, value] of Object.entries(props)) {
            const active = open && key === choice;
            value.stock.visible = active;
            if (active && nearby && !value.actors.length) {
                value.actors = [createPerson('vendor'), ...kiosks[key].patrons.map(variant => createPerson('resident', variant))];
                for (const actor of value.actors)
                    root.add(actor.root);
            }
            value.actors.forEach((actor, i) => {
                actor.root.visible = active && nearby;
                if (!actor.root.visible)
                    return;
                actor.root.position.set(i === 0 ? -.48 : i === 1 ? -1.05 : 1.40, 0, i === 0 ? .13 : 1.30 + i * .33);
                actor.root.rotation.y = i === 0 ? Math.PI : i === 1 ? -.18 : .36;
                actor.update(c.dt, 0, false, { carry: i > 0 && key === 'tea' ? 'cup' : undefined, conversation: true });
            });
        }
    };
}

function createNeighbors(scene) {
    const tea = [deliveryPoint(scene, dispatch, -1), ...stops.map((point, i) => deliveryPoint(scene, point, i))];
    const grow = planting(scene), notices = noticeboard(scene), birds = birdWorkshop(scene), kiosk = kioskView(scene);
    let delivery, deliveredPlants, assembled, choice;

    function restore(data) {
        const order = data?.delivery;
        delivery = order && Number.isSafeInteger(order.shift) && order.shift >= 0 && Number.isInteger(order.step) && order.step >= 0 && order.step <= stops.length
            ? { shift: order.shift, step: order.step } : null;
        deliveredPlants = plants.map((_, i) => Number.isSafeInteger(data?.plants?.[i]) && data.plants[i] >= 0 ? data.plants[i] : null);
        assembled = data?.assembled === true;
        choice = Object.hasOwn(kiosks, data?.kiosk) ? data.kiosk : null;
    }
    function deliveryDispatch(c) {
        if (!nightShift(c)) {
            c.choose('Ночная доставка чая', [{ label: 'Подождать до 19:00', run: () => c.waitUntil(19 * 60) }], 'Термосы выдают с 19:00 до 05:00. Смена ждёт чай в депо, на рынке и в порту.');
            return;
        }
        if (delivery?.shift === shiftOf(c)) {
            c.show('Ночная доставка чая', delivery.step >= stops.length ? 'Все посты получили чай. Новая выдача завтра вечером.' : 'Следующий адрес · ' + stops[delivery.step].name);
            return;
        }
        c.choose('Ночная доставка чая', [{ label: 'Взять три термоса', run() {
            delivery = { shift: shiftOf(c), step: 0 };
            c.notify('Термосы получены. Первый адрес · дежурный депо.');
            c.save();
        } }], 'Сначала депо, затем пост у «Спектра» и портовая смена. Все три места есть в городском блокноте.');
    }
    function serve(c, i) {
        if (!nightShift(c) || delivery?.shift !== shiftOf(c) || delivery.step !== i) {
            c.show(stops[i].name, 'Дежурный пост. Ночная развозка начинается в кафе «Горячий лёд» после 19:00.');
            return;
        }
        delivery.step++;
        const complete = delivery.step === stops.length;
        if (complete)
            c.sim.money += 135;
        c.save();
        const next = complete ? 'Все посты получили чай. За смену начислено 135 ₽.' : 'Следующий адрес · ' + stops[delivery.step].name;
        c.show(stops[i].name, stops[i].line + '\n' + next);
    }
    const sites = [
        { id: 'tea-shift', label: 'Ночная доставка чая', ...dispatch, note: 'Кафе «Горячий лёд» · получить термосы с 19:00', act: deliveryDispatch },
        ...stops.map((spot, i) => ({ id: 'tea-stop-' + i, label: spot.name + ' · доставка чая', x: spot.x, z: spot.z, note: 'Пост ночной развозки', act: c => serve(c, i) })),
        { id: 'plant-shelf', label: 'Полка с черенками', ...plantSite, zone: 'house', guidePosition: houseOutside, radius: 1.42, note: 'Канальная, 23 · площадка второго этажа', act(c) {
            const available = plants.flatMap((plant, i) => deliveredPlants[i] == null ? [{ label: 'Оставить ' + plant.name.toLowerCase(), run() {
                deliveredPlants[i] = dayOf(c);
                c.notify(plant.owner + ' заберёт черенок. Через два дня загляните на подоконник со двора.');
                c.save();
            } }] : []);
            if (available.length)
                c.choose('Полка с черенками', available, 'Соседи подписали горшки бумажными бирками. Выберите, какой черенок оставить на обмен.');
            else
                c.show('Полка с черенками', 'На всех бирках уже есть имена. Подоконник выходит во двор Канальной.');
        } },
        { id: 'daily-board', label: 'Объявления Канальной, 23', ...boardSite, note: 'Лестница, синяя лыжа и новости двора', act: c => c.show('Объявления Канальной, 23', boardStories[dayOf(c) % boardStories.length].join('\n')) },
        { id: 'light-birds', label: 'Световые птицы', ...birdsSite, note: 'Мастерская и огни на южном берегу · после 18:00', act(c) {
            if (assembled) {
                c.show('Световые птицы', 'Все четыре птицы собраны из фонарей и светофоров. После 18:00 огни зажигаются по очереди и отражаются на канале.');
                return;
            }
            c.choose('Дворовая мастерская', [{ label: 'Закрепить последний светильник', run() {
                assembled = true;
                c.notify('Четвёртая птица готова. Огни включаются после 18:00.');
                c.save();
            } }], 'На верстаке остаётся крепление для последней птицы. Три уже стоят у воды.');
        } },
        { id: 'yard-kiosk', label: 'Киоск у дома № 31', ...kioskSite, note: 'Жители выбирают, что открыть во дворе', act(c) {
            if (choice) {
                c.show(kiosks[choice].name, kiosks[choice].detail + '\nКиоск открыт с 07:00 до 23:00.');
                return;
            }
            c.choose('Решение двора', Object.entries(kiosks).map(([key, kind]) => ({ label: kind.name, run() {
                choice = key;
                c.notify('Двор выбрал «' + kind.name.toLowerCase() + '». Киоск открывается с 07:00 до 23:00.');
                c.save();
            } })), 'На пустом киоске висит лист голосования. Жильцы ждут последнего голоса.');
        } }
    ];
    restore();
    return {
        sites, restore,
        save: () => ({ delivery: delivery && { ...delivery }, plants: deliveredPlants.slice(), assembled, kiosk: choice }),
        update(c) {
            const active = nightShift(c) && delivery?.shift === shiftOf(c), step = active ? delivery.step : 0;
            tea[0](c, nightShift(c) && step === 0, false);
            for (let i = 0; i < stops.length; i++)
                tea[i + 1](c, active && step === i, active && step > i);
            grow(c, deliveredPlants);
            notices(dayOf(c));
            birds(c, assembled);
            kiosk(c, choice);
        }
    };
}

module.exports = { createNeighbors };
