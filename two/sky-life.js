import * as T from './vendor/three.module.min.js';
import { BOUND, REGIONS, terrainHeight, WATER_Y, seeded, wrapDelta } from './terrain.js';
import { kirinFlight } from './bestiary.js';
import { kirinFrequency } from './animal-motion.js';
import { kirinTouchdowns } from './handscroll-beasts.js';

const TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));

function migratoryBird(swift) {
  const points=[],colors=[],motion=[];
  function facet(a,b,c,color) {
    const tint=new T.Color(color);
    for(const [x,y,z,wing=0] of [a,b,c]) {
      points.push(x,y,z);colors.push(tint.r,tint.g,tint.b);motion.push(wing);
    }
  }
  const ink=swift?'#444644':'#555148',belly=swift?'#bdb5a0':'#d0c5a9';
  for(const s of [-1,1]) {
    const nose=[0,.055,swift?.36:.62], keel=[0,-.07,-.04], back=[0,.08,-.11], flank=[s*.072,0,-.06];
    const rump=[0,0,-.35], tail=[s*(swift?.20:.12),.05,swift?-.60:-.42];
    facet(nose,flank,back,ink);facet(nose,keel,flank,belly);
    facet(back,flank,rump,ink);facet(rump,flank,keel,belly);facet(rump,flank,tail,ink);
    const elbow=[s*.34,.10,.02,s*.34],wrist=[s*.62,.17,swift?.06:.11,s*.62];
    const tip=[s*(swift?1.0:.96),.04,swift?-.30:-.09,s], base=[s*.08,0,-.23,s*.05];
    const fan=[s*.55,.105,-.24,s*.55],secondary=[s*.42,.04,-.31,s*.42];
    facet(flank,elbow,base,ink);facet(base,elbow,secondary,belly);
    facet(elbow,wrist,fan,swift?'#737469':'#958c76');facet(elbow,fan,secondary,ink);facet(wrist,tip,fan,ink);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('wingSpan',new T.Float32BufferAttribute(motion,1));
  geometry.computeVertexNormals();
  return geometry;
}

function flockFlights(scene) {
  const time={value:0}, material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.flockTime=time;
    shader.vertexShader='uniform float flockTime;attribute float wingSpan;attribute float wingBeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float w=abs(wingSpan);
      float phase=flockTime*(4.4+.8*sin(wingBeat))+wingBeat;
      float flutter=sin(phase-1.15*w)+.17*sin(2.*phase-.6);
      float glide=.24+.76*smoothstep(-.45,.8,sin(flockTime*.32+wingBeat*.37));
      transformed.y+=w*(.46*flutter*glide-.035);
      transformed.z+=.13*w*w*cos(phase-.5)*glide;
      transformed.x*=1.-.12*w*abs(flutter)*glide;
    `);
  };
  const random=seeded(0x5a09e88), flocks=[],counts=[0,0];
  for(let i=0;i<48;i++) {
    const village=REGIONS[i%REGIONS.length], angle=random()*TAU, r=16+random()*64;
    const x=i<30?village.x+Math.cos(angle)*r:2*BOUND*(random()-.5);
    const z=i<30?village.z+Math.sin(angle)*r:2*BOUND*(random()-.5);
    const kind=i%2, birds=[], members=6+Math.floor(random()*11);
    for(let j=0;j<members;j++){
      const arm=Math.ceil(j/2),side=j%2?1:-1;
      const line=i%3===0;
      birds.push({forward:(line?-j:-arm)*(1.5+random()*.65),
        side:(line?Math.sin(j*.65)*2:side*arm*(1.2+random()*.45))+random()*.7,
        rise:random()*1.3, beat:random()*TAU, scale:(kind?.71:.96)*(.80+random()*.34)});
    }
    counts[kind]+=members;
    flocks.push({x,z,y:Math.max(WATER_Y,terrainHeight(x,z))+45+random()*49,
      angle, radius:17+random()*28, cruise:.065+random()*.045, kind,birds});
  }
  const batches=counts.map((count,i)=>{
    const geo=migratoryBird(i===1), beat=new T.InstancedBufferAttribute(new Float32Array(count),1);
    beat.setUsage(T.DynamicDrawUsage);geo.setAttribute('wingBeat',beat);
    const mesh=new T.InstancedMesh(geo,material,count);
    mesh.name=i?'高空の燕の群れ':'渡り雁の雁行';
    mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);return mesh;
  });
  const dummy=new T.Object3D(); dummy.rotation.order='YXZ';
  return (t,camera)=>{
    time.value=t;
    for(const mesh of batches)mesh.count=0;
    for(const f of flocks) {
      const u=f.angle+t*f.cruise, cs=Math.cos(u),sn=Math.sin(u);
      const x=camera.position.x+wrapDelta(f.x+f.radius*sn-camera.position.x);
      const z=camera.position.z+wrapDelta(f.z+f.radius*.72*cs-camera.position.z);
      const distance=Math.hypot(x-camera.position.x,z-camera.position.z);
      if(distance>=240)continue;
      const coverage=1-T.MathUtils.smoothstep(distance,202,240);
      const heading=Math.atan2(cs,-sn*.72), dx=Math.sin(heading), dz=Math.cos(heading), mesh=batches[f.kind];
      for(const bird of f.birds) {
        const side=bird.side+.55*Math.sin(t*.49+bird.beat);
        const forward=bird.forward+.42*Math.cos(t*.36+bird.beat);
        dummy.position.set(x+dx*forward+dz*side,f.y+3.1*Math.sin(u*.65)+bird.rise+.27*Math.cos(t*.8+bird.beat),z+dz*forward-dx*side);
        dummy.rotation.set(.035*Math.cos(u*.65),heading+.047*Math.sin(t*.56+bird.beat),-.17+.07*Math.sin(t*.72+bird.beat),'YXZ');
        dummy.scale.setScalar(bird.scale*Math.sqrt(coverage));dummy.updateMatrix();
        mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.geometry.attributes.wingBeat.setX(mesh.count++,bird.beat);
      }
    }
    for(const mesh of batches){
      mesh.visible=mesh.count>0;
      if(!mesh.visible)continue;
      for(const a of [mesh.instanceMatrix,mesh.geometry.attributes.wingBeat]){
        a.clearUpdateRanges();a.addUpdateRange(0,mesh.count*a.itemSize);a.needsUpdate=true;
      }
    }
  };
}

function cloudBrush() {
  const paper=document.createElement('canvas');paper.width=512;paper.height=216;
  const g=paper.getContext('2d');
  const body=new Path2D('M19 129 C55 132 70 103 107 102 C114 83 137 70 167 80 C186 41 231 37 258 64 C273 40 314 43 329 66 C351 54 382 64 389 85 C415 76 435 85 442 103 C468 114 485 103 499 99 C491 123 467 139 437 137 C425 159 391 162 369 150 C344 177 307 166 289 155 C272 183 235 187 211 167 C182 185 147 177 133 162 C105 172 82 159 72 155 C50 157 26 150 19 140 C38 145 53 144 66 138 C47 139 32 138 19 129Z');
  const wash=g.createLinearGradient(0,42,0,188);wash.addColorStop(0,'#fff3d3');wash.addColorStop(.46,'#f9eacd');wash.addColorStop(1,'#c5beb2');
  g.fillStyle=wash;g.fill(body);g.lineCap='round';g.lineJoin='round';g.lineWidth=3;g.strokeStyle='#94795e';g.stroke(body);
  for(const path of [
    'M67 138 Q98 133 118 115 Q140 95 162 113 C182 130 202 116 201 99 C201 89 188 87 184 97',
    'M155 151 Q179 159 198 144 Q217 128 239 135 C256 139 269 131 272 119',
    'M239 100 C251 79 275 78 289 95 C301 113 326 112 334 97 C340 87 327 80 319 88',
    'M303 145 Q328 157 348 138 Q362 122 379 129 C397 135 409 128 417 119',
    'M369 105 Q381 94 399 103 Q420 115 443 114'
  ]) {g.strokeStyle='#b19a7d';g.lineWidth=2.6;g.stroke(new Path2D(path));}
  const map=new T.CanvasTexture(paper);map.colorSpace=T.SRGBColorSpace;return map;
}
const flight={};
function royalFootsteps(scene) {
  // A footprint forms just ahead of touchdown, stays in its own place while
  // the foot is bearing weight, then dissolves as the next hoof lifts.
  const geometry=new T.PlaneGeometry(1,1), count=12;
  const opacity=new T.InstancedBufferAttribute(new Float32Array(count),1);
  opacity.setUsage(T.DynamicDrawUsage);geometry.setAttribute('cloudOpacity',opacity);
  const material=new T.MeshBasicMaterial({map:cloudBrush(),transparent:true,depthWrite:false,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float cloudOpacity;varying float wisp;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwisp=cloudOpacity;');
    shader.fragmentShader='varying float wisp;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=wisp;');
  };
  const clouds=new T.InstancedMesh(geometry,material,count);clouds.frustumCulled=false;clouds.name='麒麟の瑞雲';
  clouds.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(clouds);
  const dummy=new T.Object3D();dummy.rotation.order='YXZ';
  // The left lobe of the painted cloud crests at pixel (217,47).
  // Pin that spot of the tilted billboard beneath the sole for every view angle.
  const crest=new T.Vector3(217/512-.5,.5-47/216,0),offset=new T.Vector3();
  let lastStep, lastRoyal, trail=[];
  return (t,royal,camera)=>{
    clouds.count=0;
    if(!royal || kirinTouchdowns.length!==4 || Math.hypot(wrapDelta(royal.x-camera.position.x),wrapDelta(royal.z-camera.position.z))>130){clouds.visible=false;return;}
    const phase=(t+royal.phase)*kirinFrequency,quarter=Math.PI*.5;
    const step=Math.floor((phase+.42)/quarter);
    if(step!==lastStep || royal!==lastRoyal) {
      lastRoyal=royal;
      lastStep=step;trail=[];
      for(let k=step-5;k<=step;k++) {
        const leg=((k%4)+4)%4, side=leg<2?-1:1;
        const touch=(k*quarter)/kirinFrequency-royal.phase;
        kirinFlight(royal,touch,flight);
        const sole=kirinTouchdowns[leg], scale=royal.stature;
        const x=sole.x*scale,y=sole.y*scale,z=sole.z*scale;
        const c=Math.cos(flight.heading), s=Math.sin(flight.heading);
        trail.push({time:touch,x:flight.x+c*x+s*z,y:flight.y+y,z:flight.z+c*z-s*x,side});
      }
    }
    for(const w of trail) {
      const age=t-w.time;
      if(age<-.21||age>2.62)continue;
      const appear=clamp((age+.21)/.24), life=clamp((2.62-age)/1.39);
      const stretch=.48+.52*Math.sin(appear*Math.PI*.5);
      const x=camera.position.x+wrapDelta(w.x-camera.position.x);
      const z=camera.position.z+wrapDelta(w.z-camera.position.z);
      const tilt=Math.atan2(camera.position.y-w.y, Math.hypot(camera.position.x-x,camera.position.z-z));
      dummy.rotation.set(-.16-.70*tilt,Math.atan2(camera.position.x-x,camera.position.z-z),w.side*.07,'YXZ');
      dummy.scale.set((1.32+.24*(1-life))*stretch,.57*stretch,1);
      offset.copy(crest).multiply(dummy.scale).applyQuaternion(dummy.quaternion);
      dummy.position.set(x,w.y-.17*(1-life),z).sub(offset);dummy.updateMatrix();
      clouds.setMatrixAt(clouds.count,dummy.matrix);opacity.setX(clouds.count++,appear*life*.94);
    }
    clouds.visible=clouds.count>0;clouds.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;
  };
}
export function createSkyLife(scene) {
  const flock=flockFlights(scene), steps=royalFootsteps(scene);
  let royal;
  return (time,state,camera,atPhotoTime)=>{
    royal ??= state.npcs.find(n=>n.type==='kirin');
    flock(time,camera);
    steps(time,royal && atPhotoTime ? atPhotoTime(royal,time) : royal,camera);
  };
}
