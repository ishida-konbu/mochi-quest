import test from 'node:test';
import assert from 'node:assert/strict';
import { DoubleSide, PerspectiveCamera, Scene, Texture, TextureLoader } from '../two/vendor/three.module.min.js';
import { createPeachOrchard, peachModel } from '../two/flowering-peaches.js';
import { DISTRICTS } from '../two/geography.js';
import { SCENERY_PROFILES } from '../two/scenery-quality.js';

test('each peach crown carries the inked boughs and blossom washes around its trunk',t=>{
  const files=new Map();
  t.mock.method(TextureLoader.prototype,'load',url=>{
    const texture=new Texture();
    files.set(texture,new URL(url).pathname.split('/').at(-1));
    return texture;
  });
  for(let form=0;form<5;form++){
    const [[wood],[bough,ink],[flowers,wash]]=peachModel(form);
    assert.ok(wood.attributes.position.count>0);
    for(const [geometry,paint,file] of [[bough,ink,'peach-bough.webp'],[flowers,wash,'peach-blossom-cloud.webp']]){
      assert.equal(files.get(paint.map),file);
      assert.equal(paint.side,DoubleSide);
      assert.ok(paint.alphaTest>0,'paper around the painted silhouette is cut away');
      const {position,uv,normal}=geometry.attributes;
      assert.equal(uv.count,position.count);
      assert.ok(uv.array.every(v=>v>=0 && v<=1));
      assert.ok(normal.array.every(Number.isFinite));
      geometry.computeBoundingBox();
      const {min,max}=geometry.boundingBox;
      assert.ok(max.x-min.x>2 && max.z-min.z>2,'flower sprays spread around both sides of the crown');
    }
  }
});

test('changing scenery in place repaints the far orchard without growing its close models',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Scene(),update=createPeachOrchard(scene),camera=new PerspectiveCamera(57,1.6,.09,1500);
  const {x,z}=DISTRICTS.peach;
  camera.position.set(x+730,50,z);camera.lookAt(x,10,z);camera.updateMatrixWorld();
  const batches=scene.getObjectByName('桃源郷の桃の林').children,far=batches.at(-1);
  function painted(profile){
    update(camera,profile);
    assert.ok(batches.slice(0,-1).every(m=>m.count===0));
    return far.count;
  }
  const light=painted(SCENERY_PROFILES.light), normal=painted(SCENERY_PROFILES.normal), beautiful=painted(SCENERY_PROFILES.beautiful);
  assert.ok(light<normal && normal<beautiful);
  assert.equal(painted(SCENERY_PROFILES.light),light);
});
