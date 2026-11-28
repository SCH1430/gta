"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streetLabels = exports.lifeStops = exports.mapSegment = void 0;
exports.streetPlan = streetPlan;
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const region_layout_js_1 = require("./region-layout.js");
const world_railway_js_1 = require("./world-railway.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const city_life_layout_js_1 = require("./city-life-layout.js");
const house_layout_js_1 = require("./house-layout.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const n = (v) => Number(v.toFixed(2));
const mapSegment = (r) => `M${n(r.x1)} ${n(r.z1)}L${n(r.x2)} ${n(r.z2)}`;
exports.mapSegment = mapSegment;
const box = (b) => `M${n(b.x - b.w / 2)} ${n(b.z - b.d / 2)}h${n(b.w)}v${n(b.d)}h${-n(b.w)}Z`;
const escape = (v) => v.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const { minX, maxX, minZ, maxZ } = world_expansion_layout_js_1.cityLimits;
const centerLabels = [{ ...world_layout_js_1.places.market, label: 'Рынок' }, { ...world_layout_js_1.places.depot, label: 'Депо' }, { ...world_layout_js_1.places.garage, label: 'Гараж' }, { ...house_layout_js_1.houseEntry, label: 'Дом № 23' }];
exports.lifeStops = [
    ...exploration_layout_js_1.serviceEntries.map(id => ({ ...exploration_layout_js_1.entrances[id], area: 'Помещение' })),
    { ...exploration_layout_js_1.passageFront, label: 'Сквозной подъезд', area: 'Панельные дворы' },
    ...market_quarter_layout_js_1.quarterAttractions,
    ...cargo_rail_js_1.cargoCrossings.map(c => ({ ...c.look, label: c.name, area: 'Грузовая ветка' })),
    { x: cargo_rail_js_1.cargoFootbridge.x, z: cargo_rail_js_1.cargoFootbridge.north, label: 'Пешеходный мосток на лёд', area: 'Портовый переезд' },
    ...city_life_layout_js_1.roadStops.map(stop => ({ x: stop.x + Math.sin(stop.yaw) * 3.1, z: stop.z + Math.cos(stop.yaw) * 3.1, area: 'Остановка', label: stop.title })),
];
exports.streetLabels = [...region_layout_js_1.regionLandmarks, ...centerLabels, ...world_expansion_layout_js_1.expansionLandmarks, ...exports.lifeStops];
const roads = [...world_expansion_layout_js_1.expansionRoads, ...region_layout_js_1.regionRoads];
function lanes() {
    const byWidth = new Map();
    for (const road of roads) {
        const key = road.width + (road.name.endsWith('обход') ? ':ring' : '');
        let parts = byWidth.get(key);
        if (!parts) {
            parts = [];
            byWidth.set(key, parts);
        }
        parts.push((0, exports.mapSegment)(road));
    }
    return [...byWidth].map(([w, parts]) => `<path d="${parts.join('')}" stroke-width="${n(Number(w.split(':')[0]) * .88)}"${w.endsWith(':ring') ? ' stroke="#b08763"' : ''}/>`).join('');
}
function mapGrid() {
    let path = '';
    const interval = 100;
    for (let x = Math.ceil(minX / interval) * interval; x <= maxX; x += interval)
        path += `M${x} ${minZ}V${maxZ}`;
    for (let z = Math.ceil(minZ / interval) * interval; z <= maxZ; z += interval)
        path += `M${minX} ${z}H${maxX}`;
    return path;
}
const districtText = { radio: ['Радиогорск'], quarry: ['Старый', 'карьер'], water: ['Озёрная', 'слобода'], dock: ['Сухой док'], northpark: ['Северный', 'посёлок'], cargo: ['Западный', 'терминал'], dam: ['Белая', 'плотина'], mill: ['Лесная', 'промзона'] };
function streetPlan(large) {
    const tram = Array.from({ length: Math.ceil(world_railway_js_1.trackLength / 2) + 1 }, (_, i) => { const p = (0, world_railway_js_1.railAt)(Math.min(i * 2, world_railway_js_1.trackLength)); return (i ? 'L' : 'M') + n(p.x) + ' ' + n(p.z); }).join(' ');
    const trail = (route) => route.map((p, i) => (i ? 'L' : 'M') + n(p.x) + ' ' + n(p.z)).join('');
    const named = exports.streetLabels.map(p => `<g transform="translate(${p.x} ${p.z})"><circle r="1.5" fill="#eeb96e" stroke-width=".45"/><text y="-4">${escape(p.label)}</text></g>`).join('');
    const overview = region_layout_js_1.regionSites.map(s => ({ x: s.x, z: s.z, lines: districtText[s.id] ?? [region_layout_js_1.regionDistrictNames[s.district]], label: region_layout_js_1.regionLandmarks.find(l => l.x === s.stop.x && l.z === s.stop.z)?.label }));
    overview.push({ x: 0, z: -76, lines: ['Канальный', 'район'], label: 'Трамвайное депо' });
    const districts = overview.map(({ x, z, lines, label }, index) => `<g transform="translate(${x} ${z})" ${label ? `data-map-place="${escape(label)}" data-sector="${index >= 4 && index < region_layout_js_1.regionSites.length ? "outer" : "inner"}"` : ''}><text>${lines.map((s, i) => `<tspan x="0" dy="${i ? '1.04em' : '0'}">${escape(s)}</tspan>`).join('')}</text></g>`).join('');
    const roadNames = roads.filter(r => Math.hypot(r.x2-r.x1,r.z2-r.z1) > 50).map(r => {
        const x=(r.x1+r.x2)/2, z=(r.z1+r.z2)/2, vertical=Math.abs(r.z2-r.z1)>Math.abs(r.x2-r.x1);
        return `<text transform="translate(${x} ${z}) rotate(${vertical ? -90 : 0})">${escape(r.name)}</text>`;
    }).join('');
    const numbers = world_layout_js_1.apartments.map(a => `<text x="${a.x}" y="${a.z+1.3}">${a.id}</text>`).join('');
    const stops = Object.values(world_railway_js_1.tramStops);
    const stopSigns = stops.filter(p => Number.isFinite(p.x)).map(p => `<g transform="translate(${p.x} ${p.z})"><rect x="-1.4" y="-1.4" width="2.8" height="2.8" rx=".3"/><text y=".9">Т</text></g>`).join('');
    return `<rect x="${minX}" y="${minZ}" width="${maxX - minX}" height="${maxZ - minZ}" fill="#d6d4c9" stroke="#65796c"/>
    <path d="${mapGrid()}" fill="none" stroke="#bebdb1" stroke-width=".55"/>
    <rect x="${minX}" y="${world_expansion_layout_js_1.canal.north}" width="${maxX - minX}" height="${world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north}" fill="#9ebac0"/>
    <path d="${[...world_layout_js_1.apartments, ...Object.values(world_layout_js_1.buildings), ...world_expansion_layout_js_1.expansionBuildings, ...region_layout_js_1.regionBuildings].map(box).join('')}" fill="#a99c87" stroke="#7b7367" stroke-width=".57"/>
    <path d="${require("./school-site.js").schoolShell.map(box).join('')}" fill="#a9aba1" stroke="#6e817b" stroke-width=".65"/>
    <path d="${region_layout_js_1.regionSites.map(box).join('')}" fill="#b0a18c" stroke="#896f50" stroke-width="1.25"/>
    <g fill="none" stroke="#f4efdc" stroke-linecap="butt">${lanes()}</g>
    <path d="${roads.map(exports.mapSegment).join('')}" fill="none" stroke="#b2a797" stroke-width=".55" stroke-dasharray="2.4 2"/>
    <path d="${region_layout_js_1.regionPaths.map(exports.mapSegment).join('')}" fill="none" stroke="#6e8171" stroke-width="1.6" stroke-dasharray="2.4 1.8"/>
    <path d="${trail(market_quarter_layout_js_1.quarterWalkRoute) + trail(market_quarter_layout_js_1.quarterChaseWalk)}" fill="none" stroke="#627b6b" stroke-width="1.05" stroke-dasharray="1.3 .62"/>
    <path d="M${market_quarter_layout_js_1.marketIceSlip} 58.5V89.2" fill="none" stroke="#d3b58a" stroke-width="1.12" stroke-dasharray="1.4 .72"/>
    <path d="M${cargo_rail_js_1.cargoTrack.west} ${cargo_rail_js_1.cargoTrack.z}H${cargo_rail_js_1.cargoTrack.east}" fill="none" stroke="#c2a187" stroke-width=".85" stroke-dasharray="1.4 .92"/>
    <path d="M${cargo_rail_js_1.cargoFootbridge.x} ${cargo_rail_js_1.cargoFootbridge.north}V${cargo_rail_js_1.cargoFootbridge.south}" fill="none" stroke="#9bcabe" stroke-width=".9"/>
    <g fill="none" stroke="#728776" stroke-width="1.9"><path d="M-87 43h39l15-14M-18 31v-9l-2-5V-24l11-13h52M-48 0h90M-48-21h41l9-7h17M-2 31V-42M42 47h38"/></g>
    <path d="M-88 14H82" fill="none" stroke="#565d56" stroke-width="1.9"/><path d="${tram}" fill="none" stroke="#d1ab70" stroke-width=".95"/>
    <g stroke="#a8b8aa" stroke-width=".65">${world_expansion_layout_js_1.bridges.map(b => `<path d="M${b.x - 6.7} 58v32m13.4-32v32"/>`).join('')}</g>
    <g transform="translate(${house_layout_js_1.houseEntry.x} ${house_layout_js_1.houseEntry.z})" stroke="#b0e7d1" stroke-width="1.15" fill="#2c594e"><path d="m-3.2-.2 3.2-2.8L3.2-.2V3h-6.4Z"/><path d="M-.5 3V.6H1V3"/></g>
    ${large ? `<g class="k-atlas-print" text-anchor="middle"><g class="k-atlas-addresses">${numbers}</g><g class="k-atlas-street-names">${roadNames}</g><g class="k-atlas-stop-sign">${stopSigns}</g></g><g class="k-atlas-places" text-anchor="middle" font-family="sans-serif" fill="#25322d" paint-order="stroke" stroke="#eae6d9" stroke-linejoin="round">${named}</g><g class="k-atlas-districts" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#333c33" paint-order="stroke" stroke="#eae6d9" stroke-linejoin="round">${districts}</g>` : ''}`;
}
