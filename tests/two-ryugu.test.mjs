import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {groundHeight,terrainHeight,WATER_Y,riverZ} from '../two/terrain.js';
import {RYUGU,GATE_V,PALACE_BED,palacePoint} from '../two/ryugu-layout.js';
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
test('swim under the sealed sill, surface inside, board, climb both stairs and swim back to sea',()=>{
  let game=createGame();
  const moveTo=(u,v)=>{
    const dest=palacePoint(u,v),p=game.state.player;
    for(let i=0;i<420;i++){
      const dx=dest.x-p.x,dz=dest.z-p.z,d=Math.hypot(dx,dz);
      if(d<.15)break;
      game.step(1/30,{x:dx/d,z:dz/d});
    }
    swim(game,.35);
    assert.ok(Math.hypot(dest.x-p.x,dest.z-p.z)<.65,`reached (${u}, ${v})`);
  };
  const verifySave=()=>{
    const before=game.state.player;
    game=createGame(game.save());
    assert.ok(game.restored);
    for(const field of ['x','z','y','diveDepth','grounded','inWater'])
      assert.equal(game.state.player[field],before[field],field);
  };
  surface(game,RYUGU.x+20,RYUGU.z);
  swim(game,6.1,{jump:true,dive:true});
  moveTo(0,-10.5);
  assert.ok(game.state.player.diveDepth>2 && game.state.player.diveDepth<4);
  verifySave();
  swim(game,.8,{jump:true});
  assert.equal(game.state.player.diveDepth,0);
  assert.ok(game.state.player.inWater && game.state.player.y<PALACE_BED+4);
  verifySave();
  moveTo(0,-23);
  assert.equal(game.state.player.y,PALACE_BED+4);
  assert.equal(game.state.player.inWater,false);
  moveTo(-10,-14.5);moveTo(-10,-31.8);
  assert.equal(game.state.player.y,PALACE_BED+9);
  verifySave();
  moveTo(0,-31.8);moveTo(0,-14.4);moveTo(10,-14.4);moveTo(10,-31.8);
  assert.equal(game.state.player.y,PALACE_BED+14);
  assert.equal(game.state.player.inWater,false);
  verifySave();
  moveTo(10,-14.5);moveTo(0,-14.5);moveTo(0,-31.8);moveTo(-10,-31.8);
  moveTo(-10,-14.5);
  assert.equal(game.state.player.y,PALACE_BED+4);
  moveTo(-10,-23);moveTo(0,-23);moveTo(0,-10.5);
  assert.ok(game.state.player.inWater);
  swim(game,.6,{dive:true,jump:true});moveTo(0,-5.4);
  assert.ok(game.state.player.diveDepth>35 && game.state.player.y<PALACE_BED+2);
});

test('a former open-ocean save now enclosed by the palace resumes just outside the submerged door',()=>{
  const snapshot=createGame().save();
  Object.assign(snapshot.player,palacePoint(4,-22),{y:-25,diveDepth:WATER_Y-.57+25,grounded:false});
  const game=createGame(snapshot),p=game.state.player;
  assert.ok(game.restored && p.inWater && !p.grounded);
  assert.deepEqual({x:p.x,z:p.z},palacePoint(0,-6.5));
  assert.ok(p.y<PALACE_BED+2);
  swim(game,1,{x:-1});
  assert.ok(p.x<RYUGU.x-8 && p.diveDepth<4);
});

test('grass mochi crossing an upper gallery wall or ceiling changes medium at the same height',()=>{
  const game=createGame(),p=game.state.player;
  const y=PALACE_BED+17;
  Object.assign(p,palacePoint(14.55,-33),{y,h:0,grounded:false,mode:'kusa',diveDepth:WATER_Y-.57-y,inWater:true});
  swim(game,.3,{z:1});
  assert.equal(p.diveDepth,0);
  assert.ok(p.y>PALACE_BED+16 && !p.grounded);
  swim(game,.9);
  assert.equal(p.y,PALACE_BED+14);
  assert.ok(!p.inWater);
  Object.assign(p,palacePoint(5,-33),{y:PALACE_BED+18.9,h:4.9,grounded:false,vy:11});
  swim(game,.15);
  assert.ok(p.y>PALACE_BED+19 && p.y<PALACE_BED+20 && p.diveDepth>19);
  assert.ok(p.inWater);
});

test('a river swimmer can retreat without dipping, dive by chord, hold depth and resume',()=>{
  const game=createGame();
  // Choose the middle of the river away from the ferry and its passengers.
  const x=-85;
  surface(game,x,riverZ(x));
  const p=game.state.player;
  swim(game,.1,{z:1});
  assert.ok(p.z>riverZ(x) && p.diveDepth===0);
  swim(game,.16,{dive:true,jump:true});
  assert.ok(p.inWater && p.diveDepth>.7);
  const restored=createGame(game.save());
  swim(restored,.2);
  assert.equal(restored.state.player.diveDepth,p.diveDepth);
  swim(restored,.4,{jump:true});
  assert.equal(restored.state.player.diveDepth,0);
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
