import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { villagePools } from '../two/village-bath-courses.js';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { bathEnclosure } from '../two/bath-enclosures.js';
import { isVillageWorkshop,villageYard } from '../two/village-workshop-plan.js';
import { villageWorkshopGeometry } from '../two/village-bath-workshops.js';
import { canOccupy,groundHeight,overheadHeight,terrainHeight,terrainMeshHeight,waterSurfaceAt,springLevel } from '../two/terrain.js';

test('all village workshops stand on their own survey with an open bath-facing entrance',()=>{
  const sites=RETREATS.filter(isVillageWorkshop);
  assert.equal(sites.length,8);
  for(const site of sites){
    const r=bathEnclosure(site).room,level=waterSurfaceAt(site.x,site.z);
    for(const u of [-r.w/2,0,r.w/2])for(const v of [-r.d/2,0,r.d/2]){
      const y=terrainMeshHeight(...sitePoint(site,r.u+u,r.v+v))-level;
      assert.ok(y>-.425 && y<.173,site.name+' floor and its foundation meet grade');
    }
    const [x,z]=sitePoint(site,r.u+.85,r.v+r.d*.38),floor=groundHeight(x,z);
    assert.ok(Math.abs(floor-level-.18)<.001);
    assert.ok(canOccupy(x,z,floor),site.name+' open side faces the water');
    assert.ok(Math.abs(overheadHeight(x,z,floor)-level-r.eave)<.001);
    for(const distant of [true,false]){
      const g=villageWorkshopGeometry(site,distant);
      for(const attr of ['position','normal','color'])
        assert.ok(g.getAttribute(attr).array.every(Number.isFinite),site.name+' '+attr);
      assert.ok(g.index.count>0);
    }
  }
});

test('the passage of bent bamboo clears both shoulders and carries a traveller on its crown',()=>{
  const site=RETREATS.find(s=>s.id==='shrine-sasafune');
  const a=villageYard(site,bathEnclosure(site)),level=waterSurfaceAt(site.x,site.z);
  for(let j=0;j<=24;j++){
    const dz=(j/24-.5)*(a.d+1.30),[x,z]=sitePoint(site,a.x,a.z+dz),floor=terrainHeight(x,z);
    assert.ok(canOccupy(x,z,floor,.24,1.42),'the lane extends beyond both ends of the arch');
    if(Math.abs(dz)<a.d/2-.04){
      const under=overheadHeight(x,z,floor);
      assert.ok(under>floor+2.48 && under<floor+2.77);
      assert.ok(Math.abs(groundHeight(x,z,under+.85)-level-a.post-.685)<.035);
    }
  }
});

function walkTo(game,site,point){
  const p=game.state.player,[x,z]=sitePoint(site,...point);
  for(let i=0;i<400;i++){
    const dx=x-p.x,dz=z-p.z,range=Math.hypot(dx,dz);
    if(range<.11)return;
    game.step(1/60,{x:dx/range,z:dz/range});
  }
  assert.fail(site.name+' blocked the walk to '+point);
}
test('all three jars and both elevations of the rock and rice baths have two-way walking access',()=>{
  let tried=0;
  for(const s of RETREATS.filter(isVillageWorkshop)){
    for(const pool of villagePools(s)||[]){
      const entry=[0,s.rz+1.06],game=createGame(),p=game.state.player;
      const [x,z]=sitePoint(s,...entry);
      Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vy:0,vz:0,speed:0,grounded:true});
      game.step(1/60);
      let route=[];
      if(s.kind==='earthen')route=[[0,2.85],[pool.u,2.85]];
      if(pool.id==='sinter-head')route=[[0,.60],[-1.72,-.13],[-1.72,-2.00]];
      if(pool.id==='upper-field')route=[[0,.86],[0,-1.41],[0,-1.92]];
      for(const waypoint of route)walkTo(game,s,waypoint);
      walkTo(game,s,[pool.u,pool.v]);
      // Let the last descending stride land on the floor of the upper field.
      for(let i=0;i<28;i++)game.step(1/60);
      assert.equal(game.nearest()?.place?.id,pool.id);
      assert.ok(game.act('interact'),pool.name);
      assert.equal(p.bathPose.id,pool.id);
      assert.equal(p.bathWaterY,springLevel(s)+pool.y);
      assert.equal(createGame(game.save()).state.player.bathPose.id,pool.id);
      for(let i=0;i<250;i++)game.step(1/60);
      for(const waypoint of route.toReversed())walkTo(game,s,waypoint);
      walkTo(game,s,entry);
      assert.equal(p.inWater,false,pool.name+' exits onto dry land');
      tried++;
    }
  }
  assert.equal(tried,7);
});
