// Animated water stays in its own basin. The petals share a rigid transform
// around each blossom; turning the head into a source increases its spray.
import * as T from './vendor/three.module.min.js';
import { jetContacts, interceptedJetGLSL } from './falling-water-contact.js';
import { villagePools } from './village-bath-courses.js';

const {PI,sin,cos}=Math,tau=2*PI,records=new Map();
function hue(color){return new T.Color(color);}
export function registerWaterMotion(p,site){
  const active={value:0},focus={value:new T.Vector2()},direction={value:new T.Vector2(0,1)};
  const flow=new T.MeshPhysicalMaterial({side:T.DoubleSide,vertexColors:true,transparent:true,opacity:.76,
    depthWrite:false,roughness:.22,clearcoat:.27});
  flow.onBeforeCompile=shader=>{
    shader.uniforms.flowClock=p.sway;shader.uniforms.pressure=active;shader.uniforms.jetContacts=jetContacts;
    shader.vertexShader='uniform float flowClock,pressure;varying vec3 currentPoint, worldFlow;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>',`#include <begin_vertex>
      currentPoint=position;
      vec4 wp=vec4(position,1.);
      #ifdef USE_INSTANCING
        wp=instanceMatrix*wp;
      #endif
      worldFlow=(modelMatrix*wp).xyz;
      transformed.x+=.008*sin(flowClock*6.+position.y*9.)*(1.+.85*pressure);`);
    shader.fragmentShader=interceptedJetGLSL+'uniform float flowClock,pressure;varying vec3 currentPoint,worldFlow;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float crest=.5+.5*sin(currentPoint.y*31.+flowClock*(7.+pressure)+sin(currentPoint.x*44.+currentPoint.z*19.)*1.35);
      diffuseColor.rgb+=vec3(.26,.31,.26)*pow(crest,5.);
      diffuseColor.a*=(.69+.31*crest)*fallingCoverage(worldFlow);`);
  };
  flow.customProgramCacheKey=()=> 'village-running-water';
  const values={site,clock:p.sway,flow,active,focus,direction};records.set(site.kind,values);return values;
}
export function updateVillageTreatment(player){
  const pose=player.activity==='bath'?player.bathPose:null;
  for(const v of records.values()){
    const site=v.site,x=(pose?.x??player.x)-site.x,z=(pose?.z??player.z)-site.z;
    const nearby=x*x+z*z<100,amount=nearby&&pose?.wet?pose.settle:0;
    v.active.value=amount;
    if(!amount)continue;
    const co=cos(site.yaw),si=sin(site.yaw);
    v.focus.value.set(x*co-z*si,x*si+z*co);
    const heading=(pose.heading??player.heading)-site.yaw;
    v.direction.value.set(sin(heading),cos(heading));
  }
}
function seeded(seed){
  let val=seed;
  return ()=>{val=(1664525*val+1013904223)>>>0;return val/4294967296;};
}
export function flowerRafts(){
  const rng=seeded(741981),positions=[],colors=[],centres=[],drifts=[],indices=[];
  const inks=['#e8a7b2','#f4c7c3','#db98aa','#ead1c9','#efd5c1'].map(hue);
  const shadow=hue('#bd798f');
  for(let j=0;j<158;j++){
    // Groups of five attached petals, loose petals and a bank of petals
    // dislodged from the woven strainer. The central face remains in view.
    const lane=j%5,angle=rng()*tau;
    const ring=.5+.33*rng(),dx=(j<32?-2.32+.75*rng():lane===0?-.93+1.54*rng():siteX(ring,angle)),
      dz=j<32?-1.79+.78*rng():lane===0?-2.08+.68*rng():2.73*sin(angle)*ring;
    const f=rng(),group=j%4===0,pieces=group?5:1,rotation=rng()*tau,scale=group?.13+.055*rng():.085+.07*rng();
    for(let k=0;k<pieces;k++){
      const a=rotation+k*tau/5,ct=cos(a),st=sin(a),paint=inks[(j+k)%inks.length];
      const petals=[[0,-.13],[-.38,.16],[-.61,.56],[-.42,.87],[-.18,1.02],[0,.86],[.22,1.02],[.52,.83],[.58,.54],[.39,.17]];
      const append=(u,v,h,t)=>{
        positions.push(dx+scale*(ct*u+st*v),.028+scale*h,dz+scale*(ct*v-st*u));
        const col=shadow.clone().lerp(paint,t);colors.push(col.r,col.g,col.b);
        centres.push(dx,dz);drifts.push(f,angle);return positions.length/3-1;
      };
      const mid=append(0,.4,-.020,.83),edge=petals.map(([u,v])=>append(u,v,.13*Math.abs(u)+.121*v,.62+.36*v));
      for(let e=0;e<edge.length;e++)indices.push(mid,edge[e],edge[(e+1)%edge.length]);
    }
  }
  function siteX(r,a){return 4.45*r*cos(a);}
  const g=new T.BufferGeometry();
  for(const [name,arr,size] of [['position',positions,3],['color',colors,3],['cluster',centres,2],['current',drifts,2]])
    g.setAttribute(name,new T.Float32BufferAttribute(arr,size));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=2;
  return g;
}
export function addBathFlowers(p,f,site,source){
  const mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  mat.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{waterClock:source.clock,bather:source.focus,axis:source.direction,touch:source.active});
    shader.vertexShader='attribute vec2 cluster,current;uniform float waterClock,touch;uniform vec2 bather,axis;\n'+
      shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float t=waterClock*.21+current.x*6.28;
      vec2 natural=cluster+vec2(.15*cos(t+cluster.y),.12*sin(t+cluster.x));
      float route=current.y+.21*waterClock;
      vec2 radial=vec2(cos(route)*(1.12+.42*current.x),sin(route)*(2.05+.37*current.x));
      vec2 eddy=bather+vec2(axis.y,-axis.x)*radial.x+axis*radial.y;
      vec2 orbit=mix(natural,eddy,.79*touch);
      transformed.xz+=orbit-cluster;
      transformed.y+=.009*sin(t*2.1+cluster.y);`);
  };
  mat.customProgramCacheKey=()=> 'petals-enter-the-float';
  p.shapes.floatingHanaikada=flowerRafts();
  f.put('floatingHanaikada',0,0,0,1,1,1,'#fff',mat);
}
const splashHeads={
  sakura:[[-2.46,-1.93,0,.33]],bamboo:[[-2.28,-.66,0,.20],[-1.68,-.66,0,.20],[-1.08,-.66,0,.20]],
  sulfur:[[-1.55,-3.02,.56,.31],[-.87,-1.02,0,.45]],paddy:[[-2.15,-.77,0,.23],[1.77,-.77,0,.23],[-3.68,-2.97,.24,.18]],
  shore:[[-2.15,-1.31,0,.29],[1.53,-1.60,-.10,.19]],maple:[[-1.53,-1.22,0,.33],[1.54,-1.22,0,.27]],susuki:[[-3.23,-.72,0,.21]],
};
export function treatmentFoam(p,f,site,motion){
  const heads=splashHeads[site.kind]||villagePools(site).map(q=>[q.u,q.v-q.rz+.65,q.y,.20]);
  const rng=seeded(311564),pos=[],attrs=[],indices=[];
  for(const [x,z,y,r] of heads){
    for(let j=0;j<14;j++){
      const a=rng()*tau,phase=rng(),radius=r*(.62+.75*rng()),size=.014+.022*rng();
      const start=pos.length/3;
      for(const [u,v] of [[0,1],[-1,0],[0,-1],[1,0],[0,.30]]){
        pos.push(x+u*size*cos(a),y+.028+(v+1)*size,z-u*size*sin(a)+(u===0&&v===.30?size:0));
        attrs.push(Math.cos(a)*radius,Math.sin(a)*radius,phase,.10+rng()*.14);
      }
      indices.push(start,start+1,start+4,start+1,start+2,start+4,start+2,start+3,start+4,start+3,start,start+4);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('drops',new T.Float32BufferAttribute(attrs,4));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=.70;
  const mat=new T.MeshBasicMaterial({color:'#d4dfce',transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.waterClock=motion.clock;shader.uniforms.touch=motion.active;
    shader.vertexShader='attribute vec4 drops;uniform float waterClock,touch;varying float wetDrop;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float t=fract(waterClock*(.86+.34*drops.z)+drops.z);
      transformed.xz+=drops.xy*t;transformed.y+=(drops.w+.10*touch)*4.*t*(1.-t);
      wetDrop=sin(3.14159*t);`);
    shader.fragmentShader='varying float wetDrop;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=wetDrop;');
  };
  mat.customProgramCacheKey=()=> 'bath-impact-droplets';
  const key='village-foam-'+site.kind;p.shapes[key]=g;f.put(key,0,0,0,1,1,1,'#fff',mat);
}
export function thermalVapour(p,f,source){
  const positions=[],data=[],uv=[],ix=[],rng=seeded(97413);
  for(const [cx,cz,y,spread] of [[-1.15,-2.71,.57,.94],[-.69,-.94,.03,.47],[.70,1.12,.02,1.16]]){
    for(let n=0;n<15;n++){
      const a=rng()*tau,rr=Math.sqrt(rng())*spread,x=cx+rr*cos(a),z=cz+rr*sin(a),w=.22+.25*rng(),h=.59+.63*rng(),phase=rng();
      const start=positions.length/3;
      for(let j=0;j<=7;j++)for(let i=0;i<3;i++){
        const v=j/7,u=i/2,sw=(u-.5)*2*w*(.47+v),sway=.16*sin(PI*v+phase*2);
        positions.push(x+sw*cos(a)+sway,y+h*v,z+sw*sin(a)+.15*v);
        uv.push(u,v);data.push(phase,h);
        if(j<7&&i<2){const b=start+j*3+i;ix.push(b,b+1,b+3,b+1,b+4,b+3);}
      }
    }
  }
  const g=new T.BufferGeometry();g.setIndex(ix);g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('wisp',new T.Float32BufferAttribute(data,2));
  g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere.radius+=1.20;
  const mat=new T.MeshBasicMaterial({color:'#d3d0ad',transparent:true,opacity:.39,depthWrite:false,side:T.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.breathe=source.clock;
    shader.vertexShader='attribute vec2 wisp;uniform float breathe;varying vec2 paper;varying float heat;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float t=fract(breathe*.19+wisp.x);transformed.y+=wisp.y*.65*t;
      transformed.x+=.18*sin(breathe*.51+wisp.x*12.+uv.y*3.)*uv.y;
      transformed.z+=.13*cos(breathe*.43+wisp.x*21.+uv.y*4.)*uv.y;
      paper=uv;heat=sin(3.14159*t);`);
    shader.fragmentShader='varying vec2 paper;varying float heat;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float edge=1.-smoothstep(.14,1.,abs(paper.x*2.-1.));
      diffuseColor.a*=edge*sin(3.14159*paper.y)*heat*.41;`);
  };
  mat.customProgramCacheKey=()=> 'yunohana-breath';
  p.shapes.sinterVapour=g;f.put('sinterVapour',0,0,0,1,1,1,'#fff',mat);
}
