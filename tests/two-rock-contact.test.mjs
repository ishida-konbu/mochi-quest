import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from '../two/vendor/GLTFLoader.min.js';
import { setRiverStones } from '../two/scanned-stone.js';
import { workshopFrame } from '../two/civic-art.js';
import { RETREATS, retreatStones } from '../two/retreat-layout.js';
import * as T from '../two/vendor/three.module.min.js';
import { ROCKS, terrainHeight, groundHeight, staticVolumeAt, riverbankStones, seeded, springLevel } from '../two/terrain.js';
import { rockForm, rockParts, roundedStone } from '../two/rock-forms.js';
import { mountRockContact, rockRange } from '../two/rock-contact.js';

const paint=new T.MeshBasicMaterial({side:T.DoubleSide});
const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0));
function model(part){
  const {form,x,y,z,sx,sy,sz,yaw,pitch=0,roll=0}=part;
  const mesh=new T.Mesh(form==='round'?roundedStone(43):rockForm(form),paint);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.rotation.set(pitch,yaw,roll,'YXZ');mesh.updateMatrixWorld(true);
  return mesh;
}
function hit(mesh,x,z){
  ray.ray.origin.set(x,120,z);
  return ray.intersectObject(mesh)[0]?.point.y ?? -Infinity;
}

test('river boulders and tilted offshore reefs land at the drawn facets and release a jumper above them',()=>{
  const rocks=[...ROCKS.slice(0,4),ROCKS.find(r=>r.reef && r.rx>1), ROCKS.find(r=>r.winterReef)];
  for(const rock of rocks){
    const meshes=rockParts(rock,terrainHeight(rock.x,rock.z)).map(model);
    let sloped=0;
    for(const dx of [-.67,-.37,0,.38,.65]) for(const dz of [-.33,.04,.35]){
      const x=rock.x+dx*rock.rx, z=rock.z+dz*rock.rz;
      const top=Math.max(...meshes.map(mesh=>hit(mesh,x,z)));
      if (!Number.isFinite(top)) continue;
      const support=groundHeight(x,z,top+.1);
      // Overlapping reefs may carry a higher neighbour; separate, exposed
      // facets are the surfaces that a rider can actually approach.
      if(support>top+.005) continue;
      assert.ok(Math.abs(support-top)<.00001);
      assert.equal(staticVolumeAt(x,z,top+.01,0,.13),false);
      assert.equal(staticVolumeAt(x,z,top-.04,0,.13),true);
      if (Math.abs(top-(terrainHeight(rock.x,rock.z)+rock.h))>.07)sloped++;
    }
    assert.ok(sloped>=2,'exposed sides of '+[rock.x,rock.z]);
  }
});

test('rider clearance follows a circular footprint over the same sloping mesh at any tilt',()=>{
  for (const form of ['round',0,1,2,3]){
    const part={form,x:0,y:7,z:0,sx:2.4,sy:2.2,sz:.83,yaw:.74,
      pitch:form==='round'?.21:0,roll:form==='round'?-.19:0};
    const item={};
    mountRockContact(part,()=>item);
    const mesh=model(part);
    for (const [u,v,r] of [[.43,.16,.26],[1.72,.45,.42],[-.83,-.6,.92],[1.14,.82,.4]]){
      const {high}=rockRange(item.stone,u,v,r);
      let sampled=-Infinity;
      // Independent rays on concentric circles include both the footprint
      // boundary and any higher facet reached only inside the footprint.
      for(let i=0;i<=8;i++)for(let k=0;k<90;k++){
        const a=k*Math.PI*2/90, x=u+r*i/8*Math.cos(a), z=v+r*i/8*Math.sin(a);
        sampled=Math.max(sampled,hit(mesh,x*Math.cos(part.yaw)+z*Math.sin(part.yaw),
          -x*Math.sin(part.yaw)+z*Math.cos(part.yaw)));
      }
      assert.ok(high>=sampled-1e-6 && high<sampled+.045, `form ${form} pad ${r}: ${high}, ${sampled}`);
    }
  }
});

test('the loose stones along the Sakuragawa have their visible height and roll',()=>{
  let seen=0, exposed=0;
  const mesh=new T.Mesh(roundedStone(43),paint);
  for (const part of riverbankStones(seeded(27158))){
    seen++;
    mesh.position.set(part.x,part.y,part.z);mesh.scale.set(part.sx,part.sy,part.sz);
    mesh.rotation.set(part.pitch,part.yaw,part.roll,'YXZ');mesh.updateMatrixWorld(true);
    for(const u of [0,.42]){
      const x=part.x+u*part.sx, z=part.z+.16*part.sz;
      const top=hit(mesh,x,z);
      const support=groundHeight(x,z,top+.05);
      assert.ok(support>=top-.00001);
      if(Math.abs(support-top)<.00001)exposed++;
    }
  }
  assert.equal(seen,464);
  assert.ok(exposed>400,'sampled the exposed stones as well as the submerged shoal');
});


test('loaded scans give every shoal and spring its drawn geometry',async t=>{
  const bytes=await readFile(new URL('../two/assets/world/moss-stones.glb',import.meta.url));
  // Decode the shipped vertex and index buffers with the game loader. A Node
  // test only needs their positions and has no renderer to decode the JPEGs.
  const loader=new GLTFLoader().register(parser=>({name:'geometryOnly',beforeRoot(){
    for(const mesh of parser.json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
  }}));
  const asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  asset.scene.traverse(part=>{if(part.isMesh)part.material.map=new T.Texture();});
  t.mock.method(GLTFLoader.prototype,'load',(_url,onLoad)=>onLoad(asset));
  const pools=RETREATS.map(retreat=>({retreat,y:springLevel(retreat)-.52}));
  // The five wayside foundations are painted before the traveller sees the
  // rocks. Feed those real geometry and transforms through their normal frame.
  const painter={shapes:{rock:roundedStone(43)},part(_shape,x,y,z,sx,sy,sz,_ink,yaw,pitch,roll){
    const transform=new T.Object3D();
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);
    transform.rotation.set(pitch,yaw,roll,'YXZ');transform.updateMatrix();return transform.matrix;
  }};
  for(let i=0;i<3;i++)painter.shapes['springCrag'+i]=roundedStone(i*2.59+.42);
  for(const site of RETREATS.filter(s=>!s.regional)){
    const f=workshopFrame(painter,site,springLevel(site));
    for(const q of retreatStones(site).filter(q=>q.scanned)){
      f.rim(q.i,'springCrag'+q.i%3,q.u,.075,q.v,q.w*.64,q.h*.64,q.d*.64,0,null,q.angle,0,.13*Math.sin(q.i));
      if(q.i%4===1)f.rim(q.i,'rock',q.u*.99,.077+.64*q.h,q.v*.99,q.w*.76,q.h*.37,q.d*.76,0,null,q.angle,0,.13*Math.sin(q.i));
    }
  }
  const scene=new T.Scene();
  await setRiverStones(scene,pools);
  const batches=scene.children.filter(o=>o.isInstancedMesh);
  const count=(n,batch)=>n+batch.count;
  assert.equal(batches.slice(0,6).length,6);
  assert.equal(batches.slice(6).reduce(count,0),RETREATS.reduce((n,r)=>n+retreatStones(r).filter(q=>q.scanned).length,0));

  const instance=new T.Matrix4(), point=new T.Vector3();
  let shoals=0,rims=0,respectedSlopes=0;
  for(const [i,batch] of batches.entries()){
    const mesh=new T.Mesh(batch.geometry,paint);
    mesh.matrixAutoUpdate=false;
    for(let j=0;j<batch.count;j++){
      batch.getMatrixAt(j,instance);
      mesh.matrix.copy(instance);mesh.updateMatrixWorld(true);
      for(const u of [-.28,0,.26]){
        point.set(u,.55,.1).applyMatrix4(instance);
        const top=hit(mesh,point.x,point.z);
        if(!Number.isFinite(top))continue;
        const floor=groundHeight(point.x,point.z,top+.08);
        assert.ok(floor>=top-.00009,JSON.stringify({i,j,u,x:point.x,z:point.z,top,floor}));
        if(Math.abs(floor-top)<.00009){
          if(i<6)shoals++;else rims++;
          if(u!==0 && !staticVolumeAt(point.x,point.z,top+.014,0,.12)){
            assert.equal(staticVolumeAt(point.x,point.z,top-.014,0,.12),true);
            respectedSlopes++;
          }
        }
      }
    }
  }
  assert.ok(shoals>100 && rims>35 && respectedSlopes>90,[shoals,rims,respectedSlopes]);
});
