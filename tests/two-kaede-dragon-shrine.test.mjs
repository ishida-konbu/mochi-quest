import test from 'node:test';
import assert from 'node:assert/strict';
import { KAEDE_DRAGON_SHRINE, DRAGON_PLINTH, DRAGON_ROOF, dragonRoofHeight } from '../two/kaede-dragon-layout.js';
import { terrainContactHeight, groundHeight, waterSurfaceAt, canOccupy, staticVolumeAt } from '../two/terrain.js';

test('the dragon shrine seats in the dry bank with a solid chamber, curved roof and clear approach',()=>{
  const {x,z,yaw}=KAEDE_DRAGON_SHRINE, base=terrainContactHeight(x,z);
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const point=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
  for (const side of [-1,1]) for (const end of [-1,1]){
    const corner=point(side*DRAGON_PLINTH.width/2,end*DRAGON_PLINTH.depth/2);
    const floor=terrainContactHeight(...corner);
    assert.ok(floor>waterSurfaceAt(...corner));
    assert.ok(floor>base+DRAGON_PLINTH.bottom && floor<base+DRAGON_PLINTH.top);
  }
  assert.ok(staticVolumeAt(x,z,base+DRAGON_PLINTH.top+.02,.12,.7));
  for (const t of [-.83,-.5,0,.5,.83]){
    const p=point(t*DRAGON_ROOF.width/2,DRAGON_ROOF.z);
    assert.ok(Math.abs(groundHeight(...p,base+2.6)-base-dragonRoofHeight(Math.abs(t)))<.026);
  }
  for (const v of [1.3,1.8,2.3,2.8]){
    const p=point(0,v),y=terrainContactHeight(...p);
    assert.ok(y>waterSurfaceAt(...p) && canOccupy(...p,y,.32));
  }
});

test('the fitted shrine pieces carry continuous UVs and one material finish per triangle',async()=>{
  const {buildKaedeDragonShrine}=await import('../two/kaede-dragon-shrine.js');
  const geometry=buildKaedeDragonShrine().geometry;
  const {position,normal,uv,finishId}=geometry.attributes;
  for(const attr of [normal,uv,finishId]){
    assert.equal(attr.count,position.count);
    assert.ok(attr.array.every(Number.isFinite));
  }
  assert.equal(new Set(finishId.array).size,6);
  for(let i=0;i<geometry.index.count;i+=3){
    const [a,b,c]=geometry.index.array.subarray(i,i+3);
    assert.equal(finishId.getX(a),finishId.getX(b));
    assert.equal(finishId.getX(a),finishId.getX(c));
  }
  geometry.computeBoundingBox();
  assert.ok(Math.abs(geometry.boundingBox.max.x-DRAGON_ROOF.width/2)<.02);
  assert.ok(geometry.boundingBox.min.y<=DRAGON_PLINTH.bottom);
});
