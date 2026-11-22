import { KYO_HILL_SHEET } from './higashiyama.js';
import { PEACH_RANGE_BOUNDS } from './peach-range.js';
import { PEACH_BOUT } from './scroll-encounters.js';
import { groundPrintGLSL } from './ground-print.js';
import { groundImpressions } from './scroll-paper.js';
import * as THREE from './vendor/three.module.min.js';

const asset = (name) => new URL('./assets/world/' + name + '.webp', import.meta.url).href;
const paint = (color) => new THREE.Color(color);

export function loadPigments() {
  const loader = new THREE.TextureLoader();
  const read = (name, repeat = true) => {
    const tex = loader.load(asset(name));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 6;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };
  return {
    turf: read('turf'),
    fieldInk: read('field-ink', false),
    forest: read('forest-floor'),
    gravel: read('stream-stones'),
    trail: read('trail'),
    bark: read('pine-bark'),
    rock: read('granite'),
    cedar: read('cedar'),
    tile: read('kawara'),
    herbs: read('wayside-herbs', false),
    hillPainting: read('kyo-hills',false),
  };
}

export function meadowMaterial(art) {
  const mat = new THREE.MeshLambertMaterial({ map: art.turf, vertexColors: true });
  const impressions=groundImpressions();
  const {west,east,north,south}=PEACH_RANGE_BOUNDS;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.fieldInk = { value: art.fieldInk };
    shader.uniforms.impressions = { value: impressions };
    shader.uniforms.hillPainting = { value:art.hillPainting };
    shader.uniforms.woodFloor = { value: art.forest };
    shader.uniforms.bankStones = { value: art.gravel };
    shader.vertexShader =
      'attribute float ridgeRelief; varying float vRidge; attribute float scrollAmount; varying float vScroll; varying vec3 inkPoint; attribute vec2 terrainMix; attribute vec4 seasons; varying vec4 vSeasons; varying float incline; varying vec2 vTerrainMix;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRidge=ridgeRelief; vScroll=scrollAmount; inkPoint=position; vTerrainMix = terrainMix; vSeasons = seasons; incline=1.-abs(normal.y);');
    shader.fragmentShader =
      groundPrintGLSL + 'uniform sampler2D fieldInk, woodFloor, bankStones, impressions, hillPainting; varying float vRidge; varying float vScroll; varying vec3 inkPoint; varying vec2 vTerrainMix; varying vec4 vSeasons; varying float incline;\n' +
      shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec2 field=inkPoint.xz, plot=vMapUv;
        Impressions stamps=groundPrint(plot);
        vec2 dx=dFdx(plot), dy=dFdy(plot);
        float wash=.68*groundWash(field*.039)+.32*groundWash(field*.112+17.2);
        vec3 strokes=readGround(fieldInk,stamps,dx,dy,1.);
        // The drawing's paper supplies the lightest tone. The dilute tide
        // marks and the nearly black tips of a stroke carry different weights.
        float brush=clamp((.83-strokes.r)*1.35,0.,1.);
        float woodland=smoothstep(.08,.89,vTerrainMix.x+.46*(wash-.5));
        float bank=smoothstep(.03,.94,vTerrainMix.y+.31*(wash-.5));
        vec3 blades=readGround(map,stamps,dx,dy,2.35);
        vec3 understory=blades, shingle=blades;
        if(woodland>.001) understory=readGround(woodFloor,stamps,dx,dy,1.85);
        if(bank>.001 || vSeasons.y*incline>.015)
          shingle=readGround(bankStones,stamps,dx,dy,1.72);
        vec3 pigment=mix(mix(blades,understory,woodland),shingle,bank);
        float luma=dot(pigment,vec3(.27,.59,.14));
        pigment=mix(vec3(luma*.93,luma*1.05,luma*1.04),pigment,.63);
        vec3 ground=pigment*vec3(.99,1.10,1.19)+vec3(.020,.029,.031);
        vec3 openPaper=mix(vec3(.61,.56,.398),vec3(.295,.344,.211),wash);
        vec3 duff=mix(vec3(.35,.289,.195),vec3(.214,.240,.153),wash);
        ground=mix(ground,mix(openPaper,duff,woodland)*(.80+.52*luma),.57-.28*bank);
        vec3 loam=mix(vec3(.20,.096,.048),vec3(.48,.28,.107),clamp(luma*2.4,0.,1.));
        float litter=smoothstep(.14,.45,luma+.22*(wash-.5));
        ground=mix(ground,loam,vSeasons.y*(.36+.54*litter));
        vec3 scree=shingle*.8+vec3(.055,.053,.045);
        ground=mix(ground,scree,vSeasons.y*smoothstep(.12,.52,incline)*.92);
        ground=mix(ground,vec3(.52,.40,.25)*(.74+.54*shingle.r+.18*wash),vSeasons.w);
        ground=mix(ground,vec3(.25,.27,.148)*(.56+1.7*luma),vSeasons.z*.65);
        float snowCover=smoothstep(.035,.96,vSeasons.x+(luma-.24)*.20);
        vec3 snow=mix(vec3(.65,.77,.85),vec3(.94,.96,.98),wash*.47+clamp(luma,0.,.53));
        ground=mix(ground,snow,snowCover);
        vec3 mark=vec3(0.);
        if(vScroll>.001 || vRidge>.001) mark=readGround(impressions,stamps,dx,dy,.83);
        if(vScroll>.001) {
          // Reserve the paper between clumps. The coarser wash stays in the
          // distance while the fine root and bristle marks vanish through mips.
          float pool=wash;
          float damp=smoothstep(-.4,1.9,.38-inkPoint.y);
          float cliff=smoothstep(.032,.36,incline);
          float grass=mark.r*(.60+.32*pool)*(1.-cliff);
          // Horizontal beds catch dry brush; breaks in the stroke expose
          // pale stone where the ridge turns towards the sky.
          float beds=inkPoint.y*.54+field.x*.051+.69*sin(field.y*.084+field.x*.022);
          vec2 spur=abs((field-vec2(${((west+east)/2).toFixed(1)},${((north+south)/2).toFixed(1)}))
            /vec2(${((east-west)/2).toFixed(1)},${((south-north)/2).toFixed(1)}));
          float mountain=1.-smoothstep(.80,1.,max(spur.x,spur.y));
          // Short, tilted seams turn around the peach spurs. The exposed rock
          // carries a separate, hand-painted wash on its steepest faces.
          beds+=mountain*(1.7*sin(.064*field.x-.042*field.y)+1.2*sin(.075*field.y+inkPoint.y*.13));
          float broken=smoothstep(.36,.76,shingle.g+pool*.51);
          float bedding=(1.-smoothstep(.045,.22,abs(sin(beds))))*broken*(1.-.73*mountain);
          float stria=max(mark.g,bedding*.62)*cliff;
          float stroke=mix(max(grass,stria),mark.b,damp);
          float mottling=clamp(.55*luma+.10*pool+.09*woodland,0.,.55);
          vec3 fieldWash=mix(vec3(.77,.72,.59),vec3(.41,.46,.32),mottling+.13*woodland);
          fieldWash=mix(fieldWash,vec3(.57,.58,.51)*(.85+.17*pool),cliff*.83);
          fieldWash=mix(fieldWash,vec3(.63,.70,.64)*(.88+.21*pool),damp);
          // Scuffs in the earth curve around the wrestlers. Leave broken
          // crescents, like the trailing end of a single half-dry brushstroke.
          vec2 bout=(field-vec2(${PEACH_BOUT.x}.,${PEACH_BOUT.z}.))*vec2(.90,1.05);
          if(max(abs(bout.x),abs(bout.y))<2.4) {
            float r=length(bout), ang=atan(bout.y,bout.x+.00001);
            float scuff=abs(r-2.1-.055*sin(3.*ang)-.035*sin(8.*ang));
            float nick=.5+.5*sin(5.*ang+.85*sin(7.*ang));
            float rim=(1.-smoothstep(.018,.084,scuff))*(.19+.74*nick*nick);
            fieldWash=mix(fieldWash,vec3(.79,.69,.54)*(.91+.18*luma),1.-smoothstep(1.95,2.4,r));
            fieldWash*=1.-.36*rim;
          }
          fieldWash*=1.-.59*stroke;
          fieldWash*=.93+.11*pool+.055*smoothstep(.08,.4,luma);
          ground=mix(ground,fieldWash,vScroll*.88);
        }
        float exposed=(1.-.80*bank)*(1.-.91*snowCover)*smoothstep(-.8,1.3,inkPoint.y);
        ground*=1.-exposed*(.75*brush+.09*(1.-wash));
        if(vRidge>.001){
          // One painted sheet covers the three ranges. Every inked rock face
          // and patch of foliage stays registered to its own slope in all views.
          vec2 survey=(inkPoint.xz-vec2(${KYO_HILL_SHEET.x}.,${KYO_HILL_SHEET.z}.))
            /vec2(${KYO_HILL_SHEET.width}.,${KYO_HILL_SHEET.depth}.);
          vec3 painting=texture2D(hillPainting,vec2(survey.x,1.-survey.y)).rgb;
          // The broad hillside wash is legible from town. Walking up to it
          // brings out the grain of the soil and tapered marks on the rocks.
          float bristle=clamp(luma*1.16+.79,.81,1.17);
          float close=1.-smoothstep(16.,75.,distance(cameraPosition,inkPoint));
          float rock=smoothstep(.064,.28,incline);
          float fineInk=mix(brush*.65,mark.g*.63,rock);
          vec3 hillside=painting*bristle*(1.-close*fineInk);
          ground=mix(ground,hillside,vRidge*(.89-.17*close));
        }
        diffuseColor.rgb *= ground;
      `,
      );
  };
  return mat;
}

export function trailMaterial(art) {
  const mat = new THREE.MeshLambertMaterial({
    map: art.trail,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    color: 0xffffff,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader='attribute float snowAmount; varying float snowCover; varying vec2 pathMetres;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nsnowCover=snowAmount; pathMetres=position.xz;');
    shader.fragmentShader = groundPrintGLSL+'varying float snowCover; varying vec2 pathMetres;\n'+shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      vec2 plot=pathMetres/4.3;
      Impressions stamps=groundPrint(plot);
      vec3 pigment=readGround(map,stamps,dFdx(plot),dFdy(plot),2.4);
      float wash=groundWash(pathMetres*.17+7.5);
      float edge=min(vMapUv.x,1.-vMapUv.x);
      float fade=smoothstep(.012,.17,edge+(pigment.g-.30)*.10+(wash-.5)*.105);
      float ochre=dot(pigment,vec3(.37,.51,.12));
      float worn=smoothstep(.08,.36,edge+.18*(wash-.5));
      vec3 dirt=mix(pigment,vec3(ochre*1.11,ochre*1.01,ochre*.88),.44);
      dirt=mix(dirt,vec3(.54,.427,.30),.20+.18*worn);
      diffuseColor.rgb*=dirt*(.91+.16*wash)+vec3(.042,.044,.040);
      vec3 snowPath=mix(vec3(.48,.56,.61),vec3(.77,.84,.88),smoothstep(.03,.48,ochre));
      diffuseColor.rgb=mix(diffuseColor.rgb,snowPath,snowCover*.94);
      diffuseColor.a *= fade;
    `,
    );
  };
  return mat;
}

// Tinted structural timbers retain the existing joinery palette. The sample
// supplies relative grain density, with deep pigment in creases and knots.
export function tintedSurface(texture, colorStrength = 0.32, roughness = 0.86, bump = 0.021) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: texture,
    bumpScale: bump,
    roughness,
    metalness: 0,
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.colorStrength = { value: colorStrength };
    shader.fragmentShader =
      'uniform float colorStrength;\n' +
      shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
      vec3 sampleInk=texture2D(map,vMapUv).rgb;
      float grain=dot(sampleInk,vec3(.27,.58,.15));
      vec3 tint=mix(vec3(grain),sampleInk,colorStrength);
      diffuseColor.rgb*=clamp(tint*2.65+.27,.23,1.72);
    `,
      );
  };
  return mat;
}

export function roundedStone(seed = 0) {
  const g = new THREE.SphereGeometry(1, 14, 10);
  const p = g.attributes.position,
    colors = [],
    c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const a = Math.atan2(z, x),
      jag = 0.075 * Math.sin(a * 3.0 + seed + 0.75 * y) + 0.045 * Math.cos(a * 7.0 - seed + y * 4.5);
    const r = 1 + (1 - y * y) * jag + 0.038 * Math.sin(8 * x + 4 * y - 3 * z + seed);
    const yy = Math.sign(y) * Math.pow(Math.abs(y), 0.77);
    p.setXYZ(i, x * r + 0.08 * y, yy * (1 + 0.06 * x) + 0.025 * Math.sin(a * 5) * (1 - y * y), z * r);
    const top = Math.max(0, Math.min(1, (y + 0.1) * 0.88));
    c.copy(paint('#9ba19a'))
      .lerp(paint('#d8d7b6'), top)
      .multiplyScalar(0.89 + 0.12 * top);
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}
