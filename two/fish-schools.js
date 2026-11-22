import * as THREE from './vendor/three.module.min.js';
import { BOUND, WATER_Y, riverZ, seeded, wrapDelta } from './terrain.js';
import { FLEET, vesselPose } from './ocean-voyage.js';
import { waterWaveGLSL } from './shoreline.js';

const { sin, cos, PI } = Math;
const mapleStream=x=>-130+3.3*sin((x-292)/15);
const river=[-194,-161,-105,-56,8,68,118,189,267].map(x=>[x,riverZ(x),riverZ]);
river.push([320,mapleStream(320),mapleStream]);

// The four fishing beaches, both harbour mouths, and the succession of islets
// on the way to the palace. Keep each turning circle in a sounded channel.
const coast=[
  [-252,12],[357,235],[51,627],[592,-1331],[-206,110],[340,176],
  [389,-82],[-411,157],[-465,213],[-570,260],[340,-1497],[-259,-599],
];
// Includes each side of the trading circuit, the far ocean and the world seam.
const ocean=[
  [596,-1529],[950,-1314],[1014,-1055],[957,-687],[930,-120],[809,388],
  [730,754],[609,1044],[190,1063],[-345,887],[-802,657],[-1049,280],
  [-1117,-59],[-1004,-445],[-622,-525],[-385,-525],[-867,-862],[-862,-1050],
  [-690,-1322],[-488,-1402],[-240,-1479],[136,-1518],[-1320,1218],[1597,415],
];
const rng=seeded(0x756f096);
function school([x,z,channel],kind,index,average){
  const creek=channel===mapleStream, speed=.10+rng()*.075;
  const run=creek?3.7:kind==='river'?5.2:5.2+rng()*2.9;
  const width=creek?.54:kind==='river'?1.23:2.2+rng()*1.6;
  const angle=channel?0:rng()*2*PI;
  const count=average+[-1,1,2,-2][index%4];
  const fry=Array.from({length:count},(_,i)=>({
    lag:(i/count-.5)*1.42+(rng()-.5)*.12,
    side:(rng()-.5)*(creek?.45:2.18), phase:rng()*2*PI, size:(channel?.36:.44)+rng()*.22,
    depth:.31+rng()*(channel?.48:i%4===1&&kind==='ocean'?2.4:.76),
  }));
  return {x,z,channel,kind,run,width,speed,phase:rng()*2*PI,c:cos(angle),s:sin(angle),fry};
}
export const FISH_SCHOOLS=[
  ...river.map((p,i)=>school(p,'river',i,8)),
  ...coast.map((p,i)=>school(p,'coast',i,9)),
  ...ocean.map((p,i)=>school(p,'ocean',i,8)),
];

// Shared heading and delayed turns give each school a front and a rear. The
// smaller lateral beat keeps individuals from tracking parallel ellipses.
export function fryPose(s,f,t,player,dive,out){
  const a=t*s.speed+s.phase+f.lag, ripple=t*.69+f.phase;
  const dx=-s.run*sin(a),dz=s.width*cos(a);
  const across=(f.side+.11*sin(ripple))/Math.hypot(dx,dz);
  const u=s.run*cos(a)-dz*across,v=s.width*sin(a)+dx*across;
  let x=s.x+s.c*u-s.s*v,z=s.z+s.s*u+s.c*v;
  const tx=s.c*dx-s.s*dz;
  let tz=s.s*dx+s.c*dz;
  if(s.channel){
    z+=s.channel(x)-s.z;
    tz+=tx*(s.channel(x+.2)-s.channel(x-.2))/.4;
  }
  let y=WATER_Y-f.depth-.075*sin(a*2+.75*f.phase)-.045*sin(ripple)-dive;
  let yaw=Math.atan2(-tz,tx);
  const ax=wrapDelta(x-player.x),az=wrapDelta(z-player.z),ay=y-player.y-.45;
  if(Math.abs(ax)<2.7 && Math.abs(az)<2.7 && Math.abs(ay)<2.7){
    const scatter=1-THREE.MathUtils.smoothstep(Math.hypot(ax,az,ay),.35,2.7);
    const length=Math.hypot(ax,az),sx=length>.01?ax/length:cos(f.phase),sz=length>.01?az/length:sin(f.phase);
    x+=sx*scatter*.7;z+=sz*scatter*.7;y-=.12*scatter;
    const turn=Math.atan2(-sz,sx)-yaw;
    yaw+=scatter*Math.atan2(sin(turn),cos(turn));
  }
  out.x=x;out.y=y;out.z=z;out.yaw=yaw;out.bank=.11*cos(a)+.09*sin(ripple);
}

// From above, the ink wash of the sea reveals a soft refracted silhouette.
// Its luminous flank flashes on the turn and its tail shares the fin stroke
// of the submerged model. Both passes use the same school and the same pose.
function waterSilhouettes(clock){
  const g=new THREE.PlaneGeometry(1.48,.64);
  g.rotateX(-PI/2);g.translate(-.15,0,0);
  const m=new THREE.ShaderMaterial({
    uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{swimTime:{value:0}}]),
    fog:true,transparent:true,depthWrite:false,
    vertexShader:`
      uniform float swimTime; varying vec2 paper; varying float veil,flash;
      ${waterWaveGLSL}
      #include <fog_pars_vertex>
      void main(){
        paper=position.xz;
        vec4 centre=instanceMatrix[3];
        vec3 local=position;
        float tail=1.-smoothstep(-.85,.15,local.x);
        local.z+=.115*tail*sin(swimTime*6.5+centre.z+local.x*4.7);
        vec4 p=instanceMatrix*vec4(local,1.);
        float depth=max(0.,${WATER_Y}-centre.y);
        vec3 eye=normalize(cameraPosition-centre.xyz);
        p.xz+=eye.xz*depth*.48;
        vec2 q=mod(p.xz+${BOUND}.,${2*BOUND}.)-${BOUND}.;
        p.y=${WATER_Y}+.021+waveHeight(q,swimTime);
        veil=(1.-smoothstep(.56,1.67,depth))*(.12+.88*smoothstep(.045,.46,eye.y));
        veil*=1.-smoothstep(42.,54.,distance(centre.xyz,cameraPosition));
        flash=.32+.63*pow(.5+.5*sin(swimTime*1.85+centre.x*.7+centre.z*.27),2.);
        vec4 mvPosition=viewMatrix*p;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      varying vec2 paper; varying float veil,flash;
      #include <fog_pars_fragment>
      void main(){
        float x=paper.x,z=paper.y;
        // The tail lobes divide behind a narrow peduncle. An offset lateral
        // line and the two swept pectorals break the symmetry of the body.
        float t=clamp((x+.58)/1.12,0.,1.);
        float body=.147*pow(max(0.,sin(3.14159*pow(t,1.36))),.63)-abs(z);
        float tailT=clamp((-.49-x)/.35,0.,1.);
        float fork=min(.035+.15*tailT-abs(z),abs(z)+.072-.155*tailT);
        fork=min(fork,min(-.45-x,x+.84));
        float fin=max(0.,1.-abs((x+.01)/.16));
        float stroke=max(max(body,fork),min(.13+fin*.084-abs(z),fin*.045));
        float aa=clamp(fwidth(z)+.17*fwidth(x),.003,.085);
        float alpha=smoothstep(0.,aa,stroke)*veil*.88;
        if(alpha<.012)discard;
        float flank=(1.-smoothstep(.005,.028+aa,abs(z-.050*sin(t*3.14))))*smoothstep(.18,.42,t)*(1.-smoothstep(.75,.95,t));
        vec3 ink=mix(vec3(.039,.115,.112),vec3(.56,.63,.49),flank*flash);
        gl_FragColor=vec4(ink,alpha);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  m.uniforms.swimTime=clock;
  return new THREE.InstancedMesh(g,m,capacity);
}
const capacity=FISH_SCHOOLS.reduce((sum,s)=>sum+s.fry.length,0);
export function createFishSchools(scene,geometry,silver,clock){
  const swimmers=new THREE.InstancedMesh(geometry,silver,capacity),surface=waterSilhouettes(clock);
  swimmers.name='小魚の群れ・水中';surface.name='小魚の群れ・水面の魚影';
  surface.renderOrder=2;
  for(const mesh of [swimmers,surface]){
    mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count=0;scene.add(mesh);
  }
  const dummy=new THREE.Object3D(),pose={},ships=FLEET.map(()=>({}));
  return (time,player,camera,voyageTime)=>{
    const under=camera.position.y<WATER_Y;
    const mesh=under?swimmers:surface, other=under?surface:swimmers;
    other.visible=false;
    clock.value=time;
    let n=0,shipsReady=false;
    for(const s of FISH_SCHOOLS){
      const dx=wrapDelta(s.x-camera.position.x),dz=wrapDelta(s.z-camera.position.z);
      if(dx*dx+dz*dz>(under?42:64)**2)continue;
      // Shift the whole school together at the wrap rather than splitting fish
      // across two images. A passing keel sends the school below its draft.
      const shiftX=camera.position.x+dx-s.x,shiftZ=camera.position.z+dz-s.z;
      let dive=0;
      if(!s.channel){
        if(!shipsReady){
          FLEET.forEach((ship,i)=>vesselPose(ship,voyageTime,ships[i]));
          shipsReady=true;
        }
        for(const vessel of ships){
          const distance=Math.hypot(wrapDelta(vessel.x-s.x),wrapDelta(vessel.z-s.z));
          dive=Math.max(dive,2.64*(1-THREE.MathUtils.smoothstep(distance,27,39)));
        }
      }
      for(const f of s.fry){
        fryPose(s,f,time,player,dive,pose);
        if(!under && WATER_Y-pose.y>=1.67)continue;
        dummy.position.set(pose.x+shiftX,pose.y,pose.z+shiftZ);
        dummy.rotation.set(0,pose.yaw,under?pose.bank:0,'YXZ');
        dummy.scale.setScalar(f.size);dummy.updateMatrix();mesh.setMatrixAt(n++,dummy.matrix);
      }
    }
    mesh.visible=n>0;mesh.count=n;
    if(n){mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,n*16);mesh.instanceMatrix.needsUpdate=true;}
  };
}
