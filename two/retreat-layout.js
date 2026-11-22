// Positive local Z faces the road. Roofs, steps, pool lips and their
// collision volumes share the same survey as the signposts on the map.
import { districtPoint } from './geography.js';
import { TRADE_ROADS, measureRoute, cartPosition } from './trade-routes.js';

const [cx,cz]=districtPoint('kyo',42,-448);
export const COURT={x:cx,z:cz,name:'京の評定所',yaw:0};
export const COURT_COLUMNS=[-13.2,-8.8,-4.4,0,4.4,8.8,13.2];
export const COURT_STEPS=Array.from({length:5},(_,i)=>({z:9.36-i*.56,top:.21+i*.21}));

function wayside(id, fraction, offset) {
  const road=measureRoute(TRADE_ROADS.find(r=>r.id===id).knots);
  const p=cartPosition(road,fraction*road.length,1);
  const yaw=p.yaw-Math.sign(offset)*Math.PI/2;
  return {x:p.x-Math.sin(yaw)*Math.abs(offset),z:p.z-Math.cos(yaw)*Math.abs(offset),yaw};
}
export const RETREATS=[
  {...wayside('capital-road',.50,16),name:'杉木立の湯',kind:'cedar',hut:true,rx:4.65,rz:3.55},
  {...wayside('temple-road',.56,-16),name:'薄明の湯',kind:'reed',rx:5.9,rz:3.08},
  {...wayside('peach-pass',.68,16),name:'桃霞の湯',kind:'peach',hut:true,rx:4.68,rz:3.94},
  {...wayside('inari-road',.64,-16),name:'雲間の湯',kind:'slate',rx:5.36,rz:3.30},
  {x:-127,z:146,yaw:2.42,name:'潮待ちの湯',kind:'coast',hut:true,rx:5.12,rz:3.82},
  {x:229,z:-172,yaw:.71,name:'楓の岩湯',kind:'maple',rx:4.77,rz:4.02},
].map((site,index)=>({...site,index}));

export function sitePoint(site,u,v) {
  return [site.x+u*Math.cos(site.yaw)+v*Math.sin(site.yaw),
    site.z-u*Math.sin(site.yaw)+v*Math.cos(site.yaw)];
}
const siteCells=new Map();
for (const s of RETREATS) {
  for(let a=Math.floor((s.x-14)/32);a<=Math.floor((s.x+14)/32);a++)
    for(let b=Math.floor((s.z-14)/32);b<=Math.floor((s.z+14)/32);b++)
      siteCells.set(a*256+b,s);
}
export const nearbyRetreat=(x,z)=>siteCells.get(Math.floor(x/32)*256+Math.floor(z/32));
export const springLip=(index,a)=>1+.103*Math.sin(3*a+index*.95)+.051*Math.cos(2*a-index*.62)+.026*Math.cos(5*a);
export function bathRadius(s,x,z) {
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const u=(dx*c-dz*k)/s.rx,v=(dx*k+dz*c)/s.rz;
  return Math.hypot(u,v)/springLip(s.index,Math.atan2(v,u));
}
export function reservedScenery(x,z) {
  if(Math.abs(x-cx)<19.8 && z>cz-10.9 && z<cz+28) return true;
  const s=nearbyRetreat(x,z);
  return !!s && Math.hypot(s.x-x,s.z-z)<(s.hut?9.6:7.1);
}
const ease=n=>{const t=Math.min(1,Math.max(0,n));return t*t*(3-2*t);};
export function courtTerrain(x,z,native,base) {
  const edge=Math.max(Math.abs(x-cx)-18,cz-10-z,z-cz-25);
  return edge>=5 ? native : native+(base(cx,cz)-native)*(1-ease(edge/5));
}
export function bathTerrain(s,x,z,native,level) {
  const r=bathRadius(s,x,z);
  // A shallow submerged seat rises into a gravel beach at the entrance.
  const cut=level-.52+.64*ease((r-.68)/.40);
  let ground=cut+(native-cut)*ease((r-1.10)/.76);
  if(s.hut) {
    const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
    const edge=Math.max(Math.abs(dx*c-dz*k)-3.1,Math.abs(dx*k+dz*c+5.2)-1.4);
    ground+=(level+.05-ground)*(1-ease(edge/1.2));
  }
  return ground;
}
export function retreatStones(s) {
  const count=28;
  return Array.from({length:count},(_,i)=>{
    const a=i*Math.PI*2/count, turn=Math.sin(7.3*i+s.index);
    const lip=springLip(s.index,a);
    const u=Math.cos(a)*s.rx*lip,v=Math.sin(a)*s.rz*lip;
    const size=.83+.16*Math.sin(i*3.83+s.index)+.125*Math.cos(i*2.51);
    return {u,v,w:size*1.05,h:size*(.48+.24*(1+Math.sin(i*4.13))*.5),d:size*.76,angle:-a+.15*turn,i,scanned:i%3===0};
  }).filter(q=>q.v<s.rz*.73 || Math.abs(q.u)>1.84);
}

export function civicAndBathSolids(height,put) {
  const base=height(cx,cz);
  function solid(x,z,w,d,top,kind,support=false) {
    return put(cx+x,cz+z,w/2,d/2,0,base+top,kind,support);
  }
  solid(0,0,29,14,1.05,'floor',true);
  for(const step of COURT_STEPS) solid(0,step.z,7.8,.61,step.top,'floor',true);
  for(const x of COURT_COLUMNS) for(const z of [-5.55,5.55]){
    if(z>0&&x===0) continue;
    solid(x,z,.53,.53,7.7,'oval');
  }
  for(const side of [-1,1]){
    solid(side*10.4,-4.82,3.96,.91,3.46,'box',true);
    solid(side*13.3,0,.29,11.4,7.4,'wall');
    solid(side*9.10,6.78,8.75,.14,2.37,'wall');
    solid(side*13.4,15.5,.36,17,2.0,'wall');
    solid(side*9.0,23.7,9.36,.48,2.0,'wall');
    solid(side*3.91,22.87,.18,2.0,3.35,'wall');
    for(const v of [-.72,.72])solid(side*4.15,23.7+v,.48,.48,4.53,'wall');
    for(const v of [9.7,20.3])solid(side*7.4,v,1.05,.98,3.20,'oval',true);
  }
  solid(-9,2.9,2.48,.94,1.65,'box',true);
  solid(0,-5.68,26.8,.32,7.6,'wall');
  solid(0,-2.85,7.6,3.7,1.35,'floor',true);
  solid(0,-1.93,3.05,.92,1.98,'box',true);
  solid(0,0,30.2,15.4,7.71,'ceiling');
  solid(0,23.7,10.7,4.4,4.42,'ceiling');
  put(cx,cz,16.2,8.9,0,base+7.74,'roof',true,5.12).form='hip';
  put(cx,cz+23.7,5.8,2.2,0,base+4.44,'roof',true,1.83).form='hip';

  for(const s of RETREATS) {
    const level=height(s.x,s.z)+.52;
    const add=(u,v,w,d,y,kind,support=false,angle=0)=>{
      const [x,z]=sitePoint(s,u,v);
      return put(x,z,w/2,d/2,s.yaw+angle,level+y,kind,support);
    };
    for(const q of retreatStones(s)){
      const top=q.scanned?-.03+1.18*q.h:.075+q.h;
      const rim=add(q.u,q.v,(q.scanned?2.08:2)*q.w,(q.scanned?2.11:2)*q.d,top,'springRock',true,q.angle);
      rim.roundHeight=q.h;
    }
    if(s.kind==='slate'||s.kind==='maple'){
      for(let i=0;i<9;i++){
        const u=-4.3+.83*i,v=-4.15-.35*Math.cos(i*.7),h=(1+.58*Math.sin(i*.64))*(s.kind==='slate'?1.8:1);
        add(u,v,2.3,1.92,1.17*h,'oval',true,i*.17);
      }
    }
    if(!s.hut)continue;
    for(const u of [-2.9,2.9])for(const v of [-6.5,-3.9])add(u,v,.20,.20,3.31,'wall');
    add(0,-6.53,5.9,.15,2.85,'wall');
    add(0,-5.2,6.35,3.1,.27,'floor',true);
    add(0,-5.2,7.2,4.4,3.30,'ceiling');
    add(0,-5.2,7.2,4.4,3.35,'roof',true).roofRise=1.64;
  }
}
