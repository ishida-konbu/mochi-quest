import { createSteam, steamSource } from './steam.js';
import * as T from './vendor/three.module.min.js';
import { registerFallingWater, jetContacts, interceptedJetGLSL } from './falling-water-contact.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { skinGeometry } from './ryugu-sculpt.js';
import { pilgrimInstallationGeometry,lockLeaf,snowSourceRim } from './pilgrim-bathing-craft.js';
import { harborWindlass,windlass,winterTerraces } from './pilgrim-bath-reliefs.js';
import { brineGate,steamRoom,sluiceOpening } from './pilgrim-bathing-plan.js';

const {PI,sin,cos}=Math;
function wetStream(parent,clock,knots,width,style='fall'){
  const curve=new T.CatmullRomCurve3(knots.map(k=>new T.Vector3(...k)),false,'catmullrom',.3);
  (parent.userData.fallingWater ??= []).push({points:curve.getPoints(38),width:width*.50});
  // Front and back of the thin sheet catch the reflected paper sky; the
  // painted white filaments follow the head-driven flow into the actual pool.
  const mat=new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.DoubleSide,
    uniforms:{jetContacts,tick:clock,narrow:{value:style==='seep'?.82:.53},brine:{value:style==='tide'?1:0}},
    vertexShader:`uniform float tick; varying vec2 v; varying vec3 worldFlow; void main(){
      v=uv; vec3 p=position; p.z+=.018*sin(uv.x*31.+uv.y*12.-tick*6.)*sin(3.1416*uv.y);
      worldFlow=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    }`,
    fragmentShader:interceptedJetGLSL+`uniform float tick,narrow,brine; varying vec2 v; varying vec3 worldFlow; void main(){
      float gust=.8+.2*cos(tick*.36);
      float filament=pow(.5+.5*sin(63.*v.x+3.*sin(13.*v.y-7.8*tick+15.*v.x)),5.);
      float breakUp=.7+.3*cos(30.*v.y-7.*tick+sin(23.*v.x));
      float fringe=smoothstep(0.,.15,min(v.x,1.-v.x));
      float phase=(.35+.65*(.50+.50*sin(tick*.36)))*brine+(1.-brine);
      float alpha=fringe*breakUp*(narrow+.38*filament)*(.61+.39*phase);
      gl_FragColor=vec4(mix(vec3(.28,.48,.45),vec3(.91,.95,.86),.40+.52*filament),alpha*gust*fallingCoverage(worldFlow));
      #include <colorspace_fragment>
    }`,
  });
  const sheet=new T.Mesh(skinGeometry(31,15,(u,v)=>{
    const p=curve.getPoint(v),a=(u-.5)*width*(.83+.17*cos(v*PI*2)+.22*v);
    return [p.x+a,p.y,p.z+.046*sin(PI*u)+.010*cos(4*PI*u+.65*v),u,v];
  }),mat);
  sheet.renderOrder=3;parent.add(sheet);
}
function eddies(parent,clock,x,z,y,w,d,mode){
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
    uniforms:{tick:clock,tide:{value:mode==='tide'?1:0}},
    vertexShader:`varying vec2 v; void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float tick,tide; varying vec2 v; void main(){
      vec2 p=(v-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float t=tick*(1.8+.65*tide);
      float phase=r*36.-t*6.+.59*sin(a*6.-t*.67)+.32*sin(a*14.+t*.36);
      float rings=pow(.5+.5*cos(phase),8.);
      float edge=(1.-smoothstep(.36,1.,r))*smoothstep(.02,.16,r);
      float split=.5+.5*sin(a*7.+r*6.-t*.65);
      float center=(1.-smoothstep(.05,.25,r))*(.4+.45*abs(sin(20.*p.x+17.*p.y+t)));
      gl_FragColor=vec4(.79,.89,.80, .58*(edge*rings*(.40+.60*split)+.55*center));
      #include <colorspace_fragment>
    }`});
  const m=new T.Mesh(new T.PlaneGeometry(w,d).rotateX(-PI/2),mat);m.position.set(x,y+.025,z);
  m.renderOrder=4;parent.add(m);
}
function ventSteam(parent,clock,origins,height,width){
  const sources=origins.map(([x,y,z])=>steamSource('vent',x,y,z,{
    height,width,count:2,rx:width*.32,rz:width*.25,
  }));
  parent.add(createSteam(sources,clock));
}
function saltMarsh(parent,clock){
  const x=brineGate.u,z=-1.72;
  const blade=new T.Mesh(lockLeaf(),scrollPigment());
  blade.position.set(x,.1,z+.016);blade.castShadow=blade.receiveShadow=true;parent.add(blade);
  const wheel=new T.Mesh(harborWindlass(),scrollPigment());
  wheel.position.set(windlass.x,windlass.y,windlass.z);
  wheel.castShadow=wheel.receiveShadow=true;parent.add(wheel);
  const liftLine=new T.Mesh(new T.CylinderGeometry(.026,.026,1,7),new T.MeshStandardMaterial({color:'#b09064'}));
  parent.add(liftLine);
  const dial=new T.Group();
  const marker=new T.Mesh(new T.SphereGeometry(.11,12,9),new T.MeshStandardMaterial({color:'#bd7955'}));
  marker.scale.set(1,.77,1);dial.position.set(x-1.08,.42,z+.38);dial.add(marker);parent.add(dial);
  wetStream(parent,clock,[[x,.59,z+.08],[x,.48,z+.22],[x,.28,z+.40],[x,.02,z+.50]],.92,'tide');
  eddies(parent,clock,x,z+1.31,0,2.05,3.56,'tide');
  return t=>{
    const phase=sluiceOpening(t);
    blade.position.y=.10+.59*phase;dial.position.y=.34+.29*phase;
    wheel.rotation.z=-.59*phase/.277;
    const top=2.67,bottom=blade.position.y+1.01;
    liftLine.position.set(x,(top+bottom)/2,z+.107);liftLine.scale.y=top-bottom;
  };
}
function potterySteam(parent,clock){
  const z=steamRoom.v-steamRoom.d/2+.67;
  ventSteam(parent,clock,[[-.44,1.32,z],[-1.95,1.04,z-.16],[.44,1.16,z],[1.95,1.04,z-.16],[.12,.08,-.46],[-1.03,.05,.14],[.97,.05,.23]],1.36,.36);
  ventSteam(parent,clock,[[.10,4.92,steamRoom.v-.64]],1.86,.44);
  // Low, warm light reaches the slats through the kneeling-height stove.
  const glow=new T.PointLight(0xffba7a,3.1,4.9,1.8);glow.position.set(.11,1.28,z+.55);parent.add(glow);
}
export function pilgrimBathInstallation(site){
  const root=new T.Group(),clock={value:0},geometry=pilgrimInstallationGeometry(site);
  const body=new T.Mesh(geometry.body,scrollPigment());body.receiveShadow=body.castShadow=true;root.add(body);
  let cover=null,move=null;
  if(geometry.roof){
    cover=new T.Mesh(geometry.roof,scrollPigment());cover.receiveShadow=cover.castShadow=true;root.add(cover);
    potterySteam(root,clock);
  }else if(site.kind==='inari'){
    const points=[[-.34,3.03,-3.01],[-.29,2.99,-2.33],[-.22,2.94,-1.40],[0,2.94,-.78],
      [.006,2.67,-.64],[.021,1.82,-.585],[.033,.85,-.56],[.037,.02,-.59]];
    wetStream(root,clock,points,.66);
    eddies(root,clock,.034,-.58,0,2.26,2.07,'fall');
    ventSteam(root,clock,[[-.20,.04,-.57],[.21,.04,-.60]],.74,.21);
  }else if(site.kind==='peach'){
    wetStream(root,clock,[[-2.30,1.28,-2.02],[-2.23,1.22,-1.58],[-2.15,1.17,-1.21],[-2.13,1.10,-1.17],[-2.12,.54,-1.09]],.24);
    wetStream(root,clock,[[-.64,.66,-.19],[-.12,.65,-.16],[.36,.59,-.11],[.43,.53,-.11],[.48,.30,-.10]],.17,'seep');
    eddies(root,clock,-2.12,-1.09,.54,.86,.88,'seep');eddies(root,clock,.53,-.10,.30,.90,.85,'seep');
    ventSteam(root,clock,[[-2.05,.57,-.96],[2.57,.33,-.78]],.86,.24);
  }else if(site.kind==='temple'){
    wetStream(root,clock,[[0,1.25,-2.66],[0,1.20,-2.22],[0,1.12,-2.14],[0,.71,-2.08],[0,.19,-2.01]],.18);
    eddies(root,clock,0,-1.94,.19,.83,.88,'seep');
    for(const side of [-1,1]){
      wetStream(root,clock,[[side*2.15,.20,-.29],[side*2.5,.174,-.29],[side*2.78,.133,-.30],
        [side*2.83,.079,-.30],[side*2.84,-.015,-.30]],.17,'seep');
      eddies(root,clock,side*2.98,-.30,-.02,.71,.68,'seep');
    }
  }else if(site.kind==='tsuruga')move=saltMarsh(root,clock);
  else if(site.kind==='snow'){
    const {x,y,z}=snowSourceRim;
    wetStream(root,clock,[[x,y+.16,z],[x+.14,y+.17,z+.16],[x+.27,y+.12,z+.22],[x+.38,.92,z+.20]],.18,'seep');
    for(const [i,b] of winterTerraces.entries()){
      const a=.34,r=1+.117*cos(3*a+b.phase)+.074*sin(5*a-b.phase)+.037*cos(9*a+1.3*b.phase);
      const ex=b.x+b.rx*r*cos(a),ez=b.z+b.rz*r*sin(a),level=i<2?winterTerraces[i+1].y-.06:0;
      wetStream(root,clock,[[ex-.13,b.y-.063,ez-.02],[ex,b.y-.061,ez],[ex+.07,b.y-.13,ez+.017],
        [ex+.13,Math.max(.005,level),ez+.04]],.20+i*.056,'seep');
      if(i===2)eddies(root,clock,ex+.15,ez+.04,0,1.43,1.21,'seep');
    }
    ventSteam(root,clock,[[x,y+.14,z],[-4.22,.69,1.03],[-3.51,.34,1.20]],1.27,.32);
  }else if(site.kind==='dawn'){
    for(const x of [-2,0,2]){
      for(const side of [-1,1]){
        const u=x+side*.70;
        wetStream(root,clock,[[u,.112,-1.23],[u,.095,-1.20],[u,.02,-1.16]],.068,'seep');
      }
      eddies(root,clock,x,-1.19,0,1.34,.63,'seep');
    }
  }
  if(root.userData.fallingWater)registerFallingWater(site,'pilgrim',root.userData.fallingWater);
  return {root,update(t,localU,localV){
    clock.value=t;if(move)move(t);
    // In third person the camera normally projects through the curved vault
    // while a player is seated. Lift its upper shell only inside the room.
    if(cover)cover.visible=!(Math.abs(localU)<2.60 && localV>=-2.53 && localV<1.48);
  }};
}
