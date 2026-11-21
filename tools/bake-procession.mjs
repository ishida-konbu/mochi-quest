// On the served game's origin, use (await bakeProcession()).toBlob(callback,
// 'image/webp', .88). Rows match the view/dye ordering in procession-view.js.
import * as THREE from '../two/vendor/three.module.min.js';
import { makeNPC, animateNPC } from '../two/actors.js';
import { TRADES, DYES } from '../two/procession.js';

export async function bakeProcession() {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  const width=64,height=72, columns=32;
  const rows=Math.ceil(2*(3+TRADES.length*DYES.length)*8/columns);
  renderer.setSize(width,height,false);
  renderer.setClearColor(0,0);
  const output=document.createElement('canvas');
  output.width=columns*width; output.height=rows*height;
  const paint=output.getContext('2d');
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1.44,1.44,1.62,-1.62,.05,10);
  const sun=new THREE.DirectionalLight(0xffe9cb,1.8), fill=new THREE.DirectionalLight(0xe6efff,.58);
  sun.position.set(-2,4,3); fill.position.set(2,3,-2);
  scene.add(new THREE.HemisphereLight(0xfff5e3,0xb3a390,1.3),sun,fill);

  // The high-detail heads and the rice-paper clothing share these pigments.
  const pigment=new Image();
  pigment.src=new URL('../two/assets/residents/scroll-pigments.webp',import.meta.url).href;
  await pigment.decode();
  let tile=0;
  for(const type of ['rabbit','frog']) {
    for (const role of ['porter','wander','sumo',...TRADES]) {
      const area=TRADES.includes(role);
      for(let dye=0;dye<(area?DYES.length:1);dye++) {
        const n={type,role,area,dye,stature:1,build:1,heading:0,x:0,y:0,z:0,speed:.17,phase:.4};
        const actor=makeNPC(n,scene);
        animateNPC(actor,n,1.2);
        actor.shadow.visible=false;
        // Let cached image load callbacks populate both species' materials.
        if(dye===0 && role==='porter') await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        for(let direction=0;direction<8;direction++,tile++) {
          const angle=direction*Math.PI/4;
          camera.position.set(Math.sin(angle)*5,2.19,Math.cos(angle)*5);
          camera.lookAt(0,1.37,0);
          renderer.render(scene,camera);
          paint.drawImage(renderer.domElement,(tile%columns)*width,Math.floor(tile/columns)*height);
        }
        scene.remove(actor.mesh);
      }
    }
  }
  renderer.dispose();
  return output;
}
