"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexStaticBoxes = indexStaticBoxes;
function indexStaticBoxes(items, bounds, rectangle, cell, apron) {
    const left = Math.floor((bounds.minX - apron) / cell), top = Math.floor((bounds.minZ - apron) / cell);
    const width = Math.floor(bounds.maxX / cell) - left + 1, height = Math.floor(bounds.maxZ / cell) - top + 1;
    const slots = new Array(width * height), empty = [];
    for (const item of items) {
        const box = rectangle(item);
        const x1 = Math.max(0, Math.floor((box.minX - apron) / cell) - left), x2 = Math.min(width - 1, Math.floor(box.maxX / cell) - left);
        const z1 = Math.max(0, Math.floor((box.minZ - apron) / cell) - top), z2 = Math.min(height - 1, Math.floor(box.maxZ / cell) - top);
        for (let z = z1; z <= z2; z++)
            for (let x = x1; x <= x2; x++)
                (slots[z * width + x] ??= []).push(item);
    }
    return (minX, minZ, maxX, maxZ) => {
        if (maxX - minX > apron || maxZ - minZ > apron)
            return items;
        const x = Math.floor(minX / cell) - left, z = Math.floor(minZ / cell) - top;
        return x < 0 || x >= width || z < 0 || z >= height ? items : slots[z * width + x] ?? empty;
    };
}
