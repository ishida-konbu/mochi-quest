import test from 'node:test';
import assert from 'node:assert/strict';
import {TREES,terrainMeshHeight,treeGround} from '../two/terrain.js';
import {isNishiyamaTree} from '../two/mountain-woodland.js';
import {forestGeometry} from '../two/forest-mesh.js';
import {bambooFootDrops,distantCulms,markCulms} from '../two/bamboo-culms.js';

const stands=TREES.filter(t=>t.kind==='moso' && isNishiyamaTree(t));
const forms=new Map([...new Set(stands.map(t=>t.form))].map(i=>[i,forestGeometry(i)]));

test('each western bamboo culm has a grounded foot on the actual hillside at both viewing distances',()=>{
  let formerlyAfloat=0;
  for(const tree of stands){
    const shape=forms.get(tree.form),ground=treeGround(tree),rotation=tree.seed*2.39996323;
    const cs=Math.cos(rotation),sn=Math.sin(rotation),positions=shape.attributes.position;
    const drops=new Float32Array(shape.userData.culms.length);
    bambooFootDrops({tree,ground,rotation},shape,terrainMeshHeight,drops);
    const soil=(x,z)=>terrainMeshHeight(tree.x+(cs*x+sn*z)*tree.h,tree.z+(-sn*x+cs*z)*tree.h);
    for(const [slot,{firstVertex,points,radii}] of shape.userData.culms.entries()){
      for(let k=0;k<6;k++){
        const v=firstVertex+k,bed=soil(positions.getX(v),positions.getZ(v));
        assert.ok(ground+tree.h*(positions.getY(v)+drops[slot])<=bed-.1);
      }
      const p=points[0],bed=soil(p.x,p.z),base=ground+tree.h*p.y;
      if(base>bed+.01)formerlyAfloat++;
      const farBase=base+tree.h*drops[slot];
      for(let side=0;side<8;side++){
        const a=side*Math.PI/4;
        assert.ok(farBase<soil(p.x+radii[0]*Math.cos(a),p.z+radii[0]*Math.sin(a)));
      }
    }
  }
  assert.ok(formerlyAfloat>100,'exercise the downhill side of real steeply planted clusters');
});

test('the distant strokes keep the individual shafts, their narrow sections and the gaps between them',()=>{
  for(const shape of forms.values()){
    markCulms(shape);
    const culms=shape.userData.culms,far=distantCulms(culms),tag=shape.attributes.bambooCulm;
    const p=far.attributes.position,edges=far.attributes.culmEdge,perStem=p.count/culms.length;
    assert.ok(culms.length>=5);
    for(const [slot,{points,radii,firstVertex,endVertex}] of culms.entries()){
      assert.equal(tag.getX(firstVertex),slot+1);
      assert.equal(tag.getX(firstVertex+6),-slot-1);
      assert.equal(tag.getX(endVertex-1),-slot-1);
      assert.equal(tag.getX(endVertex),0,'lateral twigs still dissolve with the foliage');
      for(let j=0;j<perStem;j+=2){
        const i=slot*perStem+j;
        const ring=points.findIndex(v=>Math.hypot(v.x-p.getX(i),v.y-p.getY(i),v.z-p.getZ(i))<1e-6);
        assert.ok(ring>=0,'stroke follows the surveyed 3D shaft');
        assert.ok(Math.abs(edges.getX(i+1)-radii[ring])<1e-6,'diameter is independent of viewing distance');
        assert.equal(edges.getX(i),-edges.getX(i+1));
        assert.equal(edges.getY(i),j===0?slot+1:0);
      }
    }
    // The clump must resolve into distinct fine lines even in its narrowest aspect.
    for(let direction=0;direction<Math.PI;direction+=Math.PI/16){
      const spans=culms.map(({points,radii})=>{
        const c=points[2].x*Math.cos(direction)+points[2].z*Math.sin(direction);
        return [c-radii[2],c+radii[2]];
      }).sort((a,b)=>a[0]-b[0]);
      let distinct=1,right=spans[0][1];
      for(const [left,end] of spans.slice(1)){
        if(left>right+.004)distinct++;
        right=Math.max(right,end);
      }
      assert.ok(distinct>=3,'at least three separated lines in every direction');
    }
  }
});
