import { drawAtlasMarks, drawAtlasFlag } from './atlas-marks.js';
import { atlasDestinations } from './atlas-destinations.js';
import { MOUNTAIN_STREAMS } from './mountain-streams.js';
import { drawMapSurvey } from './map-survey.js';
import { FOREST_LAKE, LAKE_HOKORA, isletPoint, lakePoint, lakeRadius } from './snow-country.js';
import { isNishiyamaTree } from './mountain-woodland.js';
import { PEACH_RANGE_BOUNDS } from './peach-range.js';
import { DAIBUTSU, INARI_SANCTUARY, PEACH_TREES } from './pilgrimage-layout.js';
import { PALACE_APPROACH, RYUGU, HALLS, GATE_V } from './ryugu-layout.js';
import { DISTRICTS } from './geography.js';
import { SEAPORTS, PORT_BUILDINGS, QUAY_CENTER, QUAY_LENGTH, portPoint } from './seaport-layout.js';
import { SEAWAYS, FLEET, vesselPose } from './ocean-voyage.js';
import { WAYSIDE_SITES } from './wayside-hut-layout.js';
import { KIYOMIZU, OTOWA_ROOFS, PAGODA } from './kiyomizu-layout.js';
import { COURT } from './retreat-layout.js';
import { HIGASHIYAMA, KITAYAMA, FIRE_TRAILS, westRidgeHeight } from './higashiyama.js';
import { RASHOMON, GATE_STONE, GATE_STONE_APRONS, GATE_STONE_STEPS, GATE_WING } from './kyo-layout.js';
import { KIYOMIZU_ROAD, REGIONS, SNOW_SPRING, terrainHeight, BRIDGES, ROADS, BOUND, WATER_Y, wrapDelta, seasonAt, regionAt, BUILDINGS, TREES, ROCKS, seeded } from './terrain.js';
const SIZE = 2048, SPAN = 2 * BOUND, adj = SIZE / SPAN;
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
    image.src = new URL('./assets/world/journey-map.webp?v=shore-wash-1', import.meta.url).href;
    paperRequest = image.decode().then(() => { paper = image; }, () => { paper = paintMapPaper(); });
  }
  return paperRequest;
}
export function mappedBath(object){
  return object.retreat || (object.grand ? SNOW_SPRING : null);
}
export function regionPort(state, id) {
  return state.objects.find(o => o.type === 'port' && REGIONS[regionAt(o.x, o.z)].id === id);
}

function drawPort(g, x, y, bikes) {
  const pinX = x, pinY = y-12, radius = 9;
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
  g.font = 'bold 15px sans-serif';
  g.fillStyle = '#fff8e9';
  g.fillText('P', pinX, pinY + .5);
}

function stampOtowa(g){
  g.save();g.lineJoin=g.lineCap='round';g.beginPath();
  KIYOMIZU_ROAD.points.forEach(([x,z],i)=>i?g.lineTo(toX(x),toX(z)):g.moveTo(toX(x),toX(z)));
  g.strokeStyle='#a18a6a';g.lineWidth=3;g.stroke();
  g.strokeStyle='#e8d8b7';g.lineWidth=1.6;g.stroke();
  for(const r of [...OTOWA_ROOFS,{...PAGODA,width:10.5,depth:10.5,yaw:0}]){
    g.save();g.translate(toX(r.x),toX(r.z));g.rotate(-r.yaw);
    g.fillStyle='#725842';g.fillRect(-r.width*adj/2,-r.depth*adj/2,r.width*adj,r.depth*adj);
    g.beginPath();g.moveTo(-r.width*adj*.28,0);g.lineTo(r.width*adj*.28,0);
    g.lineWidth=.8;g.strokeStyle='#e7d7ae';g.stroke();g.restore();
  }
  g.restore();
}

// Two broken hairlines pick out the shallows. Leave a wide reserve of
// unmarked paper-water between the reed beds, even on the travelling map.
function paintLake(g) {
  g.save();
  g.lineCap='round';
  const x=toX(FOREST_LAKE.x),z=toX(FOREST_LAKE.z);
  // Print the shoreline at the atlas resolution. Using the four-metre
  // contour cells for its edge would leave square notches in the small map.
  g.save();
  g.translate(x,z);g.scale(FOREST_LAKE.rx*adj,FOREST_LAKE.rz*adj);
  const wash=g.createRadialGradient(-.08,.10,.09,0,0,1.13);
  wash.addColorStop(0,'#8eaead');wash.addColorStop(.68,'#9dbaaf');wash.addColorStop(1,'#b9cbb5');
  g.beginPath();
  for(let i=0;i<160;i++){
    const [u,v]=lakePoint(Math.PI*i/80);
    const dx=(u-FOREST_LAKE.x)/FOREST_LAKE.rx,dz=(v-FOREST_LAKE.z)/FOREST_LAKE.rz;
    if(i===0)g.moveTo(dx,dz);else g.lineTo(dx,dz);
  }
  g.closePath();g.fillStyle=wash;g.fill();
  g.restore();
  g.strokeStyle='#829d8aab';g.lineWidth=.8;g.stroke();
  for(const [start,end,radius,tint] of [
    [.14,1.09,.94,'#dfdfc580'],[1.22,2.03,.93,'#e4e5ce9c'],
    [2.32,3.01,.95,'#65817a84'],[3.19,4.05,.91,'#e0e5ce80'],
    [4.20,5.35,.96,'#70867a94'],[5.6,5.92,.87,'#e0e5ce80']
  ]) {
    g.beginPath();
    for(let i=0;i<=32;i++){
      const [x,z]=lakePoint(start+(end-start)*i/32,radius);
      if(i===0)g.moveTo(toX(x),toX(z));else g.lineTo(toX(x),toX(z));
    }
    g.lineWidth=.85;g.strokeStyle=tint;g.stroke();
  }
  const rng=seeded(241061);
  for(let i=0;i<14;i++){
    const [x,z]=lakePoint(rng()*Math.PI*2,.18+.6*rng());
    const u=toX(x),v=toX(z),w=1.1+2.1*rng();
    g.beginPath();g.moveTo(u-w,v);
    g.quadraticCurveTo(u-.34*w,v+.6,u+w,v-.2);
    g.strokeStyle=i%3?'#dde0c980':'#53797b75';g.lineWidth=.8;g.stroke();
  }
  // The paper-water is printed first; reserve a small, ochre-edged mark for
  // the actual dry island. The two brushstrokes at its crown are the roof.
  g.beginPath();
  for(let i=0;i<=60;i++){
    const [x,z]=isletPoint(Math.PI*i/30);
    if(i)g.lineTo(toX(x),toX(z));else g.moveTo(toX(x),toX(z));
  }
  g.closePath();
  g.fillStyle='#bec09b';g.fill();
  g.lineWidth=.7;g.strokeStyle='#7a886e';g.stroke();
  g.beginPath();
  for(let i=0;i<=24;i++){
    const [x,z]=isletPoint(.1+i*.073,1.13);
    if(i)g.lineTo(toX(x),toX(z));else g.moveTo(toX(x),toX(z));
  }
  g.strokeStyle='#dcdcc0';g.lineWidth=.65;g.stroke();
  g.translate(toX(LAKE_HOKORA.x),toX(LAKE_HOKORA.z));g.rotate(-LAKE_HOKORA.yaw);
  g.fillStyle='#665446';
  g.beginPath();g.moveTo(-1.8,.5);g.lineTo(-1.12,-1.04);
  g.lineTo(1.10,-.96);g.lineTo(1.82,.52);g.lineTo(.17,.76);g.closePath();g.fill();
  g.fillStyle='#e1c098';g.fillRect(-.75,-.72,1.45,.39);
  g.restore();
}

function paintTidalWater(g, heights, stride) {
  const sheet = g.getImageData(0, 0, SIZE, SIZE), data = sheet.data;
  const cellsPerPixel = (stride - 1) / SIZE;
  for (let py = 0; py < SIZE; py++) {
    const row = (py + .5) * cellsPerPixel, j = Math.floor(row), v = row - j;
    const z = (py + .5) / adj - BOUND;
    for (let px = 0; px < SIZE; px++) {
      const col = (px + .5) * cellsPerPixel, i = Math.floor(col), u = col - i;
      const idx = j * stride + i;
      const nw = heights[idx], ne = heights[idx + 1];
      const sw = heights[idx + stride], se = heights[idx + stride + 1];
      if (Math.min(nw, ne, sw, se) >= WATER_Y) continue;
      const north = nw + u * (ne - nw), south = sw + u * (se - sw);
      const height = north + v * (south - north);
      // Estimate how much of this paper pixel lies below the tide. The
      // slopes of the interpolated survey also antialias narrow river bends.
      const across = (1 - v) * (ne - nw) + v * (se - sw);
      const footprint = Math.max(.0001, cellsPerPixel * (Math.abs(across) + Math.abs(south - north)));
      const wet = Math.min(1, Math.max(0, .5 + (WATER_Y - height) / footprint));
      if (!wet || lakeRadius((px + .5) / adj - BOUND, z) <= 1.3) continue;
      const depth = Math.min(1, Math.max(0, -height / 28));
      const k = (py * SIZE + px) * 4;
      data[k] += wet * (169 - 79 * depth - data[k]);
      data[k + 1] += wet * (193 - 53 * depth - data[k + 1]);
      data[k + 2] += wet * (183 - 40 * depth - data[k + 2]);
    }
  }
  g.putImageData(sheet, 0, 0);
}

export function paintMapPaper() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d'), step = 4;
  // Share height samples between adjacent cells so the atlas and contour lines
  // follow the playable ground all the way from the quays to the high divide.
  const cells=Math.ceil(SPAN/step),stride=cells+1,heights=new Float32Array(stride*stride);
  for(let j=0;j<=cells;j++)for(let i=0;i<=cells;i++)
    heights[j*stride+i]=terrainHeight(i*step-BOUND,j*step-BOUND);
  const contours=new Path2D(),peach=PEACH_RANGE_BOUNDS;
  g.fillStyle = '#e4debf';
  g.fillRect(0, 0, SIZE, SIZE);
  for (let j=0;j<cells;j++) for (let i=0;i<cells;i++) {
    const x=i*step-BOUND,z=j*step-BOUND,idx=j*stride+i;
    const a=heights[idx], b=heights[idx+stride+1];
    if (Math.max(a, b, heights[idx+1], heights[idx+stride]) < WATER_Y && lakeRadius(x,z)>1.3) continue;
    const inRanges=westRidgeHeight(x,z)>3 || (x>peach.west && x<peach.east && z>peach.north && z<peach.south) ||
      z<DISTRICTS.kyo.z+140 && (Math.abs(x-KITAYAMA.x)<380 && z<DISTRICTS.kyo.z-75 ||
      Math.abs(z-HIGASHIYAMA.z)<320 && x>DISTRICTS.kyo.x+115);
    let r = 228, g1 = 222, blue = 191;
    const weights = seasonAt(x, z);
    for (const [key, rgb] of pigments) {
      const k = weights[key];
      r += (rgb[0] - r) * k; g1 += (rgb[1] - g1) * k; blue += (rgb[2] - blue) * k;
    }
    const relief = inRanges ? Math.min(24, a*.14) + Math.max(-12,Math.min(13,
      (heights[idx+1]-a)*3+(heights[idx+stride]-a)*1.5)) :
      Math.min(26, a * .48) + Math.max(-10, Math.min(10, (b-a)*2));
    g.fillStyle = 'rgb(' + [r-relief,g1-relief*.85,blue-relief*.62].map(Math.round).join(',') + ')';
    g.fillRect(toX(x), toX(z), step * adj + 1, step * adj + 1);
    if(inRanges && a>11) {
      const east=heights[idx+1],south=heights[idx+stride];
      const low=Math.min(a,b,east,south),high=Math.max(a,b,east,south);
      for(let level=Math.ceil(low/16)*16;level<high;level+=16){
        // Interpolate where a real contour crosses two edges of this cell.
        const points=[];
        if((a<level)!==(east<level))points.push([(level-a)/(east-a),0]);
        if((east<level)!==(b<level))points.push([1,(level-east)/(b-east)]);
        if((b<level)!==(south<level))points.push([(level-south)/(b-south),1]);
        if((south<level)!==(a<level))points.push([0,(level-a)/(south-a)]);
        for(let k=0;k+1<points.length;k+=2){
          contours.moveTo(toX(x+points[k][0]*step),toX(z+points[k][1]*step));
          contours.lineTo(toX(x+points[k+1][0]*step),toX(z+points[k+1][1]*step));
        }
      }
    } else if (a > 1 && Math.floor(a / 4) !== Math.floor(b / 4)) {
      g.fillStyle = '#78775b38';
      g.fillRect(toX(x), toX(z), step * adj, 1);
    }
  }
  paintTidalWater(g, heights, stride);
  g.lineWidth=.9;g.strokeStyle='#726d5275';g.stroke(contours);
  paintLake(g);
  // Tiny tapering ink strokes pick out real stands of trees at atlas scale.
  // The ground survey supplies the facing of the dry-brush marks on rock.
  const culms=new Path2D('M-.14,0 Q-.10,-.50 -.21,-.96 M.13,0 Q.15,-.48 .32,-1.10');
  const leaves=new Path2D('M-.16,-.62 Q-.45,-.67 -.57,-.93 Q-.25,-.85 -.16,-.62 Z '+
    'M-.17,-.76 Q-.08,-1.00 .10,-1.02 Q.02,-.81 -.17,-.76 Z '+
    'M.20,-.58 Q.43,-.80 .64,-.76 Q.49,-.60 .20,-.58 Z '+
    'M.26,-.86 Q.29,-1.12 .48,-1.24 Q.46,-1.00 .26,-.86 Z');
  for(const t of TREES){
    if(t.seed%6!==0) continue;
    const u=toX(t.x),v=toX(t.z),h=t.h*adj*.64;
    if(t.kind==='moso' && isNishiyamaTree(t)){
      const size=Math.max(3.1,h);
      g.save();g.translate(u,v);g.scale(t.seed%12 ? size : -size,size);
      g.strokeStyle='#4d6754a8';g.lineWidth=.14;g.stroke(culms);
      g.fillStyle='#496648b3';g.fill(leaves);g.restore();
      continue;
    }
    const broad=t.kind==='oak'||t.kind==='zelkova';
    g.fillStyle=broad?'#59674b66':'#435a4d65';g.beginPath();
    if(broad)g.ellipse(u,v-h*.37,h*.41,h*.56,-.22,0,2*Math.PI);
    else {
      g.moveTo(u,v-h);g.lineTo(u-h*.34,v-h*.2);g.lineTo(u-h*.12,v-h*.24);
      g.lineTo(u-h*.44,v);g.quadraticCurveTo(u,v+h*.10,u+h*.42,v);
      g.lineTo(u+h*.12,v-h*.26);g.lineTo(u+h*.32,v-h*.22);g.closePath();
    }
    g.fill();
  }
  // Paths for carrying firewood are a single fine stroke on the travel map.
  g.lineWidth=.85;
  g.strokeStyle='#ac9878';
  for(const path of Object.values(FIRE_TRAILS)){
    g.beginPath();
    path.forEach(([x,z],i)=>i?g.lineTo(toX(x),toX(z)):g.moveTo(toX(x),toX(z)));
    g.stroke();
  }
  const rockInk=seeded(73167);
  g.strokeStyle='#54574884';g.lineWidth=.85;
  for(let i=0;i<1900;i++){
    const x=DISTRICTS.inari.x-400+rockInk()*610,z=DISTRICTS.inari.z-75+rockInk()*395;
    const y=terrainHeight(x,z),dx=(terrainHeight(x+1,z)-y),dz=(terrainHeight(x,z+1)-y);
    if(y<31 || Math.hypot(dx,dz)<.60) continue;
    const u=toX(x),v=toX(z),w=2.15+2.9*rockInk();
    g.beginPath();g.moveTo(u-dz*.65,v+dx*.65);
    g.quadraticCurveTo(u-dx*w*.45+dz*.7,v-dz*w*.45,u-dx*w,v-dz*w);g.stroke();
  }
  for (const road of ROADS) {
    if(road===KIYOMIZU_ROAD)continue; // Drawn with the roofs in stampOtowa.
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
  function roof(x,z,w,d,yaw,tint) {
    g.save();g.translate(toX(x),toX(z));g.rotate(-yaw);
    g.fillStyle=tint;g.fillRect(-w*adj/2,-d*adj/2,w*adj,d*adj);
    g.strokeStyle='#ede0b9';g.lineWidth=.85;
    g.beginPath();g.moveTo(-w*adj*.40,0);g.lineTo(w*adj*.40,0);g.stroke();g.restore();
  }
  for(const b of BUILDINGS)roof(b.x,b.z,b.w,b.d,b.yaw,b.kind==='temple'||b.kind==='pagoda'?'#845645':'#8d8068');
  roof(DAIBUTSU.x,DAIBUTSU.z,40,29,0,'#685a4b');
  for(const side of [-1,1])roof(DAIBUTSU.x+side*22,DAIBUTSU.z+9,34,7,Math.PI/2,'#827560');
  roof(INARI_SANCTUARY.x,INARI_SANCTUARY.z,10,8,0,'#815744');
  for(const hall of HALLS)roof(RYUGU.x+hall.v,RYUGU.z-hall.u,hall.w,hall.d,Math.PI/2,'#5f7169');
  roof(RYUGU.x+GATE_V,RYUGU.z,13,4,Math.PI/2,'#a36b52');
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
  // At scroll scale a fork of ink and two dabs of colour identify a stand.
  // Place them on the surveyed roots, leaving the rock and the path legible.
  const twig=new Path2D('M0,0 Q-.13,-.4 .04,-.62 L.76,-1.02 M.01,-.58 Q-.33,-.57 -.52,-.91');
  const blossoms=new Path2D();
  blossoms.ellipse(.65,-.99,.40,.24,-.32,0,2*Math.PI);
  blossoms.moveTo(-.22,-.96);
  blossoms.ellipse(-.53,-.96,.31,.21,.18,0,2*Math.PI);
  const petalInk=['#cda49e','#ddc9b8','#bb9fa7','#b87b80','#d1b29b'];
  for(const tree of PEACH_TREES){
    const size=tree.size*1.72;
    g.save();g.translate(toX(tree.x),toX(tree.z));g.scale(Math.cos(tree.turn)<0?-size:size,size);
    g.strokeStyle='#73665bbd';g.lineWidth=.29;g.stroke(twig);
    g.fillStyle=petalInk[tree.form??0];g.fill(blossoms);g.restore();
  }
  function gateStone(u,v,width,depth,colour){
    g.fillStyle=colour;
    g.fillRect(toX(RASHOMON.x+u-width/2),toX(RASHOMON.z+v-depth/2),width*adj,depth*adj);
  }
  for(const a of GATE_STONE_APRONS)gateStone(a.x,a.z,a.w,a.d,'#c2beaa');
  for(const s of GATE_STONE_STEPS)gateStone(s.x,s.z,s.w,s.d,'#aea995');
  gateStone(0,0,GATE_STONE.width,GATE_STONE.depth,'#b9b6a5');
  for(const side of [-1,1])roof(RASHOMON.x+side*GATE_WING.x,RASHOMON.z+GATE_WING.z,
    GATE_WING.roofW,GATE_WING.roofD,0,'#777666');
  roof(RASHOMON.x,RASHOMON.z,21,9,0,'#77594d');
  roof(COURT.x,COURT.z,46,24,0,'#645746');
  for(const lot of PORT_BUILDINGS)roof(lot.x,lot.z,lot.w,lot.d,lot.p.yaw,lot.i===0?'#665d4e':'#988066');
  for(const p of SEAPORTS){
    const [x,z]=portPoint(p,QUAY_CENTER,23.7);
    roof(x,z,QUAY_LENGTH,4.2,p.yaw,'#957650');
  }
  for(const r of ROCKS)if(r.reef){
    const u=toX(r.x),v=toX(r.z);
    g.beginPath();g.moveTo(u-r.rx*adj,v);g.lineTo(u-r.rx*.14*adj,v-r.rz*adj);
    g.lineTo(u+r.rx*.77*adj,v+.4);g.closePath();g.fillStyle='#657677';g.fill();
  }
  g.setLineDash([3.5,6]);g.lineWidth=1;g.strokeStyle='#4e798880';
  // Each dotted circuit follows the same pair of harbour approaches as the fleet.
  for(const lane of SEAWAYS){
    g.beginPath();
    lane.points.forEach(([x,z],i)=>{if(i%4===0){if(i)g.lineTo(toX(x),toX(z));else g.moveTo(toX(x),toX(z));}});
    g.closePath();g.stroke();
  }
  g.setLineDash([]);
  // The bathymetric approach from the pine shore is marked as a dotted sea lane.
  g.beginPath();
  PALACE_APPROACH.forEach(([x,z],i) => i ? g.lineTo(toX(x),toX(z)) : g.moveTo(toX(x),toX(z)));
  g.setLineDash([2.5,4]);g.strokeStyle='#537e80';g.lineWidth=1.6;g.stroke();g.setLineDash([]);
  stampOtowa(g);return c;
}
export function drawMap(canvas, state, cameraYaw, goal, large = false, pin = null, recipient = null, recipientName = '', options = {}) {
  const ratio = options.pixelRatio || 1, zoom = options.zoom || 1;
  const w = canvas.width/ratio, h = canvas.height/ratio, g = canvas.getContext('2d'), p = state.player;
  const midX = large ? options.centerX || 0 : p.x, midZ = large ? options.centerZ || 0 : p.z;
  const scale = large ? Math.min(w, h)*zoom/SPAN : w*zoom/118;
  const sx = x => w/2 + (x-midX)*scale, sy = z => h/2 + (z-midZ)*scale;
  g.setTransform(ratio,0,0,ratio,0,0);
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
  drawMapSurvey(g, midX, midZ, w, h, scale);
  for(const stream of MOUNTAIN_STREAMS){
    g.beginPath();
    for(const [i,point] of stream.stations.entries()){
      const x=sx(point.x),y=sy(point.z);
      if(i===0)g.moveTo(x,y);
      else g.lineTo(x,y);
    }
    g.strokeStyle='#708f8b';g.lineWidth=large?1.15:2.2;g.stroke();
  }
  for(const ship of FLEET){
    const vessel=vesselPose(ship,state.time);
    if(large && vessel.docked)continue;
    const x=w/2+wrapDelta(vessel.x-midX)*scale,y=h/2+wrapDelta(vessel.z-midZ)*scale;
    if(x<0||x>w||y<0||y>h)continue;
    g.save();g.translate(x,y);
    const size=large?.72:1.0;g.scale(size,size);
    g.fillStyle='#f9edcd';g.strokeStyle='#47584e';g.lineWidth=1.2;
    g.beginPath();g.moveTo(-5,0);g.lineTo(2,-7);g.quadraticCurveTo(1,-3,3,0);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(-7,1);g.lineTo(7,1);g.lineTo(3,4);g.lineTo(-3,4);g.closePath();g.fillStyle='#705744';g.fill();g.restore();
  }
  let hits;
  if (large) {
    const places = options.destinations || atlasDestinations(state);
    const selected = options.selection || places.find(place=>place.id===goal);
    hits = drawAtlasMarks(g,places,selected,state.visited,{zoom},w,h,sx,sy);
  } else {
    // Keep the fire characters at their surveyed summits at both map scales.
    const marks=[[KIYOMIZU,'清水寺'],[COURT,'裁'],[KITAYAMA,'大'],[HIGASHIYAMA,'福']];
    for(const {fall} of MOUNTAIN_STREAMS)marks.push([fall.toe,'滝']);
    const hutGlyph={chaya:'茶',charcoal:'炭',fisher:'漁'};
    for(const site of WAYSIDE_SITES)marks.push([site,hutGlyph[site.kind]]);
    for(const object of state.objects){
      const bath=mappedBath(object);
      if(bath)marks.push([bath,bath.rank==='main'?'♨':'湯']);
    }
    for(const [site,glyph] of marks){
      const x=w/2+wrapDelta(site.x-midX)*scale,y=h/2+wrapDelta(site.z-midZ)*scale;
      if(x<0||x>w||y<0||y>h)continue;
      const mainBath=site.rank==='main', subBath=site.rank==='sub';
      const size=subBath ? 14 : 17;
      g.font='bold '+size+'px serif';g.textAlign='center';g.textBaseline='middle';
      g.lineWidth=3;g.strokeStyle='#fff2d6';
      g.fillStyle=glyph==='滝'?'#416b70':subBath?'#4f6961':mainBath?'#943c2f':site===COURT?'#685449':'#8c5140';
      g.strokeText(glyph,x,y);g.fillText(glyph,x,y);
    }
    for (const r of REGIONS) {
      const x = w / 2 + wrapDelta(r.x - midX) * scale,
        y = h / 2 + wrapDelta(r.z - midZ) * scale,
        on = state.visited.includes(r.id),
        rad = 6;
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
    }
    for (const o of state.objects) {
      if (o.type !== 'port') continue;
      const x = w / 2 + wrapDelta(o.x - midX) * scale;
      const y = h / 2 + wrapDelta(o.z - midZ) * scale;
      if (x >= 0 && x <= w && y >= 0 && y <= h) drawPort(g, x, y, o.bikes);
    }
  }
  if (recipient || pin) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [point, tint] of [[recipient, '#435e62'], [pin, '#ae452c']]) {
      if (!point) continue;
      const x = w/2+wrapDelta(point.x-midX)*scale, y = h/2+wrapDelta(point.z-midZ)*scale;
      if (x < -8 || x > w+8 || y < -8 || y > h+8) continue;
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
  if (large && options.activeGoal) {
    const point = options.activeGoal, x = sx(point.x), y = sy(point.z);
    if (x >= 0 && x <= w && y >= 0 && y <= h) hits.unshift(drawAtlasFlag(g,point,x,y));
  }
  if (!large) {
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.font = 'bold 17px "Hiragino Mincho ProN", "Yu Mincho", serif';
    g.fillStyle = '#544231'; g.fillText('北',w/2,5);
  }
  return hits;
}
