const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createUI } = require('../game/ui.js');

function browser(t) {
    const document = new EventTarget();
    const window = new EventTarget();
    window.matchMedia = query => Object.assign(new EventTarget(), { matches: query.includes('pointer: fine') });

    // Model the small subset of DOM used by createUI. Replacing markup detaches its
    // controls and drops focus, just as replacing the dialog's innerHTML does in a browser.
    class Element extends EventTarget {
        constructor(tag) {
            super();
            this.tagName = tag.toUpperCase();
            this.children = [];
            this.attributes = new Map();
            this.dataset = {};
            this.style = { setProperty() {} };
            this.classList = {
                contains: name => (this.className || '').split(' ').includes(name),
                toggle: (name, force) => {
                    const add = force ?? !this.classList.contains(name);
                    const names = new Set((this.className || '').split(' ').filter(Boolean));
                    add ? names.add(name) : names.delete(name);
                    this.className = [...names].join(' ');
                },
                add: name => this.classList.toggle(name, true),
                remove: name => this.classList.toggle(name, false)
            };
        }
        setAttribute(name, value) {
            this.attributes.set(name, value);
            if (name === 'class') this.className = value;
            if (name === 'id') this.id = value;
            if (name === 'hidden' || name === 'disabled') this[name] = true;
            if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
        }
        getAttribute(name) { return this.attributes.get(name) ?? null; }
        hasAttribute(name) { return this.attributes.has(name); }
        get isConnected() { return document.body.contains(this); }
        get offsetWidth() { return this.isConnected && !this.closest('[hidden]') ? 100 : 0; }
        get childElementCount() { return this.children.length; }
        appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
        append(child) { this.appendChild(child); }
        contains(element) { return element === this || this.children.some(child => child.contains(element)); }
        focus() { if (this.offsetWidth && !this.disabled) document.activeElement = this; }
        getClientRects() { return this.offsetWidth ? [{}] : []; }
        closest(selectors) { return this.matches(selectors) ? this : this.parentElement?.closest(selectors) ?? null; }
        matches(selectors) {
            return selectors.split(',').some(selector => {
                const [part, ...ancestors] = selector.trim().split(' ').reverse();
                if (ancestors.length && !this.parentElement?.closest(ancestors.reverse().join(' '))) return false;
                const tag = part.match(/^\w+/)?.[0];
                const name = part.match(/\.([\w-]+)/)?.[1];
                const id = part.match(/#([\w-]+)/)?.[1];
                const attr = part.match(/\[([\w-]+)(?:=["']?([\w-]+)["']?)?\]/);
                if (tag && this.tagName.toLowerCase() !== tag) return false;
                if (name && !this.classList.contains(name)) return false;
                if (id && this.id !== id) return false;
                if (part.includes(':not([disabled])')) return !this.disabled;
                if (part === ':disabled') return !!this.disabled;
                if (attr?.[1] === 'hidden') return !!this.hidden;
                return !attr || (attr[2] === undefined ? this.hasAttribute(attr[1]) : this.getAttribute(attr[1]) === attr[2]);
            });
        }
        querySelectorAll(selectors) {
            return this.children.flatMap(child => [...(child.matches(selectors) ? [child] : []), ...child.querySelectorAll(selectors)]);
        }
        querySelector(selectors) { return this.querySelectorAll(selectors)[0] ?? null; }
        set innerHTML(markup) {
            if (document.activeElement !== this && this.contains(document.activeElement)) document.activeElement = document.body;
            for (const child of this.children) child.parentElement = null;
            this.children = [];
            const parents = [this];
            for (const [, closing, tag, attributes] of markup.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*?)>/gi)) {
                if (closing) {
                    parents.pop();
                    continue;
                }
                const element = new Element(tag);
                for (const [, name, value] of attributes.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) element.setAttribute(name, value ?? '');
                parents.at(-1).appendChild(element);
                if (!attributes.endsWith('/') && !['input', 'br', 'hr'].includes(tag)) parents.push(element);
            }
        }
    }

    document.body = new Element('body');
    document.activeElement = document.body;
    document.createElement = tag => new Element(tag);
    document.createElementNS = (_, tag) => new Element(tag);
    const host = document.body.appendChild(new Element('main'));
    const globals = { document, window, matchMedia: window.matchMedia, ResizeObserver: class { observe() {} } };
    for (const [name, value] of Object.entries(globals)) {
        const previous = Object.getOwnPropertyDescriptor(globalThis, name);
        Object.defineProperty(globalThis, name, { configurable: true, value });
        t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
    }

    const actions = [];
    const ui = createUI(host, action => actions.push(action));
    const root = host.querySelector('.k-ui');
    function dispatch(target, eventTarget, type, fields) {
        const event = new Event(type, { cancelable: true });
        for (const [name, value] of Object.entries({ target, ...fields })) Object.defineProperty(event, name, { value });
        eventTarget.dispatchEvent(event);
        return event.defaultPrevented;
    }
    const key = (code, type = 'keydown') => dispatch(document.activeElement, window, type, { code, key: code === 'Space' ? ' ' : code });
    const click = button => dispatch(button, root, 'click');
    return { ui, root, key, click, actions };
}

test('focused HUD buttons retain Space and Enter while Space stays a gameplay key', t => {
    const { ui, root, key, actions } = browser(t);
    for (const action of ['pause', 'phone', 'map']) {
        root.querySelector(`button[data-action="${action}"]`).focus();
        assert.equal(key('Space'), false, `${action} must retain native Space activation`);
        assert.equal(key('Enter'), false, `${action} must retain native Enter activation`);
    }
    assert.deepEqual(actions, []);

    const view = root.querySelector('.k-look');
    assert.equal(view.getAttribute('tabindex'), '0');
    view.focus();
    assert.equal(key('Space'), true);
    assert.deepEqual(actions, ['jump']);

    ui.update({ driving: true });
    assert.equal(key('Space'), true);
    assert.equal(ui.input.handbrake, true);
    root.querySelector('button[data-action="pause"]').focus();
    key('Space', 'keyup');
    assert.equal(ui.input.handbrake, false);
});

test('closing a dialog opened from the HUD returns focus to the original button', t => {
    const { ui, root, key, click } = browser(t);
    const pause = root.querySelector('button[data-action="pause"]');
    pause.focus();
    click(pause);
    assert.equal(ui.getPanel(), 'pause');
    const map = root.querySelector('.k-dialog-scroll button[data-action="map"]');
    map.focus();
    click(map);
    assert.equal(ui.getPanel(), 'map');
    assert.ok(root.querySelector('.k-dialog').contains(document.activeElement));

    assert.equal(key('Escape'), true);
    assert.equal(ui.getPanel(), null);
    assert.ok(document.activeElement === pause, 'focus returns to the original pause button');
});

test('choosing a map landmark keeps focus on its replacement after redraw', t => {
    const { ui, root, click } = browser(t);
    ui.open('map');
    const selector = 'button[data-map-focus="0"]';
    const landmark = root.querySelector(selector);
    landmark.focus();
    click(landmark);
    const replacement = root.querySelector(selector);

    assert.ok(replacement !== landmark, 'the landmark was redrawn');
    assert.equal(replacement.getAttribute('aria-pressed'), 'true');
    assert.ok(document.activeElement === replacement, 'focus follows the selected landmark');
});

test('activity markers select their Cyrillic label in the atlas', t => {
    const { ui, root, click } = browser(t);
    const label = 'Речной вокзал';
    ui.update({ districtDestinations: [{ x: -5, z: 103.32, label }] });
    ui.open('map');
    const marker = root.querySelector('.k-map-marks [data-map-place]');
    assert.equal(marker.getAttribute('data-map-place'), label);
    click(marker);
    assert.equal(root.querySelector('[data-map-focus="1"]').getAttribute('aria-pressed'), 'true');
});

test('rebinding Space still gives a focused button priority over its gameplay shortcut', t => {
    const { ui, root, key, click } = browser(t);
    ui.open('laptop');
    const bindMap = root.querySelectorAll('button[data-action="bind-key"]').find(button => button.dataset.value === 'KeyM');
    bindMap.focus();
    click(bindMap);
    assert.equal(key('Space'), true);
    assert.equal(ui.settings.bindings.KeyM, 'Space');
    key('Escape');

    root.querySelector('button[data-action="pause"]').focus();
    assert.equal(key('Space'), false);
    assert.equal(ui.getPanel(), null);
    root.querySelector('.k-look').focus();
    assert.equal(key('Space'), true);
    assert.equal(ui.getPanel(), 'map');
});
