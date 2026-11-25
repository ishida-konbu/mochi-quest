// Outlying rice plots follow the same surveyed triangles as feet and building
// sockets. A low earth lip surrounds each bed without spanning the hillside.
import * as T from './vendor/three.module.min.js';
import { BUILDINGS, nearRoad, seeded, terrainContactHeight } from './terrain.js';
import { WORLD_BOUND, TERRAIN_TILES, TERRAIN_SUBDIVISIONS } from './geography.js';
import { prunePlantBatch } from './homestead-groundcover.js';

const grid=2*WORLD_BOUND/(TERRAIN_TILES*TERRAIN_SUBDIVISIONS);
function rows(center,half){
  const lo=center-half,hi=center+half,points=[lo,lo+.15,lo+.33,hi-.33,hi-.15,hi];
  for(let v=Math.ceil(lo/grid)*grid;v<hi;v+=grid)points.push(v);
  return [...new Set(points)].sort((a,b)=>a-b);
}
// Split the field-edge cells on the very same NE/SW diagonal as the island.
// Crossing a terrain crease with an independent quad can bury a whole row.
function splitCorners(rect,diagonal,side){
  const out=[];
  for(let i=0;i<rect.length;i++){
    const a=rect[i],b=rect[(i+1)%rect.length],u=side*(a[0]+a[1]-diagonal),v=side*(b[0]+b[1]-diagonal);
    if(u>=0)out.push(a);
    if(u*v<0){const t=u/(u-v);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }
  return out;
}

export function dressRiceBeds(painter){
  const r=seeded(352),points=[],colors=[],uv=[],indices=[],plants=[];
  const rim=new T.Color('#a29e64'),centre=new T.Color(),tint=new T.Color();
  for(let i=0;i<24;i++){
    const col=i%6,row=Math.floor(i/6),cx=105+col*16.2+Math.sin(row)*4,cz=123+row*12.8;
    if(BUILDINGS.some(b=>Math.hypot(cx-b.x,cz-b.z)<12)||nearRoad(cx,cz,3))continue;
    centre.set(row%2?'#b4ac6a':'#9cae83');
    const xs=rows(cx,6.8),zs=rows(cz,5.4),vertices=new Map();
    function vertex([x,z]){
      const key=x.toFixed(5)+','+z.toFixed(5);
      if(vertices.has(key))return vertices.get(key);
      const edge=Math.min(6.8-Math.abs(x-cx),5.4-Math.abs(z-cz));
      const crest=Math.max(0,1-Math.abs(edge-.15)/.18),index=points.length/3;
      points.push(x,terrainContactHeight(x,z)+.014+.044*crest,z);
      uv.push((x-cx)*.32,(z-cz)*.32);
      tint.copy(centre).lerp(rim,Math.max(0,1-edge/.34)).toArray(colors,colors.length);
      vertices.set(key,index);return index;
    }
    for(let j=1;j<zs.length;j++)for(let k=1;k<xs.length;k++){
      const x0=xs[k-1],x1=xs[k],z0=zs[j-1],z1=zs[j];
      const diag=(1+Math.floor((x0+x1)/2/grid)+Math.floor((z0+z1)/2/grid))*grid;
      const rect=[[x0,z0],[x0,z1],[x1,z1],[x1,z0]];
      for(const side of [-1,1]){
        const poly=splitCorners(rect,diag,side).map(vertex);
        for(let n=2;n<poly.length;n++)
          if(poly[0]!==poly[n-1] && poly[n]!==poly[n-1] && poly[0]!==poly[n])indices.push(poly[0],poly[n-1],poly[n]);
      }
    }
    for(let j=0;j<6;j++)for(let k=0;k<7;k++){
      const x=cx+(k-3)*1.58+(r()-.5)*.28,z=cz+(j-2.5)*1.52;
      plants.push({x,y:terrainContactHeight(x,z)+.012,z,height:.50+r()*.32,yaw:r()*3,
        color:row%3?'#9b9b4c':'#839259'});
    }
  }
  const bed=new T.BufferGeometry();
  bed.setAttribute('position',new T.Float32BufferAttribute(points,3));
  bed.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  bed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  bed.setIndex(indices);bed.computeVertexNormals();
  const mat=painter.solid.clone();mat.vertexColors=true;
  mat.polygonOffset=true;mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-1;
  const soil=new T.Mesh(bed,mat);soil.name='月見の棚田の畦と田面';soil.receiveShadow=true;
  soil.userData.range=285;painter.scene.add(soil);
  const shoots=new T.InstancedMesh(painter.shapes.leaf,painter.stems,plants.length);
  shoots.name='棚田の稲苗';shoots.receiveShadow=true;
  const pose=new T.Object3D();
  for(const [i,p] of plants.entries()){
    pose.position.set(p.x,p.y,p.z);pose.scale.set(.75,p.height,.64);
    pose.rotation.set(0,p.yaw,.12,'YXZ');pose.updateMatrix();
    shoots.setMatrixAt(i,pose.matrix);shoots.setColorAt(i,tint.set(p.color));
  }
  shoots.computeBoundingSphere();painter.scene.add(shoots);painter.closeDetails.push(shoots);
  const removed=new Map();
  return plots=>prunePlantBatch(shoots.instanceMatrix,12,0,0,removed,plots,.30);
}
