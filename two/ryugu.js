import * as THREE from './vendor/three.module.min.js';
import { terrainHeight, WATER_Y, seeded, wrapDelta } from './terrain.js';
import { RYUGU, HALLS, GATE_V } from './ryugu-layout.js';

const { sin, cos, PI } = Math;
const vermilion='#b14e39', cinnabar='#cf644c', ink='#384a48', gilding='#d2ad62', shell='#ece3c7', jade='#43877d';

// A karamon with a scalloped, plastered arch, extruded through to the far face.
function tideGate() {
  const path = new THREE.Shape();
  path.moveTo(-6.45,0); path.lineTo(-2.6,0); path.lineTo(-2.6,1.95);
  path.bezierCurveTo(-2.73,3.35,-1.45,4.55,0,4.8);
  path.bezierCurveTo(1.45,4.55,2.73,3.35,2.6,1.95);
  path.lineTo(2.6,0); path.lineTo(6.45,0); path.lineTo(6.45,5.3);
  path.quadraticCurveTo(2.1,5.6,0,6); path.quadraticCurveTo(-2.1,5.6,-6.45,5.3); path.closePath();
  const arch=new THREE.ExtrudeGeometry(path,{depth:3.3,bevelEnabled:false,curveSegments:12});
  arch.translate(0,0,-1.65);
  return arch;
}
function courtPlaque() {
  const canvas=document.createElement('canvas'); canvas.width=256;canvas.height=96;
  const g=canvas.getContext('2d');
  g.fillStyle='#384c49';g.fillRect(0,0,256,96);
  g.strokeStyle='#d7bb7a';g.lineWidth=5;g.strokeRect(6,6,244,84);g.lineWidth=1;g.strokeRect(13,12,230,71);
  g.textAlign='center';g.textBaseline='middle';g.font='bold 55px "Yu Mincho", "Hiragino Mincho ProN",serif';
  g.fillStyle='#f1d890';g.fillText('竜 宮 城',128,50);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({map:texture});
}
// Fired-clay panels flank the entrance. A bream carries a folding fan on one,
// and an old turtle plays the hand drum on the other, both in the same ink.
function gateRelief(turtle) {
  const tile=document.createElement('canvas');tile.width=320;tile.height=150;
  const g=tile.getContext('2d');
  g.fillStyle='#d6ceb2';g.fillRect(0,0,320,150);
  g.strokeStyle='#8f8666';g.lineWidth=2;g.strokeRect(4,4,312,142);
  g.lineJoin=g.lineCap='round';
  function brush(path,fill,width=3) {
    const form=new Path2D(path);
    if(fill){g.fillStyle=fill;g.fill(form);}
    g.strokeStyle='#544e3d';g.lineWidth=width;g.stroke(form);
  }
  for(let i=0;i<3;i++) {
    g.strokeStyle=['#a5b1a2','#8eaba2','#acb9a7'][i]; g.lineWidth=1.8;g.beginPath();
    g.moveTo(12,109+i*9);
    for(let j=0;j<4;j++)g.bezierCurveTo(32+j*73,120+i*9,50+j*73,94+i*9,78+j*73,106+i*9);
    g.stroke();
  }
  if(turtle) {
    brush('M99 92 Q90 78 111 51 Q128 27 157 39 Q178 46 183 73 L172 92 Q136 108 99 92Z','#99a492');
    brush('M104 86 Q131 89 154 75 Q168 65 172 52 M110 68 L124 70 137 51 132 40 M124 70 L138 85 154 75 152 56 138 51 M152 56 L164 49',null,1.6);
    brush('M161 83 Q177 74 177 58 Q175 40 191 36 Q208 32 217 38 Q224 44 215 48 L199 49 Q193 51 191 76 Q188 89 169 93','#c1bba1');
    brush('M105 90 Q99 97 84 103 Q80 107 89 108 L110 106 123 96 M154 97 Q163 104 173 104 L181 98 M190 69 L215 56 229 64',null,3.7);
    brush('M207 61 Q218 55 231 59 L239 79 Q224 83 213 79Z','#b2775d');
    brush('M210 62 L223 76 221 59 234 77 230 60',null,1.8);
    brush('M198 39 Q203 36 207 40',null,2);
  } else {
    brush('M104 70 Q123 42 154 41 Q174 39 192 50 L208 59 194 63 Q184 81 161 91 Q133 98 106 82 L81 96 88 78 76 62Z','#c48973');
    brush('M116 58 L119 46 125 49 130 38 134 44 139 34 144 41 151 34 160 41 M176 49 Q158 63 173 76 M174 76 Q180 74 182 70',null,2.4);
    brush('M157 69 L131 79 142 66 M144 92 Q146 103 135 111 L121 112 M157 92 Q166 105 179 103 L189 97 M157 65 Q169 78 180 67 L212 43',null,3);
    brush('M218 53 Q205 29 204 20 Q231 13 251 36Z','#c6a26e');
    brush('M218 52 L211 20 M219 50 L222 19 M220 50 L233 24 M220 52 L242 29',null,1.4);
    for(let i=0;i<4;i++)for(let j=0;j<2;j++)brush('M'+(114+i*10+j*4)+' '+(66+j*6-i*1.2)+'q5 3 7 -2',null,1.35);
  }
  g.fillStyle='#514939';g.beginPath();g.arc(turtle?204:184,turtle?40:53,2,0,2*PI);g.fill();
  g.fillStyle='#a15f48';g.fillRect(280,104,12,16);g.fillStyle='#e6d3af';g.font='bold 10px serif';g.fillText('海',281,116);
  const map=new THREE.CanvasTexture(tile);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({map});
}
export function dressRyugu(p) {
  const {x,z}=RYUGU, bed=terrainHeight(x,z), yaw=PI/2;
  const pearl=new THREE.MeshLambertMaterial({emissive:'#7e995f',emissiveIntensity:.45});
  const point=(u,h,v)=>new THREE.Vector3(x+v,bed+h,z-u);
  function put(shape,u,h,v,w,t,d,color,mat=p.solid,angle=0,pitch=0,roll=0) {
    p.part(shape,x+v,bed+h,z-u,w,t,d,color,yaw+angle,pitch,roll,mat,false);
  }
  const bar=(a,b,r,tint,mat=p.solid)=>p.link(point(...a),point(...b),r,tint,false,false,false,mat);
  const stone=(u,h,v,w,t,d)=>put('box',u,h,v,w,t,d,'#9bada1',p.masonry);
  function roof(u,h,v,w,d,rise,crown) {
    const shape=crown?'pagodaCrown':'pagodaRoof';
    put(shape,u,h-.19,v,w,rise,d,ink);
    put(shape,u,h+.015,v,w*.995,rise,d*.995,jade,p.roofs);
    for(const end of [-1,1]) for(const side of [-1,1]) {
      // Curled gilt corner spines rise from the green seigaiha roof tiles.
      let previous;
      for(let j=0;j<=5;j++) {
        const t=j/5,r=(crown?.026:.255)+(crown?.474:.245)*t;
        const q=[u+w*r*end,h+.12+rise*((1-t)**1.59+.17*t**1.7),v+d*r*side];
        if(previous)bar(previous,q,.065,gilding);
        previous=q;
      }
      put('finial',previous[0],previous[1]-.03,previous[2],.22,.52,.22,gilding);
    }
  }
  function balustrade(u,v,length,sideways,base=.84) {
    const place=(l,h,shape,w,t,d,color)=>put(shape,u+(sideways?0:l),base+h,v+(sideways?l:0),w,t,d,color,p.lacquer,sideways?PI/2:0);
    place(0,.68,'box',length,.12,.13,gilding);place(0,.32,'box',length,.13,.09,vermilion);
    const posts=Math.ceil(length/1.4);
    for(let i=0;i<=posts;i++) {
      const pos=length*(i/posts-.5);place(pos,.39,'box',.13,.8,.13,vermilion);
      place(pos,.85,'ball',.097,.11,.097,gilding);
    }
  }
  function hall({u,v,w,d,tiers}) {
    stone(u,.32,v,w+.78,.64,d+.82);put('box',u,.73,v,w+.94,.22,d+1,'#bfbba1');
    for(let i=0;i<3;i++) stone(u,.1+i*.1,v+d/2+1.42-i*.4,w*.38,.2+i*.2,.52);
    put('box',u,2.56,v,w*.74,3.53,d*.72,shell);
    for(const side of [-1,1]) {
      for(let j=0;j<5;j++) {
        const xx=u+(j/4-.5)*w*.89;
        put('round',xx,2.62,v+side*d*.47,.195,3.65,.195,vermilion,p.lacquer);
        put('round',xx,1,v+side*d*.47,.25,.25,.25,gilding);
        for(let i=0;i<2;i++)put('box',xx,4.14+i*.21,v+side*d*.47,.58+i*.30,.19,.56+i*.18,i?vermilion:gilding);
      }
      for(let j=-4;j<=4;j++) {
        put('box',u+j*w*.081,2.5,v+side*(d*.36+.05),.105,3.45,.11,cinnabar);
      }
      for(const height of [1.14,1.92,3.12,3.88])put('box',u,height,v+side*(d*.36+.07),w*.75,.09,.1,vermilion);
      balustrade(u+side*w*.33,v+d*.5,w*.32,false);
      balustrade(u+side*w*.5,v,d,true);
    }
    let eave=4.5;
    for(let i=0;i<tiers;i++) {
      const k=.75**i,rise=2.1*k;
      put('box',u,eave-.14,v,w*k,.26,d*k,vermilion);
      roof(u,eave,v,(w+3.2)*k,(d+3)*k,rise,i===tiers-1);
      if(i<tiers-1) {
        put('box',u,eave+rise+.16*k,v,w*.57*k,1.18*k,d*.57*k,shell);
        for(const sign of [-1,1])for(let j=-2;j<=2;j++)put('box',u+j*w*.125*k,eave+rise+.17*k,v+sign*d*.286*k,.11,1.1*k,.1,vermilion);
      } else {
        put('finial',u,eave+rise-.1,v,.45,1.22,.45,gilding);
        put('ball',u,eave+rise+1.25,v,.22,.22,.22,'#ebdec1',pearl);
      }
      eave+=2.75*k;
    }
  }
  HALLS.forEach(hall);
  p.shapes.tideGate=tideGate();
  put('tideGate',0,0,GATE_V,1,1,1,shell);
  for(const sign of [-1,1]){
    stone(sign*4.5,.27,GATE_V,3.75,.54,3.65);
    for (const edge of [-1,1]) put('round',sign*6.03,2.75,GATE_V+edge*1.71,.24,5.5,.24,vermilion,p.lacquer);
    put('plane',sign*4.50,1.42,GATE_V+1.666,2.96,1.39,1,'#ffffff',gateRelief(sign<0));
    put('round',sign*4.65,3.2,GATE_V+1.70,.64,.08,.64,jade,p.solid,0,PI/2);
    for(let j=0;j<3;j++)put('box',sign*4.65+(j-1)*.31,3.2,GATE_V+1.8,.068,1.08,.10,gilding);
  }
  roof(0,5.32,GATE_V,15.4,6.5,1.64,false);
  put('box',0,7.17,GATE_V,8.7,2.07,3,cinnabar);
  for(const sign of [-1,1])for (let i=-6;i<=6;i++)put('box',i*.64,7.39,GATE_V+sign*1.52,.40,1.03,.1,shell);
  roof(0,8.19,GATE_V,11.4,5.7,2,true);
  put('plane',0,7.37,GATE_V+1.61,3.55,1.28,1,'#ffffff',courtPlaque());
  // Covered galleries link the twin pavilions to the audience hall.
  for(const sign of [-1,1]) {
    const u=sign*10.3;
    stone(u,.24,-11.2,7.1,.48,2.7);
    for(const side of [-1,1])for(const dx of [-2.8,0,2.8])put('round',u+dx,1.62,-11.2+side,.14,2.9,.14,vermilion);
    put('roof',u,3.02,-11.2,8.3,1.29,3.7,jade,p.roofs);
  }
  for(let i=0;i<9;i++)for(const s of [-1,1]) {
    const v=-7.4+i*3.1;
    if(i%2===0){
      put('shaft',s*3.5,0,v,.48,1.14,.48,'#798f83',p.stone);
      put('ball',s*3.5,1.4,v,.32,.29,.32,'#efe2bb',pearl);
      put('kasa',s*3.5,1.63,v,.45,.27,.45,jade);
    }
    stone(s*(.71+.11*sin(i)),.047,v,1.25,.12,1.7);
  }
  // Cedar floats on a braided mooring mark the passage from the coast. Travellers
  // can follow them above water before taking the pearl-lit path below.
  const flagCanvas=document.createElement('canvas');flagCanvas.width=96;flagCanvas.height=192;
  const flagInk=flagCanvas.getContext('2d');
  flagInk.fillStyle='#ded2aa';flagInk.fillRect(0,0,96,192);
  flagInk.fillStyle='#914836';flagInk.fillRect(3,3,90,5);
  flagInk.fillStyle='#414a44';flagInk.textAlign='center';flagInk.font='bold 58px "Yu Mincho",serif';
  flagInk.fillText('竜',48,70);flagInk.fillText('宮',48,131);flagInk.font='37px serif';flagInk.fillText('↓',48,177);
  const cloth=new THREE.CanvasTexture(flagCanvas);cloth.colorSpace=THREE.SRGBColorSpace;
  const flag=new THREE.MeshLambertMaterial({map:cloth,side:THREE.DoubleSide});
  for(const offset of [104,59,16]) {
    const xx=x+offset, zz=z-4, surface=WATER_Y-bed;
    for(let j=-1;j<=1;j++)put('round',4+j*.35,surface+.025,offset,.24,1.82,.24,'#927858',p.wood,0,PI/2);
    for(const length of [-.55,.55])put('box',4,surface+.23,offset+length,1.34,.11,.16,'#8c704a',p.wood);
    put('round',4.39,surface+1.31,offset,.066,2.48,.066,'#725d41',p.wood);
    put('box',4.04,surface+2.42,offset,.92,.07,.07,'#6e614c',p.wood);
    put('plane',4,surface+1.77,offset,.72,1.26,1,'#fff',flag);
    const mooring=terrainHeight(xx,zz)-bed;
    bar([4,surface-.10,offset],[5.18,mooring+.18,offset+1],.033,'#80775b');
  }
  // The approach starts on the shelf. Pearl lamps lead the swimmer west and down.
  for(let i=0;i<8;i++) {
    const v=25+i*9, sx=x+v,sz=z+3.5*sin(i*.64);
    const base=terrainHeight(sx,sz),height=1.05+.48*sin(i*1.74);
    p.part('rock',sx,base+.31,sz,1.25,.62,.86,'#788e82');
    p.part('shaft',sx,base+.41,sz,.36,height,.36,'#98a397');
    p.part('ball',sx,base+height+.63,sz,.30,.30,.30,'#f6e4af',0,0,0,pearl,false);
  }
  const rng=seeded(74852),coral=['#be7464','#c8493d','#dba083','#aa818e'];
  for(let i=0;i<94;i++){
    const a=rng()*PI*2,r=21+rng()*50,u=r*cos(a),v=r*sin(a);
    if(Math.abs(u)<4 && v>0)continue;
    const base=terrainHeight(x+v,z-u)-bed;
    if(i%3) {
      for(let j=0;j<3;j++)put('leaf',u+rng()-.5,base,v+rng()-.5,1+rng(),1+rng()*2.7,1+rng(),'#648d77',p.stems,rng()*PI);
      continue;
    }
    const tint=coral[i%4],size=.7+rng()*1.3,turn=rng()*PI;
    const branch=(offset,h,bend)=>[u+cos(turn)*offset*size,base+h*size,v+sin(turn)*offset*size+bend];
    let stem=branch(0,0,0);
    for(let j=0;j<4;j++) {
      const next=branch(sin(j*.9)*.19,(j+1)*.52,0);
      bar(stem,next,size*(.15-j*.021),tint);
      for(const side of [-1,1]) {
        const tip=branch(side*(.39+rng()*.34),j*.52+.69,rng()*.24),finger=branch(side*(.47+rng()*.36),j*.52+1.05,0);
        bar(stem,tip,.073*size,tint);bar(tip,finger,.051*size,tint);
        const off=branch(side*.92,j*.52+.81,.10);bar(tip,off,.047*size,tint);
      }
      stem=next;
    }
  }
}

// A little sea bream drawn on both flanks. Cross-sections carry the pigment
// from the dark dorsal ridge, through vermilion scales, to a pale belly.
function seaBream() {
  const pos=[],color=[],ix=[];
  const vertex=(x,y,z,tint)=>{pos.push(x,y,z);const c=new THREE.Color(tint);color.push(c.r,c.g,c.b);return pos.length/3-1;};
  const sections=[[-.61,.08,.04],[-.40,.19,.09],[-.13,.33,.17],[.17,.32,.18],[.42,.22,.14],[.55,.045,.055]],sides=12;
  for(const [x,h,d] of sections)for(let j=0;j<sides;j++){
    const a=PI*2*j/sides;
    vertex(x,h*cos(a),d*sin(a),cos(a)>.73?'#954e47':cos(a)<-.27?'#f0d4af':'#da8777');
  }
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<sides;j++){
    const a=i*sides+j,b=i*sides+(j+1)%sides;ix.push(a,b,a+sides,b,b+sides,a+sides);
  }
  function fin(a,b,c,t='#ac675b') {ix.push(vertex(...a,t),vertex(...b,t),vertex(...c,t));}
  fin([-.57,.045,0],[-.90,.30,0],[-.81,.015,0]);fin([-.57,.06,0],[-.81,.02,0],[-.57,-.065,0]);
  fin([-.57,-.065,0],[-.81,.02,0],[-.89,-.26,0]);
  for(let i=0;i<6;i++)fin([-.38+i*.096,.16+.13*sin((i+1)*.43),0],[-.39+i*.095,.28+.12*sin((i+1)*.43),0],[-.28+i*.093,.22+.11*sin((i+1)*.43),0]);
  for(const s of [-1,1]) {
    fin([.15,-.01,s*.16],[-.15,-.13,s*.32],[-.025,-.17,s*.265],'#c88e75');
    for(const [cx,cy,r,tint] of [[.345,.065,.060,'#e6d7a6'],[.355,.067,.041,'#342f29'],[.366,.083,.014,'#fbf1c9']]){
      for(let j=0;j<8;j++) { const a=j*PI/4,b=(j+1)*PI/4;
        const z=s*(.164+(tint==='#342f29'?.003:tint==='#fbf1c9'?.006:0));
        fin([cx,cy,z],[cx+r*cos(a),cy+r*sin(a),z],[cx+r*cos(b),cy+r*sin(b),z],tint);
      }
    }
    for(let i=0;i<3;i++)for(let j=0;j<2;j++) {
      const x=-.22+i*.13+j*.023,y=.002+j*.10,z=s*(.17-.009*j);
      fin([x,y,z],[x+.042,y+.027,z],[x+.016,y+.02,z],'#ecd6ac');
    }
  }
  const geo=new THREE.BufferGeometry();geo.setIndex(ix);geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geo.computeVertexNormals();return geo;
}
function bubbleTexture() {
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
  g.strokeStyle='rgba(203,234,218,.68)';g.lineWidth=2;g.beginPath();g.arc(24,24,16,0,2*PI);g.stroke();
  g.strokeStyle='rgba(249,249,224,.95)';g.lineWidth=3;g.beginPath();g.arc(24,24,13,-2.62,-1.67);g.stroke();
  return new THREE.CanvasTexture(c);
}
function tideLight(bed,clock) {
  const grid=new THREE.PlaneGeometry(94,94,40,40);
  grid.rotateX(-PI/2);
  const pos=grid.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setY(i,terrainHeight(RYUGU.x+pos.getX(i),RYUGU.z+pos.getZ(i))-bed+.075);
  grid.computeBoundingSphere();
  // A projected moving net of light keeps its scale as it crosses the sloping shelf.
  return new THREE.Mesh(grid,new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{clock},
    vertexShader:`varying vec2 shore; void main(){shore=position.xz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 shore;uniform float clock;
      void main(){
        vec2 p=shore*1.22;float t=clock*.65;
        p+=.48*vec2(sin(p.y*.83+t),cos(p.x*.79-t));
        float a=sin(p.x+.67*sin(p.y+t*.60)),b=cos(p.y+.72*sin(p.x-t*.46));
        float crescent=abs(a+b*.74+.22*sin(p.x*1.6+p.y*1.2-t));
        float light=(1.-smoothstep(.04,.17+fwidth(crescent),crescent));
        float f=(1.-smoothstep(28.,45.,length(shore)))*(.45+.28*sin(p.y*.61+p.x*.43+t));
        gl_FragColor=vec4(.31,.68,.49,light*f*.31);
        #include <colorspace_fragment>
      }`,
  }));
}
export function createRyuguLife(scene) {
  const rng=seeded(16251),group=new THREE.Group(),dum=new THREE.Object3D();
  const fish=new THREE.InstancedMesh(seaBream(),new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),54);
  fish.frustumCulled=false;fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(fish);
  const schools=[[-4,-5,8.5,13],[8,8,7,7],[-9,2,12,17],[17,-8,5.6,8],[28,0,10.5,7],[39,5,4,8]];
  const shoal=Array.from({length:fish.count},(_,i)=>({ home:schools[i%schools.length],offset:rng()*3,
    depth:rng()*2.5,phase:rng()*PI*2,size:.55+rng()*.57 }));
  const count=95,bubbles=new Float32Array(3*count),buff=new THREE.BufferAttribute(bubbles,3).setUsage(THREE.DynamicDrawUsage);
  const streams=Array.from({length:count},(_,i)=>({x:(i%13-6)*3.8,z:sin(i%13*7.5)*16,phase:rng(),pace:.044+rng()*.042}));
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',buff);
  const points=new THREE.Points(geometry,new THREE.PointsMaterial({map:bubbleTexture(),size:.19,transparent:true,opacity:.78,depthWrite:false}));
  points.frustumCulled=false;group.add(points);
  const clock={value:0},bed=terrainHeight(RYUGU.x,RYUGU.z);
  group.add(tideLight(bed,clock));
  const lightwash=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec3 N,V; varying float rise;
      void main(){rise=position.y+.5;
        vec4 view=modelViewMatrix*instanceMatrix*vec4(position,1.);
        N=normalMatrix*mat3(instanceMatrix)*normal; V=-view.xyz;
        gl_Position=projectionMatrix*view;}`,
    fragmentShader:`varying vec3 N,V; varying float rise;
      void main(){float veil=pow(max(dot(normalize(N),normalize(V)),0.),2.);
        float taper=smoothstep(0.,.24,rise)*(1.-smoothstep(.79,1.,rise));
        gl_FragColor=vec4(.36,.68,.52,veil*taper*.071);
        #include <colorspace_fragment>
      }`,
  });
  const shafts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.50,1,1,10,1,true),lightwash,12);
  for(let i=0;i<shafts.count;i++) {
    const xx=10*sin(i*1.53)+i*2-10,zz=cos(i*1.31)*16;
    dum.position.set(xx,14,zz);dum.rotation.set(.077,0,.16);dum.scale.set(1.3+rng()*2.2,30,.7+rng());dum.updateMatrix();shafts.setMatrixAt(i,dum.matrix);
  }
  group.add(shafts);scene.add(group);
  const waterFog=new THREE.Color('#477e80');
  return (time,player,camera)=>{
    const immersion=player.diveDepth>0 ? THREE.MathUtils.smoothstep(WATER_Y-camera.position.y,0,3.2):0;
    if(immersion>0) {
      scene.fog.color.lerp(waterFog,immersion);
      scene.fog.density=THREE.MathUtils.lerp(scene.fog.density,.028,immersion);
      scene.environmentIntensity*=1-.23*immersion;
    }
    const dx=wrapDelta(RYUGU.x-player.x),dz=wrapDelta(RYUGU.z-player.z);
    group.visible=immersion>0 && dx*dx+dz*dz<110**2;
    if(!group.visible)return;
    clock.value=time;
    group.position.set(player.x+dx,bed,player.z+dz);
    shoal.forEach(({home,offset,depth,phase,size},i)=>{
      const [x,z,y,r]=home,a=time*.13+phase*.12+offset*.1+x*.3;
      dum.position.set(x+cos(a)*r+cos(phase)*offset,y+depth+.48*sin(a+phase),z+sin(a)*r*.65+sin(phase)*offset);
      dum.rotation.set(0,Math.atan2(-cos(a)*.65,-sin(a))+.065*sin(time*5+phase),.065*sin(time*1.4+phase));
      dum.scale.setScalar(size);dum.updateMatrix();fish.setMatrixAt(i,dum.matrix);
    });fish.instanceMatrix.needsUpdate=true;
    streams.forEach(({x,z,phase,pace},i)=>{
      const t=(time*pace+phase)%1;
      buff.setXYZ(i,x+sin(t*13+phase)*.35+t*1.5,.55+t*(-bed-.65),z+.43*cos(t*8+phase*4));
    });buff.needsUpdate=true;
  };
}
