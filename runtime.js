// The browser bundles register CommonJS factories before starting the game.
const KonturModules = (() => {
    const factories = Object.create(null);
    const cache = Object.create(null);

    function load(id) {
        if (cache[id]) return cache[id].exports;
        if (!factories[id]) throw Error('Отсутствует игровой модуль ' + id);
        const module = { exports: {} };
        cache[id] = module;
        function require(path) {
            const parts = id.split('/').slice(0, -1);
            for (const part of path.split('/')) {
                if (part === '..') parts.pop();
                else if (part !== '.') parts.push(part);
            }
            return load(parts.join('/'));
        }
        try {
            factories[id](require, module, module.exports);
            return module.exports;
        } catch (error) {
            delete cache[id];
            throw error;
        }
    }
    return { register: modules => Object.assign(factories, modules), load };
})();
