import * as THREE from './vendor/three.module.min.js';
import { TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';

const TAU = Math.PI*2;
const vec = (x,y,z) => new THREE.Vector3(x,y,z);
const UP = vec(0,1,0);
export const forestTexture = name => new URL('./assets/world/'+name+'.webp'+
  (name==='forest-crowns'?'?v=perches-1':''),import.meta.url).href;

export function forestGeometry(index, perchOnly = false) {
  const family = Math.floor(index/TREE_FORMS_PER_FAMILY), habit = index%TREE_FORMS_PER_FAMILY;
  const [,form,spray,spread,bole,leafColor,tipColor,barkColor] = TREE_FAMILIES[family];
  let state = (index+1)*139669;
  const random = ()=>(state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296;
  const p=[], n=[], c=[], tex=[], ix=[];
  const base = new THREE.Color(leafColor), tips = new THREE.Color(tipColor), bark = new THREE.Color(barkColor);
  function vertex(point, normal, tile, u,v, color) {
    p.push(point.x,point.y,point.z);
    n.push(normal.x,normal.y,normal.z);
    c.push(color.r,color.g,color.b);
    tex.push(((tile%4)+.008+.984*u)/4,(3-Math.floor(tile/4)+.008+.984*v)/4);
  }
  function stick(points,radii,sides=6,fluting=false) {
    const start=p.length/3, side=vec(0,0,1), cross=vec(1,0,0);
    for(let j=0;j<points.length;j++) {
      const axis=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
      side.addScaledVector(axis,-side.dot(axis)).normalize();cross.crossVectors(axis,side).normalize();
      for(let k=0;k<=sides;k++) {
        const a=TAU*k/sides, normal=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(cross,Math.sin(a));
        const radius=radii[j]*(fluting && !j ? 1+.25*Math.cos(3*a) : 1);
        const color=bark.clone().multiplyScalar(.82+.18*Math.cos(a*2+j*.34));
        vertex(points[j].clone().addScaledVector(normal,radius),normal,15,k/sides,j/(points.length-1),color);
        if (j && k) {
          const b=start+j*(sides+1)+k;
          ix.push(b-1,b-sides-2,b, b,b-sides-2,b-sides-1);
        }
      }
    }
  }
  // A folded leaf-bearing bough has two faces and a lifted ridge. The shading
  // normals point partly skyward so the underside reflects diffuse skylight.
  function tuft(center,yaw,w,h,slope,tint) {
    const start=p.length/3, dx=Math.cos(yaw), dz=Math.sin(yaw);
    const face=vec(-dz*.54,.84,dx*.54).normalize();
    const tip=vec(-dz*slope*.72,h,dx*slope*.72);
    for(let j=0;j<2;j++) for(let k=0;k<3;k++) {
      const v=j-.5, u=(k-1)*.5;
      const fold=k===1 ? w*.18:0;
      const at=center.clone().addScaledVector(tip,v);
      at.x+=dx*u*w-dz*fold;at.z+=dz*u*w+dx*fold;
      at.y+= (k===1 ? .075 : -.025)*h;
      const shade=tint.clone().multiplyScalar(.87+j*.10+(k===1?.035:0));
      vertex(at,face,spray,k/2,j,shade);
    }
    ix.push(start,start+1,start+3,start+3,start+1,start+4,
      start+1,start+2,start+4,start+4,start+2,start+5);
  }
  const crownWidth=spread*[.94,.82,1.01,1.13][habit];
  const clear=bole+[.065,-.025,.025,-.08][habit], height=[1,.97,.88,.82][habit];
  const rake=[.01,.06,.22,.045][habit];
  const cone=form==='spire', cane=form==='canes', willow=form==='weeping';
  const count=cane?[6,9,7,11][habit]:habit===1?2:habit===3?3:1;
  for(let stem=0;stem<count;stem++) {
    const angle=stem*2.399+random()*.5;
    const scale=stem===0?height:height*(.68+random()*.27);
    const lateral=stem===0 ? 0 : (cane?.13:.28);
    const foot=cane?vec(Math.cos(angle)*.065,0,Math.sin(angle)*.065):vec(0,0,0);
    const spine=t=>vec(foot.x + scale*(rake*t*t + Math.cos(angle)*lateral*t + (cone||cane?.007:.074)*Math.sin(t*6.4+stem)*t),
      scale*t-(cane?.034:.018), foot.z + scale*(Math.sin(angle)*lateral*t + (cone||cane?.009:.042)*Math.sin(t*7.2+habit)*t));
    const thickness=(cane?.009:cone?.026:.034)*(stem===0?1:.61);
    const spineT=[0,.08,.27,.48,.69,.89,1];
    stick(spineT.map(spine),spineT.map(t=>thickness*(1-.97*t)**.76),cane?5:8,true);
    if(cane) {
      for(let j=1;j<=7;j++) {
        const t=j*.121, rad=thickness*(1-.97*t)**.76*1.25;
        stick([spine(t-.002),spine(t+.003)],[rad,rad],5);
      }
    }
    const layers=cone ? 8 : cane ? 5 : 7;
    for(let layer=0;layer<layers;layer++) {
      const f=layer/(layers-1), level=clear+(1-clear)*f*.92;
      const whorl=cone?5:(cane?1:stem===0?3:2);
      for(let j=0;j<whorl;j++) {
        const yaw=layer*2.399+j*TAU/whorl+random()*.52;
        const dx=Math.cos(yaw),dz=Math.sin(yaw), origin=spine(level);
        let radius=crownWidth*(cone?1-.86*f:.57+.43*Math.sin(Math.PI*(.17+f*.74)))*(1-.64*f**2);
        if(form==='vase') radius*=.66+.72*Math.sin(f*2.3);
        if(form==='pine') radius*=1.10-.16*(layer%2);
        radius*=(.8+random()*.3)*(stem===0?1:.7);
        if(cane) radius*=.7;
        const lift=(cone?-.08 : willow?.095 : form==='pine'?.033 : form==='vase'?.20:.15)*(.52+.76*random());
        const swept=habit===2 ? radius*.45 : 0;
        const swing=radius*(random()-.5)*(cane||cone?.26:.55);
        const elbow=origin.clone().add(vec(dx*radius*.37+swept*.28-dz*swing,lift*.18+.015,dz*radius*.37+dx*swing));
        const end=origin.clone().add(vec(dx*radius+swept,lift*(.8+random()*.38),dz*radius));
        // A bare spur below the first leafy whorl provides a visible landing
        // place. The sampled contact and the rendered bark share both rings.
        if (!cane && stem===0 && layer===0 && j===0) {
          const az=yaw-.64;
          const root=origin.clone().lerp(elbow,.77);
          const bend=root.clone().add(vec(Math.cos(az)*radius*.41,-.106,Math.sin(az)*radius*.41));
          const tip=bend.clone().add(vec(Math.cos(az)*radius*.66,.021,Math.sin(az)*radius*.66));
          if(perchOnly){
            const toe=bend.clone().lerp(tip,.59);
            return {x:toe.x,y:toe.y+.005,z:toe.z,yaw:Math.atan2(tip.x-bend.x,tip.z-bend.z)};
          }
          stick([root,bend,tip],[thickness*.51,.009,.0028],6);
        }
        stick([origin,elbow,end],[thickness*.48*(1-.54*f),thickness*.27*(1-.48*f),.0014],4);
        if(!cone && !cane && (layer+j)%2===0) {
          const forkYaw=yaw+(j%2?-.85:.85), forkSize=radius*(.39+.26*random());
          const fork=elbow.clone().add(vec(Math.cos(forkYaw)*forkSize,lift*.72+.045,Math.sin(forkYaw)*forkSize));
          stick([elbow,elbow.clone().lerp(fork,.48).add(vec(0,-.015,0)),fork],
            [thickness*.22,thickness*.14,.001],4);
          const forkHue=base.clone().lerp(tips,.26+random()*.43);
          tuft(fork,forkYaw,.21*(1-.35*f),willow?.26:form==='pine'?.10:.16,.13,forkHue);
        }
        const sprays=cone?3:cane?3:4;
        for(let k=0;k<sprays;k++) {
          const t=.34+.64*k/(sprays-1), pos=elbow.clone().lerp(end,t);
          const direction=yaw+(k%2===0?-1:1)*(.38+random()*.62);
          const size=(cone?.18:cane?.14:.205)*(1-.36*f)*(stem===0?1:.82)*(.87+random()*.22);
          const hue=base.clone().lerp(tips,.15+.35*random()+.36*f);
          if(family===4) hue.lerp(tips,.48);
          if(form==='blossom') hue.lerp(tips,random()*.52);
          if(willow) {
            const length=(.20+.19*random())*(1-.39*f);pos.y-=length*.39;
            tuft(pos,direction,size*.87,length,size*.15,hue);
          } else if(cone || form==='pine') {
            tuft(pos,direction+1.1,size*1.57,size*(cone?.68:.60),size*.72,hue);
          } else {
            pos.y+=size*.22;
            tuft(pos,direction,size*1.42,size*(cane?1.3:1.12),size*(.38+.36*random()),hue);
          }
        }
      }
    }
    if(cone) tuft(spine(.972),angle,.11,.15,.06,tips);
  }
  const g=new THREE.BufferGeometry();
  for(const [key,data,size] of [['position',p,3],['normal',n,3],['color',c,3],['uv',tex,2]])
    g.setAttribute(key,new THREE.Float32BufferAttribute(data,size));
  g.setIndex(ix);
  return g;
}

export function forestMaterial(texture) {
  const mat=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,alphaTest:.36,side:THREE.DoubleSide});
  mat.onBeforeCompile=shader=>{
    // Leaf clusters represent a volume with sky-facing normals on both sides.
    // Cylindrical bark in the final atlas tile keeps its regular normals.
    shader.vertexShader='varying float treeLeaf;\n'+shader.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\ntreeLeaf=(uv.x>.75 && uv.y<.25)?0.:1.;');
    shader.fragmentShader='varying float treeLeaf;\n'+shader.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\nif(!gl_FrontFacing && treeLeaf>.5) normal=-normal;');
  };
  return mat;
}
