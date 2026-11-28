"use strict";
const T = require("../engine/three.module.min.js");
const { buildings, groundHeight, pavedStrips, spektrCanopy: roof, spektrBlade: blade } = require("./world-layout.js");
const stalls = [buildings.kiosk, buildings.booth];
function counterLight(parent) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const c = canvas.getContext('2d'), g = c.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, 'rgba(245,212,160,.56)');
    g.addColorStop(.46, 'rgba(194,158,116,.33)');
    g.addColorStop(1, 'rgba(167,133,97,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    const material = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    const positions = [], uv = [], indices = [];
    const apron = pavedStrips.find(p => p.surface === 'metal' && p.x[0][0] < roof.x && p.x[p.x.length - 1][0] > roof.x);
    const plateau = apron.x.filter(([, height]) => height === 1);
    function patch(left, right, rows, top) {
        const near = rows[0], far = rows[rows.length - 1];
        for (const [j, z] of rows.entries()) {
            const first = positions.length / 3;
            for (const x of [left, right])
                positions.push(x, top ?? (groundHeight(x, z) + .012), z);
            const v = (far - z) / (far - near);
            uv.push(0, v, 1, v);
            if (j > 0)
                indices.push(first - 2, first, first - 1, first - 1, first, first + 1);
        }
    }
    for (const s of stalls) {
        const front = s.z + s.d * .5;
        patch(s.x - s.w * .46, s.x + s.w * .46, [front + .04, front + 1.07], 1.367);
        const near = front + 1.02, far = front + 3.04;
        const rows = [near, ...apron.z.map(([z]) => z).filter(z => z > near && z < far), far];
        // Keep the spill on the same sloped faces as the market platform.
        patch(Math.max(s.x - s.w * .46, plateau[0][0]), Math.min(s.x + s.w * .46, plateau[plateau.length - 1][0]), rows);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    const mesh = new T.Mesh(geo, material);
    mesh.name = 'Отсвет ламп на прилавках и под навесом «Спектра»';
    mesh.renderOrder = 1;
    parent.add(mesh);
    return daylight => {
        const night = T.MathUtils.smoothstep(1 - daylight, .12, .83);
        mesh.visible = night > .01;
        material.opacity = night * .64;
    };
}
exports.addSpektrFrontage = function (b, light, sign, powered) {
    const front = stalls[0].z + stalls[0].d * .5, lip = front + 1.80, steel = '#435b5a';
    b.piece('box', roof.x, 2.81, roof.z, roof.w, .17, roof.d, '#617b70', 0, 0, .12);
    b.piece('box', roof.x, 2.916, roof.z, roof.w - .08, .052, roof.d - .12, '#b2c1b7', 0, 0, .12);
    b.box(roof.x, 2.64, lip, roof.w, .36, .16, '#325957');
    b.box(roof.x, 2.80, lip + .085, roof.w, .052, .045, '#a0afa2');
    for (let lx = -roof.w * .5 + .24; lx < roof.w * .5; lx += .55) {
        b.piece('box', roof.x + lx, 2.946, roof.z, .24, .025, roof.d - .16, '#8b5c4f', 0, 0, .12);
        b.box(roof.x + lx, 2.64, lip + .084, .24, .34, .014, '#a36a56');
    }
    for (const [i, s] of stalls.entries()) {
        b.box(s.x, 2.53, lip - .29, s.w * .80, .09, .23, steel);
        light.lamp(s.x, 2.477, lip - .29, s.w * .76, .043, .14, '#ffe0af');
        sign('0' + (i + 1), '', '#e5d3a0', '#325957', s.x - s.w * .39, 2.625, lip + .086, .49, .235);
        for (const side of [-1, 1])
            b.beam(s.x + side * s.w * .41, 2.16, front + .12, s.x + side * s.w * .41, 2.62, lip - .22, .072, steel, true);
    }
    const signY = (blade.bottom + blade.top) * .5, signH = blade.top - blade.bottom;
    const westWall = stalls[0].x - stalls[0].w * .5;
    b.box(westWall - .03, 1.56, stalls[0].z, .08, 2.19, 2.66, '#39605e');
    b.box(westWall - .085, 1.66, stalls[0].z, .052, 1.09, 1.81, '#354a4b');
    for (const y of [1.30, 1.53, 1.76, 1.99])
        b.box(westWall - .124, y, stalls[0].z, .073, .086, 1.64, '#829389');
    b.box(westWall, 3.025, front - .14, .15, .78, .30, steel);
    b.box(blade.x, signY, blade.z, blade.w, signH, blade.d, '#314440');
    b.box(blade.x, blade.top - .035, blade.z, blade.w + .09, .07, blade.d + .08, '#b2b7a2');
    b.box(blade.x + .32, 3.35, front - .14, .78, .13, .16, steel);
    b.box(blade.x, 3.69, front - .14, .14, 1.99, .17, steel);
    b.box(blade.x, 4.62, front + 1.00, .14, .12, 2.42, steel);
    b.beam(blade.x, 3.80, front - .14, blade.x, 4.59, front + .89, .09, steel, true);
    for (const side of [-1, 1])
        sign('СПЕКТР', '', '#e1eed9', '#26514d', blade.x + side * (blade.w * .5 + .005), signY, blade.z, blade.d - .13, signH - .19, side * Math.PI / 2);
    b.box(blade.x, signY, blade.z + blade.d * .5 + .012, blade.w + .012, signH - .12, .04, '#8b8777');
    // One open component bin and two cable reels on the western counter.
    const x = stalls[0].x - stalls[0].w * .255, z = front + .66;
    b.box(x, 1.44, z, 1.56, .17, .60, '#626e62');
    b.box(x, 1.53, z, 1.45, .032, .49, '#374846');
    for (const [offset, wire] of [[-.37, '#b88665'], [.36, '#889e89']]) {
        b.piece('round', x + offset, 1.68, z, .30, .32, .30, wire, 0, 0, Math.PI / 2);
        for (const end of [-1, 1])
            b.piece('round', x + offset, 1.68, z + end * .17, .37, .045, .37, '#445458', 0, 0, Math.PI / 2);
        b.piece('round', x + offset, 1.68, z + .201, .11, .024, .11, '#aeb1a1', 0, 0, Math.PI / 2);
    }
    return counterLight(powered);
};
