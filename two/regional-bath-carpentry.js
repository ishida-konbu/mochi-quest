import * as T from './vendor/three.module.min.js';
import { coveredGable } from './civic-art.js';
import { sitePoint } from './retreat-layout.js';
import { terrainMeshHeight } from './terrain.js';

const PI=Math.PI;
// The coastal sail uses the same sewn market awning profile as the walkable
// surface in terrain.js. u,v are the normalized coordinates across its hems.
function sailHeight(x,z){
  const u=.5-z,v=.5+x;
  return 1.1*(.58-.72*v-.085*Math.sin(PI*u)-.07*Math.sin(PI*v)+.021*Math.cos(u*8*PI));
}
function flycloth(p){
  if(p.shapes.bathSail)return;
  // The selvedge hangs lower at the lee corner; the middle of the hemp
  // awning sags between two taut ropes fixed to exposed mastheads.
  const g=new T.PlaneGeometry(1,1,16,20),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),v=pos.getY(i);
    pos.setXYZ(i,x,sailHeight(x,v),v);
  }
  g.computeVertexNormals();p.shapes.bathSail=g;
}
function annex(p,f,s,plan){
  const a=plan.annex,{wood}=plan;
  const roofed=s.kind==='inari',cloth=s.kind==='dawn'?'#d7b786':s.kind==='shore'?'#c5bd99':'#a5aea4';
  if(!roofed)flycloth(p);
  for(const side of [-1,1])for(const end of [-1,1]){
    const u=a.u+side*a.w*.46,v=a.v+end*a.d*.45;
    const top=a.eave+(roofed?.02:sailHeight(side*.46*a.w/(a.w+.34),end*.45*a.d/(a.d+.36))+.10);
    f.put('rock',u,.09,v,.23,.19,.24,'#8e9182',p.stone);
    f.put('round',u,top/2,v,.088,top,.088,roofed?'#a8583c':wood,p.wood);
    f.put('round',u,.24,v,.098,.37,.098,roofed?'#504f42':'#827458',p.wood);
    if(!roofed){
      f.put('ball',u,top+.045,v,.09,.08,.09,'#8b7d60',p.wood);
      f.bar([u,top-.22,v],[u-side*.34,top-.44,v-end*.38],.024,'#ad9672');
    }
  }
  if(roofed){
    f.put('roof',a.u,a.eave+.03,a.v,a.d+.36,.62,a.w+.34,'#5e655a',p.roofs,PI/2);
    for(const side of [-1,1]){
      f.put('box',a.u+side*a.w*.45,a.eave-.13,a.v,.17,.16,a.d+.26,'#a9563b',p.wood);
      for(const z of [-.12,.18]){
        const x=a.u+side*a.w*.46,v=a.v+z*a.d;
        f.put('round',x,1.25,v,.071,2.5,.071,'#ac5940',p.wood);
        f.put('round',x,.16,v,.077,.30,.077,'#585244',p.wood);
      }
    }
    for(const end of [-1,1])f.put('box',a.u,a.eave-.22,a.v+end*a.d*.45,a.w+.16,.135,.15,'#a76141',p.wood);
  }else{
    f.put('bathSail',a.u,a.eave,a.v,a.w+.34,1,a.d+.36,cloth,p.solid);
    for(const side of [-1,1]){
      const x=a.u+side*(a.w+.34)/2;
      f.bar([x,a.eave+sailHeight(side*.5,-.5),a.v-a.d/2-.18],
        [x,a.eave+sailHeight(side*.5,.5),a.v+a.d/2+.18],.045,wood);
    }
    for(let j=-1;j<=1;j++){
      const v=a.v+a.d*j*.24;
      f.bar([a.u-a.w*.50,a.eave+sailHeight(-.5,j*.24),v],[a.u+a.w*.50,a.eave+sailHeight(.5,j*.24),v],.025,'#b3a383');
    }
    // The retired planks dry upright in the rack. Narrow gaps retain the sea view.
    for(let j=0;j<4;j++){
      const v=a.v+(j-1.5)*.31;
      f.put('box',a.u-a.w*.41,.65,v,.07,1.30+(j%2)*.22,.24,'#938167',p.wood,0,.12-.025*j);
    }
  }
}
function aqueduct(p,f,s,plan){
  const stone=s.kind==='paddy',wood=plan.wood;
  const channelW=stone?.56:.44;
  // The upper trough picks up a seep directly from a ledge. The lower end
  // drains into the sculpted basin inlet, so every visible reach has a source.
  const first=plan.trough[0],head=first.u-first.w/2-.24,source=first.y;
  const hue=stone?'#8a947a':s.kind==='sulfur'?'#a79a76':'#827c67';
  const offsets=[[-.21,.2,.97, .37,.81],[.08,-.16,.81,.30,.64],[-.06,-.29,.62,.26,.50]];
  for(let j=0;j<offsets.length;j++){
    const [dx,dz,wx,hy,wz]=offsets[j];
    f.put('springCrag'+j,head+dx,source*(.22+.285*j),first.v+dz,wx,hy*source,wz,hue,p.stone,.39*j);
  }
  f.put('rock',head+.10,source+.054,first.v,.28,.056,.23,'#6d7563',p.stone);
  f.put('box',head+.24,source+.039,first.v,.37,.018,.21,'#a3bbae',p.springFlow);
  for(const [i,t] of plan.trough.entries()){
    const lip=t.u+t.w/2,v=t.v,y=t.y;
    const longitudinal=stone?p.stone:p.deck;
    const hue=stone?'#999781':'#938064';
    for(const side of [-1,1]){
      f.put('box',t.u,y+.013,v+side*channelW*.48,t.w,.20,.082,hue,longitudinal);
      const x=t.u-side*(t.w*.50-.12);
      if(stone)f.put('rock',x,y*.40,v,.36,y*.65,.43,'#878b76',p.stone,side*.33);
      else{
        for(const edge of [-1,1])f.put('pole',x,y/2,v+edge*.17,.071,y,.071,wood,p.wood,0,0,side*.024);
        f.bar([x,y-.66,v-.20],[x+side*.49,y-.16,v-.22],.071,'#816f51',p.wood,true);
        f.put('box',x,y-.16,v,.17,.11,.63,wood,p.wood);
      }
    }
    f.put('box',t.u,y-.082,v,t.w,.10,channelW,hue,longitudinal);
    f.put('box',t.u,y-.014,v,t.w-.02,.018,channelW-.13,'#99b4a0',p.springFlow);
    const next=plan.trough[i+1]?.y??.98,drop=y-next;
    if(drop>.035){
      f.put('box',lip+.026,y-drop/2-.006,v,.041,drop+.066,channelW-.15,'#c2d4c2',p.springFlow,0,0,.05);
      f.put('rock',lip+.05,next+.022,v,.17,.027,.16,'#cbd4bc',p.fine);
    }
  }
}
function moonWindow(p,f,r,plan){
  const cx=r.w*.29,cy=r.eave*.55,rad=.64,h=r.eave-.26,d=r.v-r.d/2;
  const path=new T.Shape();
  path.moveTo(-r.w/2,-.18);path.lineTo(r.w/2,-.18);path.lineTo(r.w/2,h);path.lineTo(-r.w/2,h);path.closePath();
  const hole=new T.Path();hole.absarc(cx,cy,rad,0,2*PI,true);path.holes.push(hole);
  p.shapes.bathMoonWindow??=new T.ExtrudeGeometry(path,{depth:.11,bevelEnabled:false,curveSegments:24});
  f.put('bathMoonWindow',r.u,0,d-.05,1,1,1,'#a99c7e',p.solid);
  p.shapes.bathWindowRim??=new T.TorusGeometry(1,.060,7,42);
  f.put('bathWindowRim',r.u+cx,cy,d+.076,rad,rad,rad,plan.wood,p.wood);
  for(const x of [-.31,0,.31]){
    const rise=Math.sqrt(rad*rad-x*x);
    f.put('box',r.u+cx+x,cy,d+.061,.035,2*rise,.041,'#776b50',p.wood);
  }
}
export function regionalBackWall(p,f,plan){
  if(plan.style!=='moor')return false;
  moonWindow(p,f,plan.room,plan);return true;
}
function ridgeCraft(p,f,s,plan){
  const {room:r,wood}=plan,top=r.eave+r.rise;
  if(s.kind==='earthen'){
    // The hot jar room vents steam through an elevated slatted ridge monitor.
    const w=r.w*.50;
    f.put('box',r.u,top+.20,r.v,w,.44,.74,'#81705b',p.boarding);
    for(let j=-5;j<=5;j++)f.put('box',r.u+j*w/12,top+.20,r.v+.39,.067,.34,.054,'#584d41',p.wood);
    f.put('roof',r.u,top+.41,r.v,w+.55,.43,1.30,'#5d6059',p.roofs);
    f.put('box',r.u,top+.84,r.v,w+.20,.11,.15,'#6a6a5f',p.stone);
  }else if(s.kind==='temple'){
    // A hōgyō roof, with a small bronze hōju set above the tiled ridge.
    f.put('hipRoof',r.u,top-.09,r.v,2.56,.81,2.06,'#726c58',p.roofs);
    const h=top+.66;
    f.put('round',r.u,h+.09,r.v,.21,.18,.21,'#7b7a60',p.bronze);
    f.put('finial',r.u,h+.42,r.v,.28,.81,.28,'#7d8269',p.bronze);
    for(const side of [-1,1]){
      const x=r.u+side*r.w*.41,z=r.v+r.d*.49;
      f.bar([x,r.eave-.10,z],[x,r.eave-.46,z],.018,'#766e50',p.bronze);
      f.put('kasa',x,r.eave-.61,z,.15,.26,.15,'#85876c',p.bronze);
      f.put('ball',x,r.eave-.61,z,.053,.066,.053,'#7d765b',p.bronze);
    }
  }else if(s.kind==='capital'){
    // The cusped karahafu faces the doorway. The returning stack behind
    // the two bargeboards makes a projecting hood rather than a flat emblem.
    if(!p.shapes.courtBarge)coveredGable(p);
    const z=r.v+r.d/2+.30;
    for(let j=0;j<4;j++)
      f.put('courtBarge',r.u,r.eave+.10,r.v+r.d/2+.42-j*.17,2.03,1.00,.22,j===0?'#aa9474':'#6c6a5d',j===0?p.wood:p.roofs);
    for(const side of [-1,1])f.bar([r.u+side*1.70,r.eave-.47,z-.20],[r.u+side*1.50,r.eave+.14,z+.12],.105,wood,p.wood,true);
  }else if(s.kind==='bamboo'||s.kind==='inari'){
    // A hill carpenter's forked ridge ties and crossed ends sit clear of the bath.
    for(const end of [-1,1]){
      const x=r.u+end*r.w*.37;
      for(const side of [-1,1])f.bar([x,top-.20,r.v+side*.36],[x,top+.39,r.v-side*.23],.074,s.kind==='inari'?'#956848':'#9a8f68',p.wood,true);
    }
  }else if(s.kind==='sakai'){
    for(const end of [-1,1]){
      const u=r.u+end*r.w*.435;
      f.put('kasa',u,top+.038,r.v,.26,.30,.26,'#69796f',p.stone);
      f.put('ball',u,top+.32,r.v,.125,.16,.125,'#818472',p.stone);
    }
  }else if(s.kind==='paddy'||s.kind==='peach'){
    const x=r.u+r.w*.33;
    f.put('bathPail',x,.25,r.v+.28,.30,.36,.30,'#b69c71',p.wood);
    if(s.kind==='peach'){
      for(let i=0;i<7;i++){
        const a=i*2.4;
        f.put('ball',x+.17*Math.cos(a),.55+.084*(i%2),r.v+.28+.17*Math.sin(a),.085,.091,.083,i%2?'#cb9380':'#d6a78b',p.fine);
      }
    }else{
      for(let i=0;i<6;i++){
        const x=r.u+r.w*(.13+.084*i),z=r.v+r.d*.42,y=r.eave-.38;
        f.put('pole',x,y-.23,z,.055,.07,.099,'#8c7754',p.wood);
        f.put('pole',x,y-.49,z,.13,.52,.11,'#c1a56b',p.thatch,0,0,i%2?.09:-.05);
      }
    }
  }
}
// Walkers meet a short sequence of flat stepping stones through the town
// gate. Their faces follow the actual ground triangle, including its slope.
function steppingStones(p,f,s,plan,level){
  if(!plan.closed)return;
  for(let i=0;i<5;i++){
    const t=i/4,u=.20*Math.sin(t*PI*1.5),v=plan.fore+1.62-i*.65;
    const [x,z]=sitePoint(s,u,v),y=terrainMeshHeight(x,z)-level;
    f.put('rock',u,y-.003,v,.49+.12*(i%2),.065,.365,'#9a9a86',p.stone,.35*i);
  }
}
export function dressRegionalCarpentry(p,f,s,plan,level){
  if(plan.annex)annex(p,f,s,plan);
  if(plan.trough.length)aqueduct(p,f,s,plan);
  ridgeCraft(p,f,s,plan);
  steppingStones(p,f,s,plan,level);
}
