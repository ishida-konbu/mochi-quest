// Local carpentry coordinates. Piers terminate at the same datum under every
// socket, but their buried toes follow the rendered terrain at each bearing.
import { foundationPiers } from './living-foundation.js';
import { terrainContactHeight } from './terrain.js';

const stock = {floor:.226,hut:.226,camp:.135,stand:.116,chest:.156,fence:.116};
const wood='#b9a381',heart='#a68e70',fresh='#d1bb95';
function earth(site,x,z){
  const c=Math.cos(site.yaw||0),s=Math.sin(site.yaw||0);
  return terrainContactHeight(site.x+x*c+z*s,site.z-x*s+z*c)-site.y;
}

// The stairs follow the deck edge. Return the shorter flights first so a
// neighbour need only change the entrance when the preferred flight overlaps.
export function entryFlights(kind,site){
  const camp=kind==='camp',floor=kind==='floor'||kind==='hut';
  if(!camp && !floor)return [];
  const deck=camp?.13:.18,halfX=camp?.565:1.60,halfZ=camp?.86:1.40;
  const centerZ=camp?.11:0,depth=camp?.36:.245,run=.35;
  const choices=[], legacy=site.legacyFoundation || site.foundationWood===undefined;
  const starts=legacy?[-.63,0,.63]:[-.60,0,.60];
  let bay=0;
  for(const [nx,nz] of [[1,0],[-1,0],...(camp?[]:[[0,1]])]){
    const tx=nz,tz=-nx,span=nx?halfZ:halfX;
    for(const side of [-1,1])for(const start of starts)for(const treadDepth of legacy?[depth]:[depth,.76]){
      const index=bay++;
      // A single threshold fits under the eaves. On a longer flight the
      // carpenter walks alongside the deck, with room for both shoulders.
      const offset=(nx?halfX:halfZ)+treadDepth/2;
      const treads=[];
      for(let i=0;i<10;i++){
        const along=start*span+i*run*side;
        if(Math.abs(along)+run/2>span-.03)break;
        const x=nx*offset+tx*along,z=centerZ+nz*offset+tz*along;
        const top=deck-.175*(i+1);
        const h=earth(site,x,z);
        if(i===0 && treadDepth===depth && deck-h<=.19){
          // Stepping straight from the ground is the shortest possible way in.
          return [];
        }
        if(h>=top+.055)break;
        treads.push({x,z,w:nx?treadDepth:run,d:nz?treadDepth:run,top,h});
        const landing=earth(site,x+tx*side*run,z+tz*side*run);
        if(top-landing<=.22 && landing<=top+.12) {
          if(!legacy && treads.length>1 && treadDepth<.67)break;
          const effort=treads.length+Math.max(0,top-landing)+treadDepth*.1;
          choices.push({id:'entry-treads',type:'stairs',bay:index,effort,treads,normal:[nx,nz]});
          break;
        }
      }
    }
  }
  return choices.sort((a,b)=>a.effort-b.effort);
}

export function outsideTreads(site,flight){
  const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return flight?.treads.filter(t=>t.w>=.76 || t.d>=.76).map(t=>({
    x:site.x+t.x*c+t.z*s,z:site.z-t.x*s+t.z*c,yaw:site.yaw,w:t.w,d:t.d,
  }))??[];
}
export function entryFlight(kind,site){
  const flights=entryFlights(kind,site);
  return site.entryBay===undefined?flights[0]:flights.find(f=>f.bay===site.entryBay);
}

export function foundationMembers(kind,site){
  if(!site || site.parentId || !Object.hasOwn(stock,kind))return [];
  const piers=foundationPiers(kind,site);
  // Existing saves predate the quote. Recreate visible timber from ground
  // contacts, also when a previously charged support has been reused uphill.
  const cut=piers.map((p,index)=>{
    const width=kind==='camp' && index===4 ? .094 : stock[kind];
    const h=p.groundY-p.topY;
    // On a rock lip the low edge of a square post can be well below its
    // centre. Bury the whole sawn end, including its downhill corners.
    let low=h;
    const quarter=width/4;
    for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)
      low=Math.min(low,earth(site,p.x+i*quarter,p.z+j*quarter));
    return {...p,width,h,low,bottom:low-.15};
  });
  if(!cut.some(p=>p.low<-.16) && !(site.foundationWood>0))return [];
  const members=[],floor=kind==='hut'||kind==='floor';
  for(const [index,p] of cut.entries()){
    if(p.low>=-.09)continue;
    const {x,z,h,width,bottom}=p;
    const normal=[[0,1],[1,0],[0,-1],[-1,0]].filter(([nx,nz])=>nx*x+nz*z>=0)
      .sort(([ax,az],[bx,bz])=>earth(site,x+ax,z+az)-earth(site,x+bx,z+bz))[0];
    members.push({id:'pier-'+index,type:'pier',x,z,h,bottom,top:floor?-.145:-.018,width,normal,index});
  }
  if(floor && members.length)for(const x of [-1.44,1.44]){
    members.push({id:x<0?'left-girder':'right-girder',type:'girder',x,normal:[Math.sign(x),0]});
  }
  // Paired cheeks stiffen taller bays; sawn diagonals end directly against
  // a leg or the underside of a sill. The mast stands in its own socket.
  const toes=cut.filter((_,i)=>kind!=='camp'||i!==4);
  if(toes.some(p=>p.h<-.54)){
    const alongX=kind==='floor'||kind==='hut'||kind==='fence';
    for(const a of toes)for(const b of toes){
      if(alongX?(a.z!==b.z || a.x>=b.x):(a.x!==b.x || a.z>=b.z))continue;
      const low=a.h<b.h?a:b,other=low===a?b:a;
      if(low.h>=-.54)continue;
      const w=stock[kind],length=Math.hypot(other.x-low.x,other.z-low.z);
      const bearing=kind==='stand'?length:Math.min(length,Math.max(.28,(-low.h-.13)*.92)),f=bearing/length;
      const from=[low.x,Math.max(low.h+.11,-1.78),low.z], to=[low.x+(other.x-low.x)*f,kind==='floor'||kind==='hut'?-.042:-.092,low.z+(other.z-low.z)*f];
      const normal=alongX?[0,Math.sign(low.z)||1]:[Math.sign(low.x)||1,0];
      const cheek=w*.46;
      from[0]+=normal[0]*cheek;from[2]+=normal[1]*cheek;
      const upperOffset=alongX && kind!=='fence'?cheek*.44:cheek;
      to[0]+=normal[0]*upperOffset;to[2]+=normal[1]*upperOffset;
      members.push({id:'brace-'+members.length,type:'brace',from,to,normal,width:w*.37});
    }
  }
  if(floor && toes.some(p=>p.h<-.95)){
    // Tie the downhill bay in the other direction as well. This knee lands
    // directly on the side girder supporting all three transverse joists.
    const a=toes.reduce((deep,p)=>p.h<deep.h?p:deep);
    const from=[a.x,a.h+.12,a.z],to=[a.x,-.138,a.z-Math.sign(a.z)*Math.min(1.05,-a.h-.16)];
    members.push({id:'side-brace',type:'brace',from,to,normal:[Math.sign(a.x),0],width:.078});
  }
  if(kind==='fence' && members.length)members.push({id:'sill',type:'sill',normal:[0,1]});
  const stair=entryFlight(kind,site);
  if(stair){
    for(const t of stair.treads){
      t.legs=[-1,1].map(side=>{
        const x=t.x+(t.w>t.d?side*(t.w/2-.045):0);
        const z=t.z+(t.d>=t.w?side*(t.d/2-.045):0);
        const top=t.top-.044;
        const bottom=Math.min(top-.08,...[-.033,.033].flatMap(u=>[-.033,.033].map(v=>earth(site,x+u,z+v)-.14)));
        return {x,z,top,bottom};
      });
    }
    members.push(stair);
  }
  return members;
}

const peg=(b,x,y,z,n,w)=>b.beam('endGrain',heart,[x-n[0]*.012,y,z-n[1]*.012],
  [x+n[0]*.012,y,z+n[1]*.012],w,w,{bevel:w*.20});
export function foundationJoint(m){
  if(m.type==='pier'){
    const y=Math.min(m.top-.027,m.h+Math.max(.14,(-m.h)*.77));
    return {label:'地面に合わせて束柱を立てる',method:'raise',
      grip:[m.x+m.normal[0]*m.width/2,y,m.z+m.normal[1]*m.width/2],normal:m.normal};
  }
  if(m.type==='girder')return {label:'束の上に大引を渡す',method:'seat',grip:[m.x+m.normal[0]*.074,-.074,.80],normal:m.normal};
  if(m.type==='brace'){
    const grip=m.from.map((v,i)=>v+(m.to[i]-v)*.70);
    return {label:'束柱に斜めの補強材を留める',method:'seat',grip,normal:m.normal};
  }
  if(m.type==='sill')return {label:'竹垣の足元に受け木を渡す',method:'seat',grip:[.52,-.093,.058],normal:m.normal};
  const a=m.treads[0];
  return {label:'縁に踏み段を掛ける',method:'seat',grip:[a.x,a.top,a.z],normal:m.normal};
}
export function drawFoundationMember(b,m) {
  if(m.type==='pier'){
    const {x,z,h,width:w,index,top,bottom}=m;
    b.box('wood',wood,[x,(top+bottom)/2,z],[w,top-bottom,w],{grain:'y',bevel:.009,seed:index+.36});
    // A shouldered head gathers the load from the short foot of the building.
    b.box('wood',fresh,[x,top-.034,z],[w+.038,.066,w+.038],{grain:'x',bevel:.008,seed:index+3});
    const lip=w/2+.011;
    b.face('endGrain',fresh,[[x-lip,top+.0005,z-lip],[x-lip,top+.0005,z+lip],
      [x+lip,top+.0005,z+lip],[x+lip,top+.0005,z-lip]],{uvs:[[.23,.23],[.23,.77],[.77,.77],[.77,.23]],seed:index});
    if(h<-.31)peg(b,x,top-.11,z+w/2,[0,1],.021);
  }else if(m.type==='girder'){
    b.box('wood',wood,[m.x,-.081,0],[.148,.13,2.67],{grain:'z',bevel:.006,seed:m.x});
    for(const z of [-1.23,1.23])peg(b,m.x+m.normal[0]*.074,-.082,z,m.normal,.024);
  }else if(m.type==='brace'){
    b.beam('wood',heart,m.from,m.to,m.width,m.width*.82,{bevel:.004,seed:m.from[0]});
    for(const k of [.055,.94]){
      const [x,y,z]=m.from.map((v,i)=>v+(m.to[i]-v)*k);
      peg(b,x+m.normal[0]*m.width/2,y,z+m.normal[1]*m.width/2,m.normal,.017);
    }
  }else if(m.type==='sill'){
    b.box('wood',heart,[0,-.117,0],[1.77,.094,.12],{grain:'x',bevel:.008});
  }else for(const [i,t] of m.treads.entries()){
    const {x,z,top,w,d}=t;
    b.box('wood',i%2?wood:fresh,[x,top-.028,z],[w-.005,.056,d-.005],{grain:w>d?'x':'z',bevel:.007,seed:i+1});
    for(const leg of t.legs)b.box('wood',heart,[leg.x,(leg.bottom+leg.top)/2,leg.z],
      [.065,leg.top-leg.bottom,.065],{grain:'y',bevel:.004,seed:i+leg.x});
  }
}

export function addFoundationContacts(add,m){
  if(m.type==='pier')add(m.x,m.z,m.width,m.width,m.bottom,m.top);
  else if(m.type==='girder')add(m.x,0,.148,2.67,-.146,-.016);
  else if(m.type==='sill')add(0,0,1.77,.12,-.164,-.070);
  else if(m.type==='stairs')for(const t of m.treads){
    add(t.x,t.z,t.w,t.d,t.top-.056,t.top,'floor',true);
    for(const leg of t.legs)add(leg.x,leg.z,.065,.065,leg.bottom,leg.top);
  }
  else {
    const count=Math.max(1,Math.ceil(Math.hypot(...m.to.map((v,i)=>v-m.from[i]))/.18));
    for(let i=0;i<count;i++){
      const a=m.from.map((v,j)=>v+(m.to[j]-v)*i/count),b=m.from.map((v,j)=>v+(m.to[j]-v)*(i+1)/count);
      add((a[0]+b[0])/2,(a[2]+b[2])/2,Math.abs(a[0]-b[0])+m.width,Math.abs(a[2]-b[2])+m.width,
        Math.min(a[1],b[1])-m.width/2,Math.max(a[1],b[1])+m.width/2);
    }
  }
}
