import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {createMystery} from '../two/mystery-state.js';
import {createMysteryWorld} from '../two/mystery-world.js';
import {npcs,locations} from '../two/mystery-data.js';
import {pagodaPlan} from '../two/architecture.js';
import {BUILDINGS,groundHeight,terrainHeight,staticVolumeAt,constrainMove,REGIONS,regionAt,WATER_Y} from '../two/terrain.js';

const game=createGame(), mystery=createMystery(), world=createMysteryWorld(game.state,mystery);
const p=game.state.player;
function visit(s, stand=s.stand) {
  Object.assign(p,stand,{grounded:!s.submerged,diveDepth:s.submerged?WATER_Y-.57-stand.y:0,
    activity:null,mount:null,h:0,vx:0,vy:0,vz:0});
}
// Explore outward using exactly the movement collision response, including
// walls, narrow doors and the gallery floor. An isolated pocket cannot pass.
function approachOpen(s) {
  const seen=new Set(['0,0']), queue=[[0,0,s.stand.y]],delta=.35;
  for(let i=0;i<queue.length;i++) {
    const [u,v,y]=queue[i],x=s.stand.x+u*delta,z=s.stand.z+v*delta;
    if(Math.hypot(u,v)*delta>4.2)return true;
    for(const [du,dv] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const a=u+du,b=v+dv,key=a+','+b;
      if(seen.has(key))continue;
      const nx=s.stand.x+a*delta,nz=s.stand.z+b*delta;
      let ny;
      if(s.submerged){
        ny=terrainHeight(nx,nz)+.45;
        if(staticVolumeAt(nx,nz,ny,.25,1.25))continue;
      }else{
        const q=constrainMove(x,z,nx,nz,0,y,.25,1.42);
        if(Math.abs(q.x-nx)+Math.abs(q.z-nz)>.015)continue;
        ny=groundHeight(nx,nz,y);
        if(Math.abs(ny-y)>.34 || staticVolumeAt(nx,nz,ny+.04,.25,1.42))continue;
      }
      seen.add(key);queue.push([a,b,ny]);
    }
  }
  return false;
}

test('each of the 48 stations has a reachable approach and a visible E interaction on its declared floor',()=>{
  assert.equal(locations.length,48);
  const blocked=[];
  for(const s of world.stations) {
    visit(s);
    assert.equal(REGIONS[regionAt(s.x,s.z)].id,s.regionId,s.id);
    assert.ok(!staticVolumeAt(p.x,p.z,p.y+.04,.25,1.42),s.id+' has no standing room');
    if(!approachOpen(s)) blocked.push(s.id);
    assert.ok(world.nearby().some(c=>c.locationId===s.id && !c.npcId),s.id+' is unreachable');
  }
  assert.deepEqual(blocked,[]);
});
test('a surface swimmer cannot inspect the palace and a player below the gallery cannot inspect its upper floor',()=>{
  for(const s of world.stations.filter(s=>s.submerged)){
    visit(s);p.diveDepth=0;p.grounded=true;p.y=WATER_Y-.57;
    assert.ok(!world.nearby().some(c=>c.locationId===s.id));
    visit(s);
    assert.ok(world.nearby().some(c=>c.locationId===s.id));
  }
  const tower=world.locate('LOC_KYO_LOOKOUT');
  visit(tower);p.y=groundHeight(p.x,p.z);
  const building=BUILDINGS.find(b=>b.kind==='pagoda' && Math.abs(b.x-tower.x)<5 && Math.abs(b.z-tower.z)<5);
  const fifth=building.y+pagodaPlan(building).storeys[4].y;
  assert.ok(Math.abs(tower.y-fifth)<.16);
  assert.ok(tower.y>p.y+25);
  assert.ok(!world.nearby().some(c=>c.locationId===tower.id));
});
test('all named residents keep their identities, overlapping encounters and their delivery roster',()=>{
  const count=game.state.recipientTotal,people=world.people();
  assert.equal(people.length,npcs.length);
  for(const n of npcs){
    const who=people.find(x=>x.npcId===n.id);
    if(n.sourceBinding.legacyId){
      assert.equal(who.entity.id,n.sourceBinding.legacyId);
      assert.equal(who.entity.type,n.species);
      assert.equal(who.draw,false);
    }else assert.ok(!game.state.npcs.some(e=>e.id===n.id));
  }
  const dawn=world.locate('LOC_DAWN_REQUEST');
  visit(dawn,{x:307.4,z:169.5,y:dawn.y});
  const at=world.nearby();
  assert.ok(at.some(o=>o.npcId==='NPC_KINEKICHI'));
  assert.ok(at.some(o=>o.npcId==='NPC_KAEKICHI'));
  assert.ok(at.some(o=>o.locationId===dawn.id&&!o.npcId));
  p.mount='bike';assert.deepEqual(world.nearby(),[]);p.mount=null;
  const rider=people.find(o=>o.npcId==='NPC_SHIROASHI').entity,deer=rider.ridesDeer;
  assert.equal(deer.id,'deer-623');
  const home=deer.homeX;
  mystery.state.status.C02='active';world.update();
  const bench=world.locate('LOC_RIVER_TEABENCH');visit(bench);
  assert.ok(world.nearby().some(o=>o.npcId==='NPC_SHIROASHI'));
  assert.equal(deer.x,bench.x);
  mystery.state.status.C02='resolved';world.update();
  assert.equal(deer.homeX,home);
  assert.equal(game.state.recipientTotal,count);
  mystery.state.status.C01='resolved';
  assert.equal(world.people().find(n=>n.npcId==='NPC_FUDEM').locationId,'LOC_KYO_ARCHIVE');
});
