import * as THREE from './vendor/three.module.min.js';
import { terrainContactHeight, seeded, WATER_Y } from './terrain.js';
import { autumnLeafMaterial, autumnLeafPigments } from './autumn-leaf-art.js';
import { wetStone } from './stone-water.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { KAEDE_WATER_TREADS } from './kaede-water-steps.js';

// The long edge of each split stone crosses the path. Give its nosing a
// shallow hollow where feet pass, keeping the broad tread at its walk height.
function splitFlag(mesh,step,origin,random,u0,u1,v0,v1) {
  const c=Math.cos(step.yaw),s=Math.sin(step.yaw);
  const wx=(u,v)=>step.x+c*u+s*v, wz=(u,v)=>step.z-s*u+c*v;
  const world=(u,y,v)=>[wx(u,v)-origin.x,y-origin.y,wz(u,v)-origin.z];
  const w=u1-u0,d=v1-v0,cut=Math.min(.115,w*.13,d*.22);
  const nicks=Array.from({length:4},()=>cut*(.36+.61*random()));
  const left=v0+d*(.28+.38*random()),right=v0+d*(.30+.38*random());
  const crown=u0+w*(.36+.28*random());
  const plan=[
    [u0,v0+nicks[0]],[u0+.015*random(),left],[u0,v1-nicks[1]],
    [u0+nicks[1],v1],[crown-.068*w,v1-.012*random()],[crown+.088*w,v1-.019*random()],
    [u1-nicks[2],v1],[u1,v1-nicks[2]],[u1-.015*random(),right],
    [u1,v0+nicks[3]],[u1-nicks[3],v0],[u0+nicks[0],v0],
  ];
  const cx=(u0+u1)/2,cz=(v0+v1)/2, top=step.y;
  const stone=new THREE.Color().lerpColors(new THREE.Color('#858475'),new THREE.Color('#a09b88'),random());
  // A little water wicked up from the river also darkens the first two risers.
  const damp=Math.max(0,1-(top-WATER_Y)/.85);
  stone.lerp(new THREE.Color('#646f65'),damp*.53);
  const lichen=new THREE.Color('#758166'), shade=stone.clone().multiplyScalar(.76);
  const capDepth=.215+.037*random();
  const grain=random()*7,seed=random()*32;
  const rim=plan.map(([u,v],i)=>{
    const frontWear=i===4||i===5;
    const bevel=.015+.018*random()+(frontWear ? .017 : 0);
    const U=u+(cx-u)*bevel/(w/2),V=v+(cz-v)*bevel/(d/2);
    const faceY=top-.001-.006*random()-(frontWear ? .006 : 0);
    const lipY=faceY-bevel*.74-.006*random();
    return {u,v,U,V,top:world(U,faceY,V),lip:world(u,lipY,v),
      heel:world(u+(cx-u)*.024,top-capDepth,v+(cz-v)*.035),
      color:stone.clone().lerp(lichen,.06+random()*.22)};
  });
  const center=world(cx,top,cz);
  let length=0;
  for(let i=0;i<rim.length;i++){
    const a=rim[i],b=rim[(i+1)%rim.length];
    const next=length+Math.hypot(a.u-b.u,a.v-b.v);
    const topUv=(u,v)=>[grain+u*1.15,v*1.15];
    mesh.face('stone',stone,[center,a.top,b.top],{
      colors:[stone,a.color,b.color],uvs:[topUv(cx,cz),topUv(a.U,a.V),topUv(b.U,b.V)],seed,
    });
    const sideUv=(lo,hi)=>[[grain+length,hi],[grain+length,lo],[grain+next,lo],[grain+next,hi]];
    mesh.face('stone',stone,[a.top,a.lip,b.lip,b.top],{
      colors:[a.color,stone,stone,b.color],uvs:sideUv(-.035,0),seed,
    });
    mesh.face('stone',stone,[a.lip,a.heel,b.heel,b.lip],{
      colors:[stone,shade,shade,stone],uvs:sideUv(-capDepth,-.035),seed,
    });
    length=next;
  }
}

// Below the thin stair flags, the backing is one bank of dry-laid stone per
// flight. Its beds run horizontally across several risers and break joint.
function retainingBed(mesh,origin,step,width,depth,crown,random) {
  const c=Math.cos(step.yaw),s=Math.sin(step.yaw);
  const local=(u,y,v)=>[step.x+c*u+s*v-origin.x,y-origin.y,step.z-s*u+c*v-origin.z];
  const bounds=[[-width/2,-depth/2],[-width/2,depth/2],[width/2,depth/2],[width/2,-depth/2]];
  const core='#716e5f';
  mesh.face('stone',core,bounds.map(([u,v])=>local(u,crown(v),v)),{grain:'z',seed:6});
  for(let side=0;side<4;side++) {
    const [u,v]=bounds[side], [u2,v2]=bounds[(side+1)%4];
    const len=Math.hypot(u2-u,v2-v),du=(u2-u)/len,dv=(v2-v)/len;
    const at=(along,y,out=0)=>local(u+du*along-dv*out,y,v+dv*along+du*out);
    const roof=(along)=>crown(v+dv*along);
    const ground=(along)=>{
      const [x,,z]=at(along,0,.08);
      return terrainContactHeight(x+origin.x,z+origin.z);
    };
    const panels=Math.max(2,Math.ceil(len/.34));
    const samples=Array.from({length:panels+1},(_,i)=>ground(len*i/panels));
    const floor=Math.min(...samples)-.14;
    function aboveSoil(a,b,high) {
      const last=Math.min(panels,Math.ceil(b*panels/len));
      for(let i=Math.floor(a*panels/len);i<=last;i++)if(samples[i]<high+.10)return true;
      return false;
    }
    // The recessed, unbroken face behind the split stones closes every joint.
    for(let i=0;i<panels;i++){
      const a=len*i/panels,b=len*(i+1)/panels;
      mesh.face('stone',core,[at(a,roof(a)),at(a,floor),at(b,floor),at(b,roof(b))],{
        uvs:[[a,roof(a)],[a,floor],[b,floor],[b,roof(b)]],seed:4,
      });
    }
    const course=.235;
    for(let row=Math.floor(floor/course);row*course<Math.max(roof(0),roof(len));row++){
      const low=row*course,high=low+course;
      let a=0;
      while(a<len-.001){
        const pitch=(a===0 ? .30 : .53)+.28*random();
        const b=Math.min(len,a+pitch),seed=random()*20, tint=new THREE.Color().lerpColors(
          new THREE.Color('#777868'),new THREE.Color('#8c8976'),random());
        if(Math.max(roof(a),roof(b))>low+.025 && aboveSoil(a,b,high)) {
          // Clip the ends of fieldstones to the descending seat of the flight.
          const dy=roof(b)-roof(a);
          const cross=Math.abs(dy)>.001 ? a+(low+.018-roof(a))*(b-a)/dy : a;
          const lo=(roof(a)<low+.018 ? cross : a)+.004;
          const hi=(roof(b)<low+.018 ? cross : b)-.004;
          if(hi>lo+.035){
            const top=t=>Math.min(high-.003,roof(t));
            const h1=top(lo)-low,h2=top(hi)-low;
            const chip=(hi-lo)*(.04+.065*random()),lip=.013+.018*random();
            const outline=[[lo+chip,low+.003],[lo,low+.16*h1],[lo,top(lo)-.14*h1],
              [lo+chip,top(lo+chip)],[hi-chip*.57,top(hi-chip*.57)],
              [hi,top(hi)-.24*h2],[hi,low+.16*h2],[hi-chip,low+.003]];
            for(let j=0;j<outline.length;j++){
              const [t,y]=outline[j],[t2,y2]=outline[(j+1)%outline.length];
              mesh.face('stone',tint,[at(t,y,lip),at(t2,y2,lip),at(t2,y2,-.002),at(t,y,-.002)],{
                uvs:[[t,y],[t2,y2],[t2,y2+.012],[t,y+.012]],seed,
              });
            }
            const face=outline.reverse();
            mesh.face('stone',tint,face.map(([t,y])=>at(t,y,lip)),{uvs:face,seed});
          }
        }
        a=b;
      }
    }
  }
}

function backing(mesh,treads,origin,random) {
  for(let i=0;i<treads.length;i++){
    const q=treads[i];
    if(q.isLanding){
      retainingBed(mesh,origin,q,q.width-.08,q.depth-.06,()=>q.y-.15,random);
      continue;
    }
    const first=i;
    while(i+1<treads.length && !treads[i+1].isLanding)i++;
    const last=treads[i],span=Math.hypot(last.x-q.x,last.z-q.z);
    const frame={x:(q.x+last.x)/2,z:(q.z+last.z)/2,yaw:q.yaw};
    // The light curve of the long run follows the survey tread for tread.
    const crown=v=>{
      const n=Math.max(0,Math.min(i-first,(v/span+.5)*(i-first)));
      const j=Math.floor(n),a=treads[first+j].y,b=treads[Math.min(first+j+1,i)].y;
      return a+(b-a)*(n-j)-.155;
    };
    retainingBed(mesh,origin,frame,q.width-.08,span+q.depth+.09,crown,random);
  }
}

export function dressKaedeWaterSteps(p) {
  const origin=KAEDE_WATER_TREADS[0], mesh=hokoraCarpentry(), random=seeded(0x29c14b8d);
  for(const step of KAEDE_WATER_TREADS){
    const w=step.width/2,d=step.depth/2;
    if(step.isLanding && w>.53 && d>.42) {
      // Broad turning stones split along a natural joint at the landing.
      const joint=(random()-.5)*w*.61;
      splitFlag(mesh,step,origin,random,-w,joint-.005,-d,d);
      splitFlag(mesh,step,origin,random,joint+.005,w,-d,d);
    } else splitFlag(mesh,step,origin,random,-w,w,-d,d);
  }
  backing(mesh,KAEDE_WATER_TREADS,origin,random);
  const geometry=mesh.finish();
  geometry.deleteAttribute('finishId');
  p.shapes.kaedeWaterSteps=geometry;
  const granite=p.stone.map;
  const material=new THREE.MeshStandardMaterial({map:granite,bumpMap:granite,bumpScale:.014,
    vertexColors:true,side:THREE.DoubleSide,roughness:.93,envMapIntensity:.24});
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 stepGranite=texture2D(map,vMapUv).rgb;
      float grain=dot(stepGranite,vec3(.28,.58,.14));
      diffuseColor.rgb*=.71+.86*mix(vec3(grain),stepGranite,.20);
    `);
  };
  wetStone(material,WATER_Y,p.sway);
  p.part('kaedeWaterSteps',origin.x,origin.y,origin.z,1,1,1,'#ffffff',0,0,0,material,true,true);

  // The outer shoulders catch a few leaves above the wash line.
  for(const step of KAEDE_WATER_TREADS) {
    if(step.y<WATER_Y+.25 || random()>.21)continue;
    const side=(random()<.5 ? -1 : 1)*step.width*(.25+.07*random());
    const width=.11+.055*random(),yaw=random()*2*Math.PI;
    const ink=autumnLeafPigments.maple[Math.floor(random()*autumnLeafPigments.maple.length)];
    p.part('fallenMaple',step.x+Math.cos(step.yaw)*side,step.y+.004,step.z-Math.sin(step.yaw)*side,
      width,width,width,ink,yaw,0,0,autumnLeafMaterial(),false,40);
  }
}
