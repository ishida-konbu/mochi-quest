// The procession enters from the east. Local u is north, v faces the coast.
import { roofProfile } from './architecture.js';
import { DISTRICTS } from './geography.js';
export const RYUGU = DISTRICTS.ryugu;
// The same sea lane is printed on the atlas and marked with moored floats.
export const PALACE_APPROACH = [
  [-184,112],[-226,119],[-280,135],[-339,160],[-402,190],
  [-471,215],[-535,243],[-584,258],[RYUGU.x+35,RYUGU.z-7],[RYUGU.x,RYUGU.z],
];
export const HALLS = [
  { u: 0, v: -14, w: 15, d: 7.8, tiers: 3 },
  { u: -14.7, v: -6.8, w: 7.5, d: 6.3, tiers: 2 },
  { u: 14.7, v: -6.8, w: 7.5, d: 6.3, tiers: 2 },
];
export const GATE_V = 14;
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
for (const {u,v,w,d,tiers} of HALLS) {
  add(u,v,w+.94,d+1,0,.84);
  add(u,v,w*.74,d*.72,.84,4.45);
  for(let j=0;j<3;j++)add(u,v+d/2+1.42-j*.4,w*.38,.52,0,.20+j*.2);
  for(const side of [-1,1]) {
    for(let j=0;j<5;j++)add(u+(j/4-.5)*w*.89,v+side*d*.47,.39,.39,.84,4.47);
    add(u+side*w*.33,v+d*.5,w*.32,.14,.84,1.60);
    add(u+side*w*.5,v,.14,d,.84,1.60);
  }
  let eave=4.5;
  for(let i=0;i<tiers;i++) {
    const k=.75**i, last=i===tiers-1;
    add(u,v,w*k,d*k,eave-.27,eave-.01);
    cover(u,v,(w+3.2)*k,(d+3)*k,eave,2.10*k,last?'gable':'pagoda');
    if(!last)add(u,v,w*.57*k,d*.57*k,eave+1.67*k,eave+2.85*k);
    else add(u,v,.44,.44,eave+2.10*k-.1,eave+2.10*k+1.47);
    eave+=2.75*k;
  }
}
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
  const u=side*10.3;
  add(u,-11.2,7.1,2.7,0,.48);
  for(const dx of [-2.8,0,2.8])for(const dz of [-1,1])add(u+dx,-11.2+dz,.28,.28,.17,3.07);
  cover(u,-11.2,8.3,3.7,3.02,1.29,'gable');
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
  if(Math.abs(u)>28+pad || Math.abs(v)>27+pad || feet>13.5 || feet+body<0) return false;
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
    if(feet<top && feet+body>bottom)return true;
  }
  return false;
}
