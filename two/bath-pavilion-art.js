import { hasPilgrimBathhouse } from './pilgrim-lodge-plan.js';
import * as T from './vendor/three.module.min.js';
import { dressSuzuriCourt } from './kyo-bath-art.js';
import { bathEnclosure } from './bath-enclosures.js';
import { regionalBackWall, dressRegionalCarpentry } from './regional-bath-carpentry.js';
import { isVillageWorkshop } from './village-workshop-plan.js';
import { dressWaysideShelter } from './wayside-bath-shelter.js';
import { paintScrollAnimal } from './craftwork.js';

const PI=Math.PI, cloths=new Map(), panels=new Map();
function painted(width,height,draw){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshLambertMaterial({map,side:T.DoubleSide});
}
export function washCurtain(plan,kind){
  if(cloths.has(kind))return cloths.get(kind);
  const mat=painted(512,256,(c,w,h)=>{
    c.fillStyle=plan.dye;c.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=2){
      c.fillStyle=x%6?'rgba(245,231,201,.047)':'rgba(45,31,25,.10)';
      c.fillRect(x,0,1,h);
    }
    c.fillStyle='rgba(246,233,202,.10)';
    for(let y=1;y<h;y+=4)c.fillRect(0,y,w,1);
    const ink='#e6d8b5';
    c.strokeStyle=ink;c.lineWidth=3;c.lineCap='round';
    c.fillStyle=ink;c.fillRect(0,18,w,2);c.fillRect(0,h-20,w,3);
    for(const x of [84,428]){
      c.beginPath();c.ellipse(x,128,55,57,.03,.10,PI*1.95);c.stroke();
      c.save();c.translate(x-48,79);c.scale(1.08,1.16);paintScrollAnimal(c,x===84,ink);c.restore();
    }
    c.textAlign='center';c.textBaseline='middle';c.font='99px "Hiragino Mincho ProN","Yu Mincho",serif';
    c.fillText('ゆ',256,112);
    c.font='27px "Hiragino Mincho ProN","Yu Mincho",serif';c.fillText(plan.motif,256,184);
    for(const x of [20,150,324,457]) for(let j=0;j<2;j++){
      c.beginPath();c.moveTo(x-17,214+j*5);c.bezierCurveTo(x-4,202+j*5,x+6,223+j*5,x+25,212+j*5);c.stroke();
    }
  });
  cloths.set(kind,mat);return mat;
}
// Each screen panel is one joinery bay. The reed nodes, binding knots,
// staggered split-bamboo weave and lime joints stay a fixed size on long walls.
function screenFinish(kind){
  if(panels.has(kind))return panels.get(kind);
  const bases={lattice:'#977d60',plaster:'#c5bba5',reed:'#a39672',bamboo:'#92916a',split:'#958369',woven:'#af9879'};
  const mat=painted(256,256,(c,w,h)=>{
    c.fillStyle=bases[kind];c.fillRect(0,0,w,h);
    for(let i=0;i<1900;i++){
      const x=(i*877%1993)*w/1993,y=(i*727%1999)*h/1999;
      c.fillStyle=i%3?'rgba(252,240,208,.11)':'rgba(64,48,35,.09)';
      c.fillRect(x,y,1+(i%3),kind==='plaster'?1.1:3.4);
    }
    if(kind==='plaster'){
      c.fillStyle='#88837a';c.fillRect(0,197,w,59);
      c.strokeStyle='#c8bea9';c.lineWidth=3.9;
      for(let x=-90;x<w+64;x+=59)for(const sign of [-1,1]){
        c.beginPath();c.moveTo(x,198);c.lineTo(x+sign*73,h);c.stroke();
      }
    }else if(kind==='lattice'){
      c.fillStyle='#5f554b';c.fillRect(0,0,w,139);
      for(let x=6;x<w;x+=14){c.fillStyle='#ae9574';c.fillRect(x,0,6,142);c.fillStyle='#77644f';c.fillRect(x+4,0,3,142);}
      for(let y=30;y<130;y+=46){c.fillStyle='#796b54';c.fillRect(0,y,w,4);}
      for(let x=2;x<w;x+=25){c.fillStyle='#766553';c.fillRect(x,139,2,117);}
    }else if(kind==='woven'){
      for(let i=-256;i<480;i+=19)for(const sign of [-1,1]){
        c.strokeStyle=sign>0?'#b3a17c':'#937d5f';c.lineWidth=5;
        c.beginPath();c.moveTo(i,0);c.lineTo(i+256*sign,h);c.stroke();
      }
    }else{
      const step=kind==='bamboo'?17:kind==='reed'?7:30;
      for(let x=0,i=0;x<w;x+=step,i++){
        c.fillStyle='rgba(67,59,43,.38)';c.fillRect(x,0,2.3,h);
        c.fillStyle='rgba(242,223,170,.25)';c.fillRect(x+3,0,kind==='split'?2:1,h);
        if(kind==='bamboo')for(let y=21+(i*17)%41;y<h;y+=78){
          c.fillStyle='#756d50';c.fillRect(x,y,step,2.9);c.fillStyle='#c0b38a';c.fillRect(x,y+3,step,1.75);
        }
        if(kind==='split'){
          c.beginPath();c.moveTo(x+13,11);c.bezierCurveTo(x+19,84,x+3,147,x+12,228);
          c.strokeStyle='rgba(78,62,45,.34)';c.lineWidth=1.13;c.stroke();
        }
      }
      if(kind==='reed'||kind==='bamboo')for(const y of [44,157,230]){
        c.fillStyle='#75664e';c.fillRect(0,y,w,3);
        for(let x=6;x<w;x+=step*2){c.fillRect(x,y-3,3,8);}
      }
    }
  });
  panels.set(kind,mat);return mat;
}
function screen(p,f,u,v,length,angle,height,finish,wood){
  const dx=Math.cos(angle),dz=-Math.sin(angle);
  const count=Math.max(1,Math.round(length/1.12)),bay=length/count;
  const cap=finish==='plaster'||finish==='lattice';
  // Wall toes and post sockets descend below the grade between terrain
  // vertices. A coarse hillside triangle may pass under a narrow fence bay.
  f.put('box',u,-.24,v,length+.10,.62,.15,cap?'#8b8879':'#81745b',cap?p.stone:p.wood,angle);
  for(let i=0;i<count;i++){
    const off=-length/2+bay*(i+.5);
    f.put('box',u+dx*off,height*.50-.005,v+dz*off,bay+.012,height-.08,.098,'#f9f4e6',screenFinish(finish),angle);
  }
  for(let j=0;j<=count;j+=2){
    const off=-length/2+bay*j;
    f.put('box',u+dx*off,height*.50,v+dz*off,.125,height+.12,.14,wood,p.wood,angle);
  }
  for(const y of [height-.035,.11]) f.put('box',u,y,v,length+.095,.087,cap?.24:.17,wood,p.wood,angle);
  if(cap)f.put('box',u,height+.03,v,length+.14,.063,.27,'#706d60',p.stone,angle);
}
function noren(p,f,plan,s,x,z,y,width,height){
  // Three separately folded leaves share one texture. The slit stays open
  // all the way down, without a flat plate underneath it.
  for(let i=0;i<3;i++){
    const key='bathDoorCloth'+i;
    if(!p.shapes[key]){
      const g=p.shapes.springCurtain.clone(),uv=g.attributes.uv;
      for(let j=0;j<uv.count;j++)uv.setX(j,(i+uv.getX(j))/3);
      p.shapes[key]=g;
    }
    const u=x+(i-1)*width/3;
    f.put(key,u,y-height/2,z,width/3-.034,height,.68,'#fff',washCurtain(plan,s.kind));
    for(const d of [-.22,.22])f.put('box',u+d*width/3,y+.032,z,.043,.12,.045,'#beaf90',p.wood);
  }
  f.bar([x-width*.55,y+.071,z],[x+width*.55,y+.071,z],.043,'#8d7958');
}
function washBench(p,f,r,wood){
  const {u,v,w}=r,span=w*.57;
  f.put('box',u,.545,v-.15,span,.112,.39,'#ac936c',p.deck);
  for(const side of [-1,1])f.put('box',u+side*span*.38,.355,v-.15,.15,.37,.32,wood);
  const bx=u+span*.10,bz=v-.16;
  f.put('bathPail',bx,.602,bz,.18,.26,.18,'#b19a71',p.wood);
  for(const h of [.64,.79])f.put('bathBand',bx,h,bz,.18,.022,.18,'#766d55',p.fine);
  f.bar([bx-.17,.89,bz],[bx+.17,.89,bz],.023,wood);
  f.put('box',u-span*.27,.63,bz,.43,.057,.27,'#d9d2b8',p.solid);
  f.put('box',u-span*.27,.659,bz+.073,.42,.018,.025,'#959c87',p.fine);
}
function hallmark(p,f,plan){
  const {room:r,style,wood}=plan,x=r.u+r.w*.33,v=r.v-.24;
  if(['harbor','ferry','cove'].includes(style)){
    // Shipwright's oar and two coils of tarred hemp hung in the dry bay.
    f.bar([x-.35,.24,v],[x+.15,2.22,v],.039,wood);
    f.put('box',x-.29,.53,v,.16,.64,.05,'#a49271',p.wood,0,0,-.24);
    p.shapes.bathCoil??=new T.TorusGeometry(1,.062,6,28);
    for(let j=0;j<3;j++)f.put('bathCoil',x-.44-.037*j,1.49-.025*j,r.v-r.d/2+.11+j*.017,.21,.26,.2,'#b39b73',p.wood);
  }else if(['farm','grove'].includes(style)){
    for(let j=0;j<4;j++){
      const u=x-j*.076;
      f.put('pole',u,1.12,v,.047,1.89,.05,j%2?'#9a8c63':'#af9d76',p.wood,0,0,.038*(j-1));
    }
    for(const y of [.62,1.36])f.put('box',x-.11,y,v+.052,.40,.032,.033,'#746349',p.fine);
  }else if(['temple','town'].includes(style)){
    const z=r.v+r.d/2+.12;
    f.put('box',x,2.01,z,.44,.68,.35,'#d5c4a1',p.solid);
    for(const h of [1.67,1.82,2.17,2.35])f.put('box',x,h,z,.48,.038,.37,wood,p.wood);
    for(const side of [-1,1])for(const a of [-1,1])f.put('box',x+side*.216,2.0,z+a*.167,.026,.65,.027,wood);
    f.bar([x,2.37,z],[x,r.eave-.10,z],.014,wood);
  }
}
function room(p,f,plan,s){
  const r=plan.room,{u,v,w,d,eave,rise}=r;
  const small=plan.small,wood=plan.wood??'#786952',wall=plan.wall??'reed';
  if(isVillageWorkshop(s)){
    if(s.kind==='susuki'){
      // The grassland remains in moonlight. Open wicks still light the room
      // while the city lamps follow their own clock. These share its light pool.
      for(const [x,z,scale] of [[-2.39,-.31,1.05],[2.43,.50,.81]]){
        const at=f.at(u+x,.18,v+z);
        p.lamps.candle(at.x,at.y,at.z,scale);
      }
    }
    return;
  }
  f.put('box',u,-.22,v,w+.15,.78,d+.18,'#897e67',p.stone);
  f.put('box',u,.147,v,w+.17,.064,d+.21,'#b09a74',p.deck);
  if(hasPilgrimBathhouse(s)){
    // The bank's commissioned lodge supplies the posts, windows, roof and
    // regional fittings. Retain the walkable deck and its shared wash bench.
    washBench(p,f,r,wood);
    return;
  }
  if(!regionalBackWall(p,f,plan))screen(p,f,u,v-d/2,w,0,eave-.26,wall,wood);
  for(const side of [-1,1]){
    screen(p,f,u+side*w/2,v,d,PI/2,eave-.25,wall,wood);
    for(const z of [v-d/2,v+d/2]){
      f.put('rock',u+side*w/2,.13,z,.23,.19,.23,'#969689',p.stone);
      f.put(small?'pole':'box',u+side*w/2,eave*.51,z,small?.074:.15,eave-.03,small?.073:.16,wood,p.wood);
    }
  }
  for(const z of [v-d/2,v+d/2])
    f.put('box',u,eave-.13,z,w+.24,.19,.20,wood);
  if(small){
    dressWaysideShelter(p,f,plan,s);
    washBench(p,f,r,wood);
    return;
  }
  const hip=plan.roof==='hip'||plan.roof==='hipTile';
  const tiles=plan.roof==='tile'||plan.roof==='hipTile';
  const straw=['hip','steep'].includes(plan.roof)||small;
  const finish=tiles?p.roofs:straw?p.thatch:p.boarding;
  f.put(hip?'hipRoof':'roof',u,eave,v,w+.66,rise,d+.65,plan.roofTint??'#9c8f70',finish);
  const ridgeSpan=(hip?.47:1)*(w+.63);
  f.put('box',u,eave+rise+.025,v,ridgeSpan,.12,.19,tiles?'#66665e':wood,tiles?p.stone:p.wood);
  if(!hip){
    f.put('gableWalls',u,eave-.016,v,w+.62,rise,d+.60,straw?'#a59772':'#8d7c61',p.boarding);
  }
  if(plan.roof==='shake'){
    // Round stones and transverse battens hold down the cedar shakes.
    for(const side of [-1,1]){
      const z=v+side*(d+.65)*.34, y=eave+rise*.32;
      f.put('box',u,y+.055,z,w+.39,.09,.10,wood);
      for(const a of [-1,0,1])f.put('rock',u+a*w*.39,y+.10,z,.20,.105,.16,'#8b8980',p.stone,a*.43);
    }
  }
  washBench(p,f,r,wood);
  for(const side of [-1,1]){
    const post=u+side*w/2,front=v+d/2;
    f.bar([post, eave-.65,front],[post-side*.55,eave-.17,front],.074,wood,p.wood,true);
  }
  noren(p,f,plan,s,u-w*.14,v+d/2+.13,eave-.26,w*.53,.88);
  hallmark(p,f,plan);
}
export function dressBathEnclosure(p,f,s,level){
  if(s.shape==='suzuri')return dressSuzuriCourt(p,f,s,level);
  const plan=bathEnclosure(s);
  if(!plan)return;
  room(p,f,plan,s);
  if(plan.small)return;
  dressRegionalCarpentry(p,f,s,plan,level);
  for(const b of plan.segments)screen(p,f,b.u,b.v,b.length,b.angle,b.height,plan.wall,plan.wood);
  if(plan.closed){
    // A drip roof and hanging split curtain mark the accessible front gate.
    const y=2.57;
    for(const u of [-1.43,1.43])f.put('box',u,y/2,plan.fore,.16,y,.17,plan.wood);
    f.put('box',0,y-.04,plan.fore,3.23,.17,.22,plan.wood);
    f.put('roof',0,y+.08,plan.fore,3.79,.52,1.18,plan.roofTint,p.roofs);
    noren(p,f,plan,s,0,plan.fore+.075,y-.16,2.63,.76);
  }
}
