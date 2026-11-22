import * as T from './vendor/three.module.min.js';
import { distantProcession, costumeFrame, costumeCentre } from './procession-view.js';

// The costly lacquer, eyes and silk seams are visible in close portraits. The
// distant figure is eight views of exactly that costume, including hairpins,
// sandals, writing tablets, and the wedding parasol.
export function costumeDistance(scene,capacity){
  const prints=distantProcession(scene,null,capacity,'costumes');
  const frustum=new T.Frustum(),vp=new T.Matrix4(),sphere=new T.Sphere();
  let camera,focal=0,time=0;
  function begin(t,player,view){
    camera=view;time=t;prints.begin(player);
    if(!view)return;
    frustum.setFromProjectionMatrix(vp.multiplyMatrices(view.projectionMatrix,view.matrixWorldInverse));
    focal=(view.projectionMatrix.elements[5]*window.innerHeight)/2;
  }
  function close(actor,x,y,z,heading,size){
    if(!camera)return true;
    const h=costumeFrame(actor.costume)*size;
    sphere.center.set(x,y+costumeCentre(actor.costume)*size,z);sphere.radius=h*.59;
    if(!frustum.intersectsSphere(sphere))return false;
    const depth=-sphere.center.applyMatrix4(camera.matrixWorldInverse).z;
    if(h*focal/Math.max(.01,depth)>79)return true;
    actor.y=y;actor.heading=heading;actor.stature=size;
    prints.add(actor,x,z,camera,time,1);
    return false;
  }
  return {begin,close,end:prints.end};
}
