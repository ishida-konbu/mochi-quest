import * as THREE from './vendor/three.module.min.js';
import { DISTRICTS, TERRAIN_TILES, TERRAIN_SUBDIVISIONS } from './geography.js';
import { PEACH_RANGE_BOUNDS } from './peach-range.js';
import { scrollCoverage } from './scroll-paper.js';
import { kyoRidgeHeight } from './higashiyama.js';
import { FOREST_LAKE, LAKE_ISLET, lakeRadius, isletRadius } from './snow-country.js';
import { BOUND, TREES, wrapDelta, terrainHeight as h, regionAt, shoreDistance, riverZ,
  riverHalfWidth, riverMouthFlare, seasonAt, springGround } from './terrain.js';

const {abs,min,max,cos,sin} = Math;
const css = c => new THREE.Color(c);
const span = 2*BOUND/TERRAIN_TILES;

// Keep the survey vertices along every tile edge. Inside each two-cell square
// only omit a midpoint if its surveyed height is within 4 cm of the chord.
// Steep folds, the firebeds and the joins with neighbouring tiles stay intact.
function distantHillSurface(ground,grid) {
  const triangles=[],positions=ground.attributes.position,stride=grid+1;
  const keep=(a,m,b)=>Math.abs(positions.getY(m)-(positions.getY(a)+positions.getY(b))*.5)>.04;
  for(let z=0;z<grid;z+=2)for(let x=0;x<grid;x+=2){
    const nw=z*stride+x,ne=nw+2,sw=nw+2*stride,se=sw+2,centre=nw+stride+1;
    const edges=[nw,sw,se,ne];
    const midpoints=[
      x===0 || keep(nw,nw+stride,sw), z+2===grid || keep(sw,sw+1,se),
      x+2===grid || keep(se,ne+stride,ne), z===0 || keep(ne,nw+1,nw),
    ];
    if(!midpoints.some(Boolean) && !keep(ne,centre,sw)){
      triangles.push(nw,sw,ne,ne,sw,se);
      continue;
    }
    for(let i=0;i<4;i++){
      const a=edges[i],b=edges[(i+1)%4],m=(a+b)/2;
      if(midpoints[i])triangles.push(centre,a,m,centre,m,b);
      else triangles.push(centre,a,b);
    }
  }
  const distant=new THREE.BufferGeometry();
  for(const [key,value] of Object.entries(ground.attributes))distant.setAttribute(key,value);
  distant.setIndex(triangles);
  return distant;
}
// A summit view reaches past the street-level terrain radius. One shared
// index draws the original survey at 20 m intervals, retaining every edge
// vertex so a 100 m tile meets both its near and its distant neighbours.
function horizonIndex(grid){
  const index=[],stride=grid+1,step=8;
  for(let z=0;z<grid;z+=step)for(let x=0;x<grid;x+=step){
    const endX=Math.min(x+step,grid),endZ=Math.min(z+step,grid);
    const centre=Math.floor((z+endZ)/2)*stride+Math.floor((x+endX)/2);
    const rim=[];
    for(let j=z;j<endZ;j+=x===0?1:step)rim.push(j*stride+x);
    for(let i=x;i<endX;i+=endZ===grid?1:step)rim.push(endZ*stride+i);
    for(let j=endZ;j>z;j-=endX===grid?1:step)rim.push(j*stride+endX);
    for(let i=endX;i>x;i-=z===0?1:step)rim.push(z*stride+i);
    for(let k=0;k<rim.length;k++)index.push(centre,rim[k],rim[(k+1)%rim.length]);
  }
  return new THREE.Uint16BufferAttribute(index,1);
}
export function createTerrainTiles(scene, mat) {
  const colors = ['#f2f0dc','#e3edce','#ebe8d7','#e6e2cc','#ede5ca','#e1e6d6',
    '#f4f6fc','#e8ca9e','#dfd7b9','#f3e0bd','#e4d5b5','#efd5ce','#a9c1b3','#e1d8bb','#dbd6bb','#d8d7bf','#e1d1b4'].map(css);
  const soil = css('#efeadc'), stone = css('#d5d4c6'), hillPaper = css('#ebe9da'), c = new THREE.Color(), season = {};
  const bins = new Map();
  for (const tree of TREES) {
    const rad = tree.h*.67+2.3;
    for (let i=Math.floor((tree.x-rad)/18); i<=Math.floor((tree.x+rad)/18); i++)
      for (let j=Math.floor((tree.z-rad)/18); j<=Math.floor((tree.z+rad)/18); j++) {
        const key=i*256+j;
        if (!bins.has(key)) bins.set(key,[]);
        bins.get(key).push(tree);
      }
  }
  const farIndices=horizonIndex(TERRAIN_SUBDIVISIONS);
  function build({row,column,x:midX,z:midZ}) {
    // Deep ocean is a level shelf. Keep the fine lattice for shores, roads,
    // palace and cliffs, without allocating a million detailed sea vertices.
    const deep=shoreDistance(midX,midZ)<-span*1.6 &&
      Math.hypot(midX-DISTRICTS.ryugu.x,midZ-DISTRICTS.ryugu.z)>span*1.8;
    const grid=deep ? 1 : TERRAIN_SUBDIVISIONS;
    const range=PEACH_RANGE_BOUNDS;
    const peachTile=midX+span/2>range.west && midX-span/2<range.east && midZ+span/2>range.north && midZ-span/2<range.south;
    const p=[], ix=[], uv=[], col=[], surface=[], seasons=[], scroll=[], ridges=[];
    let ridgeTile=false;
    for (let j=0; j<=grid; j++) for (let i=0; i<=grid; i++) {
      const x=(column+i/grid)*span-BOUND, z=(row+j/grid)*span-BOUND, y=h(x,z);
      p.push(x,y,z);
      uv.push(x/3.7,z/3.7);
      const r=regionAt(x,z), coast=shoreDistance(x,z);
      const river=abs(z-riverZ(x))-riverHalfWidth(x)-6.4*riverMouthFlare(x);
      c.copy(colors[r]).lerp(soil, max(0,1-abs(river-2)/7)*.72);
      c.lerp(stone, max(0,min(1,(y-15)/30))*.68);
      const rise=kyoRidgeHeight(x,z);
      const ridge=THREE.MathUtils.smoothstep(rise,1.5,17);
      ridges.push(ridge);
      if(rise>0)ridgeTile=true;
      c.multiplyScalar(.96+.042*cos(x*.076+sin(z*.044))+.039*sin(z*.115+sin(x*.093)));
      c.lerp(hillPaper,ridge*.90);
      let canopy=0;
      for (const tree of bins.get(Math.floor(x/18)*256+Math.floor(z/18)) || []) {
        const radius=tree.h*.67+2.3;
        canopy=max(canopy,1-((x-tree.x)**2+(z-tree.z)**2)/(radius*radius));
      }
      const lakeBank=max(0,1-abs(lakeRadius(x,z)-1)*FOREST_LAKE.rz/4.8,
        1-abs(isletRadius(x,z)-1)*LAKE_ISLET.rz/2.1);
      surface.push(canopy,max(lakeBank,max(0,1-abs(river-.2)/7.3),max(0,min(1,(7.6-coast)/8.2))));
      scroll.push(scrollCoverage(x,z));
      seasonAt(x,z,season);
      seasons.push(season.snow,season.autumn,season.moon, season.dawn*max(0,min(1,(30-coast)/23)));
      col.push(c.r,c.g,c.b);
      if (i<grid && j<grid) {
        const k=j*(grid+1)+i,l=k+grid+1;
        ix.push(k,l,k+1,k+1,l,l+1);
      }
    }
    if(!deep)springGround.refineTile(column,row,p,ix,[[uv,2],[col,3],[ridges,1],[surface,2],[scroll,1],[seasons,4]],h);
    const ground=new THREE.BufferGeometry();
    ground.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    ground.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    ground.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    ground.setIndex(ix);
    ground.computeVertexNormals();
    ground.setAttribute('ridgeRelief',new THREE.Float32BufferAttribute(ridges,1));
    ground.setAttribute('terrainMix',new THREE.Float32BufferAttribute(surface,2));
    ground.setAttribute('scrollAmount',new THREE.Float32BufferAttribute(scroll,1));
    ground.setAttribute('seasons',new THREE.Float32BufferAttribute(seasons,4));
    // Adjacent tiles compute their own normals. Sample both sides at the
    // join so a sunlit rock face stays continuous across the tile boundary.
    if((peachTile || ridgeTile) && !deep){
      const step=span/grid,normals=ground.attributes.normal;
      function seamNormal(i,j){
        const v=j*(grid+1)+i,x=p[v*3],z=p[v*3+2];
        const nx=h(x-step,z)-h(x+step,z),nz=h(x,z-step)-h(x,z+step),ny=2*step;
        const length=Math.hypot(nx,ny,nz);
        normals.setXYZ(v,nx/length,ny/length,nz/length);
      }
      for(let i=0;i<=grid;i++){seamNormal(i,0);seamNormal(i,grid);}
      for(let j=1;j<grid;j++){seamNormal(0,j);seamNormal(grid,j);}
    }
    const land=new THREE.Mesh(ground,mat);
    if(!deep){
      const skyline=new THREE.BufferGeometry();
      for(const [name,attr] of Object.entries(ground.attributes))skyline.setAttribute(name,attr);
      skyline.setIndex(farIndices);
      land.userData.skylineGeometry=skyline;
      land.userData.nearGeometry=ground;
    }
    if(ridgeTile && !deep){
      land.userData.farGeometry=distantHillSurface(ground,grid);
    }
    land.receiveShadow=true;
    land.userData.range=peachTile || ridgeTile?710:475;
    ground.computeBoundingSphere();
    return land;
  }

  // This envelope includes every surveyed summit and the deep ocean shelf.
  // It is used only until a tile has its exact radius, never for its drawing.
  const floor=-64, ceiling=256, half=span/2;
  const maxRadius=Math.hypot(half,half,(ceiling-floor)/2);
  const tiles=[];
  for(let row=0;row<TERRAIN_TILES;row++)for(let column=0;column<TERRAIN_TILES;column++) {
    tiles.push({row,column,x:(column+.5)*span-BOUND,z:(row+.5)*span-BOUND,mesh:null});
  }
  const frustum=new THREE.Frustum(), matrix=new THREE.Matrix4(), box=new THREE.Box3();
  function survey(camera) {
    frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  }
  function intersectsView(x,z) {
    box.min.set(x-half,floor,z-half);
    box.max.set(x+half,ceiling,z+half);
    return frustum.intersectsBox(box);
  }
  function load(tile) {
    tile.mesh=build(tile);
    tile.mesh.visible=false;
    tile.mesh.matrixAutoUpdate=false;
    scene.add(tile.mesh);
  }
  function unload(tile) {
    const mesh=tile.mesh, data=mesh.userData;
    mesh.removeFromParent();
    // The summit index is shared by all tiles. Its GPU buffer belongs to
    // the landscape; each tile owns its own vertices and other indices.
    if(data.skylineGeometry) {
      data.skylineGeometry.setIndex(null);
      data.skylineGeometry.dispose();
    }
    data.farGeometry?.dispose();
    (data.nearGeometry || mesh.geometry).dispose();
    tile.mesh=null;
  }
  function* prepare(camera) {
    if(camera)survey(camera);
    for(const tile of tiles) {
      if(camera) {
        const {x,y,z}=camera.position;
        const dx=wrapDelta(tile.x-x), dz=wrapDelta(tile.z-z);
        // The existing summit view can reach the far slopes above Kyoto.
        const range=y>10 && Math.hypot(x-DISTRICTS.kyo.x,z-DISTRICTS.kyo.z)<710 ? 1350 : 710;
        if(dx*dx+dz*dz>(range+maxRadius)**2 || !intersectsView(x+dx,z+dz))continue;
      }
      load(tile);
      if(!camera)tile.mesh.visible=true;
      yield;
    }
  }
  let nextTile=null, idlePending=false;
  function warmNeighbour(deadline) {
    idlePending=false;
    if (!nextTile || nextTile.mesh || document.hidden || deadline && deadline.timeRemaining()<8) return;
    load(nextTile);
    nextTile=null;
  }
  function update(camera,valleyView) {
    survey(camera);
    const {x,z}=camera.position, skyline=valleyView>.015;
    const extension=skyline?Math.min(1,valleyView*3):0;
    const maxRange=710+(1350-710)*extension;
    nextTile=null;
    let nextDistance=Infinity;
    for(const tile of tiles) {
      const dx=wrapDelta(tile.x-x), dz=wrapDelta(tile.z-z), squared=dx*dx+dz*dz;
      if(tile.mesh && squared>(maxRange+maxRadius+250)**2) {
        unload(tile);
        continue;
      }
      if(!tile.mesh) {
        if(squared>(maxRange+maxRadius)**2)continue;
        if(intersectsView(x+dx,z+dz))load(tile);
        else {
          if(squared<nextDistance) { nextTile=tile; nextDistance=squared; }
          continue;
        }
      }
      const mesh=tile.mesh, data=mesh.userData, near=data.nearGeometry || mesh.geometry;
      const bounds=near.boundingSphere;
      const range=data.range+(data.skylineGeometry?(1350-data.range)*extension:0);
      const cx=bounds.center.x, cz=bounds.center.z;
      const bx=wrapDelta(cx-x), bz=wrapDelta(cz-z), distanceSq=bx*bx+bz*bz;
      const offsetX=Math.round((x+bx-cx)/(2*BOUND))*2*BOUND;
      const offsetZ=Math.round((z+bz-cz)/(2*BOUND))*2*BOUND;
      if(mesh.position.x!==offsetX || mesh.position.z!==offsetZ) {
        mesh.position.set(offsetX,0,offsetZ);
        mesh.updateMatrix();
      }
      mesh.visible=distanceSq<(range+bounds.radius)**2;
      if(data.nearGeometry) {
        if(skyline && distanceSq>(385+bounds.radius)**2)mesh.geometry=data.skylineGeometry;
        else mesh.geometry=data.farGeometry && distanceSq>(73+bounds.radius)**2?data.farGeometry:near;
      }
    }
    // Put the next unseen parcel behind the camera in spare main-thread time.
    // A turn or a journey jump always builds the required view before drawing.
    if(nextTile && !idlePending && typeof window!=='undefined' && !document.hidden) {
      idlePending=true;
      if(window.requestIdleCallback)window.requestIdleCallback(warmNeighbour);
      else window.setTimeout(warmNeighbour,80);
    }
  }
  return {prepare,update};
}
