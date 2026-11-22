import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../two/vendor/three.module.min.js';
import { FISH_SCHOOLS, fryPose, createFishSchools } from '../two/fish-schools.js';
import { terrainMeshHeight, waterSurfaceAt, WATER_Y, ROCKS, wrapDelta } from '../two/terrain.js';
import { FLEET, SEAWAYS, vesselPose } from '../two/ocean-voyage.js';
import { WAYSIDE_HUTS } from '../two/wayside-hut-layout.js';

const away={x:220,z:-820,y:12};

test('the river, the fishing beaches and the ocean passages host 380 fry beyond the twenty in the palace',()=>{
  const totals={};
  for(const s of FISH_SCHOOLS)totals[s.kind]=(totals[s.kind]||0)+s.fry.length;
  assert.deepEqual(totals,{river:80,coast:108,ocean:192});
  for(const h of WAYSIDE_HUTS.filter(s=>s.kind==='fisher')){
    assert.ok(FISH_SCHOOLS.some(s=>s.kind==='coast'&&Math.hypot(s.x-h.x,s.z-h.z)<50),h.name);
  }
  for(const route of SEAWAYS){
    const near=FISH_SCHOOLS.filter(s=>s.kind==='ocean' && route.points.some(([x,z])=>Math.hypot(s.x-x,s.z-z)<48));
    assert.ok(near.length>=5,route.id);
  }
});

test('every full turning circle stays below natural water and clear of the painted bed, baths and rocks',()=>{
  const out={};
  for(const s of FISH_SCHOOLS){
    const passage=SEAWAYS.some(l=>l.points.some(([x,z])=>Math.hypot(s.x-x,s.z-z)<39));
    const rocks=ROCKS.filter(r=>Math.hypot(s.x-r.x,s.z-r.z)<12+Math.max(r.rx,r.rz));
    for(let turn=0;turn<28;turn++)for(const f of s.fry){
      const time=2*Math.PI*turn/(28*s.speed);
      fryPose(s,f,time,away,0,out);
      assert.ok(out.y+.22*f.size<WATER_Y,'dorsal fin submerged');
      const player={x:out.x+.25,y:out.y-.45,z:out.z-.1};
      fryPose(s,f,time,player,passage?2.64:0,out);
      const floor=terrainMeshHeight(out.x,out.z);
      assert.equal(waterSurfaceAt(out.x,out.z),WATER_Y);
      assert.ok(out.y-.25*f.size>floor+.15,`bottom at ${out.x},${out.z}`);
      for(const r of rocks)if(floor+r.h>out.y-.25){
        assert.ok(Math.hypot(wrapDelta(r.x-out.x),wrapDelta(r.z-out.z))>Math.max(r.rx,r.rz)+.72);
      }
    }
  }
});

test('camera selects one instanced pass and the world seam and ship clock are respected',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  const update=createFishSchools(scene,new THREE.BufferGeometry(),new THREE.MeshBasicMaterial(),{value:0});
  const [swimmers,surface]=scene.children,off={x:220,z:-820,y:20};
  camera.position.set(off.x,15,off.z);update(3,off,camera,3);
  assert.ok(!swimmers.visible && !surface.visible);
  const seam=FISH_SCHOOLS.at(-1),player={x:-1598,z:seam.z,y:0};
  camera.position.set(player.x,5,player.z);
  update(3,player,camera,3);
  assert.ok(!swimmers.visible && surface.visible && surface.count>3);
  camera.position.y=-1;update(3,player,camera,3);
  assert.ok(!surface.visible && swimmers.visible && swimmers.count===seam.fry.length);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<swimmers.count;i++){
    swimmers.getMatrixAt(i,matrix);
    assert.ok(Math.abs(matrix.elements[12]-player.x)<20 && matrix.elements[13]<WATER_Y);
  }
  // Hold the photographic water clock still while the actual ship makes passage.
  const school=FISH_SCHOOLS.find(s=>s.x===340 && s.z===-1497),ship=FLEET[4],pose={};
  let near=0,far=0,min=Infinity,max=0;
  for(let t=0;t<1305;t+=1){
    vesselPose(ship,t,pose);
    const d=Math.hypot(pose.x-school.x,pose.z-school.z);
    if(d<min){near=t;min=d;}
    const distance=Math.min(...FLEET.map(v=>{vesselPose(v,t,pose);return Math.hypot(pose.x-school.x,pose.z-school.z);}));
    if(distance>max){far=t;max=distance;}
  }
  assert.ok(min<27 && max>39);
  camera.position.set(school.x,5,school.z);
  update(3,away,camera,far);const broadside=surface.count;
  update(3,away,camera,near);
  assert.ok(broadside>=school.fry.length && surface.count<broadside);
});
