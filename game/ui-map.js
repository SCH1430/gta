"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atlasDistrictZoom = exports.zoomWidths = void 0;
exports.mapTemplate = mapTemplate;
exports.paintMap = paintMap;
exports.atlasPlaces = atlasPlaces;
exports.focusAtlas = focusAtlas;
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const region_layout_js_1 = require("./region-layout.js");
const ui_map_streets_js_1 = require("./ui-map-streets.js");
const ui_navigation_js_1 = require("./ui-navigation.js");
const house_layout_js_1 = require("./house-layout.js");
const { minX, maxX, minZ, maxZ } = world_expansion_layout_js_1.cityLimits;
const cityBox = [minX - 4, minZ - 4, maxX - minX + 8, maxZ - minZ + 8].join(' ');
const hb = house_layout_js_1.housePlan.bounds;
const homeBox = [hb.minX - 1, hb.minZ - 1, hb.maxX - hb.minX + 2, hb.maxZ - hb.minZ + 2].join(' ');
const escapeLabel = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const footprint = (b) => `<rect x="${b.x - b.w / 2}" y="${b.z - b.d / 2}" width="${b.w}" height="${b.d}"/>`;
function floorPlan(large) {
    const steps = house_layout_js_1.housePlan.stairs;
    return `<rect x="-12" y="-15" width="36" height="35" fill="#172524"/>
    <rect x="${hb.minX}" y="${hb.minZ}" width="${hb.maxX - hb.minX}" height="${hb.maxZ - hb.minZ}" fill="#304741"/>
    <g stroke="#657e6e" stroke-width=".075">${Array.from({ length: steps.count }, (_, i) => `<path d="M${steps.x1} ${steps.z1 + (steps.z2 - steps.z1) * i / steps.count}H${steps.x2}"/>`).join('')}</g>
    <g fill="#52695c" stroke="#6f8575" stroke-width=".075">${house_layout_js_1.housePlan.furniture.map(footprint).join('')}</g>
    <g fill="none" stroke="#a7b9a6" stroke-width=".18">${house_layout_js_1.housePlan.walls.map(w => `<path d="${(0, ui_map_streets_js_1.mapSegment)(w)}"/>`).join('')}</g>
    <path d="M-1.45 6.99h1.2" stroke="#9de4bd" stroke-width=".30"/>
    ${large ? `<g text-anchor="middle" font-size=".58" font-family="sans-serif" fill="#e6ecda" paint-order="stroke" stroke="#263a33" stroke-width=".17">${house_layout_js_1.housePlan.labels.map(l => `<text x="${l.x}" y="${l.z}">${l.name}</text>`).join('')}</g>` : ''}`;
}
function objectiveOnPlan(state) {
    const target = state.target;
    if (!target || !state.inside)
        return target;
    const b = state.interiorPlan?.bounds ?? house_layout_js_1.housePlan.bounds;
    return target.x >= b.minX && target.x <= b.maxX && target.z >= b.minZ && target.z <= b.maxZ ? target : null;
}
function planBounds(s) {
    const b = s.interiorPlan?.bounds;
    return b ? [b.minX - 1, b.minZ - 1, b.maxX - b.minX + 2, b.maxZ - b.minZ + 2].join(' ') : homeBox;
}
function campusFloor(plan, large) {
    const stairs = require('./campus-layout.js').campus.stairs;
    const colors = { room: '#405951', foyer: '#506459', corridor: '#506459', bridge: '#50675e', landing: '#706b52' };
    const areas = plan.areas.map(a => `<g fill="${colors[a.kind] ?? '#405951'}">${footprint(a)}</g>`).join('');
    const partitions = plan.walls.map(w => `<path d="${(0, ui_map_streets_js_1.mapSegment)(w)}"/>`).join('');
    const flights = stairs.filter(s => s.from === plan.number || s.to === plan.number).map(s => {
        const z = Math.min(s.z1, s.z2), length = Math.abs(s.z2 - s.z1);
        const steps = Array.from({ length: 9 }, (_, i) => `M${s.x1-s.width/2} ${z+(i+.5)*length/9}h${s.width}`).join('');
        return `<rect x="${s.x1-s.width/2}" y="${z}" width="${s.width}" height="${length}" fill="#736c51"/><path d="${steps}" stroke="#dec589" stroke-width=".16"/>`;
    }).join('');
    const wings = require('./campus-layout.js').campus.shell.filter(a => a.kind === 'wing');
    const ink = { west: '#bed6b6', central: '#b6d9ed', east: '#efd1b7' };
    const buildings = large ? wings.map(a => `<text x="${a.x}" y="11.15" fill="${ink[a.wing]}">${a.name.replace(' корпус','').toUpperCase()}</text>`).join('') : '';
    const labels = large ? plan.labels.map(l => `<text x="${l.x}" y="${l.z}" font-size="${Math.min(.93,12/Math.max(l.name.length,1))}">${l.name}</text>`).join('') : '';
    return areas + flights + `<g fill="none" stroke="#b8c7b1" stroke-width=".19">${partitions}</g><g class="k-campus-overview" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="2.15">${buildings}</g><g class="k-campus-labels" display="none" text-anchor="middle" font-family="sans-serif" fill="#eff3e6">${labels}</g>`;
}
function otherFloor(plan, large) {
    if (plan.areas) return campusFloor(plan, large);
    const b = plan.bounds;
    return `<rect x="${b.minX}" y="${b.minZ}" width="${b.maxX - b.minX}" height="${b.maxZ - b.minZ}" fill="#304741"/><g fill="#52695c">${(plan.furniture ?? []).map(footprint).join('')}</g><g fill="none" stroke="#b0c5ab" stroke-width=".16">${plan.walls.map(w => `<path d="${(0, ui_map_streets_js_1.mapSegment)(w)}"/>`).join('')}</g>${large ? `<g text-anchor="middle" font-family="sans-serif" font-size=".6" fill="#e6ecd9">${plan.labels.map(l => `<text x="${l.x}" y="${l.z}">${l.name}</text>`).join('')}</g>` : ''}`;
}
const street = [(0, ui_map_streets_js_1.streetPlan)(false), (0, ui_map_streets_js_1.streetPlan)(true)], home = [floorPlan(false), floorPlan(true)];
function mapTemplate(large = false) {
    return `<svg aria-label="Карта" data-large="${Number(large)}" viewBox="${cityBox}" preserveAspectRatio="xMidYMid ${large ? 'meet' : 'slice'}" class="k-geo"><g class="k-plan"></g><g class="k-map-paths" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g class="k-map-marks"></g><circle class="k-search-circle" r="0" fill="#fe6c58" fill-opacity=".13" stroke="#e38e72" stroke-width=".72" stroke-dasharray="2 2"/><g class="k-police-dots"></g><path class="k-last-contact" d="M-2-2l4 4m0-4-4 4" stroke="#ffac84" stroke-width="1" style="display:none"/><g class="k-map-edge" style="display:none" fill="#ffca7d" stroke="#182921" stroke-width=".8"><path d="M0-5 3.7 3 0 1-3.7 3Z"/></g><g class="k-map-target" fill="#eaaa50" stroke="#151b18" stroke-width="1.1"><g class="k-map-symbol"><path d="m0-4.7 4.3 4.7L0 4.7-4.3 0Z"/><circle r="1.2" fill="#222a24" stroke="none"/></g></g><g class="k-map-player"><g class="k-map-symbol"><circle r="6" fill="#7ae6d1" opacity=".14"/><path d="M0-5.5 4.4 4.4 0 2.9-4.4 4.4Z" fill="#99ead4" stroke="#152923" stroke-width="1.05"/></g></g></svg>`;
}
const routesShown = new WeakMap();
const pinsShown = new WeakMap();
function paintMap(svg, state) {
    const one = (s) => svg.querySelector(s);
    const inside = !!state.inside, large = svg.dataset.large === '1', mode = inside ? (state.interiorId ?? 'house') : 'street';
    if (svg.dataset.mode !== mode) {
        one('.k-plan').innerHTML = inside && state.interiorPlan && mode !== 'house' ? otherFloor(state.interiorPlan, large) : (inside ? home : street)[Number(large)];
        svg.dataset.mode = mode;
        svg.setAttribute('aria-label', inside ? 'План · ' + (state.interiorPlan?.name ?? 'Канальная, 23') : 'Карта города');
    }
    const h = inside ? 10 : 68, w = inside ? 16 : svg.clientWidth && svg.clientHeight ? h * svg.clientWidth / svg.clientHeight : 114;
    const cx = inside ? state.x : Math.max(minX + w / 2, Math.min(maxX - w / 2, state.x));
    const cz = inside ? state.z : Math.max(minZ + h / 2, Math.min(maxZ - h / 2, state.z));
    svg.setAttribute('viewBox', large ? (inside ? planBounds(state) : cityBox) : `${(cx - w / 2).toFixed(2)} ${(cz - h / 2).toFixed(2)} ${w} ${h}`);
    const scale = inside ? (large ? (state.interiorPlan?.areas ? .43 : .13) : .115) : (large ? 1.05 : .68);
    one('.k-map-player').setAttribute('transform', `translate(${state.x.toFixed(2)} ${state.z.toFixed(2)}) rotate(${(-state.heading * 180 / Math.PI).toFixed(1)}) scale(${scale})`);
    const target = one('.k-map-target'), goal = (!inside && state.destination) || objectiveOnPlan(state) || (inside ? (require('./campus-layout.js').wayOutFrom(state.interiorPlan, state.x, state.z) ?? state.interiorPlan?.entrance ?? house_layout_js_1.housePlan.entrance) : null);
    target.style.display = goal ? '' : 'none';
    if (goal)
        target.setAttribute('transform', `translate(${goal.x} ${goal.z}) scale(${scale})`);
    const edge = one('.k-map-edge');
    edge.style.display = 'none';
    if (goal && !inside && !large) {
        const dx = goal.x - state.x, dz = goal.z - state.z, west = cx - w / 2 + 3.4, east = cx + w / 2 - 3.4, north = cz - h / 2 + 3.4, south = cz + h / 2 - 3.4;
        if (goal.x < west || goal.x > east || goal.z < north || goal.z > south) {
            const ratio = Math.max(0, Math.min(dx ? (dx > 0 ? east - state.x : west - state.x) / dx : Infinity, dz ? (dz > 0 ? south - state.z : north - state.z) / dz : Infinity, 1));
            const x = Math.max(west, Math.min(east, state.x + dx * ratio)), z = Math.max(north, Math.min(south, state.z + dz * ratio));
            edge.style.display = '';
            edge.setAttribute('transform', `translate(${x.toFixed(2)} ${z.toFixed(2)}) rotate(${Math.atan2(dx, -dz) * 180 / Math.PI}) scale(.78)`);
        }
    }
    const paths = one('.k-map-paths'), route = inside ? null : state.route;
    if (routesShown.get(paths) !== route) {
        routesShown.set(paths, route);
        const line = (points, color, dash = '') => points.length ? `<path d="${points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.z.toFixed(2)).join(' ')}" stroke="${color}" stroke-width="${large ? 2 : 1.4}" vector-effect="non-scaling-stroke" stroke-dasharray="${dash}"/>` : '';
        paths.innerHTML = route ? line(route.path, route.mode === 'drive' ? '#efa959' : '#99dfcb', route.mode !== 'drive' ? '.4 3' : '') + line(route.lastMile, '#99dfcb', '.4 3') + (route.tram ? line(route.tram,'#f4cf7a') + route.tram.filter((p,i)=>i%2===0).map(p=>`<path d="M-1.25 0H1.25" transform="translate(${p.x} ${p.z}) rotate(${p.yaw*180/Math.PI})" stroke="#f4cf7a" stroke-width=".45"/>`).join('') : '') : '';
    }
    const pins = one('.k-map-marks'), marks = inside ? undefined : state.marks;
    const destinations = large && !inside ? state.districtDestinations : undefined;
    const previousPins = pinsShown.get(pins);
    if (!previousPins || previousPins.marks !== marks || previousPins.destinations !== destinations) {
        pinsShown.set(pins, { marks, destinations });
        const glyph = { car: 'M-1.9-3.3h3.8l-.45-1.5h-2.85Z', place: 'm0-5 1.5 1.6L0-2l-1.5-1.4Z', return: 'm-.9-4.8 2.3 1.5-2.3 1.5Z' };
        const activities = (destinations ?? []).map(p => `<g transform="translate(${p.x} ${p.z})" data-map-place="${escapeLabel(p.label)}" style="cursor:pointer"><title>${escapeLabel(p.label)}</title><g class="k-map-symbol"><circle r="5" fill="#28362e" stroke="#f1d48d" stroke-width="1.1"/><path d="M0-2.9 2.9 0 0 2.9-2.9 0Z" fill="#f1d48d"/></g></g>`).join('');
        pins.innerHTML = activities + (marks ?? []).map(m => `<g transform="translate(${m.x} ${m.z}) scale(${large ? 1 : .70})" fill="${ui_navigation_js_1.markColors[m.kind]}" stroke="#172923" stroke-width=".8"><title>${escapeLabel(m.label || ui_navigation_js_1.markNames[m.kind])}</title><g class="k-map-symbol"><path d="M0 2.8C-1.5 .6-3.6-1.4-3.6-3.5a3.6 3.6 0 1 1 7.2 0C3.6-1.4 1.5 .6 0 2.8Z"/><path d="${glyph[m.kind]}" fill="#22332b" stroke="none"/></g></g>`).join('');
    }
    const search = one('.k-search-circle');
    search.setAttribute('r', String(inside ? 0 : state.search?.radius ?? 0));
    if (state.search) {
        search.setAttribute('cx', String(state.search.x));
        search.setAttribute('cy', String(state.search.z));
    }
    const contact = one('.k-last-contact');
    contact.style.display = !inside && state.wanted && state.lastContact ? '' : 'none';
    if (state.lastContact)
        contact.setAttribute('transform', `translate(${state.lastContact.x} ${state.lastContact.z})`);
    const dots = one('.k-police-dots'), officers = !inside && state.wanted ? (state.police ?? []) : [];
    while (dots.childElementCount > officers.length)
        dots.lastElementChild?.remove();
    officers.forEach((v, i) => {
        let dot = dots.children[i];
        if (!dot) {
            dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('fill', '#fa8973');
            dot.setAttribute('r', '2.1');
            dots.appendChild(dot);
        }
        dot.setAttribute('cx', v.x.toFixed(1));
        dot.setAttribute('cy', v.z.toFixed(1));
    });
}
const regionalStops = region_layout_js_1.regionLandmarks.map(p => {
    const site = region_layout_js_1.regionSites.find(s => s.stop.x === p.x && s.stop.z === p.z);
    return site ? { ...p, area: region_layout_js_1.regionDistrictNames[site.district] } : p;
});
function atlasPlaces(state) {
    const points = [{ x: state.x, z: state.z, label: 'Моя позиция' }];
    const target = objectiveOnPlan(state);
    if (target)
        points.push({ ...target, label: target.label ?? 'Цель заказа' });
    if (state.inside)
        return [...points, ...(state.interiorPlan?.labels ?? house_layout_js_1.housePlan.labels).map(l => ({ ...l, label: l.name }))];
    const destinations = state.districtDestinations ?? [];
    const names = new Set(destinations.map(place => place.label));
    const landmarks = [...regionalStops, { ...house_layout_js_1.houseEntry, label: 'Дом № 23' }, { ...world_layout_js_1.places.market, label: 'Рынок «Спектр»' }, { ...world_layout_js_1.places.depot, label: 'Трамвайное депо' }, { ...world_layout_js_1.places.garage, label: 'Канальные гаражи' }, ...world_expansion_layout_js_1.expansionLandmarks, ...ui_map_streets_js_1.lifeStops];
    return [...points, ...destinations, ...landmarks.filter(place => !names.has(place.label)), ...(state.marks ?? []).map(m => ({ ...m, label: m.label || ui_navigation_js_1.markNames[m.kind] }))];
}
exports.zoomWidths = [maxX - minX + 8, 1050, 470, 225, 100];
exports.atlasDistrictZoom = 3;
function focusAtlas(svg, state, index, zoom = index < 0 ? 0 : exports.zoomWidths.length - 1, center) {
    if (state.inside) {
        if (state.interiorPlan?.areas) {
            svg.querySelector('.k-campus-labels')?.setAttribute('display', index < 0 ? 'none' : 'inline');
            svg.querySelector('.k-campus-overview')?.setAttribute('display', index < 0 ? 'inline' : 'none');
        }
        if (index < 0) {
            svg.setAttribute('viewBox', planBounds(state));
            return;
        }
        const p = atlasPlaces(state)[index];
        if (p)
            svg.setAttribute('viewBox', state.interiorPlan?.areas ? `${p.x - 10} ${p.z - 7.5} 20 15` : `${p.x - 4.45} ${p.z - 3.7} 8.9 7.4`);
        return;
    }
    const level = Math.max(0, Math.min(exports.zoomWidths.length - 1, zoom));
    const width = exports.zoomWidths[level], height = level === 0 ? maxZ - minZ + 8 : width / (svg.clientWidth && svg.clientHeight ? svg.clientWidth / svg.clientHeight : 1.48);
    const point = center ?? atlasPlaces(state)[index] ?? state;
    const x = Math.max(minX + width / 2, Math.min(maxX - width / 2, point.x)), z = Math.max(minZ + height / 2, Math.min(maxZ - height / 2, point.z));
    svg.setAttribute('viewBox', level === 0 ? cityBox : `${x - width / 2} ${z - height / 2} ${width} ${height}`);
    svg.dataset.zoom = String(level);
    const metresPerPixel = Math.max(width / (svg.clientWidth || 400), height / (svg.clientHeight || 260));
    svg.style?.setProperty('--k-geo-unit', String(metresPerPixel));
    svg.style?.setProperty('--k-geo-label', String(metresPerPixel * (level === 0 ? 11.5 : 10.5)) + 'px');
    svg.style?.setProperty('--k-geo-halo', String(metresPerPixel * 2.6) + 'px');
    if (level === 0)
        return;
    const used = [];
    const font = metresPerPixel * 10.5;
    svg.querySelectorAll?.('.k-atlas-places text').forEach((label, i) => {
        const p = ui_map_streets_js_1.streetLabels[i], half = (p.label.length * .31 + .35) * font;
        const box = { x1: p.x - half, x2: p.x + half, z1: p.z - 4 - font, z2: p.z - 4 + font * .28 };
        const visible = box.x1 >= x - width / 2 && box.x2 <= x + width / 2 && box.z1 >= z - height / 2 && box.z2 <= z + height / 2
            && !used.some(other => box.x1 < other.x2 && box.x2 > other.x1 && box.z1 < other.z2 && box.z2 > other.z1);
        label.style.display = visible ? '' : 'none';
        if (visible)
            used.push(box);
    });
}
