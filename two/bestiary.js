// The illustrated menagerie ranges through the same ten districts as the procession.
import { ORIGINAL_REGIONS as REGIONS, groundHeight, waterDepth, solidHeightAt, terrainHeight, WATER_Y, seeded, wrapCoord, wrapDelta } from './terrain.js';

import { canopyHeight, walkCircuit } from './village-paths.js';
import { legendary, legendPath } from './legend-flight.js';
import { dragonWave, dragonPhase, dragonPitch, maxDragonPitch, walkingScore } from './animal-motion.js';

export const SPECIES = Object.freeze({
  monkey: { count:90, points:30, label:'猿', stature:1, frame:2.7, center:.88 },
  bird:   { count:40, points:30, label:'丹頂', stature:1, frame:3.5, center:.13 },
  fox:    { count:40, points:50, label:'狐', stature:1, frame:2.7, center:.72 },
  tiger:  { count:10, points:100, label:'虎', stature:1.22, frame:3.6, center:.84 },
  dragon: { count:1, points:1000, label:'龍', stature:2.1, frame:6.2, center:1.18 },
  kirin:  { count:1, points:1000, label:'麒麟', stature:1.75, frame:4.9, center:1.72 },
  deer:   { count:32, points:60, label:'鹿', stature:1.16, frame:3.8, center:1.24 },
  boar:   { count:18, points:60, label:'猪', stature:1.08, frame:3.4, center:.8 },
  shishi: { count:2, points:350, label:'獅子', stature:2.5, frame:4.4, center:1.09 },
});
export const isFlying = type => type==='bird' || type==='dragon';

const clearanceBands=[9,25,48,73];
let homes;
export function wildlifeHomes(fixed) {
  if (homes) return homes;
  const random=seeded(0x81b6e), result=[];
  for (const [type, species] of Object.entries(SPECIES)) {
    for (let i=0;i<species.count;i++) {
      const region=REGIONS[type==='dragon'?8:type==='kirin'?1:type==='shishi'?(i===0?2:7):i%REGIONS.length];
      let x,z;
      for (let attempt=0; ;attempt++) {
        if (attempt===2000) throw new Error('No habitat for '+type);
        const a=random()*2*Math.PI, r=17+random()*37;
        x=region.x+Math.sin(a)*r; z=region.z+Math.cos(a)*r;
        if (isFlying(type)) break;
        const h=groundHeight(x,z);
        if(waterDepth(x,z)>.04 || solidHeightAt(x,z,2)>h+.18 ||
           Math.abs(groundHeight(x+1,z-1)-h)>.42 || Math.abs(groundHeight(x-1,z+1)-h)>.42 ||
           fixed.some(n=>(n.x-x)**2+(n.z-z)**2<20) ||
           result.some(n=>(n.x-x)**2+(n.z-z)**2<17)) continue;
        break;
      }
      const phase=random()*Math.PI*2;
      result.push({type,role:'roam',habitat:region.id,x,z,phase,stature:species.stature*(species.count===1?1:.91+random()*.18),
        variant:type==='shishi'?i:0, manner:i%3,
        flightBand:type==='bird'?Math.floor(i/REGIONS.length):0,
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
  bird:[[0,.11,0,.32,.24,.76],[-.59,.13,-.09,.55,.31,.37],[.59,.13,-.09,.55,.31,.37],[0,.32,.72,.14,.18,.38]],
  tiger:[[0,.81,.04,.39,.49,.9],[0,1.13,.74,.33,.34,.36]],
  kirin:[[0,1.16,-.07,.35,.53,.95],[0,1.8,.60,.28,.65,.39],[0,2.34,.82,.26,.3,.41]],
  dragon:[[-.59,.60,-2.86,.32,.55,.53],[-.25,.35,-2.27,.33,.39,.64],[-.09,.92,-1.66,.41,.38,.59],
          [.43,.79,-.97,.44,.48,.75],[.27,.54,-.14,.51,.42,.7],[-.28,.88,.51,.42,.53,.55],
          [-.43,1.46,.90,.39,.56,.49],[-.14,1.91,1.62,.49,.45,.83]],
  deer:[[0,.88,0,.31,.53,.79],[0,1.39,.56,.23,.44,.31],[0,1.73,.72,.24,.23,.34]],
  boar:[[0,.72,-.05,.4,.49,.83],[0,.58,.72,.28,.30,.44]],
  shishi:[[0,.96,-.08,.53,.64,1.1],[0,1.39,.69,.47,.51,.51]],
  turtle:[[0,.4,.07,.58,.55,.69]],
};
// The seated hare's feet straddle the deer. Aim at its chest to reach it
// independently from the flank below the saddle.
const seatedHareVolumes=[[0,1.03,.03,.32,.38,.31],[0,1.52,.06,.24,.24,.26]];
export function recipientContact(n,shot,dx,dz,length) {
  const rx=wrapDelta(shot.x-n.x),rz=wrapDelta(shot.z-n.z);
  const volumes=n.ridesDeer ? seatedHareVolumes : bodyVolumes[n.type];
  if (!volumes) {
    if(shot.y<n.y-.1 || shot.y>n.y+2.15) return Infinity;
    const along=Math.max(0,Math.min(length,-rx*dx-rz*dz));
    return (rx+along*dx)**2+(rz+along*dz)**2<.64 ? along : Infinity;
  }
  const scale=n.stature||1, extent=(SPECIES[n.type]?.frame || 2)*scale;
  if(Math.abs(rx)>extent+length || Math.abs(rz)>extent+length || Math.abs(shot.y-n.y)>extent) return Infinity;
  const c=Math.cos(n.heading),s=Math.sin(n.heading);
  const dragon=n.type==='dragon', pitch=dragon ? dragonPitch(n) : 0;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const forward=(rx*s+rz*c)/scale, height=(shot.y-n.y)/scale;
  const x=(rx*c-rz*s)/scale, y=height*cp+forward*sp, z=forward*cp-height*sp;
  const advance=(dx*s+dz*c)/scale, vx=(dx*c-dz*s)/scale, vy=advance*sp, vz=advance*cp;
  let first=Infinity;
  for(const [cx,cy,cz,w,h,d] of volumes) {
    // The sheet itself has width and a little flutter at its leading edge.
    if(dragon) dragonWave(cz,n.wavePhase||0,wave);
    const a=w+.105,b=h+.14,e=d+.105, up=(y-cy-(dragon?wave.y:0))/b;
    if(!vy && Math.abs(up)>1) continue;
    const xx=(x-cx-(dragon?wave.x:0))/a,zz=(z-cz)/e,ux=vx/a,uy=vy/b,uz=vz/e;
    const C=xx*xx+zz*zz+up*up-1;
    if(C<=0) return 0;
    const A=ux*ux+uy*uy+uz*uz,B=xx*ux+up*uy+zz*uz,D=B*B-A*C;
    if(D<0 || B>=0) continue;
    const enter=(-B-Math.sqrt(D))/A;
    if(enter>=0 && enter<=length && enter<first) first=enter;
  }
  return first;
}
