"use strict";
const THREE = require("../engine/three.module.min.js");
const { Batches, Panels } = require("./world-batch.js");
const { texture, signTexture } = require("./world-textures.js");
const { schoolShell, schoolCanopy, schoolWalk, schoolBench, schoolPlanter } = require("./school-site.js");
const snow = '#dde3e5', frame = '#536570', blue = '#345f82';
function paint(w, h, draw) {
    const image = document.createElement('canvas');
    image.width = w;
    image.height = h;
    draw(image.getContext('2d'));
    return texture(image);
}
function facade(columns) {
    const W = columns * 46 + 12, H = 152;
    return paint(W, H, c => {
        const fill = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
        fill(0, 0, W, H, '#c9c3af');
        for (let row = 0; row < 3; row++) {
            const top = 8 + row * 47;
            fill(0, top + 34, W, 2, '#aaa897');
            for (let j = 0; j < columns; j++) {
                const x = 11 + 46 * j;
                fill(x - 2, top + 1, 36, 31, '#a5a394');
                fill(x, top, 32, 29, '#596c72');
                const glass = c.createLinearGradient(0, top, 0, top + 26);
                const warm = (row * 7 + j * 3) % 9 < 3;
                glass.addColorStop(0, warm ? '#dcb77f' : '#adc3c8');
                glass.addColorStop(1, warm ? '#b98d64' : '#607c89');
                fill(x + 2, top + 2, 28, 24, glass);
                if ((j + row) % 4 === 2) {
                    fill(x + 2, top + 2, 28, 7, '#b0b4aa');
                    fill(x + 2, top + 7, 28, 1, '#8b928c');
                }
                fill(x + 14, top + 1, 2, 26, '#e0dfce');
                fill(x + 1, top + 9, 30, 1.3, '#d9d9ca');
                fill(x - 2, top + 29, 36, 2, '#e9e6d4');
                fill(x - 2, top + 31, 36, 1, '#92978c');
            }
        }
        fill(0, H - 10, W, 10, '#818989');
        for (let i = 0; i < columns; i++)
            fill(47 + i * 46, 0, .9, H - 11, 'rgba(85,91,85,.20)');
    });
}
function addSchoolExterior(parent) {
    const {schoolCentre:body, schoolLobby:lobby} = require("./school-site.js");
    const group = new THREE.Group(), pieces = new Batches(group), faces = new Panels(group);
    group.name = 'Школа № 1430 · Канальная улица';
    group.userData.regionalCell = true;
    parent.add(group);
    const { x, z, w, d, h } = body;
    const front = z + d / 2, doorZ = lobby.z + lobby.d / 2;
    const pathLength = schoolWalk.z2 - schoolWalk.z1, pathMid = (schoolWalk.z1 + schoolWalk.z2) / 2;
    pieces.box(x, .008, pathMid, schoolWalk.width, .032, pathLength, '#a5a7a0');
    for (const side of [-1, 1])
        pieces.box(x + side * (schoolWalk.width / 2 + .09), .018, pathMid, .16, .06, pathLength, snow);
    for (let i = 1; i < 5; i++)
        pieces.box(x, .025, schoolWalk.z1 + pathLength * i / 5, schoolWalk.width, .006, .044, '#788184');
    const accent = {west:'#648375',central:'#527895',east:'#b3765d'};
    const bridgeFace = () => paint(240, 144, g => {
        g.fillStyle='#6a7e80'; g.fillRect(0,0,240,144);
        for (let k=0;k<3;k++) {
            const top=3+k*47;
            const glass=g.createLinearGradient(0,top,0,top+38);
            glass.addColorStop(0,'#c1d4d1'); glass.addColorStop(.56,'#8ea8ac'); glass.addColorStop(1,'#758c8e');
            g.fillStyle=glass; g.fillRect(2,top,236,38);
            g.fillStyle='#b7c6c0'; g.fillRect(0,top+26,240,2);
            for (let x=0;x<=240;x+=20) {g.fillStyle='#536c70';g.fillRect(x,top,2,40);}
            g.fillStyle='#d9d6c7';g.fillRect(0,top+39,240,6);
        }
    });
    for (const shell of schoolShell) {
        if (shell.kind === 'lobby') continue;
        const {x,z,w,d,h} = shell;
        pieces.box(x,h/2,z,w,h,d,shell.kind==='wing'?'#bfb9aa':'#849999');
        for (const [size, yaw, nx, nz] of [[w,0,0,1],[w,Math.PI,0,-1],[d,Math.PI/2,1,0],[d,-Math.PI/2,-1,0]]) {
            // The bridge end faces touch the wings; draw only the exposed elevations.
            if (shell.kind==='bridge' && nx) continue;
            const fx=x+nx*(w/2+.024), fz=z+nz*(d/2+.024);
            const n=Math.max(1,Math.round(size/15)), span=size/n;
            const bays=Math.max(3,Math.round(span/3.65));
            for(let i=0;i<n;i++) {
                const at=(i+.5)*span-size*.5;
                if (shell.kind==='bridge')
                    faces.place('school-glass-gallery',bridgeFace,fx+at*Math.cos(yaw),h/2,fz-at*Math.sin(yaw),span,h,yaw);
                else
                    faces.place('school-windows-'+bays,()=>facade(bays),fx+at*Math.cos(yaw),h/2,fz-at*Math.sin(yaw),span,h,yaw);
            }
        }
        pieces.box(x,h-.11,z,w+.30,.25,d+.30,shell.kind==='wing'?accent[shell.wing]:frame);
        pieces.box(x,h+.08,z,w+.42,.13,d+.42,snow);
        if(shell.kind==='wing') {
            const frontZ=z+d/2;
            for(const side of [-1,1]) {
                const xx=x+side*(w/2-.46);
                pieces.box(xx,h*.51,frontZ+.085,.44,h*.95,.10,accent[shell.wing]);
            }
            if(shell.wing!=='central') {
                pieces.box(x,h-1.02,frontZ+.08,7.39,.86,.10,accent[shell.wing]);
                faces.place('school-wing-'+shell.wing,()=>signTexture(shell.name.toUpperCase(),'ШКОЛА № 1430','#fff9e9',accent[shell.wing],8.65),x,h-1.02,frontZ+.14,7.27,.84,0);
            }
        }
    }
    // A low roof lantern marks the actual open atrium.
    pieces.box(x,h+.22,z-1,8.42,.27,6.42,frame);
    pieces.box(x,h+.38,z-1,8.12,.13,6.12,'#cbdad8');
    for(const off of [-2.70,0,2.70])
        pieces.box(x+off,h+.47,z-1,.07,.07,6.13,snow);
    pieces.box(x, h * .48, front + .077, 8.5, h * .96, .11, '#d5d2bf');
    // The blue central bay frames the stairwell windows above the entrance.
    pieces.box(x, 8.06, front + .17, 4.22, 4.39, .20, blue);
    for (const y of [7.05, 9.03]) {
        pieces.box(x, y, front + .302, 3.47, 1.54, .07, '#a4bdc0');
        pieces.box(x, y, front + .35, .10, 1.55, .04, frame);
        pieces.box(x, y + .43, front + .35, 3.47, .07, .04, frame);
    }
    pieces.box(lobby.x, lobby.h / 2, lobby.z, lobby.w, lobby.h, lobby.d, blue);
    pieces.box(x, lobby.h - .05, lobby.z, lobby.w + .20, .16, lobby.d + .25, frame);
    pieces.box(x, lobby.h + .09, lobby.z, lobby.w + .26, .15, lobby.d + .27, snow);
    pieces.box(x, 1.36, doorZ + .05, 6.12, 2.72, .08, frame);
    for (const offset of [-2.26, -.76, .76, 2.26]) {
        pieces.box(x + offset, 1.55, doorZ + .11, 1.39, 2.04, .05,
            Math.abs(offset) < 1 ? '#8bacae' : '#abc3be');
        pieces.box(x + offset, 2.14, doorZ + .15, 1.40, .08, .045, frame);
    }
    for (const offset of [-.16, .16])
        pieces.box(x + offset, 1.12, doorZ + .18, .055, .30, .09, '#e6d5a5');
    // A timber seat and a small winter planter flank the approach.
    const seat = schoolBench, timber = '#9a785e';
    for (const dx of [-.96, .96]) {
        pieces.box(seat.x + dx, .22, seat.z, .12, .44, .63, frame);
        pieces.box(seat.x + dx, .64, seat.z - .30, .09, .52, .09, frame);
    }
    for (const dz of [-.23, 0, .23])
        pieces.box(seat.x, .46, seat.z + dz, seat.w, .10, .20, timber);
    pieces.box(seat.x, .78, seat.z - .30, seat.w, .25, .10, timber);
    pieces.box(seat.x, .91, seat.z - .30, seat.w, .025, .12, snow);
    const pot = schoolPlanter;
    pieces.box(pot.x, pot.h / 2, pot.z, pot.w, pot.h, pot.d, '#a09c8e');
    pieces.box(pot.x, .56, pot.z, pot.w + .02, .08, pot.d + .02, snow);
    for (const [y, radius, height, needles] of [[.91, 1.12, .72, '#627d70'], [1.23, .83, .75, '#718b78'], [1.53, .56, .68, '#859986']])
        pieces.piece('taper', pot.x, y, pot.z, radius, height, radius, needles);
    const canopy = schoolCanopy;
    pieces.box(x, canopy.bottom + .08, canopy.z, canopy.w, .16, canopy.d, frame);
    pieces.box(x, canopy.top - .06, canopy.z, canopy.w, .12, canopy.d, snow);
    pieces.lamp(x, canopy.bottom - .019, doorZ + .90, 2.8, .033, .12, '#f4c98d');
    faces.place('school-name', () => signTexture('ШКОЛА', 'ГЛАВНЫЙ ВХОД', '#fff9e9', '#245e95', 2.45),
        x - 1.95, 4.14, doorZ + .035, 3.60, 1.47, 0);
    faces.place('school-mark', () => require("./school-view.js").schoolMark(),
        x + 1.89, 4.14, doorZ + .035, 3.84, 1.28, 0);
    pieces.flush();
    faces.flush();
    const pos = new THREE.Vector3(), bounds = new THREE.Box3().setFromObject(group);
    const projection = new THREE.Matrix4(), frustum = new THREE.Frustum();
    return camera => {
        pos.setFromMatrixPosition(camera.matrixWorld);
        projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projection);
        group.visible = bounds.distanceToPoint(pos) < 315 && frustum.intersectsBox(bounds);
    };
}
exports.addSchoolExterior = addSchoolExterior;
