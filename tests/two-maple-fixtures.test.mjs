import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {MAPLE_ROCK_GROUPS} from '../two/seasons.js';
import {SOURCE_STONES} from '../two/mountain-streams.js';
import {BUILDINGS, GATES, TREES, gateFooting, groundHeight, nearRoad, staticVolumeAt, terrainMeshHeight, waterSurfaceAt} from '../two/terrain.js';

test('the maple torii straddles the road with its sockets and both lanterns seated on the hillside',()=>{
  const gate=GATES.find(g=>g.x>200);
  const lamps=[];
  for(const side of [-1,1]){
    for(const lamp of [false,true]){
      const foot=gateFooting(gate,side,lamp);
      assert.equal(nearRoad(foot.x,foot.z,foot.radius),false,'stone must clear the riding lane');
      for(let i=0;i<24;i++){
        const angle=i*Math.PI/12;
        const soil=terrainMeshHeight(foot.x+foot.radius*Math.cos(angle),foot.z+foot.radius*Math.sin(angle));
        assert.ok(foot.bottom<soil && foot.top>soil,'a level cap with the lower rim in earth');
      }
      assert.ok(staticVolumeAt(foot.x,foot.z,foot.top+.12,.06,.48),'post or lantern stem has real contact');
      if(lamp)lamps.push(foot);
    }
  }
  assert.ok(Math.abs(lamps[0].top-lamps[1].top)>.5);
  for(const lamp of lamps)for(const tree of TREES){
    if(Math.hypot(tree.x-lamp.x,tree.z-lamp.z)>.5*tree.h+lamp.radius)continue;
    const root=terrainMeshHeight(tree.x,tree.z);
    assert.ok(root+.25*tree.h>lamp.top+2.3 || root+tree.h<lamp.bottom,'canopy covers a lantern');
  }
  const y=groundHeight(gate.x,gate.z);
  assert.equal(staticVolumeAt(gate.x,gate.z,y+.05,.45,1.75),false);
});

test('the bicycle port in the maple valley has unobstructed access to both parked bicycles',()=>{
  const game=createGame();
  const port=game.state.objects.find(o=>o.type==='port' && o.x===297 && o.z===-110);
  assert.ok(port);
  for(const [x,z,scale] of MAPLE_ROCK_GROUPS){
    // The outer stones reach 1.65 m beyond the group centre. A 3 m disc
    // around the rack includes both wheels, the sign and the boarding side.
    assert.ok(Math.hypot(port.x-x,port.z-z)>3+1.65+1.21*scale);
  }
  // The parked wheels are 0.65 m in front of and behind each frame's origin.
  // Check the painted ground as well as collision at every tyre and sign corner.
  const feet=[];
  for(const x of [-.15,.47])for(const axle of [-.65,.65]){
    feet.push([x+Math.sin(-.21)*axle,Math.cos(-.21)*axle]);
  }
  for(const x of [-1.01,-.63])for(const z of [-.43,-.07])feet.push([x,z]);
  for(const [dx,dz] of feet){
    assert.ok(Math.abs(terrainMeshHeight(port.x+dx,port.z+dz)-port.y)<.015,'ground beneath '+[dx,dz]);
    assert.ok(Math.abs(groundHeight(port.x+dx,port.z+dz)-port.y)<.015,'collision beneath '+[dx,dz]);
  }
  for(const side of [-1,1]){
    const x=port.x+side*5.5,z=port.z+1.5,p=game.state.player;
    Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vz:0,vy:0,speed:0,grounded:true});
    for(let i=0;i<240 && side*(p.x-port.x)>1.1;i++)game.step(1/60,{x:-side,z:0});
    assert.ok(Math.abs(p.x-port.x)<1.2,'walk onto the level turnout');
    assert.equal(game.nearest()?.target,port);
    assert.ok(game.act('interact'));
    assert.equal(p.mount,'bike');
    const resumed=createGame(game.save());
    assert.equal(resumed.state.player.mount,'bike');
    assert.equal(resumed.state.objects.find(o=>o.id===port.id).bikes,1);
    assert.ok(game.act('interact'));
    assert.equal(port.bikes,2);
  }
});

test('the reading table is accessible from the bridge and a save from the former dye shop resumes at the spring',()=>{
  const game=createGame(),p=game.state.player;
  const table=game.state.objects.find(o=>o.id==='manga-39');
  assert.ok(!BUILDINGS.some(b=>b.x===274 && b.z===-127));
  assert.ok(Math.hypot(table.x-297,table.z+110)<4);
  for(const dx of [-.48,.48])for(const dz of [-.32,.32])
    assert.ok(Math.abs(terrainMeshHeight(table.x+dx,table.z+dz)-table.y)<.015);
  Object.assign(p,{x:table.x,z:table.z+.9,y:table.y,h:0,grounded:true});
  assert.equal(game.nearest()?.target,table);
  assert.ok(game.act('interact'));
  assert.equal(p.activity,'read');

  const old=game.save();
  old.version=11;
  Object.assign(old.player,{x:274,z:-127,y:25.2,h:0,grounded:true,activity:null,activityTime:0});
  old.delivered=['rabbit-336']; // The scribe who previously worked at the dye shop.
  const resumed=createGame(old),visitor=resumed.state.player;
  assert.ok(resumed.restored && visitor.inWater);
  assert.ok(Math.abs(visitor.y-waterSurfaceAt(274,-127)+.57)<.001);
  assert.equal(resumed.state.objects.find(o=>o.id===table.id).cooldown,table.cooldown);
  assert.ok(resumed.state.delivered.has('rabbit-336'));
  assert.ok(resumed.state.npcs.some(n=>n.id==='rabbit-336' && n.role==='scribe'));
});

test('the stone seams at the head of the spring support a traveller at their visible summits',()=>{
  for(const {x,z,top} of SOURCE_STONES){
    assert.equal(groundHeight(x,z,top),top);
    assert.ok(staticVolumeAt(x,z,top-.025,0,.12));
    assert.equal(staticVolumeAt(x,z,top+.005,0,.12),false);
  }
});
