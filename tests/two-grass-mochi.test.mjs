import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { BUILDINGS, BRIDGES, TREES, ROCKS, landscapeFloor, canLand, canOccupy } from '../two/terrain.js';

function stand(game, x, z) {
  Object.assign(game.state.player, {x,z,y:landscapeFloor(x,z),h:0,grounded:true,vx:0,vy:0,vz:0,speed:0});
}
function walk(game, seconds, input) {
  for (let frame=0; frame<seconds*60; frame++) game.step(1/60,input);
}
test('grass mochi crosses the middle of a tree, rock and house at landscape height', () => {
  for (const object of [TREES[0], ROCKS[0], BUILDINGS[0]]) {
    const game=createGame(), p=game.state.player;
    const span=object.w || 4;
    stand(game,object.x-span,object.z);
    game.act('kusa');
    walk(game,(span*2+1)/6.4,{x:1});
    assert.ok(p.x>object.x+span-.5);
    assert.equal(p.y,landscapeFloor(p.x,p.z));
    assert.equal(p.activity,null);
  }
});
test('grass mochi ignores bridge decks and ceilings, saves inside scenery, and swims under bridges', () => {
  const game=createGame(), p=game.state.player, bridge=BRIDGES[0];
  game.act('kusa');
  stand(game,bridge.x,bridge.z);
  game.step(1/60);
  assert.ok(p.inWater);
  const b=BUILDINGS.find(b=>b.kind==='shop');
  stand(game,b.x,b.z);
  game.act('jump');
  walk(game,.42,{});
  assert.ok(p.y+1.66 > b.y+b.wall+.1);
  const restored=createGame(game.save());
  assert.ok(restored.restored);
  assert.equal(restored.state.player.y,p.y);
});
test('grass bypasses passive pickups, can use them deliberately, and can emerge from a trunk', () => {
  for (const exhausted of [false,true]) {
    const game=createGame(), p=game.state.player;
    game.act('kusa');
    const obj=game.state.objects.find(o=>o.type==='manga');
    stand(game,obj.x,obj.z);
    game.step(1/60);
    assert.equal(p.activity,null);
    assert.equal(obj.active,true);
    assert.ok(game.act('interact'));
    assert.equal(p.activity,'read');
    walk(game,2.5,{});
    const tree=TREES[0];
    stand(game,tree.x,tree.z);
    assert.ok(!canLand(p.x,p.z));
    if (exhausted) { p.mp=0; game.step(1/60); }
    else game.act('normal');
    assert.equal(p.mode,'normal');
    assert.ok(canLand(p.x,p.z));
    assert.ok(Math.hypot(p.x-tree.x,p.z-tree.z)<4);
  }
});

for (const mount of ['bike','turtle']) {
  function board(game) {
    const target=mount==='bike' ? game.state.objects.find(o=>o.type==='port') : game.state.npcs.find(n=>n.type==='turtle');
    stand(game,target.x,target.z);
    assert.ok(game.act('interact'));
    assert.equal(game.state.player.mount,mount);
    return target;
  }

  test(mount+' keeps its rider, speed and grass mode through a tree and a saved journey', () => {
    const game=createGame(), p=game.state.player, tree=TREES[0];
    board(game);
    assert.ok(game.act('kusa'));
    assert.equal(p.mp,94);
    assert.ok(game.act('kusa'));
    assert.equal(p.mp,94);
    for (const other of ['dango','kinako','habutae','kagami']) assert.equal(game.act(other),false);

    stand(game,tree.x-5,tree.z);
    walk(game,1,{x:1});
    assert.ok(p.x>tree.x+1 && p.speed>6.4);
    assert.equal(p.mount,mount);
    stand(game,tree.x,tree.z);
    game.step(1/60);
    const resumed=createGame(JSON.parse(JSON.stringify(game.save()))), q=resumed.state.player;
    assert.ok(resumed.restored);
    resumed.step(1/60);
    assert.equal(q.mode,'kusa');
    assert.equal(q.mount,mount);
    assert.equal(q.x,p.x);
    assert.equal(q.z,p.z);

    q.mp=0;
    resumed.step(1/60);
    assert.equal(q.mode,'normal');
    assert.equal(q.mount,mount);
    assert.ok(canOccupy(q.x,q.z,q.y,mount==='bike'?.26:.92,2.56));
    const distance=Math.hypot(q.x-tree.x,q.z-tree.z);
    assert.ok(distance>0 && distance<5);
    walk(resumed,.5,{x:(q.x-tree.x)/distance,z:(q.z-tree.z)/distance});
    assert.ok(Math.hypot(q.x-tree.x,q.z-tree.z)>distance+1);
  });

  test(mount+' can be boarded and left as grass, and can materialize clear of furniture', () => {
    const game=createGame(), p=game.state.player;
    assert.ok(game.act('kusa'));
    const target=board(game);
    assert.equal(p.mode,'kusa');
    assert.equal(p.mp,94);
    assert.ok(game.act('dismount'));
    assert.equal(p.mode,'kusa');
    assert.equal(p.mount,null);
    if (mount==='bike') assert.equal(target.bikes,2);
    board(game);
    const table=game.state.objects.find(o=>o.type==='manga');
    stand(game,table.x,table.z);
    assert.ok(game.act('normal'));
    assert.equal(p.mount,mount);
    assert.equal(p.mode,'normal');
    assert.ok(Math.hypot(p.x-table.x,p.z-table.z)>.4);
  });
}
