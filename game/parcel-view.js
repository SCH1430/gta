"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crateScene = crateScene;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
function crateScene(parent) {
    const boxes = new Map();
    function make() {
        const model = new T.Group(), part = new world_batch_js_1.Batches(model);
        part.box(0, .154, 0, .51, .30, .38, '#ae8964');
        for (const x of [-.18, .18])
            part.box(x, .174, 0, .05, .34, .40, '#61665a');
        for (const z of [-.19, .19]) {
            part.box(0, .256, z, .48, .048, .028, '#836749');
            part.box(0, .061, z, .48, .049, .028, '#836749');
        }
        part.box(-.026, .175, .204, .15, .073, .007, '#c9cdb6');
        part.flush();
        parent.add(model);
        return model;
    }
    return (ground, x, z, visible) => {
        for (const mesh of boxes.values())
            mesh.visible = false;
        if (!visible)
            return;
        for (const box of ground) {
            if (Math.hypot(box.x - x, box.z - z) > 112)
                continue;
            let model = boxes.get(box.id);
            if (!model) {
                model = make();
                boxes.set(box.id, model);
            }
            model.position.set(box.x, box.y, box.z);
            model.visible = true;
        }
    };
}
