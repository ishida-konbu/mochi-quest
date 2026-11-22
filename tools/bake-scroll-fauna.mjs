// Eight viewpoints of each articulated model become its journal and distant ink plate.
import * as T from '../two/vendor/three.module.min.js';
import { batchActorParts } from '../two/actors.js';
import { buildFaunaParts, poseFaunaPart, faunaPigment } from '../two/scroll-fauna-art.js';
import { SCROLL_FAUNA, FAUNA_SHEET, faunaPrints, faunaFrequency } from '../two/scroll-fauna.js';
export async function bakeScrollFauna(){
  const {columns,rows,width,height,poses}=FAUNA_SHEET,scene=new T.Scene();
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(width*2,height*2,false);renderer.setClearColor(0,0);
  const sun=new T.DirectionalLight(0xffead3,1.76),fill=new T.DirectionalLight(0xe4efff,.60);
  sun.position.set(-3,5,3);fill.position.set(3,3,-3);
  scene.add(new T.HemisphereLight(0xfff2d9,0xad9d88,1.30),sun,fill);
  const sheet=document.createElement('canvas');sheet.width=columns*width;sheet.height=rows*height;
  const ctx=sheet.getContext('2d');ctx.imageSmoothingQuality='high';
  const textureReady=new Promise(resolve=>{T.DefaultLoadingManager.onLoad=resolve;});
  const models=faunaPrints.map(kind=>buildFaunaParts(kind==='hawk-perched'?'hawk':kind,batchActorParts));
  faunaPigment();await textureReady;
  for(const [i,form] of faunaPrints.entries()){
    const type=form==='hen'?'chicken':form==='hawk-perched'?'hawk':form,spec=SCROLL_FAUNA[type];
    const n={type,variant:form==='hen'?1:0,phase:.31,speed:.68,gesture:.10,spread:form==='hawk'?1:0,perched:form==='hawk-perched'};
    const meshes=models[i].map(p=>{const mesh=new T.Mesh(p.geometry,p.material||faunaPigment());scene.add(mesh);return mesh;});
    const h=spec.frame/2,camera=new T.OrthographicCamera(-h,h,h,-h,.05,50);
    for(let pose=0;pose<poses;pose++) {
      const time=(pose*2*Math.PI/poses-n.phase)/faunaFrequency(type);
      models[i].forEach((p,k)=>poseFaunaPart(p,n,time,meshes[k]));
      for(let angle=0;angle<8;angle++){
        const a=angle*Math.PI/4,tile=(i*poses+pose)*8+angle;
        camera.position.set(Math.sin(a)*10,spec.center+1.55,Math.cos(a)*10);camera.lookAt(0,spec.center,0);
        renderer.render(scene,camera);
        ctx.drawImage(renderer.domElement,tile%columns*width,Math.floor(tile/columns)*height,width,height);
      }
    }
    scene.remove(...meshes);
  }
  renderer.dispose();return sheet;
}
