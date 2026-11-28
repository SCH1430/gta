"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExploration = createExploration;
const THREE = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const city_clock_js_1 = require("./city-clock.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const city_street_life_view_js_1 = require("./city-street-life-view.js");
const market_quarter_view_js_1 = require("./market-quarter-view.js");
function dial() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#394948';
    g.fillRect(0, 0, 256, 256);
    g.translate(128, 128);
    g.fillStyle = '#eeddb3';
    g.beginPath();
    g.arc(0, 0, 118, 0, 2 * Math.PI);
    g.fill();
    g.fillStyle = '#3f4d4a';
    for (let n = 0; n < 60; n++) {
        g.save();
        g.rotate(n * Math.PI / 30);
        g.fillRect(n % 5 === 0 ? -2.4 : -1, -111, n % 5 === 0 ? 4.8 : 2, n % 5 === 0 ? 11 : 4);
        g.restore();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 23px K77Display';
    for (let n = 1; n <= 12; n++)
        g.fillText(String(n), Math.sin(n * Math.PI / 6) * 87, -Math.cos(n * Math.PI / 6) * 87);
    g.font = 'bold 12px K77Body';
    g.fillText('ТЭЦ 08', 0, 48);
    return (0, world_textures_js_1.texture)(c);
}
const unit = new THREE.BoxGeometry(1, 1, 1);
function bar(parent, x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color }));
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
}
function createExploration(scene) {
    const updateCity = (0, city_street_life_view_js_1.createCityStreetLife)(scene);
    const updateQuarter = (0, market_quarter_view_js_1.createMarketQuarter)(scene);
    const fixed = new THREE.Group(), moving = new THREE.Group();
    fixed.name = 'Адреса и находки Канального района';
    fixed.userData.staticScenery = true;
    scene.add(fixed, moving);
    const b = new world_batch_js_1.Batches(fixed), p = new world_batch_js_1.Panels(fixed);
    function sign(s, sub, x, y, z, w, h, a = 0, bg = '#405555', ink = '#f6dfae') {
        p.place('explore' + s + sub, () => (0, world_textures_js_1.signTexture)(s, sub, ink, bg, w / h), x, y, z, w, h, a);
    }
    for (const a of world_layout_js_1.apartments) {
        const addr = a.z > 40 ? 'ШЛЮЗОВАЯ НАБЕРЕЖНАЯ' : a.z < -49 ? 'ДЕПОВСКАЯ' : a.x > 50 ? 'ПОРТОВАЯ' : a.x < -54 ? 'УЛИЦА МАСТЕРОВ' : 'КАНАЛЬНАЯ';
        sign(addr, String(a.id), a.x + a.w * .35, 2.75, a.z + a.d / 2 + .11, 1.32, .65, 0, '#324d59');
    }
    for (const r of world_expansion_layout_js_1.expansionRoads) {
        const vertical = r.x1 === r.x2;
        const near = world_expansion_layout_js_1.expansionBuildings.filter(h => h.kind === 'brick' || h.kind === 'warehouse' || h.kind === 'dock').map(h => ({ h, dist: vertical ? Math.abs(r.x1 - h.x) : Math.abs(r.z1 - h.z) })).sort((a, b) => a.dist - b.dist);
        for (let i = 0; i < Math.min(2, near.length); i++) {
            const h = near[i].h, side = vertical ? Math.sign(r.x1 - h.x) : Math.sign(r.z1 - h.z), angle = vertical ? side * Math.PI / 2 : side > 0 ? 0 : Math.PI;
            sign(r.name.toLocaleUpperCase('ru'), String(2 + i * 2), h.x + (vertical ? side * (h.w / 2 + .17) : 0), 2.47 + i * .62, h.z + (vertical ? 0 : side * (h.d / 2 + .17)), 2.55, .63, angle, '#385769');
        }
    }
    sign('ПРАЧЕЧНАЯ', 'ПРОХОД НА УЛ. МАСТЕРОВ  ‹', -40.16, 1.92, 14.11, 1.22, .49, -Math.PI / 2, '#725d48');
    sign('ДВОР 23', 'ПРОХОД  ›', -40.16, 1.78, 6.13, 1.1, .42, -Math.PI / 2, '#59645c');
    for (const [x, z, name, sub] of [[28, 15.90, 'МАСТЕРСКАЯ', 'ВХОД СО ДВОРА'], [11.1, -35.82, 'ДИСПЕТЧЕРСКАЯ', 'СЛУЖЕБНЫЙ ВХОД']]) {
        b.box(x, 1.07, z, 1.24, 2.14, .14, '#57716e');
        b.box(x, 1.51, z - .085, .77, .70, .045, '#94a7a1');
        b.box(x + .47, .96, z - .103, .12, .038, .045, '#c7bc98');
        b.lamp(x, 2.35, z - .090, .89, .046, .16, '#ffdd9c');
        sign(name, sub, x, 2.13, z - .11, 1.44, .32, Math.PI);
    }
    b.box(-38.2, .93, 15.72, 1.13, 1.66, .39, '#596d66');
    b.box(-38.2, 1.05, 15.928, .91, 1.09, .032, '#263d41');
    for (const y of [.50, 1.03, 1.59])
        b.box(-38.2, y, 15.99, .92, .055, .24, '#a29b77');
    for (let n = 0; n < 5; n++)
        b.box(-38.55 + n * .099, .69, 15.997, .063, .30 + n % 3 * .04, .13, ['#a38064', '#687b79', '#a09a75'][n % 3]);
    sign('ОБМЕН', 'БЕРИТЕ, ЧТО НУЖНО', -38.20, 1.84, 15.97, 1.00, .30);
    const radio = new THREE.Group();
    moving.add(radio);
    const rb = new world_batch_js_1.Batches(radio);
    rb.box(0, .13, 0, .39, .25, .17, '#966e50');
    rb.box(0, .13, .087, .34, .19, .014, '#b6a681');
    for (let i = 0; i < 7; i++)
        rb.box(-.141 + i * .027, .12, .098, .010, .14, .009, '#5c5951');
    rb.lamp(.091, .151, .1, .10, .030, .012, '#f1c683');
    rb.beam(.12, .23, 0, .25, .61, 0, .012, '#afb4aa');
    rb.flush();
    b.box(-115, -.49, 72.8, .80, .44, .52, '#607c79');
    b.box(-115, -.256, 72.8, .84, .055, .55, '#8c9688');
    for (const x of [-115.26, -114.74])
        b.box(x, -.43, 72.8, .058, .40, .55, '#aab1a0');
    b.beam(-115, -.21, 72.8, -114.65, .08, 72.67, .022, '#c5b48a');
    const gauge = exploration_layout_js_1.bankFinds[1];
    b.cyl(gauge.x, .27, gauge.z, .21, 1.91, '#9b9683');
    for (let i = 0; i < 10; i++)
        b.box(gauge.x, -.53 + i * .157, gauge.z + .128, i % 3 === 0 ? .20 : .11, .032, .022, '#6b443a');
    sign('МАЙ 1999', 'ПАВОДОК', gauge.x, .90, gauge.z + .14, .41, .24);
    b.piece('round', 35.5, -.58, 70, 1.21, .23, 1.21, '#525e63');
    b.piece('round', 35.5, -.448, 70, 1.08, .049, 1.08, '#758383');
    for (let i = -2; i <= 2; i++)
        b.box(35.5, -.418, 70 + i * .107, .73, .013, .031, '#46565c');
    b.beam(35.22, -.38, 70, 35.78, -.38, 70, .047, '#9d9c85');
    const cx = -25, cz = -94, cy = 27.26;
    b.box(cx, cy, cz, 3.55, 4.00, 3.55, '#526366');
    b.box(cx, cy + 2.05, cz, 4.0, .23, 4.0, '#b3bab3');
    const arms = [];
    for (let n = 0; n < 4; n++) {
        const a = n * Math.PI / 2, x = cx + Math.sin(a) * 1.81, z = cz + Math.cos(a) * 1.81;
        p.place('clock-dial', dial, x, cy, z, 3.24, 3.24, a);
        const pivot = new THREE.Group();
        pivot.position.set(x + Math.sin(a) * .04, cy, z + Math.cos(a) * .04);
        pivot.rotation.y = a;
        moving.add(pivot);
        const h = new THREE.Group(), m = new THREE.Group();
        pivot.add(h, m);
        bar(h, 0, .38, 0, .114, .97, .035, '#354346');
        bar(m, 0, .53, .035, .070, 1.28, .03, '#77513c');
        arms.push({ h, m });
    }
    const tables = new THREE.Group();
    moving.add(tables);
    const tb = new world_batch_js_1.Batches(tables);
    for (const t of exploration_layout_js_1.marketTables) {
        tb.box(t.x, .84, t.z, t.w, .095, t.d, '#9b987e');
        for (const s of [-1, 1]) {
            tb.beam(t.x - .34, .06, t.z + s * .73, t.x + .34, .82, t.z + s * .73, .042, '#839291');
            tb.beam(t.x + .34, .06, t.z + s * .73, t.x - .34, .82, t.z + s * .73, .042, '#839291');
        }
        for (let i = 0; i < 3; i++) {
            tb.box(t.x, .95, t.z - .57 + i * .52, .64, .19, .31, ['#6c7262', '#536263', '#786e60'][i]);
            tb.lamp(t.x, .955, t.z - .405 + i * .52, .31, .052, .018, '#b7bb8c');
        }
    }
    tb.flush();
    const shutters = [];
    for (const [x, w] of [[28, 6.30], [35.3, 5.30], [57, 7.28]]) {
        const s = new THREE.Group();
        s.position.set(x, 2.56, 20.43);
        moving.add(s);
        shutters.push(s);
        const sb = new world_batch_js_1.Batches(s);
        for (let k = 0; k < 13; k++)
            sb.box(0, -k * .095, 0, w, .094, .09, k % 3 === 2 ? '#74878b' : '#8e9d9c');
        sb.box(0, -1.22, 0, w + .02, .075, .13, '#586c72');
        sb.flush();
    }
    const pickup = new THREE.Group();
    pickup.name = 'Вечерняя выдача заказов у Инны';
    moving.add(pickup);
    const receiptBoard = new world_batch_js_1.Batches(pickup);
    receiptBoard.box(29.9, 1.72, 21.11, 1.45, .47, .09, '#574c3c');
    receiptBoard.lamp(29.9, 2.02, 21.25, .37, .06, .17, '#ffe2ae');
    receiptBoard.flush();
    const pickupLabels = new world_batch_js_1.Panels(pickup);
    pickupLabels.place('inna-night-pickup', () => (0, world_textures_js_1.signTexture)('ВЫДАЧА', 'ИННА · У ПРИЛАВКА', '#493f32', '#e3d6ab', 3.1),
        29.9, 1.72, 21.17, 1.39, .45, 0);
    pickupLabels.flush();
    pickup.visible = false;
    sign('ДЕЖУРНЫЙ КИОСК', 'СВЯЗЬ ПОСЛЕ ЗАКРЫТИЯ РЯДОВ', 68.7, 2.21, 20.35, 2.21, .42, 0, '#68523f');
    sign('ВЕЧЕРНИЙ ПРОХОД', 'ПОСЛЕ 18:00 · ЗА РЯДАМИ', 57.8, 1.79, 15.88, 2.91, .50, Math.PI);
    b.flush();
    p.flush();
    return { update(elapsed, home, _player, _tramTime, _cars, traffic, calendar = (0, city_clock_js_1.districtCalendarMinutes)(elapsed), pickupDue = false) {
            const minutes = calendar % 1440;
            updateCity(home.openedGates, elapsed, traffic, minutes, _cars, _player);
            updateQuarter(elapsed, _player);
            for (const { h, m } of arms) {
                h.rotation.z = -(minutes % 720) * Math.PI / 360;
                m.rotation.z = -(minutes % 60) * Math.PI / 30;
            }
            const open = (0, exploration_layout_js_1.marketLayouts)(elapsed, calendar).length > 0;
            tables.visible = open;
            pickup.visible = !open && pickupDue;
            for (const s of shutters)
                s.scale.y = open ? .075 : 1;
            radio.visible = home.loan === 'left';
            if (radio.visible)
                radio.position.set(-38.2, home.radioAtWindow(elapsed) ? 4.28 : 1.06, home.radioAtWindow(elapsed) ? 15.67 : 15.99);
        } };
}
