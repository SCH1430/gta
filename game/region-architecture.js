"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRegionalArchitecture = addRegionalArchitecture;
const THREE = require("../engine/three.module.min.js");
const region_layout_js_1 = require("./region-layout.js");
const region_architecture_atlas_js_1 = require("./region-architecture-atlas.js");
const region_architecture_mesh_js_1 = require("./region-architecture-mesh.js");
const region_landmarks_js_1 = require("./region-landmarks.js");
const outer_site_layout_js_1 = require("./outer-site-layout.js");
const outer_landmarks_js_1 = require("./outer-landmarks.js");
const outer_court_art_js_1 = require("./outer-court-art.js");
const snow = '#ccd5d7', lintel = '#657680';
const sides = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const tints = ['#edf0ea', '#dee6e3', '#ccdbe3', '#e7e8e0'];
const industries = { radio: ['БЮРО СВЯЗИ', 'ЛИНИЯ 77', 'РАДИОДЕТАЛИ'], quarry: ['ГОРНЫЙ МАСТЕР', 'ВЕСОВАЯ', 'РУДОУПРАВЛЕНИЕ'], water: ['КНИГИ', 'РЕМОНТ ПРИЁМНИКОВ', 'СТЕКОЛЬНАЯ'], dock: ['ВОДОМЕРНЫЙ ПОСТ', 'ТАКЕЛАЖ', 'РЕЧНОЙ СКЛАД'],
    northpark: ['ЖИЛКОНТОРА', 'ДЕЖУРНАЯ АПТЕКА', 'ТЕПЛОПУНКТ'], cargo: ['ТАМОЖЕННЫЙ ПОСТ', 'ЖЕЛЕЗНОДОРОЖНАЯ КАССА', 'ДИСПЕТЧЕРСКАЯ'], dam: ['ГИДРОПОСТ', 'ТУРБИННЫЙ ЦЕХ', 'БЮРО ПРОПУСКОВ'], mill: ['ПИЛОРАМА', 'СУШИЛЬНЫЙ ЦЕХ', 'ЛЕСОХРАНА'] };
function labelFor(b, index) {
    if (b.name)
        return b.name;
    if (['container','cottage','garages'].includes(b.kind) || index % 9)
        return '';
    const signs = industries[b.district];
    return signs[(Math.floor(index / 9) + index % 5) % signs.length];
}
function streetSide(b) {
    let side = 0, best = Infinity;
    for (const r of region_layout_js_1.regionRoads) {
        const dx = Math.max(r.x1, Math.min(b.x, r.x2)) - b.x, dz = Math.max(r.z1, Math.min(b.z, r.z2)) - b.z;
        const distance = Math.max(0, Math.abs(dx) - b.w / 2) ** 2 + Math.max(0, Math.abs(dz) - b.d / 2) ** 2;
        if (distance < best) {
            best = distance;
            side = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz > 0 ? 0 : 2);
        }
    }
    return side;
}
function regular(s, which, name, g, atlas) {
    const { w, d, h, kind, district } = s, home = kind === 'brick' || kind === 'hotel', p = region_architecture_atlas_js_1.paint[district], { body, trim, walls, text } = g;
    const side = streetSide(s), frontAngle = sides[side], frontSpan = side % 2 ? d : w;
    const attach = (whichSide, u, y, offset, ww, hh, depth, ink) => {
        const a = sides[whichSide], sn = Math.sin(a), cs = Math.cos(a), at = (whichSide % 2 ? w : d) / 2 + offset;
        trim.box(u * cs + at * sn, y, -u * sn + at * cs, whichSide % 2 ? depth : ww, hh, whichSide % 2 ? ww : depth, ink);
    };
    if (kind==='cottage' || kind==='garages') {
        const cottage=kind==='cottage', paint=cottage ? ['#93836a','#938776','#808670'][which%3] : '#908a7a';
        body.box(0,h/2,0,w,h,d,paint);
        if (cottage) {
            const rx=w/2+.25, rz=d/2+.26, ridge=h+1.48;
            body.quad([-rx,h,rz],[rx,h,rz],[rx,ridge,0],[-rx,ridge,0],snow);
            body.quad([-rx,ridge,0],[rx,ridge,0],[rx,h,-rz],[-rx,h,-rz],'#b5bdba');
            body.quad([rx,h,-rz],[rx,ridge,0],[rx,h,rz],[rx,h,rz],paint);
            body.quad([-rx,h,rz],[-rx,ridge,0],[-rx,h,-rz],[-rx,h,-rz],paint);
            body.box(-w*.23,h+1.14,-d*.16,.58,2.42,.58,'#896e5c');
            for(const face of [0,1,2,3]) {
                const span=face%2?d:w;
                for(const fraction of [-.29,.29]) {
                    attach(face,span*fraction,1.65,.05,1.30,1.16,.13,'#ddd2b0');
                    attach(face,span*fraction,1.65,.13,1.10,.96,.045,'#74888a');
                    attach(face,span*fraction,1.65,.17,.052,.98,.039,'#d9cfad');
                }
            }
            attach(side,0,1.06,.08,1.09,2.12,.18,'#635b4c');
        } else {
            body.box(0,h+.04,0,w+.16,.12,d+.18,snow);
            const bays=Math.max(2,Math.floor(frontSpan/3.4));
            for (let i=0;i<bays;i++) {
                const size=frontSpan/bays,u=(i+.5)*size-frontSpan/2;
                attach(side,u,1.20,.06,size-.24,2.40,.15,['#6b776c','#736b5e','#8b795e'][i%3]);
                attach(side,u,1.18,.15,.026,2.30,.025,'#554f44');
                attach(side,u+.12,1.06,.17,.11,.11,.025,'#aaa38b');
            }
        }
        return;
    }
    const isContainer = kind === 'container', floor = isContainer ? .16 : .77;
    body.box(0, floor / 2, 0, w + .04, floor, d + .04, p.shade);
    if (isContainer) {
        body.box(0, (h + floor) / 2, 0, w, h - floor, d, p.base);
        for (let i = -Math.floor(w * .30); i <= w * .30; i++)
            for (const z of [-1, 1])
                trim.box(i * 1.5, h * .53, z * d * .5, .08, h * .88, .09, p.shade);
    }
    else {
        const tile = atlas.facades.get(district + (home ? 'flat' : 'works')), height = h - floor;
        for (let j = 0; j < 4; j++) {
            const a = sides[j], width = j % 2 ? d : w, away = (j % 2 ? w : d) * .5, cs = Math.cos(a), sn = Math.sin(a);
            const columns = Math.max(1, Math.round(width / (home ? 13.4 : 18.0))), rows = Math.max(1, Math.round(height / (home ? 8.8 : 12.6)));
            for (let k = 0; k < columns; k++)
                for (let row = 0; row < rows; row++) {
                    const u = ((k + .5) / columns - .5) * width;
                    walls.frontage(cs * u + sn * away, floor + (row + .5) * height / rows, -sn * u + cs * away, width / columns, height / rows, a, tints[j], tile);
                }
        }
    }
    body.box(0, h - .095, 0, w + .17, .22, d + .17, p.roof);
    body.box(0, h + .08, 0, w + .27, .13, d + .27, snow);
    const entry = -frontSpan * .24;
    attach(side, entry, 1.43, .028, home ? 1.65 : 3.32, 2.85, .13, p.shade);
    attach(side, entry + .18, 1.83, .106, .61, .66, .075, home ? '#a4bbb9' : '#819b9c');
    attach(side, entry, 2.98, .31, home ? 2.55 : 4.03, .17, .68, lintel);
    if (home && h > 11) {
        const floors = Math.max(2, Math.round(h / 3.0));
        for (let y = 1; y < floors; y++) {
            attach(side, frontSpan * .23, y * h / floors + .08, .35, Math.min(3.0, frontSpan * .2), .49, .69, p.trim);
            attach(side, frontSpan * .23, y * h / floors + .35, .35, Math.min(3.15, frontSpan * .2 + .1), .065, .78, snow);
        }
        body.box(w * .16, h + .52, -d * .11, w * .30, .88, d * .22, p.roof);
        body.box(w * .16, h + .99, -d * .11, w * .31, .11, d * .23, snow);
    }
    else if (kind === 'plant') {
        const len = w * .72, spacing = d * .70 / 3;
        for (let i = 0; i < 3; i++) {
            const z = -d * .28 + i * spacing;
            body.quad([-len * .5, h + .2, z], [len * .5, h + .2, z], [len * .5, h + 1.75, z], [-len * .5, h + 1.75, z], '#738d93');
            body.quad([-len * .5, h + 1.75, z], [len * .5, h + 1.75, z], [len * .5, h + .15, z - spacing * .94], [-len * .5, h + .15, z - spacing * .94], snow);
        }
        body.vessel(w * .33, -d * .27, [[h + .15, .96, .96, p.roof], [h + 4, .78, .78, p.trim], [h + 4.64, .86, .86, p.roof]], 8);
    }
    else if (kind === 'station') {
        attach(side, 0, 3.36, .58, frontSpan * .79, .21, 1.30, p.trim);
        body.box(0, h + .77, 0, w * .47, 1.33, d * .41, p.roof);
        body.box(0, h + 1.50, 0, w * .48, .14, d * .42, snow);
    }
    else if (!isContainer) {
        body.box(w * .13, h + .4, 0, w * .51, .55, d * .20, p.roof);
        if (which % 2)
            trim.vessel(-w * .25, 0, [[h + .05, .78, .78, p.roof], [h + 1.14, .68, .68, lintel], [h + 1.36, .88, .88, snow]], 8);
    }
    if (name) {
        const y = Math.min(h - 1.05, home ? 3.92 : h * .72), width = Math.min(frontSpan * .78, Math.max(4.1, name.length * .57));
        const sn = Math.sin(frontAngle), cs = Math.cos(frontAngle), offset = (side % 2 ? w : d) * .5 + .18;
        text.frontage(offset * sn, y, offset * cs, width, Math.min(1.63, width * .22), frontAngle, '#ffffff', atlas.captions.get(name));
    }
}
const writers = (detail) => ({
    body: new region_architecture_mesh_js_1.Masonry(!detail), trim: new region_architecture_mesh_js_1.Masonry(detail), walls: new region_architecture_mesh_js_1.Masonry(!detail),
    text: new region_architecture_mesh_js_1.Masonry(detail), glow: new region_architecture_mesh_js_1.Masonry(!detail)
});
function addRegionalArchitecture(parent) {
    const names = new Map();
    region_layout_js_1.regionBuildings.forEach((s, i) => {
        const label = labelFor(s, i);
        if (label)
            names.set(label, s.district);
    });
    for (const s of region_layout_js_1.regionSites)
        names.set(s.label, s.id);
    const atlas = (0, region_architecture_atlas_js_1.regionalAtlas)(names);
    const masonry = new THREE.MeshLambertMaterial({ vertexColors: true });
    const glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const court = (0, outer_court_art_js_1.courtAtlas)();
    const walls = new THREE.MeshBasicMaterial({ vertexColors: true, map: atlas.wallMap });
    const letters = new THREE.MeshBasicMaterial({ vertexColors: true, map: atlas.signMap });
    const plans = new Map();
    function plan(x, z, draw) {
        const key = Math.floor(x / 72) + '/' + Math.floor(z / 72);
        let batch = plans.get(key);
        if (!batch) {
            batch = [];
            plans.set(key, batch);
        }
        batch.push(g => {
            for (const writer of [g.body, g.trim, g.walls, g.text, g.glow]) {
                writer.ox = x;
                writer.oz = z;
            }
            draw(g);
        });
    }
    region_layout_js_1.regionBuildings.forEach((s, i) => {
        const label = labelFor(s, i);
        plan(s.x, s.z, g => regular(s, i, label, g, atlas));
    });
    for (const s of region_layout_js_1.regionSites) {
        const tile = atlas.captions.get(s.label);
        const face = atlas.facades.get(s.id + 'works');
        plan(s.x, s.z, g => region_landmarks_js_1.landmarkArt[s.id](g.body, g.trim, (x, y, z, w, h, a = 0) => g.text.frontage(x, y, z, w, h, a, '#ffffff', tile), (x, y, z, w, h, a = 0) => g.walls.frontage(x, y, z, w, h, a, '#e3e7e0', face), g.glow));
    }
    for (const p of outer_site_layout_js_1.outerSiteProps)
        plan(p.x, p.z, g => (0, outer_landmarks_js_1.outerProp)(p, g.body, g.trim, g.glow));
    const courts = new Map();
    for (const s of region_layout_js_1.regionSites) {
        if (!Object.hasOwn(outer_site_layout_js_1.outerSiteCourts, s.id))
            continue;
        const key = Math.floor(s.x / 72) + '/' + Math.floor(s.z / 72);
        const list = courts.get(key) ?? [];
        list.push(court(s.id));
        courts.set(key, list);
    }
    const compiled = [];
    for (const [key, batch] of plans) {
        const g = writers(false);
        for (const draw of batch)
            draw(g);
        const group = new THREE.Group(), detail = new THREE.Group();
        group.name = 'Застройка · ' + key;
        group.userData.regionalCell = true;
        detail.name = 'Детали квартала · ' + key;
        detail.userData.dynamicScenery = true;
        detail.visible = false;
        group.add(detail);
        const bounds = new THREE.Box3();
        for (const m of [g.body.mesh(masonry), g.walls.mesh(walls), g.glow.mesh(glow), ...(courts.get(key) ?? [])])
            if (m) {
                group.add(m);
                bounds.union(m.geometry.boundingBox);
            }
        bounds.expandByScalar(3);
        parent.add(group);
        compiled.push({ group, detail, bounds, plans: batch, trim: null, signs: null, baked: false });
    }
    function bake(cell) {
        const g = writers(true);
        for (const draw of cell.plans)
            draw(g);
        cell.trim = g.trim.mesh(masonry);
        cell.signs = g.text.mesh(letters);
        cell.baked = true;
        if (cell.trim)
            cell.detail.add(cell.trim);
        if (cell.signs)
            cell.detail.add(cell.signs);
    }
    function discard(cell) {
        for (const mesh of [cell.trim, cell.signs])
            if (mesh)
                mesh.geometry.dispose();
        cell.trim = cell.signs = null;
        cell.baked = false;
        cell.detail.clear();
    }
    const pos = new THREE.Vector3(), forward = new THREE.Vector3(), ahead = new THREE.Vector3();
    const projection = new THREE.Matrix4(), frustum = new THREE.Frustum();
    const queue = [];
    return (camera) => {
        pos.setFromMatrixPosition(camera.matrixWorld);
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        ahead.copy(pos).addScaledVector(forward, 86);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projection);
        queue.length = 0;
        for (const cell of compiled) {
            const { bounds, group, detail } = cell, distance = bounds.distanceToPoint(pos);
            group.visible = distance < 315 && frustum.intersectsBox(bounds);
            detail.visible = group.visible && distance < 176;
            if (cell.baked && distance > 224) {
                discard(cell);
                continue;
            }
            if (!cell.baked) {
                const approaching = bounds.distanceToPoint(ahead) < 84 && distance < 208;
                if (distance < 126 || detail.visible || approaching)
                    queue.push({ cell, priority: Math.min(distance, bounds.distanceToPoint(ahead) + 47) });
            }
            if (cell.trim)
                cell.trim.visible = detail.visible && distance < 118;
            if (cell.signs)
                cell.signs.visible = detail.visible;
        }
        queue.sort((a, b) => a.priority - b.priority);
        for (const { cell } of queue.slice(0, 3)) {
            bake(cell);
            if (cell.trim)
                cell.trim.visible = cell.detail.visible && cell.bounds.distanceToPoint(pos) < 118;
            if (cell.signs)
                cell.signs.visible = cell.detail.visible;
        }
    };
}
