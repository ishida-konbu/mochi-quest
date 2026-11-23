import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector3 } from '../two/vendor/three.module.min.js';
import { frameStoryHands, sightMesh } from '../two/story-camera-framing.js';

test('the sightline keeps the sampled silhouette as a deforming item moves to its next pose',()=>{
  const cloth=new BoxGeometry(.3,.3,.08),bent=cloth.attributes.position.clone();
  for(let i=0;i<bent.count;i++)bent.setX(i,bent.getX(i)+.7);
  cloth.morphAttributes.position=[bent];
  const flap=new Mesh(cloth,new MeshBasicMaterial());flap.morphTargetInfluences[0]=1;
  const posed=sightMesh(flap,new Matrix4());flap.morphTargetInfluences[0]=0;
  const ray=new Raycaster(new Vector3(.7,0,2),new Vector3(0,0,-1));
  assert.ok(ray.intersectObject(posed).length>0);
  assert.equal(ray.intersectObject(flap).length,0);
});

test('one camera sees both ends of a wide exchange around the witness and above the caption',()=>{
  const focus=new Vector3(0,.95,0);
  const coat=new Mesh(new BoxGeometry(.45,.85,.34),new MeshBasicMaterial());
  coat.position.set(0,1.35,1.20);coat.updateMatrixWorld();
  const marks=[new Vector3(-2.2,.73,.3),focus,new Vector3(2.5,1.54,-.25)];
  const shot=frameStoryHands(marks.map(subject=>({subject,margin:.025,obstacles:[coat]})),focus,2.5,1.35,34,0,[.36,.65]);
  assert.ok(Math.abs(shot.eye.x)>.2 || shot.eye.y>2.4,'the front of the coat obstructs a straight view');
  for(const aspect of [390/844,900/620]){
    const camera=new PerspectiveCamera(shot.fov(aspect),aspect,.04,20);
    camera.position.copy(shot.eye);camera.lookAt(focus);camera.updateMatrixWorld();
    for(const mark of marks){
      const view=mark.clone().project(camera);
      assert.ok(Math.abs(view.x)<.86 && view.y>-.45 && view.y<.71);
    }
  }
});

test('the camera steps back for a handoff near the lens while keeping both screen formats readable',()=>{
  const focus=new Vector3(0,1,0),points=[new Vector3(-1.35,1.12,1.55),new Vector3(.7,.78,-.8)];
  const samples=points.map(subject=>({subject,margin:.04,obstacles:[]}));
  const shot=frameStoryHands(samples,focus,2,1.4,34,0,[.4],points);
  assert.ok(shot.eye.z>2.4);
  assert.ok(shot.fov(900/620)<=62.001);
  assert.ok(shot.fov(390/844)<=80.001);
});
