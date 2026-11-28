"use strict";

const { groundHeight } = require('./world-layout.js');
const { createPlaces } = require('./world-life-places.js');
const { createEvents } = require('./world-life-events.js');
const { createDiscoveries } = require('./world-life-discoveries.js');
const { createNeighbors } = require('./world-life-neighbors.js');

function createWorldLife(scene) {
    const modules = {
        places: createPlaces(scene), events: createEvents(scene),
        discoveries: createDiscoveries(scene), neighbors: createNeighbors(scene)
    };
    const entries = Object.entries(modules);
    const sites = entries.flatMap(([key, module]) => module.sites.map(site => ({ ...site, key })));
    const guides = sites.filter(site => site.guide !== false).map(site => {
        const point = site.guidePosition ?? site;
        return [site.label, point.x, point.z, site.guideNote ?? site.note];
    });
    let vista = null;

    function context(c) {
        return {
            ...c, x: c.player.x, y: c.player.y, z: c.player.z, elapsed: c.sim.elapsed,
            yaw: c.follow.yaw, focus: c.player, ground: groundHeight, save: c.persist,
            show: (title, body) => c.choose(title, [{ label: 'Закрыть', run() {} }], body),
            lookout(view) { vista = view ? { view, x: c.player.x, z: c.player.z } : null; }
        };
    }
    function nearby(c, site) {
        return (site.zone ?? 'street') === c.zone && Math.hypot(c.x - site.x, c.z - site.z) <= (site.radius ?? 2.5) &&
            (site.y === undefined || Math.abs(c.y - site.y) <= 1.25);
    }
    function actions(c) {
        if (vista)
            return [{ id: 'exit-lookout', label: 'Спуститься с крана' }];
        if (c.car || c.sim.tramRider.onboard)
            return [];
        const local = context(c);
        return [
            ...sites.filter(site => nearby(local, site)).map(site => ({ id: 'site:' + site.id, label: site.actionLabel ?? site.label })),
            ...entries.flatMap(([key, module]) => (module.actions?.(local) ?? []).map(action => ({ ...action, id: key + ':' + action.id })))
        ];
    }
    return {
        guides, actions,
        get lookout() { return vista?.view ?? null; },
        restore(data) {
            vista = null;
            for (const [key, module] of entries)
                module.restore?.(data?.[key]);
        },
        save() { return Object.fromEntries(entries.map(([key, module]) => [key, module.save?.()])); },
        update(c) {
            const local = context(c);
            if (vista && (c.zone !== 'street' || c.car || c.sim.transition || Math.hypot(local.x - vista.x, local.z - vista.z) > 1.05))
                vista = null;
            for (const [, module] of entries)
                module.update(local);
        },
        act(id, c) {
            if (id === 'exit-lookout') {
                vista = null;
                return;
            }
            const local = context(c), separator = id.indexOf(':'), key = id.slice(0, separator), entry = id.slice(separator + 1);
            if (key !== 'site') {
                modules[key]?.act?.(entry, local);
                return;
            }
            const site = sites.find(item => item.id === entry && nearby(local, item));
            if (!site)
                return;
            if (site.act)
                site.act(local);
            else if (Number.isInteger(site.waitAt) && site.waitAt !== local.minutes) {
                local.choose(site.label, [{ label: 'Подождать до начала', run() {
                    if (!local.waitUntil(site.waitAt))
                        local.notify('Остановитесь в безопасном месте, чтобы подождать.');
                } }, { label: 'Закрыть', run() {} }], site.note);
            } else
                local.show(site.label, site.note);
        }
    };
}

module.exports = { createWorldLife };
