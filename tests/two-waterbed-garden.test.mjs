import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { riverZ, terrainContactHeight } from '../two/terrain.js';
import { waterbedParcel,createWaterbedGarden } from '../two/waterbed-garden.js';

test('each catchment has its own bed community planted on the visible wet ground',()=>{
  const examples=[
    [-9,riverZ(-9),['grass','chert']],
    [-52,-268,['pondweed','twig','leafDrift']],
    [-257,112,['kelp','sargassum','scallop','urchin']],
  ];
  for(const [x,z,expected] of examples) {
    const found=new Set(),cx=Math.floor(x/16),cz=Math.floor(z/16);
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const sites=waterbedParcel(cx+i,cz+j);
      for(const s of sites){
        assert.ok(Math.abs(s.y+.012-terrainContactHeight(s.x,s.z))<.0001);
        assert.ok(s.line-s.y>.14);
        assert.ok(s.sy>0);
        found.add(s.kind);
      }
    }
    for(const kind of expected)assert.ok(found.has(kind),kind);
  }
  assert.deepEqual(waterbedParcel(-1,1),waterbedParcel(-1,1));
});

test('the moving garden keeps its instance buffers bounded and crosses to the nearest sea image',()=>{
  const scene=new T.Scene(),camera=new T.PerspectiveCamera();
  const update=createWaterbedGarden(scene,{value:3}),group=scene.children[0];
  const matrix=new T.Matrix4(),point=new T.Vector3();
  for(const [x,z] of [[1598,1598],[-1598,-1598],[-257,112],[-52,-268]]){
    camera.position.set(x,terrainContactHeight(x,z)+1,z);
    update(camera);
    let triangles=0;
    for(const mesh of group.children.filter(mesh=>mesh.visible)){
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
        assert.ok(point.distanceTo(camera.position)<38,'nearest ocean image');
      }
      triangles+=mesh.count*mesh.geometry.index.count/3;
    }
    assert.ok(triangles>0 && triangles<95000,triangles+' visible bed triangles');
  }
  camera.position.y=130;update(camera);assert.equal(group.visible,false);
  camera.position.y=terrainContactHeight(camera.position.x,camera.position.z)+1;
  update(camera);assert.equal(group.visible,true);
});
