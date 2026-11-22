import * as THREE from './vendor/three.module.min.js';
import { entranceCanopy } from './ryugu-palace-porch.js';
import { PALACE_SCREENS, PEARL_LAMPS, PALACE_TABLES, screenLeaves } from './ryugu-palace-fittings.js';
import { PALACE_LEVELS, PALACE_SHELL, PALACE_ROOFS, PALACE_STAIRS, PALACE_POOL, PALACE_BOARDING } from './ryugu-layout.js';
import { palaceFinishes, titleTablet } from './ryugu-palace-finishes.js';
import { preparePalaceJoinery, tilePalaceRoof } from './ryugu-palace-carpentry.js';

const {PI,sin,cos}=Math;
const red='#964f38', lightRed='#ac674c', black='#443f34', gold='#c6ad79', ivory='#dfcfaa';
export function drawSeaPalace(p,put,bar,ornament) {
  const finish=palaceFinishes(), plaque=titleTablet('潮 入 御 殿');
  preparePalaceJoinery(p);
  const box=(u,h,v,w,t,d,color,mat=p.lacquer,angle=0)=>put('box',u,h,v,w,t,d,color,mat,angle);
  const face=(u,h,v,w,t,color,mat,angle=0)=>put('plane',u,h,v,w,t,1,color,mat,angle);
  const sheet=(u,h,v,w,d,mat,under=false)=>put('plane',u,h,v,w,d,1,'#ffffff',mat,0,under?PI/2:-PI/2);

  for(const a of PALACE_SHELL){
    if(a.furnishing)continue;
    const thickness=a.top-a.bottom;
    if(a.kind==='wall'){
      box(a.u,(a.top+a.bottom)/2,a.v,a.w,thickness,a.d,ivory,p.solid);
    } else {
      const foundation=a.bottom===0;
      box(a.u,(a.top+a.bottom)/2,a.v,a.w,thickness,a.d,foundation?'#9b9280':'#78543b',foundation?p.masonry:p.wood);
      sheet(a.u,a.top+.007,a.v,a.w,a.d,finish.timber);
      if(a.bottom>0 && thickness<.24)sheet(a.u,a.bottom-.008,a.v,a.w,a.d,finish.ceiling,true);
    }
  }
  function hangingLamp(u,h,v,s=1) {
    // Braided bronze chain, silk-sided octagonal lantern and vermilion knot.
    put('round',u,h-.22*s,v,.027*s,.45*s,.027*s,black,p.lacquer);
    put('kasa',u,h-.60*s,v,.49*s,.19*s,.49*s,'#676447',p.bronze);
    put('palaceLamp',u,h-.9*s,v,.54*s,.76*s,.54*s,'#fff5d9',finish.lamp,PI/8);
    put('round',u,h-1.27*s,v,.32*s,.09*s,.32*s,gold,p.bronze);
    for(let i=0;i<8;i++){
      const a=i*PI/4+PI/8,x=u+sin(a)*.434*s,z=v+cos(a)*.434*s;
      bar([u+sin(a)*.245*s,h-.53*s,v+cos(a)*.245*s],[x,h-.82*s,z],.019*s,black,p.lacquer);
      bar([x,h-.82*s,z],[u+sin(a)*.25*s,h-1.26*s,v+cos(a)*.25*s],.019*s,black,p.lacquer);
    }
    put('ball',u,h-1.39*s,v,.061*s,.087*s,.061*s,red,p.lacquer);
    put('finial',u,h-1.63*s,v,.062*s,.22*s,.062*s,lightRed,p.fine);
  }
  function frameAt(level,angle,span,edge,index) {
    const {h,v}=level,du=sin(angle),dv=cos(angle),cu=cos(angle),cv=-du;
    const x=(along,offset)=>along*cu+(edge+offset)*du;
    const z=(along,offset)=>v+along*cv+(edge+offset)*dv;
    const part=(shape,along,y,offset,w,t,d,color,mat)=>put(shape,x(along,offset),y,z(along,offset),w,t,d,color,mat,angle);
    const beam=(s,y,o,w,t,d,c,m)=>part('box',s,y,o,w,t,d,c,m);
    const bays=Math.round(span/4),pitch=span/bays;
    if(!index && angle!==0){
      const courses=Math.round(span/5.7),length=span/courses;
      for(let i=0;i<courses;i++)beam((i+.5)*length-span/2,1.81,.184,length,3.61,.13,
        i%3===0?'#a2a08b':'#999b89',p.masonry);
      beam(0,3.60,.232,span+.12,.21,.35,'#b9b49d',p.stone);
      beam(0,.21,.223,span+.09,.35,.28,'#8b8f80',p.stone);
    }
    // A sill, low lacquer dado and vermilion head-tie return around each room.
    beam(0,h+.27,0,span,.52,.39,'#735a43',p.wood);
    beam(0,h+.58,0,span,.105,.45,gold,p.lacquer);
    beam(0,h+3.71,0,span,.18,.46,red,p.lacquer);
    beam(0,h+4.06,0,span,.14,.47,'#ba9560',p.lacquer);
    beam(0,h+4.68,0,span,.25,.63,red,p.lacquer);
    for(let j=0;j<=bays;j++){
      const s=-span/2+j*pitch;
      part('round',s,h+2.4,0,.235,4.8,.235,red,p.lacquer);
      part('round',s,h+.15,0,.30,.29,.30,'#999581',p.stone);
      part('round',s,h+.39,0,.247,.13,.247,gold,p.bronze);
      part('round',s,h+4.21,0,.25,.09,.25,gold,p.bronze);
      for(let k=0;k<3;k++)beam(s,h+4.29+k*.17,0,.58+k*.29,.15,.58+k*.22,k===1?gold:red,p.wood);
    }
    for(let j=0;j<bays;j++){
      const s=(j+.5)*pitch-span/2;
      part('palaceBracket',s,h+4.11,.20,pitch*.31,.85,1.1,gold,p.wood);
      const frameWindow=!(angle===PI && Math.abs(s)<7.1) && !(angle===0 && index===0 && Math.abs(s)<4.2);
      if(frameWindow){
        const w=pitch-.77;
        // Light reaches both faces of the paper panels. The raised vertical
        // bars cast a narrow silhouette at grazing angles from the water.
        for(const o of [-.186,.186]){
          beam(s,h+2.17,o,w,2.51,.085,black,p.wood);
          beam(s,h+2.17,o*1.32,w-.15,2.36,.071,'#f2dfad',finish.shoji);
          const slatted=(index+j)%3===1;
          if(slatted && o>0){
            beam(s,h+2.18,o*1.57,w-.15,2.36,.045,'#af8561',p.wood);
            for(let k=0;k<8;k++)beam(s,h+1.14+k*.29,o*1.87,w-.08,.115,.075,'#755c43',p.wood);
            beam(s,h+2.16,o*1.97,.105,2.4,.083,gold,p.lacquer);
            continue;
          }
          if(slatted && o<0){
            part('plane',s,h+2.61,o*1.65,w-.20,1.37,1,'#c3ab88',finish.brocade);
            beam(s,h+1.95,o*1.68,w-.14,.085,.08,gold,p.wood);
          }
          for(let k=-2;k<=2;k++)beam(s+k*w/5.8,h+2.17,o*1.59,.046,2.41,.045,'#806844',p.wood);
          for(const y of [1.45,2.03,2.72])beam(s,h+y,o*1.59,w-.11,.045,.05,'#896f50',p.wood);
        }
      }else if(angle===0 && index===0){
        // Lacquered blind and ties above the submerged water gate.
        beam(s,h+2.10,.188,pitch-.22,2.68,.08,'#a6895f',p.wood);
        for(let k=0;k<12;k++)beam(s,h+.91+k*.205,.271,pitch-.26,.061,.064,'#d2b180',p.wood);
      }
    }
  }
  function picture(u,v,h,width,height,map,panels) {
    box(u,h,v,width+.46,height+.47,.12,black);
    box(u,h,v+.077,width+.31,height+.31,.095,gold);
    face(u,h,v+.137,width+.24,height+.24,'#ffffff',finish.brocade);
    face(u,h,v+.144,width,height,'#ffffff',map);
    for(let j=1;j<panels;j++)box(u+(j/panels-.5)*width,h,v+.158,.042,height+.014,.033,'#715840',p.wood);
    for(const side of [-1,1])for(const dx of [-1,1]){
      const x=u+dx*(width/2+.14);
      box(x,h+side*(height/2+.13),v+.149,.35,.085,.03,'#c1a475',p.bronze);
    }
  }
  function room(level,index) {
    const {h,v,w,d}=level,front=v+d/2,back=v-d/2;
    frameAt(level,0,w,d/2,index);frameAt(level,PI,w,d/2,index);
    frameAt(level,PI/2,d,w/2,index);frameAt(level,-PI/2,d,w/2,index);
    for(const side of [-1,1]){
      const u=side*(w/2-1.4);
      for(const delta of [-d*.27,d*.22])hangingLamp(u,h+4.81,v+delta,.83);
      // Gilded hanging fittings and brocade borders frame the alcove.
      const at=side*8.6;
      face(at,h+2.7,back+.22,.78,3.45,'#ffffff',finish.brocade);
      box(at,h+.95,back+.23,1.01,.10,.14,gold);
      hangingLamp(at,h+4.83,back+1.15,.93);
    }
    if(index===1){
      picture(0,back+.21,h+2.45,9.68,2.94,ornament.screen,4);
    }else{
      picture(index===2?-2:0,back+.21,h+2.48,10.36,3.45,index===2?finish.banquet:finish.reception,4);
    }
    if(index===0){
      const wing=(w-PALACE_POOL.w)/2;
      for(const s of [-1,1]){
        const u=s*(PALACE_POOL.w+wing)/2;
        for(let i=0;i<3;i++)box(u+wing*(i-1)/3,1.82,front+.195,wing/3,3.64,.13,
          i===1?'#a3a28c':'#9d9d87',p.masonry);
        box(u,3.6,front+.28,wing,.21,.37,'#beb69a',p.stone);
        box(s*(PALACE_POOL.w/2+.11),1.72,front+.20,.24,3.44,.34,'#735840',p.lacquer);
        box(s*(PALACE_POOL.w/2+.23),1.68,front+.38,.09,3.31,.10,gold);
      }
      box(0,3.64,front+.24,PALACE_POOL.w+.65,.34,.48,red);
      box(0,3.92,front+.28,PALACE_POOL.w+1.18,.18,.53,gold);
      entranceCanopy(p,put,bar,finish,plaque);
      for(const s of [-1,1]){
        hangingLamp(s*5.05,6.78,front+.82,.91);
        // Lip of the water court. The head of the stair is left fully open.
        box(s*(PALACE_POOL.w/2+.095),4.018,PALACE_POOL.v,.19,.041,PALACE_POOL.d,'#b19971');
      }
    }
    tilePalaceRoof(p,put,bar,PALACE_ROOFS[index],index,ornament.ridge);
  }
  PALACE_LEVELS.forEach(room);

  function goza(u,h,v,w,d) {
    box(u,h+.02,v,w,.038,d,'#635844',p.wood);
    sheet(u,h+.043,v,w,d,finish.mat);
  }
  for(const screen of PALACE_SCREENS){
    // A single ink painting follows the folds. The front of each leaf uses
    // only its individual sixth, so its horizon joins the next panel.
    const leaves=screenLeaves(screen);
    for(const [i,leaf] of leaves.entries()){
      const {u,v,angle,w}=leaf,{h,height}=screen,shape='seaPalaceScreen'+i;
      if(!p.shapes[shape]){
        const panel=new THREE.PlaneGeometry(1,1),uv=panel.attributes.uv;
        for(let j=0;j<uv.count;j++)uv.setX(j,(uv.getX(j)+i)/leaves.length);
        p.shapes[shape]=panel;
      }
      const dx=Math.sin(angle),dz=Math.cos(angle);
      box(u,h+height/2,v,w+.015,height,.109,black,p.lacquer,angle);
      put(shape,u+dx*.060,h+height*.505,v+dz*.060,w-.062,height-.14,1,'#fff4dc',ornament.screen,angle);
      face(u-dx*.060,h+height*.505,v-dz*.060,w-.06,height-.14,'#fff0cf',finish.brocade,angle+PI);
      for(const y of [.17,height-.15]){
        const k=w*.48;box(u+Math.cos(angle)*k+dx*.064,h+y,v-Math.sin(angle)*k+dz*.064,.095,.12,.045,gold,p.bronze,angle);
      }
    }
  }
  for(const [u,v,h,w,d] of PALACE_TABLES){
    goza(u,h,v+1.14,w+1.03,d+2.8);
    box(u,h+.57,v,w,.155,d,black);
    for(const s of [-1,1])box(u+s*w*.37,h+.27,v,.21,.54,d*.77,red);
    box(u-w*.16,h+.66,v,w*.38,.021,d*.57,'#ded0b0',p.fine);
    put('round',u-w*.16,h+.73,v-.23,.080,w*.39,.080,'#c1ac80',p.wood,0,0,PI/2);
    box(u+w*.28,h+.674,v,.48,.072,.32,'#53544a');
  }
  for(const [u,v,h] of PEARL_LAMPS){
    box(u,h+.10,v,.95,.17,.95,black);
    put('shaft',u,h+.18,v,.40,.82,.40,red,p.lacquer);
    put('round',u,h+.99,v,.43,.095,.43,gold,p.bronze);
    put('shellValve',u,h+1.04,v,.58,.68,.51,'#d2c49c',p.fine,0,-.21);
    put('shellValve',u,h+1.045,v,.61,.59,.54,'#ddc99a',p.fine,0,1.19);
    put('ball',u,h+1.36,v+.15,.205,.217,.205,'#f6e0b6',finish.lamp);
  }
  const bathH=PALACE_LEVELS[2].h;
  p.shapes.tideRug=new THREE.CircleGeometry(1,72);
  put('tideRug',-2,bathH+.024,-24,4.55,4.24,1,'#ffffff',finish.tideMat,0,-PI/2);
  goza(-2,bathH,-17.37,2.72,5.38);
  goza(0,PALACE_LEVELS[0].h,-30.02,3.35,13.6);
  for(const side of [-1,1])goza(side*5.18,PALACE_LEVELS[0].h,-36.83,2.22,3.90);
  for(const {u,v,w,h,d} of PALACE_BOARDING){
    box(u,h+.008,v+d*.46,w,.034,.064,'#a3a18b',p.stone);
  }
  for(const flight of PALACE_STAIRS){
    for(const tread of flight.steps){
      box(tread.u,tread.h-.04,tread.v+tread.d*.455,tread.w,.096,.07,'#b28a5e',p.wood);
    }
    for(const side of [-1,1]){
      const x=flight.u+side*(flight.w/2-.065);
      const left=flight.steps[0],right=flight.steps.at(-1);
      for(const offset of [.48,.89])bar([x,left.h+offset,left.v],[x,right.h+offset,right.v],.055,offset>.5?gold:red,p.lacquer);
      flight.steps.forEach((s,i)=>{
        if(i%4!==0)return;
        box(x,s.h+.43,s.v,.095,.85,.095,red);
        put('ball',x,s.h+.92,s.v,.084,.098,.084,gold,p.bronze);
      });
      bar([x,left.h-.12,left.v],[x,right.h-.12,right.v],.14,'#72533d',p.wood);
    }
  }
}
