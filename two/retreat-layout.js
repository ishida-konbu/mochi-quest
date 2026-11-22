// Positive local Z faces the road. Roofs, steps, pool lips and their
// collision volumes share the same survey as the signposts on the map.
import { bathPools, poolRadius, hasOwnInlet } from './bath-places.js';
import { addVillageBathSolids } from './village-bath-courses.js';
import { addPilgrimBathSolids,kilnSteamBath } from './pilgrim-bathing-plan.js';
import { DISTRICTS, districtPoint } from './geography.js';
import { REGIONAL_SPRINGS, regionalSpringLip, regionalRimStones } from './regional-springs.js';
import { bathEnclosure,bathEnclosureGround, bathEnclosureReserved, addBathEnclosureSolids, waysideBankRocks } from './bath-enclosures.js';
import { addMainRimSolids,bathTableau,tableauGround } from './main-bath-rims.js';
import { regionalBathFittings } from './regional-bath-fittings.js';
import { TRADE_ROADS, measureRoute, cartPosition } from './trade-routes.js';

const [cx,cz]=districtPoint('kyo',35,-470.5);
export const COURT={x:cx,z:cz,name:'京の評定所',yaw:0};
// The audience floor is a clear span. Transverse tie beams transfer the
// roof load onto the two outer aisles, clear of the unbroken painted wall.
export const COURT_COLUMNS=[-18.8,-14.6,-10.95,10.95,14.6,18.8];
export const COURT_GATE_Z=33.52;
export const COURT_PRECINCT={
  west:cx-24.4,east:cx+24.4,north:cz-14.1,south:cz+37.2,
};
export const COURT_BRAZIERS=[[-8.2,29.5],[-9.8,14.4],[8.2,29.5],[9.8,14.4]];
export const COURT_STEPS=Array.from({length:5},(_,i)=>({z:12.6-i*.64,top:.21+i*.21}));

function wayside(id, fraction, offset) {
  const road=measureRoute(TRADE_ROADS.find(r=>r.id===id).knots);
  const p=cartPosition(road,fraction*road.length,1);
  const yaw=p.yaw-Math.sign(offset)*Math.PI/2;
  return {x:p.x-Math.sin(yaw)*Math.abs(offset),z:p.z-Math.cos(yaw)*Math.abs(offset),yaw};
}
// Original survey numbers seed the basin outline, stone rims and planting.
// Keep the two retired peach approach numbers vacant.
const springSurvey=[];
export const RETREATS=[
  {x:74.10411390313025,z:-553.7422990856945,yaw:1.0957855705297996,name:'杉木立の湯',kind:'cedar',region:'inari',rx:3.22,rz:2.52},
  {...wayside('temple-road',.56,-16),name:'薄明の湯',kind:'reed',region:'todaiji',rx:3.50,rz:2.49},
  {x:560,z:-484,yaw:-1.5440,name:'雲間の湯',kind:'slate',region:'inari',rx:3.30,rz:2.51},
  {x:-127,z:146,yaw:2.42,name:'潮待ちの湯',kind:'coast',region:'coast',rx:3.4,rz:2.53},
  {x:229,z:-172,yaw:.71,name:'楓の岩湯',kind:'maple',region:'autumn',rx:3.26,rz:2.62},
  ...REGIONAL_SPRINGS,
].map(site=>{
  if(springSurvey.length===2 || springSurvey.length===23)springSurvey.push(null);
  const index=springSurvey.length;
  springSurvey.push(site);
  return {rank:'sub',...site,index};
});

export function sitePoint(site,u,v) {
  return [site.x+u*Math.cos(site.yaw)+v*Math.sin(site.yaw),
    site.z-u*Math.sin(site.yaw)+v*Math.cos(site.yaw)];
}
const siteCells=new Map();
for (const s of RETREATS) {
  // Beyond this rectangle bathTerrain has fully blended back to native ground.
  const reach=Math.max(s.shape==='suzuri'?24:14,Math.ceil(Math.max(s.rx,s.rz)*1.32*1.86),Math.ceil(s.rz*1.25+8));
  const entry={site:s,reach2:reach*reach};
  for(let a=Math.floor((s.x-reach)/32);a<=Math.floor((s.x+reach)/32);a++)
    for(let b=Math.floor((s.z-reach)/32);b<=Math.floor((s.z+reach)/32);b++){
      const key=a*256+b;
      if(!siteCells.has(key))siteCells.set(key,[]);
      siteCells.get(key).push(entry);
    }
}
export function nearbyRetreat(x,z) {
  const sites=siteCells.get(Math.floor(x/32)*256+Math.floor(z/32));
  if(!sites)return;
  let nearest, distance=Infinity;
  for(const {site,reach2} of sites){
    const r=(x-site.x)**2+(z-site.z)**2;
    if(r<=reach2 && r<distance){nearest=site;distance=r;}
  }
  return nearest;
}
export function springLip(index,a) {
  const shape=springSurvey[index]?.shape;
  return shape ? regionalSpringLip(shape,a) :
    1+.103*Math.sin(3*a+index*.95)+.051*Math.cos(2*a-index*.62)+.026*Math.cos(5*a);
}
export function bathRadius(s,x,z) {
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const u=(dx*c-dz*k)/s.rx,v=(dx*k+dz*c)/s.rz;
  return Math.hypot(u,v)/springLip(s.index,Math.atan2(v,u));
}
export function reservedScenery(x,z) {
  const {west,east,north,south}=COURT_PRECINCT;
  if(x>west && x<east && z>north && z<south)return true;
  const s=nearbyRetreat(x,z);
  if(!s)return false;
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const u=dx*c-dz*k,v=dx*k+dz*c;
  return (!s.regional && Math.hypot(dx,dz)<5.15) || bathRadius(s,x,z)<1.38 || (Math.abs(u)<2.5 && v>=0 && v<s.rz+4.9) ||
    bathEnclosureReserved(s,u,v);
}
const ease=n=>{const t=Math.min(1,Math.max(0,n));return t*t*(3-2*t);};
export function courtTerrain(x,z,native,base) {
  // The stone approach descends continuously over the whole setback. A
  // short shoulder here made the terrain cut through the paving in strips.
  const threshold=cz+COURT_GATE_Z+.80;
  // The back wall sits on the floor's ten-metre half depth. Release the
  // terrace behind that foundation so the shops across the lane retain
  // a level landing before their first tread.
  const verge=Math.max((Math.abs(x-cx)-23.7)/5,(cz-10.25-z)/5,
    (z-threshold)/(DISTRICTS.kyo.z-threshold));
  return verge>=1 ? native : native+(base(cx,cz)-native)*(1-ease(verge));
}
export function bathTerrain(s,x,z,native,level) {
  if(kilnSteamBath(s)){
    // A firebrick room stands on a rectangular, dry working yard. Grade
    // the full enclosure to the same datum as its hearth and entrance.
    const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
    const u=dx*c-dz*k,v=dx*k+dz*c,plan=bathEnclosure(s);
    const edge=Math.max(Math.abs(u)-plan.w, v-plan.fore,plan.room.v-plan.room.d/2-v);
    return level-.015+(native-level+.015)*ease(edge/3.25);
  }
  const r=bathRadius(s,x,z);
  // A shallow submerged seat rises into a gravel beach at the entrance.
  // The smaller, lobed pools keep a low shelf under the bank stones. The
  // painted terrain interpolates these vertices across two-metre triangles.
  // A gravel shore rises through the waterline and stays level for a step
  // before the hillside resumes. Its width is in metres on baths of either rank.
  const radialMetres=Math.hypot(x-s.x,z-s.z);
  const edge=r>0 ? radialMetres*(1-1/r) : -s.rz;
  const shore=level-.52+.65*ease((edge+1.08)/2.38);
  let ground=shore+(native-shore)*ease((edge-1.22)/2.72);
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const pools=bathPools(s);
  if(pools){
    const u=dx*c-dz*k,v=dx*k+dz*c;
    const yard=level+(s.kind==='earthen'?-.22:.065);
    ground=yard+(native-yard)*ease((edge-1.22)/2.72);
    let closest=Infinity;
    for(const pool of pools){
      const radius=poolRadius(pool,u,v);
      if(radius>=closest || radius>1.27)continue;
      closest=radius;
      const bed=level+pool.y-pool.depth;
      // Keep the raised water behind its own wall. The shore climbs only at
      // the toe, leaving both the open tread and the aisle between pools dry.
      const lip=level+pool.y-.08;
      ground=bed+(lip-bed)*ease((radius-.71)/.33)+(yard-lip)*ease((radius-1.04)/.23);
    }
  }
  const apron=bathEnclosureGround(s,dx*c-dz*k,dx*k+dz*c);
  const finished=ground+(level+.026-ground)*apron*ease((r-.85)/.23);
  return s.rank==='main' && r>1 ? tableauGround(s,dx*c-dz*k,dx*k+dz*c,finished,level) : finished;
}
export function retreatStones(s) {
  if(s.rank==='main')return []; // The sculpted vessel supplies its continuous coping.
  if(s.regional)return regionalRimStones(s);
  const count=28;
  return Array.from({length:count},(_,i)=>{
    const a=i*Math.PI*2/count, turn=Math.sin(7.3*i+s.index);
    const lip=springLip(s.index,a);
    const u=Math.cos(a)*s.rx*lip,v=Math.sin(a)*s.rz*lip;
    const size=.83+.16*Math.sin(i*3.83+s.index)+.125*Math.cos(i*2.51);
    return {u,v,w:size*1.05,h:size*(.48+.24*(1+Math.sin(i*4.13))*.5),d:size*.76,angle:-a+.15*turn,i,scanned:i%3===0};
  }).filter(q=>q.v<s.rz*.73 || Math.abs(q.u)>1.84);
}

export function civicAndBathSolids(height,put,levelOf) {
  const base=height(cx,cz);
  function solid(x,z,w,d,top,kind,support=false) {
    return put(cx+x,cz+z,w/2,d/2,0,base+top,kind,support);
  }
  solid(0,0,41,20,1.05,'floor',true);
  for(const step of COURT_STEPS) solid(0,step.z,9.4,.68,step.top,'floor',true);
  for(const x of COURT_COLUMNS) for(const z of [-8.05,8.05])solid(x,z,.63,.63,7.9,'oval');
  for(const [x,z] of COURT_BRAZIERS)solid(x,z,.98,.98,1.59,'oval');
  for(const side of [-1,1]){
    solid(side*16.0,-7.07,4.10,.99,3.46,'box',true);
    solid(side*18.9,0,.30,16.3,7.45,'wall');
    solid(side*12.16,9.45,13.2,.14,2.37,'wall');
    solid(side*19.0,21.8,.41,24.0,2.0,'wall');
    solid(side*11.98,COURT_GATE_Z,14.44,.49,2.0,'wall');
    solid(side*4.42,COURT_GATE_Z-.83,.18,2.0,3.35,'wall');
    for(const v of [-.72,.72])solid(side*4.68,COURT_GATE_Z+v,.5,.5,4.53,'wall');
    for(const v of [13.2,28.5])solid(side*14.3,v,1.05,.98,3.20,'oval',true);
  }
  solid(14.9,2.7,3.45,1.1,1.65,'box',true);
  solid(-14.9,2.7,3.45,1.1,1.65,'box',true);
  solid(-16.0,21.8,2.4,1.15,3.2,'box');
  for(const x of [15.1,17.5])for(const z of [19.85,23.9])solid(x,z,.22,.22,3.2,'oval');
  solid(16.87,21.88,.78,3.84,.68,'box',true);
  solid(16.3,21.88,3.74,6.3,3.12,'ceiling');
  put(cx+16.3,cz+21.88,3.15,1.87,Math.PI/2,base+3.12,'roof',true,1.17).form='hip';
  solid(0,-8.22,37.9,.32,7.6,'wall');
  solid(0,-4.29,10.40,4.85,1.35,'floor',true);
  solid(0,-2.79,3.48,.94,1.98,'box',true);
  solid(0,0,42,22,7.98,'ceiling');
  solid(0,COURT_GATE_Z,11.9,4.8,4.42,'ceiling');
  put(cx,cz,23.0,12.54,0,base+8.02,'roof',true,5.62).form='hip';
  put(cx,cz+COURT_GATE_Z,6.46,2.4,0,base+4.44,'roof',true,1.91).form='hip';

  for(const s of RETREATS) {
    const level=levelOf(s);
    const add=(u,v,w,d,y,kind,support=false,angle=0)=>{
      const [x,z]=sitePoint(s,u,v);
      return put(x,z,w/2,d/2,s.yaw+angle,level+y,kind,support);
    };
    if(s.rank==='main'){
      if(!bathPools(s))addMainRimSolids(s,add);
      addVillageBathSolids(s,add);
      addPilgrimBathSolids(s,add,level);
      const t=bathTableau(s);
      if(t){
        add(t.u,t.v,2.3*t.scale,1.17*t.scale,.17+1.40*t.scale,'oval',false,t.yaw);
      }
    }
    for(const q of retreatStones(s)){
      const top=q.scanned?-.03+1.18*q.h:.075+q.h;
      const rim=add(q.u,q.v,(q.scanned?2.08:2)*q.w,(q.scanned?2.11:2)*q.d,top,'springRock',true,q.angle);
      rim.roundHeight=q.h;
    }
    if(s.regional){
      const {inlet,sign}=regionalBathFittings(s,springLip);
      if(!hasOwnInlet(s)){
        add(inlet.u,inlet.v-.20,inlet.w,1.34,.72,'oval',true);
        add(inlet.u,inlet.v+.04,1.18,1.92,inlet.h,'box',true).bottom=level+.62;
      }
      if(s.shape!=='suzuri' && !kilnSteamBath(s)){
        add(sign.u,sign.v-.07,.13,.13,1.33,'wall');
        add(sign.u,sign.v,sign.w,sign.d,sign.h,'wall').bottom=level+.89;
      }
    }else{
      const u=-s.rx*.71,v=-s.rz*.51;
      add(u,v-.62,1.24,1.06,1.13,'oval',true);
      add(u,v+.02,.53,1.62,1.25,'box',true).bottom=level+.97;
      for(const q of waysideBankRocks(s))add(q.u,q.v,2*q.w,2*q.d,1.20*q.h,'oval',true,q.yaw);
    }
    addBathEnclosureSolids(s,add);
  }
}
