import * as THREE from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { terrainHeight, wrapDelta } from './terrain.js';
const TAU=2*Math.PI;

// Fieldstone retaining blocks hold a level shelf on the sloping meadow.
// Split pine is cribbed in two courses over an ash bed, even when the fire is out.
function firePits(hearths) {
  const art=sculpture(), stone=new THREE.DodecahedronGeometry(1,1);
  const char=['#503a2c','#5c4a3e','#73553f'];
  const grain=stone.getAttribute('position'),v=new THREE.Vector3();
  for(let i=0;i<grain.count;i++){
    v.fromBufferAttribute(grain,i);
    const cut=1+.096*Math.sin(7*v.x+3*v.y)*Math.cos(8*v.z-5*v.y);
    grain.setXYZ(i,v.x*cut,v.y*cut,v.z*cut);
  }
  stone.computeVertexNormals();
  art.add(stone,'#6f6c5f',0,-.31,0,.70,.42,.78,0,.28);
  for(let i=0;i<7;i++){
    const a=i*TAU/7+.14;
    art.add(stone,i%3?'#8f8871':'#aba18a',.51*Math.cos(a),-.17,.56*Math.sin(a),.24,.28,.32,.17,a,.06*i);
  }
  art.post('#4d4841',0,-.053,0,.49,.075,.53);
  for(let i=-1;i<=1;i++){
    art.post(char[i+1],0,.026,i*.26,.103,1.06,.105,0,0,Math.PI/2+.032*i);
    art.post(char[1-i],i*.27,.20,0,.10,.94,.099,Math.PI/2,.08*i,.06);
    art.post('#ad8c65',i*.27,.20,.473,.084,.012,.083,Math.PI/2);
  }
  for(let i=0;i<9;i++){
    const x=.29*Math.sin(i*1.79),z=.27*Math.cos(i*2.31),a=i*2.4;
    art.post(i%3?'#80644b':'#968064',x,.31+i*.012,z,.026,.55+.12*Math.sin(i),.029,Math.PI*.49,a,.06*Math.cos(i*3));
  }
  const pits=new THREE.InstancedMesh(art.finish(),new THREE.MeshLambertMaterial({vertexColors:true}),hearths.length);
  const dummy=new THREE.Object3D();
  hearths.forEach(([x,y,z],i)=>{
    dummy.position.set(x,y-.11,z);dummy.rotation.y=.42*Math.sin(i*1.77);
    dummy.scale.setScalar(.90+.12*Math.cos(i*2.51));dummy.updateMatrix();pits.setMatrixAt(i,dummy.matrix);
  });
  pits.name='火床の石組みと割松';pits.receiveShadow=true;
  return pits;
}
// Low amber light washes across the actual grade. All of the firebeds
// share one feathered mesh, without adding a light for each flame.
function groundLight(hearths) {
  const pos=[],uv=[],tri=[];
  for(const [x,,z] of hearths) {
    const first=pos.length/3;
    for(let j=0;j<=3;j++)for(let i=0;i<=3;i++){
      const u=i/3,v=j/3,xx=x+(u-.5)*3.1,zz=z+(v-.5)*3.7;
      pos.push(xx,terrainHeight(xx,zz)+.12,zz);uv.push(u,v);
      if(i<3&&j<3){const k=first+j*4+i;tri.push(k,k+4,k+1,k+1,k+4,k+5);}
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(tri);
  const mat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-2,uniforms:{intensity:{value:0}},
    vertexShader:`varying vec2 washUv;void main(){washUv=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 washUv;uniform float intensity;void main(){
      float radius=dot(washUv,washUv);
      float glow=pow(max(0.,1.-radius),2.5);
      // The same ground darkens with old charcoal when the stack is cold.
      float ash=1.-smoothstep(.21,.57,radius+.045*sin(13.*washUv.x+4.*washUv.y));
      vec3 tint=mix(vec3(.08,.066,.049),vec3(.95,.27,.055),intensity);
      gl_FragColor=vec4(tint,mix(.31*ash,.40*glow,intensity));
      #include <colorspace_fragment>
    }`,
  });
  const mesh=new THREE.Mesh(geo,mat);mesh.name='火床に映る照り返し';mesh.renderOrder=5;return mesh;
}

export function mountainFires(scene,hearths,cx,cz,east=false) {
  const group=new THREE.Group();group.name=east?'東山・福の送り火':'北山・大文字の送り火';scene.add(group);
  const pits=firePits(hearths),wash=groundLight(hearths);
  group.add(pits,wash);
  const geo=new THREE.PlaneGeometry(1,1),phases=[],coords=[];
  for(let i=0;i<hearths.length;i++){
    coords.push(...hearths[i]);phases.push(i*2.391);
  }
  const sprites=new THREE.InstancedBufferGeometry().copy(geo);
  sprites.instanceCount=hearths.length;
  sprites.setAttribute('hearth',new THREE.InstancedBufferAttribute(new Float32Array(coords),3));
  sprites.setAttribute('seed',new THREE.InstancedBufferAttribute(new Float32Array(phases),1));
  const uniforms={clock:{value:0},intensity:{value:0},size:{value:east?1.74:1.94}};
  const flames=new THREE.Mesh(sprites,new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`
      attribute vec3 hearth;attribute float seed;
      uniform float clock,size;
      varying vec2 flameUv;varying float wick;
      void main(){
        flameUv=uv;wick=seed;
        vec4 spot=modelViewMatrix*vec4(hearth,1.);
        float flicker=.88+.13*sin(3.3*clock+seed)+.09*sin(6.7*clock+.31*seed);
        float breadth=size*(.91+.13*sin(2.6*seed));
        spot.x+=position.x*2.55*breadth;
        spot.y+=(uv.y-.17)*2.50*size*flicker;
        gl_Position=projectionMatrix*spot;
      }`,
    fragmentShader:`
      varying vec2 flameUv;varying float wick;
      uniform float clock,intensity;
      float noise(vec2 q){
        vec2 ip=floor(q),f=fract(q);f=f*f*(3.-2.*f);
        vec4 h=fract(sin(dot(ip,vec2(53.13,91.7))+vec4(0.,53.13,91.7,144.83))*4375.853);
        return mix(mix(h.x,h.y,f.x),mix(h.z,h.w,f.x),f.y);
      }
      float tongue(vec2 p,float base,float radius,float height,float phase){
        float v=clamp(p.y/height,0.,1.);
        float curve=.042*sin(v*8.-clock*4.+phase)*v
          +(.055*sin(clock*2.3+wick)+.045)*v*v;
        float lip=.70+.30*sin(3.14159*clamp(v*1.9,0.,1.));
        float w=radius*(1.-pow(v,.90))*lip;
        float d=w-abs(p.x-base-curve);
        float aa=max(.022+.018*v,fwidth(d)*.75);
        return smoothstep(-aa,aa,d)*smoothstep(-.040,.027,p.y)
          *(1.-smoothstep(height-aa,height+aa,p.y));
      }
      void main(){
        vec2 p=vec2(flameUv.x-.5,(flameUv.y-.16)*1.25);
        float plume=noise(vec2(p.x*9.+wick,p.y*8.-clock*3.9));
        p.x+=(plume-.5)*(.013+.088*max(0.,p.y));
        float a=clock*4.2+wick,flutter=.07*sin(a)+.042*sin(a*1.83);
        float left=tongue(p,-.093,.118,.66+flutter,wick);
        float high=tongue(p,.031,.14,.86+.07*cos(a*.73),wick+2.);
        float curl=tongue(p,.128,.083,.52-flutter,wick+3.8);
        float fire=max(left,max(high,curl));
        float amber=max(tongue(p,-.064,.079,.46+.057*cos(a),wick),
                        tongue(p,.056,.096,.65+flutter,wick+2.1));
        float hot=tongue(p,.009,.098,.32-flutter*.46,wick+1.);
        vec3 emission=mix(vec3(.92,.095,.012),vec3(1.,.44,.042),clamp(amber*.87+plume*.18,0.,1.));
        emission=mix(emission,vec3(1.,.865,.39),hot);
        float halo=.27*exp(-length((p-vec2(.005,.20))*vec2(2.6,1.22))*5.7);
        // Wind lifts an ember from each stack on a different beat.
        float age=fract(clock*.55+wick*.413);
        vec2 spark=p-vec2(.10*sin(7.*age+wick)*age,.31+.66*age);
        float ember=(1.-smoothstep(.006,.032,length(spark*vec2(1.4,1.))))*
                    sin(3.14159*age)*.9;
        float alpha=(halo+(.74+.25*plume)*fire+ember)*intensity;
        if(alpha<.009)discard;
        vec3 color=mix(vec3(.99,.19,.042),emission,fire);
        gl_FragColor=vec4(mix(color,vec3(1.,.67,.17),ember),min(1.,alpha));
        #include <colorspace_fragment>
      }`,
  }));
  flames.frustumCulled=false;flames.renderOrder=6;group.add(flames);
  return (time,night,player)=>{
    const dx=wrapDelta(cx-player.x),dz=wrapDelta(cz-player.z),range=668;
    group.visible=dx*dx+dz*dz<range**2 && (night>.08 || dx*dx+dz*dz<490**2);
    if(!group.visible)return;
    group.position.set(player.x+dx-cx,0,player.z+dz-cz);
    flames.visible=night>.08;pits.visible=dx*dx+dz*dz<250**2;
    uniforms.clock.value=time;uniforms.intensity.value=Math.max(0,Math.min(1,(night-.08)*1.3));
    wash.material.uniforms.intensity.value=uniforms.intensity.value;
  };
}
