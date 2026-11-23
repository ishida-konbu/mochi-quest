// The illustrated menagerie ranges through the same ten districts as the procession.
import { BOUND, ORIGINAL_REGIONS as REGIONS, groundHeight, waterDepth, solidHeightAt, terrainHeight, WATER_Y, seeded, wrapCoord, wrapDelta } from './terrain.js';

import { dragonRings, dragonHipRing } from './dragon-anatomy.js';
import { SCROLL_FAUNA } from './scroll-fauna.js';
import { SEA_SPECIES } from './ryugu-residents.js';
import { canopyHeight, walkCircuit } from './village-paths.js';
import { legendary, legendPath } from './legend-flight.js';
import { craneWingbeat, dragonWave, dragonPhase, dragonPitch, dragonLengthScale, maxDragonPitch, walkingScore } from './animal-motion.js';

export const SPECIES = Object.freeze({
  monkey: { count:90, points:30, label:'猿', stature:1, frame:2.7, center:.88 },
  bird:   { count:40, points:30, label:'丹頂', stature:1, frame:3.5, center:.13 },
  fox:    { count:40, points:50, label:'狐', stature:1, frame:2.7, center:.72 },
  tiger:  { count:10, points:100, label:'虎', stature:2.44, frame:3.6, center:.84 },
  dragon: { count:1, points:1000, label:'龍', stature:8.4, frame:12.4, center:1.37, centerZ:-1.61, skyRange:1200, rigNear:280 },
  kirin:  { count:1, points:1000, label:'麒麟', stature:5.25, frame:4.9, center:1.72, skyRange:384, rigNear:195 },
  deer:   { count:32, points:60, label:'鹿', stature:1.16, frame:3.8, center:1.24 },
  boar:   { count:18, points:60, label:'猪', stature:1.08, frame:3.4, center:.8 },
  shishi: { count:2, points:350, label:'獅子', stature:2.5, variantScales:[1.086,1], frame:4.4, center:1.09 },
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
        // Ground animals ranged outside the dye shop and its yard. Keep that
        // opening at the spring so the historical habitat draw stays stable.
        if((x-274)**2+(z+127)**2<10**2)continue;
        const h=groundHeight(x,z);
        if(waterDepth(x,z)>.04 || solidHeightAt(x,z,2)>h+.18 ||
           Math.abs(groundHeight(x+1,z-1)-h)>.42 || Math.abs(groundHeight(x-1,z+1)-h)>.42 ||
           fixed.some(n=>(n.x-x)**2+(n.z-z)**2<20) ||
           result.some(n=>(n.x-x)**2+(n.z-z)**2<17)) continue;
        break;
      }
      const phase=random()*Math.PI*2;
      const variation=species.count===1?1:.91+random()*.18;
      // The open- and closed-mouth lions keep their established heights even
      // when new buildings change how many habitat soundings are rejected.
      const stature=species.stature*(species.variantScales?.[i] ?? variation);
      result.push({type,role:'roam',habitat:region.id,x,z,phase,stature,
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
// Survey the static ground, crowns and roofs once per eight-metre square.
const surveyStep=8, surveyWidth=2*BOUND/surveyStep;
const clearanceSurvey=new Float32Array(surveyWidth*surveyWidth).fill(NaN);
const surveyPad=surveyStep*Math.SQRT1_2;
function squareTop(i,j) {
  const ix=(i%surveyWidth+surveyWidth)%surveyWidth, iz=(j%surveyWidth+surveyWidth)%surveyWidth;
  const index=iz*surveyWidth+ix;
  let top=clearanceSurvey[index];
  if(Number.isNaN(top)) {
    const x=(ix+.5)*surveyStep-BOUND,z=(iz+.5)*surveyStep-BOUND,r=surveyStep/2;
    top=Math.max(WATER_Y,terrainHeight(x,z),terrainHeight(x-r,z-r),terrainHeight(x+r,z-r),
      terrainHeight(x-r,z+r),terrainHeight(x+r,z+r),solidHeightAt(x,z,surveyPad),canopyHeight(x,z,surveyPad));
    clearanceSurvey[index]=top;
  }
  // Read the same Float32 height both on the first visit and when replaying an old save.
  return clearanceSurvey[index];
}
const maxDragonSlope=Math.sin(maxDragonPitch);
const rearRings=dragonRings.slice(0,dragonHipRing+1);
// The flight survey follows the full rest footprint, including the sideways
// wave and the keel under each painted ring. These bounds are in body units.
const rearReach=Math.max(...rearRings.map(r=>-r.z*dragonLengthScale+Math.max(r.rx,r.ry)))+.25;
const dragonHalfWidth=Math.max(1.8,...rearRings.map(r=>Math.abs(r.x)+r.rx+.9));
const rearUnderside=Math.min(-.25,...rearRings.map(r=>r.y-1.18*Math.max(r.rx,r.ry)-.33));
function requiredHeight(n,time) {
  if(legendary(n.type)) {
    legendPath(n,time,samplePath);
    const {x,z,heading,clearance}=samplePath;
    const ground=Math.max(WATER_Y,terrainHeight(x,z)), dragon=n.type==='dragon';
    const scale=n.stature || SPECIES[n.type].stature, sine=Math.sin(heading),cosine=Math.cos(heading);
    // The full silhouette can cross a different ridge or grove from its origin.
    // Bound the rotated footprint, then consider only the squares it crosses.
    const aft=(dragon?rearReach:1.65)*scale;
    const fore=dragon?2.65*scale*dragonLengthScale:1.45*scale;
    const halfWidth=(dragon?dragonHalfWidth:.58)*scale, along=Math.max(aft,fore);
    const reachX=along*Math.abs(sine)+halfWidth*Math.abs(cosine);
    const reachZ=along*Math.abs(cosine)+halfWidth*Math.abs(sine);
    let required=dragon?Math.max(ground+20,WATER_Y+clearance+.34*(ground-WATER_Y)):ground+clearance;
    const right=Math.floor((x+reachX+BOUND)/surveyStep), bottom=Math.floor((z+reachZ+BOUND)/surveyStep);
    for(let j=Math.floor((z-reachZ+BOUND)/surveyStep);j<=bottom;j++) {
      const dz=(j+.5)*surveyStep-BOUND-z;
      for(let i=Math.floor((x-reachX+BOUND)/surveyStep);i<=right;i++) {
        const dx=(i+.5)*surveyStep-BOUND-x,forward=dx*sine+dz*cosine;
        if(forward < -aft-surveyPad || forward>fore+surveyPad || Math.abs(dx*cosine-dz*sine)>halfWidth+surveyPad)continue;
        const top=squareTop(i,j);
        // Forehead and whiskers sit above the belly. Include the lowest
        // posterior bend during the wave and the drop on a steep climb.
        const localZ=forward/(scale*dragonLengthScale);
        const underside=localZ>1.05 ? .85 : rearUnderside;
        const pitchDrop=dragon ? (Math.min(along,Math.abs(forward)+surveyPad)*maxDragonSlope-underside*scale) : 0;
        required=Math.max(required,top+1.8+pitchDrop);
      }
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
const dragonTorso=[.27,.54,-.14,.51,.42,.7];
const bodyVolumes = {
  monkey:[[0,.9,0,.45,.88,.39]], fox:[[0,.68,.1,.29,.48,.63],[0,1.05,.56,.22,.26,.34]],
  bird:[[0,.11,0,.21,.19,.63],[0,.32,.74,.12,.13,.43]],
  tiger:[[0,.81,.04,.39,.49,.9],[0,1.13,.74,.33,.34,.36]],
  kirin:[[0,1.16,-.07,.35,.53,.95],[0,1.8,.60,.28,.65,.39],[0,2.34,.82,.26,.3,.41]],
  dragon:[[.43,.79,-.97,.44,.48,.75],dragonTorso,[-.28,.88,.51,.42,.53,.55],
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
// Enclose each keeled cross-section in its physical plane. The old torso
// section under the claws is tilted inside a length-scaled trunk. Its two
// transverse axes in world space can therefore be oblique.
function dragonSectionRadius(r) {
  const a=r.across, b=r.up, az=a.z*dragonLengthScale, bz=b.z*dragonLengthScale;
  const width=r.rx*1.026, height=r.ry*1.17;
  const aa=width**2*(a.x*a.x+a.y*a.y+az*az), bb=height**2*(b.x*b.x+b.y*b.y+bz*bz);
  const ab=width*height*(a.x*b.x+a.y*b.y+az*bz);
  const hide=Math.sqrt((aa+bb+Math.hypot(aa-bb,2*ab))/2);
  // The five brush locks fan across the final .9 body units. Their envelope
  // peaks at the middle of the plume and closes again at its fine point.
  const plume=Math.min(.17,.006+1.75*r.distance,.66*(.96-r.distance));
  return Math.max(hide,plume);
}
// Follow the physical radius around each bend. Subdivide the last few
// narrower spans so there is still a continuous target at the fine brush tip.
for(let i=0;i<dragonRings.length-1;i++) {
  const a=dragonRings[i], b=dragonRings[i+1];
  if(i>dragonHipRing && a.z>=-.97)break; // the first torso volume overlaps here
  const distance=Math.hypot(b.x-a.x,b.y-a.y,(b.z-a.z)*dragonLengthScale);
  const radiusA=dragonSectionRadius(a), radiusB=dragonSectionRadius(b);
  const spacing=Math.max(.015,Math.min(a.rx,a.ry,b.rx,b.ry));
  const steps=Math.max(1,Math.ceil(distance/spacing));
  for(let j=0;j<steps;j++) {
    const f=j/steps;
    const x=a.x+(b.x-a.x)*f, y=a.y+(b.y-a.y)*f, z=a.z+(b.z-a.z)*f;
    const radius=radiusA+(radiusB-radiusA)*f+.007, waveZ=a.waveZ+(b.waveZ-a.waveZ)*f;
    bodyVolumes.dragon.push([x,y,z,radius,radius,radius/dragonLengthScale,waveZ]);
  }
}
// The delivery guide points into the same painted torso that accepts the letter.
// Follow the dragon's lateral wave and pitch rather than the clear air at its origin.
export function legendDeliveryPoint(n,out) {
  const dragon=n.type==='dragon';
  const [cx,cy,cz]=dragon?dragonTorso:bodyVolumes.kirin[0];
  if(dragon)dragonWave(cz,n.wavePhase||0,wave);
  const scale=n.stature, side=(cx+(dragon?wave.x:0))*scale, up=(cy+(dragon?wave.y:0))*scale;
  const pitch=dragon?dragonPitch(n):0,along=cz*scale*(dragon?dragonLengthScale:1);
  const forward=along*Math.cos(pitch)+up*Math.sin(pitch);
  out.x=wrapCoord(n.x+side*Math.cos(n.heading)+forward*Math.sin(n.heading));
  out.z=wrapCoord(n.z-side*Math.sin(n.heading)+forward*Math.cos(n.heading));
  out.y=n.y+up*Math.cos(pitch)-along*Math.sin(pitch);
  return out;
}
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
  const lengthScale=dragon ? scale*dragonLengthScale : scale;
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
    if(dragon) dragonWave(volume[6]??cz,n.wavePhase||0,wave);
    const a=w*width+radius,b=h*scale+halfHeight,e=d*lengthScale+radius;
    const xx=(x-(cx+(dragon?wave.x:0))*width)/a;
    const yy=(y-(cy+(dragon?wave.y:0))*scale)/b, zz=(z-cz*lengthScale)/e;
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
