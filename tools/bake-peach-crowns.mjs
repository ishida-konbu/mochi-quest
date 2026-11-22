import * as T from '../two/vendor/three.module.min.js';
import {peachModel,CROWN_SPAN,CROWN_MID} from '../two/flowering-peaches.js';
export async function bakePeaches(){
  const meshes=Array.from({length:5},(_,i)=>peachModel(i));
  await Promise.all(meshes[0].slice(1).map(([,m])=>m.map.image?.decode() || new Promise((resolve,reject)=>{
    const timer=setInterval(()=>{const im=m.map.image;if(im){clearInterval(timer);im.decode().then(resolve,reject);}},20);
  })));
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  renderer.setClearColor(0,0);renderer.setSize(320,320,false);
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=1600;
  const g=canvas.getContext('2d'),scene=new T.Scene(),half=CROWN_SPAN/2;
  const camera=new T.OrthographicCamera(-half,half,half,-half,.05,45);
  scene.add(new T.HemisphereLight(0xfff7e7,0xd1bfab,1.30));
  const sun=new T.DirectionalLight(0xffebdc,1.4);sun.position.set(-4,7,3);scene.add(sun);
  for(const [i,parts] of meshes.entries()){
    const tree=new T.Group();parts.forEach(([geo,mat])=>tree.add(new T.Mesh(geo,mat)));scene.add(tree);
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2;camera.position.set(16*Math.sin(a),CROWN_MID+1.2,16*Math.cos(a));camera.lookAt(0,CROWN_MID,0);
      renderer.render(scene,camera);g.drawImage(renderer.domElement,320*j,320*i);
    }
    scene.remove(tree);
  }
  renderer.dispose();return canvas;
}
