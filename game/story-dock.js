"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDockContract = buildDockContract;
exports.trackDockContact = trackDockContact;
const model_people_js_1 = require("./model-people.js");
const story_catalog_js_1 = require("./story-catalog.js");
const story_map_js_1 = require("./story-map.js");
const world_layout_js_1 = require("./world-layout.js");
const world_textures_js_1 = require("./world-textures.js");
function buildDockContract(walls, signs) {
    const manifest = { x: 73, z: 314.7 }, post = { x: 451.8, z: 19.5 };
    const y = (0, world_layout_js_1.groundHeight)(manifest.x, manifest.z);
    walls.box(manifest.x, y + .48, manifest.z, .78, .96, .29, '#495f5b');
    walls.box(manifest.x, y + .98, manifest.z, .84, .065, .34, '#6d8580');
    signs.place('dock-manifest-box', () => (0, world_textures_js_1.signTexture)('СМЕННЫЕ ЛИСТЫ', 'СУДОВЕРФЬ', '#f3e5c0', '#4b635d', 3.2), manifest.x, y + .66, manifest.z - .155, .63, .196, Math.PI);
    const level = (0, world_layout_js_1.groundHeight)(post.x, post.z);
    walls.box(post.x, level + .79, post.z, .36, 1.58, .65, '#4b5a56');
    walls.box(post.x, level + .49, post.z, .37, .17, .66, '#d19c54');
    walls.box(post.x, level + 1.40, post.z - .22, .38, .09, .10, '#cd8752');
    signs.place('lake-dispatch-relay', () => (0, world_textures_js_1.signTexture)('ПОСТ 08', 'ОЗЁРНЫЙ МОСТ', '#f2d7a4', '#57655d', 2.8), post.x - .184, level + 1.07, post.z, .51, .19, -Math.PI / 2);
}
function trackDockContact(scene) {
    const at = story_map_js_1.jobPlaces.fisherHandoff;
    let contact;
    return (jobs, frame) => {
        const active = jobs.active;
        if (active?.id !== story_catalog_js_1.dockContractId || active.stage !== 3 || frame.space !== 'street' || Math.hypot(frame.x - at.x, frame.z - at.z) > 42) {
            contact?.root.removeFromParent();
            return;
        }
        contact ??= (0, model_people_js_1.createPerson)('resident', 19);
        if (!contact.root.parent) {
            contact.root.position.set(at.x - 1.15, (0, world_layout_js_1.groundHeight)(at.x - 1.15, at.z), at.z);
            scene.add(contact.root);
        }
        const { x, z } = contact.root.position;
        contact.root.rotation.y = Math.atan2(x - frame.x, z - frame.z);
        contact.update(frame.dt ?? 0, 0, false, {});
    };
}
