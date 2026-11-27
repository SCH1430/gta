"use strict";
// Compact meshes derived from First School Day's CC0 furniture/upgraded GLBs.
// Repeated items share geometry, a material and a small birch/fabric colour atlas.
const T = require("../engine/three.module.min.js");
const pack = require("./campus-furniture-data.js");
const geometries = new Map();
let material;
const bytes = encoded => Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
function furnitureMaterial() {
    if (material) return material;
    const canvas = document.createElement('canvas'), tile = 34;
    canvas.width = canvas.height = tile * 4;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pack.tiles.forEach((encoded, i) => {
        const rgb = new DataView(bytes(encoded).buffer), image = ctx.createImageData(tile,tile);
        for (let y = 0; y < tile; y++) {
            for (let x = 0; x < tile; x++) {
                const sx = Math.min(31,Math.max(0,x-1)), sy = Math.min(31,Math.max(0,y-1));
                const sample = rgb.getUint16((sy * 32 + sx) * 2, true), a = (y * tile + x) * 4;
                image.data[a] = (sample >> 11) * 255 / 31;
                image.data[a+1] = ((sample >> 5) & 63) * 255 / 63;
                image.data[a+2] = (sample & 31) * 255 / 31;
                image.data[a+3] = 255;
            }
        }
        ctx.putImageData(image, ((i+1)%4)*tile, Math.floor((i+1)/4)*tile);
    });
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    material = new T.MeshLambertMaterial({map, vertexColors:true, side:T.DoubleSide});
    return material;
}
function geometry(id) {
    if (geometries.has(id)) return geometries.get(id);
    const asset = pack.models[id], view = new DataView(bytes(asset.v).buffer), count = view.byteLength / 14;
    const positions = new Float32Array(count*3), normals = new Float32Array(count*3);
    const colors = new Uint8Array(count*3), uv = new Float32Array(count*2);
    for (let i=0; i<count; i++) {
        const offset=i*14;
        for (let a=0; a<3; a++) {
            positions[3*i+a] = (view.getUint16(offset+a*2,true)/65535 - (a === 1 ? 0 : .5)) * asset.size[a];
            normals[3*i+a] = view.getInt8(offset+6+a)/127;
            colors[3*i+a] = view.getUint8(offset+9+a);
        }
        uv[2*i]=view.getUint8(offset+12)/255;
        uv[2*i+1]=view.getUint8(offset+13)/255;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(positions,3));
    g.setAttribute('normal', new T.BufferAttribute(normals,3));
    g.setAttribute('color', new T.BufferAttribute(colors,3,true));
    g.setAttribute('uv', new T.BufferAttribute(uv,2));
    g.setIndex(new T.BufferAttribute(new Uint16Array(bytes(asset.i).buffer),1));
    g.computeBoundingSphere();
    geometries.set(id,g);
    return g;
}
exports.addFurniture = function(group, batch, items, floorY) {
    const poses = new Map(), pose = new T.Object3D();
    for (const f of items) {
        const yaw = f.yaw || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
        const put = (id, dx, y, dz, w, h, d, turn=0) => {
            const size=pack.models[id].size;
            pose.position.set(f.x + cs*dx + sn*dz, floorY+y, f.z - sn*dx + cs*dz);
            pose.rotation.set(0,yaw+turn,0);
            pose.scale.set(w/size[0],h/size[1],d/size[2]);
            pose.updateMatrix();
            if (!poses.has(id)) poses.set(id,[]);
            poses.get(id).push(pose.matrix.clone());
        };
        const box=(x,y,z,w,h,d,c)=>batch.box(f.x+cs*x+sn*z, floorY+y, f.z-sn*x+cs*z, w,h,d,c,yaw);
        const {w,h,d,kind}=f;
        if (['desk','computer','specimen','drafting'].includes(kind)) {
            put('school_table',0,0,-d*.20,w,.75,d*.50);
            put('school_chair',0,0,d*.29,.46,.86,.47);
            if (kind==='computer') {
                put('computerScreen',0,.75,-d*.32,.49,.37,.16);
                put('computerKeyboard',0,.75,-d*.10,.43,.035,.16);
            } else if (kind==='specimen') {
                put('microscope',w*.22,.75,-d*.23,.16,.25,.19);
                box(-w*.23,.759,-d*.16,.25,.018,.17,'#f6efdc');
            } else {
                box(-w*.22,.767,-d*.18,.28,.032,.20,kind==='drafting'?'#f3e8d0':'#75949b');
            }
        } else if (kind==='teacher' || kind==='displayTable') {
            put('desk',0,0,0,w,.77,d);
            if (kind==='displayTable') {
                put('microscope',-w*.25,.77,0,.22,.34,.26);
                put('pottedPlant',w*.28,.77,0,.22,.47,.22);
            } else put('books',-w*.23,.77,0,.32,.12,.23);
        } else if (kind==='dining') {
            put('cafeteria_table',0,0,0,w,.77,d*.45);
            for (const side of [-1,1]) for (const seat of [-1,1])
                put('school_chair',seat*w*.26,0,side*d*.34,.42,.83,.42,side<0?Math.PI:0);
        } else if (kind==='readingTable') {
            put('cafeteria_table',0,0,0,w,h,d);
            put('books',0,h,0,.29,.09,.21);
        } else if (kind==='robotRack' || kind==='bookshelf') {
            put(kind==='robotRack'?'kitchenCabinet':'school_shelf',0,0,0,w,h,d);
        } else if (kind==='lockers') {
            const count=Math.max(1,Math.round(w/1.2));
            for(let j=0;j<count;j++) put('school_locker',(j+.5-count/2)*w/count,0,0,w/count-.012,h,d);
        } else if (kind==='serving') {
            const count=Math.max(1,Math.round(w/1.8));
            for (let i=0;i<count;i++) put('cafeteria_showcase',(i+.5-count/2)*w/count,0,0,w/count-.012,h,d);
        } else if (kind==='bench'||kind==='sofa'||kind==='sportsBench') {
            put('bench',0,0,0,w,h,d);
        } else if (kind==='plant') {
            put('pottedPlant',0,0,0,w,h,d);
        } else if (kind==='pouf') {
            box(0,h*.43,0,w*.95,h*.86,d*.95,'#879b97');
            box(0,h*.91,0,w,h*.18,d,'#a2b5ae');
        } else if (kind==='auditoriumSeat') {
            const n=Math.max(1,Math.round(w/.58));
            for(let i=0;i<n;i++) put('school_chair',(i+.5-n/2)*w/n,0,0,Math.min(.53,w/n-.03),h,Math.min(.60,d));
        } else if (kind==='stage') {
            box(0,h*.5,0,w,h,d,'#a88365'); box(0,h-.02,0,w+.04,.045,d+.04,'#d5ba8e');
        } else if (kind==='piano') {
            box(0,h*.67,-d*.13,w,h*.65,d*.71,'#363b3d');
            box(0,h*.52,d*.27,w*.94,.08,d*.31,'#e4e0d1');
            for(let i=-8;i<=8;i++) if(i%7!==0 && i%7!==3)
                box(i*w*.052,h*.57,d*.20,w*.027,.047,d*.16,'#23292a');
            for(const side of [-1,1]) box(w*.42*side,h*.18,0,.13,h*.36,d*.66,'#373e41');
        } else if (kind==='sportsGoal') {
            for(const side of [-1,1]) {
                box(side*(w/2-.045),h/2,d*.40,.09,h,.09,'#d8dede');
                box(side*(w/2-.045),h*.42,-d*.39,.06,h*.84,.06,'#98a8a9');
                box(side*(w/2-.045),.04,0,.07,.08,d,'#a4adae');
            }
            box(0,h-.045,d*.40,w,.09,.09,'#dae2df');
            for(let j=1;j<10;j++) box((j/10-.5)*w,h*.42,-d*.39,.018,h*.83,.018,'#b2bfbf');
            for(let j=0;j<=4;j++) box(0,h*.21*j,-d*.39,w,.018,.018,'#b7c5c4');
        } else if (['rover','manipulator','geometry','buildingModel'].includes(kind)) {
            put('cafeteria_table',0,0,0,w,.76,d);
            const top=.76, accent=kind==='geometry'?'#668999':'#ad4845';
            if(kind==='rover'){
                box(0,top+.18,0,.76,.22,.45,accent);
                box(.08,top+.33,0,.32,.10,.27,'#ddd9c3');
                for(const x of [-.25,.25]) for(const z of [-.25,.25])
                    box(x,top+.13,z,.20,.22,.10,'#343e40');
            } else if(kind==='manipulator') {
                box(-.22,top+.08,0,.36,.16,.36,'#52616b');
                box(-.22,top+.31,0,.11,.34,.13,accent);
                box(.02,top+.49,0,.56,.11,.13,'#9ca6a4');
                box(.27,top+.41,0,.08,.18,.10,accent);
            } else {
                for(let j=0;j<3;j++) box((j-1)*w*.23,top+.11+j*.045,0,w*.19,.22+j*.09,d*.43,j%2?'#96aa97':'#c1aa84');
            }
        } else if (kind==='coatRack') put('coatRackStanding',0,0,0,w,h,d);
        else if (kind==='bin') put('trashcan',0,0,0,w,h,d);
    }
    const shared = furnitureMaterial();
    for (const [id, matrices] of poses) {
        const mesh=new T.InstancedMesh(geometry(id),shared,matrices.length);
        matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
        mesh.computeBoundingSphere(); mesh.name='Мебель · '+id;
        group.add(mesh);
    }
};
