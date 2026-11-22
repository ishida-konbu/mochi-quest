// Shared meshes in units of full eave width, rise and depth. Closed edge
// returns and a second skin expose the timber underside above the galleries.
import { BufferGeometry, Float32BufferAttribute } from './vendor/three.module.min.js';
import { roofProfile, roofSkinDepth } from './architecture.js';

function surface() {
  const xyz=[],uv=[],indices=[];
  function patch(cols,rows,point,normal,repeatX=1,repeatY=1,lining=false) {
    const first=xyz.length/3;
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) {
      xyz.push(...point(i/cols,j/rows));
      uv.push(i/cols*repeatX,lining?-.25-j/rows*repeatY:j/rows*repeatY);
    }
    // Consistent outward winding on either pitch, including the triangles
    // beside the central ridge where the end of a hipped face tapers away.
    function triangle(a,b,c) {
      const A=a*3,B=b*3,C=c*3;
      const x=xyz[B]-xyz[A],y=xyz[B+1]-xyz[A+1],z=xyz[B+2]-xyz[A+2];
      const dx=xyz[C]-xyz[A],dy=xyz[C+1]-xyz[A+1],dz=xyz[C+2]-xyz[A+2];
      const facing=(y*dz-z*dy)*normal[0]+(z*dx-x*dz)*normal[1]+(x*dy-y*dx)*normal[2];
      if(facing>0) indices.push(a,b,c);
      if(facing<0) indices.push(a,c,b);
    }
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      const a=first+j*(cols+1)+i,b=a+cols+1;
      triangle(a,a+1,b);triangle(a+1,b+1,b);
    }
  }
  function finish() {
    const geometry=new BufferGeometry();
    geometry.setAttribute('position',new Float32BufferAttribute(xyz,3));
    geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  return {patch,finish};
}

export function roofShell(form, aperture=0) {
  const sheet=surface(), depth=roofSkinDepth(form), gabled=form==='gable';
  // Each hip face is a ruled surface, straight from one hip seam to the
  // other. Only the upward sweep needs intermediate vertices there.
  const segments=form==='hip'?1:gabled?8:10,bands=gabled?5:8;
  for(const face of [-1,1]) for(const end of [false,true]) {
    if(gabled && end) continue;
    function point(u,t,drop=0) {
      const across=2*u-1;
      let x,z;
      if(gabled) {
        x=across*(.86+.14*t);z=face*t;
      } else {
        const r=aperture+(1-aperture)*t;
        const span=form==='hip'?.46+.54*t:r;
        x=end?face*span:across*span;
        z=end?across*r:face*r;
      }
      return [x*.5,roofProfile(form,x,z,aperture)-drop,z*.5];
    }
    const outward=end?[face,0,0]:[0,0,face];
    sheet.patch(segments,bands,(u,t)=>point(u,t),[0,1,0],3,2);
    sheet.patch(segments,bands,(u,t)=>point(u,t,depth),[0,-1,0],3,2,true);
    sheet.patch(segments,1,(u,v)=>point(u,1,depth*v),outward,3,.12,true);
    if(aperture>0) sheet.patch(segments,1,(u,v)=>point(u,0,depth*v),outward.map(k=>-k),3,.12,true);
    if(gabled) for(const side of [-1,1]) {
      sheet.patch(bands,1,(t,v)=>point((side+1)/2,t,depth*v),[side,0,0],2,.12,true);
    }
  }
  return sheet.finish();
}

// The actual wall footprint is inset from the verge. Plaster or boarding
// carries up to the curved underside without filling a pagoda's stairwell.
export function atticWalls(form,widthRatio,depthRatio,aperture=0) {
  const walls=surface();
  for(const sign of [-1,1]) for(const end of [false,true]) {
    // The side of a hip and the straight eave of a gable need few
    // sections. The gable end follows both curved pitches at the ridge.
    const columns=form==='hip' && !end?1:form==='gable' && end?12:8;
    walls.patch(columns,1,(t,v)=>{
      const x=(end?sign:t*2-1)*widthRatio,z=(end?t*2-1:sign)*depthRatio;
      const height=roofProfile(form,x,z,aperture);
      return [x*.5,v?height-roofSkinDepth(form)*.4:-.018,z*.5];
    },end?[sign,0,0]:[0,0,sign],2,1);
  }
  return walls.finish();
}

// Negative V is reserved for the underside. The same instanced mesh can
// show kawara or snow above and stained rafters below in one draw call.
export function timberLining(exterior,cedar) {
  const material=exterior.clone();
  material.customProgramCacheKey=()=>exterior.customProgramCacheKey()+'-roof-lining';
  material.onBeforeCompile=shader=>{
    exterior.onBeforeCompile(shader);
    shader.uniforms.roofTimber={value:cedar};
    shader.vertexShader='varying vec2 roofUv;\n'+shader.vertexShader.replace(
      '#include <uv_vertex>','#include <uv_vertex>\n roofUv=uv;');
    shader.fragmentShader='uniform sampler2D roofTimber; varying vec2 roofUv;\n'+shader.fragmentShader.replace(
      '#include <color_fragment>',`
      if(roofUv.y<0.){
        vec2 woodUv=vec2(roofUv.x,-roofUv.y-.25);
        float grain=texture2D(roofTimber,woodUv*vec2(.87,.58)).r;
        float course=abs(fract(woodUv.x*5.)-.5);
        float aa=min(.2,max(.015,fwidth(woodUv.x)*5.));
        float rafter=smoothstep(.36-aa,.36+aa,course);
        diffuseColor.rgb=mix(vec3(.23,.145,.082),vec3(.64,.48,.31),clamp(.36+grain,0.,1.))
          *mix(1.,.61,rafter);
      }
      #include <color_fragment>`);
  };
  return material;
}
