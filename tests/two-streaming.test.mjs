import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { createTerrainTiles } from '../two/landscape-tiles.js';
import { BOUND, wrapDelta } from '../two/terrain.js';
import { demandPaint } from '../two/travel-paint.js';

test('the first view, a summit, a wrapped crossing and a return draw every surveyed tile in the original detail', () => {
  const material=new T.MeshBasicMaterial(), reference=new T.Group();
  for(const _ of createTerrainTiles(reference,material).prepare()) {}
  const survey=reference.children.map(mesh=>{
    const g=mesh.geometry;
    g.computeBoundingBox();
    const box=g.boundingBox, sphere=g.boundingSphere;
    assert.ok(box.min.y>=-64 && box.max.y<=256,'all geometry fits in the discovery envelope');
    return {box,sphere,range:mesh.userData.range, near:g.index.count,
      far:mesh.userData.farGeometry?.index.count, skyline:mesh.userData.skylineGeometry?.index.count};
  });
  reference.clear();

  const camera=new T.PerspectiveCamera(57,1.6,.09,1500), frustum=new T.Frustum(), projection=new T.Matrix4();
  const visible=new T.Group(), tiles=createTerrainTiles(visible,material);
  const views=[
    [[0,7,70], [0,5,-40], false],
    [[0,7,70], [0,5,140], false],
    [[480,142,-750], [240,12,-848], true],
    [[1595,3,1590], [1600,2,1670], false],
    [[-1599,3,-1580], [-1598,3,-1620], false],
    [[0,7,70], [0,5,-40], false],
  ];
  for(const [index,[eye,target,summit]] of views.entries()) {
    camera.position.set(...eye);
    camera.lookAt(...target);
    camera.updateMatrixWorld();
    if(index===0)for(const _ of tiles.prepare(camera)) {}
    tiles.update(camera,Number(summit));
    assert.ok(visible.children.length<survey.length/2,'unused territory remains outside the scene');
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const drawn=new Map();
    for(const mesh of visible.children) {
      if(!mesh.visible)continue;
      const {center}=(mesh.userData.nearGeometry || mesh.geometry).boundingSphere;
      drawn.set(center.x+','+center.z,mesh);
    }
    for(const {box,sphere,range,near,far,skyline} of survey) {
      const {x,z}=sphere.center, dx=wrapDelta(x-eye[0]), dz=wrapDelta(z-eye[2]);
      const d2=dx*dx+dz*dz, horizon=summit && skyline;
      if(d2>=((horizon?1350:range)+sphere.radius)**2)continue;
      const offset=new T.Vector3(
        Math.round((eye[0]+dx-x)/(2*BOUND))*2*BOUND,0,Math.round((eye[2]+dz-z)/(2*BOUND))*2*BOUND);
      if(!frustum.intersectsBox(box.clone().translate(offset)))continue;
      const mesh=drawn.get(x+','+z);
      assert.ok(mesh,'missing visible ground at '+[x,z]);
      assert.ok(offset.equals(mesh.position),'wrapped world image');
      const expected=horizon && d2>(385+sphere.radius)**2 ? skyline : far && d2>(73+sphere.radius)**2 ? far : near;
      assert.equal(mesh.geometry.index.count,expected,'original detail at '+[x,z]);
    }
  }
});

test('missing travel paint can retry on later demand and keeps a single shared result', async t=>{
  let now=0, calls=0;
  t.mock.method(performance,'now',()=>now);
  const use=demandPaint(async()=>{
    if(++calls===1)throw Error('image fetch failed');
    return 'ink';
  });
  const first=use();
  assert.equal(use(),first);
  await assert.rejects(first,/image fetch failed/);
  assert.equal(use(),first);
  now=3500;
  const retry=use();
  assert.equal(use(),retry);
  assert.equal(await retry,'ink');
  assert.equal(await use(),'ink');
  assert.equal(calls,2);
});
