import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { TERRAIN_SUBDIVISIONS } from '../two/geography.js';
import { createTerrainTiles } from '../two/landscape-tiles.js';
import { SCENERY_PROFILES } from '../two/scenery-quality.js';
import { BOUND, wrapDelta } from '../two/terrain.js';
import { demandPaint } from '../two/travel-paint.js';

test('light scenery preserves the surveyed detail on arrival, at the summit, across the wrap and on return', () => {
  const material=new T.MeshBasicMaterial(), reference=new T.Group();
  for(const _ of createTerrainTiles(reference,material).prepare()) {}
  const survey=reference.children.map(mesh=>{
    const g=mesh.geometry;
    g.computeBoundingBox();
    const box=g.boundingBox, sphere=g.boundingSphere;
    assert.ok(box.min.y>=-64 && box.max.y<=256,'all geometry fits in the discovery envelope');
    assert.equal(typeof mesh.userData.highlands,'boolean');
    return {box,sphere,detailRange:mesh.userData.highlands ? 710 : 475, near:g.index.count,
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
    if(index===0)for(const _ of tiles.prepare(camera,SCENERY_PROFILES.light)) {}
    tiles.update(camera,Number(summit),SCENERY_PROFILES.light);
    assert.ok(visible.children.length<survey.length/2,'unused territory remains outside the scene');
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const drawn=new Map();
    for(const mesh of visible.children) {
      if(!mesh.visible)continue;
      const {center}=(mesh.userData.nearGeometry || mesh.geometry).boundingSphere;
      drawn.set(center.x+','+center.z,mesh);
    }
    for(const {box,sphere,detailRange,near,far,skyline} of survey) {
      const {x,z}=sphere.center, dx=wrapDelta(x-eye[0]), dz=wrapDelta(z-eye[2]);
      const d2=dx*dx+dz*dz, horizon=summit && skyline;
      const range=horizon?1350:710;
      const mesh=drawn.get(x+','+z);
      if(mesh){
        const bounds=(mesh.userData.nearGeometry || mesh.geometry).boundingSphere;
        assert.ok(d2<(range+bounds.radius)**2,'light keeps its drawing radius');
      }
      // The compact survey's bounding sphere can be tighter than the full
      // survey's. Both enclose the same 100 m square in the horizontal plane.
      if(d2>=(range+Math.hypot(50,50))**2)continue;
      const offset=new T.Vector3(
        Math.round((eye[0]+dx-x)/(2*BOUND))*2*BOUND,0,Math.round((eye[2]+dz-z)/(2*BOUND))*2*BOUND);
      if(!frustum.intersectsBox(box.clone().translate(offset)))continue;
      assert.ok(mesh,'missing visible ground at '+[x,z]);
      assert.ok(offset.equals(mesh.position),'wrapped world image');
      const expected=skyline && d2>((horizon?385:detailRange)+sphere.radius)**2 ? skyline :
        far && d2>(73+sphere.radius)**2 ? far : near;
      assert.equal(mesh.geometry.index.count,expected,'original detail at '+[x,z]);
    }
  }
});

test('every scenery setting extends the forest floor with sparse, edge-matched tiles that promote on approach', () => {
  const scene = new T.Group(), tiles = createTerrainTiles(scene, new T.MeshBasicMaterial());
  const camera = new T.PerspectiveCamera(57, 1.6, .09, 1500);
  camera.position.set(0, 7, 70);
  camera.lookAt(0, 5, -40);
  camera.updateMatrixWorld();

  function view(profile) {
    tiles.update(camera, 0, profile);
    const result = new Map();
    for (const mesh of scene.children) {
      if (!mesh.visible) continue;
      const near = mesh.userData.nearGeometry || mesh.geometry;
      const { x, z } = near.boundingSphere.center;
      result.set(x + ',' + z, mesh);
    }
    return result;
  }
  const light = view(SCENERY_PROFILES.light);
  let compactIndex, example;
  function checkExtension(inner, outer) {
    for (const key of inner.keys()) assert.ok(outer.has(key), 'inner ground still visible at ' + key);
    let addedLand = 0;
    for (const [key, mesh] of outer) {
      if (inner.has(key) || mesh.geometry.index.count === 6) continue;
      if (mesh.userData.sparse) {
        assert.ok(mesh.geometry.attributes.position.count < (TERRAIN_SUBDIVISIONS + 1) ** 2 / 4);
        assert.equal(mesh.userData.nearGeometry, undefined, 'a distant arrival has no full survey');
        compactIndex ??= mesh.geometry.index;
        assert.equal(mesh.geometry.index, compactIndex, 'distant arrivals share one compact index');
        example ??= mesh;
      } else {
        assert.equal(mesh.geometry, mesh.userData.skylineGeometry, 'a retained survey uses its skyline');
      }
      addedLand++;
    }
    assert.ok(addedLand > 0, 'the wider band reveals additional land in this view');
  }
  const normal = view(SCENERY_PROFILES.normal);
  checkExtension(light, normal);
  const beautiful = view(SCENERY_PROFILES.beautiful);
  checkExtension(normal, beautiful);

  for (const [profile, expected] of [[SCENERY_PROFILES.normal, normal], [SCENERY_PROFILES.light, light],
    [SCENERY_PROFILES.beautiful, beautiful]]) {
    assert.deepEqual(new Set(view(profile).keys()), new Set(expected.keys()), 'reselecting a preset restores its view');
  }

  assert.ok(example, 'at least one tile arrived with just its horizon survey');
  const sparse = example.geometry, {x, z} = sparse.boundingSphere.center;
  const key = x + ',' + z;
  camera.position.set(x, 28, z + 20);
  camera.lookAt(x, 0, z);
  camera.updateMatrixWorld();
  const full = view(SCENERY_PROFILES.beautiful).get(key);
  assert.ok(full && !full.userData.sparse && !scene.children.includes(example), 'approaching replaces the sparse mesh');
  const near = full.userData.nearGeometry, skylineIndex = full.userData.skylineGeometry.index;
  const samples = [...new Set(skylineIndex.array)];
  assert.equal(samples.length, sparse.attributes.position.count);
  assert.equal(compactIndex.count, skylineIndex.count);
  for (let i = 0; i < compactIndex.count; i++) {
    assert.equal(samples[compactIndex.getX(i)], skylineIndex.getX(i), 'identical skyline triangle');
  }
  for (const name of ['position', 'uv', 'color', 'terrainMix', 'ridgeRelief', 'seasons', 'scrollAmount']) {
    const compact = sparse.attributes[name], detailed = near.attributes[name];
    samples.forEach((index, i) => {
      for (let k = 0; k < compact.itemSize; k++) assert.equal(compact.getComponent(i,k), detailed.getComponent(index,k), name);
    });
  }

  // Each outside segment must be a triangle edge between the original vertices.
  const edges = new Set(), grid = TERRAIN_SUBDIVISIONS, stride = grid + 1;
  const edgeKey = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
  for (let i = 0; i < skylineIndex.count; i += 3) {
    const [a, b, c] = skylineIndex.array.subarray(i, i + 3);
    edges.add(edgeKey(a, b)).add(edgeKey(b, c)).add(edgeKey(c, a));
  }
  for (let i = 0; i < grid; i++) {
    for (const base of [0, grid * stride]) assert.ok(edges.has(edgeKey(base + i, base + i + 1)));
    for (const base of [0, grid]) assert.ok(edges.has(edgeKey(base + i * stride, base + (i + 1) * stride)));
  }

  camera.position.set(0, 7, 70);
  camera.lookAt(0, 5, -40);
  camera.updateMatrixWorld();
  assert.equal(view(SCENERY_PROFILES.beautiful).get(key), full, 'a return uses the retained survey');
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
