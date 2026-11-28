'use strict';

const T = require('../engine/three.module.min.js');
const { Batches, Panels } = require('./world-batch.js');
const { random, signTexture, texture } = require('./world-textures.js');
const { groundHeight, buildings, apartments, apartmentEntry } = require('./world-layout.js');
const { canal } = require('./world-expansion-layout.js');
const { river } = require('./venue-layout.js');
const { annexes } = require('./interior-layout.js');
const { createPerson } = require('./model-people.js');

const entrance = apartmentEntry(apartments.find(building => building.id === 19));
const floodStops = [
    { x: -40.3, z: 60.05, label: 'Отметки большой воды', note: 'Красные риски на парапете отмечают уровень воды в 2051, 2064 и 2072 годах. Самая высокая — май 2064. Следующий указатель стоит на другом краю спуска к каналу, восточнее.' },
    { x: -31.65, z: 60.05, label: 'След на спуске', note: 'В 2064-м вода здесь перелилась через парапет. По тёмной полосе на опоре видно, где начинался старый спуск. По северному берегу пройдите дальше на восток к дому № 19. У входа сохранилась ещё одна отметка.' },
    { x: entrance.x - 1.75, z: entrance.front + 1.23, label: 'Отметка у дома № 19', note: 'Здесь вода дошла до порога старого входа. После паводка порог подняли на две ступени, а почтовые ящики перевесили выше. Под табличкой виден шов от прежнего крыльца.' }
];
const tracksStart = { x: 20.8, z: 22.2 };
const tracksMiddle = { x: 17.4, z: 3.45 };
const terminus = { x: 16.95, z: -33.65 };
const trackSections = [
    [[20.8, 23.7], [20.45, 21.8], [19.85, 19.5]],
    [[19.62, 17.35], [19.25, 15.9], [18.85, 14.05]],
    [[17.45, 4.85], [17.4, 2.83], [17.28, .72]],
    [[17.25, -.45], [17.26, -3.95], [17.45, -6.4]],
    [[18.05, -8.15], [18.71, -10.45], [19.17, -13.72]],
    [[19.26, -15.3], [18.95, -17.9], [18.3, -20.25]],
    [[17.47, -22.08], [16.67, -24.45], [16.15, -26.6]],
    [[15.94, -27.53], [15.84, -29.64], [16.18, -31.5], [16.83, -32.9], [18.01, -33.65]]
];
const lostCounter = { x: 254.65, z: -3.03, zone: river.door.zone };
const lostItems = [
    { id: 'gloves', label: 'Шерстяные перчатки', detail: 'Правая заштопана зелёной ниткой. В манжете бирка с буквой В.', owner: 'Валентина', x: 14.1, z: 104.45, style: 11, yaw: -.38,
        hint: '«Утром у причала рукавицы сняла, чтобы билет достать. На правой зелёная заплатка, сама зашила».', thanked: '«Вот правая, с зелёной ниткой! Теперь можно снова на причал».', place: 'у стоянки такси рядом с вокзалом' },
    { id: 'case', label: 'Жёсткий футляр', detail: 'На крышке две параллельные царапины. Внутри пустое гнездо для очков.', owner: 'Аркадий', x: 10.62, z: -38.05, style: 13, yaw: 1.45,
        hint: '«Очки при мне, футляр оставил на вокзале. Соскользнул с приборной панели, на крышке две царапины».', thanked: '«Обе царапины на месте. Положу в карман, а не на панель».', place: 'у входа в трамвайное депо' },
    { id: 'bag', label: 'Сумка с нашивкой', detail: 'На нашивке вышиты ромашка и буквы Л. С. Под клапаном пустой отдел для накладных.', owner: 'Людмила', x: 59.2, z: 21.92, style: 8, yaw: -.82,
        hint: '«Сумка синяя, с ромашкой. Дочь вышила её поверх старых букв. Ездила с ней за товаром через Речной».', thanked: '«Дочка и правда криво вышила лепесток. Моя сумка, спасибо».', place: 'у восточных рядов рынка' }
];
const oldShops = { x: 61.8, z: 20.65 };
const shopOwner = { x: 62.14, z: 19.3, style: 19, yaw: .55 };
const pumps = { x: 35.5, z: 70 };
const bridge = { x: 54.20, z: 74.2 };
const courtyard = { x: -28.9, z: 1.1 };
const pumpCycle = 10.8, pumpGap = 2.4;
const distance = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
const clamp = n => Math.max(0, Math.min(1, n));

function courtyardShelter(x, z) {
    const t = clamp((11 - Math.hypot(x - courtyard.x, z - courtyard.z)) / 7);
    return t * t * (3 - 2 * t);
}

function panel(panels, title, text, x, y, z, w, h, angle = 0, ink = '#dfca9e', back = '#394f58') {
    panels.place(title + text, () => signTexture(title, text, ink, back, w / h), x, y, z, w, h, angle);
}

function floodView(view) {
    view(floodStops[0], 32, (root, b, panels) => {
        const face = canal.north - .388;
        for (const [i, label] of ['2051', 'МАЙ 2064', '2072'].entries()) {
            const y = [.125, .355, .215][i], x = floodStops[0].x + i * .82;
            b.box(x + .13, y, face, .70, .028, .028, '#895a51');
            b.box(x + .38, y - .04, face - .004, .034, .094, .026, '#79574d');
            panel(panels, label, '', x - .25, y + .011, face - .016, .43, .133, Math.PI, '#e5c9aa', '#686965');
        }
        panel(panels, 'СЛЕДЫ ПАВОДКА', 'К СПУСКУ  ←', floodStops[0].x + .70, 1.10, face - .04, 1.34, .38, Math.PI, '#d7c49c', '#4a6067');
    });
    view(floodStops[1], 28, (root, b, panels) => {
        const x = floodStops[1].x, z = canal.north - .39;
        for (let i = 0; i < 11; i++) {
            const px = x - 1.7 + i * .31;
            b.box(px, .336 - i % 3 * .01, z, .48, .032 + .012 * (i % 3), .018, i % 2 ? '#80706a' : '#8d7469');
            if (i % 2 === 0)
                b.box(px - .10, .245 - i % 3 * .029, z + .001, .023, .14 + .018 * i, .015, '#857c75');
        }
        panel(panels, 'УРОВЕНЬ 2064', 'ДОМ 19  ←', x + .26, .74, z - .015, 1.25, .29, Math.PI, '#dfc6a9', '#59676c');
    });
    view(floodStops[2], 32, (root, b, panels) => {
        const { x } = floodStops[2], z = entrance.front + .052;
        b.box(x, .39, z, 1.15, .04, .024, '#856557');
        b.box(x, .124, z, 1.20, .031, .026, '#6a7274');
        for (let i = 0; i < 5; i++)
            b.box(x + (i - 2) * .24, .185, z, .023, .11, .019, '#6a7274');
        panel(panels, 'МАЙ 2064', 'СТАРЫЙ ПОРОГ', x, .67, z + .026, .69, .32, 0, '#dbbc9a', '#63584e');
    });
}

function railroadView(view) {
    for (const section of trackSections) {
        const [x, z] = section[0];
        view({ x, z }, 40, (root, b) => {
            for (let i = 1; i < section.length; i++) {
                const [ax, az] = section[i - 1], [bx, bz] = section[i];
                const length = Math.hypot(bx - ax, bz - az), nx = (bz - az) / length, nz = -(bx - ax) / length;
                const yaw = Math.atan2(bx - ax, bz - az);
                for (const side of [-1, 1]) {
                    const x1 = ax + side * nx * .63, z1 = az + side * nz * .63;
                    const x2 = bx + side * nx * .63, z2 = bz + side * nz * .63;
                    b.beam(x1, groundHeight(x1, z1) + .021, z1, x2, groundHeight(x2, z2) + .021, z2, .047, '#746961', true);
                    b.beam(x1, groundHeight(x1, z1) + .045, z1, x2, groundHeight(x2, z2) + .045, z2, .024, '#a2a39c', true);
                }
                if (az > 18 || az < -24)
                    for (let d = .4; d < length; d += .73) {
                        const px = ax + (bx - ax) * d / length, pz = az + (bz - az) * d / length;
                        b.box(px, groundHeight(px, pz) + .010, pz, 1.52, .033, .126, '#6c6358', yaw);
                    }
            }
        });
    }
    view(tracksMiddle, 26, (root, b, panels) => {
        const x = tracksMiddle.x + 1.04, z = tracksMiddle.z - .46, y = groundHeight(x, z);
        b.box(x, y + .23, z, .055, .47, .055, '#636361');
        b.box(x, y + .45, z, .29, .24, .051, '#4d655f');
        panel(panels, '03', '', x, y + .45, z + .028, .24, .20, 0, '#e0cba5', '#4d655f');
    });
    view(terminus, 44, (root, b, panels) => {
        const x = buildings.power.x - buildings.power.w / 2 - .046, z = terminus.z;
        b.box(x, 1.39, z, .09, 2.77, 3.18, '#4a5b61');
        for (let i = -8; i <= 8; i++)
            b.box(x - .06, 1.34, z + i * .164, .051, 2.54, .039, i % 3 ? '#586a6b' : '#687878');
        for (const height of [.13, .73, 2.16, 2.63])
            b.box(x - .10, height, z, .05, .074, 3.25, '#3b4e55');
        b.box(x - .14, 1.17, z, .060, .12, .27, '#7e6a57');
        b.box(x - .18, 1.14, z + .02, .071, .14, .083, '#b39b6d');
        panel(panels, 'КОНЕЧНАЯ 03', 'СТАРОЕ ДЕПО', x - .13, 2.96, z, 2.40, .43, -Math.PI / 2, '#dfc690', '#4f5c58');
    });
}

function fadedSign(title, ink, back, seed) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 82;
    const g = canvas.getContext('2d'), noise = random(seed);
    g.fillStyle = back;
    g.fillRect(0, 0, 384, 82);
    g.font = 'bold 44px K77Display, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = ink;
    g.fillText(title, 192, 45, 361);
    for (let i = 0; i < 680; i++) {
        g.globalAlpha = .3 + noise() * .55;
        g.fillStyle = i % 3 ? back : '#a19f90';
        g.fillRect(noise() * 384, noise() * 82, 1 + noise() * 9, 1 + noise() * 3);
    }
    g.globalAlpha = 1;
    return texture(canvas);
}

function signsView(view) {
    const { booth, booth2, booth3 } = buildings;
    view(oldShops, 54, (root, b, panels) => {
        const side = booth2.x + booth2.w / 2 + .038, angle = Math.PI / 2, z = booth2.z;
        panels.place('galantereya', () => fadedSign('ГАЛАНТЕРЕЯ', '#d9b591', '#566768', 72), side, 2.10, z, 3.18, .66, angle);
        b.box(side + .059, 2.00, z + .11, .085, .40, 1.35, '#385a5f');
        panel(panels, 'ПАЯЛЬНАЯ', 'БОКОВОЙ ВХОД', side + .103, 2.00, z + .11, 1.27, .35, angle);
        for (const [house, name, ink, back] of [[booth, 'ПРОКАТ', '#736f64', '#9c9886'], [booth3, 'ХЛЕБНЫЙ', '#7e6253', '#a59481']])
            panels.place(name, () => fadedSign(name, ink, back, house.x * 137), house.x + house.w / 2 + .04,
                2.13, house.z + .24, 3.12, .61, Math.PI / 2);
    });
}

function stationView(indoor) {
    const furniture = annexes[river.door.zone].furniture.find(f => f.kind === 'luggage');
    const root = new T.Group(), panels = new Panels(root), b = new Batches(root);
    root.name = 'Бюро забытых вещей';
    indoor.add(root);
    panel(panels, 'БЮРО НАХОДОК', 'РЕЧНОЙ ВОКЗАЛ', furniture.x, 1.71, furniture.z + .08, 1.53, .35);
    for (const side of [-1, 1])
        b.box(furniture.x + .64 * side, 1.41, furniture.z + .025, .047, .50, .048, '#435e67');
    b.box(furniture.x, 1.20, furniture.z, furniture.w - .18, .035, furniture.d - .14, '#504d4b');
    b.flush();
    panels.flush();
    return lostItems.map((item, i) => {
        const prop = new T.Group(), pieces = new Batches(prop);
        prop.name = item.label;
        prop.position.set(furniture.x + (i - 1) * .44, 1.22, furniture.z + .013);
        root.add(prop);
        if (item.id === 'gloves') {
            for (const side of [-1, 1]) {
                pieces.box(side * .065, .038, 0, .10, .057, .22, '#99786a', .15 * side);
                pieces.box(side * .105, .042, .026, .046, .038, .078, '#99786a', .54 * side);
            }
            pieces.box(.068, .071, -.003, .05, .009, .056, '#697752');
        } else if (item.id === 'case') {
            pieces.box(0, .05, 0, .213, .067, .109, '#343d41', -.14);
            pieces.box(0, .089, 0, .212, .024, .106, '#646f70', -.14);
            pieces.box(.041, .102, .001, .05, .005, .009, '#a9a598', -.14);
            pieces.box(.045, .102, .015, .045, .005, .008, '#a9a598', -.14);
        } else {
            pieces.box(0, .121, 0, .285, .229, .17, '#586f8b');
            pieces.box(0, .169, .091, .266, .133, .019, '#617b92');
            pieces.box(.07, .155, .103, .066, .063, .009, '#d3c0a0');
            pieces.beam(-.105, .205, -.05, -.055, .305, -.05, .024, '#334c61');
            pieces.beam(-.055, .305, -.05, .055, .305, -.05, .024, '#334c61');
            pieces.beam(.055, .305, -.05, .105, .205, -.05, .024, '#334c61');
        }
        pieces.flush();
        return prop;
    });
}

function pumpPhase(elapsed) {
    const time = Math.max(0, elapsed), cycle = Math.floor(time / pumpCycle), phase = Math.min(3, Math.floor((time - cycle * pumpCycle) / pumpGap));
    return { phase, key: cycle * 4 + phase };
}

function pumpView(view) {
    const { x, z } = pumps, y = groundHeight(x, z);
    view(pumps, 33, (root, b, panels) => {
        b.box(x + .76, y + .28, z + .29, .66, .59, .34, '#667476');
        b.box(x + .76, y + .39, z + .474, .58, .21, .033, '#3d5057');
        panel(panels, 'НАСОСНАЯ', '01 · 02 · 03', x + .76, y + .39, z + .498, .52, .192);
        const lamps = [0, 1, 2].map(i => {
            const light = new T.Mesh(new T.BoxGeometry(.065, .045, .024), new T.MeshBasicMaterial({ color: '#617267' }));
            light.position.set(x + .58 + i * .18, y + .23, z + .474);
            root.add(light);
            return light;
        });
        let previous = -1;
        return c => {
            const { phase } = pumpPhase(c.elapsed);
            if (phase !== previous) {
                lamps.forEach((lamp, i) => lamp.material.color.set(i <= phase && phase < 3 ? '#f2ba65' : '#617267'));
                previous = phase;
            }
        };
    });
}

function createDiscoveries(scene) {
    const views = [], actors = new Map(), seenCars = new Map(), stationProps = new WeakMap();
    const held = new Set(), returned = new Set();
    let lastPump, lastTime = -Infinity, previousScan = -Infinity;

    function view(point, range, build) {
        views.push({ point, range, build });
    }
    floodView(view);
    railroadView(view);
    signsView(view);
    pumpView(view);

    function deskMenu(c) {
        const available = lostItems.filter(item => !returned.has(item.id));
        if (!available.length) {
            c.show('Бюро забытых вещей', 'Полка пуста. Дежурная зачеркнула последнюю строку в журнале — все вещи вернулись к хозяевам.');
            return;
        }
        c.choose('Бюро забытых вещей', available.map(item => ({ label: (held.has(item.id) ? 'У вас · ' : '') + item.label, run() {
            c.choose(item.label, [
                { label: held.has(item.id) ? 'Прочитать примету владельца' : 'Взять для возврата', run() {
                    if (!held.has(item.id)) {
                        held.add(item.id);
                        c.save();
                    }
                    c.show(item.label, 'Дежурная подсказывает, где обычно бывает человек с похожей приметой: ' + item.place + '. Спросите, что именно он потерял.');
                } },
                { label: 'Вернуться к журналу', run: () => deskMenu(c) }
            ], item.detail);
        } })));
    }

    function talk(owner, c) {
        if (returned.has(owner.id)) { c.show(owner.owner, owner.thanked); return; }
        const choices = lostItems.filter(item => held.has(item.id)).map(item => ({ label: 'Показать · ' + item.label, run() {
            if (item.id !== owner.id) {
                c.show(owner.owner, '«Это не моя вещь».\n\n' + owner.hint);
                return;
            }
            held.delete(item.id);
            returned.add(item.id);
            c.save();
            c.show(owner.owner, owner.thanked);
        } }));
        if (!choices.length) c.show(owner.owner, owner.hint);
        else c.choose(owner.owner, choices, owner.hint);
    }

    const shopLine = '«Когда мать здесь торговала нитками, говорили „до Галантереи“. Сейчас я здесь чиню радиоприёмники. Я до сих пор объясняю дорогу по старой вывеске, её буквы видны по обе стороны новой». Другие старые надписи видны на торцах соседних павильонов.';
    const sites = [
        { id: 'canal-flood', ...floodStops[0], radius: 2.1 },
        { id: 'retired-rail', ...tracksStart, label: 'Рельсы в никуда', radius: 2.0,
            note: 'Ржавые рельсы расходятся с действующим путём и уходят за рынок. За павильонами их скрывает асфальт. Следующие обрывки ищите на открытой площадке севернее рядов.' },
        { id: 'river-lost-property', ...lostCounter, guidePosition: river.door, label: 'Бюро забытых вещей', radius: 1.55,
            note: 'Войдите в Речной вокзал. Полка с находками слева от табло.', act: deskMenu },
        { id: 'old-shop-signs', ...oldShops, label: 'Вывески под штукатуркой', radius: 2.35, note: shopLine,
            act: c => c.show('Хозяин мастерской', shopLine) },
        { id: 'sound-pumps', ...pumps, y: groundHeight(pumps.x, pumps.z), label: 'Звуки за стеной · насосная', radius: 2.25,
            guideNote: 'На льду канала, вход через Шлюзовой съезд',
            note: 'Под люком по очереди запускаются три насоса. У каждого свой гул. На коробке у люка лампы загораются в том же порядке.' },
        { id: 'sound-bridge', ...bridge, y: groundHeight(bridge.x, bridge.z), label: 'Звуки за стеной · мост', radius: 2.05,
            guideNote: 'Лёд у восточной опоры Портового моста',
            note: 'Когда машина проходит стык над головой, слышен короткий двойной удар колёс. Следом звенит стальной шов.' },
        { id: 'sound-quiet', ...courtyard, label: 'Звуки за стеной · тихий двор', radius: 2.25,
            note: 'Стены домов приглушают улицу. Здесь хорошо слышны собственные шаги. Вернитесь в проезд, чтобы услышать, как постепенно возвращается гул машин.' }
    ];
    const sideActions = [
        ...floodStops.slice(1).map((stop, i) => ({ ...stop, id: 'world:flood-trace-' + i, run: c => c.show(stop.label, stop.note) })),
        { ...tracksMiddle, id: 'world:steel-under-snow', label: 'Осмотреть рельсы под снегом', run: c => c.show('Старый путь', 'Между стыков лежит табличка «03». Рельсы идут на север вдоль проезда. Последний отрезок поворачивает к зарешеченным воротам у диспетчерской.') },
        { ...terminus, id: 'world:retired-terminus', label: 'Прочитать табличку конечной', run: c => c.show('Конечная 03 · Старое депо', '«Рабочий маршрут 03. Вход через северные ворота». Линию закрыли, когда новый рынок занял разворотное кольцо. В старом проёме остались рельсы и навесной замок.') },
        ...lostItems.map(owner => ({ ...owner, id: 'world:lost-owner-' + owner.id, label: 'Поговорить · ' + owner.owner, run: c => talk(owner, c) }))
    ];
    const canTalk = (c, row) => (c.zone ?? 'street') === 'street' && !c.car && distance(c, row) <= 2.0;

    function resident(point, name, c) {
        let model = actors.get(name);
        const visible = (c.zone ?? 'street') === 'street' && distance(c, point) < 44;
        if (!visible) {
            if (model) model.root.visible = false;
            return;
        }
        if (!model) {
            model = createPerson('resident', point.style);
            model.root.name = name;
            model.root.position.set(point.x, groundHeight(point.x, point.z), point.z);
            model.root.rotation.y = point.yaw;
            scene.add(model.root);
            actors.set(name, model);
        }
        model.root.visible = true;
        if (distance(c, point) < 23)
            model.update(c.dt, 0, false, { ground: groundHeight, anticipation: distance(c, point) < 3 });
    }

    function listen(c) {
        const a = c.audio;
        if ((c.zone ?? 'street') !== 'street' || !a?.streetGate || a.paused || a.ctx?.state !== 'running' || typeof document !== 'undefined' && document.hidden) {
            seenCars.clear();
            return;
        }
        if (distance(c, pumps) < 17) {
            const { phase, key } = pumpPhase(c.elapsed), gain = .075 * (1 - distance(c, pumps) / 17);
            if (phase < 3 && key !== lastPump && gain > .004) {
                const hz = [51, 72, 93][phase];
                a.tone(hz * .85, hz, 1.79, gain, 'triangle', 0, a.streetGate);
                a.burst(235 + phase * 205, 1.18, gain * .46, .15, .95, a.streetGate);
            }
            lastPump = key;
        } else lastPump = undefined;
        if (distance(c, bridge) >= 19) { seenCars.clear(); return; }
        if (c.elapsed - previousScan < .065) return;
        previousScan = c.elapsed;
        for (const car of c.sim?.cars ?? []) {
            if (Math.abs(car.x - 46) > 5.7 || Math.abs(car.z - c.z) > 21 || Math.abs(car.speed) < 1.9) {
                seenCars.delete(car.id);
                continue;
            }
            const seam = Math.floor((car.z - 56.45) / 4.9), previous = seenCars.get(car.id);
            if (previous !== undefined && seam !== previous) {
                const gain = .105 * (1 - Math.min(.94, distance(c, car) / 27));
                a.tone(87, 52, .18, gain, 'triangle', 0, a.streetGate);
                a.burst(274, .16, gain * .53, .09, 1.3, a.streetGate);
                a.tone(380, 212, .21, gain * .33, 'sine', .17, a.streetGate);
            }
            seenCars.set(car.id, seam);
        }
    }

    return {
        sites,
        actions(c) { return sideActions.filter(row => canTalk(c, row)).map(({ id, label }) => ({ id, label })); },
        act(id, c) {
            const row = sideActions.find(row => row.id === id);
            if (!row || !canTalk(c, row)) return false;
            row.run(c);
            return true;
        },
        update(c) {
            const street = (c.zone ?? 'street') === 'street';
            for (const view of views) {
                const visible = street && distance(c.focus ?? c, view.point) < view.range;
                if (visible && !view.root) {
                    view.root = new T.Group();
                    const b = new Batches(view.root), panels = new Panels(view.root);
                    view.pose = view.build(view.root, b, panels);
                    b.flush();
                    panels.flush();
                    scene.add(view.root);
                }
                if (view.root) view.root.visible = visible;
                if (visible) view.pose?.(c);
            }
            if (c.zone === river.door.zone && c.indoorScene) {
                let props = stationProps.get(c.indoorScene);
                if (!props) { props = stationView(c.indoorScene); stationProps.set(c.indoorScene, props); }
                props.forEach((prop, i) => { prop.visible = !held.has(lostItems[i].id) && !returned.has(lostItems[i].id); });
            }
            for (const owner of lostItems) resident(owner, owner.owner, c);
            resident(shopOwner, 'Хозяин мастерской', c);
            if (c.elapsed < lastTime) { seenCars.clear(); lastPump = undefined; previousScan = -Infinity; }
            lastTime = c.elapsed;
            listen(c);
        },
        save() { return { held: [...held], returned: [...returned] }; },
        restore(raw) {
            held.clear();
            returned.clear();
            for (const { id } of lostItems) {
                if (Array.isArray(raw?.returned) && raw.returned.includes(id)) returned.add(id);
                else if (Array.isArray(raw?.held) && raw.held.includes(id)) held.add(id);
            }
            seenCars.clear();
            lastPump = undefined;
            lastTime = previousScan = -Infinity;
        }
    };
}

module.exports = { createDiscoveries, courtyardShelter };
