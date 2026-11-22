// Bake one colour plate and a half-resolution haori stencil. The live shader
// applies the six real fabric dyes in linear light without duplicating tiles.
import * as THREE from '../two/vendor/three.module.min.js';
import { makeNPC, animateNPC } from '../two/actors.js';
import { workRate } from '../two/trade-tools.js';
import { VILLAGERS, residentRoles, residentFrameX, clothGround } from '../two/procession-view.js';

export async function bakeProcession() {
  const {width,height,columns,rows,frameX,frameY,center}=VILLAGERS;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(width*2,height*2,false);
  renderer.setClearColor(0,0);
  const plate=(w,h)=>{
    const c=document.createElement('canvas'); c.width=w;c.height=h;
    const g=c.getContext('2d');g.imageSmoothingQuality='high';return g;
  };
  const paint=plate(width*columns,height*rows), stencil=plate(width*columns/2,height*rows/2);
  stencil.fillStyle='black';stencil.fillRect(0,0,stencil.canvas.width,stencil.canvas.height);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-frameX/2,frameX/2,frameY/2,-frameY/2,.05,10);
  const sun=new THREE.DirectionalLight(0xffe9cb,1.8), fill=new THREE.DirectionalLight(0xe6efff,.58);
  sun.position.set(-2,4,3); fill.position.set(2,3,-2);
  scene.add(new THREE.HemisphereLight(0xfff5e3,0xb3a390,1.3),sun,fill);
  const black=new THREE.MeshBasicMaterial({color:0,side:THREE.DoubleSide});
  const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
  await Promise.all(['rabbit','frog'].map(kind=>{
    const pigment=new Image();
    pigment.src=new URL('../two/assets/residents/'+kind+'-wash.webp',import.meta.url).href;
    return pigment.decode();
  }));
  let start=0;
  for(const type of ['rabbit','frog']) {
    for (const role of residentRoles) {
      const area=!['porter','wander','sumo'].includes(role);
      const n={type,role,area,dye:0,stature:1,build:1,heading:0,x:0,y:0,z:0,speed:area ? 0 : .8,phase:0,side:type==='rabbit'?-1:1};
      camera.right=residentFrameX(role)/2;camera.left=-camera.right;camera.updateProjectionMatrix();
      const actor=makeNPC(n,scene);
      actor.shadow.visible=false;
      if (role==='porter') await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const isCloth=mesh=>mesh.name.startsWith('haori');
      const cloth=actor.mesh.getObjectByName('haori');
      if(cloth) cloth.material.color.set(clothGround);
      for (const pass of area?[paint,stencil]:[paint]) {
        if(pass===stencil) actor.mesh.traverse(mesh=>{if(mesh.isMesh)mesh.material=isCloth(mesh)?white:black;});
        const w=pass===paint?width:width/2, h=pass===paint?height:height/2;
        for(let pose=0;pose<VILLAGERS.poses;pose++) {
          animateNPC(actor,n,pose*Math.PI*2/(VILLAGERS.poses*workRate(role)));
          for(let direction=0;direction<8;direction++) {
            const angle=direction*Math.PI/4, tile=start+pose*8+direction;
            camera.position.set(Math.sin(angle)*5,center+.82,Math.cos(angle)*5);
            camera.lookAt(0,center,0);
            renderer.render(scene,camera);
            pass.drawImage(renderer.domElement,(tile%columns)*w,Math.floor(tile/columns)*h,w,h);
          }
        }
      }
      scene.remove(actor.mesh);
      start+=8*VILLAGERS.poses;
    }
  }
  renderer.dispose();
  return {paint:paint.canvas,stencil:stencil.canvas};
}
