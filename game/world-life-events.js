'use strict';

const T = require('../engine/three.module.min.js');
const { Batch, lit } = require('./model-geometry.js');
const { Batches, Panels } = require('./world-batch.js');
const { signTexture, texture } = require('./world-textures.js');
const { groundHeight } = require('./world-layout.js');
const { createPerson } = require('./model-people.js');
const { createVehicle } = require('./model-cars.js');
const { linesByPhoto } = require('./story-photos.js');
const { oldPhotos, jobPlaces } = require('./story-map.js');

const sites = [
    { id: 'dock-shift', label: 'Пересменка у причала', x: -146, z: 103.5, radius: 3.1,
        note: 'Причал 01. Смена выходит в 05:55, 13:55 и 21:55. Такси ждут у столовой.' },
    { id: 'first-bread', label: 'Хлебное окно у депо', x: -24.5, z: -23.8, radius: 3,
        note: 'Первая партия хлеба выходит к 05:20. Боковое окно открыто до 05:55.', waitAt: 320 },
    { id: 'yard-cinema', label: 'Дворовое кино', x: -26, z: 19.3, radius: 3.6,
        note: 'У дома № 23 показывают местную хронику с 20:30 до 21:20.', waitAt: 1230 },
    { id: 'market-after-hours', label: 'Спектр после закрытия', x: 34.3, z: 14, radius: 3.2,
        note: 'В 22:15 у задних ворот обмениваются товаром. К 23:00 ящики увозят на соседние улицы.', waitAt: 1335 },
    { id: 'ice-sculptures', label: 'Ледовые фигуры у Металлурга', x: -113.7, z: 37.8, radius: 4,
        note: 'На площади ДК выгружают лёд, вырезают фигуры и подсвечивают их вечером. Через несколько дней фигуры теряют острые края.' }
];
const shiftStarts = [355, 835, 1315];
const dayLength = 1440;
const stone = new T.IcosahedronGeometry(1, 0);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const unit = n => clamp(n, 0, 1);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const mix = (a, b, t) => a + (b - a) * t;
const shiftStartAt = minutes => shiftStarts.find(start => minutes >= start && minutes < start + 15);
const bakeryOpen = minutes => minutes >= 320 && minutes < 355;
const cinemaOpen = minutes => minutes >= 1230 && minutes < 1280;
const marketOpen = minutes => minutes >= 1335 && minutes < 1380;
const sculptureDay = calendarMinutes => Math.max(0, Math.floor(calendarMinutes / dayLength)) % 6;

function fixture(parent, x, z, name) {
    const node = new T.Group();
    node.name = name;
    node.position.set(x, groundHeight(x, z), z);
    parent.add(node);
    return node;
}

function sign(root, title, subtitle, x, y, z, w, h, yaw = 0) {
    if (typeof document === 'undefined')
        return;
    const labels = new Panels(root);
    labels.place(title, () => signTexture(title, subtitle, '#f0d8aa', '#333f47', w / h), x, y, z, w, h, yaw);
    labels.flush();
}

function cast(group) {
    const people = new Map();
    return (id, variant, x, z, yaw, speed, dt, options = {}) => {
        let actor = people.get(id);
        if (!actor) {
            actor = createPerson('resident', variant);
            actor.root.name = id;
            people.set(id, actor);
            group.add(actor.root);
        }
        actor.root.position.set(x, groundHeight(x, z), z);
        actor.root.rotation.y = yaw;
        actor.update(dt, speed, false, options);
        return actor.root;
    };
}

function crate(batch, x, y, z, w, d, color) {
    batch.box(x, y, z, w, .24, d, color);
    batch.box(x, y + .139, z, w + .025, .043, d + .027, '#969783');
    for (const side of [-1, 1])
        batch.box(x + side * w * .35, y, z, .033, .263, d + .022, '#c4b08a');
}

function shiftScene(root) {
    const gate = fixture(root, -151, 101.35, 'Проходная причала 01');
    const b = new Batches(gate);
    b.box(0, 1.24, 0, 3.14, 2.48, .19, '#46595d');
    b.box(0, 1.08, .103, 1.86, 2.07, .06, '#303f45');
    for (const x of [-1.45, 1.45])
        b.box(x, 1.44, .75, .15, 2.88, .17, '#52656a');
    b.box(0, 2.74, .52, 3.62, .17, 1.85, '#516269');
    b.lamp(0, 2.63, 1.02, 1.62, .065, .20, '#f4c385');
    b.box(2.48, 1.22, .20, 1.48, .95, .25, '#526565');
    b.lamp(2.48, 1.26, .341, 1.22, .50, .025, '#d3ab72');
    b.box(2.48, .76, .54, 1.54, .09, .60, '#647070');
    for (let i = 0; i < 6; i++)
        b.box(-1.2 + i * 1.45, .013, 4.83, .67, .02, .061, '#c1ae7b');
    b.flush();
    sign(gate, 'ПРИЧАЛ 01', 'ПРОХОДНАЯ · СТОЛОВАЯ', 0, 2.28, .115, 2.56, .47);

    const group = new T.Group(), person = cast(group), taxis = [];
    const queueYaw = Math.atan2(-5.2, -.70);
    group.name = 'Пересменка у причала';
    group.visible = false;
    root.add(group);
    return (c, close) => {
        const start = shiftStartAt(c.minutes);
        group.visible = close && start !== undefined;
        if (!group.visible)
            return;
        const t = (c.minutes - start) * 2 + c.elapsed % 2;
        for (let i = 0; i < 6; i++) {
            const age = t - i * 1.78, walkTime = 5.2 + i * .48;
            const arrival = unit(age / walkTime), leaving = unit((age - 17) / 6.5);
            const x = mix(-151.55 + (i % 2) * .70, -148.65 + i * .58, arrival) + leaving * (6.2 - i * .56);
            const z = mix(101.73, 102.20 + (i % 2) * .29, Math.sqrt(arrival)) + leaving * 1.0;
            const walking = age < walkTime || leaving > 0;
            const yaw = walking ? queueYaw : Math.PI * .08;
            const worker = person('Рабочий причала ' + (i + 1), [8, 13, 5, 12, 10, 6][i], x, z, yaw, walking ? .84 : 0,
                c.dt, { carry: i === 1 ? 'parcel' : undefined });
            worker.visible = age >= 0 && leaving < 1;
        }
        for (let i = 0; i < 2; i++) {
            const taxi = taxis[i] ??= createVehicle('taxi', i ? '#c5a35a' : '#dbb061');
            if (!taxi.root.parent)
                group.add(taxi.root);
            const age = (t + i * 8) % 30;
            taxi.root.position.set(-143.5 - i * 7 - 1.5 * unit(age / 3) - 1.7 * unit((age - 24) / 5), 0, 105.08 + i * .07);
            taxi.root.rotation.y = Math.PI / 2;
            const rolling = age < 3 || age >= 24;
            taxi.update(c.dt, rolling ? .6 : 0, 0, true, !rolling, 0, { wheel: age * .18, cameraDistance: distance(c, taxi.root.position) });
        }
    };
}

function dogMesh() {
    const root = new T.Group(), b = new Batch();
    root.name = 'Собака у хлебного окна';
    b.ball(0, .277, 0, .13, .125, .235, '#776453');
    b.ball(0, .353, -.179, .094, .121, .095, '#a4886c');
    b.ball(0, .312, -.249, .056, .040, .085, '#b2997b');
    b.ball(0, .319, -.327, .035, .028, .022, '#323237');
    b.box(0, .306, -.139, .176, .039, .043, '#6c8f8f');
    for (const side of [-1, 1]) {
        b.ball(side * .071, .40, -.178, .035, .082, .045, '#665144', [0, 0, side * .35]);
        b.ball(side * .071, .371, -.237, .015, .013, .014, '#333436');
    }
    root.add(b.mesh());
    const legs = [-.13, .14].flatMap(z => [-.083, .083].map(x => {
        const pivot = new T.Group(), leg = new Batch();
        pivot.position.set(x, .22, z);
        leg.rod([0, .04, 0], [0, -.195, 0], .031, '#796959');
        leg.ball(0, -.195, -.022, .036, .025, .054, '#a08971');
        pivot.add(leg.mesh()); root.add(pivot);
        return pivot;
    }));
    const tail = new T.Group(), tip = new Batch();
    tail.position.set(0, .30, .21);
    tip.rod([0, 0, 0], [0, .12, .12], .038, '#6b5949');
    tip.rod([0, .12, .12], [0, .16, .20], .026, '#8d745e');
    tail.add(tip.mesh()); root.add(tail);
    return { root, update(time, moving) {
        tail.rotation.y = Math.sin(time * 7.5) * .48;
        legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(time * 11 + (i === 0 || i === 3 ? 0 : Math.PI)) * .39 : 0; });
    } };
}

function bakeryScene(root) {
    const bakery = fixture(root, -24.5, -25.23, 'Боковое окно пекарни');
    const front = new Batches(bakery);
    front.box(0, 1.40, .045, 3.08, 2.68, .19, '#77594e');
    front.box(0, 1.48, .152, 2.61, .99, .051, '#2f3a3b');
    front.box(0, .959, .38, 2.74, .11, .58, '#877662');
    front.box(0, 2.59, .42, 3.34, .15, .89, '#81584b');
    for (const side of [-1, 1])
        front.box(side * 1.20, .57, .39, .13, 1.04, .12, '#6e655c');
    front.flush();
    sign(bakery, 'ПЕКАРНЯ', 'ВЫДАЧА ХЛЕБА · 05:20', 0, 2.27, .168, 2.67, .49);
    const shutter = new T.Group(), closed = new Batches(shutter);
    for (let i = 0; i < 8; i++)
        closed.box(0, 1.06 + i * .118, .195, 2.55, .106, .045, i % 2 ? '#7a807b' : '#697575');
    closed.flush();
    bakery.add(shutter);
    const open = new T.Group(), goods = new Batches(open);
    goods.lamp(0, 1.49, .190, 2.53, .91, .023, '#dbaa71');
    goods.lamp(0, 1.93, .239, 1.62, .069, .068, '#f7d9a0');
    for (let i = 0; i < 8; i++) {
        const x = (i - 3.5) * .295;
        goods.piece('stone', x, 1.044, .40, .272, .149, .179, i % 2 ? '#af7343' : '#d2a369', .22 * Math.cos(i));
        goods.box(x + .027, 1.118, .406, .08, .015, .041, '#e4c096', .48);
    }
    goods.flush();
    bakery.add(open);
    const people = new T.Group(), person = cast(people);
    people.name = 'Покупатели первой партии хлеба';
    people.visible = false;
    root.add(people);
    const leash = new T.Mesh(new T.CylinderGeometry(.012, .012, 1, 5), new T.MeshLambertMaterial({ color: '#524e42' }));
    const lead = new T.Vector3(), clip = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    people.add(leash);
    let dog;
    return (c, close) => {
        const active = bakeryOpen(c.minutes);
        const time = (c.minutes - 320) * 2 + c.elapsed % 2;
        shutter.scale.y = active ? .16 : 1;
        shutter.position.y = active ? 1.64 : 0;
        open.visible = active;
        people.visible = close && active;
        if (!people.visible)
            return;
        const customers = [['Водитель первого автобуса', 10], ['Уборщица из депо', 3], ['Сосед с собакой', 6]];
        customers.forEach(([name, variant], i) => {
            const departure = (time - i * 8 + 50) % 50, walk = unit((departure - 5) / 9) - unit((departure - 28) / 12);
            const x = -24.65 + i * .89 + walk * (i === 2 ? 2.6 : -1.47);
            const z = -24.31 + walk * .47 + i * .08;
            const moving = (departure >= 5 && departure <= 14) || (departure >= 28 && departure <= 40);
            const walkingEast = (i === 2) === (departure < 23);
            person(name, variant, x, z, moving ? (walkingEast ? -Math.PI / 2 : Math.PI / 2) : 0, moving ? .74 : 0, c.dt,
                { carry: departure < 26 ? 'parcel' : undefined });
            if (i === 2) {
                if (!dog) {
                    dog = dogMesh();
                    people.add(dog.root);
                }
                dog.root.position.set(x + .60, groundHeight(x + .60, z + .29), z + .29);
                dog.root.rotation.y = moving ? (walkingEast ? -Math.PI / 2 : Math.PI / 2) : -.48;
                dog.update(time, moving);
                lead.set(x + .21, groundHeight(x, z) + .86, z + .12);
                clip.set(dog.root.position.x, dog.root.position.y + .32, dog.root.position.z);
                leash.position.copy(lead).lerp(clip, .5);
                clip.sub(lead);
                leash.scale.y = clip.length();
                leash.quaternion.setFromUnitVectors(up, clip.normalize());
            }
        });
    };
}

function filmTexture(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const c = canvas.getContext('2d');
    c.fillStyle = '#b2a48a'; c.fillRect(0, 0, 256, 144);
    c.fillStyle = '#8d8371'; c.fillRect(0, 93, 256, 51);
    c.strokeStyle = '#514b41'; c.lineWidth = 1.6;
    if (index === 0) {
        c.fillStyle = '#716956'; c.fillRect(101, 55, 69, 36); c.fillRect(166, 64, 68, 27);
        c.fillStyle = '#ac9772'; c.fillRect(105, 59, 62, 27); c.fillRect(118, 63, 10, 18);
        c.fillStyle = '#564c40'; c.fillRect(137, 67, 15, 20);
        c.strokeStyle = '#6c6253'; c.beginPath(); c.moveTo(0, 139); c.lineTo(116, 90); c.lineTo(256, 120); c.stroke();
        c.strokeStyle = '#554b3b'; c.beginPath(); c.moveTo(13, 118); c.lineTo(110, 91); c.lineTo(253, 105); c.stroke();
        c.beginPath(); c.moveTo(68, 109); c.lineTo(68, 38); c.lineTo(76, 33); c.lineTo(88, 34); c.stroke();
        c.beginPath(); c.moveTo(0, 65); c.lineTo(68, 46); c.lineTo(253, 29); c.stroke();
        c.fillStyle = '#443c32'; c.font = 'bold 10px monospace'; c.fillText('СПЕКТР', 111, 58);
    } else {
        const shot = oldPhotos[index - 1], origin = jobPlaces[shot.at], cs = Math.cos(shot.heading), sn = Math.sin(shot.heading);
        for (const line of linesByPhoto[index - 1]) {
            c.beginPath();
            line.forEach(([x, y, z], i) => {
                const dx = x - origin.x, dz = z - origin.z, depth = -dx * sn - dz * cs;
                const u = 128 + (dx * cs - dz * sn) * 160 / depth, v = 102 - (y - 1.65) * 152 / depth;
                if (i) c.lineTo(u, v);
                else c.moveTo(u, v);
            });
            c.stroke();
        }
    }
    c.fillStyle = 'rgba(239,221,177,.28)';
    for (let i = 0; i < 240; i++)
        c.fillRect((i * 443 + index * 29) % 254, (i * i * 11 + i * 31) % 144, i % 8 ? .56 : 2, .65);
    c.fillStyle = '#2c2924'; c.fillRect(0, 123, 256, 21);
    c.fillStyle = '#e0c89c'; c.font = 'bold 10px monospace';
    c.fillText(['КАНАЛЬНАЯ ДО ЭСТАКАДЫ', 'КРАН К–14 · 1986', 'СЕВЕРНАЯ ТЭЦ · 1995'][index], 8, 137);
    return texture(canvas);
}

function cinemaScene(root) {
    const yard = fixture(root, -26.7, 16.84, 'Дворовой экран дома № 23');
    const rig = new Batches(yard);
    for (const side of [-1, 1])
        rig.box(side * 2.76, 1.41, 0, .085, 2.82, .10, '#59676b');
    rig.beam(-2.83, 2.75, 0, 2.83, 2.75, 0, .029, '#8c8372');
    for (const side of [-1, 1]) {
        rig.box(side * 1.55, .37, 3.49, 1.69, .11, .46, '#70685a');
        for (const x of [.82, 2.23])
            rig.box(side * x, .19, 3.49, .11, .36, .44, '#4d585b');
        rig.box(side * .58, .39, 4.95, .47, .10, .44, '#7e7165');
    }
    rig.box(0, .59, 5.02, .65, .09, .44, '#716b5e');
    rig.box(0, .72, 5.02, .37, .18, .25, '#343c3b');
    rig.flush();
    const cloth = new T.Mesh(new T.PlaneGeometry(5.10, 2.30), new T.MeshLambertMaterial({ color: '#cbcbba', side: T.DoubleSide }));
    cloth.position.set(0, 1.58, .025);
    yard.add(cloth);
    const material = new T.MeshBasicMaterial({ color: '#f1d8a8', side: T.DoubleSide, toneMapped: false });
    const film = new T.Mesh(new T.PlaneGeometry(4.79, 2.06), material);
    film.name = 'Дворовая кинохроника';
    film.position.set(0, 1.56, .031);
    film.visible = false;
    yard.add(film);
    const projection = new Batch();
    projection.ball(0, .73, 4.877, .061, .055, .035, '#fff0bb');
    const lens = projection.mesh(lit);
    lens.visible = false;
    yard.add(lens);
    const beam = new Batch(), source = [0, .73, 4.876];
    const corners = [[-2.395, .53, .034], [2.395, .53, .034], [2.395, 2.59, .034], [-2.395, 2.59, .034]];
    for (let i = 0; i < corners.length; i++)
        beam.tri(source, corners[i], corners[(i + 1) % corners.length], '#edcc9b');
    const light = beam.mesh(new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, transparent: true, opacity: .043, depthWrite: false }));
    light.visible = false;
    yard.add(light);
    let projectedFrame = -1;
    const reels = [];
    const people = new T.Group(), person = cast(people);
    people.name = 'Зрители дворового кино';
    people.visible = false;
    root.add(people);
    return (c, close) => {
        const open = cinemaOpen(c.minutes);
        cloth.scale.y = open ? 1 : .13;
        cloth.position.y = open ? 1.58 : 2.63;
        film.visible = lens.visible = light.visible = open && close;
        people.visible = open && close;
        if (!people.visible)
            return;
        const frame = Math.floor((c.elapsed % 33) / 11);
        if (frame !== projectedFrame && typeof document !== 'undefined') {
            material.map = reels[frame] ??= filmTexture(frame);
            material.needsUpdate = true;
            projectedFrame = frame;
        }
        material.color.setScalar(.88 + .12 * Math.sin(c.elapsed * 43) ** 2);
        for (let i = 0; i < 4; i++) {
            person('Зритель кино ' + (i + 1), [1, 3, 11, 13][i], -26.7 + [-1.87, -1.20, 1.27, 1.86][i], 20.33,
                [-.20, -.12, .12, .22][i], 0, c.dt, { seated: 1, seatHeight: .43 });
        }
        person('Киномеханик', 7, -25.81, 21.56, .14, 0, c.dt, { glance: .12 * Math.sin(c.elapsed * .50) });
    };
}

function marketScene(root) {
    const yard = fixture(root, 35.0, 15.53, 'Задние ворота Спектра');
    const shell = new Batches(yard);
    shell.box(0, 1.25, .30, 3.07, 2.50, .18, '#5d6660');
    shell.box(0, 1.17, .199, 2.33, 2.34, .10, '#3c4746');
    for (const side of [-1, 1])
        shell.box(side * 1.66, .44, -.82, .11, .88, .12, '#53645f');
    shell.box(-.15, .50, -.86, 1.58, .10, .71, '#747363');
    shell.box(-.81, .25, -.86, .12, .49, .59, '#59635c');
    shell.box(.52, .25, -.86, .12, .49, .59, '#59635c');
    shell.flush();
    sign(yard, 'СПЕКТР', 'ПОГРУЗКА СО ДВОРА', 0, 2.18, .146, 2.56, .42, Math.PI);
    const closed = new T.Group(), shutters = new Batches(closed);
    shutters.box(0, 1.17, .137, 2.33, 2.32, .075, '#657269');
    for (let i = 0; i < 17; i++)
        shutters.box(0, .13 + i * .128, .083, 2.24, .022, .038, '#4a5955');
    shutters.flush();
    yard.add(closed);
    const exchange = new T.Group(), stock = new Batches(exchange);
    stock.lamp(.61, 2.42, .067, .43, .097, .16, '#f0bd7c');
    crate(stock, -.65, .682, -.81, .53, .41, '#77867d');
    crate(stock, .28, .666, -.91, .48, .42, '#9d7954');
    crate(stock, -1.78, .14, -.74, .48, .52, '#6e8285');
    crate(stock, 1.85, .14, -.49, .63, .48, '#746657');
    stock.flush();
    yard.add(exchange);
    const movingBox = new T.Group(), box = new Batches(movingBox);
    crate(box, 0, .14, 0, .48, .36, '#8b9c96'); box.flush();
    root.add(movingBox);
    const people = new T.Group(), person = cast(people);
    people.name = 'Ночная разгрузка рынка';
    people.visible = false;
    root.add(people);
    return (c, close) => {
        const open = marketOpen(c.minutes);
        closed.visible = !open;
        exchange.visible = open;
        people.visible = movingBox.visible = open && close;
        if (!people.visible)
            return;
        const time = c.elapsed % 18;
        const inbound = unit(time / 5), outbound = unit((time - 9) / 5);
        const handoff = time >= 5 && time < 9, walking = time > 9 && time < 14;
        const transfer = (time - 5) / 4, pose = handoff ? { handoff: transfer, handoffRole: 'resident' } : {};
        person('Поставщик хлеба и зелени', 8, mix(32.62, 34.06, inbound) - outbound * 1.36, 14.55,
            time < 9 ? -Math.PI / 2 : Math.PI / 2, time < 5 || walking ? .64 : 0, c.dt,
            { ...pose, carry: time < 5 ? 'crate' : undefined, glance: handoff ? -.38 : 0 });
        person('Приёмщица Спектра', 13, 35.43 + outbound * 1.22, 14.55 + outbound * .34,
            time < 9 ? Math.PI / 2 : -Math.PI / 2, walking ? .69 : 0, c.dt,
            { ...pose, handoff: handoff ? 1 - transfer : undefined, carry: time >= 9 ? 'crate' : undefined, glance: handoff ? .35 : 0 });
        movingBox.visible = handoff;
        const relay = unit((time - 5) / 3);
        movingBox.position.set(mix(34.42, 35.11, relay), .92 + Math.sin(Math.PI * relay) * .12, 14.62);
        movingBox.rotation.y = relay * .21;
    };
}

const iceColors = ['#a0c2cb', '#bdd9dd', '#799ba9', '#d1dfdf'];
function iceShape(id, material) {
    const core = new Batch(), detail = new Batch();
    const shape = (part, at, scale, shade, angle = 0) => part.add(stone, at, scale, iceColors[shade], [0, 0, angle]);
    if (id === 0) {
        shape(core, [0, 1.10, 0], [.36, .74, .40], 0, .24);
        shape(core, [.24, 1.66, 0], [.26, .28, .25], 1);
        for (const side of [-1, 1]) {
            shape(core, [side * .49, 1.28, .04], [.64, .21, .28], 2, side * .31);
            shape(detail, [side * 1.13, 1.51, .04], [.45, .13, .18], 1, side * .35);
        }
        shape(detail, [.49, 1.64, -.025], [.26, .093, .10], 3);
    } else if (id === 1) {
        core.box(0, 1.04, 0, 1.67, .70, .73, iceColors[0]);
        core.box(.39, 1.50, .04, .70, .44, .74, iceColors[1]);
        core.box(.39, 1.74, .05, .82, .13, .85, iceColors[3]);
        for (const side of [-1, 1])
            for (const x of [-.55, .14, .60])
                core.add(stone, [x, .70, .39 * side], [.22, .22, .08], iceColors[2]);
        detail.rod([-.54, 1.33, 0], [-.54, 1.75, 0], .16, iceColors[1]);
        detail.box(-.78, 1.13, .366, .24, .19, .065, iceColors[3]);
    } else {
        for (let i = 0; i < 7; i++) {
            const angle = i * Math.PI / 6;
            shape(core, [Math.cos(angle) * .83, .63 + Math.sin(angle) * 1.16, .04], [.27, .38, .28], i % 2, -angle);
        }
        shape(detail, [.60, 1.83, .04], [.19, .35, .17], 1, -.43);
        shape(detail, [-.58, 1.56, .04], [.18, .26, .18], 3, .67);
    }
    return { core: core.mesh(material), detail: detail.mesh(material) };
}

function iceScene(root) {
    const square = fixture(root, -114.2, 37.5, 'Ледовая площадь ДК Металлург');
    const edge = new Batches(square);
    for (const x of [-2.50, 0, 2.50]) {
        edge.box(x, .052, 0, 1.94, .10, 1.38, '#82969b');
        edge.box(x, .16, .07, 1.65, .17, 1.09, '#97aeb2');
    }
    edge.flush();
    sign(square, 'ЛЕДОВАЯ ПЛОЩАДЬ', 'ВЫГРУЗКА · РЕЗЬБА · ПОДСВЕТКА', 0, .25, .867, 3.1, .32);
    const blocks = new T.Group(), masonry = new Batches(blocks);
    for (let i = -1; i <= 1; i++) {
        masonry.box(i * 2.50, .64, 0, 1.27, .84, .95, iceColors[0]);
        const x = i * 2.50;
        masonry.box(x, 1.11, 0, 1.22, .10, .92, iceColors[1]);
        masonry.box(x + .35, .60, .482, .31, .67, .027, iceColors[2]);
        for (const side of [-1, 1])
            masonry.box(x + side * .71, .14, .03, .105, .18, 1.12, '#8e7d66');
    }
    masonry.flush();
    blocks.name = 'Ледяные блоки на поддонах';
    square.add(blocks);

    const piece = new T.Group(), ice = new Batches(piece);
    ice.box(0, .38, 0, .81, .71, .78, iceColors[0]);
    ice.box(0, .746, 0, .76, .038, .75, iceColors[1]);
    ice.flush();
    square.add(piece);
    let truck;
    const material = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide, emissive: '#82b2c8', emissiveIntensity: 0 });
    const figures = [-2.5, 0, 2.5].map((x, i) => {
        const { core, detail } = iceShape(i, material), figure = new T.Group();
        figure.position.x = x;
        figure.add(core, detail);
        square.add(figure);
        return { figure, detail };
    });
    const cut = new T.Group(), chips = new Batches(cut);
    for (let i = 0; i < 46; i++) {
        const x = Math.sin(i * 12.1) * 3.43, z = .77 + Math.cos(i * 14.15) * .58;
        chips.piece('stone', x, .045, z, .065 + (i % 4) * .032, .054, .098, iceColors[i % 4], i * .7);
    }
    chips.flush();
    square.add(cut);
    const lights = new T.Group(), lamp = new Batches(lights);
    for (const x of [-2.5, 0, 2.5])
        lamp.lamp(x, .26, .57, 1.59, .07, .07, '#b3e0e5');
    lamp.flush();
    square.add(lights);
    const people = new T.Group(), person = cast(people);
    people.name = 'Ледовые скульпторы';
    people.visible = false;
    root.add(people);
    const tools = new Batch();
    tools.rod([0, -.26, -.033], [0, -.32, -.033], .025, '#835a3d');
    tools.rod([0, -.32, -.033], [0, -.42, -.033], .017, '#737d80');
    const chisel = tools.mesh();
    chisel.name = 'Резец ледовой скульптуры';
    return (c, close) => {
        const day = sculptureDay(c.calendarMinutes), unloading = day === 0, carving = day === 1;
        const evening = c.minutes >= 1080 || c.minutes < 345;
        const work = c.minutes >= 480 && c.minutes < 1140;
        blocks.visible = unloading || carving;
        blocks.scale.set(carving ? .73 : 1, carving ? .55 : 1, carving ? .83 : 1);
        piece.visible = close && work && unloading;
        people.visible = close && work && (unloading || carving);
        cut.visible = day >= 1;
        lights.visible = evening && day >= 1;
        material.emissiveIntensity = lights.visible ? .35 : 0;
        const thaw = unit((day - 2) * .21 + unit(((c.weather?.temperature ?? -2) + .50) / 5) * .30);
        figures.forEach(({ figure, detail }, index) => {
            figure.visible = day >= 2 || carving && index === 1;
            figure.scale.set(1 - thaw * .06, 1 - thaw * .23, 1 - thaw * .06);
            detail.visible = day >= 2 && thaw < .48 + index * .11;
        });
        if (!people.visible) {
            if (truck) truck.root.visible = false;
            return;
        }
        const maker = person('Мастер ледовой площади', 5, -114.18, carving ? 38.19 : 38.85, .05, 0, c.dt,
            { carry: unloading ? 'crate' : undefined, strike: carving ? (c.elapsed * .72) % 1 : 0, glance: Math.sin(c.elapsed * 1.8) * .28 });
        if (!chisel.parent)
            maker.getObjectByName('right-elbow').add(chisel);
        chisel.visible = carving;
        person('Помощница ледовой площади', 10, -116.57, 38.53, -.10, 0, c.dt, { anticipation: carving });
        if (unloading) {
            truck ??= createVehicle('pickup', '#8c6f54');
            if (!truck.root.parent) {
                truck.root.position.set(-118.4, groundHeight(-118.4, 38.65), 38.65);
                truck.root.rotation.y = Math.PI / 2;
                root.add(truck.root);
            }
            truck.root.visible = true;
            truck.update(c.dt, 0, 0, true, false, 0, { cameraDistance: distance(c, truck.root.position) });
            const t = unit((c.elapsed % 9) / 6);
            piece.position.set(mix(-3.45, -.60, t), 1.08 * (1 - t), mix(1.14, .76, t));
        } else if (truck) {
            truck.root.visible = false;
        }
    };
}

function createEvents(scene) {
    const root = new T.Group();
    root.name = 'События городской смены';
    scene?.add(root);
    const updates = [shiftScene(root), bakeryScene(root), cinemaScene(root), marketScene(root), iceScene(root)];
    const scenes = sites.map((site, i) => ({ ...site, act(c) {
        const active = [shiftStartAt(c.minutes) !== undefined, bakeryOpen(c.minutes), cinemaOpen(c.minutes), marketOpen(c.minutes)][i];
        if (i === 4) {
            const day = sculptureDay(c.calendarMinutes);
            const stage = day === 0 ? 'На поддонах лежат блоки, из кузова переносят новый лёд.' : day === 1
                ? 'Мастера вырезают первые силуэты. Под ногами лежит свежая крошка.' : day <= 3
                    ? 'На площади уже стоят чайка, вагон и ледяная арка. Подсветку включают после 18:00.'
                    : 'Края тают и осыпаются. Арка стала приземистее, у чайки сколоты кончики крыльев.';
            c.show(site.label, stage);
            return;
        }
        const notes = [
            'Такси ждут в кармане. Рабочие пошли к окну столовой, пока закрывают сменный журнал.',
            'Рейс начинается после первой буханки, говорит водитель. Уборщица просит самую тёмную корку. Пёс ждёт на коротком поводке.',
            'На экране идут «Канальная до эстакады», «Стрела над портом» и «Две сестры». Свободные места остались по краям лавок.',
            'У ворот передают ящики с зеленью, рыбой и деталями. Утром их развезут по прилавкам Канальной.'
        ];
        if (active) {
            c.show(site.label, notes[i]);
            return;
        }
        const first = shiftStarts.find(time => time > c.minutes) ?? shiftStarts[0];
        const target = i === 0 ? first : site.waitAt;
        if (typeof c.waitUntil !== 'function') {
            c.show(site.label, site.note);
            return;
        }
        const time = `${String(Math.floor(target / 60)).padStart(2, '0')}:${String(target % 60).padStart(2, '0')}`;
        c.choose(site.note, [{ label: `Подождать до ${time}`, run: () => {
            if (c.waitUntil(target)) c.notify(`Сейчас ${time}. ${site.label}.`);
            else c.notify('Для ожидания остановитесь в спокойном месте.');
        } }, { label: 'Вернуться к прогулке', run: () => {} }]);
    } }));
    return { sites: scenes, update(c) {
        const landscape = c.focus ?? c;
        const outside = (c.zone ?? 'street') === 'street';
        root.visible = outside;
        if (!outside)
            return;
        updates.forEach((update, i) => update(c, distance(landscape, sites[i]) < 48));
    } };
}

module.exports = { createEvents };
