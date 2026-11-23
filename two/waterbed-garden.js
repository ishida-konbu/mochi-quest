import * as T from './vendor/three.module.min.js';
import { BOUND, WATER_Y, terrainContactHeight, riverZ, riverHalfWidth, mapleStreamZ, seeded } from './terrain.js';
import { lakeRadius } from './snow-country.js';
import { RYUGU } from './ryugu-layout.js';
import { mountainStreamWaterAt } from './mountain-streams.js';
import { waterbedForms } from './waterbed-forms.js';
import { waterbedLightGLSL, waterbedContacts } from './waterbed-pigment.js';

const size=16,cellsAcross=2*BOUND/size,tau=2*Math.PI;
const canonicalCell=i=>((i+cellsAcross/2)%cellsAcross+cellsAcross)%cellsAcross-cellsAcross/2;
const hard=new Set(['cobble','chert','slate','twig','scallop','mussels','urchin','leafDrift']);
const heights={cobble:.19,chert:.19,slate:.19,twig:.25,scallop:.11,mussels:.11,urchin:.20,
  grass:.61,pondweed:.85,kelp:1.39,sargassum:.75,leafDrift:.12};

function habitat(x,z,stream) {
  if(lakeRadius(x,z)<1.06)return 'lake';
  if(Number.isFinite(stream))return 'river';
  if(x> -251 && x<386 && Math.abs(z-riverZ(x))<riverHalfWidth(x)+6.4)return 'river';
  if(x>277 && x<395 && Math.abs(z-mapleStreamZ(x))<8.6)return 'river';
  return 'sea';
}

// Produce only a small parcel of the bottom. Every root is lowered onto the
// same triangle the swimmer touches, including the fine survey near falls.
export function waterbedParcel(ix,iz) {
  const rand=seeded((Math.imul(ix,73856093)^Math.imul(iz,19349663)^712381)>>>0);
  const records=[];
  function add(kind,x,z,scale,yaw,stretch,terrain,line){
    if(Math.abs(z-RYUGU.z)<20 && x>RYUGU.x-44 && x<RYUGU.x+22)return;
    terrain??=terrainContactHeight(x,z);
    line??=Math.max(WATER_Y,mountainStreamWaterAt(x,z));
    const depth=line-terrain;
    if(depth<.145)return;
    // Sample a short baseline to lay the hard fragments flat on the bed.
    const dx=hard.has(kind)?(terrainContactHeight(x+.22,z)-terrain)/.22:0;
    const dz=hard.has(kind)?(terrainContactHeight(x,z+.22)-terrain)/.22:0;
    const grade=Math.hypot(dx,dz);
    if(grade>.85)return;
    const sy=Math.min(scale*stretch,(depth-.072-grade*scale*.60)/heights[kind]);
    if(sy<scale*.30)return;
    records.push({kind,x,y:terrain-.012,z,scale,sy,yaw,dx,dz,line});
  }
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){
    const x=size*ix+4*(i+.06+.88*rand()),z=size*iz+4*(j+.06+.88*rand());
    const y=terrainContactHeight(x,z),stream=mountainStreamWaterAt(x,z),line=Math.max(WATER_Y,stream),depth=line-y;
    if(depth<.15)continue;
    const place=habitat(x,z,stream),lake=place==='lake',sea=place==='sea';
    // Ribbons of exposed gravel alternate with windows of open sediment.
    // Mussels and rooted plants recruit in colonies around the same bars.
    const wash=.48+.26*Math.sin(.147*x+.075*z+.9*Math.sin(.137*z))+
      .17*Math.cos(.247*z-.079*x)+.13*Math.sin(.37*x-.29*z);
    const bearing=place==='river'?-.29*Math.cos(x/43):.41+.26*Math.sin(z*.07);
    const ca=Math.cos(bearing),sa=Math.sin(bearing);
    if(wash>(lake?.44:sea?.49:.32) && rand()<.70){
      const count=3+Math.floor(rand()*(sea?5:8));
      const mother=(.72+.79*rand())*(sea?.92:1);
      for(let k=0;k<count;k++){
        const u=(rand()-.5)*3.12,v=(rand()-.5)*(lake?1.69:1.08);
        const xx=x+u*ca+v*sa,zz=z-u*sa+v*ca;
        const species=rand(),kind=species<.35?'slate':species<.58?'chert':'cobble';
        const scale=k===0?mother:mother*(.15+.52*rand());
        add(kind,xx,zz,scale,bearing+1.42*(rand()-.5),.68+.64*rand());
      }
    }
    function colony(kind,count,span,tall){
      const heading=rand()*tau,peak=tall*(.80+.62*rand());
      for(let k=0;k<count;k++){
        const a=k*2.40+heading+rand()*.58,r=k===0?0:span*(.35+.65*rand());
        const xx=x+r*Math.cos(a),zz=z+r*Math.sin(a)*.76;
        const scale=peak*(k===0?1:.37+.53*rand());
        const yaw=kind==='grass'?bearing+.42*(rand()-.5):a+.8*rand();
        add(kind,xx,zz,scale,yaw,.80+.30*rand(),k===0?y:undefined,k===0?line:undefined);
      }
    }
    if(sea){
      if(depth<22 && wash>.52 && rand()<.33){
        const brown=wash>.70 && depth<14;
        colony(brown?'sargassum':'kelp',3+Math.floor(3*rand()),1.23,brown?1.26:1.10);
      }
      else if(wash>.47 && rand()<.21)colony(wash>.67?'urchin':'mussels',2+Math.floor(3*rand()),.53,.84);
      else if(wash<.42 && rand()<.19)colony('scallop',2+Math.floor(4*rand()),.77,.97);
    }else if(lake){
      if(wash>.49 && rand()<.38)colony('pondweed',3+Math.floor(3*rand()),1.11,1.05);
      else if(wash<.46 && rand()<.19){
        add('twig',x,z,.91+rand()*.68,rand()*tau,.87,y,line);
        colony('leafDrift',2+Math.floor(3*rand()),.85,1.1);
      }
      else if(wash>.47 && rand()<.16)colony('mussels',3,.56,.76);
    }else{
      if(wash>.46 && rand()<.42)colony('grass',3+Math.floor(3*rand()),.94,1.24);
      else if(wash>.41 && rand()<.12)colony('mussels',2+Math.floor(3*rand()),.61,.77);
      else if(wash<.36 && rand()<.11)colony('leafDrift',3,.86,.92);
    }
  }
  return records;
}

function bedMaterial(clock,art) {
  const mat=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.bedTime=clock;
    shader.uniforms.mineralPrint={value:art.rock};
    shader.vertexShader=`
      attribute float bedFlex,bedWater,bedKind;
      uniform float bedTime;
      varying vec3 bedPoint,localNib; varying float lightDepth,study;
    `+shader.vertexShader.replace('#include <begin_vertex>',`
      vec3 root=instanceMatrix[3].xyz; localNib=position; study=bedKind;
      float wave=sin(.87*root.z+.37*root.x+bedTime*.83+1.6*position.y);
      float fold=sin(bedTime*1.31-1.74*root.x+3.4*position.y);
      vec3 offset=vec3(.108*wave+.038*fold,.013*fold,.056*wave-.026*fold)*bedFlex;
      // Close detail tapers away before the cell can leave the active window.
      float farEdge=mix(22.,29.,step(.5,study)*step(study,1.5));
      float atten=1.-smoothstep(farEdge-5.,farEdge,distance(cameraPosition,root));
      vec3 transformed=(position+offset)*atten;
      bedPoint=(instanceMatrix*vec4(transformed,1.)).xyz;
      bedPoint.xz=mod(bedPoint.xz+1600.,3200.)-1600.;
      lightDepth=max(0.,bedWater-bedPoint.y);
    `);
    shader.fragmentShader=`uniform float bedTime; uniform sampler2D mineralPrint; varying vec3 bedPoint,localNib; varying float lightDepth,study;
      ${waterbedLightGLSL}\n`+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      if(study<.5){
        // Grains and faults turn over the face. One discontinuous vein has a
        // light calcite lip and a darker edge displaced along the fracture.
        vec2 q=localNib.xz+localNib.y*vec2(.34,-.61);
        vec3 granite=texture2D(mineralPrint,q*1.95+bedPoint.xz*.012).rgb;
        float grain=dot(granite,vec3(.27,.58,.15));
        float crease=q.x*3.03-q.y*2.17+.41*sin(11.*q.y+bedPoint.x*.21)
                    +.13*sin(24.*q.y+9.*q.x)+.31*sin(bedPoint.z*.91);
        float width=max(.019,.70*fwidth(crease));
        float broken=smoothstep(.07,.46,grain+.21*sin(bedPoint.x*2.1+bedPoint.z*.71));
        float seam=(1.-smoothstep(.013,.013+width,abs(crease)))*broken;
        float shadow=(1.-smoothstep(.013,.013+width,abs(crease+.037)));
        float foot=smoothstep(-.012,.095,localNib.y);
        diffuseColor.rgb*= (.69+.53*grain)*(.73+.27*foot)*(1.-.18*shadow);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.62,.59,.45),seam*.67);
      }
      float light=bedLight(bedPoint,lightDepth,bedTime);
      diffuseColor.rgb*=1.+light*vec3(.67,.80,.63);
      diffuseColor.rgb+=light*vec3(.045,.058,.040);
    `);
  };
  return mat;
}

export function createWaterbedGarden(scene,clock,art={},contacts=waterbedContacts()) {
  const root=new T.Group();
  root.name='水底の石・貝・藻場';
  scene.add(root);
  const mat=bedMaterial(clock,art),forms=waterbedForms(),batches=new Map();
  let parcels=new Map(),previousX,previousY,previousZ;
  const transform=new T.Object3D(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),turn=new T.Quaternion();
  function writeBatch(kind,items){
    const old=batches.get(kind);
    if(!items?.length){if(old)old.mesh.visible=false;return;}
    let batch=old;
    if(!batch || batch.mesh.instanceMatrix.count<items.length){
      const capacity=2**Math.ceil(Math.log2(items.length));
      if(batch){
        batch.mesh.removeFromParent();batch.mesh.dispose();
        forms[kind].dispose();
      }
      const mesh=new T.InstancedMesh(forms[kind],mat,capacity);
      const levels=new T.InstancedBufferAttribute(new Float32Array(capacity),1);
      levels.setUsage(T.DynamicDrawUsage);
      forms[kind].setAttribute('bedWater',levels);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.receiveShadow=true;
      mesh.name=kind;
      batch={mesh,levels};batches.set(kind,batch);root.add(mesh);
    }
    const {mesh,levels}=batch;
    mesh.visible=true;mesh.count=items.length;
    for(let i=0;i<items.length;i++){
      const [p,offX,offZ]=items[i];
      transform.position.set(p.x+offX,p.y,p.z+offZ);
      normal.set(-p.dx,1,-p.dz).normalize();
      transform.quaternion.setFromUnitVectors(up,normal).multiply(turn.setFromAxisAngle(up,p.yaw));
      transform.scale.set(p.scale,p.sy,p.scale);
      transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);levels.setX(i,p.line);
    }
    mesh.computeBoundingSphere();
    mesh.boundingSphere.radius+=.4;
    mesh.instanceMatrix.needsUpdate=true;levels.needsUpdate=true;
  }
  return camera=>{
    const {x,y,z}=camera.position;
    const cx=Math.floor(x/size),cz=Math.floor(z/size);
    if(y>116){root.visible=false;previousY=undefined;return;}
    const vx=Math.floor(x/4),vy=Math.floor(y/4),vz=Math.floor(z/4);
    if(vx===previousX && vy===previousY && vz===previousZ)return;
    previousX=vx;previousY=vy;previousZ=vz;
    let visible=false;
    contacts.clear((cx-2)*size,(cz-2)*size);
    const next=new Map(),byKind={};
    for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){
      const gx=cx+i,gz=cz+j,ix=canonicalCell(gx),iz=canonicalCell(gz),key=ix*cellsAcross+iz;
      const sites=parcels.get(key)??waterbedParcel(ix,iz);
      next.set(key,sites);
      const offX=(gx-ix)*size,offZ=(gz-iz)*size;
      for(const site of sites){
        const dx=Math.max(0,Math.abs(site.x+offX-(vx+.5)*4)-2);
        const dy=Math.max(0,Math.abs(site.y-(vy+.5)*4)-3);
        const dz=Math.max(0,Math.abs(site.z+offZ-(vz+.5)*4)-2);
        const squared=dx*dx+dy*dy+dz*dz;
        const plant=!hard.has(site.kind),range=plant?29:22;
        if(squared>range*range)continue;
        contacts.impress(site,site.x+offX,site.z+offZ);
        visible=true;
        const distant=site.kind==='slate' || site.kind==='chert'?'cobble':site.kind;
        const form=squared<46?site.kind:distant+'Far';
        (byKind[form]??=[]).push([site,offX,offZ]);
      }
    }
    contacts.map.needsUpdate=true;
    root.visible=visible;
    parcels=next;
    for(const kind of Object.keys(forms))writeBatch(kind,byKind[kind]);
  };
}
