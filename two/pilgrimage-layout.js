// Shared by terrain, collision, map paths, and the painted landmarks.
// Positive local Z points out of the temple, toward an approaching pilgrim.
import { TRADE_ROADS } from './trade-routes.js';

const { PI, sin, cos, abs, hypot, min, max, exp } = Math;
const clamp01 = x => min(1, max(0, x));
function ease(x) {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}
function mix(a, b, t) { return a + (b - a) * t; }

export const DAIBUTSU = { x:215, z:408 };
export const PEACH = { x:-390, z:-91 };
export const WEDDING_SITES=[
  {x:-193,z:-388,rx:19,rz:2.18},
  {x:-211,z:-445,rx:12,rz:2.13},
  {x:-218,z:-503.6,rx:21,rz:2.04},
];
export function weddingPoint(q,walked) {
  const straight=2*(q.rx-q.rz), half=straight+PI*q.rz, full=half*2;
  const lap=((walked%full)+full)%full;
  const side=lap<half ? 1 : -1, d=lap%half;
  const angle=(d-straight)/q.rz;
  return {
    x:q.x+side*(d<=straight ? d-straight/2 : straight/2+q.rz*sin(angle)),
    z:q.z+side*q.rz*(d<=straight ? 1 : cos(angle)),
    yaw:d<=straight ? side*PI/2 : Math.atan2(side*cos(angle),-side*sin(angle)),
  };
}
export function pilgrimageHeight(x, z, base) {
  if (x < -271 && x > -543 && z > -216 && z < 34) {
    const a = (x - PEACH.x) / 123, b = (z - PEACH.z) / 108, r = hypot(a,b);
    if (r >= 1.16) return base;
    // An interrupted horseshoe of ink-wash crags leaves an approach from the east.
    const angle = Math.atan2(b,a);
    const ridge = .76 + .068 * sin(5*angle) + .059 * cos(3*angle);
    const peaks = .46 + .29 * (1 + sin(7*angle + .7)) + .16 * cos(12*angle);
    const gate = ease((abs(angle) - .10) / .65);
    const walls = exp(-((r-ridge)**2)/.016) * (19 + 31*peaks) * gate;
    const valley = 5.3 + 2.2*sin(a*5+.3)*cos(b*6) + 3.5*r + walls;
    return mix(base,valley,ease((1.16-r)/.30));
  }
  if (x > -343 && x < -84 && z > -583 && z < -347) {
    const shoulder = ease((1 - abs(x+215)/130)/.38) *
      ease((-z-347)/25) * ease((z+583)/45);
    let slope = 6 + 76*ease((-z-380)/156);
    for(const s of WEDDING_SITES){
      const fade=ease((6.3-abs(z-s.z))/2.7)*ease((s.rx+5-abs(x-s.x))/4);
      if(fade) slope=mix(slope,6+76*ease((-s.z-380)/156),fade);
    }
    return mix(base,slope,shoulder);
  }
  if (x > 122 && x < 313 && z > 350 && z < 510) {
    const r = hypot((x-215)/93,(z-425)/79);
    if(r < 1) return mix(base,5.8+ease((r-.51)/.50)*(2.4+1.5*cos(x*.067)),
      ease((1-r)/.31));
  }
  return base;
}

const sweep = 114, turnRadius = 153/16, leg = sweep + PI*turnRadius;
export function inariPoint(t) {
  const d = clamp01(t)*8*leg;
  const row = min(7,Math.floor(d/leg));
  const along = d-row*leg, side = row%2 ? 1 : -1;
  const firstX = side === -1 ? -153 : -267, firstZ = -380-2*row*turnRadius;
  if (along <= sweep) return {x:firstX+side*along,z:firstZ,yaw:side*PI/2};
  const a = min(PI,(along-sweep)/turnRadius);
  return { x:firstX+side*(sweep+turnRadius*sin(a)), z:firstZ-turnRadius*(1-cos(a)),
    yaw:Math.atan2(side*cos(a),-sin(a)) };
}
export const INARI_ROUTE = Array.from({length:577}, (_,i) => {
  const {x,z} = inariPoint(i/576);
  return [x,z];
});
export const INARI_GATES = Array.from({length:1000}, (_,i) => {
  const f = i/999, q = inariPoint(f);
  const monumental = i%125===0 || i===999;
  return {...q,width:monumental ? 6.25 : 4.67+.22*cos(f*PI*16),
    height:monumental ? 5.7 : 4.18+.17*cos(f*PI*16)};
});

function alongPass(x,z,knots,radius) {
  for(let i=1;i<knots.length;i++){
    const [a,b]=knots[i-1],[c,d]=knots[i],u=c-a,v=d-b;
    const t=clamp01(((x-a)*u+(z-b)*v)/(u*u+v*v));
    if((x-a-u*t)**2+(z-b-v*t)**2<radius*radius) return true;
  }
  return false;
}
const peachPass=TRADE_ROADS.find(r=>r.id==='peach-pass').knots;
const inariApproach=TRADE_ROADS.find(r=>r.id==='inari-road').knots;
export const MOON_GATE={x:-405,z:-91};
function orchard() {
  let state=634711;
  const rand = () => (state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
  const trees=[];
  for(let i=0;i<430;i++){
    const u = (rand()-.5)*174, v = (rand()-.5)*135;
    if(hypot(u/83,v/66)>1 || hypot(u,v)<10 || abs(v-3*sin(u/13))<3.9) continue;
    if(alongPass(PEACH.x+u,PEACH.z+v,peachPass,4.6) ||
      hypot(PEACH.x+u-MOON_GATE.x,PEACH.z+v-MOON_GATE.z)<9) continue;
    if(trees.some(q=>(q.x-PEACH.x-u)**2+(q.z-PEACH.z-v)**2<27)) continue;
    trees.push({x:PEACH.x+u,z:PEACH.z+v,size: .76+rand()*.63,turn:rand()*PI*2,seed:i+4493});
  }
  return trees;
}
export const PEACH_TREES = orchard();
export const TEMPLE_COLUMNS = [-16,-11,11,16].flatMap(x=>[-10,0,10].map(z=>[x,z]));
// Cedar woods run beside the switchbacks. The central walk, shrine apron,
// stone stamp table and the three wedding clearings stay open.
export const CEDAR_GROVES=[];
{
  let state=4638257;
  const random=()=>(state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
  for(let i=0;i<440;i++){
    const x=-305+random()*177,z=-548+random()*178;
    if(hypot((x+215)/94,(z+458)/105)>1.05 ||
      hypot(x+153,z+535)<13 || hypot(x+213,z+445)<18 ||
      alongPass(x,z,INARI_ROUTE,3.65) || alongPass(x,z,inariApproach,4.9) ||
      WEDDING_SITES.some(q=>abs(x-q.x)<q.rx+5&&abs(z-q.z)<5.6)) continue;
    if(CEDAR_GROVES.some(t=>(x-t.x)**2+(z-t.z)**2<29))continue;
    CEDAR_GROVES.push({x,z,h:7+random()*8,yaw:random()*2*PI});
  }
}
export const INARI_SANCTUARY = {x:-153,z:-542};
export function pilgrimageSolids(height, putSolid) {
  for(const {x,z,width,yaw,height:h} of INARI_GATES) {
    putSolid(x,z,width*.45,.13,yaw,height(x,z)+h*.722,'ceiling',false);
    for(const side of [-1,1]){
      const dx=side*width*.36;
      putSolid(x+dx*cos(yaw),z-dx*sin(yaw),.17,.17,0,height(x,z)+h,'oval',false);
    }
  }
  for(const tree of PEACH_TREES) putSolid(tree.x,tree.z,.25*tree.size,.25*tree.size,0,
    height(tree.x,tree.z)+2.6*tree.size,'oval',false);
  for(const t of CEDAR_GROVES) putSolid(t.x,t.z,.21,.21,0,height(t.x,t.z)+t.h*.82,'oval',false);
  for(const side of [-1,1]) putSolid(MOON_GATE.x,MOON_GATE.z+side*3.23,.31,1.42,0,
    height(MOON_GATE.x,MOON_GATE.z)+4.8,'wall',false);
  const {x,z}=DAIBUTSU, base=height(x,z);
  putSolid(x,z,6,4.65,0,base+3.05,'oval',false);
  putSolid(x,z-.35,4.6,3.05,0,base+17.4,'oval',false,0,base+2.8);
  for(const [u,v] of TEMPLE_COLUMNS) putSolid(x+u,z+v,.58,.58,0,base+22,'oval',false);
  // Worshippers approach through the open front of the hall.
  putSolid(x,z-11.4,16,.45,0,base+20.2,'wall',false);
  putSolid(x,z,18,12.9,0,base+21.8,'ceiling',false);
  const hallRoof=putSolid(x,z,19.75,14.7,0,base+21.8,'roof',true,5.8); hallRoof.form='hip';
  for(const side of [-1,1]){
    for(let j=0;j<8;j++)for(const u of [-1.74,1.74]) putSolid(x+side*22+u,z-4.8+j*4,.18,.18,0,base+4.12,'oval',false);
    for(const rz of [13.6,22.5,31.6]) putSolid(x+side*7.1,z+rz,.54,.54,0,base+3.22,'oval',false);
    const r=putSolid(x+side*22,z+9.2,16.5,3.4,PI/2,base+4.14,'roof',true,2.47);r.form='gable';
  }
  const shrine=INARI_SANCTUARY;
  for(const side of [-1,1])putSolid(shrine.x+side*5,shrine.z+3.9,.48,.48,0,
    height(shrine.x,shrine.z)+2.61,'oval',false);
  putSolid(shrine.x,shrine.z,3.3,2.62,0,height(shrine.x,shrine.z)+4.4,'box',false);
}
