import test from 'node:test';
import assert from 'node:assert/strict';
import { DoubleSide, Texture, TextureLoader } from '../two/vendor/three.module.min.js';
import { peachModel } from '../two/flowering-peaches.js';

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
