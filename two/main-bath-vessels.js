import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { carveSuzuriStone } from './suzuri-stonecut.js';
import { basinFinishes,rimPoint,rimSection } from './main-bath-rims.js';

const tau=2*Math.PI;
// Cross sections run up the inner face, across the crown, then down to a
// buried footing. A section can overhang its foot, like a potter's rolled lip.
const sections={
  rolled:[[-.34,-.46,0],[-.32,.32,0],[-.41,.58,1],[-.38,.87,2],[-.20,1,2],[.14,1,2],[.36,.86,1],[.39,.70,1],[.25,.53,3],[.32,.41,1],[.54,.39,2],[.58,.28,1],[.50,.20,3],[.67,-.48,0]],
  ledge:[[-.60,-.44,0],[-.58,.15,1],[-.62,.23,2],[-.34,.23,3],[-.35,.43,1],[-.44,.50,2],[-.06,.56,3],[-.07,.79,1],[-.15,.84,2],[.14,1,3],[.67,.94,2],[.73,.68,1],[.62,.46,2],[.86,.33,1],[.95,-.48,0]],
  slab:[[-.22,-.60,0],[-.22,.47,0],[-.18,.78,1],[-.10,.96,2],[.02,1,1],[.13,.98,1],[.16,.99,3],[.18,.99,1],[.75,.99,1],[.80,1,2],[.92,.88,1],[.92,.31,0],[.85,.25,2],[.92,.18,0],[.97,-.48,0]],
  leaf:[[-.30,-.52,0],[-.27,.41,1],[-.14,.78,1],[.02,1,2],[.14,.97,3],[.29,.75,2],[.52,.56,1],[.62,.34,0],[.77,-.49,0]],
  plank:[[-.30,-.51,0],[-.27,.34,1],[-.36,.44,0],[-.36,.55,2],[-.25,.60,1],[-.25,.93,1],[-.14,1,2],[.65,1,2],[.78,.89,1],[.78,.39,1],[.82,.34,0],[.80,.24,3],[.80,-.52,0]],
  relief:[[-.34,-.51,0],[-.31,.28,1],[-.37,.42,2],[-.22,.56,2],[-.08,.90,1],[.16,1,2],[.39,.94,2],[.58,.68,1],[.48,.52,0],[.71,.30,1],[.78,-.48,0]],
};

export function buildBasinVessel(site){
  const [type]=basinFinishes[site.kind];
  const pigment=basinFinishes[site.kind].slice(3).map(tint=>new T.Color(tint));
  const profile=sections[type] || (type==='lashing'||type==='fan'?sections.plank:type==='bund'?sections.ledge:sections.relief);
  // Split the normals at dressed arrises, plank corners and sinter shelves.
  // Leave the turned clay lip and the scallop's nacre smoothly rounded.
  const sharp=type==='slab'?[1,4,8,10,11]:profile===sections.plank?[1,3,6,7,8]:
    profile===sections.ledge?[2,3,5,6,9,10]:[];
  const section=profile.flatMap((row,i)=>sharp.includes(i)?[row,row]:[row]);
  const count=240, points=[],colors=[],faces=[],stride=section.length;
  function sectionAt(a){
    const r=rimSection(site,a);
    const l=rimPoint(site,a-.008),h=rimPoint(site,a+.008);
    const dx=h[0]-l[0],dz=h[1]-l[1],length=Math.hypot(dx,dz);
    return {...r,nx:dz/length,nz:-dx/length};
  }
  for(let i=0;i<count;i++){
    const a=i*tau/count,r=sectionAt(a);
    for(const [across,row,tone] of section){
      const groove=type==='flute'?.16*r.wave**3:
        type==='petal'?.21*(.5+.5*Math.cos(8*a+Math.PI*(1-row)))**3:
        type==='ledge'?.10*Math.sin(9*a+row*2.2)+.07*Math.sin(16*a-row):0;
      const width=r.width*(across+groove);
      const y=row<0?row:-.14+row*(r.top+.14);
      points.push(r.u+r.nx*width,y,r.v+r.nz*width);
      const stain=.94+.024*Math.sin(17*a+row*.7)+.03*Math.sin(7*a-row*1.7);
      const c=pigment[tone];
      colors.push(c.r*stain,c.g*stain,c.b*stain);
    }
  }
  for(let i=0;i<count;i++)for(let j=0;j<stride-1;j++){
    const a=i*stride+j,b=((i+1)%count)*stride+j;
    faces.push(a,b,a+1,b,b+1,a+1);
  }
  const shell=new T.BufferGeometry();
  shell.setAttribute('position',new T.Float32BufferAttribute(points,3));
  shell.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  // Winding runs up the wet inside and faces the sky across the top.
  shell.setIndex(faces);shell.computeVertexNormals();
  const art=sculpture();art.add(shell,'#fff');
  if(type==='slab'){
    carveSuzuriStone(art,sectionAt);
    return art.finish();
  }
  const mark=basinFinishes[site.kind][6];
  // Lashing across the top and down the face gives the timber baths scale.
  // Grooves and gold-inlaid ribs pick out the fan pleats and the shell flutes.
  const marks={lashing:24,fan:19,flute:26,petal:16,leaf:20};
  for(let i=0,n=marks[type]||0;i<n;i++){
    const a=(i+.19)*tau/n,r=sectionAt(a);
    if(r.bank<.95)continue;
    const point=(d,y,slide=0)=>[r.u+r.nx*d-r.nz*slide,y,r.v+r.nz*d+r.nx*slide];
    const top=r.top+.013,w=r.width;
    if(type==='lashing'||type==='fan'){
      for(const offset of type==='lashing'?[-.042,.042]:[0])
        art.stroke(mark,[point(-.27*w,top*.64,offset),point(-.25*w,top*.94,offset),
          point(-.09*w,top+.005,offset),point(.63*w,top+.005,offset),point(.80*w,top*.88,offset),point(.8*w,top*.48,offset)],
          [.009,.019,.024,.024,.020,.008],10);
    }else{
      const ridge=type==='flute'?.033:.019;
      art.stroke(mark,[point(-.22*w,top*.64),point(-.05*w,top*.95),point(.17*w,top),
        point(.39*w,top*.92),point(.57*w,top*.67)],[.004,ridge,ridge,ridge*.70,.002],8);
    }
  }
  return art.finish();
}

const materials=new WeakMap();
export function basinMaterial(p,site){
  const type=basinFinishes[site.kind][0];
  if(!materials.has(p))materials.set(p,new Map());
  const palette=materials.get(p);
  if(palette.has(type))return palette.get(type);
  const wood=type==='lashing'||type==='fan',glaze=type==='rolled'||type==='flute';
  const slate=type==='slab';
  const mat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,
    roughness:slate?.43:glaze?.38:wood?.82:.71,metalness:slate?.09:type==='bead'?.21:.025});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.carvingGrain={value:wood?p.wood.map:p.stone.map};
    shader.vertexShader='varying vec3 carvedPoint; varying vec3 carvedNormal;\n'+shader.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>\ncarvedPoint=position; carvedNormal=normal;');
    shader.fragmentShader='uniform sampler2D carvingGrain; varying vec3 carvedPoint; varying vec3 carvedNormal;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 p=carvedPoint;
        vec3 axis=pow(abs(normalize(carvedNormal)),vec3(3.));
        axis/=max(.001,dot(axis,vec3(1.)));
        float turn=atan(p.z,p.x)/6.2831853;
        float field=dot(axis,vec3(texture2D(carvingGrain,p.zy*.52).r,
           texture2D(carvingGrain,p.xz*.52).r,texture2D(carvingGrain,p.xy*.52).r));
        float m=texture2D(carvingGrain,vec2(turn*6.,p.y*.8+length(p.xz)*.24)).r;
        float tide=1.-smoothstep(.06,.26,p.y+.028*sin(43.*turn));
        diffuseColor.rgb *= ${wood?'(.72+.58*m)':'(.77+.54*field)'};
        ${glaze?`float pool=.5+.5*sin(49.*turn+10.*field+sin(34.*turn));
        diffuseColor.rgb*=.89+.15*pool*smoothstep(.09,.45,p.y);`:''}
        ${slate?`float bedding=p.z*.78+p.y*2.1+.28*sin(.82*p.x)+.19*field;
        float grain=sin(36.*bedding+1.3*sin(p.x*2.+field*5.));
        float lamina=smoothstep(.80,.98,grain)*smoothstep(.09,.44,field);
        diffuseColor.rgb*=vec3(.95,1.03,1.04)*(.94+.057*grain+.074*field);
        diffuseColor.rgb+=vec3(.012,.013,.012)*lamina*(.28+.72*abs(carvedNormal.y));`:''}
        diffuseColor.rgb*=1.-.21*tide;
      `)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor-.26*tide+.10*(field-.3),.18,.96);');
  };
  mat.customProgramCacheKey=()=> 'carved-basin-'+type;
  palette.set(type,mat);return mat;
}
