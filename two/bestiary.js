// The delivery scroll keeps its original order as habitats spread along the island.
import { ORIGINAL_REGIONS, REGIONS, regionAt, nearRoad, groundHeight, waterDepth, solidHeightAt, terrainHeight, WATER_Y, seeded, wrapCoord, wrapDelta } from './terrain.js';

import { SCROLL_FAUNA } from './scroll-fauna.js';
import { SEA_SPECIES } from './ryugu-residents.js';
import { canopyHeight, walkCircuit } from './village-paths.js';
import { legendary, legendPath } from './legend-flight.js';
import { craneWingbeat, dragonWave, dragonPhase, dragonPitch, maxDragonPitch, walkingScore } from './animal-motion.js';

export const SPECIES = Object.freeze({
  monkey: { count:90, points:30, label:'猿', stature:1, frame:2.7, center:.88 },
  bird:   { count:40, points:30, label:'丹頂', stature:1, frame:3.5, center:.13 },
  fox:    { count:40, points:50, label:'狐', stature:1, frame:2.7, center:.72 },
  tiger:  { count:10, points:100, label:'虎', stature:2.44, frame:3.6, center:.84 },
  dragon: { count:1, points:1000, label:'龍', stature:2.1, frame:6.2, center:1.18 },
  kirin:  { count:1, points:1000, label:'麒麟', stature:1.75, frame:4.9, center:1.72 },
  deer:   { count:32, points:60, label:'鹿', stature:1.16, frame:3.8, center:1.24 },
  boar:   { count:18, points:60, label:'猪', stature:1.08, frame:3.4, center:.8 },
  shishi: { count:2, points:350, label:'獅子', stature:2.5, variantScales:[1.086,1], frame:4.4, center:1.09 },
});
export const isFlying = type => type==='bird' || type==='dragon';

// Each point is an edge of a grove, a reed bank, or a wayside meadow. Successive
// families share a clearing; different species meet at only a few of the edges.
const feedingGrounds={
  monkey:[
    [-124,-114], [-190,-61], [-63,-245], [205,-140], [289,-181], [103,125],
    [-312,-109], [-490,-118], [-752,-174], [81,-503], [192,-690], [362,-729],
    [525,-548], [370,-1165], [260,585], [404,806], [-100,-664], [148,397],
  ],
  fox:[
    [-124,-49], [232,-86], [-43,-322], [12,240], [469,-476], [511,-624],
    [458,-720], [122,-650], [-660,-151], [220,495], [448,-1244], [-109,-627],
    [220,-1000], [280,658], [344,-1397], [-360,-127], [119,194], [-119,145],
    [210,60], [270,-197],
  ],
  deer:[
    [14,89], [139,163], [29,267], [251,-152], [-647,-171], [115,373],
    [397,783], [450,896], [273,573], [389,-1129], [346,-1410], [20,-707],
  ],
  boar:[
    [-187,-120], [234,-181], [82,172], [-532,-132], [-764,-147],
    [118,-525], [499,-558], [192,453], [-100,-645],
  ],
};
// A saved sky seed describes its tour relative to these original coordinates.
const skyOrigins={
  dragon:[-91.31343413691405,322.5793747212329],
  kirin:[-188.9870537805562,-67.60138919240073],
};
const clearanceBands=[9,25,48,73];
function findHabitat(type,region,site,fixed,residents,random) {
  if(skyOrigins[type])return skyOrigins[type];
  const [cx,cz]=site || [region.x,region.z];
  for(let attempt=0;attempt<2000;attempt++) {
    const angle=random()*2*Math.PI;
    const radius=site ? Math.sqrt(random())*(22+Math.min(48,attempt*.24)) : 17+random()*37;
    const x=cx+Math.sin(angle)*radius,z=cz+Math.cos(angle)*radius;
    if(isFlying(type))return [x,z];
    const h=groundHeight(x,z);
    if(site && nearRoad(x,z,7))continue;
    if(waterDepth(x,z)>.04 || solidHeightAt(x,z,2)>h+.18 ||
       Math.abs(groundHeight(x+1,z-1)-h)>.42 || Math.abs(groundHeight(x-1,z+1)-h)>.42 ||
       fixed.some(n=>(n.x-x)**2+(n.z-z)**2<20) ||
       residents.some(n=>(n.x-x)**2+(n.z-z)**2<(site?49:17)))continue;
    return [x,z];
  }
  throw new Error('No habitat for '+type);
}
let homes;
export function wildlifeHomes(fixed) {
  if (homes) return homes;
  const random=seeded(0x81b6e), result=[];
  for (const [type, species] of Object.entries(SPECIES)) {
    for (let i=0;i<species.count;i++) {
      const region=ORIGINAL_REGIONS[type==='dragon'?8:type==='kirin'?1:type==='shishi'?(i===0?2:7):i%ORIGINAL_REGIONS.length];
      const sites=feedingGrounds[type];
      const site=sites ? sites[i%sites.length] : null;
      const [x,z]=findHabitat(type,region,site,fixed,result,random);
      const phase=random()*Math.PI*2;
      const variation=species.count===1?1:.91+random()*.18;
      // The open- and closed-mouth lions keep their established heights even
      // when new buildings change how many habitat soundings are rejected.
      const stature=species.stature*(species.variantScales?.[i] ?? variation);
      result.push({type,role:'roam',habitat:site?REGIONS[regionAt(x,z)].id:region.id,x,z,phase,stature,
        variant:type==='shishi'?i:0, manner:i%3,
        flightBand:type==='bird'?Math.floor(i/ORIGINAL_REGIONS.length):0,
        radius:type==='dragon'?25:type==='bird'?9+random()*6:1.2+random()*1.7,
        cruise:type==='dragon'?.105:type==='bird'?.26+random()*.12:.25+random()*.16});
    }
  }
  homes=result;
  return homes;
}

const motion = {}, wave = {}, samplePath={};
const altitudeCourses=new WeakMap();
const dragonSpine=[-7.5,-4.3,-1.1,2.1,5.3], kirinFeet=[0], maxDragonSlope=Math.sin(maxDragonPitch);
function requiredHeight(n,time) {
  if(legendary(n.type)) {
    legendPath(n,time,samplePath);
    const {x,z,speed,heading,clearance}=samplePath;
    const dragon=n.type==='dragon', ground=Math.max(WATER_Y,terrainHeight(x,z));
    let required=ground+clearance;
    // The long tail and the whiskered head cross a ridge at different times.
    // Inflate by half the inter-sample travel so thin roofs cannot slip between checks.
    const radius=(dragon?3.95:3.05)+speed*.11, sin=Math.sin(heading),cos=Math.cos(heading);
    for(const offset of dragon?dragonSpine:kirinFeet) {
      const px=wrapCoord(x+sin*offset),pz=wrapCoord(z+cos*offset);
      // A steep climb lowers the tail relative to the middle of the body.
      const pitchDrop=dragon ? Math.abs(offset)*maxDragonSlope : 0;
      required=Math.max(required,Math.max(WATER_Y,terrainHeight(px,pz))+1.4+pitchDrop,
        solidHeightAt(px,pz,radius)+1.8+pitchDrop,canopyHeight(px,pz,radius)+1.15+pitchDrop);
    }
    return required;
  }
  const angle=time*n.cruise+n.phase;
  walkCircuit(n,angle,samplePath);
  const {x,z}=samplePath;
  const clearance=clearanceBands[0]+3.1*Math.sin(angle*.57+n.phase)+1.5*Math.cos(angle*1.17);
  return Math.max(Math.max(WATER_Y,terrainHeight(x,z))+clearance,solidHeightAt(x,z,1.9)+2.15,canopyHeight(x,z,1.9)+.95);
}
// Follow a smooth vertical envelope above the entire route. A solitary roof
// or boulder must be cleared on approach, not with a vertical pop at its edge.
function courseHeight(n,time,out) {
  const far=legendary(n.type), spacing=far?.22:.6, u=time/spacing, i=Math.floor(u), f=u-i;
  let course=altitudeCourses.get(n);
  if(!course || course.seed!==n.flightSeed) {
    course={samples:new Map(),index:NaN,levels:[],seed:n.flightSeed};
    altitudeCourses.set(n,course);
  }
  if(course.index!==i) {
    course.index=i;
    // Allow time to climb over mature woodland before the next sharp crown edge.
    // The summit and sea floor can be close together on the expanded route.
    // Look far enough ahead for a full ascent at the animal's climb rate.
    const reach=far?152:22, climb=n.type==='dragon'?7.6:n.type==='kirin'?5.4:2.35;
    for(const k of course.samples.keys()) if(k<i-reach-1||k>i+reach+2)course.samples.delete(k);
    for(let k=i-reach-1;k<=i+reach+2;k++) if(!course.samples.has(k))course.samples.set(k,requiredHeight(n,k*spacing));
    for(let j=0;j<4;j++) {
      const middle=i+j-1;let highest=-Infinity;
      for(let k=middle-reach;k<=middle+reach;k++){
        const drop=Math.max(0,Math.abs(k-middle)-1)*spacing*climb;
        highest=Math.max(highest,course.samples.get(k)-drop);
      }
      course.levels[j]=highest;
    }
  }
  const [a,b,c,d]=course.levels;
  const linear=c-a,quadratic=2*a-5*b+4*c-d,cubic=3*b-a-3*c+d;
  if(out) out.verticalSpeed=.5*(linear+2*f*quadratic+3*f*f*cubic)/spacing;
  return b+.5*f*(linear+f*(quadratic+f*cubic))+.08;
}
export function legendFlight(n,time,out) {
  legendPath(n,time,out);
  out.y=courseHeight(n,time,out);
  out.altitude=out.y-Math.max(WATER_Y,terrainHeight(out.x,out.z));
  return out;
}

export function moveWildlife(n,time) {
  n.poseTime=time;
  if(legendary(n.type)) {
    legendFlight(n,time,n);
    if(n.type==='dragon') n.wavePhase=dragonPhase(time,n);
    return;
  }
  const air=isFlying(n.type);
  if(!air) walkingScore(time,n,motion);
  const angle=(air?time:motion.travel)*n.cruise+n.phase;
  walkCircuit(n,angle,n);
  n.x=wrapCoord(n.x);n.z=wrapCoord(n.z);
  if(!air) {n.gesture=motion.gesture;n.variation=motion.variation;}
  if(n.trail) n.speed=n.pathSpeed*n.cruise*motion.pace;
  else {
    n.heading=Math.atan2(Math.cos(angle),-.66*Math.sin(angle));
    n.speed=n.radius*n.cruise*Math.hypot(Math.cos(angle),.66*Math.sin(angle))*(air?1:motion.pace);
  }
  if (air) {
    const terrain=Math.max(WATER_Y,terrainHeight(n.x,n.z));
    const band=n.flightBand||0;
    const clearance=clearanceBands[band]+(3.1+band*1.9)*Math.sin(angle*.57+n.phase)+1.5*Math.cos(angle*1.17);
    n.y=band>0 ? terrain+clearance : courseHeight(n,time);
    n.altitude=n.y-terrain;
  } else n.y=groundHeight(n.x,n.z);
}

// Hit volumes are in each drawing's local coordinates (X across, Z toward the face).
// Separate ellipsoids follow the crane wings and the dragon's curved body.
const bodyVolumes = {
  monkey:[[0,.9,0,.45,.88,.39]], fox:[[0,.68,.1,.29,.48,.63],[0,1.05,.56,.22,.26,.34]],
  bird:[[0,.11,0,.21,.19,.63],[0,.32,.74,.12,.13,.43]],
  tiger:[[0,.81,.04,.39,.49,.9],[0,1.13,.74,.33,.34,.36]],
  kirin:[[0,1.16,-.07,.35,.53,.95],[0,1.8,.60,.28,.65,.39],[0,2.34,.82,.26,.3,.41]],
  dragon:[[-.59,.60,-2.86,.32,.55,.53],[-.25,.35,-2.27,.33,.39,.64],[-.09,.92,-1.66,.41,.38,.59],
          [.43,.79,-.97,.44,.48,.75],[.27,.54,-.14,.51,.42,.7],[-.28,.88,.51,.42,.53,.55],
          [-.43,1.46,.90,.39,.56,.49],[-.14,1.91,1.62,.49,.45,.83]],
  deer:[[0,.88,0,.31,.53,.79],[0,1.39,.56,.23,.44,.31],[0,1.73,.72,.24,.23,.34]],
  boar:[[0,.72,-.05,.4,.49,.83],[0,.58,.72,.28,.30,.44]],
  shishi:[[0,.96,-.08,.53,.64,1.1],[0,1.39,.69,.47,.51,.51]],
  // The free turtle's ink rig is displayed at twice the sculpt's scale.
  turtle:[[0,.67,-.105,.79,.48,1.03],[0,.61,.84,.18,.18,.34],[0,.82,1.29,.21,.19,.28]],
  rabbit:[[0,.38,-.06,.28,.37,.31],[0,.94,.01,.29,.54,.28],[0,1.51,.15,.24,.26,.33],
    [-.28,1.82,-.26,.16,.16,.33],[.28,1.87,-.25,.16,.19,.33]],
  frog:[[0,.29,-.04,.40,.28,.32],[0,.79,.01,.35,.48,.29],[0,1.27,.13,.33,.22,.36]],
};
// Four separate lower limbs preserve the space between a large animal's
// legs when a paper notice travels underneath its belly.
for(const [kind,x,rear,fore,height,width] of [
  ['fox',.15,-.32,.23,.29,.075],['tiger',.266,-.44,.31,.42,.12],
  ['kirin',.217,-.47,.35,.61,.10],['deer',.147,-.54,.33,.47,.09],
  ['boar',.219,-.49,.34,.31,.105],['shishi',.225,-.55,.41,.44,.13],
])for(const side of [-1,1])for(const z of [rear,fore])
  bodyVolumes[kind].push([side*x,height,z,width,height,width+.035]);

const craneTargets=[...bodyVolumes.bird,...Array.from({length:4},()=>[0,0,-.14,0,0,.29])],craneFlight={};
function craneContact(n) {
  const {flap,amplitude,stroke,bank}=craneWingbeat((n.poseTime||0)+(n.phase||0),craneFlight);
  let i=bodyVolumes.bird.length;
  for(const side of [-1,1]){
    const wing=side*(.15+stroke*.69)+bank;
    const tip=wing+side*amplitude*(.22*Math.sin(flap-.92)-.10);
    const rootX=side*.075,rootY=.175+.045*amplitude*Math.cos(flap-.3);
    for(const [span,angle] of [[.39,wing],[.39,tip]]){
      const outer=i%2===1,target=craneTargets[i++];
      const x=rootX+(outer?side*.77*Math.cos(wing):0),y=rootY+(outer?side*.77*Math.sin(wing):0);
      target[0]=x+side*span*Math.cos(angle);target[1]=y+side*span*Math.sin(angle);
      target[3]=.46*Math.abs(Math.cos(angle))+.055;target[4]=.09+.46*Math.abs(Math.sin(angle));
    }
  }
  return craneTargets;
}
// The seated hare's feet straddle the deer. Aim at its chest to reach it
// independently from the flank below the saddle.
const seatedHareVolumes=[[0,1.03,.03,.32,.38,.31],[0,1.52,.06,.24,.24,.26]];
const wingTargets=[[0,0,0,.56,.15,.29],[0,0,0,.56,.15,.29]];
const hawkTargets=[...SCROLL_FAUNA.hawk.volumes,...wingTargets];
function hawkContact(n) {
  if(n.spread<.55)return SCROLL_FAUNA.hawk.volumes;
  for(const [i,s] of [-1,1].entries()){
    const wing=wingTargets[i],angle=(n.bank||0)*n.spread;
    wing[0]=s*(.15+.57*Math.cos(angle)*n.spread);wing[1]=.405+.55*Math.sin(angle);
    wing[2]=-.10-.22*(1-n.spread);wing[3]=.57*n.spread;wing[4]=.12+.27*Math.abs(Math.sin(angle));
  }
  return hawkTargets;
}
// Sweep the relative displacement of both participants during this simulation
// step. Distances and padding are in world metres, including on scaled rigs.
export function sweepResident(n, origin, dx, dy, dz, radius, halfHeight, moving = false, normal = null) {
  const startX=moving ? n.contactX ?? n.x : n.x, startY=moving ? n.contactY ?? n.y : n.y;
  const startZ=moving ? n.contactZ ?? n.z : n.z;
  const rx=wrapDelta(origin.x-startX), rz=wrapDelta(origin.z-startZ), ry=origin.y-startY;
  dx-=wrapDelta(n.x-startX); dy-=n.y-startY; dz-=wrapDelta(n.z-startZ);
  const scale=n.stature||1, width=scale*(n.area || n.encounter ? n.build || 1 : 1);
  const spec=SPECIES[n.type] || SEA_SPECIES[n.type] || SCROLL_FAUNA[n.type];
  const extent=(spec?.frame || 2.6)*Math.max(scale,width);
  if(Math.abs(rx)>extent+radius+Math.abs(dx) || Math.abs(rz)>extent+radius+Math.abs(dz) ||
      Math.abs(ry)>extent+halfHeight+Math.abs(dy)) return Infinity;
  const volumes=n.ridesDeer ? seatedHareVolumes : n.type==='hawk' ? hawkContact(n) : n.type==='bird' ? craneContact(n) : bodyVolumes[n.type] || spec?.volumes;
  if(!volumes)return Infinity;
  const c=Math.cos(n.heading),s=Math.sin(n.heading);
  const dragon=n.type==='dragon', pitch=dragon ? dragonPitch(n) : 0;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const forward=rx*s+rz*c, along=dx*s+dz*c;
  const x=rx*c-rz*s, y=ry*cp+forward*sp, z=forward*cp-ry*sp;
  const vx=dx*c-dz*s, vy=dy*cp+along*sp, vz=along*cp-dy*sp;
  let first=Infinity;
  for(const volume of volumes) {
    let [cx,cy,cz,w,h,d]=volume;
    if(n.type==='deer' && cy>1.3) {
      // The muzzle swings about the shoulder when browsing or bowing.
      const gesture=n.gesture||0,graze=n.variation===1?0:gesture,bow=n.encounter==='bow'?gesture:0;
      const angle=1.34*graze+1.08*bow, c=Math.cos(angle),s=Math.sin(angle);
      const height=cy-1.015,forward=cz-.31;
      cy=1.015-.07*graze+height*c-forward*s;cz=.31+.035*graze+height*s+forward*c;
      const tall=Math.hypot(h*c,d*s);d=Math.hypot(d*c,h*s);h=tall;
    }
    if(dragon) dragonWave(cz,n.wavePhase||0,wave);
    const a=w*width+radius,b=h*scale+halfHeight,e=d*scale+radius;
    const xx=(x-(cx+(dragon?wave.x:0))*width)/a;
    const yy=(y-(cy+(dragon?wave.y:0))*scale)/b, zz=(z-cz*scale)/e;
    const ux=vx/a,uy=vy/b,uz=vz/e;
    const C=xx*xx+yy*yy+zz*zz-1, B=xx*ux+yy*uy+zz*uz;
    let t=0;
    if(C>0) {
      if(B>=0)continue;
      const A=ux*ux+uy*uy+uz*uz, D=B*B-A*C;
      if(D<0)continue;
      t=C/(-B+Math.sqrt(D));
    } else if(normal && B>1e-8) continue; // allow travel out of an old overlap
    if(t>1 || t>=first) continue;
    first=t;
    if(!normal)continue;
    const lx=(xx+t*ux)/a,ly=(yy+t*uy)/b,lz=(zz+t*uz)/e;
    const fwd=ly*sp+lz*cp;
    normal.x=lx*c+fwd*s; normal.z=-lx*s+fwd*c; normal.y=ly*cp-lz*sp;
    const len=Math.hypot(normal.x,normal.y,normal.z)||1;
    normal.x/=len;normal.y/=len;normal.z/=len;
  }
  return first;
}
export function recipientContact(n,shot,dx,dz,length) {
  const t=sweepResident(n,shot,dx*length,0,dz*length,.105,.14);
  return Number.isFinite(t) ? t*length : Infinity;
}
