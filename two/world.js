import { buildDangoChaya } from './dango-chaya-art.js';
import { WAYSIDE_SITES, BATH_YARD, TEA_FOOTPATHS } from './wayside-hut-layout.js';
import { buildWaysideHut } from './wayside-hut-art.js';
import { buildGoemonBath } from './goemon-bath-art.js';
import { createLampCollection } from './kyo-lights.js';
import { GATE_PAVING, RASHOMON, inCapitalWard } from './kyo-layout.js';
import { kyoRidgeHeight } from './higashiyama.js';
import { dressSeaports } from './seaports.js';
import { createOceanShips } from './ocean-ship-art.js';
import { dressWardShop } from './kyo-market.js';
import { createMountainWaterfalls } from './mountain-waterfalls.js';
import { createLakeShore } from './lake-shore.js';
import { dressOutcrops } from './outcrops.js';
import { DISTRICTS,TERRAIN_TILES,TERRAIN_SUBDIVISIONS } from './geography.js';
import { PEACH_RANGE_BOUNDS } from './peach-range.js';
import { scrollCoverage } from './scroll-paper.js';
import { createKiyomizu } from './kiyomizu.js';
import { createKyo, kyoPavingMaterial } from './kyo.js';
import { dressPilgrimage, pilgrimageLife } from './pilgrimage.js';
import { dressCourt } from './magistrates-hall.js';
import { createBathTableaux } from './main-bath-art.js';
import { dressWaysideBaths } from './wayside-baths.js';
import { dressRyugu, createRyuguLife } from './ryugu.js';
import { createTravellers } from './travelling-merchants.js';
import { RIVER_SKIFFS, merchantPose } from './traveller-positions.js';
import { noren } from './craftwork.js';
import { pagodaPlan, roomPlan, roofForm, HOUSE_EAVES, PAGODA_SPAN } from './architecture.js';
import { tradeFacade } from './workshops.js';
import { roofShell, atticWalls, timberLining } from './roof-shell.js';
import { wetStone } from './stone-water.js';
import { prepareForest } from './forest.js';
import { furnishRoom } from './interiors.js';
import { FOREST_LAKE, LAKE_ISLET, SNOW_PASS, lakeRadius, lakeRadiusGLSL, isletRadius, isletRadiusGLSL } from './snow-country.js';
import * as THREE from './vendor/three.module.min.js';
import { dressSeasonalPlaces, seasonalWeather } from './seasons.js';
import { winterSurfGLSL } from './winter-surf.js';
import { winterPagodaRoof } from './winter-coast.js';
import { POUNDING } from './festival.js';
import { createMochiPounding } from './actors.js';
import { dressPlaces } from './places.js';
import { BOATS, HULL_HEIGHT, HULL_DRAFT, waterWaveGLSL, hullWaterGLSL } from './shoreline.js';
import { createAtmosphere } from './atmosphere.js';
import { loadPigments, meadowMaterial, trailMaterial, tintedSurface, roundedStone } from './pigments.js';
import { plantInkTrees, plantUnderstory } from './wilds.js';
import {
  BOUND,
  wrapDelta,
  seasonAt,
  shoreDistance, PENINSULAS, CONNECTING_ROADS,
  BUILDINGS,
  GATES, gateFooting,
  TREES,
  LANDMARK_TREES,
  ROCKS,
  REGIONS,
  ROADS,
  BRIDGES, MAPLE_FOOTINGS,
  WATER_Y,
  terrainHeight, terrainMeshHeight, springGround,
  bridgeHeight,
  riverZ,
  riverHalfWidth,
  riverMouthFlare,
  coastX,
  regionAt,
  nearRoad,
  seeded,
} from './terrain.js';

const { sin, cos, abs, min, max, sqrt, PI } = Math,
  TAU = 2 * PI;
const rnd = seeded(245726);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const h = terrainHeight;
const css = (c) => new THREE.Color(c);
const textureURL = (name) => new URL('./assets/world/' + name + '.webp', import.meta.url).href;
function geometry(points, indices, uvs = [], colors = []) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  g.setIndex(indices);
  if (uvs.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (colors.length) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}
function canvasTexture(w, h, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function repeat(tex) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
function grain() {
  return repeat(
    canvasTexture(256, 256, (c, w, h) => {
      c.fillStyle = '#f1efdb';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 1250; i++) {
        const x = rnd() * w,
          y = rnd() * h,
          r = 0.7 + rnd() * 7;
        c.fillStyle = i % 3 ? 'rgba(109,120,81,.028)' : 'rgba(140,104,59,.033)';
        c.beginPath();
        c.ellipse(x, y, r * (1 + rnd()), r * 0.52, rnd() * PI, 0, TAU);
        c.fill();
      }
      c.strokeStyle = 'rgba(86,80,55,.16)';
      c.lineWidth = 0.7;
      for (let i = 0; i < 330; i++) {
        const x = rnd() * w,
          y = rnd() * h;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 1 + rnd() * 4, y - 0.7);
        c.stroke();
      }
    }),
  );
}
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
function* landscape(scene, art) {
  const mat = meadowMaterial(art);
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
  const tiles=TERRAIN_TILES, span=2*BOUND/tiles,farIndices=horizonIndex(TERRAIN_SUBDIVISIONS);
  for (let row=0; row<tiles; row++) for (let column=0; column<tiles; column++) {
    // Deep ocean is a level shelf. Keep the fine lattice for shores, roads,
    // palace and cliffs, without allocating a million detailed sea vertices.
    const midX=(column+.5)*span-BOUND, midZ=(row+.5)*span-BOUND;
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
    const ground=geometry(p,ix,uv,col);
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
    scene.add(land);
    yield;
  }
}
// Both road materials pull their surface toward the camera for intersections.
// Cut their pigment precisely at the dressed stone, even in a grazing view.
const masonryFootprints=[
  ...GATE_PAVING.map(b=>new THREE.Vector4(RASHOMON.x+b.x,RASHOMON.z+b.z,b.w/2,b.d/2)),
  ...MAPLE_FOOTINGS.thresholds.map(s=>new THREE.Vector4(s.x,s.z,s.w/2,s.d/2)),
];
function reserveMasonry(original) {
  const material=original.clone(),compile=original.onBeforeCompile,previousKey=original.customProgramCacheKey();
  material.customProgramCacheKey=()=>previousKey+'-paved-entrances';
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.pavedEntrances={value:masonryFootprints};
    shader.vertexShader='varying vec2 roadPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n roadPosition=position.xz;');
    shader.fragmentShader=`varying vec2 roadPosition; uniform vec4 pavedEntrances[${masonryFootprints.length}];\n`+
      shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
        for(int k=0;k<${masonryFootprints.length};k++){
          vec4 box=pavedEntrances[k];
          if(all(lessThanEqual(abs(roadPosition-box.xy),box.zw)))discard;
        }`);
  };
  return material;
}
function buildRoads(scene, art) {
  const material = trailMaterial(art), paving=kyoPavingMaterial(art.rock), climate={};
  const approach=reserveMasonry(material),avenue=reserveMasonry(paving);
  for (const road of [...ROADS,...TEA_FOOTPATHS]) {
    const p=[], uv=[], ix=[], snow=[];
    const end=road.points.at(-1);
    for (let i=0; i<road.points.length; i++) {
      const [x,z]=road.points[i], prev=road.points[max(0,i-1)], next=road.points[min(i+1,road.points.length-1)];
      const dx=next[0]-prev[0], dz=next[1]-prev[1], l=Math.hypot(dx,dz)||1;
      // Dirt pigment is sampled in world space. Its UVs control wear at the
      // sides and at the open end of the path into the sunrise beach.
      const endWeight=road.fadeEnd?min(1,Math.hypot(end[0]-x,end[1]-z)/road.fadeEnd):1;
      const width=road.paved ? road.width : road.width*(1+.045*sin(x*1.2+z*.7)+.035*sin(z*1.8));
      const snowAmount=seasonAt(x,z,climate).snow;
      const underDeck=BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+.5 && abs(z-b.z)<b.length*.5-.4);
      for(let j=0;j<=4;j++) {
        const across=(j/4-.5)*width, xx=x+(dz/l)*across, zz=z-(dx/l)*across;
        p.push(xx,road.footpath?terrainMeshHeight(xx,zz)+.045:h(xx,zz)+.08,zz);
        if(road.paved) uv.push(xx,zz);
        else uv.push(j/4,endWeight);
        snow.push(snowAmount);
        if(!underDeck && i<road.points.length-1 && j<4) {
          const k=i*5+j;
          ix.push(k,k+1,k+5,k+1,k+6,k+5);
        }
      }
    }
    const geo=geometry(p,ix,uv);
    geo.setAttribute('snowAmount',new THREE.Float32BufferAttribute(snow,1));
    const atEntrance=road.points.some(([x,z])=>abs(x-RASHOMON.x)<25 && abs(z-RASHOMON.z)<22 ||
      MAPLE_FOOTINGS.thresholds.some(s=>abs(x-s.x)<4 && abs(z-s.z)<4));
    const mesh=new THREE.Mesh(geo,road.paved?(atEntrance?avenue:paving):(atEntrance?approach:material));
    mesh.receiveShadow=true;mesh.renderOrder=road.paved?2:1;scene.add(mesh);
  }
}
function makeWater(scene, art, panorama, winterWash) {
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: true,
    side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        clock: { value: 0 },
        climate: {value:new THREE.Vector4()},
        hullPlacement: {value: BOATS.map(b => new THREE.Vector4(b.x,b.z,cos(b.yaw),sin(b.yaw)))},
        hullSize: {value: BOATS.map(b => new THREE.Vector4(b.length,b.width,0,0))},
        skiffPlacement: {value: RIVER_SKIFFS.map(()=>new THREE.Vector4())},
        pebble: { value: null },
        horizon: { value: null },
        deep: { value: css('#65898a') },
        jade: { value: css('#b6c9b7') },
        foam: { value: css('#ede9ce') },
      },
    ]),
    vertexShader: `varying vec3 vWorld; uniform float clock;
      ${waterWaveGLSL}
      #include <fog_pars_vertex>
      void main(){vec4 wp=modelMatrix*vec4(position,1.);
        vec2 q=mod(wp.xz+float(${BOUND}),float(${2*BOUND}))-float(${BOUND});
        wp.y+=waveHeight(q,clock);
        vWorld=wp.xyz;
        vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float clock;uniform vec4 climate;uniform sampler2D pebble,horizon;uniform vec3 deep,jade,foam;
      uniform vec4 skiffPlacement[${RIVER_SKIFFS.length}];
      varying vec3 vWorld;
      ${hullWaterGLSL}
      ${lakeRadiusGLSL}
      ${isletRadiusGLSL}
      #include <fog_pars_fragment>
      float hash(vec2 v){return fract(sin(dot(v,vec2(41.23,73.11)))*21314.5);}
      float curl(vec2 at,float phase){
        vec2 cell=floor(at), p=fract(at)-.5;
        float k=hash(cell);
        float span=.11+.32*hash(cell+3.1);
        float offset=(k-.5)*.53;
        float tip=p.x/span;
        float edge=p.y-offset-(tip*tip-.3)*(.025+.105*k)-.023*sin(p.x*9.+phase);
        float width=(.009+.016*k)*(1.-.6*min(1.,abs(tip)));
        float antialias=clamp(length(fwidth(at)),.013,.24);
        float line=(1.-smoothstep(width,width+antialias,abs(edge)))*(1.-smoothstep(.64,1.,abs(tip)));
        return line*smoothstep(.31,.78,hash(cell+2.03));
      }
      ${winterSurfGLSL}
      void main(){
        vec2 p=mod(vWorld.xz+float(${BOUND}),float(${2*BOUND}))-float(${BOUND});float t=clock;
        float margin=hullMargin(p,(vWorld.y-${WATER_Y - HULL_DRAFT})/${HULL_HEIGHT});
        if(margin<0.)discard;
        float river=18.+9.*sin(p.x/51.)+3.3*sin(p.x/25.);
        float tide=max(smoothstep(197.,248.,-p.x)*(1.-smoothstep(252.,269.,-p.x)),
                       smoothstep(340.,392.,p.x)*(1.-smoothstep(398.,415.,p.x)));
        float halfBank=8.6+1.9*sin(p.x/38.+.35)+.95*sin(p.x/14.)+6.4*tide;
        float coastBand=(p.y-112.)/75.;float shoreX=-250.+64.*exp(-coastBand*coastBand)+5.5*sin(p.y/23.);
        float eastBand=(p.y-176.)/99.;float eastX=374.-48.*exp(-eastBand*eastBand)+7.*sin(p.y/36.);
        float end=375.+7.*sin(p.x/41.)+4.*cos(p.x/22.);
        float shoreDist=min(min(p.x-shoreX,eastX-p.x),end-abs(p.y));
        float erosion=5.9*sin(p.x*.048+p.y*.025)+3.8*cos(p.y*.062-p.x*.033)+2.3*sin(p.x*.109-p.y*.089);
        ${PENINSULAS.map(([x,z,rx,rz]) =>
          `{vec2 delta=p-vec2(${x}.,${z}.);
            if(all(lessThan(abs(delta),vec2(${rx+62}.,${rz+62}.)))) {
              float edge=(1.-length(delta/vec2(${rx}.,${rz}.)))*${Math.min(rx,rz)}.+erosion;
              float seam=max(0.,1.-abs(shoreDist-edge)/24.);shoreDist=max(shoreDist,edge)+6.*seam*seam;
            }}`).join('\n')}
        float inside=max(halfBank-abs(p.y-river),-shoreDist);
        if (p.x>278. && p.y < -104. && p.y > -152.) inside=max(inside,3.1+3.8*tide-abs(p.y+130.-3.3*sin((p.x-292.)/15.)));
        float lake=2.;
        if(all(lessThan(abs(p-vec2(${FOREST_LAKE.x}.,${FOREST_LAKE.z}.)),vec2(${FOREST_LAKE.rx*2}.,${FOREST_LAKE.rz*2}.)))){
          lake=lakeRadius(p);
          float lakeDepth=(1.-lake)*${FOREST_LAKE.rz}.;
          if(lake<.62)lakeDepth=min(lakeDepth,(isletRadius(p)-1.)*${LAKE_ISLET.rz}.);
          inside=max(inside,lakeDepth);
        }
        float depth=smoothstep(-1.8,6.8,inside);
        vec2 along=normalize(vec2(1.,(9./51.)*cos(p.x/51.)+(3.3/25.)*cos(p.x/25.)));
        vec2 uv=vec2(dot(p,along),p.y-river);
        float slow=sin(uv.x*.46+uv.y*.17-t*.72);
        float sidle=sin(uv.y*1.91+slow*.72+t*.83);
        float fine=sin(uv.y*4.3+sin(uv.x*1.1-t)*.72+t*.73);
        vec3 n=normalize(vec3(.041*slow+.019*fine,1.,.084*sidle+.027*fine));
        vec3 eye=normalize(vWorld-cameraPosition);
        vec3 reflection=reflect(eye,n);
        vec2 heading=normalize(reflection.xz+vec2(.0001));
        float angle=atan(heading.x,-heading.y);
        float u=angle/3.14159265+.095;
        float v=.20+(reflection.y*680./max(.12,length(reflection.xz)))/(215.+24.*sin(angle*3.+.8));
        vec3 ridge=texture2D(horizon,vec2(u,clamp(v,.01,.99))).rgb;
        float ink=1.-clamp(dot(ridge,vec3(.29,.53,.18))/.72,0.,1.);
        vec3 mirror=mix(vec3(.71,.78,.68),vec3(.19,.29,.27),ink*.72);
        float fresnel=.09+pow(1.-clamp(dot(-eye,n),0.,1.),2.6)*.47;
        vec2 refractUV=p*.24+n.xz*.34;
        vec3 bed=texture2D(pebble,refractUV).rgb*vec3(.79,.94,.90);
        vec3 water=mix(jade,deep,depth*(.78+.15*slow));
        vec3 col=mix(bed,water,.34+depth*.66);
        col=mix(col,mirror,fresnel*.78);
        vec2 flow=uv+vec2(-t*.22, slow*.19+.12*sin(uv.x*.41-t*.22));
        float glint=curl(flow*vec2(.65,1.22),t*.53);
        float hair=curl(flow*vec2(1.12,2.37)+vec2(3.73,.37),t*.68);
        float shore=(1.-smoothstep(.14,1.06,abs(inside+.52+.25*sidle)))*(.48+.22*slow);
        // Broken indigo contour and a thin unpainted crest follow each shoal.
        float shoal=abs(inside+1.22+.34*sidle+.14*fine);
        float edgeWidth=max(.045,fwidth(inside)*1.15);
        float inkline=(1.-smoothstep(.04,.04+edgeWidth,shoal))*(.58+.32*slow);
        float band=uv.y*4.1+sin(uv.x*.45-t*.6)+.78*sin(uv.x*.91+uv.y*.58-t*.76);
        float caustic=pow(max(0.,cos(band)),16.)*pow(.5+.5*sin(uv.x*.44+fine),2.);
        col+=vec3(.12,.155,.10)*caustic*(1.-depth)*.8;
        col=mix(col,col*vec3(.52,.67,.67),inkline*.6);
        col=mix(col,foam,glint*.46+hair*.20+shore*.48);
        // Two tapering brushstrokes leave the loaded bow, curl alongside its
        // planks, then break into a chain of short ripples astern.
        if(p.y> -5. && p.y<59. && p.x> -273. && p.x<421.){
          for(int i=0;i<${RIVER_SKIFFS.length};i++){
            vec4 boat=skiffPlacement[i];vec2 delta=p-boat.xy;
            if(max(abs(delta.x),abs(delta.y))>9.)continue;
            float aft=2.44-dot(delta,boat.wz);
            if(aft<0. || aft>9.)continue;
            float across=abs(dot(delta,vec2(boat.z,-boat.w)));
            float reach=aft/9.;
            float shoulder=.61*(1.-exp(-aft*1.15))+.16*aft;
            float broken=mix(1.,smoothstep(-.45,.64,sin(aft*3.8-t*3.1+float(i))+.27*sidle),reach);
            float line=1.-smoothstep(.014,.084+min(.12,fwidth(across)),abs(across-shoulder-.035*sidle));
            float wash=1.-smoothstep(.022,.115,abs(across-shoulder*.71));
            col=mix(col,foam,(line*.64+wash*.22)*broken*(1.-smoothstep(.47,1.,reach))*smoothstep(0.,.43,aft));
          }
        }
        float meniscus=1.-smoothstep(.008,.056+min(.05,length(fwidth(p))),margin);
        col=mix(col,col*vec3(.57,.61,.58),meniscus*.58);
        col=mix(col,foam,.25*(1.-smoothstep(.012,.059,abs(margin-.086+.013*slow)))*(.52+.41*sidle));
        float under=(1.-smoothstep(3.5,5.1,abs(p.x+.4*sidle)))*smoothstep(-.4,2.,inside);
        col*=1.-under*.19;
        col=winterWater(col,p,shoreDist,depth,glint,fresnel,t,reflection,climate.x);
        vec3 nightWater=mix(vec3(.015,.035,.075),vec3(.080,.12,.19),fresnel+glint*.17);
        col=mix(col,nightWater,climate.z);
        vec3 dawnWater=mix(vec3(.075,.183,.221),vec3(.52,.355,.32),fresnel*1.18);
        float choppy=.5+.5*sin(p.y*1.6+.57*sin(p.x*.74-t*.38)+sin(p.y*.27+p.x*.27)-t*.62);
        dawnWater+=vec3(.055,.051,.050)*(glint*.68+hair*.48+choppy*.14);
        dawnWater=mix(dawnWater,vec3(.76,.66,.51),shore*.29);
        col=mix(col,dawnWater,climate.w*.9);
        vec3 sunDir=normalize(vec3(.976,.094,-.192)),moonDir=normalize(vec3(.13,.26,-.96));
        float spark=.12+.65*smoothstep(.35,.90,choppy)+.51*glint+.23*hair;
        col+=vec3(1.55,.82,.33)*exp(-26.*length((reflection-sunDir)*vec3(1.,.63,1.)))*spark*climate.w;
        col+=vec3(.54,.69,.92)*exp(-24.*length((reflection-moonDir)*vec3(1.,.63,1.)))*spark*climate.z;
        // A thin film reveals the actual stones and bank through the painted
        // gravel. Deep channels and grazing-angle reflections close the wash.
        float opacity=mix(.51,.995,smoothstep(-.8,5.3,inside));
        opacity=mix(opacity,1.,clamp(fresnel*.79+glint*.24+shore*.20,0.,1.));
        if(lake<1.06){
          // Freshwater retains the pale paper of the sky between wind lanes.
          // The shallow ochre shelf gives way to celadon and then blue ink.
          float shoal=smoothstep(.4,9.,inside);
          float stroke=curl((p+vec2(t*.12,.22*slow))*vec2(.18,1.37),t*.33);
          float wash=.5+.5*sin(p.y*.10+.76*sin(p.x*.064)+.10*slow);
          // Low banks reflect well into a horizontal view. Seen from above,
          // the same reach opens up to show deep blue-green pigment.
          vec2 lakeAxes=vec2(${FOREST_LAKE.rx}.,${FOREST_LAKE.rz}.);
          vec2 basin=(p-vec2(${FOREST_LAKE.x}.,${FOREST_LAKE.z}.))/lakeAxes;
          vec2 ray=heading/lakeAxes;
          float r=clamp(length(basin)/max(.001,lake),.84,1.2);
          float b=dot(ray,basin),a=dot(ray,ray);
          float bankRange=(sqrt(max(0.,b*b+a*(r*r-dot(basin,basin))))-b)/max(.00001,a);
          vec2 beyond=p+heading*bankRange;
          float bankTop=5.+2.8*sin(beyond.x*.082+beyond.y*.064);
          float bankWash=(1.-smoothstep(0.,bankTop,max(0.,bankRange)*-eye.y/max(.09,length(eye.xz))))*shoal;
          vec3 quiet=mix(bed*vec3(.92,1.02,.91),mix(vec3(.058,.145,.147),vec3(.122,.245,.207),wash*.78),shoal*.90);
          quiet=mix(quiet,vec3(.074,.120,.101),bankWash*.38);
          quiet=mix(quiet,mirror*vec3(.51,.61,.60),.056+fresnel*.22);
          quiet+=vec3(.063,.079,.073)*(hair*.16+glint*.23+stroke*.85);
          float littoral=abs(inside-1.18-.18*sidle);
          float rim=(1.-smoothstep(.045,.18+min(.35,fwidth(inside)),littoral))
            *smoothstep(-.1,.84,sin(p.x*.58+p.y*.33)+.35*slow);
          quiet*=1.-.16*rim;
          col=mix(quiet,foam,shore*.26);
          opacity=mix(.10,.984,shoal)+.014*fresnel;
        }
        if (!gl_FrontFacing) {
          // From below, moving folds of light replace the reflected mountains.
          float zenith=clamp(eye.y,0.,1.);
          col=mix(vec3(.066,.215,.23),vec3(.47,.72,.65),pow(zenith,2.1));
          col+=vec3(.18,.22,.14)*(glint*.8+hair*.32+.10*choppy)*zenith;
          opacity=1.;
        }
        gl_FragColor=vec4(col,opacity);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  // Keep the live asynchronously loaded sources in the merged fog/water uniforms.
  mat.uniforms.clock = scene.userData.waterClock ??= {value:0};
  mat.uniforms.winterWash = {value:winterWash};
  mat.uniforms.pebble.value = art.gravel;
  mat.uniforms.horizon.value = panorama || art.gravel;
  // Concentrate vertices at water level around the traveller. The outskirts
  // only carry long swells to the horizon, with no visible join between LODs.
  const grid=new THREE.PlaneGeometry(2,2,112,112);
  const verts=grid.attributes.position;
  const spread=u=>u*45+Math.sign(u)*Math.pow(Math.abs(u),6)*1755;
  for(let i=0;i<verts.count;i++) verts.setXYZ(i,spread(verts.getX(i)),0,-spread(verts.getY(i)));
  grid.computeBoundingSphere();
  const m = new THREE.Mesh(grid, mat);
  m.name = '桜川と潮';
  m.position.y = WATER_Y;
  scene.add(m);
  return {uniforms:mat.uniforms,update(time,player){
    mat.uniforms.clock.value=time;
    RIVER_SKIFFS.forEach((_,i)=>{
      const q=merchantPose(2+i,time);
      const nearby=wrapDelta(q.x-player.x)**2+wrapDelta(q.z-player.z)**2<155**2;
      mat.uniforms.skiffPlacement.value[i].set(nearby?q.x:2*BOUND,q.z,cos(q.yaw),sin(q.yaw));
    });
    m.position.x=Math.round(player.x/4)*4; m.position.z=Math.round(player.z/4)*4;
  }};
}

function crossbeamProfile(cap) {
  const position = [],
    indices = [],
    uv = [];
  // A kasagi is thicker and wider at its turned-up ends. A separate lacquered
  // cap over the red shimaki makes the weathered bevel readable from below.
  const profile = cap
    ? [
        [-0.037, 0.006],
        [-0.049, 0.022],
        [-0.043, 0.042],
        [0.041, 0.048],
        [0.05, 0.024],
        [0.036, 0.004],
      ]
    : [
        [-0.027, -0.039],
        [-0.034, -0.027],
        [-0.033, 0.01],
        [0.033, 0.01],
        [0.034, -0.027],
        [0.026, -0.039],
      ];
  const n = 32,
    count = profile.length;
  for (let i = 0; i <= n; i++) {
    const x = i / n - 0.5,
      edge = Math.abs(x) * 2;
    const rise = 0.925 + 0.076 * edge ** 2.8;
    for (let j = 0; j < count; j++) {
      const [z, y] = profile[j];
      position.push(x * (cap ? 1.1 : 1.054), rise + y, z * (0.9 + 0.22 * edge ** 2));
      uv.push((i / n) * 2.3, j / count);
      if (i < n) {
        const a = i * count + j,
          b = i * count + ((j + 1) % count),
          c = a + count,
          d = b + count;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  for (let j = 1; j < count - 1; j++) indices.push(0, j + 1, j, n * count, n * count + j, n * count + j + 1);
  return geometry(position, indices, uv);
}
function paperStreamer() {
  const points = [
    [-0.14, 0.5, 0],
    [0.14, 0.5, 0],
    [0.13, 0.2, 0.018],
    [0.31, 0.18, 0.013],
    [0.27, -0.04, 0.07],
    [0.45, -0.09, 0.1],
    [0.37, -0.46, 0.05],
    [0.11, -0.43, 0.01],
    [0.13, -0.18, 0.0],
    [-0.05, -0.15, -0.035],
    [-0.02, 0.08, 0],
    [-0.16, 0.1, 0.008],
  ];
  const faces = THREE.ShapeUtils.triangulateShape(
    points.map((p) => new THREE.Vector2(p[0], p[1])),
    [],
  );
  return geometry(
    points.flat(),
    faces.flat(),
    points.flatMap((p) => [p[0] + 0.5, p[1] + 0.5]),
  );
}
function bronzeFinial() {
  return new THREE.LatheGeometry(
    [
      [0.28, 0],
      [0.49, 0.06],
      [0.46, 0.15],
      [0.3, 0.23],
      [0.38, 0.31],
      [0.43, 0.44],
      [0.36, 0.57],
      [0.22, 0.7],
      [0.12, 0.82],
      [0.03, 1],
    ].map((v) => new THREE.Vector2(...v)),
    13,
  );
}

function leafBlade() {
  // Curved blades rise from a common root and taper to a single painted tip.
  const p = [],
    ix = [],
    uv = [],
    col = [];
  const random = seeded(72);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.399 + 0.3 * random(),
      dx = cos(a),
      dz = sin(a),
      reach = 0.2 + random() * 0.44;
    const tall = 0.58 + random() * 0.43,
      wide = 0.025 + random() * 0.028,
      off = p.length / 3;
    for (let j = 0; j < 3; j++) {
      const t = j / 3,
        bend = reach * (t * 0.2 + t * t * 0.94),
        w = wide * (1 - 0.65 * t);
      for (const s of [-1, 1]) {
        p.push(dx * bend + s * dz * w, tall * (t + 0.13 * sin(t * PI)), dz * bend - s * dx * w);
        uv.push((s + 1) * 0.5, t);
        col.push(0.58 + t * 0.33, 0.66 + t * 0.28, 0.5 + t * 0.26);
      }
      if (j < 2) {
        const k = off + j * 2;
        ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    p.push(dx * reach, tall * 0.9, dz * reach);
    uv.push(0.5, 1);
    col.push(0.98, 0.93, 0.72);
    ix.push(off + 4, off + 5, off + 6);
  }
  return geometry(p, ix, uv, col);
}
function stripedThatch() {
  const tex = repeat(
    canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#d7c79f';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3600; i++) {
        const x = rnd() * w,
          y = rnd() * h,
          dy = 3 + rnd() * 18;
        ctx.lineWidth = 0.45 + rnd() * 0.7;
        ctx.strokeStyle = i % 2 ? 'rgba(69,56,36,.29)' : 'rgba(255,239,190,.44)';
        for (const off of [-h, 0]) {
          ctx.beginPath();
          ctx.moveTo(x, y + off);
          ctx.lineTo(x - 1.5 + rnd() * 3, y + dy + off);
          ctx.stroke();
        }
      }
      for(let row=-1;row<5;row++) {
        for(let i=0;i<120;i++){
          const x=i*w/120, y=row*64+29+3*sin(x*.058+row)+2*rnd();
          ctx.strokeStyle='rgba(83,66,46,.24)';ctx.lineWidth=.9+rnd();
          ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1.2,y-6-rnd()*7);ctx.stroke();
          ctx.strokeStyle='rgba(249,232,187,.62)';
          ctx.beginPath();ctx.moveTo(x+1,y-3);ctx.lineTo(x+1.7,y+2+rnd()*6);ctx.stroke();
        }
      }
    }),
  );
  return new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
}
const labels = {
  桜川: ['#392e23', '#e6c983'],
  染: ['#f3e8cc','#415b68'],
  書: ['#f1e4c8','#584f40'],
  米: ['#eee2bf','#686a48'],
  網: ['#eee1c2','#5f6960'],
  茶: ['#f1e3be', '#56645a'],
  酒: ['#efe0b1', '#4b5562'],
  湯: ['#f4e0ac', '#9b4d3f'],
  市: ['#f0e3bb', '#5a6655'],
  社: ['#e6ce9b', '#514138'],
};
function calligraphy(glyph) {
  const [fg, bg] = labels[glyph];
  return canvasTexture(128, 192, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = fg;
    c.globalAlpha = 0.65;
    c.lineWidth = 2;
    c.strokeRect(6, 7, w - 12, h - 14);
    c.globalAlpha = 1;
    c.fillStyle = fg;
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    c.font = 'bold 74px "Hiragino Mincho ProN","Yu Mincho",serif';
    const chars = [...glyph];
    chars.forEach((g, i) => c.fillText(g, w / 2, h / 2 + (i - (chars.length - 1) / 2) * 71));
  });
}

class Painter {
  constructor(scene, paper, art) {
    this.scene = scene;
    this.roofLinings=new Map();
    this.roofTimber=art.cedar;
    this.groups = new Map();
    this.closeDetails = [];
    this.sway = { value: 0 };
    this.dummy = new THREE.Object3D();
    this.yAxis = V(0, 1, 0);
    this.color = new THREE.Color();
    this.shapes = {
      box: new THREE.BoxGeometry(1, 1, 1),
      kasagi: crossbeamProfile(true),
      shimaki: crossbeamProfile(false),
      shaft: new THREE.LatheGeometry(
        [
          [0.61, 0],
          [0.83, 0.018],
          [0.85, 0.061],
          [0.66, 0.11],
          [0.52, 0.15],
          [0.46, 0.22],
          [0.45, 0.69],
          [0.54, 0.75],
          [0.65, 0.79],
          [0.67, 0.85],
          [0.95, 0.9],
          [1, 0.96],
          [0.93, 1],
        ].map((q) => new THREE.Vector2(...q)),
        12,
      ),
      kasa: new THREE.LatheGeometry(
        [
          [1, 0.03],
          [1, 0.13],
          [0.79, 0.21],
          [0.6, 0.27],
          [0.42, 0.45],
          [0.3, 0.63],
          [0.21, 0.86],
          [0.12, 1],
        ].map((q) => new THREE.Vector2(...q)),
        8,
      ),
      streamer: paperStreamer(),
      finial: bronzeFinial(),
      pole: new THREE.CylinderGeometry(0.81, 1, 1, 8),
      round: new THREE.CylinderGeometry(1, 1, 1, 12),
      rock: roundedStone(43),
      leaf: leafBlade(),
      plane: new THREE.PlaneGeometry(1, 1),
      roof: roofShell('gable'),
      hipRoof: roofShell('hip'),
      pagodaRoof: roofShell('pagoda',.51),
      pagodaCrown: roofShell('pagoda'),
      gableWalls: atticWalls('gable',1/HOUSE_EAVES.width,1/HOUSE_EAVES.depth),
      hipWalls: atticWalls('hip',1/HOUSE_EAVES.width,1/HOUSE_EAVES.depth),
      pagodaFootWalls: atticWalls('pagoda',.73/PAGODA_SPAN,.73/PAGODA_SPAN,.51),
      pagodaWalls: atticWalls('pagoda',.76/PAGODA_SPAN,.76/PAGODA_SPAN,.51),
      pagodaCrownWalls: atticWalls('pagoda',.76/PAGODA_SPAN,.76/PAGODA_SPAN),
      pyramid: new THREE.ConeGeometry(1, 1, 4, 1),
      ball: new THREE.SphereGeometry(1, 10, 7),
    };
    this.solid = new THREE.MeshLambertMaterial({ map: paper, side: THREE.DoubleSide });
    this.roofs = tintedSurface(art.tile, 0.56, 0.72, 0.022);
    this.lacquer = tintedSurface(art.cedar, 0.13, 0.69, 0.009);
    this.thatch = stripedThatch();
    this.stone = wetStone(tintedSurface(art.rock, .58), WATER_Y, this.sway);
    this.boarding = tintedSurface(art.cedar, 0.36);
    const oldCompile = this.boarding.onBeforeCompile;
    this.boarding.onBeforeCompile = (shader) => {
      oldCompile(shader);
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float board=fract(vMapUv.x*16.);
        float edge=min(board,1.-board);
        diffuseColor.rgb*=mix(.51,1.,smoothstep(.007,.039,edge));
      `,
      );
    };
    this.fine = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    this.stems = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true });
    this.wood = tintedSurface(art.cedar, 0.29);
    this.deck = tintedSurface(art.cedar, 0.3);
    const tintDeck = this.deck.onBeforeCompile;
    this.deck.onBeforeCompile = shader => {
      tintDeck(shader);
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        vMapUv=vec2(vMapUv.y,1.-vMapUv.x);
        vBumpMapUv=vec2(vBumpMapUv.y,1.-vBumpMapUv.x);`);
    };
    this.bronze = new THREE.MeshStandardMaterial({ color: '#a69b73', roughness: 0.72, metalness: 0.34 });
    this.masonry = new THREE.MeshLambertMaterial({
      map: repeat(
        canvasTexture(384, 160, (c, w, h) => {
          c.fillStyle = '#dddccc';
          c.fillRect(0, 0, w, h);
          c.lineWidth = 1.6;
          c.strokeStyle = '#94978a';
          for (let j = 0; j < 4; j++)
            for (let i = -1; i < 8; i++) {
              const x = i * 62 + (j % 2) * 29,
                y = j * 40,
                dy = 3 * sin(i * 1.45 + j);
              c.beginPath();
              c.moveTo(x + 2, y + 5 + dy);
              c.quadraticCurveTo(x + 17, y + 1, x + 56, y + 6);
              c.lineTo(x + 63, y + 31 + dy);
              c.lineTo(x + 53, y + 38);
              c.lineTo(x + 7, y + 36);
              c.lineTo(x + 1, y + 25);
              c.closePath();
              c.fillStyle = (i + j) % 3 ? '#ced1c3' : '#e0dfd1';
              c.fill();
              c.stroke();
            }
        }),
      ),
    });
    this.sprays = {};
    const texloader = new THREE.TextureLoader();
    for (const name of ['pine', 'maple', 'oak', 'bamboo']) {
      const tex = texloader.load(textureURL(name));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 2;
      const mat = new THREE.MeshLambertMaterial({
        map: tex,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        emissiveMap: tex,
        emissive: 0xe2e3cb,
        emissiveIntensity: 0.18,
      });
      const phase = this.sway;
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.worldTime = phase;
        shader.vertexShader =
          'uniform float worldTime;\n' +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\ntransformed.x+=sin(instanceMatrix[3].x*.22+instanceMatrix[3].z*.16+worldTime*1.1+uv.y)*uv.y*uv.y*.024;',
          );
      };
      this.sprays[name] = mat;
    }
    // Keep the silhouette and vein detail of the leaf sprays. Autumn washes
    // use the original luminance, while hoarfrost settles on the pine tips.
    const seasonalSpray = (source, winter) => {
      const mat = source.clone();
      mat.emissiveIntensity = winter ? .10 : .17;
      mat.onBeforeCompile = shader => {
        source.onBeforeCompile(shader);
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          vec4 sampleLeaf=texture2D(map,vMapUv);
          float grain=dot(sampleLeaf.rgb,vec3(.31,.53,.16));
          ${winter ?
            'float cover=smoothstep(.040,.43,grain); diffuseColor.rgb*=mix(vec3(.15,.205,.18),vec3(.87,.94,.98),cover);'
            : 'diffuseColor.rgb*=.51+.85*smoothstep(.024,.52,grain);'}
          diffuseColor.a*=sampleLeaf.a;
        `);
      };
      mat.customProgramCacheKey=()=>winter?'snowy-needles':'autumn-maples';
      return mat;
    };
    this.sprays.snow = seasonalSpray(this.sprays.pine,true);
    this.sprays.autumn = seasonalSpray(this.sprays.maple,false);
    this.signs = {};
    for (const glyph of Object.keys(labels))
      this.signs[glyph] = new THREE.MeshLambertMaterial({ map: calligraphy(glyph), side: THREE.DoubleSide });
  }
  record(shape, mat, color, matrix, x, z, shadow = true, chunk = false) {
    if (shape === 'rock' && mat === this.solid) mat = this.stone;
    if(shape==='roof'||shape==='hipRoof'||shape==='pagodaRoof'||shape==='pagodaCrown'){
      if(!this.roofLinings.has(mat)) this.roofLinings.set(mat,timberLining(mat,this.roofTimber));
      mat=this.roofLinings.get(mat);
    }
    // Retain the silhouettes that actually hide the distant lights. Switch off
    // narrow mullions and joinery at their usual distances.
    const e=matrix.elements;
    const skyline=this.cityShell && (shape==='roof'||shape==='hipRoof'||shape==='pagodaRoof'||
      shape==='pagodaCrown'||shape.endsWith('Walls')||shape==='round' && e[5]>4 ||shape==='box' && e[5]>1.02 &&
      (Math.hypot(e[0],e[2])>1.3 || Math.hypot(e[8],e[10])>1.3));
    const key =
      (skyline?'洛':'') + shape +
      '|' +
      mat.id +
      '|' +
      Number(shadow) + '|' + Math.floor(x / (chunk ? 104 : 144)) + ',' + Math.floor(z / (chunk ? 104 : 144));
    let b = this.groups.get(key);
    if (!b) {
      b = { shape, geo: this.shapes[shape], mat, matrices: [], colors: [], shadow, extent: 0, skyline };
      this.groups.set(key, b);
    }
    b.extent = Math.max(b.extent, matrix.getMaxScaleOnAxis());
    b.matrices.push(matrix.clone());
    b.colors.push(this.color.set(color).clone());
  }
  part(
    shape,
    x,
    y,
    z,
    sx,
    sy,
    sz,
    color,
    yaw = 0,
    pitch = 0,
    roll = 0,
    mat = this.solid,
    shadow = true,
    chunk = false,
  ) {
    const d = this.dummy;
    d.position.set(x, y, z);
    d.scale.set(sx, sy, sz);
    d.rotation.set(pitch, yaw, roll, 'YXZ');
    d.updateMatrix();
    this.record(shape, mat, color, d.matrix, x, z, shadow, chunk);
  }
  link(a, b, r, color, square = false, shadow = true, chunk = false, mat = this.solid) {
    const d = this.dummy,
      dir = b.clone().sub(a),
      len = dir.length();
    if (len < 0.001) return;
    d.position.copy(a).add(b).multiplyScalar(0.5);
    d.scale.set(r, len, r);
    d.quaternion.setFromUnitVectors(this.yAxis, dir.divideScalar(len));
    d.updateMatrix();
    this.record(square ? 'box' : 'pole', mat, color, d.matrix, d.position.x, d.position.z, shadow, chunk);
  }
  *finish() {
    const sprays=new Set(Object.values(this.sprays));
    for (const { shape, geo, mat, matrices, colors, shadow, extent, skyline } of this.groups.values()) {
      const m = new THREE.InstancedMesh(geo, mat, matrices.length);
      let index=0;
      // Interleave sprays so a distant batch can draw two in every five
      // without dropping the last trees in its grove.
      const stride=sprays.has(mat)?5:1;
      for(let pass=0;pass<stride;pass++) for(let i=pass;i<matrices.length;i+=stride) {
        m.setMatrixAt(index, matrices[i]);
        m.setColorAt(index++, colors[i]);
      }
      if(stride>1) m.userData.foliageCount=matrices.length;
      m.userData.range=skyline?690:mat.userData.range || geo.userData.range || Math.min(300,72+extent*24);
      m.computeBoundingSphere();
      m.castShadow = shadow;
      m.receiveShadow = true;
      this.scene.add(m);
      if (shape === 'leaf') this.closeDetails.push(m);
      yield;
    }
    this.groups.clear();
  }
}
function* woodland(p, art) {
  yield* plantInkTrees(p, art);
  for (const tree of LANDMARK_TREES) {
    const { x, z, h: ht, kind } = tree,
      y = h(x, z) - 0.02,
      r = seeded(tree.seed),
      a = r() * TAU;
    if (kind === 'bamboo') {
      for (let j = 0; j < 5; j++) {
        const bx = x + (r() - 0.5) * 2.3,
          bz = z + (r() - 0.5) * 2.3,
          high = ht * (0.7 + r() * 0.42);
        const lean = (r() - 0.5) * 0.6;
        p.link(V(bx, y, bz), V(bx + lean, y + high, bz + 0.12), 0.075, '#788458', false, true, true);
        for (let k = 1; k < 7; k++)
          p.part(
            'round',
            bx + (lean * k) / 7,
            y + (high * k) / 7,
            bz + (0.12 * k) / 7,
            0.088,
            0.08,
            0.088,
            '#5b6950',
            0,
            0,
            0,
            p.solid,
            false,
            true,
          );
        for (let k = 0; k < 4; k++) {
          const angle = a + k * 1.88,
            rad = high * 0.075;
          p.part(
            'plane',
            bx + lean + cos(angle) * rad,
            y + high * (0.65 + k * 0.1),
            bz + sin(angle) * rad,
            high * 0.31,
            high * 0.27,
            1,
            '#f0f0d9',
            angle,
            0.07,
            -0.23,
            p.sprays.bamboo,
            false,
            true,
          );
        }
      }
      continue;
    }
  }
}
function seatStone(p,foot) {
  p.part('round',foot.x,(foot.bottom+foot.top)/2,foot.z,foot.radius,
    foot.top-foot.bottom,foot.radius,'#9d9c90',0,0,0,p.stone);
}
function gate(p, g, index) {
  const { x, z, w, h: ht, yaw } = g,
    y = terrainHeight(x, z);
  const local = (u, v, s) => V(x + u * cos(yaw) + s * sin(yaw), y + v, z - u * sin(yaw) + s * cos(yaw));
  const part = (sh, u, v, s, sx, sy, sz, col, ry = 0) => {
    const q = local(u, v, s);
    p.part(sh, q.x, q.y, q.z, sx, sy, sz, col, yaw + ry);
  };
  const vermilion = '#ad4530',
    edge = '#393c34',
    shade = '#843b2c';
  for (const sign of [-1, 1]) {
    const foot=gateFooting(g,sign),offset=foot.top-y;
    seatStone(p,foot);
    const a = local(sign * w * 0.36, offset-.03, 0),
      b = local(sign * w * 0.33, ht - 0.38, 0);
    p.link(a, b, w * 0.045, vermilion, false, true, false, p.lacquer);
    part('round', sign * w * 0.359, offset+.23, 0, w * 0.061, 0.52, w * 0.061, '#494d43');
    part('round', sign * w * 0.357, offset+.54, 0, w * 0.052, 0.135, w * 0.052, edge);
    part('box', sign * w * 0.335, ht * 0.785, 0, w * 0.115, 0.19, 0.47, shade);
  }
  part('box', 0, ht * 0.725, 0, w * 0.91, ht * 0.058, 0.39, vermilion);
  part('box', 0, ht * 0.845, 0, 0.31, ht * 0.21, 0.3, shade);
  p.part('shimaki', x, y, z, w, ht, w, vermilion, yaw, 0, 0, p.lacquer);
  p.part('kasagi', x, y, z, w, ht, w, '#55584b', yaw, 0, 0, p.wood);
  for (const sign of [-1, 1]) {
    for (const offset of [-0.08, 0.08]) {
      const bolt = local(sign * w * 0.335 + offset, ht * 0.72, 0.21);
      p.part('ball', bolt.x, bolt.y, bolt.z, 0.057, 0.057, 0.035, '#93845c', yaw, 0, 0, p.bronze);
    }
  }
  const pos = local(0, ht * 0.823, 0.27);
  p.part('plane', pos.x, pos.y, pos.z, 0.64, 0.93, 1, '#ffffff', yaw, 0, 0, p.signs[index ? '社' : '桜川']);
  const sag = (u) => ht * 0.704 - 0.53 * (1 - (u / 0.34) ** 2);
  for (let strand = 0; strand < 3; strand++)
    for (let j = 0; j < 37; j++) {
      const twist = (u) => u * TAU * 11 + (strand * TAU) / 3;
      const a = -0.34 + (j * 0.68) / 37,
        b = a + 0.68 / 37;
      p.link(
        local(a * w, sag(a) + sin(twist(a)) * 0.041, 0.21 + cos(twist(a)) * 0.044),
        local(b * w, sag(b) + sin(twist(b)) * 0.041, 0.21 + cos(twist(b)) * 0.044),
        0.042,
        strand === 0 ? '#a8996e' : strand === 1 ? '#d5bc83' : '#b6a177',
        false,
        false,
        false,
        p.wood,
      );
    }
  for (let j = 0; j < 7; j++) {
    const u = (j - 3) * 0.088,
      yy = sag(u);
    if (j % 2 === 0) {
      const q = local(u * w, yy - 0.21, 0.236);
      p.part(
        'streamer',
        q.x,
        q.y,
        q.z,
        0.43,
        0.56,
        1,
        '#f0e8cc',
        yaw - 0.12 + j * 0.029,
        0.05,
        j * 0.03 - 0.1,
        p.fine,
        false,
      );
    } else {
      for (let k = 0; k < 7; k++) {
        const f = (k - 3) / 3;
        p.link(
          local(u * w + f * 0.016, yy - 0.03, 0.21),
          local(u * w + f * 0.057, yy - 0.28 - 0.06 * cos(k * 1.21), 0.25),
          0.018,
          '#b9a082',
          false,
          false,
        );
      }
    }
  }
}
function lantern(p, x, z, s = 1, foot) {
  const y = foot?.top ?? h(x, z),
    stone = '#a4ab9f',
    base = '#8c958c';
  const part = (shape, v, rx, height, rz, color, rot = 0, mat = p.stone) =>
    p.part(shape, x, y + v * s, z, rx * s, height * s, rz * s, color, rot, 0, 0, mat);
  if(foot)seatStone(p,foot);
  else part('rock', 0.072, 0.44, 0.16, 0.42, base, 0.26);
  part('round', foot ? .08 : .15, 0.39, foot ? .22 : .13, 0.39, base);
  part('shaft', 0.19, 0.35, 0.99, 0.35, stone, PI / 12);
  part('round', 1.2, 0.35, 0.14, 0.35, base);
  part('box', 1.45, 0.42, 0.39, 0.42, '#655d46', 0, p.solid);
  // The hollow housing has inset screens on four faces; wide stone corners
  // frame the warmer interior and support the octagonal, lipped kasa.
  for (let j = 0; j < 4; j++) {
    const a = (j * PI) / 2,
      dx = sin(a) * 0.228 * s,
      dz = cos(a) * 0.228 * s;
    p.part('plane', x + dx, y + 1.456 * s, z + dz, 0.237 * s, 0.262 * s, 1, '#d5bd86', a, 0, 0, p.fine);
    for (const delta of [-0.064, 0.064]) {
      p.part(
        'box',
        x + dx + cos(a) * delta * s,
        y + 1.456 * s,
        z + dz - sin(a) * delta * s,
        0.018 * s,
        0.25 * s,
        0.022 * s,
        '#747668',
        a,
        0,
        0,
        p.stone,
      );
    }
    p.part('box', x + dx, y + 1.462 * s, z + dz, 0.234 * s, 0.023 * s, 0.025 * s, '#747668', a, 0, 0, p.stone);
    const phi = a + PI / 4;
    p.part(
      'box',
      x + sin(phi) * 0.318 * s,
      y + 1.45 * s,
      z + cos(phi) * 0.318 * s,
      0.108 * s,
      0.43 * s,
      0.108 * s,
      stone,
      0,
      0,
      0,
      p.stone,
    );
  }
  part('round', 1.665, 0.35, 0.072, 0.35, base);
  part('kasa', 1.68, 0.51, 0.39, 0.51, stone, PI / 8);
  part('finial', 2.033, 0.24, 0.28, 0.24, base);
}
function bridge(p, b) {
  const { x, z, length, halfWidth: w } = b,
    n = Math.ceil(length / 0.32),
    paint = b.maple ? '#b14b38' : x === 0 ? '#9b4936' : '#795d42';
  for (let i = 0; i < n; i++) {
    const zz = z - length * 0.5 + ((i + 0.5) / n) * length,
      y = bridgeHeight(b, zz);
    const angle = -Math.atan((bridgeHeight(b, zz + 0.22) - bridgeHeight(b, zz - 0.22)) / 0.44);
    p.part(
      'box',
      x,
      y - 0.12,
      zz,
      w * 2,
      0.23,
      length / n - 0.009,
      i % 4 === 0 ? '#a18967' : i % 3 === 1 ? '#a8916d' : '#af9470',
      0,
      angle,
      0,
      p.deck,
    );
    if (i % 4 === 0)
      for (const side of [-1, 1]) {
        p.part(
          'round',
          x + side * (w - 0.46),
          y + 0.006,
          zz,
          0.036,
          0.013,
          0.036,
          '#716e5a',
          0,
          0,
          0,
          p.bronze,
          false,
        );
      }
  }
  const seg = 14;
  for (const side of [-1, 1]) {
    const xx = x + side * (w - 0.13);
    for (let i = 0; i <= seg; i++) {
      const zz = z - length * 0.5 + (i / seg) * length,
        yy = bridgeHeight(b, zz);
      p.part('box', xx, yy + 0.57, zz, 0.17, 1.19, 0.18, paint);
      if (i % 3 === 0 || i === seg) {
        p.part('finial', xx, yy + 1.125, zz, 0.32, 0.36, 0.32, '#9c987e', 0, 0, 0, p.bronze);
        p.part('box', xx, yy + 1.12, zz, 0.255, 0.065, 0.255, '#655a46', 0, 0, 0, p.wood);
      } else p.part('pyramid', xx, yy + 1.22, zz, 0.16, 0.12, 0.16, '#575d51', PI / 4);
      if (i < seg) {
        const nz = zz + length / seg,
          ny = bridgeHeight(b, nz);
        for (const [height, thick, col] of [
          [1.13, 0.16, paint],
          [0.52, 0.105, paint],
          [-0.4, 0.3, '#71583e'],
        ]) {
          p.link(V(xx, yy + height, zz), V(xx, ny + height, nz), thick, col, true, true, false, p.wood);
        }
      }
      if (!b.maple && (i === 0 || i === seg)) {
        const approach = zz + (i === 0 ? -0.68 : 0.68);
        p.part(
          'rock',
          xx,
          terrainHeight(xx, approach) + 0.15,
          approach,
          0.86,
          0.42,
          0.76,
          '#afb5a6',
          0.23,
          0.08,
          0,
          p.stone,
        );
      }
      if (!b.maple && i % 3 === 1) {
        p.part('box', xx, yy * 0.5 - 0.15, zz, 0.34, yy + 1.6, 0.34, '#685c48', 0, 0, 0, p.wood);
        if (i + 2 <= seg)
          p.link(
            V(xx, yy - 0.46, zz),
            V(xx, yy - 2.0, zz + (length / seg) * 1.22),
            0.16,
            '#756448',
            true,
            true,
            false,
            p.wood,
          );
      }
    }
  }
  if(b.maple){
    const block=(s,color,material)=>p.part('box',s.x,(s.top+s.bottom)/2,s.z,
      s.w,s.top-s.bottom,s.d,color,0,0,0,material);
    for(const s of MAPLE_FOOTINGS.piers){
      block(s,'#685c48',p.wood);
      const knee=min(1.75,(s.top-s.bottom)*.53);
      for(const dir of [-1,1]){
        const endZ=s.z+dir*knee;
        p.link(V(s.x,s.top-knee,s.z),V(s.x,bridgeHeight(b,endZ)-.40,endZ),
          .16,'#756448',true,true,false,p.wood);
      }
    }
    for(const s of MAPLE_FOOTINGS.beams)block(s,'#736047',p.wood);
    for(const s of MAPLE_FOOTINGS.ties)block(s,'#736047',p.wood);
    for(const s of MAPLE_FOOTINGS.abutments)block(s,'#a6a494',p.masonry);
    for(const s of MAPLE_FOOTINGS.endStones)block(s,'#b6b7a8',p.stone);
    for(const s of MAPLE_FOOTINGS.thresholds)for(let j=-1;j<=1;j++){
      block({...s,x:s.x+j*s.w/3,w:s.w/3-.012},j===0?'#bcbba9':'#b2b2a1',p.stone);
    }
  }
}

function building(p, b, index) {
  const { x, z, w, d, wall, roof, yaw, kind, y } = b,
    wood = '#69513b',
    deep = '#554b3e';
  const local = (u, v, s) => V(x + u * cos(yaw) + s * sin(yaw), y + v, z - u * sin(yaw) + s * cos(yaw));
  let modelScale=1,modelDatum=0;
  const part = (shape, u, v, s, sx, sy, sz, color, mat = p.solid, rot = 0) => {
    const v3 = local(u, modelDatum+(v-modelDatum)*modelScale, s);
    sy*=modelScale;
    p.part(shape, v3.x, v3.y, v3.z, sx, sy, sz, color, yaw + rot, 0, 0, mat);
  };
  let foundationBottom = y - 0.32;
  for (const dx of [-1, 0, 1])
    for (const dz of [-1, 0, 1]) {
      const edge = local(dx * (w * 0.5 + 0.73), 0, dz * (d * 0.5 + 0.73));
      foundationBottom = min(foundationBottom, h(edge.x, edge.z) - 0.32);
    }
  const stoneHeight = y + 0.42 - foundationBottom;
  part('box', 0, 0.42 - stoneHeight / 2, 0, w + 1.1, stoneHeight, d + 1.08, '#969484', p.masonry);
  for (let j = 0; j < 3; j++)
    part('box', 0, 0.18 - j * 0.19, d / 2 + 0.48 + j * 0.39, w * 0.48, 0.28, 0.46, '#a4a28a');
  if (kind !== 'pagoda') {
    const form=roofForm(b);
    part(form==='hip'?'hipWalls':'gableWalls',0,wall+.29,0,w*HOUSE_EAVES.width,roof,d*HOUSE_EAVES.depth,
      '#b9ab91',p.boarding);
  }
  if (kind === 'wardShop') { dressWardShop(p,b,part); return; }
  furnishRoom(p, b, index, part, local);
  if (kind === 'pagoda') {
    const tower=pagodaPlan(b);
    for(const s of tower.slabs) {
      const tread=s.kind==='tread';
      part('box',s.u,s.top-s.thickness/2,s.v,s.w,s.thickness,s.d,tread?'#a3774d':'#aa8861',p.boarding);
      if(tread) part('box',s.u,s.top-.018,s.v-Math.sign(s.u)*s.d*.43,s.w,.045,.047,'#d3af78',p.wood);
    }
    for(const panel of tower.panels) {
      modelScale=tower.scale;modelDatum=panel.y;
      const {u,v,width,depth,length,y,front,face}=panel;
      const strip=(lateral,height,out,span,thickness,color,mat)=>{
        part('box',u+(front?lateral:face*out),y+height,v+(front?face*out:lateral),
          front?span:.07,thickness,front?.07:span,color,mat);
      };
      part('box',u,y+.46,v,width,.92,depth,'#ac8960',p.boarding);
      part('box',u,y+1.55,v,width,1.27,depth,'#d7cbb0',p.cityShell?p.lamps.shoji:p.roomArt.paper);
      for(let k=-3;k<=3;k++) strip(k*length*.15,1.56,.086,.036,1.25,'#70604e',p.wood);
      for(const h of [1.16,1.54,1.92]) strip(0,h,.097,length,.046,'#70604e',p.wood);
      for(const h of [.12,.89,2.23])strip(0,h,.09,length,.129,'#7d4b35',p.wood);
      for(const k of [-1,1]) strip(k*length*.48,1.26,0,.115,2.52,'#8a513b',p.lacquer);
      part('box',u,y+2.40,v,width,.32,depth,'#d4c69f',p.fine);
    }
    modelScale=1;
    for(let i=0;i<tower.posts.length;i+=2) {
      const a=tower.posts[i], c=tower.posts[i+1];
      for(const post of [a,c]) part('box',post.u,post.top+.35,post.v,.065,.70,.065,'#694b39',p.wood);
      p.link(local(a.u,a.top+.69,a.v),local(c.u,c.top+.69,c.v),.052,'#88573a',false,true,false,p.lacquer);
    }
    for(const [j,level] of tower.storeys.entries()) {
      modelDatum=level.y;modelScale=tower.scale;
      const {y,w:ww,d:dd}=level, top=j===4, eave=y+2.60;
      const beam='#6f3c2d';
      for(const side of [-1,1]) {
        // Overlapping dougong arms carry the broad tiled eaves at each corner.
        for(const corner of [-1,1]) {
          const u=side*ww*.413, v=corner*dd*.414;
          part('round',u,y+1.26,v,.103,2.52,.103,'#955039',p.lacquer);
          for(let k=0;k<3;k++) {
            part('box',u,eave-.55+k*.16,v,.39+k*.24,.14,.27,beam,p.wood);
            part('box',u,eave-.47+k*.16,v,.24,.13,.42+k*.28,'#ac6c48',p.wood);
          }
          const q=local(side*ww*.648,y+2.82*modelScale,corner*dd*.648);
          p.part('finial',q.x,q.y,q.z,.14,.29,.14,'#a7976c',0,0,0,p.bronze);
        }
        part('box',side*ww*.42,eave-.12,0,.21,.22,dd*.94,beam,p.wood);
        part('box',0,eave-.12,side*dd*.42,ww*.94,.22,.21,beam,p.wood);
        if(j) {
          for(const lift of [.24,.67]) {
            part('box',side*ww*.48,y+lift,0,.09,.095,dd*.98,'#93513a',p.lacquer);
            part('box',0,y+lift,side*dd*.48,ww*.98,.095,.09,'#93513a',p.lacquer);
          }
          for(let n=-3;n<=3;n++){
            part('box',side*ww*.48,y+.38,n*dd*.157,.081,.76,.082,deep,p.wood);
            part('box',n*ww*.157,y+.38,side*dd*.48,.081,.76,.082,deep,p.wood);
          }
        }
      }
      part('box',0,y+2.66,0,.19,.11,1.90,beam,p.wood);
      // A tall Kyoto first storey has a timber frieze over the entrance.
      // The closed drum follows the eave up to the next gallery.
      const r=level.roof, bottom=(level.wallTop-y)/tower.scale, band=2.60-bottom;
      for(const side of [-1,1]){
        part('box',side*r.wallWidth/2,y+bottom+band/2,0,.14,band,r.wallDepth+.14,'#dfd4b9',p.workshopArt.clay);
        part('box',0,y+bottom+band/2,side*r.wallDepth/2,r.wallWidth+.14,band,.14,'#dfd4b9',p.workshopArt.clay);
        for(const height of [bottom,2.60]){
          part('box',side*r.wallWidth/2,y+height,0,.21,.12,r.wallDepth+.20,beam,p.wood);
          part('box',0,y+height,side*r.wallDepth/2,r.wallWidth+.20,.12,.21,beam,p.wood);
        }
        if(band>.65){
          const mid=y+bottom+band*.46;
          part('box',side*r.wallWidth/2,mid,0,.19,.085,r.wallDepth+.16,beam,p.wood);
          part('box',0,mid,side*r.wallDepth/2,r.wallWidth+.16,.085,.19,beam,p.wood);
        }
        if(band>.65) for(let k=-2;k<=2;k++){
          part('box',side*r.wallWidth/2,y+bottom+band/2,r.wallDepth*k*.245,.18,band,.10,beam,p.wood);
          part('box',r.wallWidth*k*.245,y+bottom+band/2,side*r.wallDepth/2,.10,band,.18,beam,p.wood);
        }
      }
      part(top?'pagodaCrownWalls':j?'pagodaWalls':'pagodaFootWalls',0,eave,0,r.width,r.rise/tower.scale,r.depth,
        '#c7b79a',p.workshopArt.clay);
      part(top?'pagodaCrown':'pagodaRoof',0,eave,0,r.width,r.rise/tower.scale,r.depth,
        b.snow?'#e6f0ef':'#7b8079',b.snow?winterPagodaRoof(p):p.roofs);
    }
    const apex=tower.storeys[4].y+4.64;
    part('round',0,apex+1.61,0,.088,3.38,.088,'#565747',p.bronze);
    for(let j=0;j<9;j++) part('round',0,apex+.26+j*.28,0,.49-j*.035,.083,.49-j*.035,'#9a885c',p.bronze);
    part('finial',0,apex+3.19,0,.41,.72,.41,'#9d8c5f',p.bronze);
    return;
  }
  const plan = roomPlan(b), hip = roofForm(b) === 'hip';
  const tiled = ['ink','dye','brew'].includes(plan.craft);
  const fascia = tiled ? '#4d5651' : '#786950';
  part('box', 0, wall + 0.23, 0, w * 1.08, 0.26, d * 1.08, deep);
  part(
    hip ? 'hipRoof' : 'roof',
    0,
    wall + 0.29,
    0,
    w * 1.24,
    roof,
    d * 1.28,
    b.snow ? '#e5eef4' : tiled ? '#89918c' : '#d1bb94',
    b.snow ? p.solid : tiled ? p.roofs : p.thatch,
  );
  part('box', 0, wall + roof + 0.35, 0, w * (hip ? .59 : 1.05), 0.23, hip ? .39 : .28, tiled ? '#59645d' : '#8a7251', p.wood);
  if (b.snow) {
    part('box', 0, wall + roof + 0.51, 0, w * (hip ? .60 : 1.075), 0.16, 0.35, '#eff5fc');
    for (const side of [-1, 1])
      for (let j = -5; j <= 5; j++) {
        const u = j * w * 0.111;
        part('ball', u, wall + 0.31 + 0.17 * (j / 5) ** 4, side * d * 0.62,
          w * 0.078, 0.13 + 0.05 * cos(j * 4), 0.17, '#e1edf6');
      }
  }
  // Timber trusses remain visible under the deep eaves. Tile drip-ends and
  // straw lashings follow the actual pitch of each roof.
  for (const side of [-1, 1]) {
    for (let j = -4; j <= 4; j++) {
      const u = j * w * 0.103,
        yy = wall + 0.3;
      const start = local(u, yy - 0.055, side * d * 0.5),
        end = local(u, yy - 0.15 + 0.08 * (j / 4) ** 4, side * d * 0.621);
      p.link(start, end, 0.11, '#76654d', true, true, false, p.wood);
      if (tiled) {
        for (const extra of [-0.026, 0.026]) {
          const q = local(u + extra * w, yy + 0.063 + 0.07 * (j / 4) ** 4, side * d * 0.629);
          p.part('round', q.x, q.y, q.z, .091, .23, .091, '#758078', yaw, PI*.5*side, 0, p.fine);
          const end=local(u+extra*w,yy+.063+.07*(j/4)**4,side*(d*.629+.117));
          p.part('tileEnd',end.x,end.y,end.z,.089,.089,1,'#ede9dd',yaw+(side<0?PI:0),0,0,p.workshopArt.tileEnd,false);
        }
      }
    }
    if (hip) continue;
    // Braced gable and vent on either end of the building.
    const e = side * w * 0.504,
      look = local(e, wall + roof * 0.4 + 0.13, 0);
    p.part('box', look.x, look.y, look.z, 0.12, roof * 0.33, d * 0.3, '#62614d', yaw, 0, 0, p.boarding);
    for (let j = -2; j <= 2; j++)
      part('box', e, wall + roof * 0.39 + 0.14, j * d * 0.052, 0.15, roof * 0.32, 0.052, '#a68d64', p.wood);
    for (const sgn of [-1, 1]) {
      p.link(
        local(e, wall + 0.24, sgn * d * 0.49),
        local(e, wall + roof * 0.86, 0),
        0.13,
        '#8b7859',
        true,
        true,
        false,
        p.wood,
      );
    }
  }
  if (!tiled) {
    for (let j = -2; j <= 2; j++) {
      const u = j * w * (hip ? .114 : .18);
      p.link(
        local(u, wall + roof * 0.97 + 0.24, -d * 0.035),
        local(u + 0.2, wall + roof + 0.64, d * 0.066),
        0.065,
        '#78664b',
        false,
        true,
        false,
        p.wood,
      );
      p.link(
        local(u + 0.15, wall + roof * 0.97 + 0.24, d * 0.035),
        local(u - 0.09, wall + roof + 0.64, -d * 0.073),
        0.065,
        '#78664b',
        false,
        true,
        false,
        p.wood,
      );
    }
  }
  for (const sg of [-1, 1]) {
    const mid = sg * (w + plan.door) / 4, panel = (w-plan.door)/2,
      zw = d * 0.512;
    part('box', mid, wall * 0.52 + 0.25, zw, panel * .79, wall * 0.46, 0.11, '#adab87');
    for (let j = -1; j <= 1; j++)
      part('box', mid + j * panel * .19, wall * 0.52 + 0.25, zw + 0.065, 0.065, wall * 0.48, 0.08, deep);
    part('box', mid, wall * 0.52 + 0.25, zw + 0.071, panel * .85, 0.079, 0.09, wood);
  }

  tradeFacade(p,b,plan,part);
  // Plastered firebreaks rise beyond the eaves of the tile-roofed storehouses.
  // The writing halls instead turn a second gable toward the front veranda.
  if (plan.craft === 'brew') {
    for (const side of [-1,1]) {
      const xx=side*w*.485;
      for(const front of [-1,1]) {
        const zz=front*d*.50;
        part('box',xx,wall+.53,zz,.24,.99,.83,'#efe5d0',p.workshopArt.clay);
        part('roof',xx,wall+.97,zz,.48,.20,1.05,fascia,p.roofs);
      }
    }
  } else if (plan.porch) {
    const {v:porch, rise:pitch, width, depth, eave, rotation}=plan.porch;
    part('roof',0,eave,porch,width,pitch,depth,fascia,p.roofs,rotation);
    part('box',0,wall*.78,porch+.23*d,w*.48,.12,.11,deep,p.wood);
    for(const sg of [-1,1]) {
      const xx=sg*w*.207;
      part('box',xx,wall*.395+.15,porch+.19*d,.15,wall*.75-.27,.16,wood,p.wood);
      p.link(local(xx,wall*.78,porch+.20*d),local(0,wall*.78+pitch*.84,porch+.20*d),
        .09,'#b1956b',true,true,false,p.wood);
    }
  }
  if (plan.monitor) {
    // A louvred koshi-yane vents steam from the tea hearth or drying loft.
    const {u,v,width,depth,eave,rise}=plan.monitor;
    const base=wall+roof+.16, height=eave-base;
    part('box',u,base+height*.5,v,width*.85,height,depth*.66,'#564e3c',p.boarding);
    for(const side of [-1,1]) {
      for(let j=0;j<3;j++)part('box',u,base+(j+.45)*height/3,v+side*depth*.341,
        width*.86,.035,.063,'#aa9170',p.wood);
      for(const end of [-1,1])part('box',u+end*width*.41,base+height*.5,v+side*depth*.34,
        .075,height+.05,.086,'#80674d',p.wood);
    }
    part('roof',u,eave,v,width,rise,depth,b.snow?'#e5eef4':'#7d8276',b.snow?p.solid:p.roofs);
    part('box',u,eave+rise+.014,v,width*.86,.083,.10,'#636b5f',p.wood);
  }
  if (kind === 'shop' || kind === 'inn' || kind === 'temple') {
    // The raised engawa has individual cedar boards and an open fascia.
    const deckWidth = w * 0.78,
      depth = 0.76;
    for (let j = 0; j < 12; j++)
      part(
        'box',
        -deckWidth * 0.5 + ((j + 0.5) * deckWidth) / 12,
        0.45,
        d * 0.5 + depth * 0.5,
        deckWidth / 12 - 0.012,
        0.112,
        depth,
        '#aa9370',
        p.deck,
      );
    part('box', 0, 0.33, d * 0.5 + depth * 0.91, deckWidth, 0.12, 0.14, '#796547', p.wood);
    for (const side of [-1, 1]) {
      part('box', side * w * 0.415, wall * 0.46, d * 0.56, 0.11, wall * 0.91, 0.11, '#927955', p.wood);
      const q = local(side * w * 0.35, wall * 0.85, d * 0.527);
      p.part('round', q.x, q.y, q.z, 0.1, w * 0.185, 0.1, '#bcac7f', yaw, 0, PI * 0.5, p.wood);
    }
    const tint = kind === 'temple' ? '#8c4131' : index % 3 ? '#576d6a' : '#9d5041';
    noren(p,part,w,wall,d,kind,index);
    part('box',0,wall*.78,d*.546,w*.104,.74,.049,tint,p.fine);
    const q = local(0, wall * 0.78, d * 0.554);
    p.part(
      'plane',
      q.x,
      q.y,
      q.z,
      0.49,
      0.65,
      1,
      '#fff',
      yaw,
      0,
      0,
      p.signs[{brew:'酒',dye:'染',ink:'書',rice:'米',tea:'茶',net:'網',lodge:'湯'}[plan.craft]],
    );
    for (const side of [-1, 1]) {
      const a = local(side * w * 0.34, wall * 0.75, d * 0.583);
      p.part('ball', a.x, a.y, a.z, 0.31, 0.42, 0.31, index % 2 ? '#b86d48' : '#d6b37f');
      part('round', side * w * 0.34, wall * 0.75 + 0.34, d * 0.583, 0.2, 0.09, 0.2, '#514e40');
      part('round', side * w * 0.34, wall * 0.75 - 0.34, d * 0.583, 0.19, 0.08, 0.19, '#514e40');
    }
  }
}
function paddies(p) {
  const r = seeded(352);
  for (let i = 0; i < 24; i++) {
    const col = i % 6,
      row = Math.floor(i / 6),
      x = 105 + col * 16.2 + sin(row) * 4,
      z = 123 + row * 12.8;
    if (BUILDINGS.some((b) => Math.hypot(x - b.x, z - b.z) < 12) || nearRoad(x, z, 3)) continue;
    const y = h(x, z),
      sx = 13.6,
      sz = 10.8;
    p.part('box', x, y - 0.22, z, sx, 0.8, sz, '#a29e64');
    p.part('box', x, y + 0.205, z, sx - 0.68, 0.07, sz - 0.68, row % 2 ? '#b4ac6a' : '#9cae83');
    for (let j = 0; j < 6; j++)
      for (let k = 0; k < 7; k++) {
        const xx = x + (k - 3) * 1.58 + (r() - 0.5) * 0.28,
          zz = z + (j - 2.5) * 1.52;
        p.part(
          'leaf',
          xx,
          y + 0.19,
          zz,
          0.75,
          0.5 + r() * 0.32,
          0.64,
          row % 3 ? '#9b9b4c' : '#839259',
          r() * 3,
          0,
          0.12,
          p.stems,
          false,
          true,
        );
      }
  }
}
function details(p) {
  const r = seeded(27158);
  dressOutcrops(p,ROCKS,h);
  for (const rock of ROCKS) {
    if(rock.stratum!==undefined)continue;
    const y = h(rock.x, rock.z);
    p.part(
      'rock',
      rock.x,
      y + rock.h * 0.37,
      rock.z,
      rock.rx * 1.12,
      rock.h * 0.74,
      rock.rz * 1.16,
      '#8c9081',
      0.53,
    );
    p.part(
      'rock',
      rock.x + 0.11,
      y + rock.h * 0.92,
      rock.z,
      rock.rx * 0.86,
      0.13,
      rock.rz * 0.81,
      '#9eac79',
      0.33,
    );
  }
  for (let i = 0; i < 510; i++) {
    const x = r() * 488 - 244,
      z = riverZ(x) + (r() > 0.5 ? 1 : -1) * (riverHalfWidth(x) + r() * 5 - 1),
      y = h(x, z);
    if (abs(x) < 16 || BRIDGES.some((b) => abs(x - b.x) < b.halfWidth + 1.4)) continue;
    const s = 0.19 + r() ** 2 * 1.1;
    p.part(
      'rock',
      x,
      y - s * .12,
      z,
      s * 1.33,
      s * 0.67,
      s,
      '#9ba18b',
      r() * TAU,
      0.22,
      r() * 0.25,
      p.solid,
      false,
      true,
    );
  }
  dressRoadGravel(p, r);
}

// Dirt lanes meet and sometimes continue underneath the paved avenues.
// Test the stone's footprint against every paved strip at those crossings.
const pavedStrips = ROADS.filter(road => road.paved).flatMap(road =>
  road.points.slice(1).map(([endX, endZ], i) => {
    const [x, z] = road.points[i];
    const length = Math.hypot(endX - x, endZ - z);
    return { x, z, dx: (endX - x) / length, dz: (endZ - z) / length, length, half: road.width / 2 };
  }));
function touchesPaving(x, z, radius) {
  if (masonryFootprints.some(b => abs(x - b.x) <= b.z + radius && abs(z - b.y) <= b.w + radius)) return true;
  return pavedStrips.some(s => {
    const u = x - s.x, v = z - s.z;
    const along = u * s.dx + v * s.dz, across = u * s.dz - v * s.dx;
    return along >= -radius && along <= s.length + radius && abs(across) <= s.half + radius;
  });
}
// Existing lanes share a seeded print. Reserve the six draws per dry stone
// from the old street surveys, then give each rerouted lane its own print.
const formerGravelSites=new Map([
  ['snow-avenue',30],['snow-bath-lane',10],['capital-road',81],
  ['lakeside-approach',0],['inland-road',0],
]);
export function dressRoadGravel(p, originalRoll) {
  for (const road of ROADS) {
    let r=originalRoll;
    if(formerGravelSites.has(road.id)){
      for(let draws=formerGravelSites.get(road.id)*6;draws>0;draws--)originalRoll();
      const [x,z]=road.points[0];
      r=seeded(Math.round(x*823+z*163));
    }
    for (let i = 2; i < road.points.length; i += 4) {
      const [x, z] = road.points[i],
        q = road.points[i - 1],
        len = Math.hypot(x - q[0], z - q[1]) || 1;
      const across = (r() > 0.5 ? 1 : -1) * road.width * (0.34 + r() * 0.2);
      const xx = x + ((z - q[1]) / len) * across,
        zz = z - ((x - q[0]) / len) * across;
      if (h(xx, zz) < WATER_Y + 0.2 || abs(zz - riverZ(xx)) < riverHalfWidth(xx) + 1) continue;
      // Draw the whole stone first to keep the original gravel sequence on other trails.
      const sx = 0.14 + r() * 0.21, sy = 0.06 + r() * 0.07, sz = 0.12 + r() * 0.15;
      const yaw = r() * TAU;
      if (touchesPaving(xx, zz, 1.2 * max(sx, sz))) continue;
      p.part(
        'rock',
        xx,
        h(xx, zz) + 0.04,
        zz,
        sx, sy, sz,
        '#a6a18e',
        yaw,
        0.12,
        -0.08,
        p.stone,
        false,
        true,
      );
    }
  }
}
function wayMarker(p, x, z, glyph, angle = 0) {
  const y = h(x, z);
  p.part('box', x, y + 1.18, z, 0.13, 2.45, 0.14, '#685941', angle);
  p.part('box', x, y + 1.8, z, 0.64, 0.87, 0.15, '#846a49', angle);
  p.part(
    'plane',
    x + 0.09 * sin(angle),
    y + 1.8,
    z + 0.09 * cos(angle),
    0.57,
    0.79,
    1,
    '#fff',
    angle,
    0,
    0,
    p.signs[glyph],
  );
}
function roadsideInscriptions(p) {
  function sign(road,i) {
    const mark=road.points[i], before=road.points[i-1], after=road.points[i+1];
    const angle=Math.atan2(after[0]-before[0],after[1]-before[1]);
    const verge=road.width*.5+1.25;
    const x=mark[0]+cos(angle)*verge, z=mark[1]-sin(angle)*verge, y=h(x,z);
    p.part('rock',x,y+.08,z,.48,.23,.45,'#898777');
    p.part('box',x,y+1.12,z,.12,2.31,.14,'#68583e',angle,0,0,p.wood);
    p.part('box',x,y+1.73,z,2.13,.73,.13,'#735d42',angle,0,0,p.wood);
    for(const [face,label] of [[angle+PI,road.destination],[angle,road.origin]]) {
      const writing=canvasTexture(352,112,(c,w,h)=>{
        c.fillStyle='#dbc69c';c.fillRect(0,0,w,h);
        c.lineWidth=2;c.strokeStyle='#927a51';c.strokeRect(5,5,w-10,h-10);
        c.font='bold 51px "Hiragino Mincho ProN","Yu Mincho",serif';
        c.fillStyle='#443d32';c.textBaseline='middle';c.textAlign='center';
        c.fillText(label+'へ',w*.49,h*.53,w*.85);
        c.fillStyle='#a55b40';c.fillRect(w*.92,h*.67,9,11);
      });
      const ink=new THREE.MeshLambertMaterial({map:writing});
      p.part('plane',x+.073*sin(face),y+1.73,z+.073*cos(face),2.07,.666,1,'#fff',face,0,0,ink,false);
    }
  }
  for (const road of CONNECTING_ROADS) {
    sign(road,6);
    if(road.id==='capital-road'){
      // Travellers coming out of Kyoto see the name of the snowy street on
      // the near face at the fork; the reverse directs arrivals to the city.
      const [u,v]=SNOW_PASS.at(-1);
      const fork=road.points.findIndex(([x,z])=>x===u && z===v);
      if(fork>0 && fork<road.points.length-1)sign(road,fork);
    }
  }
}
function hillsideStairs(p) {
  for (const gate of GATES) {
    for (const dir of [-1, 1]) {
      const foot=gateFooting(gate,dir,true);
      lantern(p,foot.x,foot.z,gate===GATES[0]?1.16:1,foot);
    }
  }
  for (const b of BRIDGES)
    for (const sign of [-1, 1]) lantern(p, b.x + sign * (b.halfWidth + 0.94), b.z + b.length * 0.5 + 0.48, 0.91);
  for (const [x, z, g, angle] of [
    [-4.95, 61.65, '桜川', 0.19],
    [11, -39, '市', 0.4],
    [139, -100, '湯', -0.16],
    [-147, -75, '社', 0.12],
  ])
    wayMarker(p, x, z, g, angle);
}
function stampStations(p) {
  const plaque = canvasTexture(256, 138, (c, w, h) => {
    c.fillStyle = '#e6d5aa';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#8e7753';
    c.lineWidth = 4;
    c.strokeRect(5, 6, w - 10, h - 12);
    c.font = 'bold 50px "Hiragino Mincho ProN","Yu Mincho",serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#493e31';
    c.fillText('御朱印', 104, 69);
    c.save();
    c.translate(211, 75);
    c.rotate(-0.09);
    c.fillStyle = '#a34531';
    c.fillRect(-18, -20, 36, 40);
    c.strokeStyle = '#eedebb';
    c.lineWidth = 1.15;
    c.strokeRect(-15.1, -17, 30, 34);
    c.font = '23px serif';
    c.fillStyle = '#efe0bf';
    c.fillText('印', 0, 1);
    c.restore();
  });
  const mat = new THREE.MeshLambertMaterial({ map: plaque, side: THREE.DoubleSide });
  REGIONS.forEach((r, i) => {
    const x = r.x - (i === 0 ? 4.15 : 3.65),
      z = r.z + (r.id === 'dawn' ? 7 : i === 0 ? -0.3 : 1),
      y = h(x, z),
      yaw = r.id === 'dawn' ? -2.1 : i === 0 ? 0.2 : 0;
    const local = (u, v, s) => V(x + u * cos(yaw) + s * sin(yaw), y + v, z - u * sin(yaw) + s * cos(yaw));
    const part = (shape, u, v, s, sx, sy, sz, color, m = p.wood, rot = 0) => {
      const a = local(u, v, s);
      p.part(shape, a.x, a.y, a.z, sx, sy, sz, color, yaw + rot, 0, 0, m);
    };
    for (const dx of [-0.54, 0.54]) {
      part('box', dx, 0.48, 0, 0.11, 1.06, 0.17, '#70553b');
      part('box', dx, 0.29, -0.22, 0.11, 1, 0.1, '#745e44');
      part('box', dx, 0.94, -0.24, 0.085, 1.5, 0.085, '#775b40');
    }
    part('box', 0, 0.76, 0, 1.36, 0.13, 0.7, '#90724f');
    part('box', 0, 1.25, -0.205, 1.12, 0.6, 0.07, '#6d5940');
    part('plane', 0, 1.25, -0.163, 1.045, 0.53, 1, '#ffffff', mat);
    part('roof', 0, 1.62, -0.15, 1.5, 0.265, 0.81, '#676e61', p.roofs);
    part('box', -0.18, 0.837, 0.08, 0.38, 0.03, 0.3, '#ebdcbe', p.solid, -0.13);
    part('box', 0.27, 0.85, 0.075, 0.2, 0.054, 0.18, '#9c4a37');
    part('round', 0.29, 0.92, 0.079, 0.056, 0.078, 0.056, '#70513a');
    part('box', -0.39, 0.875, 0.16, 0.16, 0.045, 0.1, '#545344');
  });
}

function driftingLeaves(scene) {
  const vertices = [0, 0, 0];
  const shape = [
    [-0.02, 0.63],
    [0.1, 0.28],
    [0.26, 0.41],
    [0.22, 0.15],
    [0.49, 0.23],
    [0.33, -0.03],
    [0.5, -0.11],
    [0.13, -0.18],
    [0.04, -0.37],
    [-0.01, -0.22],
    [-0.27, -0.26],
    [-0.21, -0.11],
    [-0.48, -0.07],
    [-0.3, 0.06],
    [-0.46, 0.25],
    [-0.18, 0.16],
    [-0.19, 0.4],
    [-0.07, 0.27],
  ];
  const indices = [];
  shape.forEach(([x, y], i) => {
    vertices.push(x, y, 0.07 * sin(i * 2.1));
    indices.push(0, i + 1, ((i + 1) % shape.length) + 1);
  });
  const leaves = new THREE.InstancedMesh(
    geometry(vertices, indices),
    new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }),
    16,
  );
  leaves.frustumCulled = false;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(leaves);
  const d = new THREE.Object3D(),
    maple = TREES.filter((t) => t.kind === 'maple'),
    palette = ['#b45c3c', '#a94b36', '#cc7b49', '#c37a4b'];
  palette.forEach((_, i) => {
    for (let k = i; k < 16; k += 4) leaves.setColorAt(k, css(palette[i]));
  });
  let grove = [],
    lastX = Infinity,
    lastZ = Infinity;
  return (time, player) => {
    if (abs(player.x - lastX) + abs(player.z - lastZ) > 7) {
      lastX = player.x;
      lastZ = player.z;
      grove = maple.filter((t) => (t.x - lastX) ** 2 + (t.z - lastZ) ** 2 < 36 ** 2).slice(0, 4);
    }
    leaves.count = grove.length * 4;
    grove.forEach((tree, j) => {
      const y = h(tree.x, tree.z);
      for (let k = 0; k < 4; k++) {
        const id = j * 4 + k;
        const phase = (time * (0.101 + k * 0.0083) + (tree.seed % 19) * 0.061 + k * 0.267) % 1;
        const a = 1.7 * k + tree.seed * 0.09,
          spin = phase * TAU * 1.4 + a;
        d.position.set(
          tree.x + cos(a) * tree.h * 0.2 + phase * 2.7 + sin(spin) * 0.53,
          y + 0.09 + tree.h * (0.68 + k * 0.044) * (1 - phase),
          tree.z + sin(a) * tree.h * 0.23 + phase * 0.78 + sin(spin * 1.3) * 0.43,
        );
        d.rotation.set(0.25 + sin(spin) * 0.67, spin * 1.2, 0.39 + cos(spin * 1.6) * 0.7);
        const s = (0.106 + k * 0.016) * min(1, phase * 13, (1 - phase) * 13);
        d.scale.setScalar(s);
        d.updateMatrix();
        leaves.setMatrixAt(id, d.matrix);
      }
    });
    leaves.instanceMatrix.needsUpdate = true;
  };
}

function createWaysideHuts(scene) {
  const models=new Map();
  return player=>{
    for(const s of WAYSIDE_SITES){
      const dx=wrapDelta(s.x-player.x),dz=wrapDelta(s.z-player.z);
      let root=models.get(s);
      if(dx*dx+dz*dz>190**2){if(root)root.visible=false;continue;}
      if(!root){
        if(s.kind==='chaya')root=buildDangoChaya(s.variant,s.dye);
        else{
          root=buildWaysideHut(s.kind,s.variant,s.bank);
          if(s.bath){
            const bath=buildGoemonBath(s.variant,s.kind,s.bank);
            bath.position.set(BATH_YARD[0],0,BATH_YARD[1]);
            root.add(bath);
          }
        }
        root.rotation.y=s.yaw;root.position.y=h(s.x,s.z);
        models.set(s,root);scene.add(root);
      }
      root.visible=true;
      root.position.x=player.x+dx;root.position.z=player.z+dz;
    }
  };
}

export function* prepareWorld(scene) {
  const atmosphere = createAtmosphere(scene);
  const paper = grain(),
    art = loadPigments();
  const landGroup = new THREE.Group();
  scene.add(landGroup);
  yield* landscape(landGroup, art);
  buildRoads(landGroup, art);
  const water = makeWater(scene, art, atmosphere.panorama, atmosphere.winterWash);
  const painter = new Painter(landGroup, paper, art);
  painter.lamps=createLampCollection(painter);
  yield;
  for (const [i, g] of GATES.entries()) gate(painter, g, i);
  for (const b of BRIDGES) bridge(painter, b);
  for (const [i, b] of BUILDINGS.entries()) {
    painter.cityShell=inCapitalWard(b.x,b.z);
    building(painter, b, i);
    painter.lamps.house(b);
    yield;
  }
  painter.cityShell=false;
  paddies(painter);
  hillsideStairs(painter);
  roadsideInscriptions(painter);
  stampStations(painter);
  details(painter);
  yield;
  yield* woodland(painter, art);
  const updateForest = yield* prepareForest(scene, painter.sway);
  plantUnderstory(painter, art);
  yield;
  dressPlaces(painter);
  yield;
  dressSeasonalPlaces(painter);
  yield;
  painter.cityShell=true;
  const updateCourt=dressCourt(painter,scene);
  painter.cityShell=false;
  dressWaysideBaths(painter,art.gravel);
  dressSeaports(painter);
  yield;
  const updateKyo=createKyo(scene,painter);
  const updateKiyomizu=createKiyomizu(scene,painter);
  yield;
  yield* dressPilgrimage(painter);
  dressRyugu(painter);
  yield;
  const updateWaterfalls=createMountainWaterfalls(scene);
  const updateLake=createLakeShore(scene,art);
  const updateShrines=pilgrimageLife(scene), updatePalace=createRyuguLife(scene);
  const updateTrade=createTravellers(scene), updateOcean=createOceanShips(scene), updateHuts=createWaysideHuts(scene);
  const updateBathTableaux=createBathTableaux(scene);
  const updateLamps=painter.lamps.finish(scene,landGroup);
  yield* painter.finish();
  // Each spatial batch lives in its nearest image of the repeating island.
  // Perspective and populated shorelines are preserved on crossing the ocean.
  const close = new Set(painter.closeDetails);
  const batches = landGroup.children.map(mesh => {
    if (mesh.isInstancedMesh) mesh.computeBoundingSphere();
    else if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    const bounds = mesh.isInstancedMesh ? mesh.boundingSphere : mesh.geometry.boundingSphere;
    return {mesh, x:bounds.center.x, z:bounds.center.z, radius:bounds.radius, range:close.has(mesh)?94:(mesh.userData.range||328)};
  });
  const powder = seasonalWeather(scene), festival=createMochiPounding(scene);
  yield;
  festival.root.position.set(POUNDING.x,h(POUNDING.x,POUNDING.z)+.012,POUNDING.z);
  festival.root.rotation.y=POUNDING.yaw;
  water.uniforms.climate=atmosphere.climate;
  const leaves = driftingLeaves(scene);
  return {
    textures: [...Object.values(art), atmosphere.panorama, atmosphere.winterWash],
    update(time, player, camera, voyageTime=time, bellStrike=null, inariWeather=null) {
      water.update(time,player);
      painter.sway.value = time;
      if (camera) {
        const valleyView=atmosphere.update(time, player, camera);
        updateKyo(time,player,camera);
        updateKiyomizu(voyageTime,player,bellStrike);
        updateLamps(time,player);
        updateCourt(time,player);
        updateShrines(time,player,camera,inariWeather);
        updateTrade(time,player,camera);
        updateHuts(player);
        updateBathTableaux(player);
        updateWaterfalls(time,player,camera);
        updateLake(time,player);
        updateOcean(voyageTime,player);
        updatePalace(time,player,camera,voyageTime);
        updateForest(camera, player);
        for (const b of batches) {
          const dx=wrapDelta(b.x-camera.position.x), dz=wrapDelta(b.z-camera.position.z);
          b.mesh.position.x=Math.round((camera.position.x+dx-b.x)/(2*BOUND))*2*BOUND;
          b.mesh.position.z=Math.round((camera.position.z+dz-b.z)/(2*BOUND))*2*BOUND;
          const squared=dx*dx+dz*dz;
          const data=b.mesh.userData,skyline=data.skylineGeometry && valleyView>.015;
          const range=skyline?b.range+(1350-b.range)*Math.min(1,valleyView*3):b.range;
          b.mesh.visible=squared<(range+b.radius)**2;
          if(data.nearGeometry){
            if(skyline && squared>(385+b.radius)**2)b.mesh.geometry=data.skylineGeometry;
            else b.mesh.geometry=data.farGeometry && squared>(73+b.radius)**2?data.farGeometry:data.nearGeometry;
          }
          if(data.foliageCount) b.mesh.count=squared>(105+b.radius)**2?Math.ceil(data.foliageCount*.40):data.foliageCount;
        }
        powder(time,camera,atmosphere.climate.value.x);
      }
      festival.root.visible=(player.x-POUNDING.x)**2+(player.z-POUNDING.z)**2<105**2;
      if (festival.root.visible) festival.update(time);
      leaves(time, player);
    },
  };
}

export function createWorld(scene) {
  const steps = prepareWorld(scene);
  let result;
  do { result = steps.next(); } while (!result.done);
  return result.value;
}
