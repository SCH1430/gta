"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCockpitCamera = applyCockpitCamera;
exports.createCabinGlass = createCabinGlass;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const region_layout_js_1 = require("./region-layout.js");
const static_box_index_js_1 = require("./static-box-index.js");
function applyCockpitCamera(camera, c, yaw, rear = false, lookPitch = 0) {
    const cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind), s = vehicle_cabin_js_1.specs[c.kind], co = Math.cos(c.yaw), si = Math.sin(c.yaw);
    const x = (require('./culture-paths.js').passengerListen.has(c) ? 1 : -1) * cabin.seatX;
    const z = cabin.seatZ + .027, offset = Math.atan2(Math.sin(yaw - c.yaw), Math.cos(yaw - c.yaw));
    camera.position.set(c.x + x * co + z * si, c.y + Math.min(s.roof - .12, cabin.seatY + .78), c.z - x * si + z * co);
    camera.rotation.order = 'YXZ';
    const pitch = Math.max(-.17, Math.min(.72, lookPitch));
    camera.rotation.set(-.10 - pitch * .86, c.yaw + offset + (rear ? Math.PI : 0), 0);
    camera.updateMatrixWorld();
}
const walls = [...world_layout_js_1.apartments, ...Object.values(world_layout_js_1.buildings).map(v => ({ ...v, h: 5.4 })), ...world_expansion_layout_js_1.expansionBuildings, ...region_layout_js_1.regionBuildings];
const blocks = walls.map((a, i) => ({ ...a, y: 0, color: ['#68757f', '#72818b', '#67747a', '#5d7180'][i % 4], light: a.h > 8 }));
const W = 130, H = 64, focus = 59;
const silhouettes = {
    radio: [[0, 0, 0, 32, 22, 6.2, '#738998'], [-7, -2.8, 6.2, 2.4, 2.4, 45.8, '#a78f83'], [7.8, 1.2, 7, 10, 5, 7.6, '#b9c7c8']],
    quarry: [[0, 0, 0, 36, 28, 2.3, '#807e74'], [-8, -1, 2.3, 18, 22, 8.7, '#897866'], [9, -.4, 2.3, 10.5, 11, 19.6, '#a18e71'], [12, -3.4, 21.9, 1.6, 1.6, 8.1, '#907664']],
    water: [[0, 0, 0, 20, 20, 3.6, '#8b9390'], [0, -1, 3.6, 6.7, 6.7, 16.5, '#aa8978'], [0, -1, 20.1, 15, 15, 11, '#86a29a'], [0, -1, 31.1, 7, 7, 2.8, '#a2b9b3']],
    dock: [[0, 0, 0, 50, 28, 2.6, '#818b86'], [0, 0, 2.6, 39, 9.8, 6.4, '#77665f'], [-8, .1, 9, 8, 5.2, 4.5, '#b3b6a7'], [10.5, 11, 2.6, 2.6, 1.1, 25, '#aa7d66'], [10.5, -11, 2.6, 2.6, 1.1, 25, '#aa7d66'], [10.5, .3, 25, 4.4, 27.7, 3, '#bd9077']],
    northpark: [[0, 5, 0, 48, 17, 4, '#4d626c'], [-13, -2, 4, 13, 19, 25, '#758a8e'], [2, -4, 4, 9, 15, 14, '#7d7f79'], [16, -4, 4, 14, 18, 21, '#637a87']],
    cargo: [[0, 3, 0, 56, 18, 6, '#68746f'], [-18, 1, 6, 7, 12, 2.7, '#b97d50'], [10, -5, 0, 5, 10, 24, '#a35e50'], [10, -5, 23, 38, 3, 3.8, '#b77a59']],
    dam: [[0, 1, 0, 56, 25, 12, '#849089'], [-15, -5, 12, 8, 11, 11, '#70817e'], [11, -4, 12, 10, 12, 20, '#758986'], [1, -8, 14, 15, 3, 5, '#a68f6b']],
    mill: [[0, 1, 0, 58, 37, 8, '#7e7b66'], [-17, 3, 8, 5, 5, 14, '#967f68'], [16, -3, 8, 6, 7, 16, '#73817d'], [0, 1, 8, 18, 16, 2.8, '#a49c7c']]
};
for (const s of region_layout_js_1.regionSites)
    for (const [dx, dz, y, w, d, h, color] of silhouettes[s.id])
        blocks.push({ x: s.x + dx, z: s.z + dz, y, w, d, h, color, light: false });
const far = 75;
const range = Math.ceil(far * Math.hypot(1, W * .55 / focus));
const nearbyBlocks = (0, static_box_index_js_1.indexStaticBoxes)(blocks, world_expansion_layout_js_1.cityLimits, a => ({
    minX: a.x - a.w / 2 - range, maxX: a.x + a.w / 2 + range, minZ: a.z - a.d / 2 - range, maxZ: a.z + a.d / 2 + range
}), 48, 0);
const paving = [...world_expansion_layout_js_1.expansionRoads, ...region_layout_js_1.regionRoads].map(r => ({
    minX: r.x1 - r.width / 2, maxX: r.x2 + r.width / 2, minZ: r.z1 - r.width / 2, maxZ: r.z2 + r.width / 2
}));
const nearbyPaving = (0, static_box_index_js_1.indexStaticBoxes)(paving, world_expansion_layout_js_1.cityLimits, r => ({
    minX: r.minX - range, maxX: r.maxX + range, minZ: r.minZ - range, maxZ: r.maxZ + range
}), 48, 0);
function clipRoad(points, depth, near) {
    const visible = [];
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length], inA = near ? a.depth >= depth : a.depth <= depth, inB = near ? b.depth >= depth : b.depth <= depth;
        if (inA)
            visible.push(a);
        if (inA !== inB)
            visible.push({ depth, across: a.across + (b.across - a.across) * (depth - a.depth) / (b.depth - a.depth) });
    }
    return visible;
}
function paintMirror(g, c, sim, side) {
    const x = c.x + side * Math.cos(c.yaw) * 1.02, z = c.z - side * Math.sin(c.yaw) * 1.02;
    const angle = c.yaw + side * .36, co = Math.cos(angle), si = Math.sin(angle), eye = c.y + 1.28;
    function project(px, y, pz) {
        const dx = px - x, dz = pz - z, depth = dx * si + dz * co;
        return { u: W * .5 + (dx * co - dz * si) * focus / Math.max(.14, depth), v: 26 + (eye - y) * focus / Math.max(.14, depth), depth };
    }
    g.fillStyle = '#7991a5';
    g.fillRect(0, 0, W, 26);
    g.fillStyle = '#929da4';
    g.fillRect(0, 26, W, H - 26);
    for (const r of nearbyPaving(x, z, x, z)) {
        const corners = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ]].map(([px, pz]) => ({
            across: (px - x) * co - (pz - z) * si, depth: (px - x) * si + (pz - z) * co
        }));
        const visible = clipRoad(clipRoad(corners, 1, true), far, false);
        if (!visible.length)
            continue;
        g.beginPath();
        visible.forEach((p, i) => {
            const u = W / 2 + p.across * focus / p.depth, v = 26 + eye * focus / p.depth;
            if (i === 0)
                g.moveTo(u, v);
            else
                g.lineTo(u, v);
        });
        g.fillStyle = '#495761';
        g.fill();
    }
    const live = sim.cars.filter(v => v !== c).map(v => ({ x: v.x, z: v.z, w: vehicle_cabin_js_1.specs[v.kind].w * 1.9, d: (vehicle_cabin_js_1.specs[v.kind].rear - vehicle_cabin_js_1.specs[v.kind].front) * .91, h: vehicle_cabin_js_1.specs[v.kind].roof, color: v.color, light: false, y: v.y }));
    for (const p of sim.people)
        live.push({ x: p.x, z: p.z, w: .45, d: .4, h: 1.7, color: '#495349', light: false, y: p.y });
    const faces = [...nearbyBlocks(x, z, x, z), ...live].map(a => ({ a, p: project(a.x, a.y, a.z) })).filter(({ a, p }) => p.depth > .8 && p.depth < far && Math.abs(p.u - W / 2) < W * .55 + Math.max(a.w, a.d) * focus / p.depth).sort((a, b) => b.p.depth - a.p.depth);
    for (const { a, p } of faces) {
        const b = project(a.x, a.y + a.h, a.z), w = Math.min(W * 1.3, Math.max(1, (Math.abs(co) * a.w + Math.abs(si) * a.d) * focus / p.depth)), h = Math.max(1, p.v - b.v), l = p.u - w / 2;
        g.fillStyle = a.color;
        g.fillRect(l, b.v, w, h);
        g.fillStyle = '#111e292e';
        g.fillRect(l, b.v, w * .23, h);
        if (a.light && w > 7 && h > 5) {
            g.fillStyle = '#d7b98b';
            for (let j = 1; j < 5; j++)
                for (let k = 1; k < 4; k++)
                    if ((j + k) % 3)
                        g.fillRect(l + w * j / 5, b.v + h * k / 4, Math.max(.6, w * .045), Math.max(.6, h * .045));
        }
        if (!a.light && a.d === 3.3) {
            g.fillStyle = '#91adb4';
            g.fillRect(l + w * .15, b.v + h * .12, w * .70, h * .30);
            g.fillStyle = '#d5c58b';
            g.fillRect(l, b.v + h * .61, w * .16, Math.max(1, h * .12));
            g.fillRect(l + w * .84, b.v + h * .61, w * .16, Math.max(1, h * .12));
        }
    }
    if (side === 1 && Math.hypot(c.x + 46.95, c.z - 47.24) < 19) {
        const upper = project(-46.91, 2.40, 47.24), lower = project(-46.91, .08, 47.24);
        if (upper.depth > .3 && upper.u >= -2 && upper.u <= W + 2) {
            g.fillStyle = '#f4e6ad';
            g.fillRect(upper.u, upper.v, Math.max(1, .23 * focus / upper.depth), lower.v - upper.v);
        }
    }
}
const glassWidth = 480, glassHeight = 240;
const wiperPivots = [85, 316], wiperRate = 5.6, wiperPeriod = Math.PI * 2 / wiperRate;
const wiperRest = -.25, wiperTravel = 1.52, armLength = 80, bladeTilt = .24;
const bladeTop = -68, bladeBottom = 21;
function wiperPhase(x, y, pivot) {
    const dx = x - pivot, dy = y - glassHeight;
    const perpendicular = armLength * Math.sin(bladeTilt);
    const offset = dx * dx + dy * dy - perpendicular * perpendicular;
    if (offset < 0)
        return null;
    // The blade is tilted at the end of the arm, so the swept band is wider toward its tip.
    const along = armLength * Math.cos(bladeTilt) - Math.sqrt(offset);
    if (along < bladeTop || along > bladeBottom)
        return null;
    const angle = Math.atan2(dx, -dy) - Math.atan2(-Math.sin(bladeTilt) * along, armLength - Math.cos(bladeTilt) * along);
    const progress = (angle - wiperRest) / wiperTravel;
    return progress >= 0 && progress <= 1 ? Math.acos(1 - progress * 2) / wiperRate : null;
}
function lastWiperPass(time, phase) {
    const returnPhase = wiperPeriod - phase;
    return Math.max(phase + Math.floor((time - phase) / wiperPeriod) * wiperPeriod,
        returnPhase + Math.floor((time - returnPhase) / wiperPeriod) * wiperPeriod);
}
function createCabinGlass(canvas) {
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden;display:none';
    canvas.parentElement?.appendChild(layer);
    const glass = document.createElement('canvas');
    glass.width = glassWidth;
    glass.height = glassHeight;
    glass.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    layer.appendChild(glass);
    const g = glass.getContext('2d');
    const mirrors = [-1, 1].map(side => {
        const m = document.createElement('canvas');
        m.width = W;
        m.height = H;
        m.style.cssText = 'position:absolute;top:48%;width:12%;height:11%;border:3px solid #29353b;border-radius:36% 15% 25% 25%;box-shadow:0 2px 3px #131c24;' + (side < 0 ? 'left:2%' : 'right:2%');
        layer.appendChild(m);
        return m;
    });
    let mirrorTimer = 0, glassTimer = 0, visibleCar = null;
    const wiped = new WeakMap();
    const drops = Array.from({ length: 200 }, (_, i) => {
        const x = (i * 113.79) % glassWidth, y = (i * 91.753) % (glassHeight - 13);
        return { x, y, r: .58 + ((i * 37) % 11) * .13, phases: wiperPivots.map(pivot => wiperPhase(x, y, pivot)).filter(phase => phase !== null) };
    });
    return { hide() { layer.style.display = 'none'; visibleCar = null; }, update(sim, dt, weather, windshieldHidden) {
            const c = sim.activeCar(), visible = !!c && sim.motorPool.cockpit && !sim.transition;
            layer.style.display = visible ? 'block' : 'none';
            if (!visible) {
                visibleCar = null;
                return;
            }
            glass.style.display = windshieldHidden ? 'none' : 'block';
            if (visibleCar !== c) {
                visibleCar = c;
                mirrorTimer = glassTimer = 0;
            }
            const s = (0, vehicle_road_js_1.equipment)(c);
            mirrorTimer -= dt;
            if (mirrorTimer <= 0) {
                mirrorTimer = .12;
                mirrors.forEach((m, i) => {
                    const ctx = m.getContext('2d');
                    if (i === 0 ? s.leftMirror : s.rightMirror) {
                        ctx.fillStyle = '#344348';
                        ctx.fillRect(0, 0, W, H);
                    }
                    else
                        paintMirror(ctx, c, sim, i === 0 ? -1 : 1);
                });
            }
            glassTimer -= dt;
            if (windshieldHidden || glassTimer > 0)
                return;
            glassTimer = s.wipers ? 1 / 30 : .09;
            g.clearRect(0, 0, glassWidth, glassHeight);
            const mist = c.mobilityMist || 0;
            if (mist > .008) {
                const clear = g.createRadialGradient(240, 218, 15, 240, 218, 285);
                clear.addColorStop(0, 'rgba(188,206,208,' + mist * .04 + ')');
                clear.addColorStop(.48, 'rgba(180,200,203,' + mist * .27 + ')');
                clear.addColorStop(1, 'rgba(184,204,209,' + mist * .77 + ')');
                g.fillStyle = clear;
                g.fillRect(0, 0, glassWidth, glassHeight);
            }
            const time = sim.elapsed, regain = 3.1 - (weather?.rain ?? 0) * 1.45;
            let sweep = wiped.get(c);
            if (!sweep || time < sweep.lastDraw) {
                sweep = { since: time - wiperPeriod, lastDraw: time, on: s.wipers, drops: new Float64Array(drops.length).fill(-Infinity) };
                wiped.set(c, sweep);
            }
            if (s.wipers && !sweep.on)
                sweep.since = sweep.lastDraw;
            sweep.on = s.wipers;
            sweep.lastDraw = time;
            const count = Math.ceil((s.glassWet ?? s.wet) * drops.length);
            for (let i = 0; i < drops.length; i++) {
                const d = drops[i];
                if (s.wipers)
                    for (const phase of d.phases) {
                        const pass = lastWiperPass(time, phase);
                        if (pass >= sweep.since)
                            sweep.drops[i] = Math.max(sweep.drops[i], pass);
                    }
                if (i >= count)
                    continue;
                const alpha = Math.min(1, (time - sweep.drops[i] - .24) / regain);
                if (alpha <= .025)
                    continue;
                g.globalAlpha = alpha;
                g.fillStyle = 'rgba(25,41,48,.34)';
                g.beginPath();
                g.ellipse(d.x, d.y, d.r, d.r * 1.65, -.19, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = 'rgba(205,226,230,.46)';
                g.fillRect(d.x - .46, d.y - d.r, Math.max(.55, d.r * .7), .77);
            }
            g.globalAlpha = 1;
            if (s.wipers) {
                const a = wiperRest + (1 - Math.cos(time * wiperRate)) * .5 * wiperTravel;
                for (const x of wiperPivots) {
                    g.save();
                    g.translate(x, glassHeight);
                    g.rotate(a);
                    g.strokeStyle = '#233039';
                    g.lineWidth = 2.4;
                    g.beginPath();
                    g.moveTo(0, 0);
                    g.lineTo(0, -armLength);
                    g.stroke();
                    g.translate(0, -armLength);
                    g.rotate(bladeTilt);
                    g.lineWidth = 3.0;
                    g.beginPath();
                    g.moveTo(0, bladeBottom);
                    g.lineTo(0, bladeTop);
                    g.stroke();
                    g.restore();
                }
            }
        }, dispose() { layer.remove(); } };
}
