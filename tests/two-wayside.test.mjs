import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { COURT, RETREATS, sitePoint, retreatStones } from '../two/retreat-layout.js';
import { terrainHeight, groundHeight, waterDepth, waterSurfaceAt, constrainMove, solidHeightAt, overheadHeight, TREES, BUILDINGS } from '../two/terrain.js';

test('a rolling dango can enter, bathe and resume at each rural spring',()=>{
  const game=createGame(),p=game.state.player;
  assert.equal(RETREATS.length,6);
  assert.equal(RETREATS.filter(s=>s.hut).length,3);
  for(const s of RETREATS){
    const [x,z]=sitePoint(s,0,s.rz+4);
    Object.assign(p,{x,z,y:groundHeight(x,z),mode:'dango',mount:null,h:0,vy:0,speed:0,vx:0,vz:0,grounded:true,activity:null,hp:38,mp:54});
    for(let i=0;i<120;i++){
      const dx=s.x-p.x,dz=s.z-p.z,d=Math.hypot(dx,dz);
      if(d<1.25)break;
      p.invulnerable=2;
      game.step(1/60,{x:dx/d,z:dz/d});
    }
    assert.ok(Math.hypot(s.x-p.x,s.z-p.z)<1.25,s.name+' approach');
    assert.ok(BUILDINGS.every(b=>Math.hypot(s.x-b.x,s.z-b.z)>18));
    assert.ok(TREES.every(t=>Math.hypot(s.x-t.x,s.z-t.z)>5));
    assert.ok(waterDepth(s.x,s.z)>.49);
    assert.equal(game.nearest()?.target.retreat,s);
    game.act('interact');assert.equal(p.activity,'bath');assert.equal(p.mode,'dango');
    const resumed=createGame(game.save());assert.equal(resumed.restored,true);
    for(let i=0;i<36;i++)resumed.step(.1,{});
    assert.equal(resumed.state.player.hp,100);assert.equal(resumed.state.player.mp,100);
    assert.ok(resumed.state.player.buffs.warm>19);
  }
});

test('the magistrates hall has a clear axial approach, supported steps and enclosed hearing room',()=>{
  const {x,z}=COURT,base=terrainHeight(x,z);
  let pos={x,z:z+27},feet=groundHeight(pos.x,pos.z);
  for(let k=0;k<124;k++){
    pos=constrainMove(pos.x,pos.z,x,pos.z-.20,0,feet);
    feet=groundHeight(pos.x,pos.z,feet);
  }
  assert.ok(pos.z<z+2.4);
  assert.ok(Math.abs(feet-base-1.05)<.01);
  assert.ok(overheadHeight(x,z+2,feet)-feet>6);
  assert.ok(solidHeightAt(x,z-5.68,0,feet)>base+7);
  assert.ok(solidHeightAt(x+9,z+23.7,0,base) >=base+2);
  assert.ok(solidHeightAt(x,z+23.7,0,base) <base+.35);
  assert.ok(solidHeightAt(x-10.4,z-4.82,0,feet)>=base+3.4);
});

test('the dome of each scanned rim rock supports the player at its visible crown',()=>{
  for(const s of RETREATS) {
    const level=waterSurfaceAt(s.x,s.z);
    const q=retreatStones(s).find(q=>q.scanned && q.v>0);
    const [x,z]=sitePoint(s,q.u,q.v);
    const crown=level-.03+1.18*q.h;
    assert.ok(Math.abs(groundHeight(x,z,crown)-crown)<.015,s.name);
  }
});
