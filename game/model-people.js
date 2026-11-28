"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cabinAppearance = cabinAppearance;
exports.heroCabinAppearance = heroCabinAppearance;
exports.createPerson = createPerson;
const T = require("../engine/three.module.min.js");
const model_motion_js_1 = require("./model-motion.js");
const model_expression_js_1 = require("./model-expression.js");
const model_distance_js_1 = require("./model-distance.js");
const human_head_js_1 = require("./human-head.js");
const human_wardrobe_js_1 = require("./human-wardrobe.js");
const human_cloth_js_1 = require("./human-cloth.js");
const carry_crate_js_1 = require("./carry-crate.js");
const model_geometry_js_1 = require("./model-geometry.js");
const { handGrip } = require('./human-extremities.js');
function makeWardrobe(role, variant) {
    const t = (0, human_wardrobe_js_1.garments)(role, variant);
    const head = (0, human_head_js_1.humanHead)(role, variant, t.look.skin, t.look.hair);
    head.position.set(0, -.034, -.008);
    let commuterPack;
    if (t.style.kit === 'transit' || t.style.backpack) {
        const pack = new model_geometry_js_1.Batch();
        const load = t.style.openKnit ? t.variant % 2 : 2;
        const thickness = [.048, .104, .142][load], front = .117 + thickness;
        const rows = load === 0 ? [[.109, .084, .119, .293, .355], [.137, .109, .106, .320, .377], [front, .098, .118, .286, .332]]
            : [[.103, .084, .114, .312, .354], [.138, .119, .097, .345, .390], [front - .025, .116, .103, .328, .374], [front, .093, .130, .280, .338]];
        (0, model_geometry_js_1.shell)(pack, rows, t.look.shade);
        if (load === 0) {
            pack.rod([-.084, .269, front], [.004, .233, front + .006], .004, t.look.main);
            pack.rod([.004, .233, front + .006], [.089, .256, front], .004, t.look.main);
        }
        else {
            pack.box(0, .207, front - .005, .181, .133, load === 2 ? .049 : .027, t.look.main);
            pack.box(0, .260, front + .017, .168, .011, .008, t.look.accent);
        }
        pack.rod([-.04, .376, .153], [.04, .376, .153], .009, t.look.shade, true);
        for (const side of [-1, 1]) {
            pack.rod([side * .084, .362, .159], [side * .105, .416, .037], .013, t.look.shade, true);
            pack.rod([side * .105, .416, .037], [side * .108, .409, -.119], .013, t.look.shade, true);
            pack.rod([side * .108, .409, -.119], [side * .104, .282, -.143], .014, t.look.shade, true);
            pack.rod([side * .104, .282, -.143], [side * .112, .127, -.101], .014, t.look.shade, true);
        }
        commuterPack = pack.mesh();
        if (t.style.backpack)
            commuterPack.position.z = .046;
        commuterPack.name = 'commuter-backpack';
    }
    return { ...t, skin: t.look.skin, head, commuterPack,
        far: (0, model_distance_js_1.distantAppearance)(role, variant) };
}
const wardrobe = new Map();
const workTools = new Map();
const clothProfiles = {
    wool: { shine: 7, reflection: .012, relief: .75 }, waxed: { shine: 38, reflection: .066, relief: .42 },
    quilted: { shine: 22, reflection: .033, relief: .59 }, windbreaker: { shine: 27, reflection: .039, relief: .47 }
};
const workCotton = { shine: 12, reflection: .019, relief: .65 };
function roleTool(role) {
    if (role !== 'dispatcher' && role !== 'mechanic' && role !== 'vendor')
        return undefined;
    let item = workTools.get(role);
    if (!item) {
        const pieces = new model_geometry_js_1.Batch();
        if (role === 'dispatcher') {
            pieces.box(0, 0, 0, .152, .194, .023, '#4d5e62');
            pieces.box(0, .005, .013, .138, .169, .005, '#dbd6b9');
            pieces.box(0,.087,.018,.079,.018,.006,'#818b84');
            for (let row = 0; row < 4; row++)
                pieces.box(-.011, .052 - row * .028, .017, .072 - .008 * (row % 2), .004, .002, row === 0 ? '#706958' : '#989688');
            pieces.box(0, -.082, .015, .035, .006, .006, '#9ba991');
            pieces.add(model_geometry_js_1.ring, [.092, -.059, -.010], [.026, .026, .024], '#acaa8f');
            for (const x of [.088, .106])
                pieces.box(x, -.089, -.009, .014, .047, .004, '#b6aa83', [0, 0, .14]);
        }
        else if (role === 'mechanic') {
            pieces.box(0, 0, 0, .067, .127, .040, '#796148');
            pieces.box(0, .052, 0, .088, .068, .052, '#a98254');
            pieces.box(0, .054, .027, .055, .029, .006, '#688d83');
            pieces.box(.006, .009, .023, .035, .014, .006, '#453c36');
        }
        else {
            pieces.box(0, 0, 0, .081, .049, .010, '#365953');
            pieces.box(.014, -.001, .006, .039, .027, .006, '#29393c');
            pieces.box(.014, -.001, .010, .022, .014, .006, '#56666a');
            for (const x of [-.029, -.020, -.011])
                pieces.box(x, .008, .007, .004, .015, .003, '#bfa979');
            for (const y of [-.014, .014])
                pieces.box(.020, y, .007, .048, .003, .003, '#8da68c');
            pieces.box(-.029, -.009, .009, .016, .011, .006, '#775344');
        }
        item = pieces.mesh();
        workTools.set(role, item);
    }
    const tool = item.clone();
    tool.visible = false;
    tool.name = role === 'dispatcher' ? 'dispatch-clipboard' : role === 'mechanic' ? 'garage-diagnostic-reader' : 'inna-calibration-board';
    return tool;
}
let ragTemplate;
function greaseRag() {
    if (!ragTemplate) {
        const rag = new model_geometry_js_1.Batch();
        const a = [-.038, .021, -.017], b = [.040, .014, -.021], c = [.026, -.045, .012], d = [-.029, -.047, .009];
        rag.quad([...a], [...b], [...c], [...d], '#af9a76', [0, 0, -1]);
        rag.quad([...b], [.052, -.037, .003], [.023, -.064, .018], [...c], '#796a54', [0, 0, -1]);
        rag.quad([...a], [-.009, .014, -.027], [.004, -.035, -.024], [...d], '#c9b18c', [0, 0, -1]);
        rag.rod([-.031, -.043, .007], [.024, -.045, .008], .002, '#9d835f');
        ragTemplate = rag.mesh();
        ragTemplate.name = 'mechanic-cleaning-cloth';
        ragTemplate.visible = false;
        const cloth = ragTemplate.material.clone();
        cloth.side = T.DoubleSide;
        ragTemplate.material = cloth;
    }
    return ragTemplate.clone();
}
function cabinAppearance(role, variant = 0) {
    const n = role === 'resident' ? Math.abs(variant) % 15 : 0, key = role + ':' + n;
    let result = wardrobe.get(key);
    if (!result) {
        result = makeWardrobe(role, n);
        wardrobe.set(key, result);
    }
    return result;
}
function heroCabinAppearance() { return cabinAppearance('hero'); }
class PersonLOD extends T.LOD {
    update(camera) {
        super.update(camera);
        if (this.levels[1].object.visible)
            this.prepareFarPose();
    }
}
function createPerson(role = 'resident', variant = 0) {
    const t = cabinAppearance(role, variant);
    const root = new T.Group(), lod = new PersonLOD(), near = new T.Group(), pelvis = new T.Group(), spine = new T.Group(), neck = new T.Group();
    const far = t.far.rest.clone(), torso = t.torso.clone(), seat = t.seat.clone(), hem = t.tail.clone(), strap = t.strap?.clone();
    const commuterPack = t.commuterPack?.clone();
    if (commuterPack)
        torso.add(commuterPack);
    if (t.reflectors)
        torso.add(t.reflectors.clone());
    const bag = torso.getObjectByName('courier-canvas-bag') ?? commuterPack;
    root.name = role;
    pelvis.name = 'pelvis';
    spine.name = 'spine';
    neck.name = 'neck';
    root.add(lod);
    lod.addLevel(near, 0);
    lod.addLevel(far, role === 'hero' ? 55 : 24, .12);
    far.visible = false;
    near.add(pelvis);
    pelvis.position.y = .915;
    pelvis.add(seat, spine);
    spine.add(torso, neck);
    neck.position.y = .558;
    neck.add(t.head.clone());
    const face = (0, model_expression_js_1.expression)(role, t.skin, neck, variant);
    hem.name = 'coat-tail';
    hem.position.y = .008;
    spine.add(hem);
    if (strap) {
        strap.name = 'shoulder-belt';
        strap.position.set(0, .39, 0);
        spine.add(strap);
    }
    const props = { parcel: t.goods.clone(), tape: t.tape.clone(), cup: t.cup.clone(), crate: (0, carry_crate_js_1.createCarryCrate)() };
    for (const [name, prop] of Object.entries(props)) {
        prop.name = 'carried-' + name;
        prop.visible = false;
        spine.add(prop);
    }
    const tool = roleTool(role);
    if (tool)
        spine.add(tool);
    const cloth = role === 'mechanic' ? greaseRag() : undefined;
    if (cloth)
        spine.add(cloth);
    const clothes = [torso, hem], bases = [t.torso.geometry, t.tail.geometry];
    const clothMaterial = torso.material.clone();
    const profile = clothProfiles[t.cut] ?? workCotton;
    clothMaterial.normalScale.setScalar(profile.relief);
    let coatIndex = 0, wet = -1;
    const shoulders = [], elbows = [], hips = [], knees = [], ankles = [], hands = [], frost = [];
    const flap = t.flap?.clone() ?? null, parcel = role === 'hero' || role === 'vendor' || role === 'dispatcher' ? t.parcel.clone() : null;
    if (flap) {
        flap.name = 'satchel-flap';
        spine.add(flap);
    }
    if (parcel) {
        parcel.name = 'switch-controller';
        parcel.visible = false;
        near.add(parcel);
    }
    const bends = [];
    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1, prefix = i === 0 ? 'left' : 'right';
        const shoulder = new T.Group(), elbow = new T.Group(), hip = new T.Group(), knee = new T.Group(), ankle = new T.Group();
        shoulder.name = prefix + '-shoulder';
        elbow.name = prefix + '-elbow';
        hip.name = prefix + '-hip';
        knee.name = prefix + '-knee';
        ankle.name = prefix + '-ankle';
        const upper = t.aUpper[i].clone(), forearm = t.aLower[i].clone();
        spine.add(shoulder);
        shoulder.position.set(side * t.shoulderWidth, .420, 0);
        shoulder.add(upper, elbow);
        elbow.position.y = -.251;
        elbow.add(forearm);
        hands.push(forearm.getObjectByName('winter-glove'));
        pelvis.add(hip);
        hip.position.set(side * t.hipWidth, .006, 0);
        hip.rotation.order = 'ZXY';
        hip.add(t.lUpper[i].clone(), knee);
        knee.position.y = -.41;
        knee.add(t.lLower[i].clone(), ankle);
        ankle.position.y = -.425;
        const boot = t.feet[i].clone();
        boot.name = prefix + '-boot';
        boot.position.y = -.09;
        ankle.add(boot);
        frost.push(boot.getObjectByName('snow-packed-sole'));
        const sleeve = (0, human_cloth_js_1.attachBend)(t.armBends[i], shoulder, elbow), denim = (0, human_cloth_js_1.attachBend)(t.legBends[i], hip, knee);
        bends.push((0, human_cloth_js_1.fitShoulder)(upper, spine, shoulder, side * t.shoulderWidth), sleeve.update, denim.update);
        clothes.push(upper, forearm, sleeve.mesh);
        bases.push(t.aUpper[i].geometry, t.aLower[i].geometry, t.armBends[i].geometry);
        shoulders.push(shoulder);
        elbows.push(elbow);
        hips.push(hip);
        knees.push(knee);
        ankles.push(ankle);
    }
    const waist = (0, human_cloth_js_1.fitWaist)(torso, spine, t.cut);
    bends.push((0, human_cloth_js_1.drapeCoat)(hem, hips, spine, t.lUpper));
    root.scale.setScalar(t.scale);
    for (const m of clothes)
        m.material = clothMaterial;
    function fabric(coat, moisture) {
        if (role === 'hero' && coat !== coatIndex) {
            clothes.forEach((m, i) => (0, human_cloth_js_1.paintCloth)(m, bases[i], coat));
            coatIndex = coat;
        }
        if (Math.abs(moisture - wet) > .01) {
            wet = moisture;
            clothMaterial.color.setRGB(1 - wet * .29, 1 - wet * .24, 1 - wet * .18);
            clothMaterial.shininess = profile.shine + wet * 13;
            clothMaterial.specular.setScalar(profile.reflection + wet * .019);
        }
    }
    return (0, model_motion_js_1.animatePerson)(role, variant, { root, lod, near, far, face, hem, strap, bag, tool, cloth, props, fabric, style: t.style, farPose: t.far.rigAnimator({ pelvis, spine, neck, shoulders, elbows, hips, knees, ankles }), pelvis, spine, neck, shoulders, elbows, hips, knees, ankles, flap, parcel,
        grip(i, mode) { handGrip(hands[i], mode); },
        snowBoots(visible) { for (const mesh of frost) mesh.visible = visible; },
        deform(seat) {
            waist(seat);
            for (const update of bends)
                update();
        } });
}
