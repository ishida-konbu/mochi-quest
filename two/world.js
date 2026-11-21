import * as THREE from './vendor/three.module.min.js';
import {BUILDINGS, GATES, TREES, ROCKS, REGIONS, ROADS, BRIDGES, WATER_Y, terrainHeight,
  bridgeHeight, riverZ, riverHalfWidth, coastX, regionAt, nearRoad, seeded} from './terrain.js';

const {sin,cos,abs,min,max,sqrt,PI}=Math, TAU=2*PI;
const rnd=seeded(245726);const noise=()=>rnd()-.5;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const h=terrainHeight;
const css=c=>new THREE.Color(c);
const textureURL=name=>new URL('./assets/world/'+name+'.webp',import.meta.url).href;
function geometry(points, indices, uvs=[], colors=[]) {
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);
  if(uvs.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  if(colors.length)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();return g;
}
function canvasTexture(w,h,paint) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  paint(canvas.getContext('2d'),w,h);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function repeat(tex) {
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;return tex;
}
function grain() {
  return repeat(canvasTexture(256,256,(c,w,h)=>{
    c.fillStyle='#f1efdb';c.fillRect(0,0,w,h);
    for(let i=0;i<1250;i++) {
      const x=rnd()*w,y=rnd()*h,r=.7+rnd()*7;
      c.fillStyle=i%3?'rgba(109,120,81,.028)':'rgba(140,104,59,.033)';
      c.beginPath();c.ellipse(x,y,r*(1+rnd()),r*.52,rnd()*PI,0,TAU);c.fill();
    }
    c.strokeStyle='rgba(86,80,55,.16)';c.lineWidth=.7;
    for(let i=0;i<330;i++){const x=rnd()*w,y=rnd()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+1+rnd()*4,y-.7);c.stroke();}
  }));
}
function roadPaper() {
  const tex=canvasTexture(256,256,(c,w,h)=>{
    c.fillStyle='#d7c49a';c.fillRect(0,0,w,h);
    for(let i=0;i<4200;i++){
      const x=rnd()*w,y=rnd()*h,r=.3+rnd()*1.7;
      c.fillStyle=i%3?'rgba(90,70,42,.16)':'rgba(255,244,197,.4)';
      c.beginPath();c.ellipse(x,y,r*1.6,r*.6,.2,0,TAU);c.fill();
    }
    c.globalCompositeOperation='destination-in';
    const fade=c.createLinearGradient(0,0,w,0);fade.addColorStop(0,'transparent');fade.addColorStop(.1,'#000');
    fade.addColorStop(.9,'#000');fade.addColorStop(1,'transparent');
    c.fillStyle=fade;c.fillRect(0,0,w,h);
  });
  tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;return tex;
}
function skyPaper() {
  return canvasTexture(2048,512,(c,w,h)=>{
    const grad=c.createLinearGradient(0,0,0,h);
    for(const [n,t] of [[0,'#819faa'],[.18,'#9dbfc1'],[.37,'#c7d4c5'],[.54,'#eee0bd'],[.64,'#e5d6b9'],[1,'#c4c2a5']])grad.addColorStop(n,t);
    c.fillStyle=grad;c.fillRect(0,0,w,h);
    for(let i=0;i<155;i++){
      const x=rnd()*w,y=100+rnd()*177,span=16+rnd()*138,thick=1+rnd()*8,phase=rnd()*TAU;
      for(const off of [-w,0,w]) {
        const px=x+off;
        c.beginPath();c.moveTo(px-span,y);
        for(let k=0;k<=20;k++){const u=k/20; c.lineTo(px+(2*u-1)*span,y-sin(u*PI)*thick*(.9+.23*sin(u*17+phase)+.15*sin(u*28)));}
        c.bezierCurveTo(px+span*.4,y+thick*.55,px-span*.3,y+thick*.42,px-span,y);
        c.fillStyle='rgba(255,245,217,'+(.06+rnd()*.19)+')';c.fill();
      }
    }
  });
}
function makeSky(scene) {
  const sky=new THREE.Mesh(new THREE.SphereGeometry(960,48,24),new THREE.ShaderMaterial({
    uniforms:{paper:{value:skyPaper()},sunInk:{value:css('#dd8759')}},
    side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec2 vUv; varying vec3 vRay; void main(){vUv=uv;vRay=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D paper;uniform vec3 sunInk;varying vec2 vUv;varying vec3 vRay;
      void main(){vec3 ray=normalize(vRay);vec3 col=texture2D(paper,vUv).rgb;float ds=distance(ray,normalize(vec3(.33,.225,-1.)));
      col=mix(col,sunInk,(1.-smoothstep(.032,.0345,ds))*.92);col+=vec3(.039,.017,.005)*exp(-ds*15.);
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
      }`
  }));
  sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);return sky;
}
function mountainGeometry(cx,cz,rx,rz,height,snow,base) {
  const rings=25,around=88,p=[],uv=[],ix=[],col=[];
  const upland=css(snow?'#737f83':'#788c7e'),low=css(base),cap=css('#e9e3cd'),shade=new THREE.Color();
  const phase=rnd()*TAU;
  for(let j=0;j<=rings;j++)for(let i=0;i<=around;i++) {
    const t=j/rings,a=i/around*TAU;
    const rim=1+.18*cos(3*a+phase)+.095*sin(a*6-.7+phase)+.067*sin(a*11+phase)+.026*cos(a*19);
    const r=(1-t)*rim;const x=cx+cos(a)*rx*r,z=cz+sin(a)*rz*r;
    const crest=height*(snow?Math.pow(t,1.42):sin(t*PI*.5)**1.45);
    const rough=(sin(a*12+phase)*.83+sin(a*23+2*t)*.33+sin(a*5-t*2.3)*1.1)*sin(PI*t)*height*.043;
    p.push(x,crest+rough-6,z);uv.push(x*.046,z*.046);
    shade.copy(low).lerp(upland,t*.85).multiplyScalar(.91+.075*cos(a*16+phase)+.032*sin(a*31+t*2));
    if(snow){const edge=.715+.10*cos(a*8+phase)+.035*sin(a*21);shade.lerp(cap,Math.min(1,Math.max(0,(t-edge)*19))*.94);}
    col.push(shade.r,shade.g,shade.b);
    if(j<rings&&i<around){const k=j*(around+1)+i,l=k+around+1;ix.push(k,k+1,l,k+1,l+1,l);}
  }
  return geometry(p,ix,uv,col);
}
function rollingRidge(scene,material,xOffset,zOffset,width,depth,peak,seed,base,crest) {
  const p=[],col=[],uv=[],ix=[],n=126,m=19;
  const low=css(base),high=css(crest),c=new THREE.Color();
  const phase=seed*1.43;
  for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){
    const u=i/n,v=j/m,x=(u-.5)*width+xOffset;
    // Several drainage scales break the silhouette into naturally grouped
    // summits and saddles, with longer ridges receding behind each shoulder.
    const lane=zOffset+sin(x*.019+phase)*17+sin(x*.0071+phase)*20;
    const section=abs(v-.53)*2;
    const crag=.72+.20*sin(x*.037+phase)+.095*sin(x*.111+phase*.4)+.035*sin(x*.27+phase*.3);
    const shoulder=sin(v*PI)**1.10;
    const gully=sin(x*.066+v*9+phase)*.7+sin(x*.149-v*13+phase)*.3;
    const y=-8+peak*crag*shoulder+gully*peak*.11*sin(section*PI);
    const z=lane+(v-.5)*depth;
    p.push(x,y,z);uv.push(x*.047,z*.047);
    c.copy(low).lerp(high,shoulder*.82).multiplyScalar(.89+.083*sin(x*.091+v*7+phase)+gully*.072);
    col.push(c.r,c.g,c.b);
    if(j<m&&i<n){const k=j*(n+1)+i,l=k+n+1;ix.push(k,l,k+1,k+1,l,l+1);}
  }
  scene.add(new THREE.Mesh(geometry(p,ix,uv,col),material));
}

function landscape(scene,paper) {
  const mat=new THREE.MeshLambertMaterial({map:paper,vertexColors:true});
  const p=[],uv=[],ix=[],col=[],grid=190,world=540;
  const colors=['#a4ad78','#bdbe8a','#8d9b6c','#bfc08e','#afac70','#a3aa78'].map(css);
  const soil=css('#cbb88a'),stone=css('#a59f80'),c=new THREE.Color();
  for(let j=0;j<=grid;j++)for(let i=0;i<=grid;i++) {
    const x=(i/grid-.5)*world,z=(j/grid-.5)*world, y=h(x,z);
    p.push(x,y,z);uv.push(x*.16,z*.16);
    const r=regionAt(x,z), d=abs(z-riverZ(x))-riverHalfWidth(x);
    c.copy(colors[r]).lerp(soil,max(0,1-abs(d-2)/7)*.79);
    c.lerp(soil,max(0,min(1,(16-x+coastX(z))/20)));
    c.lerp(stone,max(0,min(1,(y-15)/30))*.68);
    c.multiplyScalar(.92+.058*cos(x*.076+sin(z*.044))+.065*sin(z*.115+sin(x*.093)));
    col.push(c.r,c.g,c.b);
    if(i<grid&&j<grid){const k=j*(grid+1)+i,l=k+grid+1;ix.push(k,l,k+1,k+1,l,l+1);}
  }
  const land=new THREE.Mesh(geometry(p,ix,uv,col),mat);land.receiveShadow=true;scene.add(land);
  const mMat=new THREE.MeshBasicMaterial({map:paper,vertexColors:true,side:THREE.DoubleSide});
  const mounts=[[-90,-450,180,145,138,1,'#8498a0'],[-224,-362,145,124,105,0,'#91a18c'],
    [127,-383,153,154,98,0,'#829c87'],[260,-265,118,114,115,0,'#8d9e8b'],[-342,-170,140,152,110,0,'#8b9c89'],
    [-350,38,104,125,68,0,'#80998d'],[330,-90,108,150,86,0,'#94a18c'],
    [375,161,163,166,123,0,'#8d9c86'],[-305,280,136,105,74,0,'#93a18b'],
    [-74,350,146,107,100,0,'#929e83'],[133,336,140,111,85,0,'#91a08b'],
    [33,-284,96,85,50,0,'#83947c'],[-164,-259,103,103,50,0,'#899b83']];
  for(const a of mounts)scene.add(new THREE.Mesh(mountainGeometry(...a),mMat));
  rollingRidge(scene,mMat,-24,-338,740,120,100,72,'#92a5a0','#799799');
  rollingRidge(scene,mMat,15,-275,665,84,64,166,'#95a997','#819a92');
}
function buildRoads(scene) {
  const p=[],uv=[],ix=[];const material=new THREE.MeshLambertMaterial({map:roadPaper(),transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
  for(const road of ROADS) {
    let travel=0;const start=p.length/3;
    for(let i=0;i<road.points.length;i++){
      const [x,z]=road.points[i], prev=road.points[max(0,i-1)],next=road.points[min(i+1,road.points.length-1)];
      const dx=next[0]-prev[0],dz=next[1]-prev[1],l=Math.hypot(dx,dz)||1;
      travel+=Math.hypot(x-prev[0],z-prev[1]);
      const width=road.width*(1+.045*sin(x*1.2+z*.7)+.035*sin(z*1.8));
      for(let j=0;j<=4;j++){
        const across=(j/4-.5)*width, xx=x+dz/l*across,zz=z-dx/l*across;
        p.push(xx,h(xx,zz)+.08,zz);uv.push(j/4,travel/5);
        if(i<road.points.length-1&&j<4){const k=start+i*5+j;ix.push(k,k+1,k+5,k+1,k+6,k+5);}
      }
    }
  }
  const mesh=new THREE.Mesh(geometry(p,ix,uv),material);
  mesh.receiveShadow=true;mesh.renderOrder=1;scene.add(mesh);
}
function makeWater(scene) {
  const mat=new THREE.ShaderMaterial({
    side:THREE.DoubleSide,transparent:false, fog:true,
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{clock:{value:0},deep:{value:css('#719a99')},light:{value:css('#b4cac0')},foam:{value:css('#e7e4c8')}}]),
    vertexShader:`varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main(){vec4 wp=modelMatrix*vec4(position,1.);vWorld=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
    fragmentShader:`uniform float clock;uniform vec3 deep,light,foam;varying vec3 vWorld;
    #include <fog_pars_fragment>
    void main(){vec2 p=vWorld.xz;
      float wave=sin(p.y*1.2+sin(p.x*.61-clock*.45)*.65+clock*.85)+.37*sin(p.y*3.23+p.x*.18-clock*.54);
      float broken=sin(p.x*1.56+sin(p.y*.73)+clock*.29);
      float line=smoothstep(.84,1.01,wave)*smoothstep(-.2,.6,broken);float band=.52+.23*sin(p.y*.32+p.x*.13+clock*.18)+.13*sin(p.x*.52-p.y*.35);
      vec3 col=mix(deep,light,band);float river=18.+9.*sin(p.x/51.)+3.3*sin(p.x/25.);
      float bw=8.6+1.9*sin(p.x/38.+.35)+.95*sin(p.x/14.);
      float bank=1.-smoothstep(.17,1.22,abs(abs(p.y-river)-bw+.54+sin(p.x*2.+clock*.72)*.32));
      col=mix(col,foam,line*.50+bank*.25);gl_FragColor=vec4(col,1.);
      #include <fog_fragment>
      #include <colorspace_fragment>
    }`
  });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),mat);m.rotation.x=-PI/2;m.position.y=WATER_Y;scene.add(m);return mat;
}

function roofShape() {
  const p=[],uv=[],ix=[],n=12,bands=5;
  for(const sign of [-1,1]){
    const off=p.length/3;
    for(let j=0;j<=bands;j++)for(let i=0;i<=n;i++){
      const x=i/n-.5,v=j/bands,end=abs(2*x)**5;
      const y=(1-v)**1.62 + end*(.045+.12*v);
      p.push(x*(.86+.14*v),y,sign*v*.5);uv.push(i/n*3,v*2);
      if(i<n&&j<bands){const k=off+j*(n+1)+i,l=k+n+1;ix.push(k,k+1,l,k+1,l+1,l);}
    }
  }
  for(const s of [-1,1]){
    const k=p.length/3;p.push(s*.4,0,-.45,s*.4,0,.45,s*.4,1,0);
    uv.push(0,0,1,0,.5,1);ix.push(k,k+1,k+2);
  }
  return geometry(p,ix,uv);
}
function leafBlade() {
  // Curved blades rise from a common root and taper to a single painted tip.
  const p=[],ix=[],uv=[],col=[];
  const random=seeded(72);
  for(let i=0;i<5;i++) {
    const a=i*2.399+.3*random(),dx=cos(a),dz=sin(a),reach=.20+random()*.44;
    const tall=.58+random()*.43,wide=.025+random()*.028,off=p.length/3;
    for(let j=0;j<3;j++){
      const t=j/3, bend=reach*(t*.2+t*t*.94), w=wide*(1-.65*t);
      for(const s of [-1,1]){
        p.push(dx*bend+s*dz*w,tall*(t+.13*sin(t*PI)),dz*bend-s*dx*w);
        uv.push((s+1)*.5,t);col.push(.58+t*.33,.66+t*.28,.50+t*.26);
      }
      if(j<2){const k=off+j*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    p.push(dx*reach,tall*.9,dz*reach);uv.push(.5,1);col.push(.98,.93,.72);ix.push(off+4,off+5,off+6);
  }
  return geometry(p,ix,uv,col);
}
function flowerShape() {
  const p=[],ix=[],colors=[];
  const tri=(a,b,c,shade)=>{const k=p.length/3;p.push(...a,...b,...c);ix.push(k,k+1,k+2);
    const col=css(shade);for(let i=0;i<3;i++)colors.push(col.r,col.g,col.b);};
  for(const [ox,oz,tall,angle] of [[-.12,.04,.65,0],[.08,-.15,.86,2.2],[.13,.13,.52,3.7]]) {
    const dx=cos(angle)*.14,dz=sin(angle)*.14;
    tri([ox-.017,0,oz],[ox+.019,0,oz],[ox+dx,tall,oz+dz],'#5f7449');
    tri([ox+dx,tall,oz+dz],[ox-.015,0,oz],[ox+dx+.014,tall,oz+dz+.013],'#78905a');
    tri([ox,tall*.26,oz],[ox-.22,tall*.48,oz+.11],[ox-.05,tall*.42,oz],'#86965c');
    tri([ox,tall*.4,oz],[ox+.16,tall*.58,oz-.08],[ox+.04,tall*.49,oz],'#748354');
    const cx=ox+dx,cz=oz+dz;
    for(let i=0;i<5;i++){
      const a=angle+i*TAU/5,l=.095;
      tri([cx,tall,cz],[cx+cos(a-.52)*l,tall+.038+sin(a)*.036,cz+sin(a-.52)*l],[cx+cos(a+.52)*l,tall+.06+sin(a)*.037,cz+sin(a+.52)*l],'#f5e7b4');
    }
    tri([cx-.032,tall+.018,cz],[cx+.028,tall+.019,cz],[cx,tall+.058,cz+.025],'#b7984f');
  }
  return geometry(p,ix,[],colors);
}
function barkPaper() {
  return repeat(canvasTexture(256,384,(c,w,h)=>{
    c.fillStyle='#f0e7ce';c.fillRect(0,0,w,h);
    for(let i=0;i<320;i++){
      const x=rnd()*w,y=rnd()*h,len=7+rnd()*81;
      c.strokeStyle=i%4?'rgba(70,59,38,.20)':'rgba(255,250,226,.65)';c.lineWidth=.45+rnd()*1.7;
      for(const oy of [-h,0,h]){
        c.beginPath();c.moveTo(x,y+oy);c.bezierCurveTo(x+1.8,y+oy+len*.3,x-1.2,y+oy+len*.67,x+.8,y+oy+len);c.stroke();
      }
    }
    for(let i=0;i<10;i++){
      const x=rnd()*w,y=rnd()*h;c.strokeStyle='rgba(87,63,42,.25)';c.lineWidth=.8;
      c.beginPath();c.ellipse(x,y,1.1+rnd()*2,4+rnd()*7,.11,0,TAU);c.stroke();
    }
  }));
}

function roofInk() {
  return repeat(canvasTexture(128,128,(c,w,h)=>{
    c.fillStyle='#e5e5d9';c.fillRect(0,0,w,h);
    for(let i=0;i<12;i++) {
      const x=i*w/12; c.fillStyle='rgba(60,64,60,.35)';c.fillRect(x,0,1.4,h);
      c.fillStyle='rgba(255,253,227,.8)';c.fillRect(x+2.3,0,1.2,h);
    }
    for(let j=0;j<5;j++){c.fillStyle='rgba(41,45,42,.22)';c.fillRect(0,j*h/5,w,1.6);}
  }));
}
const labels={桜川:['#392e23','#e6c983'],茶:['#f1e3be','#56645a'],酒:['#efe0b1','#4b5562'],湯:['#f4e0ac','#9b4d3f'],市:['#f0e3bb','#5a6655'],社:['#e6ce9b','#514138']};
function calligraphy(glyph) {
  const [fg,bg]=labels[glyph];
  return canvasTexture(128,192,(c,w,h)=>{
    c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle=fg;c.globalAlpha=.65;c.lineWidth=2;c.strokeRect(6,7,w-12,h-14);c.globalAlpha=1;
    c.fillStyle=fg;c.textBaseline='middle';c.textAlign='center';c.font='bold 74px "Hiragino Mincho ProN","Yu Mincho",serif';
    const chars=[...glyph];chars.forEach((g,i)=>c.fillText(g,w/2,h/2+(i-(chars.length-1)/2)*71));
  });
}

class Painter {
  constructor(scene,paper) {
    this.scene=scene;this.groups=new Map();this.sway={value:0};
    this.dummy=new THREE.Object3D();this.yAxis=V(0,1,0);this.color=new THREE.Color();
    this.shapes={box:new THREE.BoxGeometry(1,1,1),pole:new THREE.CylinderGeometry(.81,1,1,8),
      round:new THREE.CylinderGeometry(1,1,1,12),rock:new THREE.IcosahedronGeometry(1,0),flower:flowerShape(),
      crown:new THREE.IcosahedronGeometry(1,1),leaf:leafBlade(),
      plane:new THREE.PlaneGeometry(1,1),roof:roofShape(),pyramid:new THREE.ConeGeometry(1,1,4,1),
      ball:new THREE.SphereGeometry(1,10,7)};
    this.solid=new THREE.MeshLambertMaterial({map:paper,side:THREE.DoubleSide});
    this.roofs=new THREE.MeshLambertMaterial({map:roofInk(),side:THREE.DoubleSide});
    this.fine=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
    this.stems=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,vertexColors:true});
    this.wood=new THREE.MeshLambertMaterial({map:barkPaper()});
    this.masonry=new THREE.MeshLambertMaterial({map:repeat(canvasTexture(384,160,(c,w,h)=>{
      c.fillStyle='#dddccc';c.fillRect(0,0,w,h);c.lineWidth=1.6;c.strokeStyle='#94978a';
      for(let j=0;j<4;j++)for(let i=-1;i<8;i++){
        const x=i*62+(j%2)*29,y=j*40,dy=3*sin(i*1.45+j);
        c.beginPath();c.moveTo(x+2,y+5+dy);c.quadraticCurveTo(x+17,y+1,x+56,y+6);
        c.lineTo(x+63,y+31+dy);c.lineTo(x+53,y+38);c.lineTo(x+7,y+36);c.lineTo(x+1,y+25);c.closePath();
        c.fillStyle=(i+j)%3?'#ced1c3':'#e0dfd1';c.fill();c.stroke();
      }
    }))});
    this.sprays={};const texloader=new THREE.TextureLoader();
    for(const name of ['pine','maple','oak','bamboo']) {
      const tex=texloader.load(textureURL(name));
      tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
      const mat=new THREE.MeshLambertMaterial({map:tex,alphaTest:.34,side:THREE.DoubleSide,emissive:0x29291c,emissiveIntensity:.20});
      const phase=this.sway;
      mat.onBeforeCompile=shader=>{
        shader.uniforms.worldTime=phase;
        shader.vertexShader='uniform float worldTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed.x+=sin(instanceMatrix[3].x*.22+instanceMatrix[3].z*.16+worldTime*1.1+uv.y)*uv.y*uv.y*.024;');
      };
      this.sprays[name]=mat;
    }
    this.signs={};
    for(const glyph of Object.keys(labels))this.signs[glyph]=new THREE.MeshLambertMaterial({map:calligraphy(glyph),side:THREE.DoubleSide});
  }
  record(shape,mat,color,matrix,x,z,shadow=true,chunk=false) {
    const key=shape+'|'+mat.id+'|'+Number(shadow)+(chunk?'|'+Math.floor(x/104)+','+Math.floor(z/104):'');
    let b=this.groups.get(key);
    if(!b){b={geo:this.shapes[shape],mat,matrices:[],colors:[],shadow};this.groups.set(key,b);}
    b.matrices.push(matrix.clone());b.colors.push(this.color.set(color).clone());
  }
  part(shape,x,y,z,sx,sy,sz,color,yaw=0,pitch=0,roll=0,mat=this.solid,shadow=true,chunk=false) {
    const d=this.dummy;d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(pitch,yaw,roll,'YXZ');
    d.updateMatrix();this.record(shape,mat,color,d.matrix,x,z,shadow,chunk);
  }
  link(a,b,r,color,square=false,shadow=true,chunk=false,mat=this.solid) {
    const d=this.dummy,dir=b.clone().sub(a),len=dir.length();if(len<.001)return;
    d.position.copy(a).add(b).multiplyScalar(.5);d.scale.set(r,len,r);
    d.quaternion.setFromUnitVectors(this.yAxis,dir.divideScalar(len));d.updateMatrix();
    this.record(square?'box':'pole',mat,color,d.matrix,d.position.x,d.position.z,shadow,chunk);
  }
  finish() {
    for(const {geo,mat,matrices,colors,shadow} of this.groups.values()) {
      const m=new THREE.InstancedMesh(geo,mat,matrices.length);
      for(let i=0;i<matrices.length;i++){m.setMatrixAt(i,matrices[i]);m.setColorAt(i,colors[i]);}
      m.computeBoundingSphere();m.castShadow=shadow;m.receiveShadow=true;this.scene.add(m);
    }
    this.groups.clear();
  }
}
function woodland(p) {
  for(const tree of TREES) {
    const {x,z,h:ht,kind}=tree, y=h(x,z)-.02, r=seeded(tree.seed), a=r()*TAU;
    const base=V(x,y,z);
    if(kind==='bamboo') {
      for(let j=0;j<5;j++){
        const bx=x+(r()-.5)*2.3,bz=z+(r()-.5)*2.3,high=ht*(.7+r()*.42);
        const lean=(r()-.5)*.6;
        p.link(V(bx,y,bz),V(bx+lean,y+high,bz+.12),.075,'#788458',false,true,true);
        for(let k=1;k<7;k++)p.part('round',bx+lean*k/7,y+high*k/7,bz+.12*k/7,.088,.08,.088,'#5b6950',0,0,0,p.solid,false,true);
        for(let k=0;k<4;k++){
          const angle=a+k*1.88, rad=high*.075;
          p.part('plane',bx+lean+cos(angle)*rad,y+high*(.65+k*.10),bz+sin(angle)*rad,high*.31,high*.27,1,
            '#f0f0d9',angle,.07,-.23,p.sprays.bamboo,false,true);
        }
      }
      continue;
    }
    const pine=kind==='pine', willow=kind==='willow', leafName=willow?'bamboo':kind;
    const bark=pine?'#61523f':kind==='maple'?'#665246':'#71664b';
    const lean=ht*(pine?.14:.083);
    const shoulder=V(x+cos(a)*lean,y+ht*.36,z+sin(a)*lean);
    const crown=V(shoulder.x-cos(a+.7)*lean*.69,y+ht*.68,shoulder.z-sin(a+.7)*lean*.69);
    const tip=V(crown.x+lean*.40,y+ht*.91,crown.z+lean*.17);
    p.link(base,shoulder,ht*(pine?.047:.036),bark,false,true,true,p.wood);
    p.link(shoulder,crown,ht*.030,bark,false,true,true,p.wood);p.link(crown,tip,ht*.018,bark,false,true,true,p.wood);
    const near=Math.hypot(x,z-55)<65;
    if(near)for(let j=0;j<4;j++){
      const ang=a+j*1.57+.2, end=V(x+cos(ang)*ht*.13,y+.026,z+sin(ang)*ht*.13);
      p.link(V(x,y+ht*.075,z),end,ht*.029,bark,false,false,true,p.wood);
    }
    const total=near?10:7;
    for(let j=0;j<total;j++){
      const level=j/(total-1), ang=a+j*2.40+(r()-.5)*.65;
      const by=ht*(.36+level*.49);
      const origin=level<.62?shoulder.clone().lerp(crown,level/.62):crown.clone().lerp(tip,(level-.62)/.38);
      origin.y=y+by;
      const radius=ht*(pine?.4:.33)*(1-.56*level)*(.82+.45*r());
      const elbow=V(origin.x+cos(ang)*radius*.54,origin.y+ht*(pine?.015:.094),origin.z+sin(ang)*radius*.54);
      const end=V(origin.x+cos(ang+.18)*radius,origin.y+ht*(pine?.105:.205),origin.z+sin(ang+.18)*radius);
      p.link(origin,elbow,ht*.018*(1-level*.56),bark,false,true,true,p.wood);
      p.link(elbow,end,ht*.011*(1-level*.55),bark,false,true,true,p.wood);
      const spread=ht*(pine?.31:.29)*(.85+r()*.36)*(1-.30*level);
      const count=near?7:5;
      for(let k=0;k<count;k++){
        const angle=ang+k*TAU/count+.26*(r()-.5),edge=spread*(.14+.43*r());
        const tint=pine?['#b9c5a4','#dce1c3','#bfcdac']:kind==='maple'?['#f6d3ac','#e0b58f','#f8b9a3']:['#dbe0af','#c5d195','#e7e1b4'];
        p.part('plane',end.x+cos(angle)*edge,end.y+spread*((willow?-.2:.02)+(r()-.42)*.43),end.z+sin(angle)*edge,
          spread*(pine?1.45:1.14)*(.87+r()*.28),spread*(pine?.68:willow?1.32:1.1)*(.79+r()*.34),1,
          tint[k%3],-angle+PI*.5,.20+(r()-.5)*.73,(r()-.5)*.62,
          p.sprays[leafName],near && k===1,true);
      }
    }
  }
}
function gate(p,g,index) {
  const {x,z,w,h:ht,yaw}=g,y=terrainHeight(x,z);
  const local=(u,v,s)=>V(x+u*cos(yaw)+s*sin(yaw),y+v,z-u*sin(yaw)+s*cos(yaw));
  const part=(sh,u,v,s,sx,sy,sz,col,ry=0)=>{const q=local(u,v,s);p.part(sh,q.x,q.y,q.z,sx,sy,sz,col,yaw+ry);};
  const vermilion='#ad4530', edge='#393c34', shade='#843b2c';
  for(const sign of [-1,1]) {
    const a=local(sign*w*.36,-.30,0), b=local(sign*w*.33,ht-.38,0);
    p.link(a,b,w*.045,vermilion,false,true,false,p.wood);
    part('round',sign*w*.359,.23,0,w*.061,.52,w*.061,'#494d43');
    part('round',sign*w*.357,.54,0,w*.052,.135,w*.052,edge);
    part('box',sign*w*.335,ht*.785,0,w*.115,.19,.47,shade);
  }
  part('box',0,ht*.725,0,w*.91,ht*.058,.39,vermilion);
  part('box',0,ht*.845,0,.31,ht*.21,.3,shade);
  for(let j=0;j<14;j++){
    const u=-.53+j*1.06/14,v=u+1.06/14;
    const top=q=>ht*(.938+.066*(abs(q)/.53)**3);
    p.link(local(u*w,top(u),0),local(v*w,top(v),0),w*.049,vermilion,true,true,false,p.wood);
    p.link(local(u*w,top(u)+w*.035,0),local(v*w,top(v)+w*.035,0),w*.053,edge,true,true,false,p.wood);
  }
  const pos=local(0,ht*.823,.27);
  p.part('plane',pos.x,pos.y,pos.z,.64,.93,1,'#ffffff',yaw,0,0,p.signs[index?'社':'桜川']);
  for(let j=0;j<12;j++){
    const a=-.32+j*.64/12,b=a+.64/12,cy=u=>ht*.68-.39*(1-(u/.32)**2);
    p.link(local(a*w,cy(a),.13),local(b*w,cy(b),.13),.032,'#c8ad74',false,false);
    if(j%3===2){
      const q=local(a*w,cy(a)-.13,.15);p.part('box',q.x,q.y,q.z,.095,.27,.052,'#ede3ca',yaw,0,-.26);
    }
  }
}
function lantern(p,x,z,s=1) {
  const y=h(x,z),stone='#858674',dark='#656e62';
  const f=(shape,dy,a,b,c,col,rot=0)=>p.part(shape,x,y+dy*s,z,a*s,b*s,c*s,col,rot);
  f('box',.11,.76,.22,.76,dark);f('pyramid',.29,.50,.26,.50,stone,PI/4);
  f('round',.71,.21,.75,.21,stone);f('box',1.13,.67,.16,.67,dark);
  f('box',1.39,.48,.43,.48,'#d9c995');
  for(const u of [-1,1])for(const v of [-1,1])p.part('box',x+u*.245*s,y+1.39*s,z+v*.245*s,.095*s,.45*s,.095*s,dark);
  f('pyramid',1.75,.63,.45,.63,stone,PI/4);f('ball',2.00,.13,.16,.13,stone);
}
function bridge(p,b) {
  const {x,z,length,halfWidth:w}=b,n=Math.ceil(length/.55),paint=x===0?'#9b4936':'#795d42';
  for(let i=0;i<n;i++){
    const zz=z-length*.5+(i+.5)/n*length, y=bridgeHeight(b,zz);
    const angle=-Math.atan((bridgeHeight(b,zz+.22)-bridgeHeight(b,zz-.22))/.44);
    p.part('box',x,y-.12,zz,w*2,.23,length/n-.017,i%4===0?'#a18967':i%3===1?'#a8916d':'#af9470',0,angle,0,p.wood);
  }
  const seg=14;
  for(const side of [-1,1]){
    const xx=x+side*(w-.13);
    for(let i=0;i<=seg;i++){
      const zz=z-length*.5+i/seg*length,yy=bridgeHeight(b,zz);
      p.part('box',xx,yy+.57,zz,.17,1.19,.18,paint);
      p.part('pyramid',xx,yy+1.22,zz,.17,.14,.17,'#494d41',PI/4);
      if(i<seg){
        const nz=zz+length/seg,ny=bridgeHeight(b,nz);
        for(const [height,thick,col]of [[1.13,.16,paint],[.52,.105,paint],[-.4,.3,'#71583e']]){
          p.link(V(xx,yy+height,zz),V(xx,ny+height,nz),thick,col,true);
        }
      }
      if(i%3===1){
        p.part('box',xx,yy*.5-.15,zz,.34,yy+1.6,.34,'#685c48',0,0,0,p.wood);
        if(i+2<=seg)p.link(V(xx,yy-.46,zz),V(xx,yy-2.0,zz+length/seg*1.22),.16,'#756448',true,true,false,p.wood);
      }
    }
  }
}

function building(p,b,index) {
  const {x,z,w,d,wall,roof,yaw,kind,y}=b,wood='#69513b',deep='#554b3e',plaster='#ded0a3';
  const local=(u,v,s)=>V(x+u*cos(yaw)+s*sin(yaw),y+v,z-u*sin(yaw)+s*cos(yaw));
  const part=(shape,u,v,s,sx,sy,sz,color,mat=p.solid,rot=0)=>{
    const v3=local(u,v,s);p.part(shape,v3.x,v3.y,v3.z,sx,sy,sz,color,yaw+rot,0,0,mat);
  };
  let foundationBottom=y-.32;
  for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
    const edge=local(dx*(w*.5+.73),0,dz*(d*.5+.73));
    foundationBottom=min(foundationBottom,h(edge.x,edge.z)-.32);
  }
  const stoneHeight=y+.42-foundationBottom;
  part('box',0,.42-stoneHeight/2,0,w+1.1,stoneHeight,d+1.08,'#969484',p.masonry);
  for(let j=0;j<3;j++)part('box',0,.18-j*.19,d/2+.48+j*.39,w*.48,.28,.46,'#a4a28a');
  if(kind==='pagoda') {
    let level=.36;
    for(let j=0;j<4;j++) {
      const scale=1-j*.16,ww=w*scale,dd=d*scale,tier=2.15*scale+.64,top=2.1*scale+.3;
      part('box',0,level+tier*.5,0,ww*.69,tier,dd*.69,'#d4c597');
      part('box',0,level+.06,0,ww*.98,.21,dd*.98,deep);
      for(const u of [-1,0,1])for(const s of [-1,1])part('box',u*ww*.40,level+tier*.48,s*dd*.4,.24,tier,.24,'#914a33');
      for(const s of [-1,1]){
        part('box',0,level+.63,s*dd*.46,ww*.95,.105,.12,'#99553c');
        for(let k=-3;k<=3;k++)part('box',k*ww*.13,level+.39,s*dd*.46,.074,.61,.074,'#89513a');
      }
      part('roof',0,level+tier,0,ww*1.36,top,dd*1.36,'#666b61',p.roofs);
      part('box',0,level+tier+.03,0,ww*1.15,.23,dd*1.15,'#4d524a');
      level+=tier+top-.5;
    }
    part('round',0,level+1.63,0,.092,3.85,.092,'#585948');
    for(let j=0;j<7;j++)part('round',0,level+.24+j*.36,0,.55-j*.051,.12,.55-j*.051,'#7e7650');
    part('ball',0,level+3.65,0,.21,.35,.21,'#a89556');return;
  }
  const tiled=kind!=='cottage'&&kind!=='inn';
  part('box',0,wall*.5+.25,0,w,wall,d,plaster);
  part('box',0,.58,0,w*1.008,.68,d*1.01,'#8c7453');
  for(const s of [-1,1]){
    part('box',0,wall*.77,s*d*.505,w,.14,.15,wood);
    part('box',0,.97,s*d*.507,w,.11,.15,wood);
    for(let j=0;j<5;j++){
      const u=(j/4-.5)*w*.99;part('box',u,wall*.51+.22,s*d*.504,.16,wall,.19,wood);
    }
  }
  part('box',0,wall+.23,0,w*1.08,.26,d*1.08,deep);
  part('roof',0,wall+.29,0,w*1.24,roof,d*1.28,tiled?'#69716a':'#9b8460',p.roofs);
  part('box',0,wall+roof+.35,0,w*1.05,.23,.28,tiled?'#545c55':'#7f694b');
  for(const sg of [-1,1]){
    const mid=sg*w*.275, zw=d*.512;
    part('box',mid,wall*.52+.25,zw,w*.19,wall*.46,.11,'#adab87');
    for(let j=-1;j<=1;j++)part('box',mid+j*w*.042,wall*.52+.25,zw+.065,.065,wall*.48,.08,deep);
    part('box',mid,wall*.52+.25,zw+.071,w*.205,.079,.09,wood);
  }
  part('box',0,wall*.39+.19,d*.516,w*.19,wall*.69,.13,'#6f634a');
  if(kind==='shop'||kind==='inn'||kind==='temple'){
    const tint=kind==='temple'?'#8c4131':index%3?'#576d6a':'#9d5041';
    for(let j=-1;j<=1;j++)part('box',j*w*.113,wall*.78,d*.546,w*.107,.74,.065,tint);
    const q=local(0,wall*.78,d*.554);p.part('plane',q.x,q.y,q.z,.49,.65,1,'#fff',yaw,0,0,p.signs[kind==='inn'?'湯':kind==='temple'?'社':index%3?'茶':'酒']);
    for(const side of [-1,1]){
      const a=local(side*w*.34,wall*.75,d*.583);
      p.part('ball',a.x,a.y,a.z,.31,.42,.31,index%2?'#b86d48':'#d6b37f');
      part('round',side*w*.34,wall*.75+.34,d*.583,.2,.09,.2,'#514e40');
      part('round',side*w*.34,wall*.75-.34,d*.583,.19,.08,.19,'#514e40');
    }
  }
}
function paddies(p) {
  const r=seeded(352);
  for(let i=0;i<24;i++){
    const col=i%6,row=Math.floor(i/6),x=105+col*16.2+sin(row)*4,z=123+row*12.8;
    if(BUILDINGS.some(b=>Math.hypot(x-b.x,z-b.z)<12)||nearRoad(x,z,3))continue;
    const y=h(x,z),sx=13.6,sz=10.8;
    p.part('box',x,y-.22,z,sx,.8,sz,'#a29e64');
    p.part('box',x,y+.205,z,sx-.68,.07,sz-.68,row%2?'#b4ac6a':'#9cae83');
    for(let j=0;j<6;j++)for(let k=0;k<7;k++) {
      const xx=x+(k-3)*1.58+(r()-.5)*.28,zz=z+(j-2.5)*1.52;
      p.part('leaf',xx,y+.19,zz,.75,.5+r()*.32,.64,row%3?'#9b9b4c':'#839259',r()*3,0,.12,p.stems,false,true);
    }
  }
}
function details(p) {
  const r=seeded(27158);
  for(const rock of ROCKS) {
    const y=h(rock.x,rock.z);
    p.part('rock',rock.x,y+rock.h*.37,rock.z,rock.rx*1.12,rock.h*.74,rock.rz*1.16,'#8c9081',.53);
    p.part('rock',rock.x+.11,y+rock.h*.92,rock.z,rock.rx*.86,.13,rock.rz*.81,'#9eac79',.33);
  }
  for(let i=0;i<510;i++){
    const x=r()*488-244,z=riverZ(x)+(r()>.5?1:-1)*(riverHalfWidth(x)+r()*5-1),y=h(x,z);
    if(BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+1.4))continue;
    const s=.19+r()**2*1.1;
    p.part('rock',x,y+.05,z,s*1.33,s*.67,s,'#9ba18b',r()*TAU,.22,r()*.25,p.solid,false,true);
  }
  for(const road of ROADS){
    for(let i=1;i<road.points.length;i+=2) {
      const [x,z]=road.points[i],q=road.points[i-1],len=Math.hypot(x-q[0],z-q[1])||1;
      const nx=(z-q[1])/len,nz=(q[0]-x)/len;
      for(let k=0;k<4;k++) {
        const side=r()>.5?1:-1,delta=side*(road.width*(.5+r()*.22)+r()*1.6);
        const xx=x+nx*delta+(r()-.5)*2,zz=z+nz*delta+(r()-.5)*2, y=h(xx,zz);
        if(y<WATER_Y+.1)continue;
        const high=.18+r()*.46;
        p.part('leaf',xx,y-.03,zz,.49+r()*.48,high,1,'#88935f',r()*TAU,0,(r()-.5)*.34,p.stems,false,true);
        p.part('leaf',xx+.12,y-.025,zz-.05,.62,high*.89,1,'#a8a264',r()*TAU,0,-.17,p.stems,false,true);
        if(r()>.85)p.part('rock',xx,y+.025,zz,.22+r()*.33,.10+r()*.15,.23,'#a5a48d',r()*TAU,0,0,p.solid,false,true);
      }
      if(r()>.30){
        const u=(r()-.5)*road.width*.57,xx=x+nx*u,zz=z+nz*u;
        if(h(xx,zz)>WATER_Y+.35)p.part('rock',xx,h(xx,zz)+.098,zz,.10+r()*.11,.019,.065,'#ad9d79',r()*TAU,0,0,p.fine,false,true);
      }
    }
  }
  // River reeds and a small scattering of higanbana along the opening route.
  for(let i=0;i<800;i++){
    const x=r()*464-232,z=riverZ(x)+(r()>.5?1:-1)*(riverHalfWidth(x)+.5+r()*3.8),y=h(x,z);
    if(BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+1.3))continue;
    for(let j=0;j<3;j++)p.part('leaf',x+(r()-.5)*.5,y,z+(r()-.5)*.5,.27,.51+r()*.92,.7,'#a2a26a',r()*TAU,0,(r()-.5)*.6,p.stems,false,true);
  }
  for(let i=0;i<35;i++){
    const cx=(i%2?1:-1)*(4.9+r()*8),cz=38+r()*43;
    for(let j=0;j<3+r()*4;j++) {
      const x=cx+(r()-.5)*1.9,z=cz+(r()-.5)*1.8,s=.28+r()*.37;
      if(nearRoad(x,z,.30))continue;
      p.part('flower',x,h(x,z),z,s,s,s,i%6?'#fff6df':'#e6b0a0',r()*TAU,0,0,p.stems,false,true);
    }
  }
  for(const t of TREES) {
    const n=Math.hypot(t.x,t.z-55)<85?5:1;
    for(let j=0;j<n;j++){
      const ang=r()*TAU,dist=1.6+r()*3.2,x=t.x+cos(ang)*dist,z=t.z+sin(ang)*dist,s=.50+r()*.75;
      if(nearRoad(x,z,.36)||h(x,z)<WATER_Y+.12)continue;
      for(let k=0;k<3;k++)p.part('plane',x+cos(k*2)*s*.10,h(x,z)+s*.31,z+sin(k*2)*s*.10,
        s*1.25,s*.83,1,'#b3bf92',ang+k*2.1,.18+(r()-.5)*.31,(r()-.5)*.58,p.sprays.bamboo,false,true);
    }
  }
}
function wayMarker(p,x,z,glyph,angle=0) {
  const y=h(x,z);
  p.part('box',x,y+1.18,z,.13,2.45,.14,'#685941',angle);
  p.part('box',x,y+1.8,z,.64,.87,.15,'#846a49',angle);
  p.part('plane',x+.09*sin(angle),y+1.8,z+.09*cos(angle),.57,.79,1,'#fff',angle,0,0,p.signs[glyph]);
}
function hillsideStairs(p) {
  for(const gate of GATES) {
    for(const dir of [-1,1])lantern(p,gate.x+dir*(gate.w*.57),gate.z+1.6,gate===GATES[0]?1.16:1);
  }
  for(const b of BRIDGES)for(const sign of [-1,1])lantern(p,b.x+sign*(b.halfWidth+.94),b.z+b.length*.5+.48,.91);
  for(const [x,z,g,angle] of [[-4.95,61.65,'桜川',.19],[11,-39,'市',.4],[139,-100,'湯',-.16],[-147,-75,'社',.12]])wayMarker(p,x,z,g,angle);
}
function stampStations(p) {
  const plaque=canvasTexture(256,138,(c,w,h)=>{
    c.fillStyle='#e6d5aa';c.fillRect(0,0,w,h);c.strokeStyle='#8e7753';c.lineWidth=4;c.strokeRect(5,6,w-10,h-12);
    c.font='bold 50px "Hiragino Mincho ProN","Yu Mincho",serif';c.textAlign='center';c.textBaseline='middle';
    c.fillStyle='#493e31';c.fillText('御朱印',104,69);
    c.save();c.translate(211,75);c.rotate(-.09);c.fillStyle='#a34531';c.fillRect(-18,-20,36,40);c.strokeStyle='#eedebb';
    c.lineWidth=1.15;c.strokeRect(-15.1,-17,30,34);c.font='23px serif';c.fillStyle='#efe0bf';c.fillText('印',0,1);c.restore();
  });
  const mat=new THREE.MeshLambertMaterial({map:plaque,side:THREE.DoubleSide});
  REGIONS.forEach((r,i)=>{
    const x=r.x-(i===0?4.15:3.65),z=r.z+(i===0?-.3:1),y=h(x,z),yaw=i===0?.20:0;
    const local=(u,v,s)=>V(x+u*cos(yaw)+s*sin(yaw),y+v,z-u*sin(yaw)+s*cos(yaw));
    const part=(shape,u,v,s,sx,sy,sz,color,m=p.wood,rot=0)=>{
      const a=local(u,v,s);p.part(shape,a.x,a.y,a.z,sx,sy,sz,color,yaw+rot,0,0,m);
    };
    for(const dx of [-.54,.54]){
      part('box',dx,.48,0,.11,1.06,.17,'#70553b');
      part('box',dx,.29,-.22,.11,1,.1,'#745e44');
      part('box',dx,.94,-.24,.085,1.5,.085,'#775b40');
    }
    part('box',0,.76,0,1.36,.13,.70,'#90724f');
    part('box',0,1.25,-.205,1.12,.60,.07,'#6d5940');
    part('plane',0,1.25,-.163,1.045,.53,1,'#ffffff',mat);
    part('roof',0,1.62,-.15,1.50,.265,.81,'#676e61',p.roofs);
    part('box',-.18,.837,.08,.38,.03,.3,'#ebdcbe',p.solid,-.13);
    part('box',.27,.85,.075,.2,.054,.18,'#9c4a37');
    part('round',.29,.92,.079,.056,.078,.056,'#70513a');
    part('box',-.39,.875,.16,.16,.045,.10,'#545344');
  });
}

function birdFlock(scene) {
  const positions=new Float32Array(19*6*3),g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#62685b',side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m);
  return time=>{
    let k=0;for(let i=0;i<19;i++){
      const flock=i<9?0:1,j=flock?i-9:i, phase=flock*.8;
      const x=(flock?-112:12)+sin(time*.073+phase)*22+(j%2?1:-1)*j*1.68;
      const z=(flock?-115:-74)+cos(time*.07+phase)*17-j*1.2,y=26+flock*15+sin(j+time*.24)*1.13;
      const f=sin(time*3+j*2)*.36;
      for(const [dx,dy,dz] of [[-.83,f,.19],[0,0,0],[-.32,.078,-.18],[0,0,0],[.82,f,.16],[.31,.09,-.19]]){
        positions[k++]=x+dx;positions[k++]=y+dy;positions[k++]=z+dz;
      }
    }
    g.attributes.position.needsUpdate=true;
  };
}
function driftingLeaves(scene) {
  const vertices=[0,0,0];
  const shape=[[-.02,.63],[.10,.28],[.26,.41],[.22,.15],[.49,.23],[.33,-.03],[.5,-.11],[.13,-.18],
    [.04,-.37],[-.01,-.22],[-.27,-.26],[-.21,-.11],[-.48,-.07],[-.30,.06],[-.46,.25],[-.18,.16],[-.19,.4],[-.07,.27]];
  const indices=[];
  shape.forEach(([x,y],i)=>{vertices.push(x,y,.07*sin(i*2.1));indices.push(0,i+1,(i+1)%shape.length+1);});
  const leaves=new THREE.InstancedMesh(geometry(vertices,indices),new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),16);
  leaves.frustumCulled=false;leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(leaves);
  const d=new THREE.Object3D(), maple=TREES.filter(t=>t.kind==='maple'), palette=['#b45c3c','#a94b36','#cc7b49','#c37a4b'];
  palette.forEach((_,i)=>{for(let k=i;k<16;k+=4)leaves.setColorAt(k,css(palette[i]));});
  let grove=[],lastX=Infinity,lastZ=Infinity;
  return (time,player)=>{
    if(abs(player.x-lastX)+abs(player.z-lastZ)>7){
      lastX=player.x;lastZ=player.z;
      grove=maple.filter(t=>(t.x-lastX)**2+(t.z-lastZ)**2<36**2).slice(0,4);
    }
    leaves.count=grove.length*4;
    grove.forEach((tree,j)=>{
      const y=h(tree.x,tree.z);
      for(let k=0;k<4;k++){
        const id=j*4+k;
        const phase=(time*(.101+k*.0083)+(tree.seed%19)*.061+k*.267)%1;
        const a=1.7*k+tree.seed*.09,spin=phase*TAU*1.4+a;
        d.position.set(tree.x+cos(a)*tree.h*.20+phase*2.7+sin(spin)*.53,y+.09+tree.h*(.68+k*.044)*(1-phase),
          tree.z+sin(a)*tree.h*.23+phase*.78+sin(spin*1.3)*.43);
        d.rotation.set(.25+sin(spin)*.67,spin*1.2,.39+cos(spin*1.6)*.7);
        const s=(.106+k*.016)*min(1,phase*13,(1-phase)*13);d.scale.setScalar(s);d.updateMatrix();leaves.setMatrixAt(id,d.matrix);
      }
    });
    leaves.instanceMatrix.needsUpdate=true;
  };
}

export function createWorld(scene) {
  scene.background=css('#d9d7be');scene.fog=new THREE.FogExp2('#d9d8c2',.00265);
  const sky=makeSky(scene),paper=grain();
  landscape(scene,paper);buildRoads(scene);const water=makeWater(scene);
  const painter=new Painter(scene,paper);
  for(const [i,g] of GATES.entries())gate(painter,g,i);
  for(const b of BRIDGES)bridge(painter,b);
  BUILDINGS.forEach((b,i)=>building(painter,b,i));
  paddies(painter);hillsideStairs(painter);stampStations(painter);details(painter);woodland(painter);painter.finish();
  const birds=birdFlock(scene),leaves=driftingLeaves(scene);
  return {update(time,player,camera){water.uniforms.clock.value=time;painter.sway.value=time;
    if(camera)sky.position.copy(camera.position);birds(time);leaves(time,player);}};
}
