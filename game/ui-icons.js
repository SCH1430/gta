"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logo = void 0;
exports.ico = ico;
const lines = {
    signal: '<path d="M3 17v3m5-7v7m5-11v11m5-15v15"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10 5h4m-3 13.5h2"/>',
    pause: '<path d="M8 5v14m8-14v14" stroke-width="3"/>',
    play: '<path d="m8 5 10 7-10 7z"/>',
    map: '<path d="m2.5 5 6-2 7 3 6-2v15l-6 2-7-3-6 2zm6-2v15m7-12v15"/>',
    cross: '<path d="m6 6 12 12M18 6 6 18"/>',
    settings: '<path d="M3 7h6m6 0h6M3 17h10m6 0h2"/><circle cx="12" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    jump: '<path d="M5 19h13m-9-4 5-9m-5 2 5-3 2 5"/>',
    run: '<circle cx="15.5" cy="4.4" r="1.7"/><path d="m7 10 4-3 4 2 3.7 2m-4.2-2-3 6-4 6m5-9 3 3 1.5 5M4 15h3"/>',
    car: '<path d="M3 14v-3l3-1 2.4-4h7l3 4 2 .7 1.2 2.3v3h-3m-12 0h-3v-2m6 2h6.5m-10-6h13"/><circle cx="7.5" cy="16.3" r="2"/><circle cx="16.8" cy="16.3" r="2"/>',
    action: '<path d="M12 20h7V4h-7M4 12h11m-4-4 4 4-4 4"/>',
    mapPin: '<path d="m12 3 8 9-8 9-8-9z"/><circle cx="12" cy="12" r="2"/>',
    radio: '<path d="m6 7 11-4M2.5 8h19v12h-19zM6 12h5m-5 4h3"/><circle cx="16.5" cy="14.5" r="2.5"/>',
    light: '<path d="M13 5c-5 0-8 3-8 7s3 7 8 7zm3 2 4-2m-4 6 5-1m-5 5h5m-5 3 4 1"/>',
    horn: '<path d="m3 10 7-1 7-5v15l-7-5-7-.5zm5 4 2 5h3m7-10q3 2 0 5"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="m4 9 6 2m10-2-6 2m-2 3v6"/>',
    brake: '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="m7 13 2-3m2 3 2-3m2 3 2-3"/>',
    gas: '<path d="M10 3h5l2 15-2 3H9l-1-3zm2 3v9"/>',
    hand: '<circle cx="12" cy="12" r="6"/><path d="M4 5a11 11 0 0 0 0 14m16-14a11 11 0 0 1 0 14M12 8v5m0 2v1"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    compass: '<path d="m12 2 5 17-5-3-5 3z"/>',
    garage: '<path d="m3 9 9-6 9 6v12H3zm4 12V10h10v11M7 14h10m-10 3h10"/>',
    save: '<path d="M3 3h15l3 3v15H3zm4 0v7h9V3M7 21v-7h10v7"/>',
    sound: '<path d="M3 9h4l5-5v16l-5-5H3zm13-1q5 4 0 8m3-11q8 7 0 14"/>',
    checkpoint: '<path d="M5 20V4m1 1 8-2 5 3-2 6-5-2-6 2"/>',
    arrows: '<path d="m8 9-4 4 4 4m8-8 4 4-4 4m-12-4h16"/>',
    waypoint: '<path d="m12 1 10 11-10 11L2 12z"/><path d="m12 8 3 4-3 4-3-4z" fill="currentColor" stroke="none"/>',
    chat: '<path d="M3 4h18v13H9l-5 4v-4H3zm5 5h8m-8 4h5"/>',
    mirror: '<rect x="2" y="7" width="20" height="10" rx="4"/><path d="m5 14 4-4m0 4 4-4m-1-3V4"/>',
    route: '<circle cx="6.5" cy="17.5" r="2.5"/><path d="M9 17.5h5a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6m-2.5-3 3.5 3-3.5 3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6v6l4 2"/>',
    full: '<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',
    mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 3v6"/>',
    mapZoom: '<path d="M4 10V4h6m4 0h6v6m0 4v6h-6"/><path d="m13 11 6-6M3 21l6-6"/>',
    tool: '<path d="M15 3a5 5 0 0 0-6 6L3 16q-2 3 1 4l8-7a5 5 0 0 0 7-6l-4 3-2-3z"/>',
    left: '<path d="m14.5 4-8 8 8 8"/>',
    right: '<path d="m9.5 4 8 8-8 8"/>',
    warn: '<path d="m12 3 10 18H2zM12 9v5m0 3h.01"/>',
};
function ico(name, size = 20) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${lines[name] ?? ''}</svg>`;
}
exports.logo = '<svg aria-hidden="true" viewBox="0 0 37 36" width="37" height="36" fill="currentColor"><path d="M0 0h10v15L23 0h12L19 18l16 18H22L10 21v15H0z"/><path fill="#e8a34c" d="M28 19h8v8z"/></svg>';
