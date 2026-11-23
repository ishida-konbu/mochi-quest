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

function board(game,mount) {
  const target=mount==='bike' ? game.state.objects.find(o=>o.type==='port') : game.state.npcs.find(n=>n.type==='turtle');
  place(game.state.player,target.x,target.z);
  assert.ok(game.act('interact'));
  assert.equal(game.state.player.mount,mount);
}
for(const mount of ['bike','turtle']){
  test(mount+' stops its leading end at a worktable at full speed and reverses freely',()=>{
    const game=createGame(),p=game.state.player;
    board(game,mount);
    place(p,0,1410);
    const table={kind:'table',number:1,x:0,y:p.y,z:1413,yaw:0};
    game.storyCollisions.update([table]);
    p.heading=0;p.vz=p.speed=mount==='turtle'?149:65;p.buffs.swift=5;
    tick(game,.25,{z:1});
    const reach=mount==='turtle'?1.60:1.04;
    assert.ok(p.z<=table.z-.55-reach+.03,`leading end at ${p.z+reach}`);
    assert.ok(p.z>1410.6,'the mount can approach the actual face');
    const stop=p.z;
    tick(game,.5,{z:-1});
    assert.ok(p.z<stop-1.6);
  });

  test(mount+' backs between two worktables even when its turning circle is obstructed',()=>{
    const game=createGame(),p=game.state.player;
    board(game,mount);
    place(p,0,1411);
    p.heading=0;
    const gap=mount==='turtle'?.98:.45;
    game.storyCollisions.update([-1,1].map(side=>({kind:'table',number:1,x:side*(gap+.56),
      y:p.y,z:p.z,yaw:Math.PI/2})));
    let peakAngle=0;
    for(let i=0;i<9;i++){
      game.step(1/60,{z:-1});
      peakAngle=Math.max(peakAngle,Math.abs(p.heading));
    }
    assert.ok(peakAngle<Math.PI*.48,'the nose cannot swivel through the side tables');
    assert.ok(p.z<1410.7,'reverse travel starts while the turn is blocked');
    tick(game,1,{z:-1});
    assert.ok(p.z<1404 && Math.abs(p.heading)>2.9);
  });

  test('a saved '+mount+' embedded in a trunk is playable on the first simulation step',()=>{
    const game=createGame(),p=game.state.player,tree=TREES[0];
    board(game,mount);
    place(p,tree.x,tree.z);
    const resumed=createGame(game.save()),q=resumed.state.player;
    assert.ok(resumed.restored);
    resumed.step(1/60);
    const dx=q.x-tree.x,dz=q.z-tree.z,dist=Math.hypot(dx,dz);
    assert.ok(dist>.4 && dist<5);
    assert.equal(q.mount,mount);
    tick(resumed,.5,{x:dx/dist,z:dz/dist});
    assert.ok(Math.hypot(q.x-tree.x,q.z-tree.z)>dist+1);
  });
}

test('a completely obstructed rental keeps the inventory intact and the port usable',()=>{
  const game=createGame(),p=game.state.player,port=game.state.objects.find(o=>o.type==='port');
  place(p,port.x,port.z);
  const tables=[];
  for(let x=-3;x<=3;x+=1.5)for(let z=-3;z<=3;z+=.65){
    tables.push({kind:'table',number:3,x:p.x+x,y:p.y,z:p.z+z,yaw:0});
  }
  game.storyCollisions.update(tables);
  assert.equal(game.act('interact'),false);
  assert.equal(port.bikes,2);
  assert.equal(p.mount,null);
  game.storyCollisions.update([]);
  assert.ok(game.act('interact'));
  assert.equal(port.bikes,1);
  assert.ok(game.act('dismount'));
  assert.equal(port.bikes,2);
});

for(const mount of ['bike','turtle']){
  test(mount+' clears a fixture that appears around a stopped rider during play',()=>{
    const game=createGame(),p=game.state.player;
    board(game,mount);
    place(p,0,1411);
    p.heading=0;
    game.step(1/60);
    const table={kind:'table',number:3,x:p.x,y:p.y,z:p.z,yaw:0};
    game.storyCollisions.update([table]);
    assert.ok(game.storyCollisions.penetration(p.x,p.z,p.y,1,.15)>0);
    game.step(1/60,{z:1});
    assert.equal(game.storyCollisions.penetration(p.x,p.z,p.y,1,.15),0);
    const dx=p.x-table.x,dz=p.z-table.z,gap=Math.hypot(dx,dz);
    assert.ok(gap<3.5);
    tick(game,.5,{x:dx/gap,z:dz/gap});
    assert.ok(Math.hypot(p.x-table.x,p.z-table.z)>gap+1.5);
    assert.equal(p.mount,mount);
  });
}
