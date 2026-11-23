import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../two/vendor/three.module.min.js';
import { prepareKaedeGround, createKaedeLeafFall, kaedeBoughs } from '../two/kaede-grove.js';
import { terrainContactHeight, waterSurfaceAt, nearRoad, seeded } from '../two/terrain.js';
import { inkTree } from '../two/landmark-tree.js';
import { forestGeometry } from '../two/forest-mesh.js';

test('fallen fans and maple blades rest on dry soil and follow the grade of the painted bridge approach',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const x0=287,z0=-115,slope=.26;
  const road=new THREE.Mesh(new THREE.PlaneGeometry(6,6).rotateX(-Math.PI/2)
    .rotateZ(Math.atan(slope)).translate(x0,17,z0),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  const shapes={},onPath=new Set(),normal=new THREE.Vector3(),rotation=new THREE.Euler();
  let aligned=0;
  const steps=prepareKaedeGround({shapes,part(name,x,y,z,w,h,d,color,yaw,pitch,roll){
    if(name!=='fallenMaple' && name!=='fallenGinkgo')return;
    assert.ok(y>waterSurfaceAt(x,z));
    if(Math.abs(x-x0)>2 || Math.abs(z-z0)>1 || !nearRoad(x,z))return;
    const top=17+slope*(x-x0);
    if(terrainContactHeight(x,z)>top)return;
    assert.ok(y>=top && y-top<.04);
    normal.set(0,1,0).applyEuler(rotation.set(pitch,yaw,roll,'YXZ'));
    assert.ok(Math.abs(normal.x/normal.y+slope)<.0001 && Math.abs(normal.z)<.0001);
    onPath.add(name);aligned++;
  }},[road]);
  for(const _ of steps) {}
  assert.ok(aligned>=10);
  assert.deepEqual(onPath,new Set(['fallenMaple','fallenGinkgo']));
});

test('painted windrows hug dry banks, keep paths open and share two batched impressions',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const shapes={}, materials=new Set(), counts={mapleWindrow:0,ginkgoWindrow:0};
  const offset=new THREE.Vector3(), rotation=new THREE.Euler();
  let nearMaple=0;
  const steps=prepareKaedeGround({shapes,part(name,x,y,z,w,h,d,color,yaw,pitch,roll,material,shadow) {
    if(name==='bridgeBankLeaves'){
      const bank=shapes[name], vertices=bank.attributes.position;
      materials.add(material);
      for(const i of new Set(bank.index.array)){
        const px=x+vertices.getX(i),py=y+vertices.getY(i),pz=z+vertices.getZ(i);
        assert.ok(py>waterSurfaceAt(px,pz) && !nearRoad(px,pz));
        assert.ok(Math.abs(py-terrainContactHeight(px,pz)-.006)<.0001);
        if(Math.hypot(px-279,pz+120)<4)nearMaple++;
      }
      return;
    }
    if (!(name in counts)) return;
    counts[name]++;
    materials.add(material);
    assert.equal(shadow,false);
    rotation.set(pitch,yaw,roll,'YXZ');
    for(const u of [-.5,-.2,0,.3,.5]) for(const v of [-.5,-.15,0,.25,.5]) {
      offset.set(u*w,0,v*d).applyEuler(rotation);
      const px=x+offset.x,pz=z+offset.z,py=y+offset.y;
      assert.ok(py>waterSurfaceAt(px,pz));
      assert.ok(!nearRoad(px,pz));
      assert.ok(Math.abs(py-terrainContactHeight(px,pz))<.045);
    }
  }});
  for(const _ of steps) {}
  assert.ok(nearMaple>20 && counts.mapleWindrow>counts.ginkgoWindrow && counts.ginkgoWindrow>0);
  assert.equal(materials.size,1);
  for(const name of Object.keys(counts))assert.equal(shapes[name].index.count,6);
});

test('falling leaves turn below the painted crowns and release both instance batches away from the gorge',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const boughs=kaedeBoughs(),scene=new THREE.Scene();
  for(const [key,tips] of boughs){
    if(typeof key==='number')forestGeometry(key,false,false,null,tips).dispose();
    else inkTree({stroke(){}},{sprays:{},part(){}},key,seeded(key.seed),terrainContactHeight,false,true,true,tips);
    assert.ok(tips.length>8);
  }
  const update=createKaedeLeafFall(scene,boughs),player={x:285,z:-115};
  update(4,player);
  const first=[];
  for(const mesh of scene.children){
    assert.ok(mesh.visible && mesh.count>0);
    first.push(mesh.instanceMatrix.array.slice(0,16));
  }
  update(4.25,player);
  scene.children.forEach((mesh,i)=>{
    const next=mesh.instanceMatrix.array.slice(0,16);
    assert.ok(next.every(Number.isFinite));
    assert.notDeepEqual(next,first[i]);
    assert.ok(Math.hypot(next[12]-player.x,next[14]-player.z)<50);
  });
  update(5,{x:0,z:60});
  assert.ok(scene.children.every(mesh=>!mesh.visible && mesh.count===0));
});
