import test from 'node:test';
import assert from 'node:assert/strict';
import { peachSprig } from '../two/peach-blossom.js';
import { peachModel } from '../two/flowering-peaches.js';

test('modeled flowering shoots retain their depth and silhouette across orchard detail levels',()=>{
  for(let form=0;form<5;form++)for(let variant=0;variant<3;variant++){
    const fine=peachSprig(form,variant,true),middle=peachSprig(form,variant,false);
    for(const shoot of [fine,middle]){
      shoot.computeBoundingBox();
      const {min,max}=shoot.boundingBox;
      assert.ok(max.z-min.z>.40,'lateral forks must extend out on both sides of the shoot');
      assert.ok(min.z<-.10 && max.z>.10);
      assert.equal(shoot.attributes.color.count,shoot.attributes.position.count);
      assert.ok(shoot.attributes.normal.array.every(Number.isFinite));
    }
    // The expensive extra petal surfaces and stamens disappear in the midground.
    // Keep the actual positions of buds and open flowers at the same endpoints.
    assert.ok(middle.index.count<fine.index.count*.33);
    assert.ok(fine.boundingBox.min.distanceTo(middle.boundingBox.min)<.012);
    assert.ok(fine.boundingBox.max.distanceTo(middle.boundingBox.max)<.012);
  }
  const close=peachModel(1),middle=peachModel(1,false);
  assert.equal(close[0][0],middle[0][0],'the woody scaffold is shared');
  for(const [,paint] of close){
    assert.equal(paint.vertexColors,true);
    assert.equal(paint.map,null,'the near model needs real petals when seen edge-on');
  }
});
