"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCarryCrate = createCarryCrate;
const model_geometry_js_1 = require("./model-geometry.js");
let template;
function createCarryCrate() {
    if (!template) {
        const crate = new model_geometry_js_1.Batch();
        crate.box(0, 0, 0, .452, .332, .392, '#685747');
        for (const direction of [-1, 1]) {
            for (let slat = -2; slat <= 2; slat++) {
                crate.box(0, slat * .064, direction * .196, .454, .060, .008, slat % 2 ? '#9b8060' : '#a48762');
                crate.box(direction * .226, 0, slat * .076, .008, .32, .072, slat % 2 ? '#8b7358' : '#9b7c5d');
            }
            crate.box(direction * .229, -.025, 0, .013, .092, .142, '#4f4b3c');
            crate.box(direction * .240, .010, 0, .022, .026, .122, '#a0906f');
            crate.box(0, direction * .167, 0, .435, .006, .382, '#846e57');
            for (const x of [-.165, .165])
                crate.box(x, direction * .163, 0, .054, .014, .399, '#5a6e63');
        }
        (0, model_geometry_js_1.stencil)(crate, '77', [0, .048, -.201], .011, '#d5cbac', -1);
        template = crate.mesh();
        template.name = 'Ящик станционной службы';
    }
    return template.clone();
}
