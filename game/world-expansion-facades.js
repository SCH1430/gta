"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workFacade = workFacade;
const world_textures_js_1 = require("./world-textures.js");
const schemes = {
    brick: ['#916e63', '#493e3b', '#c29c77'], hotel: ['#7b8491', '#4c5667', '#bec1be'],
    plant: ['#727e82', '#46545f', '#b6a084'], warehouse: ['#687b82', '#3d535d', '#a4b3b5'],
    station: ['#818d8d', '#495861', '#c5c0a8'], dock: ['#95847a', '#695e59', '#d1bd9b']
};
function workFacade(kind, columns, stories, seed) {
    const img = document.createElement('canvas');
    img.width = Math.min(864, columns * 96);
    img.height = Math.min(464, stories * 85 + 50);
    const c = img.getContext('2d'), w = img.width, h = img.height, rnd = (0, world_textures_js_1.random)(seed), k = kind;
    const [base, shadow, edge] = schemes[k] ?? schemes.warehouse;
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    function rect(x, y, ww, hh, col) { c.fillStyle = col; c.fillRect(x, y, ww, hh); }
    const stone = kind === 'brick' || kind === 'dock', industrial = kind === 'plant' || kind === 'station';
    if (stone) {
        for (let y = 0, row = 0; y < h; y += 7, row++) {
            rect(0, y, w, 1, 'rgba(43,46,49,.30)');
            for (let x = row % 2 * -10; x < w; x += 21) {
                rect(x, y, 1, 7, 'rgba(45,43,42,.31)');
                if (rnd() > .43)
                    rect(x + 1, y + 1, 19, 5, rnd() > .5 ? 'rgba(247,184,137,.12)' : 'rgba(47,54,57,.10)');
            }
        }
    }
    else if (kind === 'warehouse' || kind === 'plant') {
        for (let x = 0; x < w; x += 7) {
            rect(x, 0, 2, h, 'rgba(30,46,57,.23)');
            rect(x + 2, 0, 1, h, 'rgba(207,219,211,.23)');
        }
    }
    else {
        for (let y = 0; y < h; y += h / stories)
            rect(0, y, w, 2, 'rgba(44,58,67,.40)');
        for (let x = 0; x < w; x += w / columns)
            rect(x, 0, 1.7, h, 'rgba(37,48,57,.34)');
    }
    for (let i = 0; i < 900; i++)
        rect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 2, rnd() > .55 ? 'rgba(38,48,48,.13)' : 'rgba(206,208,187,.13)');
    const cw = w / columns, ch = (h - 20) / stories;
    for (let row = 0; row < stories; row++)
        for (let col = 0; col < columns; col++) {
            const x = (col + .5) * cw, y = (row + .51) * ch, ww = cw * (industrial ? .77 : kind === 'warehouse' ? .59 : .58), hh = ch * (industrial ? .61 : kind === 'warehouse' ? .37 : .53);
            rect(x - ww / 2 - 3, y - hh / 2 - 3, ww + 6, hh + 7, 'rgba(41,44,48,.62)');
            rect(x - ww / 2, y - hh / 2, ww, hh, rnd() > .67 ? '#a8a599' : '#546675');
            const panes = industrial ? 4 : 2, rows = industrial ? 2 : 1;
            for (let j = 0; j < panes; j++)
                for (let m = 0; m < rows; m++) {
                    const px = x - ww / 2 + j * ww / panes + 1.5, py = y - hh / 2 + m * hh / rows + 1.5, pw = ww / panes - 3, ph = hh / rows - 3;
                    const lit = rnd() > (industrial ? .48 : .57);
                    const grad = c.createLinearGradient(px, py, px, py + ph);
                    if (lit) {
                        grad.addColorStop(0, rnd() > .46 ? '#e9bf7a' : '#d9cbb1');
                        grad.addColorStop(.49, '#c6a479');
                        grad.addColorStop(1, '#9c8271');
                    }
                    else {
                        grad.addColorStop(0, '#506875');
                        grad.addColorStop(.5, '#43505d');
                        grad.addColorStop(1, '#313e49');
                    }
                    c.fillStyle = grad;
                    c.fillRect(px, py, pw, ph);
                    if (lit && rnd() > .4)
                        rect(px, py, pw * (.25 + .28 * rnd()), ph, 'rgba(76,72,70,.42)');
                    if (rnd() > .52)
                        rect(px, py + ph * .75, pw, .8, '#9aaba9');
                }
            rect(x - ww / 2 - 4, y + hh / 2 + 1, ww + 8, 2.2, edge);
            if (stone)
                rect(x - ww / 2 - 5, y - hh / 2 - 5, ww + 10, 3, '#bd9980');
            if (rnd() > .79)
                rect(x - ww / 2, y + hh / 2 + 3, 1.8, Math.min(21, ch * .4), 'rgba(39,49,58,.32)');
        }
    rect(0, h - 14, w, 14, shadow);
    for (let x = 3; x < w; x += cw) {
        rect(x, h - 11, cw * .38, 4, '#424c50');
        rect(x + 1, h - 11, 1, 4, edge);
    }
    rect(0, 0, w, 4, edge);
    rect(0, 4, w, 4, shadow);
    return (0, world_textures_js_1.texture)(img);
}
