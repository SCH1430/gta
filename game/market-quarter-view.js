"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMarketQuarter = createMarketQuarter;
const T = require("../engine/three.module.min.js");
const model_people_js_1 = require("./model-people.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const steel = '#405865', rail = '#819696', edge = '#c19564', snow = '#bcc9cb', wall = '#887c67';
function createMarketQuarter(scene) {
    const structure = new T.Group(), workers = new T.Group();
    structure.name = 'Ремонтные ряды, переход «Спектр» и шлюзовая лестница';
    structure.userData.staticScenery = true;
    scene.add(structure, workers);
    const b = new world_batch_js_1.Batches(structure), signs = new world_batch_js_1.Panels(structure);
    const box = (s, color) => b.box(s.x, (s.bottom + s.top) * .5, s.z, s.w, s.top - s.bottom, s.d, color);
    market_quarter_layout_js_1.quarterTreads.forEach((step, i) => {
        box(step, i % 5 === 0 ? '#728482' : '#627578');
        const alongX = step.w < step.d;
        b.box(step.x, step.top + .004, step.z, step.w * (alongX ? .50 : .87), .012, step.d * (alongX ? .86 : .53), i % 4 === 0 ? '#9a9e8c' : '#798885');
        for (const side of [-1, 1]) {
            const x = step.x + (alongX ? 0 : step.w * .432 * side), z = step.z + (alongX ? step.d * .432 * side : 0);
            b.box(x, step.top + .015, z, alongX ? step.w * .77 : .046, .031, alongX ? .046 : step.d * .77, i % 6 === 0 ? edge : rail);
        }
    });
    for (const f of market_quarter_layout_js_1.quarterFlights) {
        const alongX = f.axis === 'x';
        const at = (s, v, h) => alongX ? [s, h, v] : [v, h, s];
        const steelBar = (s, h1, t, h2, v, diameter, color) => {
            const [x, y, z] = at(s, v, h1), [tx, ty, tz] = at(t, v, h2);
            b.beam(x, y, z, tx, ty, tz, diameter, color, true);
        };
        for (const side of [-1, 1]) {
            const v = f.side + side * f.width * .5;
            steelBar(f.start, 1.14, f.end, f.height + 1.14, v, .078, rail);
            steelBar(f.start, .53, f.end, f.height + .53, v, .040, steel);
            steelBar(f.start, -.09, f.end, f.height - .09, v, .13, steel);
            for (let i = 0; i <= f.steps; i += 3) {
                const progress = i / f.steps, s = f.start + (f.end - f.start) * progress, base = f.height * progress;
                steelBar(s, Math.max(0, base - .10), s, base + 1.12, v, .064, i % 9 === 0 ? '#648487' : steel);
            }
        }
    }
    market_quarter_layout_js_1.quarterDecks.forEach(s => box(s, steel));
    for (const s of market_quarter_layout_js_1.quarterGuards.slice(market_quarter_layout_js_1.quarterFlights.reduce((n, f) => n + 2 * f.steps, 0))) {
        b.box(s.x, s.top - .05, s.z, s.w, .09, s.d, rail);
        b.box(s.x, s.bottom + .35, s.z, s.w * .97, .048, s.d * .97, steel);
        const long = Math.max(s.w, s.d), count = Math.max(2, Math.ceil(long));
        for (let i = 0; i < count; i++) {
            const f = (i + .3) / count - .5;
            b.box(s.x + (s.w > s.d ? f * s.w : 0), (s.bottom + s.top) * .5, s.z + (s.w > s.d ? 0 : f * s.d), .071, s.top - s.bottom, .071, steel);
        }
    }
    for (const s of market_quarter_layout_js_1.quarterSupports) {
        box(s, steel);
        b.box(s.x, .18, s.z, s.w + .15, .36, s.d + .14, '#5e666a');
        b.box(s.x, s.top - .12, s.z, s.w + .14, .23, s.d + .15, '#6e8388');
        for (let i = 0; i < 4; i++)
            b.box(s.x, .8 + i * .16, s.z + s.d * .5 + .013, s.w * .81, .06, .026, i % 2 === 0 ? '#b8a276' : '#53666a');
    }
    const deck = market_quarter_layout_js_1.quarterDecks[0];
    for (let x = deck.x - deck.w * .48; x < deck.x + deck.w * .48; x += .34)
        b.box(x, deck.top + .009, deck.z, .30, .024, deck.d * .89, '#667b82');
    for (const sign of [-1, 1]) {
        b.box(deck.x, deck.top + .029, deck.z + sign * .86, deck.w - .28, .028, .09, '#b6a076');
        b.box(deck.x, deck.bottom - .085, deck.z + sign * .90, deck.w, .186, .18, steel);
        for (const x of [-.7, 3.6, 8.1, 12.1])
            b.lamp(x, deck.bottom - .025, deck.z + sign * .87, .22, .045, .12, '#dba973');
    }
    for (const s of market_quarter_layout_js_1.quarterWalls) {
        box(s, wall);
        for (let y = s.bottom + .12; y < s.top; y += .21)
            b.box(s.x, y, s.z, s.w + .018, .022, s.d + .016, '#6d7065');
        if (s.w > s.d) {
            b.box(s.x - .55, s.top - .62, s.z, s.w * .37, .57, s.d + .05, '#4d6d76');
            b.box(s.x - .55, s.top - .62, s.z, s.w * .32, .49, s.d + .067, '#789398');
        }
    }
    for (const s of market_quarter_layout_js_1.quarterRoofs) {
        box(s, steel);
        b.box(s.x, s.top + .033, s.z, s.w - .05, .07, s.d - .08, snow);
        b.lamp(s.x, s.bottom - .044, s.z, .20, .078, s.d * .74, '#e9bb83');
    }
    const board = market_quarter_layout_js_1.marketWalkway.listeningBoard;
    b.box(board.x + .3, 1.29, board.z - 1.34, 1.44, 1.87, .12, '#53646a');
    b.box(board.x + .3, 1.29, board.z - 1.262, 1.24, 1.58, .03, '#85816a');
    for (let i = 0; i < 6; i++)
        b.box(board.x - .05 + (i % 2) * .69, 1.62 - Math.floor(i / 2) * .39, board.z - 1.235, .48, .27, .015, ['#c3bbae', '#aeafa2', '#b5a388'][i % 3]);
    b.lamp(board.x + .30, 2.26, board.z - 1.256, 1.44, .05, .13, '#f3c282');
    b.box(board.x + .30, .28, board.z - 1.34, 1.48, .53, .18, steel);
    const rooms = market_quarter_layout_js_1.quarterWorkrooms.map((room, index) => {
        const { x, z, w, d, h, kind } = room, glow = kind === 'thermal' ? '#efbd85' : '#85c8c4', tint = kind === 'thermal' ? '#8f7367' : '#557b80';
        const south = z + d / 2, inner = new T.Group();
        inner.position.set(x, 0, z);
        workers.add(inner);
        b.box(x, h * .5, z - d * .5, w, h, .13, '#485c60');
        b.box(x, .08, z, w, .16, d, '#687774');
        b.box(x, h - .085, z, w + .12, .17, d + .18, steel);
        b.box(x, h + .035, z, w + .14, .072, d + .20, snow);
        for (const side of [-1, 1])
            b.box(x + side * w * .5, h * .5, z, .14, h, d + .09, tint);
        b.box(x, .45, south, w, .9, .18, tint);
        b.box(x, 2.88, south, w, .55, .18, tint);
        b.box(x, .972, south + .065, w, .14, .24, steel);
        for (const v of [-.47, -.29, .13, .46]) {
            b.box(x + w * v, 1.82, south, .12, 1.85, .151, steel);
            b.box(x + w * v, 1.82, south + .071, .035, 1.78, .028, rail);
        }
        b.lamp(x, 2.68, south - .28, w * .84, .06, .045, glow);
        b.lamp(x, h - .20, z - .43, w * .62, .055, .08, glow);
        for (let i = 0; i < 7; i++) {
            const dx = (i - 3) * .51;
            b.box(x + w * .10 + dx, 1.97, z - d * .5 + .19, .34, .37, .21, i % 3 === 0 ? '#84948e' : '#697d76');
            b.box(x + w * .10 + dx, 1.84, z - d * .5 + .335, .28, .049, .046, steel);
        }
        for (const [height, width] of [[1.08, .70], [.65, .48], [1.75, .46]]) {
            b.box(x + w * .24, height, z - .55, w * width, .097, .78, '#877963');
            b.box(x + w * .24, height - .034, z - .157, w * width, .10, .052, '#5c6864');
        }
        b.box(x - 1.45, 1.12, south - .45, 1.68, .125, .61, '#a89778');
        b.box(x - 1.85, .57, south - .47, .13, 1.13, .17, steel);
        b.box(x - .80, .57, south - .47, .13, 1.13, .17, steel);
        for (let i = 0; i < 4; i++) {
            const xx = x - 1.93 + i * .24;
            b.box(xx, 1.24, south - .59, .174, .11, .29, ['#516364', '#848273', '#816f63', '#6a7871'][i]);
            b.lamp(xx + .02, 1.262, south - .427, .074, .033, .021, glow);
        }
        const noticeX = x + w * .12;
        signs.place('atelier-' + index, () => (0, world_textures_js_1.signTexture)(room.label, room.caption, glow, '#394e50', 6), noticeX, 2.92, south + .102, w * .76, .46, 0);
        return { room, south, inner, person: undefined };
    });
    for (const [i, s] of market_quarter_layout_js_1.quarterWaymarks.entries()) {
        const w = i === 1 ? 3.4 : 2.25, d = .10, h = i === 1 ? .63 : .61;
        b.box(s.x, s.y, s.z, w + .10, h + .08, d, steel, s.angle);
        if (i === 1 || i === 5)
            b.lamp(s.x, s.y + h * .64, s.z, w * .86, .065, .073, '#ebbc84', s.angle);
        else
            b.cyl(s.x, s.y * .43, s.z, .084, s.y * .85, steel);
        signs.place('quarter-sign-' + i, () => (0, world_textures_js_1.signTexture)(s.label, s.sub, i === 2 ? '#a6dfd9' : '#f2d2a2', '#375461', w / h), s.x + Math.sin(s.angle) * .061, s.y, s.z + Math.cos(s.angle) * .061, w, h, s.angle);
    }
    for (const sign of [-1, 1]) {
        const x = market_quarter_layout_js_1.marketCanalChase.inside.x + sign * .67;
        b.lamp(x, market_quarter_layout_js_1.quarterDecks[1].top + .063, market_quarter_layout_js_1.marketCanalChase.inside.z, .09, .054, 3.35, '#d0a975');
    }
    b.flush();
    signs.flush();
    let updated = -1;
    return (elapsed, focus) => {
        const dt = Math.min(.1, Math.max(0, elapsed - updated));
        updated = elapsed;
        for (const room of rooms) {
            const near = !!focus && Math.hypot(focus.x - room.room.x, focus.z - room.room.z) < 28;
            room.inner.visible = near;
            if (!near)
                continue;
            if (!room.person) {
                room.person = (0, model_people_js_1.createPerson)('resident', room.room.kind === 'thermal' ? 4 : 10);
                room.person.root.name = 'Работник виден в окне ' + room.room.label;
                room.inner.add(room.person.root);
            }
            const slide = Math.sin(elapsed * .67 + (room.room.kind === 'thermal' ? 0 : 1.3));
            room.person.root.position.set(-.91 + .24 * slide, .13, .36);
            room.person.root.rotation.y = -.40 + .54 * slide;
            room.person.update(dt, Math.abs(Math.cos(elapsed * .67)) * .16, false, {
                carry: 'parcel', glance: .44 * Math.sin(elapsed * .4), nod: .26 * (1 + Math.sin(elapsed * 1.55)), wetness: 0
            });
        }
    };
}
