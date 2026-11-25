import * as T from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadGeometry,timberBarkTint,timberBarkUV } from './homestead-carpentry.js';
import { homesteadFinish } from './homestead-pigment.js';
import { isBambooStock } from './homestead-timber-section.js';

// An illustrated detail of the cut can be shown from a boat or on a cliff.
// The floor, performer and wood live in one frame with their own lighting.
export function forestryCloseup(tree,cut){
  const scene=new T.Scene();
  scene.background=new T.Color('#e6e1cf');
  scene.fog=new T.FogExp2('#e6e1cf',.052);
  scene.add(new T.HemisphereLight('#fff5db','#9b997a',2.15));
  const sun=new T.DirectionalLight('#ffedce',2.3);
  sun.position.set(-3,5,4);scene.add(sun);
  const bamboo=isBambooStock(tree.kind),r=cut.radius;
  const stump=new T.Mesh(homesteadGeometry('stump','plain',tree.kind),homesteadFinish());
  stump.scale.set(r/(bamboo?.28:.31),1,r/(bamboo?.28:.31));scene.add(stump);
  const body=hokoraCarpentry(), sides=bamboo?20:18, wood=timberBarkTint(tree.kind);
  const at=(i,y)=>{
    const a=2*Math.PI*i/sides;
    const furrow=bamboo?1:1+.087*Math.sin(3*a+.17)+.037*Math.cos(7*a);
    const taper=1-Math.min(.25,(y-.42)*.023);
    const node=bamboo && Math.abs((y-.42)%1.05-.54)<.025?1.07:1;
    const rad=r*furrow*taper*node;
    return [Math.cos(a)*rad+.012*(y-.42)**1.4,y+(bamboo?.004*Math.sin(3*a):.010*Math.cos(a)+.005*Math.sin(5*a)),Math.sin(a)*rad-.014*(y-.42)];
  };
  const heights=[.42];
  for(let y=.42;y<8;y+=1.05)heights.push(y+.51,y+.54,y+.568,y+1.05);
  for(let j=1;j<heights.length;j++)for(let i=0;i<sides;i++){
    const y=heights[j-1],h=heights[j];
    body.face(bamboo?'culmSkin':'stumpBark',wood,[at(i,y),at(i,h),at(i+1,h),at(i+1,y)],
      {uvs:[timberBarkUV(y,i/sides),timberBarkUV(h,i/sides),timberBarkUV(h,(i+1)/sides),timberBarkUV(y,(i+1)/sides)]});
  }
  const stem=new T.Mesh(body.finish(),homesteadFinish());scene.add(stem);
  // Dry-brush stipples, leaf litter and a soft contact wash give the feet
  // a legible plane even when the actual site is under water or tightly packed.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384;
  const g=canvas.getContext('2d');g.fillStyle='#d2cbb5';g.fillRect(0,0,384,384);
  let n=tree.seed>>>0;
  const random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<9500;i++){
    g.fillStyle=i%7===0?'rgba(91,83,62,.19)':'rgba(248,242,208,.24)';
    g.fillRect(random()*384,random()*384,.6+random()*4,.3+random()*1.2);
  }
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(36,36);texture.colorSpace=T.SRGBColorSpace;
  const floor=new T.Mesh(new T.PlaneGeometry(96,96),new T.MeshLambertMaterial({map:texture}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.012;scene.add(floor);
  const contact=document.createElement('canvas');contact.width=contact.height=96;
  const ink=contact.getContext('2d'),wash=ink.createRadialGradient(48,48,3,48,48,46);
  wash.addColorStop(0,'rgba(75,65,46,.34)');wash.addColorStop(.62,'rgba(82,76,59,.16)');wash.addColorStop(1,'rgba(82,76,59,0)');
  ink.fillStyle=wash;ink.fillRect(0,0,96,96);
  const shadowMap=new T.CanvasTexture(contact),shadowMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false});
  const shade=new T.Mesh(new T.PlaneGeometry(1,1),shadowMat);shade.rotation.x=-Math.PI/2;
  shade.scale.set(3*r+.5,3*r+.5,1);scene.add(shade);
  const feet=shade.clone();feet.scale.set(1.84,1.28,1);scene.add(feet);
  const shavings=new T.InstancedMesh(new T.TetrahedronGeometry(1),new T.MeshLambertMaterial({color:'#c6a87d'}),16);
  shavings.count=0;shavings.frustumCulled=false;scene.add(shavings);
  const chip=new T.Object3D();
  return {scene,update(frame){
    feet.position.set(frame.hero[0],.002,frame.hero[2]);
    shavings.count=0;
    if(frame.progress>0 && frame.progress<1){
      const stroke=frame.progress*5;
      for(let i=0;i<16;i++){
        const t=(stroke-i*.017)%1;
        if(t<0 || t>.54)continue;
        chip.position.set(frame.tool[0]+Math.sin(i*2.4)*t*.43,.42+t*.31-1.71*t*t,r+.019+t*(.23+i*.015));
        chip.rotation.set(i+t*2,i*.62,3*t);chip.scale.set(.006,.003,.015);
        chip.updateMatrix();shavings.setMatrixAt(shavings.count++,chip.matrix);
      }
      shavings.instanceMatrix.needsUpdate=true;
    }
  },felled(){stem.visible=false;shavings.count=0;},
    dispose(){for(const g of [stem.geometry,stump.geometry,floor.geometry,shade.geometry])g.dispose();
      shavings.dispose();shavings.geometry.dispose();shavings.material.dispose();texture.dispose();shadowMap.dispose();floor.material.dispose();shadowMat.dispose();}};
}
