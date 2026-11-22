import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { BOUND, CONNECTING_ROADS, WATER_Y, terrainHeight, wrapDelta } from '../two/terrain.js';
import { OCEAN_ROUTES } from '../two/ocean-voyage.js';
import { createAmbientFlocks } from '../two/ambient-flocks.js';
import { createFlockFlights } from '../two/sky-life.js';

const {flocks,near,capacity}=createAmbientFlocks();

test('half the previous ambient birds follow the same migration, sea and road routes',()=>{
  const migration=flocks.filter(f=>f.habitat==='migration');
  const census=groups=>groups.reduce((sum,f)=>sum+f.birds.length,0);
  assert.equal(migration.length,48);
  assert.equal(flocks.length,480);
  assert.equal(census(flocks),5550/2);
  assert.ok(flocks.every(f=>f.birds.length>=3 && f.birds.length<=8));
  const distance=(x,z,f)=>Math.hypot(wrapDelta(x-f.x),wrapDelta(z-f.z));
  for(const [habitat,routes,reach] of [
    ['road',CONNECTING_ROADS,105],
    ['passage',OCEAN_ROUTES.flatMap(r=>r.legs),230],
  ]){
    for(const route of routes)for(let i=0;i<route.points.length;i+=15){
      const [x,z]=route.points[i];
      assert.ok(near(x,z).some(f=>f.habitat===habitat&&distance(x,z,f)<reach),route.id+' '+[x,z]);
    }
  }
  for(let x=-BOUND+100;x<BOUND;x+=200)for(let z=-BOUND+100;z<BOUND;z+=200){
    assert.ok(near(x,z).some(f=>distance(x,z,f)<85));
    const counts=[0,0,0];
    for(const f of near(x,z))counts[f.kind]+=f.birds.length;
    for(let k=0;k<3;k++)assert.ok(counts[k]<=capacity[k]);
  }
});

test('road and offshore flocks enter the camera view, move, and wrap with the camera',()=>{
  const scene=new T.Scene(),update=createFlockFlights(scene);
  const cam=new T.PerspectiveCamera(57,960/560,.09,1500),matrix=new T.Matrix4(),point=new T.Vector3();
  function frame(time){
    update(time,cam);
    const visible=new Map();
    for(const mesh of scene.children.filter(m=>m.visible))for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix);
      const projected=point.setFromMatrixPosition(matrix).project(cam);
      if(Math.abs(projected.x)<1 && Math.abs(projected.y)<1 && Math.abs(projected.z)<1){
        const pos=new T.Vector3().setFromMatrixPosition(matrix).sub(cam.position);
        visible.set(mesh.name+mesh.geometry.attributes.wingBeat.getX(i),pos);
      }
    }
    return visible;
  }
  for(const [x,z,tx,ty,tz] of [[153,-684,186,44,-726],[-1024,268,-984,12,296],[657,-1255,688,7,-1221]]){
    cam.position.set(x,Math.max(terrainHeight(x,z),WATER_Y)+3,z);
    cam.lookAt(tx,ty,tz);cam.updateMatrixWorld();
    const birds=frame(26),advanced=frame(26.1);
    assert.ok(birds.size>=8);
    let moved=0;
    for(const [id,p] of birds)if(advanced.has(id)&&advanced.get(id).distanceTo(p)>.05)moved++;
    assert.ok(moved>=8);
    cam.position.x+=2*BOUND;cam.position.z-=2*BOUND;cam.updateMatrixWorld();
    const wrapped=frame(26);
    assert.equal(wrapped.size,birds.size);
    for(const [id,p] of birds)assert.ok(wrapped.get(id).distanceTo(p)<.001);
  }
});
