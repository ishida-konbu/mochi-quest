import * as T from '../two/vendor/three.module.min.js';
import {peachModel,CROWN_SPAN,CROWN_MID,CROWN_ELEVATIONS} from '../two/flowering-peaches.js';
export async function bakePeaches(){
  const meshes=Array.from({length:5},(_,i)=>peachModel(i));
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,1,0),.03)];
  renderer.setClearColor(0,0);const cell=256;renderer.setSize(cell,cell,false);
  const canvas=document.createElement('canvas');canvas.width=8*cell;canvas.height=10*cell;
  const g=canvas.getContext('2d'),scene=new T.Scene(),half=CROWN_SPAN/2;
  const camera=new T.OrthographicCamera(-half,half,half,-half,.05,45);
  scene.add(new T.HemisphereLight(0xfff7e7,0xd1bfab,1.30));
  const sun=new T.DirectionalLight(0xffebdc,1.4);sun.position.set(-4,7,3);scene.add(sun);
  for(const [i,parts] of meshes.entries()){
    const tree=new T.Group();parts.forEach(([geo,mat])=>tree.add(new T.Mesh(geo,mat)));scene.add(tree);
    for(const [band,tilt] of CROWN_ELEVATIONS.entries())for(let j=0;j<4;j++){
      const a=j*Math.PI/2,horizontal=16*Math.cos(tilt);
      camera.position.set(horizontal*Math.sin(a),CROWN_MID+16*Math.sin(tilt),horizontal*Math.cos(a));
      camera.lookAt(0,CROWN_MID,0);renderer.render(scene,camera);
      g.drawImage(renderer.domElement,cell*(j+4*(band%2)),cell*(i*2+Math.floor(band/2)));
    }
    scene.remove(tree);
  }
  renderer.dispose();return canvas;
}
