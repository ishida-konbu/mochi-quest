import test from 'node:test';
import assert from 'node:assert/strict';
import {TREES,staticVolumeAt,treeGround,terrainMeshHeight,seeded} from '../two/terrain.js';
import {PEACH_TREES,CLIFF_PINES} from '../two/pilgrimage-layout.js';
import {peachStrokes,cliffStrokes} from '../two/pilgrimage-trees.js';
import {forestGeometry} from '../two/forest-mesh.js';

function point(tree,local){
  const yaw=tree.seed*2.39996323,c=Math.cos(yaw),s=Math.sin(yaw);
  return {x:tree.x+tree.h*(c*local.x+s*local.z),y:treeGround(tree)+tree.h*local.y,
    z:tree.z+tree.h*(-s*local.x+c*local.z)};
}
test('the bare landing bough of every instanced tree form has contact at the rendered ring',()=>{
  const forms=new Map();
  for(const tree of TREES)if(tree.form!==undefined && tree.kind!=='moso')forms.set(tree.form,tree);
  assert.equal(forms.size,56);
  for(const [form,tree] of forms){
    const q=point(tree,forestGeometry(form,true));
    assert.ok(staticVolumeAt(q.x,q.z,q.y-.05,.035,.10),'wood of form '+form);
  }
});
test('every bamboo form has distinct leaning stems and open space between them',()=>{
  for(let form=56;form<60;form++){
    const tree=TREES.find(t=>t.form===form),mesh=forestGeometry(form);
    for(const culm of mesh.userData.culms){
      const q=point(tree,culm.points[2]);
      assert.ok(staticVolumeAt(q.x,q.z,q.y-.04,.025,.08),'bamboo stem '+form);
    }
    const gap=point(tree,{x:0,y:.18,z:0});
    assert.equal(staticVolumeAt(gap.x,gap.z,gap.y,.015,.07),false,'gap in form '+form);
    mesh.dispose();
  }
});

test('peach orchard and cliff pines carry their outer bough contacts through scale, slope and yaw',()=>{
  for(const kind of ['peach','pine']){
    const trees=kind==='peach'?PEACH_TREES:CLIFF_PINES;
    for(let form=0;form<(kind==='peach'?5:3);form++){
      const t=trees.find(q=>(kind==='peach'?q.form??q.seed%5:q.type)===form);
      const scale=t.size??t.scale,yaw=t.turn??t.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
      let count=0;
      const brush={stroke(tint,knots){
        const [u,h,v]=knots.at(-1);
        if(Math.hypot(u,v)<1) return;
        const x=t.x+scale*(c*u+s*v),z=t.z+scale*(-s*u+c*v),y=terrainMeshHeight(t.x,t.z)+h*scale;
        assert.ok(staticVolumeAt(x,z,y-.025,.025,.05),kind+' '+form);
        count++;
      }};
      if(kind==='peach')peachStrokes(brush,seeded(76231+form*3504));
      else cliffStrokes(brush,form);
      assert.ok(count>=5);
    }
  }
});
