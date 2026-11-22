import * as T from './vendor/three.module.min.js';
import { WATER_Y } from './terrain.js';
import { waterWaveGLSL } from './shoreline.js';

// Damp stone keeps its original scan and normals. Below the last wash line,
// the colour deepens, the roughness drops and a narrow tide stain breaks up.
export function wetStone(material, level, clock) {
  const compile=material.onBeforeCompile;
  const key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    compile.call(material,shader);
    shader.uniforms.shoreClock=clock;
    shader.uniforms.stoneWaterLevel={value:level};
    shader.vertexShader='varying vec3 stonePoint;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      #include <project_vertex>
      vec4 rockVertex=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        rockVertex=instanceMatrix*rockVertex;
      #endif
      stonePoint=(modelMatrix*rockVertex).xyz;`);
    shader.fragmentShader='varying vec3 stonePoint; uniform float stoneWaterLevel,shoreClock;\n'+waterWaveGLSL+'\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float grainEdge=.015*sin(stonePoint.x*21.+stonePoint.z*7.)+.012*sin(stonePoint.z*32.);
      float stoneHeight=stonePoint.y-stoneWaterLevel;
      float stoneWave=waveHeight(stonePoint.xz,shoreClock);
      float damp=1.-smoothstep(.055,.19,stoneHeight-grainEdge-stoneWave*.31);
      float wet=1.-smoothstep(.004,.049,stoneHeight-stoneWave-grainEdge*.4);
      float mineral=dot(diffuseColor.rgb,vec3(.28,.59,.13));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(mineral*.93,mineral*1.022,mineral),.36);
      diffuseColor.rgb*=mix(vec3(1.),vec3(.56,.64,.60),damp);
      diffuseColor.rgb*=1.-wet*.13;`).replace('#include <roughnessmap_fragment>',`
      #include <roughnessmap_fragment>
      roughnessFactor=mix(roughnessFactor,.30,wet*.83);`);
  };
  material.customProgramCacheKey=()=>key+'-wet-waterline';
  return material;
}

// Intersect the actual transformed stone triangles with the water plane.
// Dry banks and stones beneath the surface get no ring. The convex outline
// bridges small subsurface notches where capillary water joins up anyway.
function outlineAtWater(geo, matrix) {
  const positions=geo.attributes.position, faces=geo.index;
  const world=Array.from({length:positions.count},(_,i)=>new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(matrix));
  const points=[];
  for(let i=0;i<faces.count;i+=3){
    for(let j=0;j<3;j++){
      const a=world[faces.getX(i+j)], b=world[faces.getX(i+(j+1)%3)];
      if((a.y<WATER_Y)===(b.y<WATER_Y))continue;
      const t=(WATER_Y-a.y)/(b.y-a.y);
      points.push([a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]);
    }
  }
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const hull=points=>{
    const arc=[];
    for(const p of points){
      while(arc.length>=2) {
        const a=arc[arc.length-2], b=arc[arc.length-1];
        if ((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>1e-8)break;
        arc.pop();
      }
      arc.push(p);
    }
    arc.pop();
    return arc;
  };
  return hull(points).concat(hull(points.reverse()));
}
export function contactRipples(scene, groups, shapes, clock) {
  const pos=[],uv=[],phase=[],indices=[];
  groups.forEach((instances,shape)=>{
    for(const m of instances){
      const outline=outlineAtWater(shapes[shape].geo,m);
      if(outline.length<3)continue;
      const base=pos.length/3, cx=m.elements[12],cz=m.elements[14];
      const perimeter=[0];
      for(let j=0;j<outline.length;j++){
        const a=outline[j],b=outline[(j+1)%outline.length];
        perimeter.push(perimeter[j]+Math.hypot(b[0]-a[0],b[1]-a[1]));
      }
      const total=perimeter.at(-1); if(total<.35)continue;
      for(let i=0;i<=outline.length;i++){
        const a=outline[i%outline.length],dx=a[0]-cx,dz=a[1]-cz,dist=Math.hypot(dx,dz)||1;
        const extent=Math.min(.27,total*.054);
        for(const k of [0,1]){
          const out=k*extent-.028;
          pos.push(a[0]+dx/dist*out,WATER_Y,a[1]+dz/dist*out);
          uv.push(perimeter[i]/total,k);
          phase.push(cx*.29+cz*.51);
        }
        if(i<outline.length){const n=base+i*2;indices.push(n,n+1,n+2,n+2,n+1,n+3);}
      }
    }
  });
  if(!indices.length)return;
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('seed',new T.Float32BufferAttribute(phase,1));
  geo.setIndex(indices);
  const mat=new T.ShaderMaterial({
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{clock:{value:0}}]),
    fog:true, side:T.DoubleSide, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1,
    vertexShader:`attribute float seed; varying vec2 rim; varying float phase; uniform float clock;
      ${waterWaveGLSL}
      #include <fog_pars_vertex>
      void main(){rim=uv;phase=seed;vec3 p=position;p.y+=waveHeight(p.xz,clock)+.019;
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`varying vec2 rim;varying float phase;uniform float clock;
      #include <fog_pars_fragment>
      void main(){float theta=rim.x*6.2831853;float current=sin(theta*2.+phase+.4*sin(clock*.6+theta));
        float arc=smoothstep(-.69,.72,current+.32*cos(theta*5.+phase));
        float dark=(1.-smoothstep(.11,.30,rim.y))*arc;
        float brush=1.-smoothstep(.027,.16,abs(rim.y-.40-.079*sin(theta*3.+clock*.72)));
        float farBrush=1.-smoothstep(.02,.10,abs(rim.y-.82-.048*cos(theta*4.+clock*.6)));
        float froth=(brush*.63+farBrush*.25)*arc*(.79+.19*sin(theta*9.+phase));
        gl_FragColor=vec4(mix(vec3(.081,.19,.19),vec3(.81,.81,.66),froth/max(.001,froth+dark)),clamp(froth+dark*.38,0.,.73));
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  mat.uniforms.clock=clock;
  const mesh=new T.Mesh(geo,mat);
  mesh.name='浅瀬の返し波'; mesh.renderOrder=2; scene.add(mesh);
}
