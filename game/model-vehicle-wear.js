"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLadogaDoorFinish = applyLadogaDoorFinish;
exports.displayedImpressions = displayedImpressions;
exports.panelWearKey = panelWearKey;
exports.applyVehicleWear = applyVehicleWear;
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
    const legacy = (0, vehicle_impact_damage_js_1.legacyImpressions)(s, e.dents).filter(m => !current.some(mark => mark.panel === m.panel));
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
