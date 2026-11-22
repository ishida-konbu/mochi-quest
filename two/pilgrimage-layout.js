// Shared by terrain, collision, map paths, and the painted landmarks.
// Positive local Z points out of the temple, toward an approaching pilgrim.
import { DISTRICTS, DISTRICT_SHIFT } from './geography.js';
import { TRADE_ROADS } from './trade-routes.js';

const { PI, sin, cos, abs, hypot, min, max, exp } = Math;
const clamp01 = x => min(1, max(0, x));
function ease(x) {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}
function mix(a, b, t) { return a + (b - a) * t; }

export const DAIBUTSU = { x:DISTRICTS.todaiji.x, z:DISTRICTS.todaiji.z-17 };
export const PEACH = DISTRICTS.peach;
const inari = DISTRICTS.inari;
// Paired spurs alternate between the near and far lips of the valley. Their
// widths are measured along and across the ridge, so a cut between summits
// exposes distant paper sky when looking up from the orchard.
const crags=Array.from({length:19},(_,i)=>{
  const a=.53+i*.292, ca=cos(a),sa=sin(a);
  const ridge=.76+.068*sin(5*a)+.059*cos(3*a);
  const r=ridge+(i%3===0?-.093:i%3===1?.075:-.014);
  return {x:PEACH.x+123*ca*r,z:PEACH.z+108*sa*r,ca,sa,
    width:18+10*(1+sin(i*2.67))*.5,depth:21+16*(1+cos(i*2.17))*.5,
    h:8+9*(1+sin(i*2.06+.86))*.5+(i%4===0?3:0),i};
});
export const CLIFF_PINES=crags.flatMap((c,i)=>{
  const count=2+i%4;
  return Array.from({length:count},(_,j)=>{
    const side=cos(j*2.42+i*3.14)*c.width*(j?.79:.16);
    const along=sin(j*2.18+i*1.71)*c.depth*(j?.73:.11);
    return {x:c.x-side*c.sa+along*c.ca,z:c.z+side*c.ca+along*c.sa,
      scale:(j?.73:1.02)+.28*(1+cos(j*2.41+i))*.5,yaw:1.55-i*.87+j*.40,type:(i+j)%3};
  });
});
export const WEDDING_SITES=[
  {x:-193,z:-388,rx:19,rz:2.18},
  {x:-211,z:-445,rx:12,rz:2.13},
  {x:-218,z:-503.6,rx:21,rz:2.04},
].map(site => ({...site,x:site.x+DISTRICT_SHIFT.inari.x,z:site.z+DISTRICT_SHIFT.inari.z}));
export const WEDDING_ROLES=['lantern','groom','bride','parasol','flute'];
export function weddingWalkerPose(siteIndex,roleIndex,time) {
  const site=WEDDING_SITES[siteIndex];
  return weddingPoint(site,time*.82+(site.rx-site.rz)*1.04+siteIndex*2.2-roleIndex*1.70);
}
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
// Fractured caprock follows three different spurs. The long axis of each
// slab follows its ridge and the narrow ledge below its crown gathers pine.
const ridgeHeads=[
  [-182,14,67,34,-.23,33],[-247,42,50,25,-.42,28],[-292,66,56,32,-.70,22],
  [-286,160,61,32,-1.05,27],[-229,207,48,23,-.94,23],[-176,247,35,19,-.71,16],
  [39,-7,55,22,.54,35],[92,51,64,22,.85,27],[116,103,40,17,1.03,19],
].map(([x,z,w,d,a,h])=>({x,z,w,d,h,c:cos(a),s:sin(a),extent:hypot(w,d)}));
// The western divide bends north behind the orchard. Each summit sits on
// its own shoulder; passes cut across the spine toward the outer foothills.
const peachRidgelines=[
  [-126,0,126,52,-1.22,52],[-72,-86,141,51,-.34,45],[-149,-94,93,67,.42,28],
  [-143,54,88,40,-1.11,24],[-79,-103,69,36,-.49,47],[-156,-42,58,36,-.99,43],
  [17,-100,79,34,.25,43],[-181,20,46,33,-.96,23],[77,-77,69,29,.76,24],
  [-193,-68,48,29,-.42,-17],[-119,-79,40,22,-.91,-16],[8,-133,54,24,.38,-14],
].map(([x,z,w,d,a,h])=>({x,z,w,d,c:cos(a),s:sin(a),h}));
function peachRange(x,z,base) {
  const dx=x-PEACH.x,dz=z-PEACH.z,a=dx/123,b=dz/108,r=hypot(a,b);
  const angle=Math.atan2(b,a),gate=ease((abs(angle)-.24)/.64);
  let ridges=0;
  for(const peak of peachRidgelines){
    const u=dx-peak.x+21,v=dz-peak.z+13;
    const along=(u*peak.c+v*peak.s)/peak.w,side=(v*peak.c-u*peak.s)/peak.d;
    ridges+=peak.h*exp(-(along*along+side*side));
  }
  const apron=ease((r-.51-.08*sin(2*angle))/.71)*gate;
  const limit=ease((dx+311)/53)*ease((227-dx)/50)*ease((dz+253)/53)*ease((191-dz)/43);
  const folds=(2.5*cos(dx*.064+dz*.045)+1.6*sin(dz*.091-dx*.073))*ease(ridges/42);
  const massif=.86*max(0,ridges+folds)*apron*limit;
  if(r>=1.3)return base+massif;

  // Low blades of exposed rock sit in broad, overlapping buttresses. Keep
  // the eastern approach and the floor of the orchard below the first ridge.
  const ridge=.77+.071*sin(5*angle)+.056*cos(3*angle);
  const peaks=.61+.30*sin(5*angle+.65)+.17*cos(9*angle);
  const buttress=exp(-((r-ridge)**2)/.057)*(14+13*peaks)*gate*ease((r-.40)/.34);
  let bluff=0;
  if(r>.42 && r<1.25)for(const c of crags){
    const u=x-c.x,v=z-c.z;
    if(abs(u)>53 || abs(v)>53)continue;
    const across=(-u*c.sa+v*c.ca)/c.width, along=(u*c.ca+v*c.sa)/c.depth;
    const q=hypot(across+.14*along,along);
    const crown=.67*(1-ease(q))+.33*(1-ease((q-.26)/.52));
    bluff=max(bluff,c.h*crown*gate);
  }
  const basin=5.3+2.2*sin(a*5+.3)*cos(b*6)+3.5*r;
  return mix(base,basin+buttress+bluff,ease((1.3-r)/.33))+massif;
}
export function pilgrimageHeight(x, z, base) {
  if(x>PEACH.x-311 && x<PEACH.x+227 && z>PEACH.z-253 && z<PEACH.z+191)
    return peachRange(x,z,base);
  // An undulating watershed above the pilgrimage road. Overlapping lobes
  // carry the main divide into subsidiary ridges, open saddles and valleys.
  const dx=x-inari.x, dz=z-inari.z;
  if (dx > -465 && dx < 285 && dz > -104 && dz < 454) {
    const shape=(u,v,rx,rz,turn)=>{
      const side=(dx-u)*cos(turn)+(dz-v)*sin(turn);
      const along=(dz-v)*cos(turn)-(dx-u)*sin(turn);
      return exp(-((side/rx)**2+(along/rz)**2));
    };
    const divide=64*shape(-107,60,217,110,-.30) + 39*shape(-202,143,145,100,-.84);
    const crests=38*shape(-210,6,98,27,-.23) + 37*shape(-294,135,57,61,-.58)
      + 46*shape(23,5,72,33,.52) + 25*shape(85,137,46,81,-.58)
      + 28*shape(-160,265,53,99,-.55);
    const watercourse=12*shape(-179,132,23,122,-.70)+10*shape(14,120,24,92,.75);
    const escarpment=12*shape(-215,36,91,23,-.26)*ease((32-dz-.21*dx)/10);
    const rim=ease((dz+104)/39)*ease((454-dz)/88)*ease((dx+465)/70)*ease((285-dx)/65);
    let caprock=0;
    for(const peak of ridgeHeads){
      const u=dx-peak.x,v=dz-peak.z;
      if(abs(u)>peak.extent || abs(v)>peak.extent) continue;
      const along=(u*peak.c+v*peak.s)/peak.w,side=(v*peak.c-u*peak.s)/peak.d;
      const r=hypot(along,side+.19*along*along);
      const ledge=.16*(1-ease((r-.57)/.15))+.12*(1-ease((r-.25)/.17));
      caprock=max(caprock,peak.h*(.72*(1-ease(r))+ledge));
    }
    const relief=Math.max(0, divide+crests+caprock-watercourse+escarpment);
    let mountain=base+rim*relief*(1+.032*sin(x*.078)*cos(z*.063));
    // Each hairpin crosses the same contour as the next gate. Feather the
    // surveyed approach and its wedding terraces back into natural slopes.
    const tread=clamp01((155-dz)/156);
    const roadGrade=7+84*ease(tread)+3.4*sin(tread*PI)*sin(dx*.034+dz*.021);
    const pathWidth=ease((dx+176)/48)*ease((47-dx)/40)
      *ease((dz+32)/20)*ease((187-dz)/29);
    mountain=mix(mountain,roadGrade,pathWidth);
    for(const site of WEDDING_SITES){
      if(abs(x-site.x)>site.rx+6 || abs(z-site.z)>7) continue;
      const fade=ease((7-abs(z-site.z))/3.6)*ease((site.rx+6-abs(x-site.x))/4);
      mountain=mix(mountain,7+84*ease((inari.z+155-site.z)/156),fade);
    }
    return mountain;
  }
  if (abs(x-DISTRICTS.todaiji.x)<93 && abs(z-DISTRICTS.todaiji.z)<79) {
    const r = hypot((x-DISTRICTS.todaiji.x)/93,(z-DISTRICTS.todaiji.z)/79);
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
  const firstX = inari.x + (side === -1 ? 0 : -114), firstZ = inari.z+155-2*row*turnRadius;
  if (along <= sweep) {
    const x=firstX+side*along, u=(x-inari.x+sweep)/sweep;
    const envelope=sin(PI*u)**2, bend=3.1*cos(row*.65)+1.65*sin(2*PI*u);
    const derivative=(PI*sin(2*PI*u)*bend+envelope*3.3*PI*cos(2*PI*u))/sweep;
    return {x,z:firstZ+bend*envelope,yaw:Math.atan2(side,side*derivative)};
  }
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
export const MOON_GATE={x:PEACH.x-15,z:PEACH.z};
function orchard() {
  let state=634711;
  const rand = () => (state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
  const trees=[];
  for(let i=0;i<430;i++){
    const u = (rand()-.5)*174, v = (rand()-.5)*135;
    if(hypot(u/83,v/66)>1 || hypot(u,v)<10 || abs(v-3*sin(u/13))<3.9) continue;
    if(alongPass(PEACH.x+u,PEACH.z+v,peachPass,4.6) ||
      hypot(PEACH.x+u-MOON_GATE.x,PEACH.z+v-MOON_GATE.z)<9) continue;
    const wx=PEACH.x+u,wz=PEACH.z+v,ground=pilgrimageHeight(wx,wz,5);
    if(ground>17 && hypot(pilgrimageHeight(wx+1,wz,5)-ground,pilgrimageHeight(wx,wz+1,5)-ground)>.78) continue;
    if(trees.some(q=>(q.x-PEACH.x-u)**2+(q.z-PEACH.z-v)**2<27)) continue;
    trees.push({x:PEACH.x+u,z:PEACH.z+v,size: .76+rand()*.63,turn:rand()*PI*2,seed:i+4493});
  }
  // The ancient tree at the moon gate is a separate sculpture. Include it
  // in the census when tripling the original orchard; retain every old trunk.
  const target=(trees.length+1)*3-1;
  const clearings=[[6,-3,9],[-13,7,7],[-32,-12,7],[40,-10,7],[15,-26,6]];
  const floorTarget=target-162;
  for(let attempt=0;trees.length<target && attempt<30000;attempt++){
    const cliff=trees.length>=floorTarget;
    let u,v;
    if(cliff){
      // Groups of five to ten follow separate shelves. Vary their height
      // between the inner cliff and the receding western and northern ridges.
      const c=crags[(Math.floor(attempt/8)*7)%crags.length];
      const d=.73+rand()*.86;
      u=(c.x-PEACH.x)*d+(rand()-.5)*24;
      v=(c.z-PEACH.z)*d+(rand()-.5)*19;
    }else{
      u=(rand()-.5)*195;v=(rand()-.5)*153;
      if(hypot(u/94,v/73)>1 || hypot(u,v)<11 || abs(v-3*sin(u/13))<4.0)continue;
    }
    const x=PEACH.x+u,z=PEACH.z+v,h=pilgrimageHeight(x,z,5);
    const slope=hypot(pilgrimageHeight(x+.7,z,5)-h,pilgrimageHeight(x,z+.7,5)-h)/.7;
    if(cliff ? h<21 || slope>1.65 : slope>.72 || h>24)continue;
    if(alongPass(x,z,peachPass,4.8) || hypot(x-MOON_GATE.x,z-MOON_GATE.z)<9 ||
      clearings.some(([a,b,r])=>hypot(u-a,v-b)<r) || CLIFF_PINES.some(q=>hypot(x-q.x,z-q.z)<3))continue;
    const spacing=cliff?5.3:4.65;
    if(trees.some(q=>(x-q.x)**2+(z-q.z)**2<spacing*spacing))continue;
    trees.push({x,z,cliff,size:cliff?.72+rand()*.75:.78+rand()*.67,turn:rand()*2*PI,seed:19342+attempt});
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
    const x=inari.x-152+random()*177,z=inari.z-13+random()*178;
    if(hypot((x-inari.x+62)/94,(z-inari.z-77)/105)>1.05 ||
      hypot(x-inari.x,z-inari.z)<13 || hypot(x-inari.x+60,z-inari.z-90)<18 ||
      alongPass(x,z,INARI_ROUTE,3.65) || alongPass(x,z,inariApproach,4.9) ||
      WEDDING_SITES.some(q=>abs(x-q.x)<q.rx+5&&abs(z-q.z)<5.6)) continue;
    if(CEDAR_GROVES.some(t=>(x-t.x)**2+(z-t.z)**2<29))continue;
    CEDAR_GROVES.push({x,z,h:7+random()*8,yaw:random()*2*PI});
  }
}
export const INARI_SANCTUARY = {x:inari.x,z:inari.z-7};
export function pilgrimageSolids(height, putSolid) {
  for(const {x,z,width,yaw,height:h} of INARI_GATES) {
    const base=height(x,z);
    putSolid(x,z,width*.456,width*.026,yaw,base+h*.769,'slab',true,0,base+h*.721);
    const crown=putSolid(x,z,width*.541,width*.06,yaw,base+h*.974,'toriiCrown',true,h*.065);
    crown.thickness=h*.094;
    for(const side of [-1,1]){
      const dx=side*width*.36;
      putSolid(x+dx*cos(yaw),z-dx*sin(yaw),.17,.17,0,height(x,z)+h,'oval',false);
    }
  }
  for(const tree of PEACH_TREES) putSolid(tree.x,tree.z,.25*tree.size,.25*tree.size,0,
    height(tree.x,tree.z)+2.6*tree.size,'oval',false);
  for(const t of CLIFF_PINES) putSolid(t.x,t.z,.21*t.scale,.21*t.scale,0,height(t.x,t.z)+4.8*t.scale,'oval',false);
  putSolid(MOON_GATE.x-.82,MOON_GATE.z-5.65,.60,.63,0,height(MOON_GATE.x,MOON_GATE.z)+4.83,'oval',false);
  for(const side of [-1,1]) putSolid(MOON_GATE.x,MOON_GATE.z+side*3.23,.31,1.42,0,
    height(MOON_GATE.x,MOON_GATE.z)+4.8,'wall',false);
  putSolid(MOON_GATE.x,MOON_GATE.z,5.085,.685,PI/2,height(MOON_GATE.x,MOON_GATE.z)+4.63,'roof',true,.72).form='hip';
  const {x,z}=DAIBUTSU, base=height(x,z);
  // Follow the seated knees and the narrower, forward-tilted head as the
  // player or camera rises alongside the statue.
  putSolid(x,z,6.48,5.09,0,base+3.14,'oval',false);
  putSolid(x,z+.28,6.30,3.68,0,base+7.53,'oval',false,0,base+3.00);
  putSolid(x,z,4.47,2.48,0,base+13.27,'oval',false,0,base+7.32);
  putSolid(x,z+.39,2.39,2.33,0,base+18.45,'oval',false,0,base+13.03);
  for(const [u,v] of TEMPLE_COLUMNS) putSolid(x+u,z+v,.58,.58,0,base+22,'oval',false);
  // Worshippers approach through the open front of the hall.
  putSolid(x,z-11.4,16,.45,0,base+20.2,'wall',false);
  putSolid(x,z,18,12.9,0,base+21.8,'ceiling',false);
  const hallRoof=putSolid(x,z,19.75,14.7,0,base+21.8,'roof',true,5.8); hallRoof.form='hip';
  putSolid(x,z-.7,10.4,4.95,0,base+26.78,'wall',false,0,base+23.78);
  putSolid(x,z-.7,14.4,8.2,0,base+26.24,'roof',true,5.85).form='hip';
  putSolid(x,z-.7,7.05,.255,0,base+32.33,'slab',true,0,base+31.91);
  for(const side of [-1,1]){
    for(let j=0;j<8;j++)for(const u of [-1.74,1.74]) putSolid(x+side*22+u,z-4.8+j*4,.18,.18,0,base+4.12,'oval',false);
    for(const rz of [13.6,22.5,31.6]) putSolid(x+side*7.1,z+rz,.54,.54,0,base+3.22,'oval',false);
    const r=putSolid(x+side*22,z+9.2,16.5,3.4,PI/2,base+4.14,'roof',true,2.47);r.form='gable';
  }
  const shrine=INARI_SANCTUARY;
  for(const side of [-1,1])putSolid(shrine.x+side*5,shrine.z+3.9,.48,.48,0,
    height(shrine.x,shrine.z)+2.61,'oval',false);
  putSolid(shrine.x,shrine.z+3.52,.99,.50,0,height(shrine.x,shrine.z)+1.09,'box',true);
  const ground=height(shrine.x,shrine.z);
  putSolid(shrine.x,shrine.z,4.55,3.84,0,ground+3.97,'roof',true,3.37).form='hip';
  putSolid(shrine.x,shrine.z+2.70,2.82,1.705,0,ground+3.34,'roof',true,1.44).form='hip';
  putSolid(shrine.x,shrine.z,3.3,2.62,0,height(shrine.x,shrine.z)+4.4,'box',false);
}
