"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLadogaDoorFinish = applyLadogaDoorFinish;
exports.displayedImpressions = displayedImpressions;
exports.panelWearKey = panelWearKey;
exports.applyVehicleWear = applyVehicleWear;
exports.applyRoadFilm = applyRoadFilm;
const T = require("../engine/three.module.min.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_impact_damage_js_1 = require("./vehicle-impact-damage.js");
const model_geometry_js_1 = require("./model-geometry.js");
let distantDoors;
function distantLadogaDoors() {
    const { w, belt } = vehicle_cabin_js_1.specs.hatch, { hingeZ, doorLength, sillY } = (0, vehicle_cabin_js_1.carCabin)('hatch');
    return [-1, 1].map(side => {
        const b = new model_geometry_js_1.Batch(), x = side * (w + .006), z0 = hingeZ + .025, z1 = hingeZ + doorLength - .021;
        b.quad([x, sillY + .086, z0], [x, sillY + .086, z1], [x, belt - .048, z1], [x, belt - .048, z0], '#ffffff', [side, 0, 0]);
        return b.mesh();
    });
}
function applyLadogaDoorFinish(base, doors, far) {
    distantDoors ??= distantLadogaDoors();
    const mud = new T.Color('#685b52');
    const slots = vehicle_road_js_1.donorDoorSides.map((side, i) => {
        const skin = doors[i].children.find((part) => part.isMesh && part.material === base);
        const plate = distantDoors[i].clone();
        skin.name = 'door-skin-' + side;
        plate.name = 'low-door-skin-' + side;
        plate.visible = false;
        far.add(plate);
        return { side, skin, plate, color: '', material: undefined };
    });
    let previousDirt = -1;
    return {
        plates: slots.map(slot => slot.plate),
        update(e) {
            const dirt = Math.round((e?.dirt ?? 0) * 24) / 24;
            for (const slot of slots) {
                const color = e?.donorDoors?.[slot.side] ?? '';
                if (slot.color === color && dirt === previousDirt)
                    continue;
                slot.color = color;
                if (!color) {
                    slot.skin.material = base;
                    slot.plate.visible = false;
                    continue;
                }
                const material = slot.material ??= base.clone();
                material.color.set(color).lerp(mud, .054 + dirt * .45);
                material.roughness = Math.min(.95, base.roughness + .075);
                material.envMapIntensity = base.envMapIntensity * .88;
                slot.skin.material = material;
                slot.plate.material = material;
                slot.plate.visible = true;
            }
            previousDirt = dirt;
        },
        dispose() {
            for (const { material } of slots)
                material?.dispose();
        }
    };
}
const refined = new WeakMap();
function refinePanels(source, s, spacing) {
    const cached = refined.get(source);
    if (cached)
        return cached;
    const p = source.getAttribute('position'), n = source.getAttribute('normal'), c = source.getAttribute('color');
    const positions = [], normals = [], colors = [], indices = [];
    const known = new Map();
    function vertex(point) {
        const key = point.map(x => Math.round(x * 100000)).join(',');
        const found = known.get(key);
        if (found !== undefined)
            return found;
        const index = positions.length / 3;
        const [x, y, z, nx, ny, nz, r, g, b] = point;
        positions.push(x, y, z);
        normals.push(nx, ny, nz);
        colors.push(r, g, b);
        known.set(key, index);
        return index;
    }
    function point(i) {
        return [p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), c.getX(i), c.getY(i), c.getZ(i)];
    }
    function split(a, b) {
        if (Math.min(a[1], b[1]) > s.belt + .13 || Math.max(a[1], b[1]) < .33)
            return null;
        if (Math.max(Math.abs(a[0]), Math.abs(b[0])) < s.w * .64 && Math.min(a[2], b[2]) > s.front + .67 && Math.max(a[2], b[2]) < s.rear - .67)
            return null;
        const fascia = Math.max(a[2], b[2]) < s.front + .31 || Math.min(a[2], b[2]) > s.rear - .24;
        const edge = fascia ? Math.min(.25, spacing) : spacing;
        if ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 <= edge * edge)
            return null;
        return a.map((value, i) => (value + b[i]) * .5);
    }
    function triangle(a, b, c, level) {
        const ab = level ? split(a, b) : null, bc = level ? split(b, c) : null, ca = level ? split(c, a) : null;
        if (ab && bc && ca) {
            triangle(a, ab, ca, level - 1);
            triangle(ab, b, bc, level - 1);
            triangle(ca, bc, c, level - 1);
            triangle(ab, bc, ca, level - 1);
        }
        else if (ab && bc) {
            triangle(a, ab, c, level - 1);
            triangle(ab, bc, c, level - 1);
            triangle(ab, b, bc, level - 1);
        }
        else if (bc && ca) {
            triangle(b, bc, a, level - 1);
            triangle(bc, ca, a, level - 1);
            triangle(bc, c, ca, level - 1);
        }
        else if (ca && ab) {
            triangle(c, ca, b, level - 1);
            triangle(ca, ab, b, level - 1);
            triangle(ca, a, ab, level - 1);
        }
        else if (ab) {
            triangle(a, ab, c, level - 1);
            triangle(ab, b, c, level - 1);
        }
        else if (bc) {
            triangle(b, bc, a, level - 1);
            triangle(bc, c, a, level - 1);
        }
        else if (ca) {
            triangle(c, ca, b, level - 1);
            triangle(ca, a, b, level - 1);
        }
        else
            indices.push(vertex(a), vertex(b), vertex(c));
    }
    const index = source.getIndex(), count = index?.count ?? p.count;
    for (let i = 0; i < count; i += 3) {
        triangle(point(index ? index.getX(i) : i), point(index ? index.getX(i + 1) : i + 1), point(index ? index.getX(i + 2) : i + 2), 5);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    refined.set(source, geometry);
    return geometry;
}
function displayedImpressions(s, e) {
    if (!e)
        return [];
    const current = e.impressions ?? [];
    const legacy = (0, vehicle_impact_damage_js_1.legacyImpressions)(s, e.dents ?? {}).filter(m => !current.some(mark => mark.panel === m.panel));
    return [...current, ...legacy];
}
function panelWearKey(e) {
    if (!e?.dents)
        return 0;
    let key = 0;
    for (const panel of vehicle_impact_damage_js_1.bodyPanels)
        key = 101 * key + Math.round((e.dents[panel] ?? 0) * 100);
    return key;
}
const filmTemplates = new WeakMap();
const filmTones = ['#b7bbad', '#c6c9bd', '#8c9185', '#6b6b5d', '#82796a'];
function filmSurfaces(panels, minWidth, maxHeight) {
    const sides = { [-1]: [], [1]: [] };
    panels.forEach((panel, index) => {
        const geometry = panel.geometry, points = geometry.getAttribute('position'), order = geometry.getIndex();
        const corner = i => order ? order.getX(i) : i;
        for (let i = 0, count = order?.count ?? points.count; i < count; i += 3) {
            const a = corner(i), b = corner(i + 1), c = corner(i + 2);
            const x0 = points.getX(a), x1 = points.getX(b), x2 = points.getX(c);
            const side = x0 < 0 ? -1 : 1;
            if (Math.min(x0 * side, x1 * side, x2 * side) < minWidth)
                continue;
            const y0 = points.getY(a), y1 = points.getY(b), y2 = points.getY(c);
            const low = Math.min(y0, y1, y2), high = Math.max(y0, y1, y2);
            if (high < .32 || low > maxHeight)
                continue;
            const z0 = points.getZ(a), z1 = points.getZ(b), z2 = points.getZ(c);
            const ay = y1 - y0, az = z1 - z0, by = y2 - y0, bz = z2 - z0, determinant = ay * bz - az * by;
            if (Math.abs(determinant) < .000001)
                continue;
            sides[side].push({ index, x0, y0, z0, ax: x1 - x0, bx: x2 - x0,
                ay, az, by, bz, inverse: 1 / determinant, low, high, first: Math.min(z0, z1, z2), last: Math.max(z0, z1, z2) });
        }
    });
    return sides;
}
function buildRoadFilm(s, panels) {
    const decals = panels.map(() => new model_geometry_js_1.Batch()), sides = filmSurfaces(panels, s.w * .80, 2 * s.r + .31);
    const color = n => filmTones[n % filmTones.length];
    const random = (n) => {
        const wave = Math.sin(n * 19.931 + 47.11) * 43218.34;
        return wave - Math.floor(wave);
    };
    function sample(side, y, z) {
        let outer = 0, index = -1;
        for (const surface of sides[side]) {
            if (y < surface.low || y > surface.high || z < surface.first || z > surface.last)
                continue;
            const { x0, y0, z0, ax, bx, ay, az, by, bz, inverse } = surface, py = y - y0, pz = z - z0;
            const a = (py * bz - pz * by) * inverse, b = (ay * pz - az * py) * inverse;
            if (a < 0 || b < 0 || a + b > 1)
                continue;
            const x = side * (x0 + a * ax + b * bx);
            if (x > outer) {
                outer = x;
                index = surface.index;
            }
        }
        if (index >= 0)
            return { index, point: [side * (outer + .004), y, z] };
    }
    function streak(side, y, z, length, height, tone) {
        const a = sample(side, y, z - length * .46), b = sample(side, y + height * .20, z + length * .57);
        const c = sample(side, y + height, z + length * .26), d = sample(side, y + height * .65, z - length * .55);
        if (!a || b?.index !== a.index || c?.index !== a.index || d?.index !== a.index)
            return;
        decals[a.index].quad(a.point, b.point, c.point, d.point, tone, [side, 0, 0]);
    }
    for (const side of [-1, 1]) {
        const seed = side < 0 ? 217 : 84;
        for (const axle of [s.fw, s.rw]) {
            for (let i = 0; i < 51; i++) {
                const n = seed + i + (axle < 0 ? 0 : 65);
                const angle = .10 + random(n + 605) * (Math.PI - .20);
                const reach = s.r + .075 + random(n) ** 1.7 * .19;
                const y = s.r + Math.sin(angle) * reach, z = axle + Math.cos(angle) * reach;
                streak(side, y, z, .026 + random(n + 312) ** 2 * .111, .008 + random(n + 810) ** 2 * .039, color(i));
            }
        }
        const length = s.rw - s.fw - (s.r + .06) * 2;
        for (let i = 0; i < 67; i++) {
            const n = seed + i + 470;
            const z = s.fw + s.r + .06 + random(n) * length;
            const y = .425 + random(n + 130) ** 2.2 * (s.belt - .42) * .52;
            streak(side, y, z, .038 + random(n + 700) ** 1.7 * .150, .009 + random(n + 330) ** 2 * .037, color(i + 2));
        }
    }
    return decals.map(decal => decal.pos.length ? decal.mesh().geometry : null);
}
function applyRoadFilm(kind, panels) {
    const source = panels[0].geometry;
    let geometry = filmTemplates.get(source);
    if (!geometry) {
        geometry = buildRoadFilm(vehicle_cabin_js_1.specs[kind], panels);
        filmTemplates.set(source, geometry);
    }
    const material = new T.MeshLambertMaterial({
        vertexColors: true, side: T.DoubleSide, transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    });
    const parts = panels.flatMap((panel, i) => {
        if (!geometry[i])
            return [];
        // Deposit vertices were sampled with the doors closed, in the same
        // coordinate frame as each paint panel's geometry.
        const film = new T.Mesh(geometry[i], material);
        film.name = 'salt-and-road-grime';
        film.position.copy(panel.position);
        film.visible = false;
        panel.parent.add(film);
        return [film];
    });
    let previous = -1;
    return {
        parts,
        update(dirt) {
            const band = Math.round((dirt ?? 0) * 24);
            if (band === previous)
                return;
            previous = band;
            const opacity = T.MathUtils.smoothstep(band / 24, .025, .82) * .83;
            material.opacity = opacity;
            for (const film of parts)
                film.visible = opacity >= .025;
        },
        dispose() { material.dispose(); }
    };
}
function applyVehicleWear(kind, material, parts, farParts, wheels, firstColor) {
    const tint = new T.Color(firstColor), mud = new T.Color('#685b52'), s = vehicle_cabin_js_1.specs[kind];
    let prevDirt = -1, lastWheels = -1, lastBody = '', lastDents = 0;
    let lastImpressions;
    const paint = [...parts, ...farParts].map(part => ({
        part, source: part.geometry,
        spacing: !parts.includes(part) ? 0 : part.name.endsWith('headlamp') ? .18 :
            part.material === material ? .245 : part.geometry.getAttribute('position').count > 450 ? .49 : 0,
        mark: undefined
    }));
    const target = new T.Vector3();
    function shape(marks) {
        for (const data of paint) {
            const { part, source, spacing } = data;
            if (!source.boundingBox)
                source.computeBoundingBox();
            const bounds = source.boundingBox;
            const affected = marks.some(mark => {
                const x = Math.max(0, bounds.min.x - mark.x, mark.x - bounds.max.x);
                const z = Math.max(0, bounds.min.z - mark.z, mark.z - bounds.max.z);
                return (x / .85) ** 2 + (z / 1.10) ** 2 < 1;
            });
            if (!affected) {
                part.geometry = source;
                continue;
            }
            const mesh = spacing ? refinePanels(source, s, spacing) : source;
            const next = data.mark ??= mesh.clone(), positions = next.getAttribute('position');
            const base = mesh.getAttribute('position'), color = next.getAttribute('color'), baseColor = mesh.getAttribute('color');
            for (let i = 0; i < base.count; i++) {
                const x = base.getX(i), y = base.getY(i), z = base.getZ(i);
                (0, vehicle_impact_damage_js_1.impactBodyPoint)(s, marks, x, y, z, target);
                const tint = Math.max(.80, 1 - Math.hypot(x - target.x, y - target.y, z - target.z) * .63);
                color.setXYZ(i, baseColor.getX(i) * tint, baseColor.getY(i) * tint, baseColor.getZ(i) * tint);
                positions.setXYZ(i, target.x, target.y, target.z);
            }
            positions.needsUpdate = true;
            color.needsUpdate = true;
            next.userData.deformingSurface = true;
            next.computeVertexNormals();
            next.computeBoundingSphere();
            part.geometry = next;
        }
    }
    return {
        dispose() {
            for (const { mark } of paint)
                mark?.dispose();
        },
        setColor(color) { tint.set(color); prevDirt = -1; material.color.copy(tint); },
        update(e) {
            const dirt = Math.round((e?.dirt ?? 0) * 24) / 24;
            if (dirt !== prevDirt) {
                material.color.copy(tint).lerp(mud, dirt * .46);
                material.roughness = .31 + dirt * .54;
                material.envMapIntensity = .82 - dirt * .49;
                prevDirt = dirt;
            }
            const punctures = e?.punctures ?? 0;
            let wheelStamp = punctures;
            for (let i = 0; i < 4; i++)
                wheelStamp = wheelStamp * 101 + Math.round((e?.wheelDamage?.[i] ?? 0) * 100);
            if (lastWheels !== wheelStamp) {
                wheels.forEach((wheel, i) => {
                    const fault = e?.wheelDamage?.[i] ?? 0, flat = !!(punctures & (1 << i));
                    wheel.scale.set(1, flat ? .83 : 1, flat ? .87 : 1);
                    wheel.rotation.z = fault * (i % 2 === 0 ? -.115 : .115);
                });
                lastWheels = wheelStamp;
            }
            const panels = panelWearKey(e);
            if (lastDents === panels && lastImpressions === e?.impressions)
                return;
            lastDents = panels;
            lastImpressions = e?.impressions;
            const marks = displayedImpressions(s, e);
            const stamp = marks.map(m => [m.panel, m.x, m.z, m.dx, m.dz, m.strength].map(v => typeof v === 'number' ? Math.round(v * 100) : v).join(',')).join(';');
            if (lastBody === stamp)
                return;
            lastBody = stamp;
            shape(marks);
        }
    };
}
