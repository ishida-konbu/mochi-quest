// Shared by terrain, collision, map paths, and the painted landmarks.
// Positive local Z points out of the temple, toward an approaching pilgrim.
import { peachRangeHeight, PEACH_RANGE_BOUNDS } from './peach-range.js';
import { DISTRICTS, DISTRICT_SHIFT } from './geography.js';
import { TRADE_ROADS } from './trade-routes.js';
import { reservedScenery } from './retreat-layout.js';

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
export function pilgrimageHeight(x, z, base) {
  const {west,east,north,south}=PEACH_RANGE_BOUNDS;
  if(x>west && x<east && z>north && z<south)return peachRangeHeight(x,z,base);
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
// The same local stand index keeps planted trunks apart, clears the wild
// woodland crew's sites, and finds the flowering canopy above a traveller.
const peachCells=new Map(),peachCell=16;
function visitPeaches(x,z,r,visit){
  for(let col=Math.floor((x-r)/peachCell);col<=Math.floor((x+r)/peachCell);col++){
    for(let row=Math.floor((z-r)/peachCell);row<=Math.floor((z+r)/peachCell);row++){
      const stand=peachCells.get(col*512+row);
      if(stand)for(const tree of stand){
        if((x-tree.x)**2+(z-tree.z)**2<r*r && visit(tree))return true;
      }
    }
  }
  return false;
}
export const nearPeachTrunk=(x,z,r)=>visitPeaches(x,z,r,()=>true);
export function nearbyPeaches(x,z,r,visit){visitPeaches(x,z,r,tree=>{visit(tree);return false;});}

function orchard(){
  let state=634711;
  const rand=()=>(state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
  const trees=[],clearings=[[6,-3,9],[-13,7,7],[-32,-12,7],[40,-10,7],[15,-26,6]];
  function plant(tree){
    const key=Math.floor(tree.x/peachCell)*512+Math.floor(tree.z/peachCell);
    if(!peachCells.has(key))peachCells.set(key,[]);
    peachCells.get(key).push(tree);trees.push(tree);
  }
  function occupied(x,z,spacing){
    return nearPeachTrunk(x,z,spacing) || alongPass(x,z,peachPass,5.3) ||
      hypot(x-MOON_GATE.x,z-MOON_GATE.z)<9 || reservedScenery(x,z) ||
      clearings.some(([u,v,r])=>hypot(x-PEACH.x-u,z-PEACH.z-v)<r) ||
      CLIFF_PINES.some(q=>(x-q.x)**2+(z-q.z)**2<12);
  }
  function slope(x,z){
    return .5*hypot(pilgrimageHeight(x+1,z,5)-pilgrimageHeight(x-1,z,5),
      pilgrimageHeight(x,z+1,5)-pilgrimageHeight(x,z-1,5));
  }
  // A loose orchard on both banks leaves the moon gate, bout and picnics open.
  for(let attempt=0;trees.length<263 && attempt<4500;attempt++){
    const u=(rand()-.5)*188,v=(rand()-.5)*146,x=PEACH.x+u,z=PEACH.z+v;
    if(hypot(u/94,v/73)>1 || hypot(u,v)<10 || abs(v-3*sin(u/13))<3.9 ||
      occupied(x,z,4.9) || pilgrimageHeight(x,z,5)>26 || slope(x,z)>.73)continue;
    plant({x,z,size:.76+rand()*.67,turn:rand()*PI*2,seed:attempt+4493});
  }
  // Independent colonies on the shelves of the original inner crags.
  let ledges=0;
  for(let attempt=0;ledges<162 && attempt<7000;attempt++){
    const c=crags[(Math.floor(attempt/8)*7)%crags.length],d=.73+rand()*.84;
    const x=PEACH.x+(c.x-PEACH.x)*d+(rand()-.5)*24,z=PEACH.z+(c.z-PEACH.z)*d+(rand()-.5)*19;
    if(occupied(x,z,5.2) || pilgrimageHeight(x,z,5)<19 || slope(x,z)>1.36)continue;
    plant({x,z,cliff:true,size:.75+rand()*.69,turn:rand()*2*PI,seed:19342+attempt});ledges++;
  }
  // Stands follow the shoulder contours, curling into the lateral gullies.
  // The ridgeline alternates rose, pale double-flowered trees and exposed rock.
  const stands=[
    [-143,-34,48,20],[-175,-75,36,17],[-107,-79,43,19],[-61,-97,51,22],
    [-23,-75,36,18],[23,-91,51,21],[66,-112,43,19],[106,-76,42,18],
    [135,-104,39,17],[178,-76,55,21],[212,-48,47,16],[251,-27,29,12],
    [-176,29,39,17],[-134,55,44,18],[-96,75,39,16],[-63,99,40,19],
    [-33,68,42,18],[12,83,47,18],[64,92,49,20],[113,80,46,20],
    [151,71,44,19],[199,55,47,20],[239,24,34,14],
    [66,-38,32,16],[87,-11,38,19],[105,10,30,13],
    [85,53,34,16],[130,33,37,17],[157,9,38,17],[170,-33,39,17],
    [-135,-124,39,18],[-89,-142,43,16],[-43,-132,42,16],[35,-141,39,15],
  ];
  for(const [band,[u,v,length,width]] of stands.entries()){
    const cx=PEACH.x+u,cz=PEACH.z+v;
    const gx=pilgrimageHeight(cx+3,cz,5)-pilgrimageHeight(cx-3,cz,5);
    const gz=pilgrimageHeight(cx,cz+3,5)-pilgrimageHeight(cx,cz-3,5);
    const heading=Math.atan2(-gx,gz),c=cos(heading),s=sin(heading);
    const dye=Math.floor(rand()*5),count=Math.round(length*width/20);
    let accepted=0;
    for(let i=0;accepted<count && i<240;i++){
      const arc=rand()*PI*2,r=Math.sqrt(rand()),along=cos(arc)*r;
      const across=sin(arc)*r*width+width*.28*sin(along*3.2+band);
      const x=cx+along*length*c-across*s,z=cz+along*length*s+across*c;
      if(occupied(x,z,4.8))continue;
      const h=pilgrimageHeight(x,z,5),grade=slope(x,z);
      if(h<15 || grade>1.28 || (h>105 && rand()<.35))continue;
      const wayside=alongPass(x,z,peachPass,21);
      const size=(.83+rand()*.69)*(1-.18*clamp01((h-64)/75));
      plant({x,z,cliff:true,upland:true,wayside,size,turn:rand()*PI*2,
        tint:rand()<.68?dye:Math.floor(rand()*6),seed:80001+band*240+i});
      accepted++;
    }
  }
  // Wild peaches spill down fissures on the steep faces. These narrow
  // colonies interrupt the skyline bands; the intervening cliffs stay bare.
  const gullies=[
    [[-91,-40],[-88,-58],[-76,-86]], [[-46,-38],[-37,-58],[-49,-82]],
    [[-8,-42],[3,-60],[25,-84]], [[42,-38],[53,-53],[65,-78]],
    [[-85,34],[-94,49],[-91,76]], [[-39,39],[-29,58],[-43,82]],
    [[13,39],[25,55],[35,80]], [[55,43],[60,61],[81,78]],
    [[58,2],[71,-13],[81,-43]], [[108,27],[98,12],[94,-15]],
    [[125,-19],[112,-35],[105,-56]], [[116,35],[131,46],[137,66]],
    [[132,2],[141,18],[157,44]], [[162,-29],[174,-48],[188,-68]],
    [[186,13],[199,-6],[208,-38]], [[202,33],[203,49],[219,68]],
    [[-87,7],[-104,-2],[-124,-21]], [[-71,26],[-92,28],[-115,37]],
  ];
  for(const [gully,course] of gullies.entries()){
    const dye=(gully+2)%5;
    let planted=0;
    for(let i=0;i<200 && planted<33;i++){
      const span=rand()*2,leg=Math.floor(span),t=span-leg;
      const [ax,az]=course[leg],[bx,bz]=course[leg+1],dx=bx-ax,dz=bz-az;
      const drift=(rand()-.5)*(13+13*sin(PI*span/2))/hypot(dx,dz);
      const x=PEACH.x+ax+dx*t+dz*drift,z=PEACH.z+az+dz*t-dx*drift;
      if(occupied(x,z,4.25))continue;
      const h=pilgrimageHeight(x,z,5),grade=slope(x,z);
      if(h<15 || grade<.42 || grade>2.38)continue;
      const size=.82+rand()*.48;
      plant({x,z,cliff:true,upland:true,wayside:alongPass(x,z,peachPass,21),size,
        turn:rand()*PI*2,tint:rand()<.65?dye:Math.floor(rand()*6),seed:97021+gully*200+i});
      planted++;
    }
  }
  return trees;
}
export const PEACH_TREES=orchard();
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
