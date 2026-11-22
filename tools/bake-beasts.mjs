// Bake the travelling bestiary from its actual rigs, on a 2x sampling grid.
import * as THREE from '../two/vendor/three.module.min.js';
import { makeNPC, animateNPC } from '../two/actors.js';
import { SPECIES } from '../two/bestiary.js';
import { BEASTS,beastFrame,gaitFrequency } from '../two/procession-view.js';
import * as beasts from '../two/beast-art.js';

export async function bakeBeasts() {
  const {width,height,columns,rows}=BEASTS;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(width*2,height*2,false);renderer.setClearColor(0,0);
  const sheet=document.createElement('canvas');sheet.width=width*columns;sheet.height=height*rows;
  const ctx=sheet.getContext('2d'),scene=new THREE.Scene();
  ctx.imageSmoothingQuality='high';
  const sun=new THREE.DirectionalLight(0xffead3,1.8),fill=new THREE.DirectionalLight(0xe4efff,.62);
  sun.position.set(-3,5,3);fill.position.set(3,3,-3);scene.add(new THREE.HemisphereLight(0xfff2d9,0xad9d88,1.32),sun,fill);
  let row=0;
  for(const [type,spec] of Object.entries(SPECIES)){
    await beasts.preloadBeastCoats([type]);
    const n={type,x:0,y:0,z:0,heading:0,stature:1,speed:1,phase:0};
    const actor=makeNPC(n,scene),h=beastFrame(type)/2;
    const camera=new THREE.OrthographicCamera(-h,h,h,-h,.05,50); actor.shadow.visible=false;
    for(let pose=0;pose<4;pose++,row++){
      animateNPC(actor,n,pose*Math.PI*.5/gaitFrequency(type));
      for(let angle=0;angle<8;angle++){
        const t=angle*Math.PI/4,distance=12;
        camera.position.set(Math.sin(t)*distance,spec.center+1.8,Math.cos(t)*distance);camera.lookAt(0,spec.center,0);
        renderer.render(scene,camera);ctx.drawImage(renderer.domElement,angle*width,row*height,width,height);
      }
    }
    scene.remove(actor.mesh);
  }
  renderer.dispose();return sheet;
}
