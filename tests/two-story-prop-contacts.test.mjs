import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from '../two/vendor/three.module.min.js';
import { createWorkContact, followStoryGrip } from '../two/story-prop-contacts.js';
import { connectStoryHands, poseStoryHands, storyGrip } from '../two/story-hands.js';

test('the leading edge of a turning tray clears the worktop and the neighboring parcel during transfer', () => {
  const scene=new Group(), bench=new Group(), pivot=new Group(), tray=new Mesh(new BoxGeometry(.77,.05,.38),new MeshBasicMaterial());
  const parcel=new Mesh(new BoxGeometry(.28,.24,.29),new MeshBasicMaterial());
  scene.add(bench);bench.position.set(23,4,-81);bench.rotation.y=1.06;
  bench.add(pivot,parcel);pivot.add(tray);parcel.position.set(.42,.92,0);
  const top=.8,contact=createWorkContact(pivot,tray,bench,{width:2,depth:1,top},[parcel]);
  for (let i=0;i<=60;i++) {
    pivot.rotation.set(-2.75*i/60,.22*i/60,.18*i/60);
    pivot.position.set(-.61+i*.019,.80,.04);
    contact.lift();
    pivot.updateMatrix();
    const box=tray.geometry.boundingBox.clone().applyMatrix4(pivot.matrix);
    assert.ok(box.min.y>=top+.00199);
    if(box.max.x>=.28 && box.min.x<=.56)assert.ok(box.min.y>=1.04199);
  }
  pivot.position.set(2.2,.26,0);contact.lift();assert.equal(pivot.position.y,.26);
  const edge=tray.worldToLocal(contact.edge(1));
  assert.ok(edge.x>=.38 && edge.x<=.386,'the palm meets the outside rim');
});

test('mirrored and ordinary sleeves bend above the counter without moving the bones off a reachable grip', () => {
  for(const mirrored of [false,true]){
    const actor=new Group(),torso=new Group(),right=new Group(),left=new Group();
    actor.add(torso);torso.add(right,left);torso.scale.x=mirrored?-1:1;
    right.position.set(.19,1,0);left.position.set(-.19,1,0);
    connectStoryHands(actor,'frog',{arm1:right,'arm-1':left});
    const target=new Vector3(mirrored?-.20:.20,.94,.39);
    let samples=0;
    const support=(p,r)=>{samples++;return p.z>=.035?Math.max(0,.84+r-p.y):0;};
    poseStoryHands(actor,{right:target,support});
    const wrist=storyGrip(actor);
    assert.ok(wrist.getWorldPosition(new Vector3()).distanceTo(target)<1e-4);
    const elbow=wrist.parent.getWorldPosition(new Vector3());
    assert.ok(support(elbow,.073)<1e-4);
    assert.ok(samples>2);
  }
});

test('the same parcel follows the receiver in its original scene hierarchy, keeping its orientation at handoff', () => {
  const bench=new Group(), stack=new Group(), page=new Group(), receiver=new Group(), palm=new Group();
  bench.add(stack,receiver);stack.add(page);receiver.add(palm);
  stack.rotation.y=.73;page.position.set(.21,.84,-.31);palm.position.set(.33,.8,-.11);
  const relative=palm.worldToLocal(page.getWorldPosition(new Vector3()));
  const follow=followStoryGrip(page,palm);
  receiver.position.set(.4,.08,-.23);palm.rotation.set(.5,.3,-.15);
  follow();
  assert.equal(page.parent,stack);
  assert.ok(page.getWorldPosition(new Vector3()).distanceTo(palm.localToWorld(relative))<1e-6);
});

test('a packet carried across a turning witness clears their actual moving chest mesh', () => {
  const scene=new Group(),actor=new Group(),body=new Mesh(new BoxGeometry(.6,.8,.44)),pivot=new Group();
  const paper=new Mesh(new BoxGeometry(.22,.024,.13));
  body.name='body';body.position.y=.9;actor.add(body);scene.add(actor,pivot);pivot.add(paper);
  actor.position.set(4,.2,-3);actor.rotation.y=.8;
  const at=body.localToWorld(new Vector3(.15,.04,0));
  pivot.position.copy(at);
  const contact=createWorkContact(pivot,paper,scene,{width:1,depth:.5,top:.7});
  contact.clearBodies([actor]);
  assert.ok(pivot.position.distanceTo(at)>.04);
  const corrected=pivot.position.clone();
  contact.clearBodies([actor]);
  assert.ok(pivot.position.distanceTo(corrected)<1e-5);
});

test('a handoff longer than either reach can rest on the nearest edge of the same counter', () => {
  const bench=new Group(),pivot=new Group(),item=new Mesh(new BoxGeometry(.31,.08,.16));
  bench.position.set(-73,2,17);bench.rotation.y=-.64;bench.add(pivot);pivot.add(item);
  pivot.position.set(.57,1.22,-.89);
  const contact=createWorkContact(pivot,item,bench,{width:1.3,depth:.64,top:.79});
  contact.restOnWorktop(1);
  assert.ok(Math.abs(pivot.position.y-.832)<.00001);
  assert.ok(Math.abs(pivot.position.z)<.32);
  assert.equal(item.parent,pivot);
});
