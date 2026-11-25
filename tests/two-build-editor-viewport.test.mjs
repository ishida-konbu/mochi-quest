import test from 'node:test';
import assert from 'node:assert/strict';
import { Group,Ray,Vector3 } from '../two/vendor/three.module.min.js';
import { buildGroundHit,buildMarqueeHit } from '../two/build-editor-viewport.js';
import { createHomesteadWorld } from '../two/homestead-world.js';

test('the drag grip follows its own height over sloping ground and a horizon drag can miss',()=>{
  const ray=new Ray(new Vector3(0,12,10),new Vector3(0,-1,-1).normalize()),height=(x,z)=>z*.22;
  for(const grip of [0,1.05,3.4]){
    const hit=buildGroundHit(ray,grip,height);
    assert.ok(Math.abs(hit.y-height(hit.x,hit.z)-grip)<.0001);
    assert.ok(Math.abs(hit.y-12-(hit.z-10))<1e-8);
  }
  assert.equal(buildGroundHit(new Ray(new Vector3(0,5,0),new Vector3(0,0,-1)),0,()=>0),null);
});

test('marquee uses the oriented screen silhouette and accepts partial overlap in either drag direction',()=>{
  const fence=[{x:0,y:1},{x:1,y:0},{x:10,y:9},{x:9,y:10},{x:5,y:5}];
  assert.equal(buildMarqueeHit(fence,{x:5,y:4},{x:7,y:6}),true);
  assert.equal(buildMarqueeHit(fence,{x:7,y:6},{x:5,y:4}),true);
  assert.equal(buildMarqueeHit(fence,{x:0,y:7},{x:1,y:9}),false);
  assert.equal(buildMarqueeHit(fence,{x:30,y:100},{x:33,y:101}),false);
  assert.equal(buildMarqueeHit(fence,{x:5,y:5},{x:5,y:5}),true);
});

test('moving a selection temporarily hides its originals and reuses their actual geometry in each ghost',()=>{
  const geometry=new Group(),view=createHomesteadWorld(geometry);
  const points=[{id:'build-1',kind:'stand',x:23,y:.2,z:88,terrain:'plain',yaw:0},
    {id:'build-2',kind:'chest',x:25,y:.2,z:87,terrain:'plain',yaw:.5}];
  view.setLivingWorld({structures:points,felledTrees:[],recipes:[],market:{stands:{}}});
  view.update(0,{x:25,z:87});
  const originals=view.getBuildEditorObjects(),drafts=points.map(s=>({...s,ok:true}));
  const ghosts=[...view.setBuildingPreviews(drafts)];
  assert.equal(ghosts.length,2);
  ghosts.forEach((mesh,i)=>assert.equal(mesh.geometry,originals[i].mesh.geometry));
  view.setBuildEditorHidden(points.map(s=>s.id));
  view.update(0,{x:28,z:83});
  assert.equal(view.getBuildEditorObjects().length,0);
  drafts[0].x++;assert.equal(view.setBuildingPreviews(drafts)[0],ghosts[0]);assert.equal(ghosts[0].position.x,24);
  view.setBuildingPreviews([]);assert.ok(ghosts.every(m=>!m.parent));
  view.setBuildEditorHidden([]);assert.deepEqual(view.getBuildEditorObjects().map(s=>s.id),['build-1','build-2']);
});
