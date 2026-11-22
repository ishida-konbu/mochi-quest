import { PALACE_SCREENS, PEARL_LAMPS, PALACE_TABLES, screenLeaves, tidePorchHeight } from './ryugu-palace-fittings.js';
// The procession enters from the east. Local u is north, v faces the coast.
import { palaceRoofsFor, palaceRoofHeight } from './ryugu-palace-roofs.js';
import { roofProfile } from './architecture.js';
import { DISTRICTS } from './geography.js';
export const RYUGU = DISTRICTS.ryugu;
// The same sea lane is printed on the atlas and marked with moored floats.
export const PALACE_APPROACH = [
  [-184,112],[-226,119],[-280,135],[-339,160],[-402,190],
  [-471,215],[-535,243],[-584,258],[RYUGU.x+35,RYUGU.z-7],[RYUGU.x,RYUGU.z],
];
export const PALACE_BED = -40;
export const GATE_V = 14;
export const PALACE_LEVELS = [[36,32,4],[32,28,9],[28,24,14]].map(([w,d,h])=>({u:0,v:-24,w,d,h,height:5}));
export const PALACE_ROOFS = palaceRoofsFor(PALACE_LEVELS);
// The atlas shows the footprint of the entire audience hall.
export const HALLS = [PALACE_LEVELS[0]];
export const PALACE_POOL = {u:0,v:-14,w:8.4,d:12,h:3.7,lintel:3.45};
export const palacePoint = (u,v)=>({x:RYUGU.x+v,z:RYUGU.z-u});
export const SAZAE_BATH = {...palacePoint(-2,-24),y:PALACE_BED+PALACE_LEVELS[2].h,yaw:Math.PI/2};

function staircase(u,front,back,w,bottom,top,count) {
  const d=(front-back)/count;
  return Array.from({length:count},(_,i)=>({u,v:front-(i+.5)*d,w,d,h:bottom+(top-bottom)*(i+1)/count}));
}
export const PALACE_BOARDING = staircase(0,-12,-20,PALACE_POOL.w,0,4,20);
export const PALACE_STAIRS = [-10,10].map((u,i)=>{
  const front=-16,back=-30,w=3.2,h=PALACE_LEVELS[i].h;
  return {u,front,back,w,h,steps:staircase(u,front,back,w,h,h+5,25)};
});

function clippedDeck(room,hole) {
  const left=room.u-room.w/2,right=room.u+room.w/2,back=room.v-room.d/2,front=room.v+room.d/2;
  const u0=hole.u-hole.w/2,u1=hole.u+hole.w/2;
  return [[left,u0,back,front],[u1,right,back,front],[u0,u1,back,hole.back],[u0,u1,hole.front,front]]
    .filter(([a,b,c,d])=>b>a && d>c)
    .map(([a,b,c,d])=>({u:(a+b)/2,v:(c+d)/2,w:b-a,d:d-c}));
}
export function palaceDeckRects(index) {
  const hole=index?PALACE_STAIRS[index-1]:{u:0,w:PALACE_POOL.w,back:-20,front:-8};
  return clippedDeck(PALACE_LEVELS[index],hole);
}
// The galleries step inwards on each floor. A terrace around the smaller room
// seals the dry floor below; the same plan feeds the renderer and collisions.
export const PALACE_SHELL = [];
const panel=(u,v,w,d,bottom,top,kind)=>PALACE_SHELL.push({u,v,w,d,bottom,top,kind});
for(const [i,room] of PALACE_LEVELS.entries()){
  const {v,w,d,h,height}=room,front=v+d/2,back=v-d/2,bottom=i?h:0,top=h+height;
  for(const rect of palaceDeckRects(i))panel(rect.u,rect.v,rect.w,rect.d,i?h-.22:0,h,i?'slab':'floor');
  for(const side of [-1,1])panel(side*w/2,v,.32,d,bottom,top,'wall');
  panel(0,back,w,.32,bottom,top,'wall');
  if(i)panel(0,front,w,.32,bottom,top,'wall');
  else {
    const wing=(w-PALACE_POOL.w)/2;
    for(const side of [-1,1])panel(side*(PALACE_POOL.w/2+wing/2),front,wing,.32,bottom,top,'wall');
    panel(0,front,PALACE_POOL.w,.32,PALACE_POOL.lintel,top,'wall');
  }
  const next=PALACE_LEVELS[i+1];
  const lid=next?clippedDeck(room,{u:0,w:next.w,back:v-next.d/2,front:v+next.d/2}):[room];
  for(const rect of lid)panel(rect.u,rect.v,rect.w,rect.d,top-.16,top,'slab');
}
for(const tread of PALACE_BOARDING)panel(tread.u,tread.v,tread.w,tread.d,0,tread.h,'slab');
for(const flight of PALACE_STAIRS)for(const tread of flight.steps)
  panel(tread.u,tread.v,tread.w,tread.d,tread.h-.25,tread.h,'slab');

export function palaceStoreyAt(x,z,y) {
  const h=y-PALACE_BED,top=PALACE_LEVELS[2];
  if(h<-.01 || h>=top.h+top.height || Math.abs(RYUGU.z-z)>PALACE_LEVELS[0].w/2)return 0;
  const storey=h>=top.h?3:h>=PALACE_LEVELS[1].h?2:1, room=PALACE_LEVELS[storey-1];
  return Math.abs(RYUGU.z-z)<=room.w/2 && Math.abs(x-RYUGU.x-room.v)<=room.d/2?storey:0;
}
export const palaceInteriorAt=(x,z,y)=>palaceStoreyAt(x,z,y)>0;
export function palaceWaterlineAt(x,z,y) {
  return palaceInteriorAt(x,z,y)?PALACE_BED+PALACE_POOL.h:undefined;
}
export function boardingHeightAt(x,z) {
  const v=x-RYUGU.x;
  if(Math.abs(z-RYUGU.z)>PALACE_POOL.w/2 || v> -12 || v< -20)return -Infinity;
  const i=Math.min(PALACE_BOARDING.length-1,Math.floor((-12-v)/PALACE_BOARDING[0].d));
  return PALACE_BED+PALACE_BOARDING[i].h;
}
// Local water volumes are indexed in the same u/v frame as the palace.
const cells = new Map();
const key=(u,v)=>Math.floor(u/5)+','+Math.floor(v/5);
function add(u,v,width,depth,bottom,top,form,rise) {
  const item={u,v,w:width/2,d:depth/2,bottom,top,form,rise};
  for(let i=Math.floor((u-item.w-1)/5);i<=Math.floor((u+item.w+1)/5);i++)
    for(let j=Math.floor((v-item.d-1)/5);j<=Math.floor((v+item.d+1)/5);j++) {
      const k=i+','+j;
      if(!cells.has(k))cells.set(k,[]);
      cells.get(k).push(item);
    }
}
function cover(u,v,w,d,eave,rise,form) {
  add(u,v,w,d,eave-.20,eave+.02,form,rise);
}
// Furniture has its own mesh, but uses the same dry and underwater contacts.
function furnishing(u,v,w,d,bottom,top){
  PALACE_SHELL.push({u,v,w,d,bottom,top,kind:'wall',furnishing:true});
}
for(const screen of PALACE_SCREENS)for(const leaf of screenLeaves(screen)){
  const dx=Math.cos(leaf.angle)*leaf.w*.25,dz=-Math.sin(leaf.angle)*leaf.w*.25;
  for(const side of [-1,1])furnishing(leaf.u+side*dx,leaf.v+side*dz,2*Math.abs(dx)+.07,2*Math.abs(dz)+.07,screen.h,screen.h+screen.height);
}
for(const [u,v,h] of PEARL_LAMPS)furnishing(u,v,.90,.90,h,h+1.71);
for(const [u,v,h,w,d] of PALACE_TABLES)furnishing(u,v,w,d,h,h+.65);
add(0,-3.05,6.3,.40,5.66,7.25);
for(const u of [-5.46,5.46])for(let i=0;i<4;i++)
  add(u,-7.99+i*.30,.68+i*.17,1.76+i*.78,4.29+i*.45,4.67+i*.45);
for (const p of PALACE_SHELL)add(p.u,p.v,p.w,p.d,p.bottom,p.top);
// Match the extruded gate's two Beziers at the same twelve subdivisions used
// by its mesh. Each horizontal band leaves the actual arched opening clear.
const arch = Array.from({length:13},(_,i)=>{
  const t=i/12,k=1-t;
  return [3*k*k*t*1.45+3*k*t*t*2.73+t**3*2.60,
    k**3*4.8+3*k*k*t*4.55+3*k*t*t*3.35+t**3*1.95];
});
add(0,GATE_V,12.9,3.3,0,6,'arch');
for(const u of [-4.5,4.5])add(u,GATE_V,3.75,3.65,0,.54);
cover(0,GATE_V,15.4,6.5,5.32,1.64,'pagoda');
add(0,GATE_V,8.7,3,6.135,8.205);
cover(0,GATE_V,11.4,5.7,8.19,2,'gable');
for(const side of [-1,1]){
  for(let i=0;i<9;i+=2)add(side*3.5,-7.4+i*3.1,.72,.72,0,1.9);
  for(const [x,z,size] of [[8.35,12.75,1.36],[12.5,-2.4,.94],[23.8,-20.4,1.74]]) {
    add(side*x,z,2.4*size,1.0*size,0,1.6*size);
    add(side*x,z+.55*size,2.0*size,1.0*size,0,.52*size);
  }
}
function archUnderside(u) {
  if(u>2.6)return 0;
  for(let i=1;i<arch.length;i++){
    const [x,y]=arch[i], [px,py]=arch[i-1];
    if(u<=x)return py+(y-py)*(u-px)/(x-px);
  }
  return 0;
}
export function palaceSolid(x,z,y,bed,body=1.25,pad=.25) {
  const u=RYUGU.z-z,v=x-RYUGU.x,feet=y-bed;
  if(Math.abs(u)>28+pad || v< -44-pad || v>20+pad || feet>24 || feet+body<0) return false;
  const porch=tidePorchHeight(u,v);
  if(feet<porch && feet+body>porch-.32)return true;
  if(feet+body>7 && v< -4){
    for(const roof of PALACE_ROOFS){
      const top=palaceRoofHeight(roof,u-roof.u,v-roof.v);
      if(feet<top-.000001 && feet+body>top-.20)return true;
    }
  }
  const items=cells.get(key(u,v));
  if(!items)return false;
  for(const b of items){
    const du=Math.abs(u-b.u),dv=Math.abs(v-b.v);
    if(du>b.w+pad || dv>b.d+pad)continue;
    let bottom=b.bottom,top=b.top;
    if(b.form==='arch')bottom=archUnderside(du+pad);
    else if(b.form){
      const h=roofProfile(b.form,du/b.w,dv/b.d,.51,pad/b.w,pad/b.d);
      if(h===-Infinity)continue;
      bottom+=b.rise*h;top+=b.rise*h;
    }
    if(feet<top-.000001 && feet+body>bottom+.000001)return true;
  }
  return false;
}
