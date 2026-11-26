"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linesByPhoto = void 0;
exports.photoLines = photoLines;
exports.oldPhotoGraphic = oldPhotoGraphic;
const story_map_js_1 = require("./story-map.js");
function photoLines(index) {
    if (index === 0) {
        const lines = [];
        for (const side of [-1, 1])
            for (const end of [-1, 1]) {
                lines.push([[80 + 4.4 * side, 0, 97 + 3.08 * end], [80 + 4.4 * .68 * side, 14, 97 + 3.08 * .72 * end]]);
                lines.push([[80 + 4.4 * side, 1.7, 97 + 3.08 * end], [80 - 4.4 * .72 * side, 13, 97 + 3.08 * .72 * end]]);
            }
        for (const s of [-.72, .72]) {
            lines.push([[80 + s, 16, 100], [80 + s, 19, 84.6], [80 + s, 19.73, 84.6], [80 + s, 18.52, 99.9]]);
        }
        lines.push([[80, 19.2, 84.6], [80, 10.85, 84.6]]);
        lines.push([[75.5, 14.7, 93.92], [84.5, 14.7, 93.92], [84.5, 14.7, 100.08], [75.5, 14.7, 100.08], [75.5, 14.7, 93.92]]);
        return lines;
    }
    const lines = [];
    const shapes = [[0, .93], [.13, 1], [.28, .83], [.50, .65], [.70, .56], [.86, .57], [1, .63]];
    for (const [x, h] of [[-25, 25], [23, 23]]) {
        for (const [fraction, k] of shapes.filter(p => p[0] === 1 || p[0] === .13)) {
            lines.push(Array.from({ length: 25 }, (_, i) => [x + 8 * k * Math.cos(i * Math.PI / 12), h * fraction, -94 + 8 * k * Math.sin(i * Math.PI / 12)]));
        }
        const p = story_map_js_1.jobPlaces.photoB, angle = Math.atan2(p.z + 94, p.x - x) + Math.PI * .5;
        for (const edge of [-1, 1])
            lines.push(shapes.map(([f, k]) => [x + edge * 8 * k * Math.cos(angle), f * h, -94 + edge * 8 * k * Math.sin(angle)]));
    }
    return lines;
}
exports.linesByPhoto = [photoLines(0), photoLines(1)];
function oldPhotoGraphic(n) {
    const ref = story_map_js_1.oldPhotos[n], site = story_map_js_1.jobPlaces[ref.at], co = Math.cos(ref.heading), si = Math.sin(ref.heading);
    function project([x, y, z]) {
        const dx = x - site.x, dz = z - site.z, depth = -dx * si - dz * co;
        return (110 + (dx * co - dz * si) * 160 / depth).toFixed(1) + ' ' + (88 - (y - 1.65) * 150 / depth).toFixed(1);
    }
    const paths = exports.linesByPhoto[n].map(line => '<path d="M' + line.map(project).join('L') + '"/>').join('');
    const lines = exports.linesByPhoto[n], fill = n === 0 ? '' : '<g fill="#807967" opacity=".88">' + [0, 4].map(i => '<path d="M' + [...lines[i + 2], ...lines[i + 3].slice().reverse()].map(project).join('L') + 'Z"/>').join('') + '</g>';
    const grain = Array.from({ length: 310 }, (_, i) => {
        const x = (i * 3677 + 251) % 220, y = (i * i * 23 + i * 173 + 1) % 119;
        return 'M' + x + ' ' + y + 'h' + (i % 11 === 0 ? '1.8' : '.46');
    }).join('');
    return `<svg class="k-job-photo" viewBox="0 0 220 120" aria-label="Архивный снимок · ${ref.title}"><defs><linearGradient id="kfilm" x2=".23" y2="1"><stop stop-color="#8a8d84"/><stop offset=".7" stop-color="#cfc3a9"/><stop offset="1" stop-color="#bfb195"/></linearGradient><radialGradient id="klens"><stop offset=".5" stop-color="#493829" stop-opacity="0"/><stop offset="1" stop-color="#534838" stop-opacity=".34"/></radialGradient></defs><rect width="220" height="120" fill="url(#kfilm)"/><path d="M0 83l11 1 5-4h12l3 4 19 1 7-4 13 1 4-5 10-1 4 5 9 1 4 4 19-1 6-5 14 1 3-3 8 1 5 5h17l4-3 9 1 4 4 12-2 4 1 9-3 8 2v30H0" fill="#8f8c7e"/><path d="M0 91Q60 88 130 92T220 91V120H0" fill="#a59b86"/>${fill}<g stroke="#535347" stroke-width="1.25" fill="none">${paths}</g><g stroke="#e7dac4" stroke-width=".75" opacity=".48"><path d="${grain}"/></g><rect width="220" height="120" fill="url(#klens)"/><path d="M2 12V2h10m196 0h10v10m0 96v10h-10M12 118H2v-10" fill="none" stroke="#f3ecd9"/><text x="8" y="112" fill="#403d33" font-size="8" font-family="monospace">АРХИВ КАНАЛЬНОГО  /  ${ref.year}</text></svg>`;
}
