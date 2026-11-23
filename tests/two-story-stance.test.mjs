import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from '../two/vendor/three.module.min.js';
import { poseStageWalk, stagePickup, stageWalks } from '../two/story-stage-blocking.js';
import { worktopHeadroom } from '../two/story-headroom.js';

const at=(x,z)=>new Vector3(x,0,z);
function player(name,x,z){
  const group=new Group();group.position.copy(at(x,z));return {name,group};
}

test('actors go around a planted guest before reaching across the bench in a replay',()=>{
  const baker=player('おはな',1.28,-.95),guest=player('配達人のお餅',0,-1.30);
  guest.onStand=true;
  const old=[{point:at(-1.35,-.95),yaw:0},{point:guest.group.position.clone(),yaw:0}];
  const bench={x:0,z:0,yaw:0,width:2.56,depth:1.04};
  const walk=stageWalks([baker,guest],baker,guest,old,[bench]);
  assert.ok(walk.span>1);
  for(let i=0;i<=180;i++){
    for(const move of walk.moves)poseStageWalk(move,walk.span*i/180);
    assert.ok(guest.group.position.distanceTo(old[1].point)<1e-9);
    assert.ok(baker.group.position.distanceTo(guest.group.position)>.96);
    assert.ok(baker.group.position.z<-.82 || Math.abs(baker.group.position.x)>1.6);
  }
  const before=baker.group.position.clone();
  walk.shiftWeight(baker,at(0,.3));
  assert.ok(baker.group.position.z<-.82);
  assert.ok(before.distanceTo(baker.group.position)<=.300001);
});

test('a rotated stage provides reachable pickup and joint handoff marks for opposite palms',()=>{
  const stage=new Group();stage.position.set(24,3,-17);stage.rotation.y=1.1;
  const desk={x:0,z:0,yaw:0,width:1.7,depth:.63};
  function artisan(name,x,side){
    const person=player(name,x,-.95),palm=new Group();
    const rest=new Vector3(side*.20,.86,.44);person.group.add(palm);stage.add(person.group);
    person.hand=()=>palm;
    person.grasp=goal=>{
      palm.position.copy(rest);
      if(goal)palm.position.add(person.group.worldToLocal(goal.clone()).sub(rest).clampLength(0,.28));
    };
    person.grasp(null);return person;
  }
  const a=artisan('渡す人',-.72,1),b=artisan('受ける人',.82,-1),cast=[a,b];
  const tile=new Vector3(-.53,.81,-.29),patch=stage.localToWorld(tile.clone());
  const pickup=stagePickup(a,tile,{nearest:()=>patch.clone()},[desk],cast,null);
  assert.ok(pickup.gap<.03);
  const start=cast.map(p=>({point:p.group.position.clone(),yaw:p.group.rotation.y}));
  const plan=stageWalks(cast,a,b,start,[desk],{stage,top:.74});
  for(const move of plan.moves)poseStageWalk(move,plan.span);
  for(const person of cast){
    person.grasp(plan.handoffPoint);
    assert.ok(person.hand().getWorldPosition(new Vector3()).distanceTo(plan.handoffPoint)<.04);
  }
});

test('the modelled muzzle detects a side shelf during a bow at a rotated worktable',()=>{
  const room=new Group();room.position.set(15,3.3,-26);room.rotation.y=.63;
  const bench=new Group(),worker=new Group(),head=new Group();head.name='head';
  const face=new Mesh(new BoxGeometry(.22,.18,.36),new MeshBasicMaterial());
  face.position.set(0,0,.19);head.add(face);head.position.y=.90;worker.add(head);
  const tray=new Group();tray.position.set(.90,0,-.64);Object.assign(tray.userData,{width:.48,depth:.42,worktop:.77});
  room.add(worker,bench);bench.add(tray);worker.position.set(.9,0,-1.15);
  const guard=worktopHeadroom(worker,bench,{width:1.4,depth:.64,top:.74},[tray]);
  assert.equal(guard.depth(),0);
  worker.rotation.x=.30;
  const bent=guard.depth();assert.ok(bent>.02);
  const feet=worker.position.clone(),neck=head.position.clone();
  guard.clearNeck();
  assert.ok(guard.depth()<bent);
  assert.deepEqual(worker.position.toArray(),feet.toArray());
  assert.deepEqual(head.position.toArray(),neck.toArray());
});

test('a reader raises the muzzle as a sheet turns above the cleared worktop',()=>{
  const bench=new Group(),worker=new Group(),head=new Group();head.name='head';
  const muzzle=new Mesh(new BoxGeometry(.20,.14,.38),new MeshBasicMaterial());
  muzzle.position.z=.20;head.position.y=1.03;head.add(muzzle);worker.add(head);
  worker.position.z=-.54;
  const guard=worktopHeadroom(worker,bench,{width:1.2,depth:.70,top:.75});
  const sheet={x:0,z:-.20,w:.23,d:.12,y:1.02};
  assert.equal(guard.depth(),0);
  assert.ok(guard.depth(sheet)>.04);
  const original=head.quaternion.clone();guard.clearNeck(sheet);
  assert.ok(guard.depth(sheet)<.003);
  guard.restoreNeck();assert.ok(original.angleTo(head.quaternion)<1e-8);
});
