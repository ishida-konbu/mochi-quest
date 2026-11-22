// Patterns are painted at their physical scale. Long planks, gold brocade,
// coffered ceilings and the translucent paper of the lamps have separate grain.
import * as THREE from './vendor/three.module.min.js';

const tau=Math.PI*2;
function swatch(width,height,paint,repeat=false) {
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d');
  let seed=2887;
  const rand=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  paint(ctx,width,height,rand);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  if(repeat)texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  return texture;
}
function boards(g,w,h,rand) {
  const tones=['#ae7954','#b78059','#a87752','#b78560','#ad7d58','#bf8b61','#b98760','#ab7c5c'];
  const plank=h/8;
  for(let i=0;i<8;i++){
    const y=i*plank,shift=rand()*w;
    g.save();g.beginPath();g.rect(0,y,w,plank);g.clip();
    g.fillStyle=tones[i];g.fillRect(0,y,w,plank);
    for(let j=0;j<120;j++){
      const k=y+rand()*plank,amp=.2+rand()*1.9,f=1+Math.floor(rand()*3),phase=rand()*tau;
      g.strokeStyle=j%4?'rgba(83,46,32,.115)':'rgba(249,207,155,.22)';g.lineWidth=.4+rand()*.65;g.beginPath();
      for(let n=0;n<=64;n++){const x=n*w/64,yy=k+amp*Math.sin(tau*f*x/w+phase)+.8*Math.sin(tau*x/w+phase*2);if(n)g.lineTo(x,yy);else g.moveTo(x,yy);}g.stroke();
    }
    for(let j=0;j<2;j++){
      const knotX=(shift+j*w*.53)%w, knotY=y+plank*(.25+rand()*.5);
      for(let n=0;n<3;n++){g.beginPath();g.ellipse(knotX,knotY,7+6*n,1+1.1*n,-.018,0,tau);
        g.strokeStyle='rgba(102,58,40,.24)';g.stroke();}
    }
    g.fillStyle='#74543e';g.fillRect(shift,y,1.3,plank);g.fillRect(0,y,w,1.8);
    g.fillStyle='#c89b72';g.fillRect(0,y+1.8,w,.85);
    for(const x of [shift-6,shift+6])for(const k of [.17,.83]){g.beginPath();g.ellipse(x,y+plank*k,1.6,.85,0,0,tau);g.fillStyle='#6e5546';g.fill();}
    g.restore();
  }
}
function brocade(g,w,h,rand) {
  g.fillStyle='#325558';g.fillRect(0,0,w,h);
  g.lineWidth=1.1;
  for(let y=-32;y<=h+32;y+=16)for(let i=-1;i<=w/64+1;i++){
    const x=i*64+((y/16)%2)*32;
    for(let j=0;j<6;j++){g.beginPath();g.arc(x,y,5+j*5,Math.PI,tau);
      g.strokeStyle=j%2?'#b4a675':'#7a8f7f';g.stroke();}
  }
  for(let i=0;i<9000;i++){
    g.fillStyle=i%3?'rgba(17,46,51,.18)':'rgba(244,207,132,.23)';
    g.fillRect(rand()*w,rand()*h,1+rand()*3,.75);
  }
}
function ceiling(g,w,h,rand) {
  // Four individually dyed panels form one repeat of a lattice ceiling.
  const step=w/2,tones=['#486a62','#705749','#5c6057','#695e4b'];
  for(let i=0;i<4;i++){
    const x=step*(i%2),y=step*Math.floor(i/2),cx=x+step/2,cy=y+step/2;
    g.fillStyle=tones[i];g.fillRect(x,y,step,step);
    for(let k=0;k<18;k++){
      const a=k*tau/18;g.save();g.translate(cx,cy);g.rotate(a);
      g.beginPath();g.moveTo(0,-11);g.bezierCurveTo(-10,-30,-9,-48,0,-58);g.bezierCurveTo(10,-46,10,-30,0,-11);
      g.fillStyle=k%2?'#a99369':'#ba9a71';g.fill();g.strokeStyle='#6b624f';g.lineWidth=1.5;g.stroke();g.restore();
    }
    g.beginPath();g.arc(cx,cy,13,0,tau);g.fillStyle='#b6a68a';g.fill();
    for(const [d,color,width] of [[3,'#513d30',6],[8,'#ae8059',4],[12,'#ceb378',1.7],[16,'#383e36',1.2]]){
      g.strokeStyle=color;g.lineWidth=width;g.strokeRect(x+d,y+d,step-2*d,step-2*d);
    }
  }
  for(let i=0;i<5000;i++){g.fillStyle='rgba(234,215,166,.10)';g.fillRect(rand()*w,rand()*h,1+rand()*3,.8);}
}
// Use metres along the floor, independent of the slab and stairwell cuts.
function floorPaint(map,along,across) {
  const m=new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      vec3 timberWorld=(instanceMatrix*vec4(position,1.)).xyz;
      vMapUv=vec2(-timberWorld.z/${along.toFixed(3)},timberWorld.x/${across.toFixed(3)});`);
  };
  m.customProgramCacheKey=()=>'palace-floor-'+along+'-'+across;
  return m;
}
function reedMat(g,w,h,rand) {
  g.fillStyle='#aba483';g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=2.2){
    g.strokeStyle=y%5<2?'#968b6b':'#cfba8c';g.lineWidth=.7;
    g.beginPath();g.moveTo(0,y);g.lineTo(w,y+rand()*.9);g.stroke();
  }
  for(const k of [12,w-12]){g.fillStyle='#394e4a';g.fillRect(k-11,0,22,h);
    for(let y=0;y<h;y+=16){g.strokeStyle='#c8ad75';g.lineWidth=1.6;g.beginPath();g.moveTo(k,y);g.lineTo(k+5,y+7);g.lineTo(k,y+14);g.lineTo(k-5,y+7);g.closePath();g.stroke();}}
}
function tideMat(g,w,h,rand){
  g.fillStyle='#596f68';g.fillRect(0,0,w,h);
  for(let i=0;i<13000;i++){g.fillStyle=i%3?'rgba(209,196,155,.19)':'rgba(24,39,39,.16)';g.fillRect(rand()*w,rand()*h,1+rand()*8,.8);}
  const cx=w/2,cy=h/2;
  for(let i=0;i<14;i++){
    const a=i*tau/14;g.save();g.translate(cx,cy);g.rotate(a);
    for(let k=0;k<5;k++){
      g.strokeStyle=k%2?'#b9b198':'#91a498';g.lineWidth=1.7;
      g.beginPath();g.ellipse(0,-h*.356,4+k*3,6+k*2,0,Math.PI,tau);g.stroke();
    }
    g.restore();
  }
  for(const r of [.438,.455,.466]){g.beginPath();g.arc(cx,cy,w*r,0,tau);g.strokeStyle=r===.455?'#bfa775':'#a6ad95';g.lineWidth=r===.455?4:1.4;g.stroke();}
}
function lantern(g,w,h) {
  const grad=g.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#c5a988');grad.addColorStop(.28,'#f6dda5');grad.addColorStop(.55,'#fff1c1');grad.addColorStop(1,'#e0b280');
  g.fillStyle=grad;g.fillRect(0,0,w,h);g.strokeStyle='#be986b';g.lineWidth=1.6;
  for(let i=0;i<8;i++){const x=(i+.5)*w/8;
    g.beginPath();g.moveTo(x-6,h*.64);g.quadraticCurveTo(x,h*.49,x+4,h*.37);g.quadraticCurveTo(x+2,h*.56,x-6,h*.64);g.stroke();
  }
  for(let y=0;y<h;y+=5){g.fillStyle='rgba(135,93,59,.11)';g.fillRect(0,y,w,.65);}
}
export function palaceFinishes() {
  const load=path=>{
    const map=new THREE.TextureLoader().load(path.href);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
    return new THREE.MeshLambertMaterial({map,emissive:'#eacb8d',emissiveMap:map,emissiveIntensity:.22});
  };
  const cloth=swatch(256,128,brocade,true);cloth.repeat.set(2,1);
  const silk=swatch(256,160,lantern);
  return {
    mat:new THREE.MeshLambertMaterial({map:swatch(384,384,reedMat)}),
    tideMat:new THREE.MeshLambertMaterial({map:swatch(512,512,tideMat)}),
    timber:floorPaint(swatch(1024,384,boards,true),10,3.45),
    ceiling:floorPaint(swatch(336,336,ceiling,true),4.8,4.8),
    brocade:new THREE.MeshLambertMaterial({map:cloth}),
    shoji:new THREE.MeshLambertMaterial({color:'#d6d2ab',emissive:'#b8a570',emissiveIntensity:.23}),
    lamp:new THREE.MeshLambertMaterial({map:silk,emissive:'#ffce80',emissiveMap:silk,emissiveIntensity:.68}),
    reception:load(new URL('./assets/ryugu-court-scroll.webp',import.meta.url)),
    banquet:load(new URL('./assets/world/ryugu-banquet.webp',import.meta.url))
  };
}
export function titleTablet(text) {
  const map=swatch(472,128,(g,w,h)=>{
    g.fillStyle='#233e3e';g.fillRect(0,0,w,h);
    g.strokeStyle='#98754c';g.lineWidth=5;g.strokeRect(6,5,w-12,h-10);
    g.strokeStyle='#ccb579';g.lineWidth=1.7;g.strokeRect(13,12,w-26,h-24);
    g.fillStyle='#e9d298';g.font='bold 78px "Yu Mincho","Hiragino Mincho ProN",serif';
    g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h*.53);
  });
  return new THREE.MeshLambertMaterial({map,emissive:'#8e7451',emissiveIntensity:.17});
}
