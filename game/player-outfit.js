"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerOutfit = playerOutfit;
const human_cloth_js_1 = require("./human-cloth.js");
const capColors = ['', '#293139', '#795745'];
const gloving = ['#ffffff', '#b3906a', '#8496a7'];
const footwear = ['#ffffff', '#717780', '#c7b495'];
function playerOutfit() {
    const style = new WeakMap();
    const capShape = new human_cloth_js_1.Surface();
    capShape.loft([[.169, .087, .089, .099], [.190, .091, .099, .106], [.213, .086, .099, .104], [.245, .072, .082, .080], [.271, .052, .06, .055], [.290, .012, .017, .018]], '#a4a4a4', 0, 18, .89, undefined, true);
    capShape.loft([[.165, .089, .096, .104], [.191, .093, .101, .109], [.206, .090, .101, .108]], '#858585', 0, 18, .91, undefined, true);
    const template = capShape.mesh('Шапка курьера');
    return (figure, value) => {
        if (!figure)
            return;
        let appearance = style.get(figure);
        if (!appearance) {
            const neck = figure.getObjectByName('neck') ?? figure.getObjectByName('driver-head');
            if (!neck)
                return;
            const cap = template.clone(), material = template.material.clone();
            cap.material = material;
            cap.position.set(0, -.030, -.008);
            cap.visible = false;
            neck.add(cap);
            const gloves = [], boots = [];
            figure.traverse(node => {
                const mesh = node;
                const dye = node.userData.outfitDye;
                if (dye === 'none')
                    return;
                const targets = dye === 'gloves' || node.name === 'winter-glove' ? gloves :
                    dye === 'boots' || ['lace-up-winter-boot', 'left-boot', 'right-boot'].includes(node.name) ? boots : null;
                if (!targets || !mesh.isMesh || !mesh.material?.color)
                    return;
                mesh.material = mesh.material.clone();
                targets.push(mesh.material);
            });
            appearance = { cap, gloves, boots, signature: '' };
            style.set(figure, appearance);
        }
        const signature = value.hat + '|' + value.gloves + '|' + value.boots;
        if (signature === appearance.signature)
            return;
        appearance.signature = signature;
        appearance.cap.visible = !!value.hat;
        appearance.cap.material.color.set(capColors[value.hat] || '#ffffff');
        for (const m of appearance.gloves)
            m.color.set(gloving[value.gloves]);
        for (const m of appearance.boots)
            m.color.set(footwear[value.boots]);
    };
}
