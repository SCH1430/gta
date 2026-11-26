"use strict";
const palette = { blue: "#245e95", paper: "#fff9e9" };
// First School Day original game art, CC0 1.0. Paths from assets/identity/mark.svg.
function schoolMark() {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 160;
    const g = c.getContext('2d');
    g.scale(2, 2);
    g.fillStyle = palette.blue;
    g.fillRect(0, 0, 240, 80);
    g.translate(16, 8);
    g.strokeStyle = palette.paper;
    g.lineJoin = g.lineCap = 'round';
    g.lineWidth = 2.5;
    g.stroke(new Path2D('M8 8v46h19l5 3 5-3h19V8H43l-11 8L21 8z M15 14v33h11l6 4 6-4h11V14h-4l-13 9-13-9z M24 24v18l8 5 8-5V24l-8 6z M32 30v17'));
    g.lineWidth = 3.6;
    g.stroke(new Path2D('M82 18l10-6v40M113 13l-12 25h24M120 12v40M137 15q7-5 15-2q13 6 0 18q15 9 2 20q-9 5-18-1M181 12c-17 0-17 41 0 41s17-41 0-41z'));
    return { image: c };
}
exports.schoolMark = schoolMark;
