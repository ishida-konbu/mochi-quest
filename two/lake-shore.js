import * as T from './vendor/three.module.min.js';
import { animateNPC, makeNPC } from './actors.js';
import { FOREST_LAKE, lakePoint, lakeRadiusGLSL } from './snow-country.js';
import { LAKE_ANIMALS, LAKE_WILLOWS } from './lake-grove-layout.js';
import { seeded, terrainMeshHeight, wrapDelta } from './terrain.js';
import { waterWave } from './shoreline.js';

const tau=Math.PI*2;
const v=(x,y,z)=>new T.Vector3(x,y,z);
const {sin,cos}=Math;
const level=FOREST_LAKE.level;

// Indexed brushwork. The two halves of a blade meet along its raised vein.
// The same geometry supplies the willow's broken reflection in the water.
class Brush {
  constructor(){
    this.positions=[];this.colors=[];this.bends=[];this.indices=[];
  }
  vertex(point,tint,bend=0){
    const index=this.bends.length;
    this.positions.push(point.x,point.y,point.z);
    this.colors.push(tint.r,tint.g,tint.b);
    this.bends.push(bend);
    return index;
  }
  stem(points,radii,shade,sides=6,flex=0){
    const tint=new T.Color(shade),axis=v(0,0,0),reference=v(0,0,0);
    const right=v(0,0,0),side=v(0,0,0),point=v(0,0,0);
    const start=this.bends.length;
    for(let i=0;i<points.length;i++){
      axis.subVectors(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)]).normalize();
      reference.set(Math.abs(axis.z)>.93?1:0,0,Math.abs(axis.z)>.93?0:1);
      right.crossVectors(axis,reference).normalize();side.crossVectors(axis,right);
      for(let j=0;j<sides;j++){
        const a=j*tau/sides;
        point.copy(points[i]).addScaledVector(right,radii[i]*cos(a)).addScaledVector(side,radii[i]*sin(a));
        this.vertex(point,tint.clone().multiplyScalar(.78+.22*sin(a+.8)),flex*i/(points.length-1));
        if(i>0){
          const q=start+i*sides+j,next=start+i*sides+(j+1)%sides;
          this.indices.push(q-sides,next-sides,q,next-sides,next,q);
        }
      }
    }
  }
  leaf(root,delta,width,bow,shade,flex=0){
    const start=this.bends.length,tint=new T.Color(shade),tip=root.clone().add(delta);
    const transverse=v(delta.z,0,-delta.x);
    if(transverse.lengthSq()<.0001)transverse.set(1,0,0);
    transverse.setLength(width);
    const mid=root.clone().lerp(tip,.44);mid.y+=bow;
    const fold=mid.clone();fold.y+=width*.36;
    this.vertex(root,tint.clone().multiplyScalar(.66),flex*.7);
    this.vertex(mid.clone().sub(transverse),tint.clone().multiplyScalar(.74),flex);
    this.vertex(fold,tint.clone().multiplyScalar(1.24),flex);
    this.vertex(mid.clone().add(transverse),tint,flex);
    this.vertex(tip,tint.clone().multiplyScalar(.8),flex);
    for(const i of [0,1,2,2,1,4,0,2,3,3,2,4])this.indices.push(start+i);
  }
  geometry(){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
    geometry.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    geometry.setAttribute('flex',new T.Float32BufferAttribute(this.bends,1));
    geometry.setIndex(this.indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
    return geometry;
  }
}

function willow(tree,brush){
  const rng=seeded(tree.seed),u=v(-cos(tree.angle),0,-sin(tree.angle)),w=v(-u.z,0,u.x);
  const root=v(tree.x,terrainMeshHeight(tree.x,tree.z)-.12,tree.z);
  const point=(out,y,side)=>root.clone().addScaledVector(u,out*tree.size)
    .addScaledVector(w,side*tree.size).addScaledVector(v(0,1,0),y*tree.size);
  const spine=[point(0,-.15,0),point(.06,.48,-.04),point(.14,1.5,0),
    point(.36,2.4,.1),point(.74,3.04,.15),point(.89,3.54,.18)];
  const bough=(points,radii,shade,sides=7)=>brush.stem(points,radii.map(r=>r*tree.size),shade,sides);
  for(let i=0;i<7;i++){
    const a=i*tau/7+.2*rng(),s=1.3+.6*rng(),end=point(s*cos(a),0,s*sin(a));
    end.y=terrainMeshHeight(end.x,end.z)-.08;
    bough([spine[2],point(.22*cos(a),.37,.22*sin(a)),end],[.19,.22,.05],'#686653');
  }
  bough(spine,[.54,.48,.36,.33,.29,.20],'#625f51',10);
  // Calligraphic bark fissures run with the grain and taper before the fork.
  for(let i=0;i<8;i++){
    const a=i*tau/8,points=spine.slice(1).map((q,j)=>q.clone()
      .addScaledVector(u,cos(a+.18*j)*[.47,.355,.325,.28,.195][j]*tree.size)
      .addScaledVector(w,sin(a+.18*j)*[.47,.355,.325,.28,.195][j]*tree.size));
    bough(points,[.006,.026,.034,.021,.006],i%3?'#46483e':'#93856d',4);
  }
  const green=['#819566','#8b9d72','#9aaa75','#a3ae81','#abb68b'];
  for(let i=0;i<8;i++){
    const a=i*tau/8+.19*rng(),side=sin(a),ahead=cos(a);
    const reach=2.2+1.25*rng(),height=4.4+1.55*rng(),start=spine[3+i%3];
    const joint=point(.91+ahead*reach*.47,height-.8,side*reach*.50);
    const end=point(1.17+ahead*reach,height,side*reach);
    bough([start,start.clone().lerp(joint,.43).addScaledVector(w,.12*side),joint,end],
      [.23,.18,.12,.055],'#626553');
    for(let j=0;j<4;j++){
      const b=a+(j-1.5)*.37,q=end.clone().lerp(joint,.08+j*.14);
      const tip=q.clone().addScaledVector(u,cos(b)*tree.size*(.78+rng()))
        .addScaledVector(w,sin(b)*tree.size*(.78+rng()));
      tip.y+=tree.size*(.12+rng()*.45);
      const arch=q.clone().lerp(tip,.56);arch.y+=.34*tree.size;
      bough([q,arch,tip],[.068,.032,.009],'#677058',5);
      for(let k=0;k<4;k++){
        const origin=arch.clone().lerp(tip,k/3), drop=tree.size*(1.4+rng()*2.4);
        const drift=v(.25+rng()*.62,0,(rng()-.5)*.7).multiplyScalar(tree.size);
        const sprig=t=>origin.clone().addScaledVector(drift,Math.sin(t*2.75))
          .addScaledVector(u,.13*t*tree.size).addScaledVector(v(0,1,0),-drop*t*t);
        brush.stem([sprig(0),sprig(.3),sprig(.56),sprig(.8),sprig(1)],
          [.016,.014,.011,.008,.003].map(r=>r*tree.size),'#71795f',4,.28);
        const count=11+Math.floor(4*rng());
        for(let n=1;n<=count;n++){
          const t=n/(count+1),ang=b+(n%2?1:-1)*(1+rng());
          const span=(.36+.25*rng())*tree.size*(1-t*.42);
          brush.leaf(sprig(t),v(span*cos(ang),-span*(.76+rng()),span*sin(ang)),
            span*.17,span*.19,green[(i+j+n)%green.length],.3+.7*t);
        }
      }
    }
  }
}
function reedBed(brush,angle,patchRadius,rng){
  const [cx,cz]=lakePoint(angle,.975);
  const sienna=['#a08d62','#c3ad7c','#cbbf93','#907b55'];
  const greens=['#748354','#99a16d','#85956a','#a6ac7d'];
  for(let i=0;i<48;i++){
    const a=rng()*tau,rad=Math.sqrt(rng())*patchRadius;
    const x=cx+cos(a)*rad,z=cz+sin(a)*rad*.66;
    const y=terrainMeshHeight(x,z)-.09;
    if(y<level-1.1 || y>level+1.08)continue;
    const root=v(x,y,z),h=.95+rng()*1.45;
    const top=root.clone().add(v(.24+rng()*.40,h,(rng()-.5)*.33));
    const mid=root.clone().lerp(top,.58);mid.x-=.15;
    brush.stem([root,mid,top],[.028,.021,.009],greens[i%4],4,.8);
    for(let j=0;j<4;j++){
      const lean=rng()*tau,t=.08+.10*j;
      const span=.24+rng()*.42;
      brush.leaf(root.clone().lerp(mid,t*1.6),v(cos(lean)*span,.2+rng()*.6,sin(lean)*span),
        .036+rng()*.036,.19,greens[(i+j)%4],.61);
    }
    // A nodding panicle: staggered one-sided spikelets leave gaps of sky.
    for(let k=0;k<7;k++){
      const t=k/7,base=top.clone().add(v(t*.26,t*.26,0));
      const segment=(.22-.11*t)*(k%2?-1:1),pale=sienna[(i+k)%4];
      brush.leaf(base,v(.23+t*.07,.05-t*.05,segment),.044-.014*t,.047,pale,.93);
    }
  }
}
function waterLily(brush,p,r,a,bloom){
  const center=v(p.x,level+.042,p.z),leaf=new T.Color('#80977c'),max=tau-.33;
  const mid=brush.vertex(center,leaf.clone().multiplyScalar(.68));
  for(let j=0;j<=26;j++){
    const q=j*max/26+a,edge=r*(1+.046*sin(5*q+a)+.028*cos(8*q));
    const dx=edge*cos(q),dz=edge*.86*sin(q);
    const rib=j%3===0;
    const near=brush.vertex(center.clone().add(v(dx*.52,.028+.015*cos(4*q),dz*.52)),
      leaf.clone().multiplyScalar(rib?1.18:1.02));
    const rim=brush.vertex(center.clone().add(v(dx,.019+.025*sin(3*q),dz)),
      leaf.clone().multiplyScalar(.75+.12*cos(q)));
    if(j)brush.indices.push(mid,near-2,near,near-2,rim-2,near,near,rim-2,rim);
  }
  if(!bloom)return;
  const flower=center.clone().add(v(r*.28,.077,-r*.07));
  for(let whorl=0;whorl<2;whorl++){
    for(let i=0;i<8;i++){
      const q=tau*i/8+whorl*.37,span=(whorl?.105:.179)*r/.43;
      brush.leaf(flower,v(cos(q)*span,span*(whorl?.94:.50),sin(q)*span),span*.31,-span*.12,
        whorl?'#ede1ba':'#e5dfcd');
    }
  }
  brush.stem([flower,flower.clone().add(v(0,.083,0))],[.032,.039],'#ba9f53');
}
function lilyRaft(brush,angle,rng){
  const [cx,cz]=lakePoint(angle,.88);
  for(let i=0;i<21;i++){
    const a=rng()*tau,s=Math.sqrt(rng()),p=v(cx+3.9*s*cos(a),0,cz+2.3*s*sin(a));
    if(terrainMeshHeight(p.x,p.z)>level-.13)continue;
    waterLily(brush,p,.21+rng()*.28,rng()*tau,i%6===0);
  }
}

const breeze='p.x+=flex*(.061*sin(p.z*.57+time*.88)+.023*sin(p.x*2.+time*1.32));';
function leavesMaterial(clock){
  const mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.time=clock;
    shader.vertexShader='attribute float flex; uniform float time;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>',`vec3 p=position;${breeze}vec3 transformed=p;`);
  };
  return mat;
}
function reflectionMaterial(clock){
  const mat=new T.ShaderMaterial({
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{time:{value:0}}]),
    transparent:true,side:T.DoubleSide,depthWrite:false,fog:true,vertexColors:true,
    vertexShader:`attribute float flex;uniform float time;varying vec2 marking;varying vec3 tint;
      #include <fog_pars_vertex>
      void main(){
        vec3 p=position;${breeze}
        vec3 wp=(modelMatrix*vec4(p,1.)).xyz;
        float h=max(.02,cameraPosition.y-${level});
        // Project the reflected vertices onto the real water, so shoreline
        // and rock depth still occlude the image without a second scene pass.
        vec3 foot=mix(cameraPosition,wp,h/(h+max(.02,wp.y-${level})));
        marking=foot.xz;tint=color;
        foot.x+=.075*sin(foot.z*1.14+time*.68)+.028*sin(foot.z*3.3-time*.81);
        foot.y=${level}+.024+.014*sin(foot.x*.54+foot.z*.31-time*1.23);
        vec4 mvPosition=viewMatrix*vec4(foot,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float time;varying vec2 marking;varying vec3 tint;
      ${lakeRadiusGLSL}
      #include <fog_pars_fragment>
      void main(){
        if(cameraPosition.y<=${level} || lakeRadius(marking)>1.)discard;
        float ripple=sin(marking.y*4.2+.6*sin(marking.x*.45)+time*.62);
        float brush=smoothstep(-.85,.7,ripple);
        gl_FragColor=vec4(mix(vec3(.025,.07,.065),tint,.16),.098+.15*brush);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  mat.uniforms.time=clock;return mat;
}

function rippleArc(){
  const p=[],indices=[];
  // Two open ends fade into points, like the uninked side of a ripple.
  for(let i=0;i<=42;i++){
    const t=i/42,a=t*tau*.88,width=.075*Math.sin(Math.PI*t)**.62;
    for(const r of [1-width,1])p.push(cos(a)*r,.0,sin(a)*r);
    if(i){const k=i*2;indices.push(k-2,k-1,k,k,k-1,k+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);
  return g;
}

function stoneSkipping(group){
  const [thrower,spectator]=LAKE_ANIMALS,angle=thrower.angle;
  const targets=[.895,.826,.777].map((r,i)=>{
    const [x,z]=lakePoint(angle+.013*i,r);return v(x,level+.04,z);
  });
  const resident=({type,role,x,z},aim,phase)=>{
    const n={type,role,x,z,y:terrainMeshHeight(x,z),phase,
      heading:Math.atan2(aim.x-x,aim.z-z),speed:0,stature:1,build:1};
    const record=makeNPC(n,group);return {n,record};
  };
  const frog=resident(thrower,targets[0],0);
  const hare=resident(spectator,targets[1],1.4);
  const pebble=new T.Mesh(new T.SphereGeometry(1,10,6),new T.MeshLambertMaterial({color:'#4d5654'}));
  pebble.scale.set(.13,.049,.10);group.add(pebble);
  const ringGeometry=rippleArc(), rings=targets.map((target,i)=>{
    const material=new T.MeshBasicMaterial({color:i===1?'#d4dbcd':'#e4e4ce',
      transparent:true,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(ringGeometry,material);mesh.renderOrder=3;mesh.rotation.y=i*1.91+.3;
    group.add(mesh);return mesh;
  });
  const smooth=T.MathUtils.smoothstep,release=2.0,times=[2.78,3.36,3.79],cycle=7.8;
  const held=v(.089,-.39,.071),start=v(0,0,0),hand=frog.record.limbs.arm1;
  function poseFrog(phase){
    const {record,n}=frog,limbs=record.limbs;
    animateNPC(record,n,phase);
    const backswing=smooth(phase,.60,1.70)-smooth(phase,1.74,release);
    const flick=smooth(phase,1.72,release+.06)-smooth(phase,release+.2,release+.94);
    limbs.torso.rotation.y=.60*backswing-.48*flick;
    limbs.torso.rotation.z=.22*backswing-.13*flick;
    limbs.torso.rotation.x=.11+.25*backswing;
    hand.rotation.set(.77*backswing-1.38*flick,.32*backswing-.38*flick,.46+.73*backswing);
    limbs['arm-1'].rotation.z=-.26-.51*backswing;
    limbs.head.rotation.y=-limbs.torso.rotation.y*.75;
    limbs.head.rotation.x=.04+.12*backswing;
    limbs.leg1.rotation.z=.13;
    limbs['leg-1'].rotation.z=-.13;
  }
  function paw(out){
    group.updateWorldMatrix(true,false);hand.updateWorldMatrix(true,false);
    return group.worldToLocal(out.copy(held).applyMatrix4(hand.matrixWorld));
  }
  poseFrog(release);paw(start);
  return time=>{
    const phase=((time%cycle)+cycle)%cycle;
    poseFrog(phase);animateNPC(hare.record,hare.n,phase);
    const look=smooth(phase,1.7,2.65)-smooth(phase,4.15,5.4);
    const clap=look*(.5+.5*cos((phase-times[0])*11));
    const limbs=hare.record.limbs;
    limbs.torso.rotation.x+=.30*look;
    limbs.head.rotation.y-=.24*(1-look);
    for(const side of [-1,1]){
      const arm=limbs['arm'+side];
      arm.rotation.x-=.66*look+.18*clap;
      arm.rotation.z-=side*(.26*look+.52*clap);
      limbs['筆穂耳'+side].rotation.x+=.17*look;
    }
    pebble.visible=phase<times[2] || phase>cycle-.96;
    if(phase<=release || phase>times[2]){
      paw(pebble.position);
      const pick=smooth(phase,cycle-.96,cycle-.68);
      pebble.scale.set(.13,.049,.10).multiplyScalar(phase>times[2]?pick:1);
    }else{
      const i=phase<times[0]?0:phase<times[1]?1:2;
      const begin=i?times[i-1]:release,t=(phase-begin)/(times[i]-begin);
      pebble.position.lerpVectors(i?targets[i-1]:start,targets[i],t);
      pebble.position.y+=4*t*(1-t)*[.47,.37,.19][i];
      pebble.rotation.y=phase*8;
    }
    for(const [i,mesh] of rings.entries()){
      const age=phase-times[i];mesh.visible=age>=0 && age<1.83;
      if(!mesh.visible)continue;
      const q=targets[i];mesh.position.set(q.x,level+waterWave(q.x,q.z,time)+.029,q.z);
      const r=.09+Math.sqrt(age)*(.9-.1*i);
      mesh.scale.set(r,1,r*.86);mesh.material.opacity=.75*(1-age/1.83)**1.4;
    }
  };
}

export function createLakeShore(scene){
  const shore=new T.Group(),actors=new T.Group(),clock={value:0};
  shore.name='湖岸の柳と葦';actors.name='水切りをする蛙と兎';
  scene.add(shore);shore.add(actors);shore.visible=false;
  const mat=leavesMaterial(clock),mirror=reflectionMaterial(clock);
  const bank=new Brush(),pads=new Brush(),rng=seeded(0x3fbe22);
  for(const [a,r] of [[.14,5.5],[.32,3.8],[.65,2.4],[1.04,2.2],[1.33,3.2],[1.85,5.8],[2.04,4.5],
    [2.77,3],[3.5,6.2],[3.88,4.1],[4.04,3.2],[4.66,4.5],[5.42,6.2],[5.61,4.2]])
    reedBed(bank,a,r,rng);
  for(const a of [.23,.64,1.03,1.32,1.50,2.68,3.42,4.44,5.51])lilyRaft(pads,a,rng);
  const reedMesh=new T.Mesh(bank.geometry(),mat);
  reedMesh.receiveShadow=true;shore.add(reedMesh);
  const padMesh=new T.Mesh(pads.geometry(),mat);padMesh.receiveShadow=true;shore.add(padMesh);
  const reflections=[];
  for(const tree of LAKE_WILLOWS){
    const brush=new Brush();willow(tree,brush);
    const geometry=brush.geometry(),wood=new T.Mesh(geometry,mat),shadow=new T.Mesh(geometry,mirror);
    wood.castShadow=wood.receiveShadow=true;
    // Projection changes the reflected crown's bounds with the camera angle.
    shadow.frustumCulled=false;shadow.renderOrder=2;
    shore.add(wood,shadow);reflections.push(shadow);
  }
  const cast=LAKE_ANIMALS[0];
  let action;
  return (time,player)=>{
    const dx=wrapDelta(FOREST_LAKE.x-player.x),dz=wrapDelta(FOREST_LAKE.z-player.z);
    shore.visible=dx*dx+dz*dz<285**2;
    if(!shore.visible)return;
    shore.position.set(player.x+dx-FOREST_LAKE.x,0,player.z+dz-FOREST_LAKE.z);
    clock.value=time;
    // Rebuild neither the ink silhouettes nor the cast when returning to the bank.
    const rangeSq=wrapDelta(player.x-cast.x)**2+wrapDelta(player.z-cast.z)**2;
    actors.visible=rangeSq<54**2;
    if(actors.visible){action??=stoneSkipping(actors);action(time);}
    for(const [i,tree] of LAKE_WILLOWS.entries()){
      reflections[i].visible=wrapDelta(player.x-tree.x)**2+wrapDelta(player.z-tree.z)**2<145**2;
    }
  };
}
