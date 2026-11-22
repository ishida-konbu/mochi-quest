import * as T from './vendor/three.module.min.js';
import { WARD_TRADES,wardFloorPlan } from './kyo-layout.js';
import { inscriptionMaterial } from './civic-art.js';
import { printSurface,scrollPaper } from './kyo-scrollwork.js';
import { sculpture } from './pilgrimage-pigment.js';

const tau=Math.PI*2,signs=new Map();
const turn=(profile,n=24)=>new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),n);
function goods(kind) {
  const art=sculpture(),wood='#a78959',ink='#5b4a39';
  const stroke=(tint,p,r)=>art.stroke(tint,p,p.map((_,i)=>i===p.length-1?r*.70:r),12);
  for(let i=0;i<4;i++){
    const x=(i%2-.5)*.45+(i>>1)*.08,z=(i>>1)*.34-.15;
    if(['oil','pottery','lacquer','salt','baskets'].includes(kind)){
      const jar=kind==='oil'||kind==='pottery',h=jar?.58+.065*i:.245+i*.021,wide=jar?.22:.26;
      const profile=jar?[[.18,0],[.53,.03],[.94,.32],[1,.57],[.95,.74],[.55,.84],[.37,.93],[.41,.96],[.43,1],[.34,1],[.34,.92]]:
        [[.12,0],[.5,0],[.52,.08],[.75,.32],[1,.88],[1,1],[.93,1],[.90,.82],[.67,.30],[.12,.20]];
      art.add(turn(profile),({oil:'#796741',pottery:i%2?'#a17955':'#796553',lacquer:i%2?'#904c38':'#48372c',salt:'#a58a65',baskets:'#957349'})[kind],x,0,z,wide,h,wide);
      if(kind==='salt')art.ball('#e1dccc',x,.20,z,.20,.092,.20);
      if(kind==='baskets')for(let j=0;j<6;j++){
        const r=.14+j*.014,y=.045+j*.038;
        const rim=Array.from({length:17},(_,k)=>[x+r*Math.cos(k*tau/16),y,z+r*Math.sin(k*tau/16)]);
        stroke(j%2?'#b6a071':'#715b40',rim,.008);
      }
      if(kind==='oil')art.ball('#887354',x,h,z,.085,.03,.084);
    }else if(kind==='fan'){
      const ox=x,oy=.023;
      for(let k=0;k<11;k++){
        const a=-.88+k*.16;
        const pivot=[ox,oy,z],edge=[ox+.27*Math.sin(a),oy+.23*Math.cos(a),z+.06];
        stroke(wood,[pivot,edge],.009);
        if(k>0){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([
          ox,oy+.008,z, ...edge, ox+.27*Math.sin(a-.16),oy+.23*Math.cos(a-.16),z+.06],3));g.computeVertexNormals();art.add(g,i%2?'#d9bd91':'#cdc6a7');}
      }
    }else if(kind==='rush'||kind==='cloth'||kind==='paper'){
      for(let j=0;j<3;j++){
        const h=.065+j*.094;
        art.post(kind==='rush'?'#9b9068':kind==='cloth'?['#617778','#aa857d','#ac9c64'][j]:'#d4c7ad',x,h,z,.065,.46,.065,0,0,Math.PI/2);
        art.post(ink,x+.17,h,z,.069,.015,.069,0,0,Math.PI/2);
        art.post(ink,x-.17,h,z,.069,.015,.069,0,0,Math.PI/2);
      }
    }else if(kind==='fish'){
      art.ball('#85867b',x,.083,z,.19,.067,.058,0,.26);
      art.ball('#67746b',x+.173,.082,z-.043,.058,.020,.072,0,.48);
      art.ball('#413f37',x-.123,.12,z+.053,.013,.012,.008);
    }else if(kind==='herbs'){
      for(let j=0;j<6;j++){
        const a=j*2.39;stroke('#69734a',[[x,.02,z],[x+.05*Math.cos(a),.19,z+.05*Math.sin(a)],[x+.13*Math.cos(a),.31,z+.12*Math.sin(a)]],.007);
        art.ball(j%2?'#82905e':'#6b805b',x+.085*Math.cos(a),.21,z+.1*Math.sin(a),.028,.074,.018,0,a,.45);
      }
    }else {
      for(let j=0;j<5;j++){
        const a=(j-2)*.10;const at=[x+.05*j,.01,z];
        stroke(wood,[at,[at[0]+a,.42,z+.05]],.012);
        art.stroke('#483e35',[[at[0]+a,.41,z+.05],[at[0]+a,.48,z+.056],[at[0]+a*.94,.54,z+.061]],[.019,.023,.001],9);
      }
    }
  }
  return art.finish();
}
// Overlapping widths of dyed hemp hang from a cord. Their free corners
// roll away from the street, leaving the threshold and stair entrance open.
function shopCurtain(){
  const art=sculpture();
  for(let panel=0;panel<3;panel++){
    const positions=[],indices=[];
    for(let row=0;row<=8;row++)for(let col=0;col<=6;col++){
      const u=col/6,v=row/8,x=(panel+u)/3-.5;
      positions.push(x+(.004*Math.sin(v*3+panel)-.003)*v,
        .5-v+.035*v**4*Math.sin(u*3+panel),.05*Math.sin(u*8-panel*.8)*(.45+.55*v)+.022*v*v);
      const k=row*7+col;
      if(col<6 && row<8)indices.push(k,k+7,k+1,k+1,k+7,k+8);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geo.setIndex(indices);geo.computeVertexNormals();art.add(geo,'#fff');
    for(const u of [.17,.83])art.stroke('#c7b99b',[[((panel+u)/3-.5),.49,.014],[((panel+u)/3-.5),.58,0]],
      [.009,.009],3);
  }
  return art.finish();
}
export function dressWardShop(p,b,part){
  const {w,d,wall,craft}=b,two=wall>5,loft=3.38,post='#70513e',beam='#674c38';
  const [label,tint]=WARD_TRADES[craft];
  if(!signs.has(craft))signs.set(craft,inscriptionMaterial(label,{ground:tint,ink:'#eee4cc',square:true}));
  const key='wardGoods'+craft;p.shapes[key]??=goods(craft);
  const floor=.48,front=d/2;
  part('box',0,.40,0,w+.17,.16,d+.12,'#af936e',p.deck);
  part('box',0,(wall+floor)/2,-front,w,wall-floor,.15,'#c1b496',p.workshopArt.clay);
  for(const side of [-1,1]){
    part('box',side*w/2,(wall+floor)/2,0,.15,wall-floor,d,'#d1c5aa',p.workshopArt.clay);
    part('box',side*w*.427,1.59,front,w*.147,2.21,.19,'#a18a69',p.boarding);
    for(const v of [-front,0,front])part('box',side*w*.492,(wall+floor)/2,v,.15,wall-floor,.16,post,p.wood);
    for(const v of [-front,front])part('box',0,wall-.10,v,w+.18,.23,.20,beam,p.wood);
  }
  if(two){
    for(const q of wardFloorPlan(b).slabs)part('box',q.x,q.top-.065,q.z,q.w,.13,q.d,q.tread?'#a38b66':'#ba9e74',p.deck);
    part('box',0,loft+.49,front,w,1.04,.16,'#a48b64',p.boarding);
    part('box',0,loft+1.75,front,w,.98,.13,'#645b48',p.workshopArt.reed);
    for(let j=-5;j<=5;j++)part('box',j*w*.093,loft+1.74,front+.08,.064,1.13,.055,beam,p.wood);
    for(const v of [-1,1])part('box',0,loft+1.74+v*.57,front+.09,w,.10,.12,post,p.wood);
    // Shitomi shutters lift from the lower rail under the upstairs window.
    part('roof',0,loft+.91,front+.13,w+.20,.25,.79,'#82765f',p.boarding);
    part('box',w*.17,loft+.032,-d*.22,w*.45,.059,d*.28,'#aaa77f',p.workshopArt.reed);
    const tableZ=-d*.34,deskX=w*.17;
    part('box',deskX,loft+.29,tableZ,w*.38,.085,.67,'#8c6a4b',p.deck);
    for(const side of [-1,1])part('box',deskX+side*w*.138,loft+.16,tableZ,.09,.26,.47,post,p.wood);
    part('box',deskX-.28,loft+.351,tableZ+.03,.45,.024,.30,'#e2d5af',p.roomArt.paper);
    part('box',deskX+.36,loft+.362,tableZ,.25,.049,.16,'#595446',p.stone);
    part('box',deskX+.29,loft+.392,tableZ+.08,.32,.018,.018,'#886c45',p.wood,.17);
    const picture=Object.keys(WARD_TRADES).indexOf(craft)%4;
    const scroll='wardPicture'+picture;
    p.shapes[scroll]??=printSurface(picture,'hanging');
    const pictureY=loft+1.31,back=-front+.10;
    part('box',deskX,pictureY,back,2.20,1.14,.04,tint,p.boarding);
    part(scroll,deskX,pictureY,back+.031,2.04,.94,1,'#fff',scrollPaper());
    for(const side of [-1,1])part('box',deskX,pictureY+side*.59,back+.026,2.34,.062,.073,beam,p.wood);

  }
  part('box',0,wall+.01,0,w+.33,.18,d+.29,beam,p.wood);
  part(craft==='rush'||craft==='baskets'?'hipRoof':'roof',0,wall+.29,0,w*1.24,b.roof,d*1.28,'#929083',craft==='rush'||craft==='baskets'?p.thatch:p.roofs);
  part('box',0,wall+b.roof+.29,0,w*(craft==='rush'||craft==='baskets'?.62:1.05),.18,.21,'#626457',p.roofs);
  const signZ=front+.46;
  p.shapes.wardCloth??=shopCurtain();
  part('box',-w*.245,2.47,signZ,w*.32,.057,.066,post,p.wood);
  part('wardCloth',-w*.245,2.22,signZ,w*.31,.46,1,tint,p.stems);
  part('box',w*.24,2.52,signZ,.78,.73,.12,beam,p.wood);
  part('plane',w*.24,2.52,signZ+.071,.77,.62,1,'#fff',signs.get(craft));
  for(const u of [-w*.39,w*.39])part('box',u,1.68,front+.50,.10,2.48,.10,post,p.wood);
  part('roof',0,2.90,front+.15,w*1.01,.36,1.29,'#89846d',p.boarding);
  const desk=w*.255,stallZ=d*.22;
  part('box',desk,.91,stallZ,w*.32,.11,1.09,'#987d59',p.deck);
  for(const v of [-.42,.42])part('box',desk,.67,v+stallZ,w*.27,.40,.09,'#70583e',p.wood);
  part(key,desk,.97,stallZ,1.34,1.34,1.34,'#fff',p.stems);
  // Colour and silhouette carry the occupation from the far side of the lane.
  if(craft==='cloth'||craft==='paper'||craft==='rush'){
    part('box',desk,1.89,stallZ+.42,w*.36,.072,.070,beam,p.wood);
    for(const side of [-1,1])part('box',desk+side*w*.17,1.44,stallZ+.42,.058,.91,.058,post,p.wood);
    for(let j=0;j<3;j++)part('wardCloth',desk+(j-1)*.48,1.55,stallZ+.42,.45,.65,.65,
      craft==='cloth'?['#688381','#a18076','#78778d'][j]:craft==='paper'?'#e3d7bc':'#9e996b',p.stems);
  }
  part('box',w*.22,1.34,-front+.26,w*.42,.09,.49,post,p.wood);
  part(key,w*.22,1.385,-front+.26,1,.88,.82,'#fff',p.stems);
}
