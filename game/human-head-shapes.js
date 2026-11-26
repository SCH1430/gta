"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = exports.earsFor = exports.faceVariant = exports.headU = void 0;
exports.identity = identity;
exports.headScale = headScale;
exports.faceInk = faceInk;
exports.skull = skull;
exports.faceTheta = faceTheta;
exports.eyesFor = eyesFor;
exports.facialGeometry = facialGeometry;
exports.featureGeometry = featureGeometry;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const headU = (theta) => .5 + Math.sign(theta) * (Math.abs(theta) <= 1 ? .248 * Math.abs(theta) : .248 + .252 * (Math.abs(theta) - 1) / (Math.PI - 1));
exports.headU = headU;
const residentPortraits = [0, 3, 0, 1, 2, 1, 2, 3, 0, 3, 0, 1, 2, 1, 0];
function identity(role, variant) {
    return role === 'hero' || role === 'courier' ? 0 : role === 'vendor' ? 1 : role === 'dispatcher' ? 2 : role === 'mechanic' ? 3 : residentPortraits[Math.abs(variant) % residentPortraits.length];
}
const principals = [
    { jaw: .106, cheek: -.003, temple: -.030, chin: .0052, nose: .0032, nostrils: .0003, dome: -.0018, eye: .0324, tilt: .0007 },
    { jaw: -.131, cheek: .092, temple: .016, chin: -.0040, nose: -.0028, nostrils: -.0011, dome: .004, eye: .0314, tilt: .0015 },
    { jaw: .058, cheek: -.072, temple: -.030, chin: .0045, nose: .0081, nostrils: .0009, dome: -.004, eye: .0314, tilt: -.0010 },
    { jaw: .152, cheek: .044, temple: .030, chin: -.0010, nose: -.0009, nostrils: .0020, dome: -.0011, eye: .0331, tilt: .0002 }
];
const residents = [
    { jaw: .10, cheek: .055, temple: .027, chin: .004, nose: -.004, nostrils: .002, dome: -.004, eye: .0354, tilt: -.0008 },
    { jaw: .089, cheek: .051, temple: .018, chin: -.004, nose: -.001, nostrils: .001, dome: .002, eye: .0340, tilt: .0007 },
    { jaw: -.096, cheek: -.037, temple: -.031, chin: .005, nose: .006, nostrils: -.001, dome: .005, eye: .0298, tilt: -.0014 },
    { jaw: .058, cheek: .078, temple: .002, chin: .002, nose: -.004, nostrils: .001, dome: -.003, eye: .0343, tilt: .0019 },
    { jaw: .125, cheek: .053, temple: .018, chin: .001, nose: .002, nostrils: .002, dome: -.003, eye: .0357, tilt: -.0011 },
    { jaw: -.057, cheek: .031, temple: -.027, chin: .003, nose: .001, nostrils: -.002, dome: .004, eye: .0299, tilt: .0021 },
    { jaw: .069, cheek: .070, temple: .034, chin: .006, nose: -.003, nostrils: .001, dome: .001, eye: .0360, tilt: .0002 },
    { jaw: .033, cheek: -.021, temple: .01, chin: -.004, nose: .005, nostrils: .001, dome: .002, eye: .0312, tilt: -.0011 },
    { jaw: -.048, cheek: -.016, temple: -.046, chin: .007, nose: .003, nostrils: -.001, dome: .004, eye: .0302, tilt: -.0007 },
    { jaw: .065, cheek: .086, temple: .016, chin: -.002, nose: -.005, nostrils: .001, dome: -.002, eye: .0347, tilt: .0014 },
    { jaw: .113, cheek: .026, temple: .01, chin: .008, nose: .004, nostrils: .002, dome: -.004, eye: .0343, tilt: -.0014 },
    { jaw: -.078, cheek: .044, temple: .005, chin: .003, nose: .004, nostrils: -.001, dome: .006, eye: .0305, tilt: .0019 },
    { jaw: .107, cheek: .037, temple: -.012, chin: -.006, nose: -.003, nostrils: .001, dome: -.004, eye: .0355, tilt: .0003 },
    { jaw: .034, cheek: .014, temple: .036, chin: -.005, nose: .006, nostrils: .002, dome: .001, eye: .0328, tilt: -.0007 },
    { jaw: -.046, cheek: .074, temple: -.012, chin: .006, nose: .001, nostrils: -.001, dome: .003, eye: .0334, tilt: .0008 },
    { jaw: -.102, cheek: -.039, temple: .026, chin: -.003, nose: -.0036, nostrils: .0012, dome: .004, eye: .0307, tilt: .0008 }
];
const courierFace = residents.length;
const faceVariant = (role, variant) => role === 'courier' ? courierFace : role === 'resident' ? Math.abs(variant) % (courierFace - 1) + 1 : 0;
exports.faceVariant = faceVariant;
const cranialFits = [
    [1.045, .993, 1.025], [1.021, 1.011, 1.018], [.945, 1.025, .964], [1.030, .965, .977], [1.032, .978, 1.042],
    [.955, 1.018, 1.020], [1.014, 1.054, 1.060], [.986, .990, 1.013], [1.057, .991, 1.035], [1.016, .987, .979],
    [1.036, 1.023, 1.025], [.944, 1.047, .978], [1.040, 1.054, 1.037], [.987, .993, 1.010], [1.010, .971, .973]
];
const leads = {
    hero: [1.066, 1.035, 1.040], vendor: [1.012, 1.022, .992], dispatcher: [1.036, 1.032, 1.048], mechanic: [1.056, .997, 1.030], courier: [.987, 1.034, 1.001]
};
function headScale(role, v) {
    const [x, y, z] = role === 'resident' ? cranialFits[(v + cranialFits.length - 1) % cranialFits.length] : leads[role];
    if (role === 'resident')
        return { x: 1.030 + (x - 1) * 1.48, y: 1.015 + (y - 1) * 1.22, z: 1.012 + (z - 1) * 1.32 };
    return { x, y, z };
}
const sculpt = (id, variant) => variant ? residents[(variant - 1) % residents.length] : principals[id];
const profile = [
    [.042, .0005, .069, -.068, -.0685], [.045, .016, .075, -.056, -.064],
    [.052, .034, .084, -.034, -.054], [.061, .049, .086, -.010, -.041],
    [.075, .061, .082, .019, -.021], [.089, .069, .083, .044, -.008],
    [.102, .073, .084, .067, .001], [.122, .076, .082, .083, .005],
    [.145, .0805, .082, .095, .008], [.164, .0815, .080, .100, .006],
    [.182, .080, .084, .102, .006], [.204, .080, .085, .100, .005],
    [.224, .077, .081, .095, .004], [.242, .068, .069, .082, .004],
    [.254, .052, .052, .064, .005], [.263, .033, .029, .046, .007],
    [.268, .012, .008, .025, .008], [.269, .0002, -.008, .010, .009]
];
const gauss = (v) => Math.exp(-v * v);
const principalBones = [
    { cornerY: .082, cheekY: .150, mandible: .006, forehead: .004, occiput: -.004, chinBreadth: .034, brow: .0032, bridge: .0018, tipY: .132, tipWidth: .0122, hook: .0008, earSize: 1.02, earSlope: .006 },
    { cornerY: .089, cheekY: .148, mandible: -.0035, forehead: .005, occiput: .004, chinBreadth: .025, brow: -.0013, bridge: -.0031, tipY: .136, tipWidth: .0098, hook: -.0009, earSize: .93, earSlope: .009 },
    { cornerY: .091, cheekY: .139, mandible: .0045, forehead: -.005, occiput: -.006, chinBreadth: .034, brow: .0047, bridge: .0058, tipY: .129, tipWidth: .0128, hook: .0058, earSize: 1.13, earSlope: .005 },
    { cornerY: .079, cheekY: .146, mandible: .007, forehead: .001, occiput: .004, chinBreadth: .034, brow: .0004, bridge: -.0026, tipY: .137, tipWidth: .0129, hook: -.0004, earSize: .96, earSlope: .008 },
    { cornerY: .094, cheekY: .153, mandible: -.0045, forehead: .003, occiput: .003, chinBreadth: .023, brow: -.0014, bridge: -.0029, tipY: .137, tipWidth: .0108, hook: -.0005, earSize: 1.05, earSlope: .010 }
];
const residentBones = residents.map((person, v) => ({
    cornerY: .085 + person.jaw * .036, cheekY: .145 + person.cheek * .062, mandible: person.jaw * .038,
    forehead: person.dome * 1.13, occiput: person.temple * .089, chinBreadth: .029 + person.jaw * .027,
    brow: person.temple * .057, bridge: person.nose * .47, tipY: .134 + person.tilt * 1.1,
    tipWidth: .0116 + person.nostrils * .61, hook: person.nose * .31, earSize: .94 + (v % 5) * .035, earSlope: .0055 + (v % 4) * .0011
}));
const bones = (id, variant) => variant === courierFace ? principalBones[4] : variant ? residentBones[variant - 1] : principalBones[id];
const earsFor = (id, variant) => {
    const b = bones(id, variant);
    return { size: b.earSize, slope: b.earSlope, height: .148, depth: .0124, flare: .0104 + (b.mandible > 0 ? .0012 : 0) };
};
exports.earsFor = earsFor;
const profileTangents = profile.map((row, i) => row.slice(1).map((value, k) => {
    const left = profile[i - 1], right = profile[i + 1];
    if (!left)
        return (right[k + 1] - value) / (right[0] - row[0]);
    if (!right)
        return (value - left[k + 1]) / (row[0] - left[0]);
    const h0 = row[0] - left[0], h1 = right[0] - row[0];
    const d0 = (value - left[k + 1]) / h0, d1 = (right[k + 1] - value) / h1;
    if (d0 * d1 <= 0)
        return 0;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
}));
const age = [.31, .55, .05, .06, .65, .12, 1, .38, .53, .21, .28, .15, .84, .49, .08, .06];
const beard = [.34, 0, 0, 0, .26, 0, .73, 0, .9, 0, .28, 0, .82, 0, 0, .02];
const cheekFault = [.8, -.6, -.25, .81, -.60, .31, 1, -.58, .66, .44, -.75, -.22, -.9, .24, .64, .91];
const leadAsymmetry = [-.62, .54, -.82, .75];
const profileColumns = [1, 2, 3, 4];
const warmth = [.75, .55, .48, .78, .60, .72, .61, .52, .57, .65, .41, .85, .73, .70, .38, .87];
const vertexTint = new T.Color();
function faceInk(id, variant, theta, x, y, result) {
    const profile = variant - 1, side = Math.abs(x), forward = Math.max(0, Math.cos(theta));
    const exposed = .72 * gauss((side - .049) / .026) * gauss((y - .141) / .015) + .54 * gauss(x / .022) * gauss((y - .134) / .010);
    const red = exposed * (variant ? warmth[profile] : [.39, .32, .23, .62][id]) * forward;
    const stubble = variant ? beard[profile] : [.29, 0, .22, 0][id];
    const jaw = 1 - T.MathUtils.smoothstep(y, .097 + side * .52, .112 + side * .52);
    const mouth = gauss(x / .033) * gauss((y - .090) / .021);
    const temple = Math.sin(theta) ** 2 * .6 * gauss((y - .139) / .039);
    const fuzz = (.93 + .065 * Math.sin(x * 1470 + y * 83) + .042 * Math.cos(y * 1290 + x * 86));
    const dark = stubble * (jaw * (1 - mouth) * (.86 + .11 * gauss(x / .032)) + .42 * temple) * fuzz * (.52 + .48 * forward);
    const bruising = (variant ? age[profile] : id === 2 ? .94 : .22) * gauss((side - .039) / .019) * gauss((y - .149) / .006) * forward;
    const lines = !variant && id === 2 ? .058 * gauss((side - .043) / .035) * gauss((y - .201) / .020) * Math.pow(.5 + .5 * Math.cos(y * 713 + x * 3.7), 5) * forward : 0;
    const mole = !variant && id === 1 ? .24 * gauss((x + .056) / .0028) * gauss((y - .119) / .0033) * forward : 0;
    const wind = !variant && id === 3 ? .092 * exposed * forward : 0;
    return result.setRGB(1 - .46 * dark - .053 * bruising + red * .040 - lines - mole - wind * .32, 1 - .54 * dark - .071 * bruising - red * .12 - lines - mole - wind, 1 - .53 * dark - .031 * bruising - red * .058 - lines * .9 - mole * .9 - wind * .76);
}
function skullRow(y) {
    let i = 1;
    while (i < profile.length - 1 && profile[i][0] < y)
        i++;
    const a = profile[i - 1], b = profile[i], delta = b[0] - a[0], t = T.MathUtils.clamp((y - a[0]) / delta, 0, 1), t2 = t * t, t3 = t2 * t;
    const aBasis = 2 * t3 - 3 * t2 + 1, bBasis = 3 * t2 - 2 * t3;
    const aTangent = (t3 - 2 * t2 + t) * delta, bTangent = (t3 - t2) * delta;
    const m0 = profileTangents[i - 1], m1 = profileTangents[i];
    return profileColumns.map(k => a[k] * aBasis + b[k] * bBasis + m0[k - 1] * aTangent + m1[k - 1] * bTangent);
}
function skullWidth(id, y, width, form, shape) {
    const male = id === 0 || id === 2;
    const jaw = gauss((y - .082) / .035);
    return width * (male ? 1 + .023 * jaw : .971 - .058 * jaw) * (1 + form.jaw * jaw +
        form.cheek * gauss((y - shape.cheekY) / .020) + form.temple * gauss((y - .204) / .025));
}
function sideBreadth(width, theta, y, shape, asymmetry) {
    const side = Math.abs(theta);
    const masseter = gauss((y - shape.cornerY) / .024) * gauss((side - 1.16) / .61);
    const templeHollow = gauss((y - .188) / .026) * gauss((side - 1.31) / .34);
    return Math.sin(theta) * (width + 1.35 * shape.mandible * masseter - .0028 * templeHollow) +
        .0021 * asymmetry * Math.max(0, Math.cos(theta)) * gauss((y - .091) / .043);
}
function skull(id, theta, y, variant) {
    const [w, f, b, center] = skullRow(y), male = id === 0 || id === 2, form = sculpt(id, variant), shape = bones(id, variant);
    const width = skullWidth(id, y, w, form, shape);
    const c = Math.cos(theta), older = variant ? age[variant - 1] : id === 2 ? 1.2 : .19;
    const individual = variant ? cheekFault[variant - 1] : leadAsymmetry[id];
    const x = sideBreadth(width, theta, y, shape, individual);
    const browWidth = .0165 + .0009 * (male ? 1 : 0);
    const depth = Math.abs(c);
    let z = c > 0 ? center - (f + center) * depth * (1.42 - .42 * depth) : center + (b - center) * depth * (1.17 - .17 * depth);
    z += form.dome * gauss((y - .217) / .037) * (.34 - .65 * c);
    z += Math.max(0, -c) * shape.occiput * gauss((y - .207) / .039);
    if (c > 0) {
        const ax = Math.abs(x);
        const eyeSocket = .0077 * gauss((ax - form.eye) / browWidth) * gauss((y - .165) / .0089);
        const brow = ((male ? .0050 : .0038) + shape.brow) * gauss((ax - form.eye - .002) / .021) * gauss((y - .178) / .0075);
        const malar = (.008 + form.cheek * .040 + older * .0007) * gauss((ax - .048) / .020) * gauss((y - shape.cheekY) / .011);
        const muzzle = (.005 - .0014 * older) * gauss(x / .034) * gauss((y - .106) / .022);
        const sag = .0026 * older * gauss((ax - .054) / .017) * gauss((y - .084) / .017);
        const crease = older * .002 * gauss((ax - .020 - (.127 - y) * .40) / .0038) * gauss((y - .107) / .018);
        const lowerOrbit = .00115 * older * gauss((ax - form.eye) / .019) * gauss((y - .149) / .0048);
        const crooked = x - .0016 * individual * gauss((y - .134) / .018);
        const dorsum = .010 + .0024 * gauss((y - .139) / .010);
        const bridge = (.0132 + shape.bridge) * gauss(crooked / dorsum) * gauss((y - .150) / .024);
        const septum = .0032 * gauss(crooked / .0046) * gauss((y - .127) / .0054);
        const hook = shape.hook * gauss(crooked / .0094) * gauss((y - .146) / .010);
        const nose = (.0168 + form.nose) * gauss(crooked / shape.tipWidth) * gauss((y - shape.tipY) / .0080);
        const wing = (.0081 + form.nostrils * .41) * gauss((ax - .0125 - form.nostrils) / .006) * gauss((y - .128) / .0048);
        const dip = .0051 * gauss((ax - .010 - form.nostrils) / .0038) * gauss((y - .124) / .0030);
        const philtrum = .0023 * gauss((ax - .004) / .0024) * gauss((y - .113) / .006);
        const lips = .0038 * gauss(x / .021) * (gauss((y - .100) / .0038) + .85 * gauss((y - .092) / .0039));
        const chin = (.006 + form.chin) * gauss(x / shape.chinBreadth) * gauss((y - .065) / .011);
        const infraMalar = (.0027 + older * .0011) * gauss((ax - .050) / .013) * gauss((y - .119) / .016);
        const mentolabial = .0036 * gauss(x / .022) * gauss((y - .082) / .006);
        const subnasal = .0028 * gauss(x / .008) * gauss((y - .122) / .0032);
        const frontalPlane = shape.forehead * gauss((y - .217) / .038) * gauss(x / .062);
        z += c * (eyeSocket + dip + infraMalar + mentolabial + subnasal + crease - brow - malar - muzzle - bridge - nose - wing - septum - hook - philtrum - lips - chin - sag - lowerOrbit - frontalPlane);
    }
    const side = Math.min(1, Math.max(0, (Math.abs(theta) - .87) / 1.02));
    const texX = (1 - side) * x + side * Math.sign(theta) * .105;
    return { x, y, z, uv: (0, human_albedo_js_1.uvOf)(texX, y) };
}
function faceTheta(id, x, y, variant) {
    const [w] = skullRow(y), shape = bones(id, variant), individual = variant ? cheekFault[variant - 1] : leadAsymmetry[id];
    const width = skullWidth(id, y, w, sculpt(id, variant), shape);
    let a = Math.asin(T.MathUtils.clamp(x / width, -1, 1));
    for (let j = 0; j < 2; j++) {
        const p = sideBreadth(width, a, y, shape, individual), slope = sideBreadth(width, a + .001, y, shape, individual) - p;
        if (Math.abs(slope) < .000001)
            break;
        a = T.MathUtils.clamp(a + .001 * (x - p) / slope, -Math.PI / 2, Math.PI / 2);
    }
    return a;
}
function eyesFor(id, variant) {
    const f = sculpt(id, variant);
    return { x: f.eye, y: .1657, radius: id % 2 === 0 ? .0136 : .0139, slant: f.tilt };
}
class Surface {
    p = [];
    uv = [];
    c = [];
    index = [];
    vertex(x, y, z, u = 0, v = 0, color) {
        const n = this.p.length / 3;
        this.p.push(x, y, z);
        this.uv.push(u, v);
        if (color)
            this.c.push(color.r, color.g, color.b);
        return n;
    }
    quad(a, b, c, d, reverse = false) {
        if (reverse)
            this.index.push(a, c, b, a, d, c);
        else
            this.index.push(a, b, c, a, c, d);
    }
    build() {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
        if (this.c.length)
            g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
        g.setIndex(this.index);
        g.computeVertexNormals();
        g.computeBoundingSphere();
        g.userData.humanSurface = true;
        return g;
    }
}
exports.Surface = Surface;
const crownAngles = [0, .048, .091, .138, .186, .237, .295, .359, .428, .503, .586, .670, .759, .854, .951, 1.06, 1.19, 1.32, 1.47, 1.64, 1.87, 2.12, 2.38, 2.64, 2.9, Math.PI];
const mirrorAngles = (half) => [...half.slice(1).reverse().map(t => -t), ...half];
const closeAngles = mirrorAngles(crownAngles);
const closeY = [.042, .045, .049, .055, .060, .065, .071, .078, .084, .090, .094, .098, .102, .107, .112, .118, .122, .125, .129, .132, .135, .139, .144, .149, .154, .159, .164, .169, .173, .178, .184, .190, .201, .213, .225, .236, .246, .254, .261, .266, .269];
const streetAngles = mirrorAngles(crownAngles.filter((a, i) => (a > .18 && a < .82) || i % 2 === 0 || i === crownAngles.length - 1));
const streetY = [.042, .052, .065, .078, .092, .099, .106, .122, .135, .149, .157, .165, .173, .182, .201, .224, .245, .261, .269];
const distantAngles = mirrorAngles([0, .238, .51, .88, 1.48, 2.25, Math.PI]);
const distantY = [.042, .061, .099, .130, .151, .172, .205, .240, .269];
function facialGeometry(id, variant, detail = 'close') {
    const mesh = new Surface(), photoCoordinates = [];
    const angles = detail === 'close' ? closeAngles : detail === 'street' ? streetAngles : distantAngles;
    const ys = detail === 'close' ? closeY : detail === 'street' ? streetY : distantY;
    for (let j = 0; j < ys.length; j++)
        for (let i = 0; i < angles.length; i++) {
            const { x, y, z, uv } = skull(id, angles[i], ys[j], variant);
            photoCoordinates.push(uv[0], uv[1]);
            const a = mesh.vertex(x, y, z, (0, exports.headU)(angles[i]), uv[1], faceInk(id, variant, angles[i], x, y, vertexTint)), n = angles.length;
            if (i && j)
                mesh.quad(a - n - 1, a - 1, a, a - n);
        }
    const g = mesh.build(), normals = g.getAttribute('normal'), n = angles.length, smooth = new T.Vector3();
    for (let row = 0; row < ys.length; row++) {
        const a = row * n, b = a + n - 1;
        smooth.set(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
        normals.setXYZ(a, smooth.x, smooth.y, smooth.z);
        normals.setXYZ(b, smooth.x, smooth.y, smooth.z);
    }
    g.setAttribute('portraitUv', new T.Float32BufferAttribute(photoCoordinates, 2));
    return g;
}
function featureGeometry(source) {
    const rect = human_albedo_js_1.lipArea, pos = source.getAttribute('position'), normal = source.getAttribute('normal'), uv = source.getAttribute('portraitUv');
    const surface = new Surface(), normals = [], index = source.index, shares = new Map();
    for (let i = 0; i < index.count; i += 3) {
        const tri = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
        const ux = tri.map(k => uv.getX(k)), vy = tri.map(k => uv.getY(k));
        if (Math.min(...ux) < rect[0] || Math.max(...ux) > rect[2] || Math.min(...vy) < rect[1] || Math.max(...vy) > rect[3])
            continue;
        if (tri.some(k => pos.getZ(k) > -.045))
            continue;
        for (const k of tri) {
            let n = shares.get(k);
            if (n === undefined) {
                const nx = normal.getX(k), ny = normal.getY(k), nz = normal.getZ(k), offset = .00024;
                n = surface.vertex(pos.getX(k) + offset * nx, pos.getY(k) + offset * ny, pos.getZ(k) + offset * nz, (uv.getX(k) - rect[0]) / (rect[2] - rect[0]), (uv.getY(k) - rect[1]) / (rect[3] - rect[1]));
                normals.push(nx, ny, nz);
                shares.set(k, n);
            }
            surface.index.push(n);
        }
    }
    const g = surface.build();
    g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    return g;
}
