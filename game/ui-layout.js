"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newLayouts = void 0;
exports.safeLayouts = safeLayouts;
exports.mobileLayout = mobileLayout;
const newLayouts = () => ({ foot: {}, car: {} });
exports.newLayouts = newLayouts;
const allowed = new Set(['stick', 'run', 'jump', 'interact', 'shoulder', 'camera-distance', 'gas', 'brake', 'handbrake', 'left', 'right', 'horn', 'light', 'leaveCar', 'rear']);
function safeLayouts(value) {
    const out = (0, exports.newLayouts)();
    if (!value || typeof value !== 'object')
        return out;
    for (const mode of ['foot', 'car']) {
        const map = value[mode];
        if (!map || typeof map !== 'object')
            continue;
        for (const [name, p] of Object.entries(map)) {
            if (allowed.has(name) && p && Number.isFinite(p.x) && Number.isFinite(p.y))
                out[mode][name] = { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) };
        }
    }
    return out;
}
function mobileLayout(root) {
    const controls = root.querySelectorAll('.k-touch-controls button,.k-stick,.k-interact');
    const modes = { foot: new Map(), car: new Map() };
    for (const el of controls) {
        const key = el.dataset.hold ?? el.dataset.action ?? 'stick';
        el.dataset.dragControl = key;
        if (!el.closest('.k-steer,.k-pedals,.k-car-tools'))
            modes.foot.set(key, el);
        if (!el.closest('.k-foot-actions,.k-foot-tools'))
            modes.car.set(key, el);
    }
    const inset = document.createElement('div');
    inset.className = 'k-safe-frame';
    root.append(inset);
    let pending = null;
    let active = 'foot', modeLayout = (0, exports.newLayouts)(), leftHanded = false;
    function location(el, p) {
        const b = inset.getBoundingClientRect(), hw = el.offsetWidth * .5, hh = el.offsetHeight * .5;
        const bounded = (v, n) => Math.max(n, Math.min(1 - n, v));
        return { x: b.left + b.width * bounded(p.x, hw / Math.max(1, b.width)), y: b.top + b.height * bounded(p.y, hh / Math.max(1, b.height)) };
    }
    function place(el, p) {
        const c = location(el, p);
        el.style.setProperty('--layout-x', c.x + 'px');
        el.style.setProperty('--layout-y', c.y + 'px');
        el.classList.add('k-placed');
    }
    function draw(mode = active, layouts = modeLayout, left = leftHanded) {
        active = mode;
        modeLayout = layouts;
        leftHanded = left;
        root.classList.toggle('k-left-handed', left);
        for (const el of controls)
            el.classList.remove('k-placed');
        for (const [key, el] of modes[mode]) {
            const p = layouts[mode][key];
            if (p)
                place(el, { x: left ? 1 - p.x : p.x, y: p.y });
        }
    }
    function down(e) {
        const el = e.target.closest('[data-drag-control]');
        if (!el || pending || modes[active].get(el.dataset.dragControl) !== el)
            return false;
        const frame = inset.getBoundingClientRect(), profile = modeLayout[active];
        for (const [name, control] of modes[active]) {
            if (profile[name])
                continue;
            const box = control.getBoundingClientRect();
            if (!box.width || !box.height)
                continue;
            const x = (box.left + box.width / 2 - frame.left) / frame.width;
            profile[name] = { x: leftHanded ? 1 - x : x, y: (box.top + box.height / 2 - frame.top) / frame.height };
        }
        draw();
        const b = el.getBoundingClientRect();
        pending = { id: e.pointerId, name: el.dataset.dragControl, el, dx: b.x + b.width / 2 - e.clientX, dy: b.y + b.height / 2 - e.clientY };
        el.setPointerCapture(e.pointerId);
        el.classList.add('k-grabbed');
        e.preventDefault();
        return true;
    }
    function move(e) {
        if (!pending || e.pointerId !== pending.id)
            return;
        const b = inset.getBoundingClientRect(), x = Math.min(1, Math.max(0, (e.clientX + pending.dx - b.left) / b.width)), y = Math.min(1, Math.max(0, (e.clientY + pending.dy - b.top) / b.height));
        place(pending.el, { x, y });
        modeLayout[active][pending.name] = { x: leftHanded ? 1 - x : x, y };
    }
    function end(e) {
        if (pending?.id !== e.pointerId)
            return false;
        pending.el.classList.remove('k-grabbed');
        pending = null;
        return true;
    }
    new ResizeObserver(() => draw()).observe(root);
    return { draw, down, move, end };
}
