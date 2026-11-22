import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {groundHeight,terrainHeight,WATER_Y} from '../two/terrain.js';
import {RYUGU,GATE_V} from '../two/ryugu-layout.js';
import {KYO_FOOD} from '../two/kyo-layout.js';

function swim(game,seconds,input={}) {
  for(let i=0;i<Math.ceil(seconds*30);i++) game.step(1/30,input);
}
function surface(game,x,z) {
  Object.assign(game.state.player,{x,z,y:groundHeight(x,z),h:0,vy:0,vx:0,vz:0,grounded:true,diveDepth:0});
  game.step(1/60);
}
test('a swimmer dives through the sea gate, collects at depth, saves, hovers and surfaces',()=>{
  const g=createGame(),p=g.state.player,{x,z}=RYUGU;
  surface(g,x,z); assert.ok(p.inWater);
  assert.equal(g.state.visited.includes('ryugu'),false);
  surface(g,x+GATE_V+6,z);
  swim(g,6,{dive:true});
  assert.ok(p.y<terrainHeight(x,z)+1 && p.y>=terrainHeight(p.x,p.z));
  swim(g,4.5,{x:-1});
  assert.ok(g.state.visited.includes('ryugu') && Math.abs(p.x-x)<4,'open arch faces shore');
  swim(g,1.4,{jump:true});
  const depth=p.diveDepth, restored=createGame(g.save());
  assert.ok(restored.restored);
  swim(restored,1);
  assert.equal(restored.state.player.diveDepth,depth);
  assert.equal(restored.state.player.y,p.y);
  swim(restored,6,{jump:true});
  assert.equal(restored.state.player.diveDepth,0);
  assert.ok(restored.state.player.inWater && restored.state.player.y<WATER_Y);
});
test('Kyoto refreshments restore vitals, persist during a visit, and leave historical inventories intact',()=>{
  const g=createGame(),legacy=g.save(),p=g.state.player;
  legacy.version=4;legacy.items.length=50;legacy.bikes.length=10;delete legacy.player.diveDepth;
  const migrated=createGame(legacy);
  assert.equal(migrated.restored,true);
  assert.deepEqual(migrated.save().items.slice(0,50),legacy.items);
  assert.deepEqual(migrated.save().bikes.slice(0,10),legacy.bikes);
  for (const stop of KYO_FOOD) {
    p.hp=p.mp=12;surface(g,stop.x,stop.z);
    assert.equal(g.nearest().target.type,stop.type);
    assert.ok(g.act('interact'));
    const reloaded=createGame(g.save());assert.ok(reloaded.restored);
    swim(g,3);
    assert.equal(g.state.objects.find(o=>o.type===stop.type).active,false);
    if (stop.type==='kyoTea') assert.ok(p.mp>=44);
    else assert.ok(p.hp>=38 && p.buffs.full>20);
  }
});
