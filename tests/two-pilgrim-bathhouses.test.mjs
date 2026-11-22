import test from 'node:test';
import assert from 'node:assert/strict';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { bathEnclosure } from '../two/bath-enclosures.js';
import { hasPilgrimBathhouse,pilgrimRoofPoint,yardFixture } from '../two/pilgrim-lodge-plan.js';
import { SNOW_SPRING,waterSurfaceAt,groundHeight,canOccupy,staticVolumeAt } from '../two/terrain.js';

const sites=[...RETREATS.filter(hasPilgrimBathhouse),SNOW_SPRING];

test('the curved roof surfaces support landings at their painted eaves and slopes',()=>{
  for(const s of sites){
    const winter=s===SNOW_SPRING;
    const r=winter?{u:0,v:-8.9,w:8.74,d:3.54,eave:3.56,rise:1.46}:bathEnclosure(s).room;
    const level=waterSurfaceAt(s.x,s.z)+(winter?.52:0);
    for(const [u,v] of [[.61,.64],[-.64,.67],[.86,.73],[-.75,-.41]]){
      const [a,y,b]=pilgrimRoofPoint(s.kind,(r.w+.66)/2,(r.d+.65)/2,r.eave,r.rise,u,v);
      const [x,z]=sitePoint(s,r.u+a,r.v+b);
      assert.ok(Math.abs(groundHeight(x,z,level+y+.14)-level-y)<.001,s.name+' at '+[u,v]);
    }
    // A passenger can still stand on the open floor beneath that roof.
    const [x,z]=sitePoint(s,r.u+.5,r.v+.28*r.d);
    assert.ok(canOccupy(x,z,groundHeight(x,z),.24),s.name+' washing bay');
  }
});

test('the new kiln and votive light have solid footings outside the walk-in beach',()=>{
  for(const s of sites.filter(q=>['temple','sakai'].includes(q.kind))){
    const p=bathEnclosure(s),q=yardFixture(s.kind,p),level=waterSurfaceAt(s.x,s.z);
    const [x,z]=sitePoint(s,p.room.u+q.x,p.room.v+q.z);
    assert.ok(staticVolumeAt(x,z,level+.27,.18),s.name+' yard furniture');
    const [a,b]=sitePoint(s,0,s.rz*.78);
    assert.ok(canOccupy(a,b,groundHeight(a,b),.24),s.name+' walk-in entry');
  }
});
