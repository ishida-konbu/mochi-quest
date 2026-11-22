import test from 'node:test';
import assert from 'node:assert/strict';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { bathEnclosure } from '../two/bath-enclosures.js';
import { isVillageWorkshop,villageYard } from '../two/village-workshop-plan.js';
import { villageWorkshopGeometry } from '../two/village-bath-workshops.js';
import { canOccupy,groundHeight,overheadHeight,terrainHeight,terrainMeshHeight,waterSurfaceAt } from '../two/terrain.js';

test('all village workshops stand on their own survey with an open bath-facing entrance',()=>{
  const sites=RETREATS.filter(isVillageWorkshop);
  assert.equal(sites.length,8);
  for(const site of sites){
    const r=bathEnclosure(site).room,level=waterSurfaceAt(site.x,site.z);
    for(const u of [-r.w/2,0,r.w/2])for(const v of [-r.d/2,0,r.d/2]){
      const y=terrainMeshHeight(...sitePoint(site,r.u+u,r.v+v))-level;
      assert.ok(y>-.425 && y<.173,site.name+' floor and its foundation meet grade');
    }
    const [x,z]=sitePoint(site,r.u,r.v+r.d*.38),floor=groundHeight(x,z);
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
