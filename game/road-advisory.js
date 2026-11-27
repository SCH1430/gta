"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadAhead = roadAhead;
exports.createRoadAdvisory = createRoadAdvisory;
const weather_js_1 = require("./weather.js");
const style = `
.k-road-advice{position:absolute;z-index:4;left:50%;top:26%;transform:translateX(-50%);display:flex;align-items:center;
gap:7px;max-width:min(78vw,350px);padding:5px 10px 5px 8px;pointer-events:none;border-radius:7px;
border:1px solid #ffca8b9c;background:#18212dda;color:#ffe2b8;font:600 calc(12px * var(--k-caption,1))/1.25 K77Body,system-ui}
.k-road-advice i{color:#141c25;background:#ffc279;border-radius:4px;font-style:normal;font-weight:800;display:grid;place-items:center;min-width:17px;height:17px}
.k-road-advice[hidden],.k-modal-on .k-road-advice{display:none}
@media(max-height:460px){.k-road-advice{top:23%;max-width:59vw;padding-block:4px}}
`;
function roadAhead(c, weather, crossing) {
    if (crossing)
        return 'Грузовой переезд закрыт';
    if (weather.roadIce < .23)
        return '';
    const reverse = c.speed < -.75 ? -1 : 1;
    const range = Math.max(11, Math.min(34, 9 + Math.abs(c.speed) * 1.35));
    let x = c.x, z = c.z, yaw = c.yaw;
    for (let depth = 0; depth <= range; depth += 1.75) {
        if ((0, weather_js_1.roadIceAt)(x, z, weather) > .30) {
            const road = weather_js_1.frozenRoads.find(p => Math.abs(p.x - x) < p.along + 1 && Math.abs(p.z - z) < p.along + 1);
            return road ? 'Наледь · ' + road.name : 'Наледь';
        }
        yaw -= Math.max(-.026, Math.min(.026, c.steer * .035)) * reverse;
        x -= Math.sin(yaw) * 1.75 * reverse;
        z -= Math.cos(yaw) * 1.75 * reverse;
    }
    return '';
}
function createRoadAdvisory(host) {
    const css = document.createElement('style');
    css.textContent = style;
    document.head.append(css);
    const node = document.createElement('aside');
    node.className = 'k-road-advice';
    node.hidden = true;
    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';
    const text = document.createElement('span');
    text.setAttribute('role', 'status');
    node.append(icon, text);
    host.append(node);
    return (value) => {
        node.hidden = !value;
        if (text.textContent !== value)
            text.textContent = value;
    };
}
