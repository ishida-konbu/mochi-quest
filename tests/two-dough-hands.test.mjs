import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,MeshBasicMaterial,Vector3} from '../two/vendor/three.module.min.js';
import {makeDoughArm} from '../two/cooking-arms.js';

test('a working hand stretches through the wrist, keeps its padded grip and settles after a pull',()=>{
  const root=new Group(),arm=makeDoughArm(root,1,new MeshBasicMaterial()),mesh=root.children[0];
  const origin=new Vector3(.66,.85,.42),body={width:1,mid:.82,height:.83,depth:.77,front:.1};
  const short=new Vector3(.55,.86,1.14),long=new Vector3(.35,1.05,1.99);
  const vertices=mesh.geometry.attributes.position, indices=mesh.geometry.index.array;
  const v=i=>new Vector3().fromBufferAttribute(vertices,i);
  const span=row=>v(row*25).distanceTo(v(row*25+12));
  const pose=(end,t,beat='work')=>arm.update(origin,end,1,body,t,.72,beat);
  pose(short,0);const compact=span(16);
  pose(long,1);assert.ok(span(16)<compact*.84);
  assert.ok(span(36)>span(30)*1.08);
  assert.ok(v(vertices.count-1).distanceTo(long)<2e-7);
  for(let i=0;i<indices.length;i+=3){
    const a=v(indices[i]),b=v(indices[i+1]),c=v(indices[i+2]);
    assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-14,'collapsed skin triangle '+i/3);
  }
  const advanced=long.clone().add(new Vector3(-.17,.08,-.10));
  pose(advanced,1.016);const trailing=v(18*25);
  assert.ok(v(vertices.count-1).distanceTo(advanced)<2e-7);
  for(let i=1;i<=30;i++)pose(advanced,1.016+i/60);
  const settled=v(18*25);
  assert.ok(trailing.distanceTo(settled)>.025);
  pose(advanced,0,'next cut');
  assert.ok(v(18*25).distanceTo(settled)<.001);
  for(const n of mesh.geometry.attributes.normal.array)assert.ok(Number.isFinite(n));
});
