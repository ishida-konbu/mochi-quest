// An illustrated route map of the circular, 24,000-unit handscroll.
const W = 660, H = 235;
const TAU = Math.PI * 2;
const markers = [[76, 137], [162, 75], [288, 85], [409, 63], [558, 112], [428, 175]];
const bends = [
  [101, 133, 115, 77], [206, 56, 258, 100], [335, 97, 357, 68],
  [468, 55, 493, 117], [582, 148, 489, 177], [330, 213, 150, 192]
];
const numbers = ['壱','弐','参','肆','伍','陸'];
const ink = '#666a55', paper = '#f0ead7';

function routePoint(i, t) {
  const a = markers[i], b = markers[(i + 1) % 6], c = bends[i], s = 1 - t;
  return [s*s*s*a[0] + 3*s*s*t*c[0] + 3*s*t*t*c[2] + t*t*t*b[0],
    s*s*s*a[1] + 3*s*s*t*c[1] + 3*s*t*t*c[3] + t*t*t*b[1]];
}

function strokePath(c, points, close = false) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) c.lineTo(...points[i]);
  if (close) c.closePath();
  c.stroke();
}

function water(c) {
  const shore = new Path2D('M34 235 Q54 211 95 212 Q116 206 157 212 Q183 219 213 207 Q248 190 283 200 Q322 212 344 203 Q367 192 393 197 Q417 204 451 190 Q481 177 505 179 Q537 184 565 159 Q577 147 605 150 Q627 158 660 129 L660 235 Z');
  c.fillStyle = '#c4d4c4'; c.fill(shore);
  c.strokeStyle = '#718778'; c.lineWidth = 1.05; c.stroke(shore);
  c.save();
  c.clip(shore);
  c.strokeStyle = '#90aa9a'; c.lineWidth = .85;
  for (let j = 0; j < 11; j++) {
    for (let i = 0; i < 14; i++) {
      const x = 18 + i * 49 + (j % 2) * 22, y = 144 + j * 9;
      c.beginPath(); c.moveTo(x,y);
      c.bezierCurveTo(x+4,y-.3,x+8,y-2.7,x+12,y-1.8);
      c.quadraticCurveTo(x+17,y+.8,x+24,y-1.4); c.stroke();
    }
  }
  c.restore();
  const stream = new Path2D('M62 -5 C150 29 38 47 68 69 C92 84 136 102 109 116 C95 126 54 133 64 149 C74 167 131 173 145 191 Q154 204 152 215');
  c.lineCap='round'; c.lineJoin='round';
  c.lineWidth=5.9; c.strokeStyle='#8caa99'; c.stroke(stream);
  c.lineWidth=3.8; c.strokeStyle='#cfdbcb'; c.stroke(stream);
}

function peak(c, x, y, size) {
  const foot = y + size * .6;
  c.beginPath(); c.moveTo(x-size,foot);
  c.quadraticCurveTo(x-size*.61,foot-size*.15,x-size*.34,y+size*.12);
  c.lineTo(x-size*.15,y+size*.06); c.lineTo(x,y-size*.21);
  c.quadraticCurveTo(x+size*.26,y+size*.02,x+size*.45,y+size*.21);
  c.quadraticCurveTo(x+size*.59,y+size*.4,x+size,foot);
  c.fillStyle='#d4d7bd'; c.fill();
  c.strokeStyle='#777e66'; c.lineWidth=.92; c.stroke();
  c.strokeStyle='#9aa184'; c.lineWidth=.72;
  for(let i=0;i<5;i++) {
    const a=x+size*(i*.073-.03), b=y+size*(i*.062-.1);
    strokePath(c,[[a,b],[a-size*.08,b+size*.14],[a-size*.19,b+size*.27]]);
  }
}

function pine(c,x,y,h) {
  c.save(); c.translate(x,y); c.scale(h/22,h/22);
  c.strokeStyle='#646c56'; c.lineWidth=1.2;
  strokePath(c,[[0,0],[-1,-5],[1,-12],[1,-18]]);
  c.fillStyle='#87957b';
  for (let i=0;i<3;i++) {
    const b=-18+i*4, w=3+i*1.65;
    c.beginPath(); c.moveTo(-w,b+2); c.quadraticCurveTo(-w*.8,b-2,0,b-4);
    c.quadraticCurveTo(w*.3,b-4,w,b+1.6); c.quadraticCurveTo(1,b+2.5,-w,b+2);
    c.fill(); c.stroke();
  }
  c.restore();
}

function bridge(c,x,y) {
  c.save(); c.translate(x,y); c.rotate(-.19);
  c.strokeStyle='#77755d'; c.lineWidth=1.3;
  for (const off of [0,4.3]) {
    c.beginPath(); c.moveTo(-12,3+off); c.quadraticCurveTo(0,-4.5+off,12,3+off); c.stroke();
  }
  for (let i=-10;i<=10;i+=5) {
    const b = 1.4+i*i*.022;
    strokePath(c,[[i,b-1.8],[i,b+3.6]]);
  }
  c.restore();
}

function torii(c,x,y) {
  c.strokeStyle='#a2644b'; c.lineCap='square';
  c.lineWidth=2; strokePath(c,[[x-7,y],[x-6,y-14]]);
  strokePath(c,[[x+6,y],[x+5,y-14]]);
  c.beginPath(); c.moveTo(x-11,y-16); c.quadraticCurveTo(x,y-13,x+11,y-16); c.stroke();
  c.lineWidth=1.3; strokePath(c,[[x-8,y-10],[x+8,y-10]]);
}

function village(c,x,y) {
  for (const [dx,dy,k] of [[-15,-4,.72],[10,-8,.75],[0,2,1],[19,4,.64]]) {
    c.save(); c.translate(x+dx,y+dy); c.scale(k,k);
    c.fillStyle='#dbc7a4'; c.strokeStyle='#737164'; c.lineWidth=1;
    c.fillRect(-7,-5,14,7);c.strokeRect(-7,-5,14,7);
    c.beginPath(); c.moveTo(-10,-5);c.lineTo(-5,-12);c.lineTo(6,-12);c.lineTo(10,-5);c.closePath();
    c.fillStyle='#929789';c.fill();c.stroke();
    c.fillStyle='#928774';c.fillRect(-1,-3,3,5);
    c.restore();
  }
}

function springs(c,x,y) {
  c.strokeStyle='#829889'; c.lineWidth=1.1; c.fillStyle='#c8d6c5';
  c.beginPath();c.ellipse(x,y,15,3.7,-.05,0,TAU);c.fill();c.stroke();
  c.strokeStyle='#8a8972';
  for (let i=0;i<3;i++) {
    const dx=x-6+i*5.4;
    c.beginPath();c.moveTo(dx,y-3.8);c.bezierCurveTo(dx+5,y-9,dx-4,y-9,dx+1,y-16-i%2*2);c.stroke();
  }
}

function paddies(c,x,y) {
  c.strokeStyle='#8c9471'; c.lineWidth=.95;
  for (let i=0;i<4;i++) {
    const y0 = y + i * 3;
    c.beginPath();c.moveTo(x-15-i*3.2,y0);c.bezierCurveTo(x-6,y0-6,x+6,y0+4,x+18+i*2,y0-3);c.stroke();
    c.strokeStyle=i%2?'#8c9471':'#b0af85';
  }
}

function paperMap(c) {
  c.fillStyle = paper; c.fillRect(0,0,W,H);
  // Scattered fibres and hatch groups, stable between redraws.
  c.strokeStyle='rgba(96,89,56,.1)';c.lineWidth=.6;
  let seed=961;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for (let i=0;i<700;i++) {
    const x=random()*W,y=random()*H;
    strokePath(c,[[x,y],[x+1+random()*2,y-random()]]);
  }
  water(c);
  const mountains = [[-4,31,25],[21,20,29],[46,34,16],[105,26,19],[117,14,25],
    [143,30,20],[198,21,20],[216,11,25],[239,19,20],[255,27,18],[325,16,23],
    [341,10,25],[363,16,20],[377,27,15],[452,28,17],[473,18,22],[494,30,17],
    [11,167,18],[28,163,15],[236,142,14],[250,137,19],[273,146,15]];
  for (const p of mountains) peak(c,...p);
  [[15,79,12],[23,77,15],[28,80,12],[129,114,11],[136,113,14],[145,115,11],
    [189,138,13],[197,134,17],[204,137,14],[337,132,12],[344,131,15],[352,134,12],
    [488,92,13],[495,91,17],[502,95,12],[443,166,13],[452,163,16],[462,166,12]].forEach(p=>pine(c,...p));
  bridge(c,81,125);torii(c,162,56);village(c,289,66);
  springs(c,410,44);paddies(c,557,85);
  // A coastal sail.
  c.strokeStyle='#78887b'; c.lineWidth=1;
  strokePath(c,[[542,198],[548,204],[562,203],[568,198],[542,198]]);
  strokePath(c,[[554,197],[554,179],[546,195],[553,194]]);
  // North mark in the open sky.
  c.save();c.translate(624,28);c.fillStyle=ink;c.font='11px serif';c.textAlign='center';
  c.fillText('北',0,-7);c.beginPath();c.moveTo(0,-3);c.lineTo(-3,10);c.lineTo(0,8);c.closePath();c.fill();
  strokePath(c,[[0,-3],[3,10],[0,8]],true);c.restore();
}

function route(c) {
  c.beginPath();c.moveTo(...markers[0]);
  for(let i=0;i<markers.length;i++) c.bezierCurveTo(...bends[i],...markers[(i+1)%6]);
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=paper;c.lineWidth=4.6;c.stroke();
  c.strokeStyle='#94775c';c.lineWidth=1.65;c.setLineDash([3,3.7]);c.stroke();c.setLineDash([]);
}

function seal(c,i,visited,selected) {
  const [x,y]=markers[i];
  if(selected) {
    c.beginPath();c.arc(x,y,16,0,TAU);
    c.strokeStyle='#ac503b'; c.lineWidth=1.5;c.stroke();
  }
  c.fillStyle=visited?'#ac503b':'#eee8d3';c.strokeStyle=visited?'#924333':'#8b8875';c.lineWidth=1.15;
  c.beginPath();c.arc(x,y,10.8,0,TAU);c.fill();c.stroke();
  c.font='bold 12px "Hiragino Mincho ProN", "Yu Mincho", serif';c.textAlign='center';c.textBaseline='middle';
  c.fillStyle=visited?'#fff7df':'#6d705d';c.fillText(numbers[i],x,y+.7);
}

function traveler(c,x,y) {
  c.save();c.translate(x,y);
  c.fillStyle='#714533'; c.beginPath(); c.arc(0,0,2.1,0,TAU);c.fill();
  c.strokeStyle='#764d39';c.lineWidth=1;strokePath(c,[[0,-2],[0,-5.5]]);
  c.beginPath();c.moveTo(-7.2,-8.4);c.bezierCurveTo(-8.3,-12,-5.8,-18.2,-.8,-18.8);
  c.bezierCurveTo(4,-19.4,8.3,-15,8,-10.1);c.quadraticCurveTo(8,-6.1,4.2,-7.6);
  c.quadraticCurveTo(1.5,-6,-2.7,-7.4);c.quadraticCurveTo(-6.5,-5.4,-7.2,-8.4);
  c.fillStyle='#fff9e8';c.fill();c.stroke();
  c.fillStyle='#4c493b';
  for(const a of [-2.6,2.5]) {c.beginPath();c.ellipse(a,-13,.68,.95,0,0,TAU);c.fill();}
  c.strokeStyle='#7e4f40';c.lineWidth=.75;c.beginPath();c.moveTo(-1,-11.4);c.quadraticCurveTo(0,-10.1,1.3,-11.5);c.stroke();
  c.fillStyle='#dfac94';for(const a of [-4.4,4.4]){c.beginPath();c.ellipse(a,-11.3,1.2,.62,0,0,TAU);c.fill();}
  c.restore();
}

const backings = new WeakMap();

export function drawAtlas(canvas,state,selectedRegion=state.region) {
  const ratio=Math.min(3,window.devicePixelRatio||1);
  const width=Math.max(1,Math.round((canvas.getBoundingClientRect().width||W)*ratio));
  const height=Math.round(width*H/W);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  let base=backings.get(canvas);
  if(!base||base.width!==width||base.height!==height) {
    base=document.createElement('canvas');base.width=width;base.height=height;
    const map=base.getContext('2d');map.scale(width/W,height/H);paperMap(map);route(map);
    backings.set(canvas,base);
  }
  const c=canvas.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(base,0,0);
  c.scale(width/W,height/H);
  markers.forEach((_,i)=>seal(c,i,state.visited?.includes(i),i===selectedRegion));
  const progress=(((state.player?.x??0)%24000+24000)%24000)/4000;
  traveler(c,...routePoint(Math.floor(progress),progress%1));
  c.restore();
}

export function atlasRegionAt(canvas,clientX,clientY) {
  const r=canvas.getBoundingClientRect();
  if(!r.width||!r.height)return null;
  const x=(clientX-r.left)*W/r.width,y=(clientY-r.top)*H/r.height;
  const hitRadius=Math.max(20,Math.min(32,16*W/r.width));
  const index=markers.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<=hitRadius);
  return index<0?null:index;
}
