import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { paintScrollAnimal } from './craftwork.js';
import { LAKE_HOKORA, isletPoint } from './snow-country.js';
import { HOKORA_BASE, HOKORA_TREADS, HOKORA_ROOM, HOKORA_PINE, HOKORA_LANTERN, HOKORA_EAVES,
  hokoraRoofPoint, fromHokora } from './lake-hokora-layout.js';
import { seeded, terrainMeshHeight } from './terrain.js';

const {sin,cos,PI}=Math,tau=2*PI;
const timber='#875c43',oldRed='#a25940',endgrain='#b79b74',soot='#514a3e',brass='#b09a61';
const v=(p)=>new T.Vector3(...p);
function beam(s,a,b,w,h,tint){
  const delta=v(b).sub(v(a)),center=v(a).lerp(v(b),.5);
  const rotation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()),'YXZ');
  s.box(tint,...center.toArray(),w,delta.length(),h,rotation.x,rotation.y,rotation.z);
}
function surface(s,tint,nx,ny,point,flip=false){
  const points=[],faces=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    points.push(...point(i/nx,j/ny));
    if(j<ny && i<nx){
      const a=j*(nx+1)+i,b=a+nx+1;
      if(flip)faces.push(a,b,a+1,a+1,b,b+1);
      else faces.push(a,a+1,b,a+1,b+1,b);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(faces);
  g.computeVertexNormals();s.add(g,tint);g.dispose();
}
function sheet(s,pigment,pts){
  surface(s,pigment,1,1,(u,v)=>pts[0].map((_,i)=>(1-v)*((1-u)*pts[0][i]+u*pts[1][i])+v*((1-u)*pts[2][i]+u*pts[3][i])));
}
function layer(s,x,z,width,depth,base,top,tint,bevel=.055){
  const points=[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]],lip=1-2*bevel/width,shoulder=1-2*bevel/depth;
  for(let j=0;j<4;j++){
    const a=points[j],b=points[(j+1)%4];
    const p=(corner,height,cap)=>[x+corner[0]*width*(cap?lip:1),height,z+corner[1]*depth*(cap?shoulder:1)];
    sheet(s,tint,[p(a,base,false),p(b,base,false),p(a,top-bevel,false),p(b,top-bevel,false)]);
    sheet(s,tint,[p(a,top-bevel,false),p(b,top-bevel,false),p(a,top,true),p(b,top,true)]);
  }
  sheet(s,tint,[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>[x+a*width*lip/2,top,z+b*depth*shoulder/2]));
}
function foundation(stone){
  const palette=['#8e8d7b','#9c9a87','#a7a38d','#979a86'];
  const cut=(x,z,w,d,y,top,i)=>layer(stone,x,z,w,d,y,top,palette[i%4],.030);
  const base=HOKORA_BASE;
  // Through-stones on the corners, with staggered mortar joints on each face.
  layer(stone,0,0,base.width-.06,base.depth-.06,-.24,.465,'#797c70');
  for(let row=0;row<2;row++){
    const low=row*.221-.015,high=low+.213;
    for(const side of [-1,1]){
      for(let i=0;i<6;i++){
        const edge=k=>k===0?-1.98:k===6?1.98:-1.98+3.96*k/6+(row?.14:0);
        cut((edge(i)+edge(i+1))/2,side*1.414,edge(i+1)-edge(i)-.012,.20,low,high,i+row+(side+1));
      }
      for(let i=0;i<4;i++)cut(side*1.884,-.99+.66*i,.19,.65,low,high,i+row*2);
    }
  }
  layer(stone,0,0,base.width,base.depth,.434,base.top,'#aaa58f',.04);
  for(const [i,s] of HOKORA_TREADS.entries()){
    cut(0,s.z,s.width,s.depth,-.20,s.top,2-i);
    for(let j=0;j<3;j++){
      const x=(-.62+j*.59)+i*.018;
      const z=s.z+s.depth*.34;
      stone.stroke('#757868',[[x,s.top+.002,z],[x+.05,s.top+.003,z-.05],[x+.19,s.top+.003,z-.065]],
        [.002,.007,.001],4);
    }
  }
}
function sanctuary(wood){
  const r=HOKORA_ROOM,front=r.z+r.depth/2,back=r.z-r.depth/2;
  wood.box('#554638',0,1.64,r.z,r.width-.06,2.17,r.depth-.035);
  // A narrow rim of worn cedar shows outside the closed sanctuary.
  for(const y of [.64,.86,1.02,2.48,2.65]){
    wood.box(y<1.1?timber:oldRed,0,y,r.z,2.04,y===.86?.14:.11,1.53);
  }
  for(const side of [-1,1]){
    for(const z of [back,front]){
      wood.box(oldRed,side*.91,1.59,z,.145,1.99,.14);
      wood.box(endgrain,side*.91,2.34,z,.170,.065,.168);
    }
    for(let j=0;j<8;j++)wood.box(j%3?'#a17954':'#95744f',side*.922,1.73,back+.115+j*.157,.052,1.30,.148);
    for(const y of [1.13,1.72,2.34])wood.box(timber,side*.953,y,r.z,.075,.080,1.32);
    for(let i=0;i<3;i++)wood.box(soot,side*.982,1.71,back+.15+.47*i,.022,.036,.045);
    wood.box(timber,side*.856,1.68,front+.048,.105,1.94,.154);
  }
  for(let j=0;j<10;j++)wood.box(j%3?'#997655':'#8c684d',-.78+.174*j,1.72,back-.012,.169,1.42,.065);
  for(const side of [-1,1]){
    const x=side*.387;
    wood.box('#534d40',x,1.72,front+.020,.735,1.34,.065);
    wood.box('#b18b61',x,1.37,front+.073,.64,.49,.024);
    for(const dy of [1.10,1.61,2.335])wood.box(timber,x,dy,front+.097,.737,.075,.065);
    for(const dx of [-.33,.33])wood.box(timber,x+dx,1.72,front+.100,.064,1.28,.063);
    // Deep lattice openings above the recessed kickboards. Individual slats
    // cast little shadows on the almost-black inner chamber.
    for(let j=-2;j<=2;j++)wood.box('#ac865d',x+j*.111,1.97,front+.088,.031,.655,.043);
    for(let j=0;j<3;j++)wood.box('#9e7756',x,1.758+j*.198,front+.089,.635,.027,.048);
    for(const y of [1.28,2.14])wood.box('#736346',side*.704,y,front+.132,.19,.037,.021);
    const pin=x-side*.22;
    wood.ball('#787256',pin,1.57,front+.150,.047,.047,.018);
    const ring=new T.TorusGeometry(.047,.009,6,17);
    wood.add(ring,brass,pin,1.536,front+.167);ring.dispose();
  }
  wood.box(timber,0,2.49,front+.070,1.62,.18,.075);
  // Slender brackets and exposed rafter tails, including their cut end grain.
  for(const x of [-1.04,1.04]){
    wood.box(oldRed,x,1.53,1.14,.13,1.98,.13);
    wood.box('#857d69',x,.616,1.14,.199,.15,.205);
    for(const [y,w,d] of [[2.365,.27,.23],[2.45,.38,.25],[2.52,.48,.24]])
      wood.box(y===2.45?endgrain:timber,x,y,1.14,w,.085,d);
    beam(wood,[x,2.22,1.14],[x,2.57,.73],.076,.094,'#9c7350');
  }
  wood.box(timber,0,2.56,1.14,2.74,.105,.145);
  wood.box('#96613f',0,2.30,.355,1.99,.12,.14);
  // A low shelf and two white offering dishes at the sill.
  wood.box('#986f4b',0,1.02,front+.184,1.36,.065,.40);
  for(const side of [-1,1]){
    const x=side*.49,z=front+.21;
    wood.post('#d5c8a6',x,1.067,z,.099,.027,.099);
    wood.post('#e6d6b2',x,1.087,z,.124,.017,.124);
    wood.ball(side<0?'#ccb57d':'#b5a17b',x,1.119,z,.053,.035,.051);
  }
}
function roof(roofing,wood){
  const e=HOKORA_EAVES,colors=['#595b50','#626359','#646459','#606157'];
  for(const side of [-1,1]){
    const at=(u,t,drop=0)=>{const q=hokoraRoofPoint(side,u,t);q[1]-=drop;return q;};
    // Each course of layered hinoki bark has a dark cut edge. The courses
    // widen towards the eave and return around its gently lifted corners.
    for(let j=0;j<22;j++){
      const t0=j/22,t1=(j+1)/22;
      surface(roofing,colors[(j*7+(side+1))%4],14,2,(u,k)=>at(u*2-1,t0+(t1-t0)*k,.007*k),side===1);
      surface(roofing,'#555447',14,1,(u,k)=>at(u*2-1,t1,.005+k*.016),side===1);
    }
    surface(wood,'#79674f',12,8,(u,t)=>at(u*2-1,t,e.skin),side===-1);
    for(const u of [-1,1]){
      surface(wood,'#8f7056',14,1,(t,d)=>at(u,t,e.skin*d));
      for(const depth of [.027,.102]){
        const path=Array.from({length:12},(_,i)=>at(u,i/11,depth));
        wood.stroke(depth<.05?'#b09a76':'#564d3d',path,path.map(()=>.009),18);
      }
      // Bargeboards retain the ridge-facing sweep all the way to their ends.
      const path=Array.from({length:12},(_,i)=>at(u*.982,i/11,.163));
      wood.stroke('#805a45',path,path.map((_,i)=>i===11?.029:.046),18);
    }
    for(const [drop,shade] of [[.025,'#aca287'],[.073,'#655847'],[.127,'#90745a']]){
      surface(wood,shade,16,1,(u,d)=>at(u*2-1,1,drop+d*.025));
    }
    for(let j=-6;j<=6;j++){
      const u=j/6*.95;
      const path=Array.from({length:6},(_,k)=>at(u,k/5,.157));
      for(let k=0;k<5;k++)beam(wood,path[k],path[k+1],.040,.067,'#876c50');
      wood.box(endgrain,...at(u,1,.160),.041,.053,.032);
    }
  }
  for(const sign of [-1,1]){
    const x=sign*1.03;
    // The weatherboarded gable closes the space between chamber and ridge.
    for(let i=0;i<11;i++){
      const z=-1.085+i*.139;
      const side=z>e.ridgeZ?1:-1,t=Math.abs(z-e.ridgeZ)/(side===1?e.front:e.rear);
      const top=hokoraRoofPoint(side,.72,t)[1]-.16;
      wood.box(i%3?'#9e7856':'#a8815d',x,(2.65+top)/2,z,.073,top-2.65,.136);
    }
    wood.box(timber,x,2.72,-.40,.12,.11,1.59);
    const forkX=sign*1.29;
    for(const side of [-1,1]){
      const tip=[forkX,4.33,e.ridgeZ+side*.38];
      const foot=[forkX,3.38,e.ridgeZ-side*.39];
      beam(wood,foot,tip,.076,.100,'#967153');
      const cap=v(foot).lerp(v(tip),.90).toArray();
      beam(wood,cap,tip,.081,.104,'#ac9766');
    }
  }
  wood.box('#554b3c',0,3.79,e.ridgeZ,2.96,.148,.212);
  wood.box('#9f8161',0,3.88,e.ridgeZ,2.99,.054,.218);
  for(const x of [-.78,0,.78]){
    wood.post('#977955',x,3.95,e.ridgeZ,.067,.56,.067,PI/2);
    for(const side of [-1,1])wood.post('#b4a06f',x,3.95,e.ridgeZ+side*.262,.069,.036,.069,PI/2);
  }
}
function sacredRope(fibres,papers){
  const ropePoint=(u,theta=0,radius=0)=>{
    const bulge=(1-u*u)**.65;
    return [u*1.12,2.39-.168*bulge+radius*cos(theta),1.212+radius*sin(theta)];
  };
  for(let strand=0;strand<3;strand++){
    const path=[],width=[];
    for(let j=0;j<=72;j++){
      const u=j/36-1,load=.61+.39*(1-u*u);
      path.push(ropePoint(u,j*tau/7.6+strand*tau/3,.027*load));width.push(.027*load);
    }
    fibres.stroke(['#c1a76c','#a98e5d','#d0b780'][strand],path,width,90);
  }
  for(const u of [-.76,-.26,.26,.76]){
    const [x,y,z]=ropePoint(u);
    // Each folded strip exposes its crease and then steps across to the next fold.
    for(let j=0;j<4;j++){
      const w=.065,dir=j%2?1:-1,ox=x+j*.022,oy=y-.024-j*.053,oz=z+.048+.006*j;
      sheet(papers,j%2?'#e4dec3':'#f0ead3',[
        [ox-w,oy,oz],[ox+w,oy,oz],[ox-w+.024*dir,oy-.063,oz+.015*dir],[ox+w+.024*dir,oy-.063,oz+.015*dir]]);
    }
  }
  for(const u of [-.98,-.49,0,.49,.98]){
    const [x,y,z]=ropePoint(u);
    for(let k=0;k<9;k++){
      const a=k*tau/9;
      fibres.stroke(k%3?'#c1aa77':'#ac915f',[[x,y-.021,z],[x+.019*cos(a),y-.075,z+.017*sin(a)],
        [x+.049*cos(a),y-.21-.035*cos(a*2),z+.045*sin(a)]],[.011,.013,.003],4);
    }
  }
}
function lantern(stone,wood){
  const {x,z}=HOKORA_LANTERN;
  // A squat yukimi-doro with a hollow firebox; the shore remains visible
  // between its legs and through the two broad windows.
  for(const side of [-1,1])for(const end of [-1,1]){
    const u=x+side*.206,v=z+end*.178;
    stone.stroke('#959583',[[u+side*.057,-.05,v+end*.042],[u,.115,v],[u-side*.042,.29,v-end*.04]],
      [.090,.073,.090],6);
  }
  layer(stone,x,z,.69,.63,.245,.37,'#9d9d88',.05);
  layer(stone,x,z,.57,.51,.345,.43,'#999a87',.025);
  for(const side of [-1,1])for(const end of [-1,1])
    stone.box('#8c8f7f',x+side*.203,.611,z+end*.170,.078,.396,.073);
  wood.post('#9e784c',x,.471,z,.090,.086,.091);
  wood.ball('#dfc996',x,.535,z,.031,.072,.034);
  const parasol=new T.LatheGeometry([[.025,.73],[.351,.73],[.463,.784],[.429,.815],
    [.306,.849],[.204,.903],[.12,.965],[.069,.984]].map(([x,y])=>new T.Vector2(x,y)),8);
  stone.add(parasol,'#989c89',x,0,z);parasol.dispose();
  stone.post('#888c79',x,1.012,z,.072,.086,.072);
  stone.ball('#929780',x,1.103,z,.083,.084,.083);
  stone.ball('#9fa18c',x,1.171,z,.034,.037,.034);
}
function lowPine(wood,earth){
  const positions=[],normals=[],uv=[],indices=[],colors=[],tint=new T.Color();
  const p=HOKORA_PINE,[x,z]=fromHokora(p.x,p.z),base=terrainMeshHeight(x,z)-LAKE_HOKORA.y;
  const pt=(u,y,v)=>[p.x+u,base+y,p.z+v];
  const stroke=(nodes,r,tint)=>wood.stroke(tint,nodes.map(p=>pt(...p)),r,16);
  const trunk=[[0,-.077,0],[.037,.42,.028],[-.19,1.04,.039],[-.48,1.36,.12],
    [-.28,1.62,.12],[-.43,1.96,.066],[-.24,2.32,.02],[-.52,2.49,.1]];
  stroke(trunk,[.25,.20,.15,.13,.107,.082,.056,.027],'#665e4c');
  for(let j=0;j<4;j++){
    const a=j*1.64;
    stroke([[.12*cos(a),.26,.12*sin(a)],[.23*cos(a),.14,.23*sin(a)],[.59*cos(a),-.025,.62*sin(a)]],
      [.072,.085,.016],'#736851');
  }
  for(const [dx,y,dz,spread] of [[-1.51,1.36,.23,1.10],[.60,1.55,.43,.68],
    [-.99,1.98,-.53,.96],[.52,2.12,-.29,.78],[-.47,2.62,.11,.79]]){
    stroke([[-.29,y*.62,.06],[dx*.45,y-.10,dz*.44],[dx*.77,y-.21,dz*.77],[dx,y,dz]],
      [.088,.075,.041,.013],'#6d6652');
    // Fold each needle-bearing branch along its spine. The same inked
    // sprays as the wild pines keep these wind-pruned tiers porous up close.
    for(let j=0;j<8;j++){
      const a=j*2.4+dx,r=spread*Math.sqrt(j/8),phase=j*.91+dz;
      const [cx,cy,cz]=pt(dx+cos(a)*r*.58,y+.047*sin(phase),dz+sin(a)*r*.37);
      const w=spread*(.62+.095*cos(j))*1.38,h=w*(.32+.08*sin(j*.74));
      const start=positions.length/3,nx=-sin(a),nz=cos(a);
      for(let k=0;k<2;k++)for(let u=0;u<3;u++){
        const x=(u-1)*w*.5,fold=u===1?.102*w:0,up=k-.5;
        positions.push(cx+cos(a)*x+nx*(fold+up*h*.28),cy+up*h+(u===1?.068:-.014)*h,cz+sin(a)*x+nz*(fold+up*h*.28));
        normals.push(nx*.21,.977,nz*.21);uv.push(u*.5,k);
        tint.set(j%3?'#e1e6d4':'#cfdbc8').multiplyScalar(.88+.12*k);colors.push(tint.r,tint.g,tint.b);
      }
      for(const n of [0,1,3,3,1,4,1,2,4,4,2,5])indices.push(start+n);
    }
  }
  // A few flat moss-covered stones beside the exposed roots.
  for(let j=0;j<4;j++){
    const u=-3.5-.36*j,v=-.76+.11*sin(j*2),[x,z]=fromHokora(u,v),y=terrainMeshHeight(x,z)-LAKE_HOKORA.y;
    earth.ball('#919282',u,y-.025,v,.29,.14,.25,0,j,0);
    earth.ball('#929a74',u-.02,y+.07,v+.018,.21,.065,.18,0,j,0);
  }
  const g=new T.BufferGeometry();
  for(const [key,data,size] of [['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uv,2]])
    g.setAttribute(key,new T.Float32BufferAttribute(data,size));
  g.setIndex(indices);g.computeBoundingSphere();
  const map=new T.TextureLoader().load(new URL('./assets/world/pine.webp',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const crown=new T.Mesh(g,new T.MeshLambertMaterial({map,alphaTest:.29,side:T.DoubleSide,vertexColors:true,emissiveMap:map,emissive:0xe2e3cb,emissiveIntensity:.28}));
  crown.name='島松の葉叢';crown.castShadow=crown.receiveShadow=true;return crown;
}
function shoreStones(stone){
  const rng=seeded(431227), {x,z,y,yaw}=LAKE_HOKORA;
  const rock=new T.IcosahedronGeometry(1,0);
  for(const [angle,size] of [[2.78,.69],[3.04,.38],[3.77,.52],[4.2,.29],[5.47,.54],[.16,.36]]){
    for(let j=0;j<4;j++){
      const [wx,wz]=isletPoint(angle+(rng()-.5)*.18,.96+(rng()-.5)*.16);
      const u=(wx-x)*cos(yaw)-(wz-z)*sin(yaw),w=(wx-x)*sin(yaw)+(wz-z)*cos(yaw);
      const r=size*(.55+.55*rng()),ty=terrainMeshHeight(wx,wz)-y-.025;
      stone.add(rock,j%2?'#888b7e':'#929489',u,ty,w,r,.36*r,r*(.73+.38*rng()),.13,rng()*PI,.10);
    }
  }
  rock.dispose();
}
function paintedDoorLeaves(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=136;
  const c=canvas.getContext('2d'),rng=seeded(70013);
  c.fillStyle='#a9875c';c.fillRect(0,0,512,136);
  for(let i=0;i<120;i++){
    const y=rng()*136;c.strokeStyle=i%4?'rgba(94,68,46,.16)':'rgba(217,191,147,.33)';
    c.beginPath();c.moveTo(0,y);c.bezierCurveTo(110,y-3,280,y+2,512,y+(rng()-.5)*3);c.stroke();
  }
  c.save();c.translate(48,-6);c.scale(1.60,1.58);paintScrollAnimal(c,true,'#4e4939');c.restore();
  c.save();c.translate(463,-9);c.scale(-1.62,1.59);paintScrollAnimal(c,false,'#514b38');c.restore();
  // The two facing silhouettes share the grain of a single horizontal board.
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const panels=new T.Group(),material=new T.MeshLambertMaterial({map});
  panels.name='向かい合う兎と蛙の絵板';
  for(const side of [-1,1]){
    const geometry=new T.PlaneGeometry(.606,.433),uv=geometry.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setX(j,.5*uv.getX(j)+(side>0?.5:0));
    const panel=new T.Mesh(geometry,material);
    panel.position.set(side*.387,1.37,HOKORA_ROOM.z+HOKORA_ROOM.depth/2+.086);
    panels.add(panel);
  }
  return panels;
}
function grainMaterial(texture,streak=1){
  const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  if(!texture)return material;
  material.onBeforeCompile=shader=>{
    shader.uniforms.hokoraGrain={value:texture};
    shader.vertexShader='varying vec3 localInkPoint, localInkNormal;\n'+shader.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>\nlocalInkPoint=position; localInkNormal=normal;');
    shader.fragmentShader='uniform sampler2D hokoraGrain;varying vec3 localInkPoint,localInkNormal;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 n=abs(normalize(localInkNormal));
        vec2 p=n.y>.68?localInkPoint.xz:n.x>n.z?localInkPoint.zy:localInkPoint.xy;
        float grain=dot(texture2D(hokoraGrain,p*vec2(${streak.toFixed(2)},1.04)).rgb, vec3(.23,.58,.19));
        diffuseColor.rgb*=.81+.59*sqrt(max(0.,grain));`);
  };
  material.customProgramCacheKey=()=>`lake-hokora-grain-${streak}`;return material;
}
function reflectedSilhouette(material){
  const ink=sculpture(),room=HOKORA_ROOM;
  ink.box('#5e5747',0,1.55,room.z,room.width,2.22,room.depth);
  for(const side of [-1,1]){
    surface(ink,'#525d53',8,7,(u,t)=>hokoraRoofPoint(side,u*2-1,t),side===1);
    ink.box('#7e6550',side*1.04,1.53,1.14,.13,1.98,.13);
    const x=side*1.29;
    for(const end of [-1,1])beam(ink,[x,3.59,-.5-end*.23],[x,4.33,-.5+end*.38],.076,.10,'#75634e');
  }
  for(const [x,y,z,r] of [[-1.51,1.36,.23,1.0],[.60,1.55,.43,.6],[-.99,1.98,-.53,.88],
    [.52,2.12,-.29,.69],[-.47,2.62,.11,.64]])
    ink.ball('#516355',HOKORA_PINE.x+x,y,HOKORA_PINE.z+z,r,.13,r*.55);
  const mesh=new T.Mesh(ink.finish(),material);
  mesh.frustumCulled=false;mesh.renderOrder=2;mesh.name='湖面の祠と松';return mesh;
}
export function buildLakeHokora(art={},mirror){
  const root=new T.Group();root.name='島の小祠';
  root.position.set(LAKE_HOKORA.x,LAKE_HOKORA.y,LAKE_HOKORA.z);
  root.rotation.y=LAKE_HOKORA.yaw;
  const wood=sculpture(),stone=sculpture(),roofing=sculpture(),fibres=sculpture(),papers=sculpture();
  foundation(stone);sanctuary(wood);roof(roofing,wood);sacredRope(fibres,papers);lantern(stone,wood);
  root.add(lowPine(wood,stone));shoreStones(stone);
  for(const [brush,material,name] of [[wood,grainMaterial(art.cedar,1.71),'木組と破風'],
    [roofing,grainMaterial(art.bark,1.31),'檜皮葺の流れ屋根'],[stone,grainMaterial(art.rock,.86),'石積と雪見灯籠'],
    [fibres,grainMaterial(),'撚り合わせた注連縄'],[papers,grainMaterial(),'紙垂']]){
    const mesh=new T.Mesh(brush.finish(),material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  }
  root.add(paintedDoorLeaves());
  if(mirror)root.add(reflectedSilhouette(mirror));
  return root;
}
