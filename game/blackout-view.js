"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlackoutProps = createBlackoutProps;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const blackout_js_1 = require("./blackout.js");
function createBlackoutProps(parent) {
    const group = new T.Group();
    group.name = 'Щит и генератор рынка';
    group.userData.dynamicScenery = true;
    parent.add(group);
    const hard = new world_batch_js_1.Batches(group), panels = new world_batch_js_1.Panels(group);
    const { x: px, z: pz } = blackout_js_1.blackoutProps.breaker;
    const py = (0, world_layout_js_1.groundHeight)(px, pz);
    const box = (x, y, z, w, h, d, c) => hard.box(px + x, py + y, pz + z, w, h, d, c);
    box(0, .42, 0, .15, .82, .16, '#4c5662');
    box(0, 1.21, 0, .58, .83, .40, '#727d75');
    box(0, 1.21, .20, .52, .73, .042, '#7b897e');
    box(.18, 1.17, .242, .054, .125, .035, '#2a3d44');
    box(-.214, 1.22, .23, .024, .675, .034, '#50645d');
    box(0, 1.64, 0, .64, .094, .47, '#a8b3ab');
    box(0, .78, 0, .54, .053, .38, '#48595c');
    for (const x of [-.162, -.048, .066])
        hard.beam(px + x, py + .83, pz - .04, px + x * .70, py + .12, pz + .03, .036, '#2f4248');
    const title = 'ЩИТ 17', sub = 'РЫНОК · ЛИНИЯ 07';
    panels.place(title, () => (0, world_textures_js_1.signTexture)(title, sub, '#f4d8a4', '#405652', .46 / .20, '17'), px, py + 1.39, pz + .225, .46, .20, 0);
    const { x: gx, z: gz } = blackout_js_1.blackoutProps.generator;
    const gy = (0, world_layout_js_1.groundHeight)(gx, gz);
    const body = (x, y, z, w, h, d, c) => hard.box(gx + x, gy + y, gz + z, w, h, d, c);
    for (const side of [-1, 1]) {
        body(side * .56, .075, 0, .14, .15, 1.16, '#415058');
        for (const z of [-.49, .49])
            body(side * .53, .40, z, .085, .69, .082, '#6c7779');
        hard.beam(gx + side * .53, gy + .79, gz - .51, gx + side * .53, gy + .79, gz + .52, .085, '#7f8c8e');
    }
    body(0, .294, 0, 1.11, .34, .81, '#35434a');
    body(-.19, .55, -.09, .65, .26, .62, '#8d7654');
    body(.37, .50, 0, .43, .34, .74, '#67766e');
    body(.35, .62, .421, .43, .111, .064, '#4a5359');
    body(0, .731, -.126, .93, .14, .51, '#a48156');
    hard.cyl(gx - .25, gy + .826, gz - .16, .127, .064, '#414b48');
    for (let i = 0; i < 6; i++)
        body(-.53 + i * .144, .432, .426, .10, .061, .038, '#24373b');
    hard.beam(gx + .41, gy + .55, gz - .126, gx + .55, gy + 1.12, gz - .41, .07, '#5f6a69');
    hard.beam(gx + .55, gy + 1.12, gz - .41, gx + .81, gy + 1.12, gz - .44, .088, '#485854');
    hard.beam(gx - .33, gy + .18, gz + .428, gx - .37, gy + .028, gz + .81, .040, '#272f37');
    hard.beam(gx - .37, gy + .028, gz + .81, gx - .93, gy + .026, gz + .97, .039, '#2c363b');
    const generatorTitle = 'ГЕНЕРАТОР', generatorDetail = 'АВАРИЙНЫЙ ПУСК';
    panels.place(generatorTitle, () => (0, world_textures_js_1.signTexture)(generatorTitle, generatorDetail, '#ead9aa', '#48544d', 4.1, '17'), gx - .17, gy + .64, gz + .329, .62, .15, 0);
    hard.flush();
    panels.flush();
    const led = (x, y, z) => {
        const model = new T.Mesh(new T.BoxGeometry(.084, .044, .016), new T.MeshBasicMaterial({ color: '#8de0bf', toneMapped: false }));
        model.position.set(x, y, z);
        group.add(model);
        return model.material;
    };
    const breaker = led(px - .08, py + 1.12, pz + .234), starter = led(gx + .405, gy + .639, gz + .459);
    let lastPhase, lastPulse = false;
    return (phase, t) => {
        const pulse = phase === 'search' && (t % 1.72) < .29;
        if (phase === lastPhase && pulse === lastPulse)
            return;
        lastPhase = phase;
        lastPulse = pulse;
        breaker.color.set(phase === 'normal' ? '#96e5bf' : '#cb7449');
        starter.color.set(phase === 'normal' ? '#526965' : pulse ? '#ffc187' : '#896549');
    };
}
