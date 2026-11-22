// Eight views, baked from the actual posed meshes and rice shader. The same
// white of the silk remains visible as a small silhouette down the street.
import * as T from '../two/vendor/three.module.min.js';
import { TOWNSFOLK } from '../two/heian-dress.js';
import { createStreetCrowd } from '../two/kyo-people.js';
import { foxParties } from '../two/pilgrimage-foxes.js';
import { DISTRICTS } from '../two/geography.js';
import { WEDDING_SITES } from '../two/pilgrimage-layout.js';
import { costumeFrame,costumeCentre } from '../two/procession-view.js';
import { loadRiceModel } from '../two/mochi-model.js';
import { preloadBeastCoats } from '../two/beast-art.js';

export async function bakeCostumes(){
  await Promise.all([loadRiceModel(),preloadBeastCoats(['fox'])]);
  const actors=new T.Scene(),gallery=new T.Scene(),cast=[];
  const ready=new Promise(resolve=>T.DefaultLoadingManager.onLoad=resolve);
  const street=createStreetCrowd(actors),party=foxParties(actors);
  street(2,DISTRICTS.kyo);party(2,WEDDING_SITES[0],true);
  await ready;
  const matrix=new T.Matrix4(),inverse=new T.Matrix4();
  function person(base){
    base.getMatrixAt(0,inverse);inverse.invert();
    const group=new T.Group();cast.push(group);return group;
  }
  function piece(group,part,id=0){
    const mesh=new T.Mesh(part.geometry,part.material);
    part.getMatrixAt(id,matrix);mesh.applyMatrix4(matrix.premultiply(inverse));group.add(mesh);
  }
  const crowd=actors.getObjectByName('京の辻をゆく餅たち');
  const footwear=crowd.getObjectByName('鼻緒と下駄'),robes=crowd.children.filter(o=>o.name==='都の装束');
  const faces=crowd.children.filter(o=>o.name==='にっこり餅の面相');
  const names=TOWNSFOLK;
  for(const [k,name] of names.entries()){
    const trim=crowd.getObjectByName(name),group=person(trim);
    piece(group,trim);piece(group,robes[k]);piece(group,faces[k]);
    for(const foot of [0,1])piece(group,footwear,2*k*faces[0].count+foot);
  }
  for(const [i,role] of ['lantern','groom','bride','parasol','flute'].entries()){
    const group=person(actors.getObjectByName('稲荷・'+role));
    for(const part of actors.children){
      const name=part.name.slice(3);
      if(name===role||name===role+'装束')piece(group,part);
      if(name==='面相'||name==='尾')piece(group,part,i);
      if(name==='sandals'){piece(group,part,i*2);piece(group,part,i*2+1);}
    }
  }
  const sun=new T.DirectionalLight('#fff0d9',1.80);
  sun.position.set(-3,5,4);gallery.add(sun,new T.HemisphereLight('#fff5e1','#a49a86',1.38));
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setClearColor(0,0);renderer.setSize(256,256,false);
  const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=1280;
  const ctx=sheet.getContext('2d');ctx.imageSmoothingQuality='high';
  for(const [k,model] of cast.entries()){
    const span=costumeFrame(k),cy=costumeCentre(k),h=span/2;
    const camera=new T.OrthographicCamera(-h,h,h,-h,.1,24);gallery.add(model);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      camera.position.set(8*Math.sin(angle),cy+.6,8*Math.cos(angle));camera.lookAt(0,cy,0);
      renderer.render(gallery,camera);ctx.drawImage(renderer.domElement,i*128,k*128,128,128);
    }
    model.removeFromParent();
  }
  renderer.dispose();return sheet;
}
