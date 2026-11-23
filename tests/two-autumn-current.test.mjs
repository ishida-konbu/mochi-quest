import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../two/vendor/three.module.min.js';
import { autumnWaterRoutes, createAutumnWaterLeaves, sampleAutumnCurrent } from '../two/autumn-water-leaves.js';
import { waterfallSurface } from '../two/mountain-streams.js';
import { MAPLE_FOOTINGS, WATER_Y, shoreDistance, terrainMeshHeight, terrainHeight } from '../two/terrain.js';
import { waterWave } from '../two/shoreline.js';

test('the crimson current carries nearly twenty thousand unique blades in two static batches',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  const update=createAutumnWaterLeaves(scene);
  const [root]=scene.children;
  camera.position.set(315,5,-130);update(25.7,null,camera);
  assert.ok(root.visible);
  assert.equal(root.children.length,2);
  const [maples,ginkgos]=root.children.map(mesh=>mesh.geometry.instanceCount);
  assert.equal(maples+ginkgos,19796);
  const positions=new Set(),p={},riverCounts=[0,0],springCounts=[0,0];
  for(const [kind,{geometry}] of root.children.entries()){
    assert.equal(geometry.index.count,6);
    const {currentTravel:travel,currentBlade:blade,currentChannel:channel}=geometry.attributes;
    for(let i=0;i<geometry.instanceCount;i++){
      const start=travel.getX(i),period=travel.getY(i);
      const age=start+THREE.MathUtils.euclideanModulo(travel.getZ(i)+25.7*travel.getW(i),period);
      sampleAutumnCurrent(autumnWaterRoutes[channel.getX(i)],age,blade.getX(i),blade.getY(i),25.7,p);
      positions.add([p.x,p.y,p.z].join(','));
      if(start===0)springCounts[kind]++;
      if(p.river && p.opacity>.15)riverCounts[kind]++;
    }
    assert.equal(travel.version,0);
  }
  assert.equal(positions.size,maples+ginkgos);
  const share=([red,gold])=>gold/(red+gold);
  assert.ok(share(springCounts)>.25 && share(springCounts)<.32);
  assert.ok(share(riverCounts)>.06 && share(riverCounts)<.13);
  camera.position.set(0,5,0);update(26,null,camera);assert.equal(root.visible,false);
});

test('the filtered route atlas preserves both waterfall lips, faces and plunge pools',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const scene=new THREE.Scene();
  createAutumnWaterLeaves(scene);
  const shader={vertexShader:'',fragmentShader:'',uniforms:{}};
  scene.children[0].children[0].material.onBeforeCompile(shader);
  const {image:{data,width,height}}=shader.uniforms.waterLeafRoute.value;
  const rows=height/autumnWaterRoutes.length,midLane=(rows-2)/2;
  // The local origin is the regional bounds centre. Sample the halfway
  // points between successive fall texels, where linear interpolation
  // differs most from the accelerating curtain.
  const origin=scene.children[0].children[0].geometry.boundingSphere.center;
  const read=(col,row,k)=>THREE.DataUtils.fromHalfFloat(data[4*(row*width+col)+k]);
  for(const [i,route] of autumnWaterRoutes.entries()){
    const row=i*rows+midLane,face={};
    const {lip,toe}=route.stream.fall;
    const columnAt=station=>{
      let closest=Infinity,column=-1;
      for(let x=0;x<width;x++){
        const d=Math.hypot(read(x,row,0)+origin.x-station.x,read(x,row,2)+origin.z-station.z,read(x,row,1)-station.y);
        if(d<closest){column=x;closest=d;}
      }
      assert.ok(closest<.085);
      return column;
    };
    const first=columnAt(lip),last=columnAt(toe);
    assert.ok(last-first>=64);
    for(let col=first;col<last;col++){
      const t=(col-first+.5)/(last-first);
      waterfallSurface(route.stream,0,t,face);
      const halfway=k=>(read(col,row,k)+read(col+1,row,k))/2;
      const x=halfway(0)+origin.x,y=halfway(1),z=halfway(2)+origin.z;
      assert.ok(Math.hypot(x-face.x,y-face.y,z-face.z)<.21);
      assert.ok(y>terrainMeshHeight(x,z));
    }
  }
});

test('both autumn currents cross the painted falls and reach open sea through wet channels',()=>{
  assert.deepEqual(autumnWaterRoutes.map(r=>r.stream.id),['kaede-spring','maple']);
  for(const route of autumnWaterRoutes){
    const fall=route.segments.find(s=>s.fall);
    const face={},p={};
    for(const lane of [-.67,-.33,0,.33,.67])for(const phase of [0,1.8,3.7,5.1]){
      for(let age=0;age<=route.duration;age+=.23){
        const time=age+14;
        sampleAutumnCurrent(route,age,lane,phase,time,p);
        assert.ok(p.y>Math.max(terrainMeshHeight(p.x,p.z),terrainHeight(p.x,p.z)),
          route.stream.name+' beached at '+[p.x,p.z]);
        if(age>=fall.start && age<=fall.end){
          const u=lane+.092*Math.sin(age*.41+phase)+.066*Math.sin(age*.67+.41*phase);
          waterfallSurface(route.stream,u,(age-fall.start)/(fall.end-fall.start),face);
          assert.ok(Math.hypot(p.x-face.x,p.y-face.y,p.z-face.z)<.20);
        }
        for(const pier of MAPLE_FOOTINGS.piers){
          assert.ok(Math.abs(p.x-pier.x)>pier.w/2+.13 || Math.abs(p.z-pier.z)>pier.d/2+.13);
        }
        if(p.x>345)assert.ok(Math.abs(p.y-WATER_Y-waterWave(p.x,p.z,time)-.046)<1e-8);
        if(route.stream.riverPool && age>fall.end+.5)
          assert.ok(Math.abs(p.y-WATER_Y-waterWave(p.x,p.z,time)-.046)<1e-8);
      }
      // At small time steps the toe, the confluences and the wave handoff
      // remain continuous, including along the outer lanes on a bend.
      for(const section of route.segments.slice(1)){
        const a=sampleAutumnCurrent(route,section.start-.0001,lane,phase,12,{});
        const b=sampleAutumnCurrent(route,section.start+.0001,lane,phase,12,{});
        assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.04);
      }
    }
  }
});

test('each leaf dissolves progressively offshore and restarts invisibly in its source pool',()=>{
  for(const route of autumnWaterRoutes){
    for(const lane of [-.62,0,.62])for(const phase of [.7,2.8,5.3]){
      const p={};let previous=1,partlyVisible=0;
      assert.equal(sampleAutumnCurrent(route,0,lane,phase,0,p).opacity,0);
      for(let age=4;age<route.duration;age+=.18){
        sampleAutumnCurrent(route,age,lane,phase,age,p);
        const shore=shoreDistance(p.x,p.z);
        if(shore>1)assert.equal(p.opacity,1);
        if(shore< -13)assert.equal(p.opacity,0);
        if(p.opacity<1 && p.opacity>0)partlyVisible++;
        assert.ok(p.opacity<=previous && previous-p.opacity<.09);
        previous=p.opacity;
      }
      assert.ok(partlyVisible>12);
      assert.equal(previous,0);
      assert.ok(shoreDistance(p.x,p.z)<-13);
    }
  }
});
