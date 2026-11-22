import { REGIONS, terrainHeight, BRIDGES, ROADS, BOUND, WATER_Y, wrapDelta, seasonAt, regionAt, BUILDINGS, seeded } from './terrain.js';
const SIZE = 768, SPAN = 2 * BOUND, adj = SIZE / SPAN;
export const labels = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾', '十一', '十二', '十三', '十四', '十五'];
const toX = (x) => SIZE / 2 + x * adj;
const pigments = [
  ['snow', [226, 231, 229]], ['autumn', [213, 177, 133]],
  ['moon', [175, 176, 186]], ['dawn', [232, 200, 163]]
];
let paper, paperRequest;

// The terrain and roads are immutable. Player, delivery and port marks are drawn live.
export function loadMapPaper() {
  if (!paperRequest) {
    const image = new Image();
    image.src = new URL('./assets/world/journey-map.webp?v=15', import.meta.url).href;
    paperRequest = image.decode().then(() => { paper = image; }, () => { paper = paintMapPaper(); });
  }
  return paperRequest;
}
export function regionPort(state, id) {
  return state.objects.find(o => o.type === 'port' && REGIONS[regionAt(o.x, o.z)].id === id);
}

function drawPort(g, x, y, bikes, large) {
  const pinX = large ? x + 16 : x, pinY = y - (large ? 19 : 12);
  const radius = large ? 8 : 9;
  g.fillStyle = bikes > 0 ? '#295d50' : '#736c60';
  g.strokeStyle = '#faf0d8';
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(pinX - 4, pinY + 3);
  g.lineTo(pinX + 4, pinY + 3);
  g.closePath();
  g.stroke();
  g.fill();
  g.beginPath();
  g.arc(pinX, pinY, radius, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold ' + (large ? 12 : 15) + 'px sans-serif';
  g.fillStyle = '#fff8e9';
  g.fillText('P', pinX, pinY + .5);
}

export function paintMapPaper() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d'), step = 4;
  // Sample the same shores and ground as the playable world, including the outer sea.
  for (let z = -BOUND; z < BOUND; z += step) for (let x = -BOUND; x < BOUND; x += step) {
    const a = terrainHeight(x, z), b = terrainHeight(x + step, z + step);
    if (a < WATER_Y) {
      const depth = Math.min(1, Math.max(0, -a / 28));
      g.fillStyle = 'rgb('+[169-79*depth,193-53*depth,183-40*depth].map(Math.round).join(',')+')';
    } else {
      let r = 228, g1 = 222, blue = 191;
      const weights = seasonAt(x, z);
      for (const [key, rgb] of pigments) {
        const k = weights[key];
        r += (rgb[0] - r) * k; g1 += (rgb[1] - g1) * k; blue += (rgb[2] - blue) * k;
      }
      const blush = Math.max(0,1-Math.hypot((x+390)/78,(z+91)/60));
      r+=(239-r)*blush; g1+=(182-g1)*blush; blue+=(181-blue)*blush;
      const relief = Math.min(26, a * .48) + Math.max(-10, Math.min(10, (b-a)*2));
      g.fillStyle = 'rgb(' + [r-relief,g1-relief*.85,blue-relief*.62].map(Math.round).join(',') + ')';
    }
    g.fillRect(toX(x), toX(z), step * adj + 1, step * adj + 1);
    if (a > 1 && Math.floor(a / 4) !== Math.floor(b / 4)) {
      g.fillStyle = '#78775b38';
      g.fillRect(toX(x), toX(z), step * adj, 1);
    }
  }
  for (const road of ROADS) {
    g.beginPath();
    road.points.forEach(([x, z], i) => (i ? g.lineTo(toX(x), toX(z)) : g.moveTo(toX(x), toX(z))));
    g.strokeStyle = '#aa9371';
    g.lineWidth = Math.max(2, road.width * adj);
    g.stroke();
    g.strokeStyle = '#e8d5ad';
    g.lineWidth = Math.max(1, road.width * adj - 1.5);
    g.stroke();
  }
  for (const b of BRIDGES) {
    g.fillStyle = '#9b7954';
    g.fillRect(toX(b.x - b.halfWidth), toX(b.z - b.length / 2), b.halfWidth * 2 * adj, b.length * adj);
  }
  // Inked roofs and a stippled orchard make the five new destinations readable
  // even on the small travelling map. All footprints use the ground coordinates.
  for (const b of BUILDINGS) {
    g.save(); g.translate(toX(b.x),toX(b.z)); g.rotate(-b.yaw);
    g.fillStyle=b.kind==='temple'||b.kind==='pagoda'?'#845645':'#8d8068';
    g.fillRect(-b.w*adj/2,-b.d*adj/2,b.w*adj,b.d*adj);
    g.strokeStyle='#ede0b9'; g.lineWidth=.85;
    g.beginPath();g.moveTo(-b.w*adj*.40,0);g.lineTo(b.w*adj*.40,0);g.stroke();g.restore();
  }
  const random=seeded(190720);
  for(let i=0;i<1700;i++) {
    const x=(random()-.5)*SPAN,z=(random()-.5)*SPAN,y=terrainHeight(x,z);
    const u=toX(x),v=toX(z);
    if(y<-.6) {
      const w=2+random()*3;
      g.beginPath();g.moveTo(u-w,v);g.quadraticCurveTo(u-w*.54,v+.1,u,v-1.35);
      g.quadraticCurveTo(u+w*.49,v+.1,u+w,v);g.strokeStyle='#517d8052';g.lineWidth=.75;g.stroke();
    }
  }
  for(let i=0;i<125;i++) {
    const x=-390+(random()-.5)*144,z=-91+(random()-.5)*115;
    if(Math.hypot((x+390)/75,(z+91)/58)>1) continue;
    g.fillStyle=i%3?'#be89868c':'#f5d2be'; g.beginPath();g.arc(toX(x),toX(z),.8+random()*1.6,0,2*Math.PI);g.fill();
  }
  // The bathymetric approach from the pine shore is marked as a dotted sea lane.
  g.beginPath();g.moveTo(toX(-184),toX(112));g.bezierCurveTo(toX(-223),toX(118),toX(-275),toX(145),toX(-331),toX(135));
  g.setLineDash([2.5,4]);g.strokeStyle='#537e80';g.lineWidth=1.6;g.stroke();g.setLineDash([]);
  return c;
}
export function drawMap(canvas, state, cameraYaw, goal, large = false, pin = null, recipient = null, recipientName = '') {
  const w = canvas.width,
    h = canvas.height,
    g = canvas.getContext('2d'),
    p = state.player,
    midX = large ? 0 : p.x,
    midZ = large ? 0 : p.z;
  const span = large ? SPAN : 118,
    scale = large ? Math.min(w, h) / span : w / span;
  const sx = (x) => w / 2 + (x - midX) * scale,
    sy = (z) => h / 2 + (z - midZ) * scale;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#ece7d1';
  g.fillRect(0, 0, w, h);
  const map = paper;
  for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
    const left = sx(u * SPAN - BOUND), top = sy(v * SPAN - BOUND);
    const side = SPAN * scale;
    if (map && left < w && top < h && left + side > 0 && top + side > 0)
      g.drawImage(map, left, top, side, side);
  }
  for (const [i, r] of REGIONS.entries()) {
    const x = w / 2 + wrapDelta(r.x - midX) * scale,
      y = h / 2 + wrapDelta(r.z - midZ) * scale,
      on = state.visited.includes(r.id),
      rad = large ? (i>=10 ? 12 : 10) : 6;
    if (goal === r.id) {
      g.strokeStyle = '#a14832';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, rad + 4, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = on ? '#a94e38' : '#f4eed8';
    g.strokeStyle = on ? '#88462e' : '#87896b';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (large) {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 12px serif';
      g.fillStyle = on ? '#fff5da' : '#665945';
      g.fillText(labels[i], x, y);
      g.font = 'bold 12px serif';
      g.fillStyle = '#463d2c';
      g.lineWidth = 3;
      g.strokeStyle = '#f8f1db';
      g.strokeText(r.name, x, y + 22);
      g.fillText(r.name, x, y + 22);
    }
  }
  const selectedPort = large && regionPort(state, goal);
  for (const o of state.objects) {
    if (o.type !== 'port' || (large && o !== selectedPort)) continue;
    const x = w / 2 + wrapDelta(o.x - midX) * scale;
    const y = h / 2 + wrapDelta(o.z - midZ) * scale;
    if (x >= 0 && x <= w && y >= 0 && y <= h) drawPort(g, x, y, o.bikes, large);
  }
  if (recipient || pin) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [point, tint] of [[recipient, '#435e62'], [pin, '#ae452c']]) {
      if (!point) continue;
      const x = w/2+wrapDelta(point.x-midX)*scale, y = h/2+wrapDelta(point.z-midZ)*scale;
      g.save(); g.translate(x,y); g.rotate(Math.PI/4);
      g.strokeStyle = '#fff5db'; g.lineWidth=2; g.fillStyle=tint;
      g.fillRect(-6,-6,12,12); g.strokeRect(-6,-6,12,12);
      g.restore();
      g.fillStyle='#fff8df'; g.fillRect(x-1.5,y-1.5,3,3);
      if (large && point === recipient && recipientName) {
        g.font = 'bold 13px serif';
        const side = x + 12 + g.measureText(recipientName).width > w - 3 ? -1 : 1;
        g.textAlign = side < 0 ? 'right' : 'left';
        g.lineWidth = 3; g.strokeStyle = '#fff4de'; g.fillStyle = tint;
        const labelY = Math.min(h - 10, Math.max(10, y - 8));
        g.strokeText(recipientName, x + side*12, labelY);
        g.fillText(recipientName, x + side*12, labelY);
      }
    }
  }
  g.save();
  g.translate(sx(p.x), sy(p.z));
  g.rotate(-cameraYaw);
  g.fillStyle = '#1e6359';
  g.strokeStyle = '#fff6dd';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(6, 7);
  g.lineTo(0, 4);
  g.lineTo(-6, 7);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.font = 'bold ' + (large ? 13 : 17) + 'px "Hiragino Mincho ProN", "Yu Mincho", serif';
  g.fillStyle = '#544231';
  g.fillText('北', large ? w - 17 : w / 2, large ? 10 : 5);
}
export function mapHit(canvas, e) {
  const b = canvas.getBoundingClientRect(),
    x = ((e.clientX - b.left) / b.width) * canvas.width,
    z = ((e.clientY - b.top) / b.height) * canvas.height;
  const scale = Math.min(canvas.width, canvas.height) / SPAN;
  return REGIONS.find(
    (r) => Math.hypot(canvas.width / 2 + r.x * scale - x, canvas.height / 2 + r.z * scale - z) < 25,
  );
}

export function mapCoordinates(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((event.clientX-rect.left)/rect.width-.5)*SPAN, z: ((event.clientY-rect.top)/rect.height-.5)*SPAN };
}
