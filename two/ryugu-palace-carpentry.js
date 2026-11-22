import * as THREE from './vendor/three.module.min.js';
import { palaceRoofHeight } from './ryugu-palace-roofs.js';
import { surface } from './ryugu-ink.js';

const {PI}=Math;
const tile='#507366', ink='#34463e', gold='#c6aa6d';
function tileCourse(roof) {
  const vertices=[],faces=[],uv=[];
  // Each side spans continuously from inner wall to outer eave, with a
  // lifted hip at the corner. The inner opening stays clear of the stairwell.
  function sheet(cols,rows,point,width,depth) {
    const start=vertices.length/3;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const s=i/cols,t=j/rows;vertices.push(...point(s,t));uv.push(s*width/5,t*depth/3);
      if(i===cols || j===rows)continue;
      const k=start+j*(cols+1)+i;
      faces.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);
    }
  }
  for(const face of [-1,1])for(const end of [false,true]){
    const w=end?roof.d:roof.w,inside=end?roof.innerD:roof.innerW;
    function point(s,t){
      const cross=(inside+(w-inside)*t)*(s-.5);
      const run=end?(roof.innerW+(roof.w-roof.innerW)*t)/2:(roof.innerD+(roof.d-roof.innerD)*t)/2;
      const u=end?face*run:face*cross,v=end?-face*cross:face*run;
      return [u,palaceRoofHeight(roof,u,v)-roof.eave,v];
    }
    sheet(22,7,point,w,3.6);
    sheet(22,1,(s,t)=>{const [x,y,z]=point(1-s,1);return [x,y-.18*t,z];},w,.18);
  }
  if(roof.gable){
    for(const side of [-1,1])sheet(12,8,(s,t)=>{
      const x=side*(.5-s)*roof.innerW,z=side*t*roof.innerD*.5;
      return [x,roof.rise+roof.gable*(1-t)**1.4,z];
    },roof.innerW,roof.innerD*.5);
  }
  // Top winding is consistent on all four hips and both gable slopes.
  for(let i=0;i<faces.length;i+=3){
    const [a,b,c]=faces.slice(i,i+3).map(k=>k*3);
    if((vertices[b+2]-vertices[a+2])*(vertices[c]-vertices[a])-(vertices[b]-vertices[a])*(vertices[c+2]-vertices[a+2])<0)
      [faces[i+1],faces[i+2]]=[faces[i+2],faces[i+1]];
  }
  return surface(vertices,faces,uv);
}
function carvedBracket() {
  const profile=new THREE.Shape();
  profile.moveTo(-1,.02);profile.bezierCurveTo(-.83,.07,-.82,.28,-.55,.29);
  profile.bezierCurveTo(-.69,.46,-.28,.43,-.25,.60);profile.lineTo(.25,.60);
  profile.bezierCurveTo(.28,.43,.69,.46,.55,.29);profile.bezierCurveTo(.82,.28,.83,.07,1,.02);
  profile.lineTo(.68,.02);profile.bezierCurveTo(.58,.1,.5,.13,.45,.12);
  profile.bezierCurveTo(.35,.3,.14,.31,0,.43);profile.bezierCurveTo(-.14,.31,-.35,.3,-.45,.12);
  profile.bezierCurveTo(-.5,.13,-.58,.1,-.68,.02);profile.closePath();
  const geo=new THREE.ExtrudeGeometry(profile,{depth:.14,bevelEnabled:true,bevelSize:.015,bevelThickness:.014,bevelSegments:1,curveSegments:6});
  geo.translate(0,0,-.07);return geo;
}
export function preparePalaceJoinery(p) {
  p.shapes.palaceBracket=carvedBracket();
  p.shapes.palaceLamp=new THREE.LatheGeometry(
    [[.43,-.52],[.7,-.38],[.82,-.12],[.82,.14],[.67,.38],[.44,.52]].map(([a,b])=>new THREE.Vector2(a,b)),8);
}
export function tilePalaceRoof(p,put,bar,roof,index,ridge) {
  const name='seaPalaceRoof'+index; p.shapes[name]=tileCourse(roof);
  const {u,v,w,d,eave}=roof;
  put(name,u,eave-.15,v,1,1,1,ink,p.wood);
  put(name,u,eave,v,1,1,1,tile,p.roofs);
  const point=(x,z,offset=0)=>[u+x,palaceRoofHeight(roof,x,z)+offset,v+z];
  for(const side of [-1,1])for(const end of [false,true]){
    const edge=end?d:w,inner=end?roof.innerD:roof.innerW;
    function at(s,t,dy=0){
      const delta=s*(inner+(edge-inner)*t)/2;
      const depth=end?roof.innerW+(w-roof.innerW)*t:roof.innerD+(d-roof.innerD)*t;
      return point(end?side*depth/2:delta,end?delta:side*depth/2,dy);
    }
    // Ridged kawara, layered fascia and gilded turn-ups catch the low sea light.
    const ribs=Math.round(edge/1.22);
    for(let i=0;i<=ribs;i++){
      const s=i/ribs*2-1,a=at(s,0),m=at(s,.45),b=at(s,1);
      bar(a,m,.054,'#789384',p.roofs);bar(m,b,.054,'#789384',p.roofs);
      put('ball',b[0],b[1]-.025,b[2],.069,.069,.069,i%4?'#42554b':gold,p.fine);
    }
    for(const dy of [-.105,-.225]){
      for(let i=0;i<12;i++)bar(at(i/6-1,1,dy),at((i+1)/6-1,1,dy),dy>-.2?.075:.055,dy>-.2?gold:ink,p.lacquer);
    }
    if(end)continue;
    for(const sign of [-1,1]){
      let prev=at(sign,0,.065);
      for(let i=1;i<=8;i++){
        const pt=at(sign,i/8,.065);bar(prev,pt,.113,gold,p.lacquer);prev=pt;
      }
      // The bronze wind bell and its slim leaf hang below the upturned hip.
      const [x,y,z]=prev;
      bar([x,y-.1,z],[x,y-.49,z],.021,gold);
      put('kasa',x,y-.81,z,.205,.35,.205,'#796f50',p.bronze);
      put('ball',x,y-.86,z,.047,.086,.047,gold,p.fine);
      put('streamer',x,y-1.07,z,.18,.36,.10,'#77948a',p.fine,.35*sign);
    }
  }
  if(!roof.gable)return;
  const shoulder=eave+roof.rise;
  // The enclosed gable ends carry a vermilion king post with openwork struts.
  for(const sign of [-1,1]){
    const x=u+roof.innerW/2*sign;
    const positions=[],uv=[],idx=[];
    for(let j=0;j<=16;j++){
      const t=j/8-1,z=t*roof.innerD*.5;
      positions.push(0,0,z,0,roof.gable*(1-Math.abs(t))**1.4,z);
      uv.push(j/16,0,j/16,1);
      if(j<16)idx.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);
    }
    const gable='seaPalaceGable';if(!p.shapes[gable])p.shapes[gable]=surface(positions,idx,uv);
    put(gable,x,shoulder,v,1,1,1,'#dfcd9c',p.solid);
    put('box',x,shoulder+.12,v,.29,.22,roof.innerD,'#92553c',p.lacquer);
    put('box',x,shoulder+roof.gable*.48,v,.29,roof.gable*.96,.23,'#995b42',p.lacquer);
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=side*i/6,b=side*(i+1)/6;
      bar([x,shoulder+roof.gable*(1-Math.abs(a))**1.4,v+a*roof.innerD/2],
        [x,shoulder+roof.gable*(1-Math.abs(b))**1.4,v+b*roof.innerD/2],.13,gold,p.lacquer);
    }
    put('palaceBracket',x+sign*.18,shoulder+.23,v,1.85,2.30,1,'#8a6042',p.wood,PI/2);
  }
  const height=shoulder+roof.gable;
  ridge(u,height,v,roof.innerW*1.48,roof.innerD*.76,1.18);
}
