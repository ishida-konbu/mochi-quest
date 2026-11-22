import { steamVaultHeight } from './pilgrim-bathing-plan.js';
// The long axis is parallel to the bank. +z is the open face looking onto
// the water. Furniture stands against the back wall or at the closed ends.
const kinds=new Set(['dawn','peach','temple','inari','tsuruga','sakai','snow']);
export function hasPilgrimBathhouse(site){
  return site.rank==='main' && kinds.has(site.kind);
}

export function lodgeFurniture(kind,r){
  // The centre bench already belongs to the common bath plan.
  const x=r.w/2,z=r.d/2;
  switch(kind){
    case 'temple':return [{type:'bell',x:x-.62,z:-z+.62,w:1.07,d:1.03,h:2.27}];
    case 'tsuruga':return [{type:'windlass',x:-x+.65,z:-z+.55,w:1.06,d:.87,h:.95}];
    default:return [];
  }
}

export const snowLamp={x:7.26,z:-9.08,w:3.22,d:2.88,h:2.78};
export function yardFixture(kind,plan){
  const r=plan.room;
  if(kind==='sakai')return {x:plan.w-r.u-1.37,z:.03,w:2.35,d:2.42,h:2.76};
  if(kind==='temple')return {x:-plan.w-r.u+1.17,z:.20,w:1.02,d:1.03,h:2.37};
}
export function addPilgrimFurnitureSolids(site,plan,add){
  if(!hasPilgrimBathhouse(site))return;
  for(const q of lodgeFurniture(site.kind,plan.room))
    add(plan.room.u+q.x,plan.room.v+q.z,q.w,q.d,q.h,'oval',true);
  const yard=yardFixture(site.kind,plan);
  if(yard){
    const x=plan.room.u+yard.x,z=plan.room.v+yard.z;
    add(x,z,yard.w,yard.d,yard.h,'oval',true);
    if(site.kind==='sakai')add(x+.29,z-.28,.62,.59,4.67,'oval',true);
  }
}

const {abs,sin,cos,PI}=Math;
export function pilgrimRoofPoint(kind,w,d,e,rise,u,v){
  const q=abs(v),end=abs(u);
  let x=u*w,z=v*d,run=1-q,up=0;
  if(kind==='dawn'||kind==='temple')run=Math.min(run,(1-end)/.52);
  if(kind==='dawn'){
    up=.18*end**3*(.2+.8*q);z+=Math.sign(v)*.28*(1-end**2)*q;
  }else if(kind==='inari'){
    up=.09*end**4+.047*q**5;
  }else if(kind==='tsuruga'){
    // The weather side is the outside of a salvaged hull: the strakes
    // taper up into two sharp stems, while the interior's ribs stay exposed.
    z*=1-.78*end**5;
    run=(1-q**1.33)**.77*(1-.44*end**3);
    up=.77*end**3;
  }else if(kind==='temple'){
    up=.31*(q*end)**3;
  }else if(kind==='sakai'){
    up=.074*end**4*q;
  }else if(kind==='snow'){
    // The prevailing wind deposits a cornice towards the bath. Tips and
    // thin irregularities are visible at the end grain and along the eave.
    up=.026*sin(6*u+1.3*v)+.037*cos(7*v+u)*cos(u*3)
      +.09*(.5+.5*sin(u*11+.6))*q**5;
    z+=.20*q**3*(v>0?1:.4)*(1+.30*cos(12*u));
  }else if(kind==='peach'){
    up=.12*end**2.5-.025*q*(.4+.6*cos(2*u));
  }
  if(kind==='inari'||kind==='temple')run-=.14*sin(PI*run);
  return [x,e+rise*run+up,z];
}

// Invert the same roof section at the player's feet. A hull's gable tapers
// into a stem; the drift's cornice projects beyond the original timber eave.
export function pilgrimRoofContact(s,a,b,pad) {
  const w=s.rx,d=s.pilgrimDepth,kind=s.pilgrimKind;
  if(abs(a)>w+pad)return -Infinity;
  const u=Math.max(-1,Math.min(1,a/w)),end=abs(u);
  if(kind==='steamVault'){
    if(abs(b)>d+pad)return -Infinity;
    return s.top+steamVaultHeight(u,.5+.5*Math.max(-1,Math.min(1,b/d)))-2.47;
  }
  const sign=b<0?-1:1;
  let depth=d;
  if(kind==='tsuruga')depth*=1-.78*end**5;
  if(kind==='dawn')depth+=.28*(1-end**2);
  let v;
  if(kind==='snow'){
    const cornice=.20*(sign>0?1:.4)*(1+.30*cos(12*u));
    if(abs(b)>d+sign*cornice+pad)return -Infinity;
    // Newton converges in three iterations over this shallow overhang.
    let q=Math.min(1,abs(b)/d);
    for(let i=0;i<3;i++)q-=(q*d+sign*cornice*q**3-abs(b))/(d+sign*3*cornice*q*q);
    v=sign*Math.max(0,Math.min(1,q));
  }else{
    if(abs(b)>depth+pad)return -Infinity;
    v=Math.max(-1,Math.min(1,b/depth));
  }
  return pilgrimRoofPoint(kind,w,d,s.top,s.roofRise,u,v)[1];
}
