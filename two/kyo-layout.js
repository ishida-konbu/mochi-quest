import { districtPoint, DISTRICTS, DISTRICT_SHIFT } from './geography.js';
import { HIGASHIYAMA, KITAYAMA, NISHIYAMA } from './higashiyama.js';
import { COURT, COURT_GATE_Z, COURT_PRECINCT } from './retreat-layout.js';

// The main avenue is kept open from the southern gate right up to the hillside fires.
const oldRoads = [
  [8.0, [[120, -377], [120, -401], [120, -424], [120, -454], [120, -478]], true],
  [7.0, [[62, -424], [90, -424], [120, -424], [151, -424], [175, -424]], true],
  [3.8, [[70, -392], [71, -411], [71, -424], [71, -443], [72, -467]]],
  [4.2, [[163, -386], [164, -401], [164, -424], [164, -442], [164, -464]]],
  [3.7, [[69, -407], [91, -407], [120, -408], [142, -407], [164, -407]]],
  [4.1, [[71, -466], [96, -466], [120, -466], [145, -466], [164, -466]]],
];

export const RASHOMON={x:DISTRICTS.kyo.x,z:DISTRICTS.kyo.z+88,base:5.06,name:'羅生門'};
export const KYO_WARD={width:218,depth:184};
const crossings=[-81,-62,-42,-22,0,17,41,63,85];
const avenues=[-100,-77,-49,-25,0,25,44,74,100];
const grid=[];
for(const u of avenues){
  grid.push([u===0?8:3.8,[[120+u,-506],[120+u,u===0?-336:-339]],u===0]);
}
for(const v of crossings) grid.push([v===0?7:3.7,[[20,-424+v],[220,-424+v]],v===0]);

// Work in the same survey coordinates as the lots, with enough clearance
// for the roof overhang and eaves of the court.
const shift=DISTRICT_SHIFT.kyo;
const courtBlock={
  west:COURT_PRECINCT.west-shift.x,east:COURT_PRECINCT.east-shift.x,
  north:COURT_PRECINCT.north-shift.z,south:COURT_PRECINCT.south-shift.z,
};
const courtEntry=[COURT.x-shift.x,COURT.z+COURT_GATE_Z-shift.z];
const courtWalk=[4.6,[courtEntry,[courtEntry[0],-424]],true];

export function inCapitalWard(x,z,pad=0){
  return Math.abs(x-DISTRICTS.kyo.x)<=KYO_WARD.width/2+pad && Math.abs(z-DISTRICTS.kyo.z)<=KYO_WARD.depth/2+pad;
}
export const WARD_TRADES={
  lacquer:['漆器','#704837'],salt:['塩','#677376'],oil:['油','#9d7847'],paper:['紙','#757e61'],
  fan:['扇','#854c45'],cloth:['絹','#6c6580'],pottery:['土器','#97705b'],rush:['筵','#7c815b'],
  herbs:['薬草','#69754e'],baskets:['籠','#92764e'],fish:['干魚','#577278'],brush:['筆','#6d5e51'],
};
const houses = [];
const streetTrades = ['dye', 'tea', 'brew', 'ink', 'rice'];
for (const side of [-1, 1]) {
  // Rows of narrow-fronted townhouses face each other across the processional street.
  for (const [i, z] of [-388, -400, -445, -457].entries()) {
    houses.push([120 + side * 11, z, 8.1 + i % 2, 8.5, 3.8 + i % 2 * .55, 2.9,
      -side * Math.PI / 2, i === 0 ? 'inn' : 'shop', streetTrades[(i + side + 1) % 5]]);
  }
  for (const [i, x] of [81, 94, 146, 156].entries()) {
    houses.push([x, -424 + side * 10, 8.0 + i % 2, 7.6, 3.15 + (i % 3) * .48, 2.55,
      side === 1 ? Math.PI : 0, i % 3 ? 'shop' : 'cottage', streetTrades[(2 * i + side + 2) % 5]]);
  }
}
houses.push(
  [91,-449,13.6,10.0,5.3,4.4,0,'temple','ink'],
  [149,-451,12.4,10.2,4.9,3.8,0,'temple','ink'],
  [93,-477,12.0,11.4,4.3,29,0,'pagoda'],
  [155,-479,12.8,11.0,4.4,29,0,'pagoda'],
  [90,-391,11.6,8.4,4.1,3.3,Math.PI,'inn','lodge'],
  [149,-389,10.8,8.8,3.7,2.9,Math.PI,'inn','lodge'],
  [64,-439,9.4,7.8,3.7,3.0,Math.PI/2,'shop','rice'],
  [175,-444,9.8,7.6,4.1,3.6,-Math.PI/2,'shop','dye'],
  [62,-406,9.2,7.0,3.9,2.9,Math.PI/2,'cottage','tea'],
  [175,-401,9.0,7.4,3.5,2.7,-Math.PI/2,'shop','brew'],
  // Keep the rear silk shop in place. The mat and lacquer sellers face it
  // from the opposite side of the same lane, clear of the new north eave.
  [64,-480.06,6.02,5.79,6.1,2.47,Math.PI,'wardShop','cloth'],
  [31.5,-491.5,6.4,5.94,6.1,2.17,0,'wardShop','rush'],
  [50,-491.5,6.78,6.09,6.1,2.32,0,'wardShop','lacquer'],
);
// Divert the new side lanes at the walls of older temples and shops. A common
// centre line is paved once, preserving the courses on the original avenues.
const established=houses.slice();
function newLane([width,[[x,z],[ex,ez]],paved]) {
  const alongX=x!==ex, begin=alongX?x:z,end=alongX?ex:ez,near=alongX?z:x;
  let pieces=[[Math.min(begin,end),Math.max(begin,end)]];
  function clip(lo,hi){
    pieces=pieces.flatMap(([a,b])=>hi<=a || lo>=b?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([u,v])=>v-u>1.5));
  }
  const {west,east,north,south}=courtBlock;
  if(alongX ? near>north && near<south : near>west && near<east)
    clip(alongX?west:north,alongX?east:south);
  for(const [xx,zz,w,d,,,yaw] of established){
    const co=Math.abs(Math.cos(yaw)),si=Math.abs(Math.sin(yaw)),rw=(co*w+si*d)/2,rd=(si*w+co*d)/2;
    if(Math.abs(near-(alongX?zz:xx))<(alongX?rd:rw)+width/2){
      const start=alongX?xx:zz,r=(alongX?rw:rd)+1.65;
      clip(start-r,start+r);
    }
  }
  for(const [,knots] of oldRoads)for(let k=1;k<knots.length;k++){
    const [ax,az]=knots[k-1],[bx,bz]=knots[k];
    if(Math.abs(near-(alongX?az:ax))<1.2 && Math.abs(near-(alongX?bz:bx))<1.2){
      const u=alongX?ax:az,v=alongX?bx:bz;clip(Math.min(u,v),Math.max(u,v));
    }
  }
  return pieces.filter(([a,b])=>b-a>2.8).map(([a,b])=>[width,alongX?[[a,z],[b,z]]:[[x,a],[x,b]],paved]);
}
export const KYO_ROADS=[...oldRoads,...grid.flatMap(newLane),courtWalk]
  .map(([w,knots,paved])=>[w,knots.map(([x,z])=>districtPoint('kyo',x,z)),paved]);

// Rows of street-facing shops share party alleys. Survey the covered frontage,
// existing doors, festival spaces, and the land reserved for the magistrate.
const wares=Object.keys(WARD_TRADES);
function clearParcel(x,z,w,d){
  const {west,east,north}=courtBlock;
  // Leave service alleys outside the two eaves, and an open sightline from
  // the south pavement across the forecourt to the gate.
  if(x-w/2<east+2.6 && x+w/2>west-2.6 && z+d/2>north && z-d/2<-424+4.5)return false;
  if(Math.abs(x-120)<17 && z>-352)return false;
  if(Math.abs(x-137)<10 && Math.abs(z+417)<9)return false;
  if(Math.abs(x-120)<22 && Math.abs(z+424)<19)return false;
  for(const [width,line] of [...oldRoads,...grid,courtWalk])for(let i=1;i<line.length;i++){
    const [a,b]=line[i-1],[c,e]=line[i],dx=c-a,dz=e-b;
    const t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz)));
    if(Math.abs(x-a-dx*t)<w/2+width*.5+.48 && Math.abs(z-b-dz*t)<d/2+width*.5+.48)return false;
  }
  return houses.every(([u,v,ww,dd,,,turn])=>{
    const co=Math.abs(Math.cos(turn)),si=Math.abs(Math.sin(turn));
    return Math.abs(x-u)>(w+co*ww+si*dd)*.5+1.20 || Math.abs(z-v)>(d+si*ww+co*dd)*.5+1.20;
  });
}
for(const [street,v] of crossings.entries())for(const side of [-1,1]){
  const z=-424+v+side*(v===0?7.20:5.94);
  const slots=avenues.slice(1).flatMap((right,i)=>{
    const left=avenues[i], span=right-left, divider=span>=24?2:1;
    return Array.from({length:divider},(_,j)=>120+left+(j+.5)*span/divider);
  });
  for(const [parcel,x] of slots.entries()){
    const w=6.02+.38*((street+parcel)%3),d=5.79+.15*((parcel+1)%3);
    if(Math.abs(z+424)>88 || !clearParcel(x,z,w,d))continue;
    const id=(parcel*5+street*3+(side+1)*2)%wares.length,two=(parcel+street)%4!==0;
    houses.push([x,z,w,d,two?6.1:3.31,2.17+.15*(parcel%3),side<0?0:Math.PI,
      'wardShop',wares[id]]);
  }
}
export const KYO_BUILDINGS = houses.map(([x,z,...plan]) => [...districtPoint('kyo',x,z), ...plan]);
export const KYO_SCREENS=houses.flatMap(([x,z,w,d,,,yaw],shop)=>{
  if((z!==-445 && z!==-400) || Math.abs(x-120)!==11) return [];
  const side=Math.sign(Math.sin(yaw)*(z+424));
  const offset=side*(w*.5+1.05),width=d*.68;
  const [worldX,worldZ]=districtPoint('kyo',x,z);
  return [{shop,side,x:worldX+offset*Math.cos(yaw),z:worldZ-offset*Math.sin(yaw),yaw:yaw+side*Math.PI/2,
    width,height:width*.53,picture:z===-445?(x<120?2:3):(x<120?1:0)}];
});
export const screenFold = u=>.047+1.55*.17*(1-Math.abs(2*((u*2)%1)-1));


export const KYO_FOOD = [
  {type: 'kyoTea', x: 115, z: -432, yaw: Math.PI / 2},
  {type: 'mitarashi', x: 125, z: -417, yaw: -Math.PI / 2},
].map(stand => {
  const [x,z]=districtPoint('kyo',stand.x,stand.z);
  return {...stand,x,z};
});

export const KYO_ANIMALS = [
  [119,-386], [122,-396], [127,-408], [121,-410], [119,-438], [122,-454],
  [111,-424], [104,-423], [87,-425], [76,-423], [135,-424], [152,-423],
  [160,-437], [72,-451], [103,-467], [142,-466],
].map(([x,z], i) => ({
  type: i % 3 === 1 ? 'frog' : 'rabbit', role: i % 4 === 1 ? 'porter' : 'wander',
  x: x + DISTRICT_SHIFT.kyo.x, z: z + DISTRICT_SHIFT.kyo.z, phase: i * 2.39996,
}));

const smooth = (a,b,x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function kyoInfluence(x,z) {
  const urban=Math.hypot((x-DISTRICTS.kyo.x)/156,(z-DISTRICTS.kyo.z+11)/130);
  // Keep the whole approach under the city's night sky. The port beyond
  // the northern watershed and the shrine south of the capital have their own light.
  const east=Math.hypot((x-HIGASHIYAMA.x+145)/310,(z-HIGASHIYAMA.z)/175);
  const north=Math.hypot((x-KITAYAMA.x)/171,(z-KITAYAMA.z-145)/310);
  const west=Math.hypot((x-NISHIYAMA.x-147)/300,(z-NISHIYAMA.z)/136);
  // The southern shoulder of Higashiyama carries the Kiyomizu approach.
  // Its long axis points towards the city and leaves Fushimi's sky intact.
  const otowa=Math.hypot((x-HIGASHIYAMA.x+135)/211,(z-HIGASHIYAMA.z-113)/94);
  return 1 - smooth(.52, 1.08, Math.min(urban,east,north,west,otowa));
}
// Daylight, the curfew, the night watch and both mountains use this noon-to-noon period.
export const KYO_DAY_SECONDS = 288;
export function kyoClock(time,player) {
  return time+(player?.kyoClockOffset ?? 0);
}
export function kyoNight(time,player) {
  const phase = -Math.cos(kyoClock(time,player) * Math.PI * 2 / KYO_DAY_SECONDS);
  return smooth(-.35, .48, phase);
}

export function wardFloorPlan(b) {
  const loft=3.38;
  const stairX=-b.w/2+1.02;
  const rightEdge=stairX+.77,back=-b.d/2+.82,front=b.d*.5-.67;
  const w=b.w/2-rightEdge;
  const slabs=[
    {x:rightEdge+w/2,z:0,w,d:b.d-.12,top:loft},
    {x:(rightEdge-b.w/2)/2,z:(back-b.d/2)/2,w:rightEdge+b.w/2,d:back+b.d/2,top:loft},
  ];
  for(let i=0;i<17;i++) slabs.push({x:stairX,z:front+(back-front)*(i+.5)/17,w:1.49,
    d:(front-back)/17+.012,top:.48+(loft-.48)*(i+1)/17,tread:true});
  return {loft,slabs};
}

// All masonry dimensions are relative to the surveyed ground at the gate.
// The cross street passes through two narrow flights in the side faces.
export const GATE_STONE={
  width:26,depth:12.8,height:1.12,count:7,going:.50,stairWidth:15.6,
  sideZ:-3,sideWidth:3.0,apronWidth:26,apronDepth:3.6,apronHeight:.10,
};
export const GATE_LEAF={x:5.48,z:.04,w:3.48,d:.28,y:1.32,h:2.55};
export const GATE_WING={x:14.95,z:.25,w:7.4,d:.62,eave:2.38,roofW:7.86,roofD:1.42,roofRise:.60};
export const GATE_FRONT_EAVE={w:18.72,back:3.56,front:5.23,high:5.13,low:4.58};

const stone=GATE_STONE;
export const GATE_STONE_STEPS=[];
export const GATE_STONE_APRONS=[];
for(const side of [-1,1]){
  for(let i=0;i<stone.count;i++){
    const run=(stone.count-i-.5)*stone.going,top=(i+1)*stone.height/stone.count;
    GATE_STONE_STEPS.push(
      {x:0,z:side*(stone.depth/2+run),w:stone.stairWidth,d:stone.going,top},
      {x:side*(stone.width/2+run),z:stone.sideZ,w:stone.going,d:stone.sideWidth,top},
    );
  }
  GATE_STONE_APRONS.push({x:0,z:side*(stone.depth/2+stone.count*stone.going+stone.apronDepth/2),
    w:stone.apronWidth,d:stone.apronDepth,top:stone.apronHeight});
}
// A handful of rectangles covers the paved survey, including all four
// flights. Road pigment and roadside planting yield to these stones.
export const GATE_PAVING=[
  {x:0,z:0,w:stone.width,d:stone.depth},
  {x:0,z:0,w:stone.stairWidth,d:stone.depth+2*stone.count*stone.going},
  {x:0,z:stone.sideZ,w:stone.width+2*stone.count*stone.going,d:stone.sideWidth},
  ...GATE_STONE_APRONS,
];
const masonry=[{x:0,z:0,w:stone.width,d:stone.depth,top:stone.height},...GATE_STONE_STEPS,...GATE_STONE_APRONS];
export function gateStoneRise(u,v){
  if(Math.abs(u)>stone.width/2+stone.count*stone.going ||
     Math.abs(v)>stone.depth/2+stone.count*stone.going+stone.apronDepth)return 0;
  let top=0;
  for(const b of masonry)if(Math.abs(u-b.x)<=b.w/2+1e-8 && Math.abs(v-b.z)<=b.d/2+1e-8)top=Math.max(top,b.top);
  return top;
}

export const GATE_STEPS=Array.from({length:28},(_,i)=>({
  x:9.52,z:4.20-(i+.5)*8.25/28,w:1.92,d:8.25/28+.014,top:(i+1)*RASHOMON.base/28,
}));
export function gateSolids(height,put){
  const {x,z,base}=RASHOMON,ground=height(x,z),y=ground+stone.height;
  for(const b of masonry)put(x+b.x,z+b.z,b.w/2,b.d/2,0,ground+b.top,'floor',true);
  const solid=(u,v,w,d,top,kind,support=false,low=-Infinity)=>put(x+u,z+v,w/2,d/2,0,y+top,kind,support,0,y+low);
  for(const u of [-7.3,-3.65,3.65,7.3])for(const v of [-2.18,2.18])solid(u,v,.65,.65,base,'oval');
  solid(0,0,17.6,7.7,base,'slab',true);
  solid(7.30,-4.04,6.34,1.60,base,'slab',true);
  for(const q of GATE_STEPS)solid(q.x,q.z,q.w,q.d,q.top,'slab',true);
  // A side gallery wraps to the unbarred door in the north wall.
  for(const side of [-1,1]){
    const door=GATE_LEAF;
    solid(side*door.x,door.z,door.w,door.d,door.y+door.h/2,'wall');
    solid(side*7.33,0,.22,5.04,9.01,'wall',false,base);
    solid(side*5.62,2.52,3.63,.18,9.01,'wall',false,base);
  }
  solid(0,3.57,17.32,.14,base+1.11,'wall',false,base);
  solid(-1.69,-2.52,11.45,.21,9.01,'wall',false,base);
  solid(6.60,-2.52,1.62,.21,9.01,'wall',false,base);
  solid(0,0,17.6,7.64,9.07,'ceiling');
  put(x,z,9.8,4.55,0,y+9.11,'roof',true,3.15).form='hip';
  const wing=GATE_WING;
  for(const side of [-1,1]){
    solid(side*wing.x,wing.z,wing.w,wing.d,wing.eave,'wall');
    const roof=put(x+side*wing.x,z+wing.z,wing.roofW/2,wing.roofD/2,0,y+wing.eave,'roof',true,wing.roofRise);
    roof.form='hip';
    roof.overhang=true;
  }
  const lower=GATE_FRONT_EAVE;
  const roof=put(x,z+(lower.back+lower.front)/2,lower.w/2,(lower.front-lower.back)/2,0,
    y+lower.low,'roof',true,lower.high-lower.low);
  roof.form='leanTo';
  roof.overhang=true;
}
