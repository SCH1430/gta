"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSoundGuide = createSoundGuide;
const guideCSS = `
.k-sound-guide{position:absolute;z-index:4;left:50%;bottom:max(18vh,calc(env(safe-area-inset-bottom) + 112px));
  transform:translateX(-50%);display:grid;gap:3px;width:max-content;max-width:min(76vw,350px);
  color:#fff0cf;font:600 calc(12px * var(--k-caption,1))/1.2 K77Body,sans-serif;pointer-events:none;text-align:left}
.k-sound-guide[hidden],.k-modal-on .k-sound-guide,.k-sound-row[hidden]{display:none}
.k-sound-row{display:flex;align-items:center;gap:7px;padding:4px 10px 4px 7px;border-radius:6px;
  border:1px solid #ffdaa273;background:#15212af2;box-shadow:0 2px 12px #0007}
.k-sound-arrow{display:grid;place-items:center;width:18px;height:18px;flex:0 0 18px;
  border-radius:50%;border:1px solid #eed0a66b;color:#ffc67e;font:700 15px/1 system-ui,sans-serif}
.k-sound-arrow[hidden]{display:none}
@media (max-height:540px) and (orientation:landscape){
  .k-sound-guide{bottom:calc(var(--k-control-bottom,17px) + max(60px,50px * var(--k-size,1)));
    max-width:min(50vw,340px);font-size:calc(11px * var(--k-caption,1))}
}
@media(max-width:580px) and (orientation:portrait){
  .k-sound-guide{bottom:calc(var(--k-control-bottom,17px) + var(--k-primary-button,46px) + var(--k-aux-button,35px) + 84px)}
}
`;
function createSoundGuide(host) {
    const style = document.createElement('style');
    style.textContent = guideCSS;
    document.head.appendChild(style);
    const guide = document.createElement('aside');
    guide.className = 'k-sound-guide';
    guide.hidden = true;
    guide.setAttribute('role', 'status');
    guide.setAttribute('aria-live', 'polite');
    guide.setAttribute('aria-atomic', 'true');
    const rows = Array.from({ length: 2 }, () => {
        const row = document.createElement('div');
        row.className = 'k-sound-row';
        row.hidden = true;
        const arrow = document.createElement('span');
        arrow.className = 'k-sound-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↑';
        const text = document.createElement('span');
        row.append(arrow, text);
        guide.appendChild(row);
        return { row, arrow, text };
    });
    (host.querySelector('.k-ui') ?? host).appendChild(guide);
    return (lines) => {
        guide.hidden = !lines.length;
        for (const [index, { row, arrow, text }] of rows.entries()) {
            const line = lines[index];
            row.hidden = !line;
            if (!line)
                continue;
            if (text.textContent !== line.text)
                text.textContent = line.text;
            arrow.hidden = line.bearing === undefined;
            if (line.bearing !== undefined) {
                const rotation = 'rotate(' + Math.round(line.bearing * 180 / Math.PI) + 'deg)';
                if (arrow.style.transform !== rotation)
                    arrow.style.transform = rotation;
            }
        }
    };
}
