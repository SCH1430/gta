"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDoor = buildDoor;
exports.glazedMesh = glazedMesh;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const { glassEdge } = require("./model-car-exterior.js");
const glazing = model_geometry_js_1.glass.clone();
glazing.vertexColors = true;
glazing.color.setHex(0xffffff);
glazing.opacity = .44;
const glassBase = new T.Color('#81989a'), glassSky = new T.Color('#b9cdd2');
function glazedMesh(batch, low, high) {
    const mesh = batch.mesh(glazing), pos = mesh.geometry.attributes.position, ink = mesh.geometry.attributes.color;
    const shade = new T.Color();
    for (let i = 0; i < pos.count; i++) {
        const t = T.MathUtils.clamp((pos.getY(i) - low) / (high - low), 0, 1);
        shade.copy(glassBase).lerp(glassSky, t);
        ink.setXYZ(i, shade.r, shade.g, shade.b);
    }
    return mesh;
}
function buildDoor(kind, side, series = 0) {
    const s = vehicle_cabin_js_1.specs[kind], c = (0, vehicle_cabin_js_1.carCabin)(kind), van = kind === 'van';
    const paint = new model_geometry_js_1.Batch(), trim = new model_geometry_js_1.Batch(), panes = new model_geometry_js_1.Batch();
    const w = s.w, h = s.belt, H = s.roof, topW = (0, vehicle_cabin_js_1.roofWidth)(kind), sideW = w * .94;
    const z0 = c.hingeZ + .012, z1 = c.hingeZ + c.doorLength - .012;
    const lower = c.sillY + .055;
    const out = [side, 0, 0];
    const point = (x, y, z) => [side * x, y, z];
    const arch = s.r + (van ? .078 : .055), cuts = [z0, z1];
    const foot = z => {
        const d = Math.abs(z - s.fw);
        return d < arch ? Math.max(lower, s.r + Math.sqrt(arch * arch - d * d)) : lower;
    };
    for (let i = 0; i <= 10; i++) {
        const z = s.fw + arch * Math.cos(i * Math.PI / 10);
        if (z > z0 && z < z1)
            cuts.push(z);
    }
    cuts.sort((a, b) => a - b);
    const innerX = w - .095;
    const skin = z => {
        const base = foot(z);
        const t = (z - z0) / (z1 - z0), bow = Math.sin(Math.PI * t) * .011;
        return [point(w * .909, base, z), point(w * .984 + bow, base + (h - .14 - base) * .62, z),
            point(w * .995 + bow * .4, h - .143, z), point(sideW, h + .009, z)];
    };
    for (let j = 1; j < cuts.length; j++) {
        const a = cuts[j - 1], b = cuts[j], u = skin(a), v = skin(b);
        for (let i = 0; i < 3; i++)
            paint.quad(u[i], v[i], v[i + 1], u[i + 1], ['#d8dee0', '#f3f4f2', '#ffffff'][i], out);
        const floorA = point(innerX, foot(a) + .013, a), floorB = point(innerX, foot(b) + .013, b);
        trim.quad(u[0], v[0], floorB, floorA, '#38424c', [0, -1, 0]);
        trim.quad(floorA, floorB, point(innerX, h, b), point(innerX, h, a), '#353d43', [-side, 0, 0]);
    }
    for (const [z, sgn] of [[z0, -1], [z1, 1]]) {
        trim.quad(point(innerX, foot(z) + .013, z), point(w * .909, foot(z), z), point(sideW, h, z), point(innerX, h, z), '#536069', [0, 0, sgn]);
    }
    trim.box(side * (innerX - .045), h - .17, (z0 + z1) / 2, .018, .17, (z1 - z0) * .81, van ? '#526061' : '#596165');
    trim.box(side * (innerX - .071), h - .267, (z0 + z1) / 2 + .04, .091, .077, .49, '#242d35');
    if (['hatch','wagon','taxi','van'].includes(kind)) {
        trim.rod(point(w+.009,h-.23,z0+.031),point(w+.009,h-.23,z1-.025),.023,'#343736',true);
    }
    const pull = (0, vehicle_cabin_js_1.doorPullLocal)(kind, side);
    for (const dz of [-.092, .092]) {
        trim.rod([side * innerX, pull.y - .016, pull.z + dz], [pull.x, pull.y, pull.z + dz], .018, '#697877');
    }
    trim.rod([pull.x, pull.y, pull.z - .099], [pull.x, pull.y, pull.z + .099], .017, '#303d41');
    trim.box(side * (innerX - .120), h - .237, (z0 + z1) / 2 - .085, .018, .017, .13, '#889796');
    trim.box(side * (innerX - .045), lower + .077, z1 - .071, .014, .065, .062, '#bf5139');
    for (let i = 0; i < 5; i++)
        trim.box(side * (innerX - .047), foot(z0 + .19) + .056 + i * .018, z0 + .19, .016, .010, .15, '#232d35');
    trim.add(model_geometry_js_1.tube, point(innerX, lower + .16, z1), [.068, .03, .068], '#b6b5a9', [Math.PI / 2, 0, 0]);
    const latchY = h - .255, pocketBack = z1 - .124, pocketFront = Math.max(z0 + .24, z1 - .61);
    const pocketX = side * (innerX - .079), pocketY = Math.max(lower + .124, h - .352);
    const pocketD = pocketBack - pocketFront;
    trim.rod(point(innerX - .017, h + .006, z0 + .023), point(innerX - .017, h + .006, z1 - .023), .014, '#252e32', true);
    if (van) {
        for (const at of [z0 + .21, (z0 + z1) * .5, z1 - .18]) {
            const base = foot(at) + .035;
            trim.rod([side * (innerX - .024), base + .083, at], [side * (innerX - .024), h - .185, at], .018, '#737f75', true);
            trim.box(side * (innerX - .037), h - .22, at, .016, .038, .034, '#394947');
        }
    }
    else {
        trim.box(pocketX, pocketY - .063, (pocketBack + pocketFront) * .5, .135, .024, pocketD, '#263137');
        trim.box(pocketX - side * .056, pocketY, (pocketBack + pocketFront) * .5, .026, .119, pocketD, kind === 'taxi' ? '#786f60' : '#414e51');
        for (const at of [pocketBack, pocketFront])
            trim.box(pocketX, pocketY, at, .116, .116, .024, '#344246');
        trim.rod([pocketX - side * .062, pocketY + .058, pocketFront], [pocketX - side * .062, pocketY + .058, pocketBack], .008, '#727e77');
    }
    trim.box(side * (w * .933), latchY, z1 + .011, .106, .089, .036, '#41494b');
    trim.box(side * (w * .933), latchY, z1 + .032, .069, .039, .012, '#acb2a6');
    trim.box(side * (w * .935), latchY, z1 + .039, .026, .024, .010, '#343d41');
    for (const y of [lower + .15, h - .113]) {
        if (y > foot(z0) + .051) {
            trim.box(side * (innerX + .022), y, z0 - .011, .111, .065, .067, '#7f8983');
            trim.rod([side * innerX, y - .043, z0 - .036], [side * innerX, y + .043, z0 - .036], .016, '#4a5d5c');
        }
    }
    const lb = point(sideW, h + .028, z0), rb = point(sideW, h + .028, z1);
    const end = (0, vehicle_cabin_js_1.doorRoofEdge)(kind, z1 - .047);
    const lt = point(topW, H - .027, s.b + .061), rt = point(end.x, end.y - .027, z1 - .047);
    panes.quad(lb, rb, rt, lt, '#ffffff', out);
    trim.rod(lb, lt, .019, '#26333b', true);
    trim.rod(rt, rb, .022, '#293339', true);
    trim.rod(lb, rb, .020, '#202c33', true);
    trim.rod(lt, rt, .019, '#253139', true);
    paint.rod(lt, rt, .012, '#eef2f1', true);
    trim.rod(point(sideW, h + .027, z0 + .29), point(topW * .84 + sideW * .16, H - .119, s.b + .16), .010, '#415057', true);
    trim.rod(point(w + .005, lower + .015, z1), point(w + .005, h - .052, z1), .006, '#38454a', true);
    trim.box(side * (w + .021), c.handleY, c.handleZ, .034, .045, .173, '#222c33');
    trim.box(side * (w + .039), c.handleY + .010, c.handleZ - .006, .011, .017, .126, '#c3cbc4');
    const stripe = kind === 'patrol' ? '#304958' : kind === 'hatch' ? '#ecaa62' : kind === 'pickup' ? '#a8a182' : kind === 'coupe' ? '#d4aa75' : '#394750';
    trim.box(side * (w + .012), h - .249, (z0 + z1) / 2, .021, kind === 'patrol' ? .18 : kind === 'hatch' ? .046 : .032, z1 - z0 - .035, stripe);
    if (kind === 'taxi') {
        for (let i = 0; i < 8; i++)
            for (let row = 0; row < 2; row++)
                if ((i + row) % 2 === 0)
                    trim.box(side * (w + .019), h - .18 + row * .043, z0 + .37 + i * .043, .017, .042, .042, '#343e43');
    }
    if (kind === 'patrol') {
        trim.box(side * (w + .029), h - .245, (z0 + z1) / 2, .012, .114, .39, '#d6c89b');
        for (let i = 0; i < 3; i++)
            trim.box(side * (w + .037), h - .246, (z0 + z1) / 2 - .12 + i * .113, .012, .099, .026, '#44545a', [.4, 0, 0]);
    }
    const mirrorSkin = new model_geometry_js_1.Batch(), mirrorTrim = new model_geometry_js_1.Batch(), mx = side * sideW, my = h + .03, mz = z0 + .11;
    const late = kind === 'hatch' && series, early = kind === 'hatch' && !series;
    const mirrorX = side * (w + (van ? .23 : early ? .106 : .131) - sideW);
    const mirrorY = van ? .23 : late ? .145 : .11, mirrorH = van ? .32 : late ? .121 : .127;
    mirrorTrim.rod([0, 0, 0], [mirrorX, mirrorY - .02, .05], van ? .032 : .027, '#26333b');
    if (van)
        mirrorTrim.rod([0, .39, .03], [mirrorX, mirrorY + .087, .05], .023, '#26333b');
    if (late) {
        mirrorSkin.ball(mirrorX, mirrorY, .059, .111, .064, .111, '#ffffff');
        mirrorTrim.box(mirrorX, mirrorY, .139, .184, mirrorH - .029, .017, '#354349');
        mirrorTrim.ball(mirrorX, mirrorY, .152, .088, .047, .012, '#acc4c7');
    }
    else {
        const width = early ? .149 : .199, z = early ? .130 : .155;
        (early ? mirrorTrim : mirrorSkin).box(mirrorX, mirrorY, .056, width, mirrorH, early ? .13 : .19, early ? '#31454c' : '#ffffff');
        mirrorTrim.box(mirrorX, mirrorY, z, width - .031, mirrorH - .037, .014, '#a2bac1');
    }
    const mirrorBody = mirrorSkin.mesh(), mirrorFrame = mirrorTrim.mesh();
    const hingeX = side * (w - vehicle_cabin_js_1.doorHingeInset), hingeZ = c.hingeZ;
    const external = paint.mesh(), surrounding = trim.mesh(), window = glazedMesh(panes, h, H);
    window.name = 'side-window';
    window.add(glassEdge([lb, rb, rt, lt], side));
    for (const m of [external, surrounding, window])
        m.position.set(-hingeX, 0, -hingeZ);
    return {
        create(coat) {
            const pivot = new T.Group();
            pivot.name = side < 0 ? 'driver-door' : 'passenger-door';
            pivot.position.set(hingeX, 0, hingeZ);
            const skin = external.clone();
            skin.material = coat;
            const mirror = new T.Group();
            mirror.name = 'folding-mirror';
            mirror.position.set(mx - hingeX, my, mz - hingeZ);
            const cover = mirrorBody.clone();
            cover.material = coat;
            if (!early)
                mirror.add(cover);
            mirror.add(mirrorFrame.clone());
            pivot.add(skin, surrounding.clone(), window.clone(), mirror);
            return pivot;
        }
    };
}
