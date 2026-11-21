import * as THREE from './vendor/three.module.min.js';
import { seeded } from './terrain.js';

const tau = 2*Math.PI, height = 2.08;
const profile = new THREE.SplineCurve([
  [0,-.035],[.4,-.01],[.61,.075],[.77,.25],[.84,.47],[.85,.68],[.79,.88],[.67,1.04],[.535,1.13],
  [.56,1.22],[.63,1.37],[.655,1.54],[.61,1.72],[.51,1.87],[.35,1.99],[.16,2.058],[0,height],
].map(([r,y])=>new THREE.Vector2(r,y))).getPoints(55);

// A small irregularity runs continuously across the back seam and onto the apron.
function surface(r,y,angle,hem=0) {
  const radius = r*(1+.011*Math.sin(3*angle+y*2.5)+.009*Math.cos(5*angle-y*3)) + hem;
  return [radius*Math.sin(angle)-.024*y, y, radius*Math.cos(angle)*.93];
}
function radiusAt(y) {
  const i=profile.findIndex(v=>v.y>=y), lo=profile[i-1], hi=profile[i];
  return lo.x+(hi.x-lo.x)*(y-lo.y)/(hi.y-lo.y);
}
function snowBody() {
  const g=new THREE.LatheGeometry(profile,48,-Math.PI), pos=g.attributes.position;
  for (let n=0;n<pos.count;n++) {
    const i=n%profile.length, angle=(g.attributes.uv.getX(n)-.5)*tau;
    pos.setXYZ(n,...surface(profile[i].x,profile[i].y,angle));
    g.attributes.uv.setY(n,Math.max(0,profile[i].y/height));
  }
  g.computeVertexNormals();
  return g;
}

function painted(w,h,draw) {
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'));
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return map;
}
const ink='#3b302b';
function ellipse(c,x,y,w,h,fill) {
  c.beginPath();c.ellipse(x,y,w,h,0,0,tau);c.fillStyle=fill;c.fill();
}
function faceTexture(child) {
  return painted(1024,512,c=>{
    const snow=c.createLinearGradient(0,0,0,512);
    snow.addColorStop(0,'#fafaf7');snow.addColorStop(.65,'#f4f6f3');snow.addColorStop(1,'#d6dee2');
    c.fillStyle=snow;c.fillRect(0,0,1024,512);
    // Blue hollows and bright ice grains survive the softer winter lighting.
    const rng=seeded(4367);
    for(let i=0;i<5300;i++){
      const grain=rng(), x=rng()*1024, y=rng()*512;
      ellipse(c,x,y,.45+grain*2,.37+grain,grain>.53?'rgba(149,174,190,.23)':'rgba(255,255,255,.80)');
    }
    c.save();c.translate(512,139);
    for (const side of [-1,1]) {
      c.save();c.scale(side,1);
      const blush=c.createRadialGradient(79,25,0,79,25,26);
      blush.addColorStop(0,'rgba(214,124,116,.65)');blush.addColorStop(1,'rgba(214,124,116,0)');
      c.fillStyle=blush;c.fillRect(48,-3,61,54);
      if(child) {
        ellipse(c,45,-15,7,3,ink);
        c.beginPath();c.moveTo(28,7);c.bezierCurveTo(40,-8,57,-6,62,6);
        c.bezierCurveTo(49,1,38,1,28,9);c.fillStyle=ink;c.fill();
      } else {
        // The swept brows and paired cheek strokes echo a brush-painted daruma.
        c.beginPath();c.moveTo(23,-15);c.bezierCurveTo(28,-35,55,-37,78,-23);
        c.bezierCurveTo(91,-16,92,-23,94,-27);c.bezierCurveTo(94,-8,78,-12,61,-18);
        c.bezierCurveTo(47,-22,35,-11,23,-15);c.fillStyle=ink;c.fill();
        ellipse(c,47,4,12.5,13.6,'#625045');
        ellipse(c,47,4,9.3,10.8,'#312b2b');ellipse(c,44,.5,2.8,2.7,'#fff6d8');
        c.beginPath();c.moveTo(13,30);c.bezierCurveTo(25,25,41,28,51,20);
        c.bezierCurveTo(39,38,24,31,13,31);c.fillStyle='#5c4338';c.fill();
      }
      c.restore();
    }
    c.beginPath();c.moveTo(-12,32);c.quadraticCurveTo(1,42,13,31);
    c.strokeStyle='#a84e43';c.lineWidth=4;c.lineCap='round';c.stroke();c.restore();
    if(child) {
      // A twisted tenugui tied above the younger figure's forehead.
      c.beginPath();c.moveTo(0,66);c.quadraticCurveTo(512,47,1024,66);
      c.lineTo(1024,81);c.quadraticCurveTo(512,64,0,81);c.closePath();
      c.save();c.clip();c.fillStyle='#ebeadc';c.fillRect(0,40,1024,48);
      c.strokeStyle='#405f72';c.lineWidth=4;
      for(let x=-16;x<1030;x+=19) {c.beginPath();c.moveTo(x,86);c.lineTo(x+25,48);c.stroke();}
      c.restore();
    }
  });
}
function powder() {
  const rng=seeded(8416), n=128, data=new Uint8Array(n*n);
  for(let i=0;i<data.length;i++)data[i]=64+Math.floor(rng()*155);
  const tex=new THREE.DataTexture(data,n,n,THREE.RedFormat);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(6,3);
  tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps=true;tex.needsUpdate=true;
  return tex;
}

function bibGeometry() {
  const pos=[],uv=[],index=[],cols=24,rows=12;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++) {
    const t=row/rows, u=2*col/cols-1, angle=u*(1.04-.24*t);
    const y=1.12+.061*u*u-(.68-.15*u*u)*t;
    const fold=.035+.009*t*Math.cos(u*15);
    pos.push(...surface(radiusAt(y),y,angle,fold));uv.push(col/cols,1-t);
    if(row<rows&&col<cols) {
      const i=row*(cols+1)+col;index.push(i,i+cols+1,i+1,i+1,i+cols+1,i+cols+2);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
  return g;
}
function collar() {
  const g=new THREE.TorusGeometry(1,.1,8,56), pos=g.attributes.position;
  for(let i=0;i<pos.count;i++) {
    const a=g.attributes.uv.getX(i)*tau-Math.PI, edge=g.attributes.uv.getY(i)*tau;
    const y=1.135+.060*Math.sin(a)**2+.040*Math.sin(edge);
    pos.setXYZ(i,...surface(radiusAt(y),y,a,.043+.029*Math.cos(edge)));
  }
  g.computeVertexNormals();
  return g;
}
function bibTexture(indigo) {
  return painted(384,224,c=>{
    const ground=indigo?'#345c6b':'#ad443c',thread=indigo?'#a5b8a6':'#e6ab77';
    c.fillStyle=ground;c.fillRect(0,0,384,224);
    // The seigaiha waves follow the drape. A plum crest sits in the centre.
    for(let row=0;row<11;row++)for(let col=-1;col<10;col++){
      const x=col*54+(row%2)*27, y=row*21;
      c.fillStyle=ground;c.beginPath();c.arc(x,y,27,Math.PI,2*Math.PI);c.fill();
      c.strokeStyle=thread;c.globalAlpha=.6;c.lineWidth=1.7;
      for(let radius=5;radius<=26;radius+=6){c.beginPath();c.arc(x,y,radius,Math.PI,2*Math.PI);c.stroke();}
      c.globalAlpha=1;
    }
    ellipse(c,192,104,50,48,ground);
    c.strokeStyle='#eed7a1';c.lineWidth=2.5;c.stroke();
    for(let i=0;i<5;i++){
      const a=i*tau/5-Math.PI*.5;
      ellipse(c,192+16*Math.cos(a),104+16*Math.sin(a),12,12,'#f1ddb1');
    }
    ellipse(c,192,104,5.8,5.8,'#cf9d5a');
    c.strokeStyle='#e4c998';c.lineWidth=2.5;c.setLineDash([7,5]);c.strokeRect(6,6,372,212);
  });
}

function strawHat() {
  const profile=[[0,.11],[.55,.044],[.92,0],[.955,.024],[.938,.054],[.76,.136],[.48,.27],[.21,.40],[.068,.455],[0,.467]];
  const g=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64,-Math.PI);
  const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){
    const a=(g.attributes.uv.getX(i)-.5)*tau,r=Math.hypot(pos.getX(i),pos.getZ(i));
    pos.setY(i,pos.getY(i)+r*r*(.025*Math.sin(2*a)+.014*Math.cos(3*a)));
  }
  g.computeVertexNormals();
  return g;
}
function strawTexture() {
  return painted(1024,256,c=>{
    c.fillStyle='#ba955c';c.fillRect(0,0,1024,256);
    const rng=seeded(2403);
    for(let i=0;i<320;i++){
      const x=i*1024/320;c.strokeStyle=i%3?'#dfc78e':'#81673f';c.lineWidth=.8+rng()*1.0;
      c.beginPath();c.moveTo(x,253);c.lineTo(x+4*rng(),0);c.stroke();
    }
    for(let j=0;j<20;j++){
      const y=12+j*12;
      c.strokeStyle=j%4?'#947848':'#7c6441';c.lineWidth=j%4?1.2:2.2;
      c.beginPath();for(let x=0;x<=1024;x+=4){const v=y+1.5*Math.sin(x*Math.PI/8+j);if(x)c.lineTo(x,v);else c.moveTo(x,v);}c.stroke();
    }
    c.fillStyle='rgba(244,246,238,.95)';c.beginPath();c.moveTo(0,0);
    for(let x=0;x<=1024;x+=4)c.lineTo(x,42+12*Math.sin(x*tau/256)+7*Math.cos(x*tau/128)+3*rng());
    c.lineTo(1024,0);c.fill();
    // A drift rests along one edge of the brim, leaving the weave visible.
    c.beginPath();c.moveTo(116,145);c.bezierCurveTo(200,128,247,146,334,130);
    c.bezierCurveTo(411,124,450,134,487,132);c.bezierCurveTo(424,143,353,138,300,150);
    c.bezierCurveTo(239,159,156,149,116,145);c.fill();

  });
}

export function snowDaruma(p) {
  p.shapes.snowDaruma=snowBody();
  p.shapes.maekake=bibGeometry();
  p.shapes.bibCord=collar();
  p.shapes.sugegasa=strawHat();
  const grain=powder();
  const faces=[false,true].map(child=>new THREE.MeshStandardMaterial({
    map:faceTexture(child),bumpMap:grain,bumpScale:.011,roughness:.93,
  }));
  const cloth=[false,true].map(indigo=>new THREE.MeshLambertMaterial({map:bibTexture(indigo),side:THREE.DoubleSide}));
  const straw=new THREE.MeshLambertMaterial({map:strawTexture(),side:THREE.DoubleSide});
  return (frame,scale,child,indigo)=>{
    const s=scale, white='#ffffff';
    frame.part('snowDaruma',0,0,0,s,s,s,white,faces[Number(child)]);
    frame.part('maekake',0,0,0,s,s,s,white,cloth[Number(indigo)]);
    const cord=indigo?'#366575':'#ac4942';
    frame.part('bibCord',0,0,0,s,s,s,cord,p.fine);
    frame.part('ball',-.024*s,1.14*s,-.54*s,.086*s,.065*s,.055*s,cord,p.solid);
    if(child) {
      frame.part('ball',.39*s,1.79*s,-.31*s,.079*s,.066*s,.07*s,'#f0ede2',p.solid);
      frame.part('ball',.45*s,1.81*s,-.34*s,.106*s,.042*s,.031*s,'#526e7c',p.solid,-.3,0,.51);
      frame.part('ball',.45*s,1.75*s,-.35*s,.102*s,.040*s,.032*s,'#e1e1d5',p.solid,-.3,0,-.48);
    }
    if(!child)frame.part('sugegasa',-.04*s,1.88*s,0,s,s,s,white,straw,.08,.04,-.045);
  };
}
