'use strict';
const T = require('../engine/three.module.min.js');
const stock = new Map(), sheet = new T.PlaneGeometry(1,1);

function placard(root, lines, position, size, angle = 0) {
    const text = lines.join('\n');
    let material = stock.get(text);
    if (!material) {
        const paper = document.createElement('canvas');
        paper.width = 384;
        paper.height = 112;
        const brush = paper.getContext('2d');
        brush.fillStyle = '#dddac9';
        brush.fillRect(0,0,paper.width,paper.height);
        brush.strokeStyle = '#535951';
        brush.lineWidth = 3;
        brush.strokeRect(5,5,374,102);
        brush.fillStyle = '#303733';
        brush.textAlign = 'center';
        brush.font = 'bold 32px Arial';
        brush.fillText(lines[0],192,49,356);
        brush.font = '24px Arial';
        brush.fillText(lines[1],192,85,356);
        const map = new T.CanvasTexture(paper);
        map.colorSpace = T.SRGBColorSpace;
        material = new T.MeshLambertMaterial({map});
        stock.set(text,material);
    }
    const sign = new T.Mesh(sheet, material);
    sign.name = lines[0];
    sign.position.fromArray(position);
    sign.rotation.y = angle;
    sign.scale.set(size[0],size[1],1);
    root.add(sign);
    (root.userData.readableSigns ??= []).push({x:position[0],y:position[1],z:position[2],w:size[0],h:size[1],angle,text});
}

module.exports = {placard};
