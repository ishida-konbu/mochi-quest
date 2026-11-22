import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import {createCraneFlight} from '../two/crane-flight.js';
import {poseBeast} from '../two/beast-art.js';

function fixture() {
  const mesh=new T.Group(), limbs={}, triangle=new T.BufferGeometry(), ink=new T.MeshBasicMaterial();
  function joint(key,parent,x,y,z) {
    const joint=new T.Group();
    limbs[key]=joint;
    joint.position.set(x,y,z);
    parent.add(joint);
    joint.add(new T.Mesh(triangle,ink));
    return joint;
  }
  const trunk=joint('trunk',mesh,0,.3,0);
  joint('mask',trunk,0,.24,.91);
  for(const side of [-1,1]) joint('wing'+side,trunk,.32*side,.2,.1);
  const shadow=new T.Mesh(triangle,ink);
  shadow.scale.set(1.1,1.5,1);
  mesh.add(shadow);
  return {mesh,limbs,shadow};
}

test('all cranes carry the same bank, neck and feather poses as the native rig at every distance',()=>{
  const root=new T.Group(), source=fixture(), near=fixture();
  const flight=createCraneFlight(root,source,40), sample=new T.Matrix4();
  const birds=[
    {type:'bird',phase:1.5,heading:-.63,stature:1.3,y:45,altitude:40,x:-310,z:28},
    {type:'bird',phase:3.2,heading:2.18,stature:.95,y:12,altitude:6,x:43,z:19},
  ];
  const shadow=root.children.at(-1);
  for(let i=0;i<181;i++) {
    const t=i/60;
    flight.begin();
    for(const bird of birds) flight.add(bird,bird.x,bird.z,t,1);
    flight.end();
    for(const [index,bird] of birds.entries()) {
      near.mesh.position.set(bird.x,bird.y,bird.z);
      near.mesh.rotation.y=bird.heading;
      near.mesh.scale.setScalar(bird.stature);
      poseBeast(near.limbs,bird,t);
      near.mesh.updateMatrixWorld(true);
      Object.values(near.limbs).forEach((joint,j)=>{
        const batch=root.children[j];
        assert.equal(batch.count,2);
        batch.getMatrixAt(index,sample);
        const real=joint.children[0].matrixWorld;
        for(let k=0;k<16;k++) assert.ok(Math.abs(real.elements[k]-sample.elements[k])<.00002);
      });
    }
    assert.equal(shadow.count,1);
    shadow.getMatrixAt(0,sample);
    assert.ok(Math.abs(sample.elements[13]-(birds[1].y-birds[1].altitude+.04))<.00001);
  }
  flight.begin();
  flight.end();
  for(const batch of root.children) assert.ok(!batch.visible && batch.count===0);
});
