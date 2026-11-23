const paper = '#fff5dc';
const ink = '#413b2e';
const vermilion = '#984832';
const indigo = '#355e59';
const collides = (a,b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// Store the same symbols and callouts we actually printed for pointer hit testing.
// At country scale the scene seals take precedence over roadside stops.
export function drawAtlasMarks(g, places, selected, visited, view, w, h, sx, sy) {
  const hits = [], occupied = [];
  const ordered = [...places].sort((a,b) => priority(b)-priority(a));
  function priority(place) { return place.id === selected?.id ? 3 : place.kind === 'region' ? 2 : 1; }
  for (const place of ordered) {
    const active = place.id === selected?.id, scene = place.kind === 'region';
    if (!active && !scene && view.zoom < 2.25) continue;
    const x = sx(place.x), y = sy(place.z), radius = scene ? (view.zoom < 2 ? 7 : 10) : 8.5;
    if (x < -radius || x > w+radius || y < -radius || y > h+radius) continue;
    const box = {left:x-radius-1,right:x+radius+1,top:y-radius-1,bottom:y+radius+1};
    if ((!scene || view.zoom >= 2) && occupied.some(other=>collides(other,box))) continue;
    occupied.push(box);
    hits.push({place,x,y,radius});
    const tint = scene ? vermilion : place.kind === 'port' ? indigo : place.category === '主湯' ? vermilion : place.kind === 'bath' ? '#577581' : '#6c654b';
    g.save();
    g.translate(x,y);
    if (active) {
      g.beginPath(); g.arc(0,0,radius+4,0,Math.PI*2);
      g.strokeStyle = paper; g.lineWidth = 4; g.stroke();
      g.strokeStyle = vermilion; g.lineWidth = 2; g.stroke();
    }
    g.beginPath();
    if (scene) g.arc(0,0,radius,0,Math.PI*2);
    else g.roundRect(-radius,-radius,radius*2,radius*2,3);
    const filled = !scene || visited.includes(place.id);
    g.fillStyle = filled ? tint : paper; g.fill();
    g.strokeStyle = filled ? paper : tint; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = filled ? paper : tint;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold '+(place.glyph.length > 1 ? Math.min(9,radius) : Math.min(12,radius+2))+'px '+(place.kind === 'port' ? 'sans-serif' : 'serif');
    g.fillText(place.glyph,0,.5);
    g.restore();
  }
  g.font = 'bold 12px "Hiragino Mincho ProN", "Yu Mincho", serif';
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const hit of hits) {
    const {place,x,y,radius} = hit;
    if (place.kind !== 'region' && place.id !== selected?.id && view.zoom < 6) continue;
    const label = place.kind === 'port' ? '自転車ポート' : place.name;
    const width = Math.ceil(g.measureText(label).width), gap = radius+6;
    for (const [dx,dy] of [[gap,0],[-gap-width,0],[-width/2,-gap-6],[-width/2,gap+6]]) {
      const left = x+dx, cy = y+dy;
      const rect = {left:left-2,right:left+width+2,top:cy-8,bottom:cy+8};
      if (rect.left<2 || rect.right>w-2 || rect.top<2 || rect.bottom>h-2 || occupied.some(other=>collides(other,rect))) continue;
      occupied.push(rect); hit.label = rect;
      g.lineWidth = 3.5; g.strokeStyle = '#f8efd9'; g.strokeText(label,left,cy);
      g.fillStyle = place.id === selected?.id ? '#7f3826' : ink; g.fillText(label,left,cy);
      break;
    }
  }
  return hits;
}
export function atlasHit(marks,x,y) {
  let nearest, best = Infinity;
  for (const mark of marks) {
    const distance = Math.hypot(mark.x-x,mark.y-y);
    if (distance <= mark.radius+3 && distance < best) { nearest = mark.place; best = distance; }
  }
  if (nearest) return nearest;
  return marks.find(({label:r})=>r && x>=r.left && x<=r.right && y>=r.top && y<=r.bottom)?.place;
}

export function drawAtlasFlag(g,place,x,y) {
  g.save(); g.translate(x,y); g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(2,-2); g.lineTo(5,-23);
  g.lineWidth = 4; g.strokeStyle = paper; g.stroke();
  g.lineWidth = 1.6; g.strokeStyle = ink; g.stroke();
  g.beginPath(); g.moveTo(5,-23); g.quadraticCurveTo(11,-25,18,-21);
  g.lineTo(13,-17); g.lineTo(17,-14); g.quadraticCurveTo(10,-18,4,-15); g.closePath();
  g.fillStyle = vermilion; g.strokeStyle = paper; g.lineWidth = 1.3; g.fill(); g.stroke();
  g.restore();
  return {place,x:x+10,y:y-19,radius:6};
}
