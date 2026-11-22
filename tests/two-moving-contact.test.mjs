import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { recipientContact,sweepResident } from '../two/bestiary.js';
import { BOUND,TREES,BUILDINGS,groundHeight,canOccupy } from '../two/terrain.js';
import { planTurtleLeg } from '../two/turtle-trail.js';

function place(p,x,z){
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,speed:0,vx:0,vy:0,vz:0,grounded:true});
}
function tick(g,seconds,input={}){
  for(let i=0;i<Math.ceil(60*seconds);i++)g.step(1/60,input);
}
test('the extended box turtle muzzle and the moving chicken are hittable in world metres',()=>{
  const n={type:'turtle',x:0,y:0,z:0,heading:0};
  assert.ok(recipientContact(n,{x:-2,y:.83,z:1.42},1,0,3)<2);
  assert.equal(recipientContact(n,{x:-2,y:1.43,z:1.42},1,0,3),Infinity);
  const hen={type:'chicken',x:-BOUND+.6,y:0,z:0,heading:0,contactX:BOUND-.6,contactY:0,contactZ:0};
  assert.equal(recipientContact(hen,{x:-BOUND,y:.45,z:0},0,1,.1),Infinity);
  const t=sweepResident(hen,{x:-BOUND,y:.45,z:0},0,0,.1,.105,.14,true);
  assert.ok(t>0 && t<1,'the hen crosses the sheet between the endpoint samples at the map seam');
});
test('a point-blank letter crosses its launch offset and a solid wall stops a letter',()=>{
  const g=createGame(),p=g.state.player, n=g.state.npcs.find(n=>n.type==='chicken');
  // Hold a real actor in a surveyed clear lane for two reproducible casts.
  place(p,0,1411);g.step(1/60);
  Object.assign(n,{x:p.x,z:p.z+.13,y:p.y+.48,heading:Math.PI/2,atMortar:true});
  g.state.nearbyNpcs.splice(0,g.state.nearbyNpcs.length,n);
  g.act('throw',0);g.step(1/60);
  assert.ok(g.state.delivered.has(n.id));

  const g2=createGame(),p2=g2.state.player,b=BUILDINGS.find(b=>b.kind==='shop');
  const vx=Math.sin(b.yaw),vz=Math.cos(b.yaw),back=b.d/2;
  place(p2,b.x-vx*(back+2),b.z-vz*(back+2));g2.step(1/60);
  const near=g2.state.npcs.find(n=>n.type==='rabbit' && !n.ridesDeer);
  Object.assign(near,{x:b.x-vx*(back-.7),z:b.z-vz*(back-.7),y:p2.y,atMortar:true});
  g2.state.nearbyNpcs.splice(0,g2.state.nearbyNpcs.length,near);
  g2.act('throw',b.yaw);tick(g2,.30);
  assert.equal(g2.state.shots.length,0);
  assert.equal(g2.state.delivered.size,0);
});
test('a swift turtle cannot drive through a small, harmless resident in a single frame',()=>{
  const g=createGame(),p=g.state.player,t=g.state.npcs.find(n=>n.type==='turtle');
  place(p,t.x,t.z);g.act('interact');
  place(p,0,1411);g.step(1/60);
  const hen=g.state.npcs.find(n=>n.type==='chicken');
  Object.assign(hen,{x:1.35,y:p.y,z:p.z,atMortar:true,heading:Math.PI/2});
  g.state.nearbyNpcs.push(hen);
  Object.assign(p,{vx:149.1,speed:149.1});p.buffs.swift=10;
  g.step(1/60,{x:1});
  assert.ok(p.x<hen.x && p.speed<80,'the shell stops on the near side');
  assert.equal(p.hp,100);
  tick(g,.6,{x:-1});assert.ok(p.x<-.5,'the rider can back away');
});
test('turtle route detours around a wall and drops unreachable shelter goals',()=>{
  const turtle={x:0,y:0,z:0,homeX:0,homeZ:0};
  const footing=(x,z,y,margin=0)=>x< -1.3+margin && x> -2.7-margin && z<.2+margin && z> -4.3-margin ? NaN : 0;
  const trail=planTurtleLeg(turtle,0,footing);
  assert.ok(trail.length>2);
  assert.deepEqual([trail.at(-1).x,trail.at(-1).z],[-5,-4]);
  let from=turtle;
  for(const to of trail){
    for(let i=0;i<=30;i++)assert.ok(Number.isFinite(footing(from.x+(to.x-from.x)*i/30,from.z+(to.z-from.z)*i/30)));
    from=to;
  }
  const behindWall=planTurtleLeg(turtle,0,(x)=>x<-.4?NaN:0);
  assert.ok(behindWall.every(n=>n.x>=-.4));
});
test('old embedded turtle saves recover, and a turtle left offshore can roam and be remounted',()=>{
  const g=createGame(),save=g.save(),tree=TREES[0];
  Object.assign(save.turtle,{x:tree.x,z:tree.z,homeX:tree.x,homeZ:tree.z,pause:0});
  const next=createGame(save),t=next.state.npcs.find(n=>n.type==='turtle'),p=next.state.player;
  next.step(1/60);
  assert.ok(canOccupy(t.x,t.z,t.y,1.65,1.15));
  assert.ok(Math.hypot(t.x-tree.x,t.z-tree.z)<8);
  place(p,t.x,t.z);assert.ok(next.act('interact'));
  place(p,0,1411);assert.ok(next.act('dismount'));
  assert.ok(Math.hypot(t.x-p.x,t.z-p.z)>1.5);
  tick(next,4);assert.ok(Math.hypot(t.x,t.z-1411)>2);
  place(p,t.x,t.z);assert.ok(next.act('interact'));
});
