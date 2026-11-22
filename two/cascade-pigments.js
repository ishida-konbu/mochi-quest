import * as T from './vendor/three.module.min.js';

const paperNoise=`
  float hash21(vec2 p){
    p=fract(p*vec2(.1031,.11369));
    p+=dot(p,p.yx+19.19);
    return fract((p.x+p.y)*p.x);
  }
  float wash(vec2 p){
    vec2 i=floor(p),s=fract(p);s=s*s*(3.-2.*s);
    return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),s.x),
               mix(hash21(i+vec2(0.,1.)),hash21(i+1.),s.x),s.y);
  }
  float stroke(float phase,float width){
    float aa=clamp(fwidth(phase),.001,.23);
    return (1.-smoothstep(width,width+aa,abs(fract(phase)-.5)))*(1.-smoothstep(.18,.48,fwidth(phase)));
  }
`;

let brush;
function fallingInk(){
  if(!brush){
    brush=new T.TextureLoader().load(new URL('./assets/world/cascade-brush.webp',import.meta.url).href);
    brush.wrapS=brush.wrapT=T.MirroredRepeatWrapping;brush.anisotropy=4;
  }
  return brush;
}

export function currentPigment(stream,clock,submerged){
  const {toe,lip}=stream.fall,plate=fallingInk();
  const water=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide,transparent:true,depthWrite:true});
  water.forceSinglePass=true;
  water.onBeforeCompile=shader=>{
    shader.uniforms.streamClock=clock;
    shader.uniforms.submerged=submerged;
    shader.uniforms.brushPlate={value:plate};
    shader.uniforms.dropHeight={value:lip.y-toe.y};
    shader.uniforms.impact={value:new T.Vector4(toe.x-lip.x,toe.z-lip.z,toe.nx,toe.nz)};
    shader.uniforms.impactWidth={value:lip.width};
    shader.vertexShader=`
      attribute vec4 current;
      varying vec4 inkFlow;
      varying vec3 waterPoint;
      uniform float streamClock;
    `+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      inkFlow=current;
      float flutter=sin(current.y*2.2-current.z*3.+streamClock*2.9+.7*sin(current.x*12.));
      transformed.y+=.023*flutter*(1.-current.z);
      waterPoint=transformed;`);
    shader.fragmentShader=`
      varying vec4 inkFlow; varying vec3 waterPoint;
      uniform float streamClock,impactWidth,dropHeight,submerged; uniform sampler2D brushPlate; uniform vec4 impact;
      ${paperNoise}
    `+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float u=inkFlow.x,s=inkFlow.y,fall=inkFlow.z,fade=inkFlow.w,t=streamClock;
      if(fade<.015 || (!gl_FrontFacing && fall<.32 && submerged<.5))discard;
      vec2 p=waterPoint.xz;
      // Broad surface washes travel downstream. Fine marks collect where the
      // flow spreads over shallow gravel or folds round the edge of the lip.
      float ripple=wash(vec2(u*4.3+.39*sin(s*.9-t*.7),s*.98-t*.92));
      float broken=smoothstep(.33,.79,wash(vec2(u*7.4+t*.11,s*.49-t*.54)));
      float fillet=stroke(s*1.41+.52*sin(u*7.+s*.39)+.90*ripple-t*.75,.028);
      float channelInk=stroke(u*4.2+.43*sin(s*.89-t*.62)+ripple*.77,.026);
      vec3 deep=vec3(.118,.246,.235),shoal=vec3(.332,.449,.385);
      vec3 bed=mix(deep,shoal,.13+.40*abs(u)+.34*ripple);
      bed=mix(bed,vec3(.65,.72,.61),fillet*(.028+.26*broken));
      bed=mix(bed,vec3(.080,.157,.151),channelInk*.12*broken);
      // Two impressions of broken sumi strokes travel at different speeds.
      // The translucent openings between them widen as the water aerates.
      float down=clamp(-waterPoint.y/dropHeight,0.,1.);
      float drag=s*.107-t*.47+.12*sin(.41*s-t*.61);
      float braid=u+.042*sin(.46*s+2.4*u)+.026*sin(.91*s+6.1*u);
      vec2 sheet=vec2(1.11*braid+.03*sin(drag),-drag);
      float mark=texture2D(brushPlate,sheet).g;
      float scratch=texture2D(brushPlate,vec2(1.91*braid+.041*sin(s*.78-t*.52),-.19*s+t*.72+.63)).g;
      float clump=wash(vec2(braid*13.+.97*sin(.45*s-t*1.31),s*.49-t*2.12));
      float holes=smoothstep(.26,.72,(1.-mark)*1.4+clump*.44);
      float light=smoothstep(.29,.95,mark*.71+scratch*.34+.16*(clump-.5));
      float floss=stroke(braid*19.+.87*clump,.065)*smoothstep(.33,.81,scratch)*smoothstep(.18,.6,clump);
      vec3 cataract=mix(vec3(.187,.329,.321),vec3(.87,.91,.81),light);
      cataract=mix(cataract,vec3(.99,.98,.87),.51*floss);
      vec3 col=mix(bed,cataract,fall);
      // Offset centres break the circles into intersecting fans of foam.
      // The closing gaps between the arcs describe the eddy in the pool.
      vec2 d=p-impact.xy;
      vec2 local=vec2(dot(d,impact.zw),dot(d,vec2(-impact.w,impact.z)));
      float r=length(vec2(local.x/(impactWidth*.81+.18),local.y*.77));
      float r2=length(vec2((local.x+.41*impactWidth)*.81,(local.y-.42)));
      float turbulence=wash(local*2.03+vec2(.15*t,-.62*t));
      float phase=r*2.2+.43*sin(local.x*3.1+t*.59)+.58*turbulence-t*1.04;
      float arc=stroke(phase,.046)*smoothstep(.38,.75,turbulence);
      float foam=(1.-smoothstep(.39,1.29,r+.56*ripple))*(.38+.53*turbulence);
      foam+=arc*(1.-smoothstep(.45,2.71,r))*.65;
      foam+=stroke(r2*2.1-t*1.34+.69*ripple,.039)*(1.-smoothstep(.4,1.70,r2))*broken*.47;
      col=mix(col,vec3(.88,.90,.80),clamp(foam,0.,.95)*(1.-fall));
      float edge=smoothstep(.85,1.,abs(u));
      float veilAlpha=clamp(.94-.70*holes*(.57+.43*down),.24,.93);
      float loose=wash(vec2(braid*28.+1.78*clump,s*.93-t*3.28));
      veilAlpha*=mix(1.,smoothstep(.06,.66,loose),.81*down);
      diffuseColor.rgb=col;
      diffuseColor.a=fade*mix(.79-.35*edge,veilAlpha,fall);
    `).replace('#include <opaque_fragment>',`
      // A little bounced skylight travels inside the spray and partly fills
      // the hard bands of shadow from the folds.
      outgoingLight+=diffuseColor.rgb*(.19*inkFlow.z);
      #include <opaque_fragment>`);
  };
  water.customProgramCacheKey=()=> 'mountain-stream-wash-1';
  return water;
}

let rocks;
export function cragPigment(){
  if(rocks)return rocks;
  const map=new T.TextureLoader().load(new URL('./assets/world/peach-valley-rock.webp',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.anisotropy=4;
  rocks=new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide,transparent:true,
    alphaTest:.041,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-1});
  rocks.forceSinglePass=true;
  rocks.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 stonePoint;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      stonePoint=position;`);
    shader.fragmentShader='varying vec3 stonePoint;\n'+paperNoise+shader.fragmentShader.replace('#include <map_fragment>',`
      vec2 plac=vMapUv;
      vec3 paint=texture2D(map,plac).rgb;
      float mineral=dot(paint,vec3(.30,.53,.17));
      vec2 q=vec2(stonePoint.x+.37*stonePoint.z,stonePoint.y-.29*stonePoint.z);
      float dry=wash(q*1.8);
      float fracture=wash(vec2(q.x*.63+q.y*.18,q.y*.98+q.x*.37)+.68*wash(q*1.63));
      float joint=(1.-smoothstep(.009,.040+fwidth(fracture),abs(fracture-.46)))*smoothstep(.38,.70,dry);
      diffuseColor.rgb*=mix(vec3(.68),paint*1.31+.13,.85);
      diffuseColor.rgb*=1.-.31*joint;
    `);
  };
  rocks.customProgramCacheKey=()=> 'mountain-schist-and-lichen-1';
  return rocks;
}

export function sprayPigment(clock){
  const mat=new T.ShaderMaterial({uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{clock}]),
    transparent:true,depthWrite:false,fog:true,side:T.DoubleSide,forceSinglePass:true,
    vertexShader:`
      uniform float clock;
      attribute vec4 jet; attribute vec3 nib; varying float alpha,tint,haze; varying vec2 dropUv;
      #include <fog_pars_vertex>
      void main(){
        float age=fract(clock/jet.w+nib.z),elapsed=age*jet.w;haze=step(nib.x,0.);
        vec3 point=position+jet.xyz*elapsed;
        point.y-=4.9*elapsed*elapsed*(1.-.91*haze);
        vec4 mvPosition=modelViewMatrix*vec4(point,1.);
        vec3 speed=(modelViewMatrix*vec4(jet.xyz-vec3(0.,9.8*elapsed,0.),0.)).xyz;
        vec2 axis=normalize(speed.xy+vec2(.0001,.0001));
        vec2 right=vec2(axis.y,-axis.x);
        float lengthScale=nib.y*(.56+.44*min(length(speed)*.21,1.));
        vec2 fine=right*(uv.x-.5)*abs(nib.x)+axis*(uv.y-.5)*lengthScale;
        vec2 diffuse=(uv-.5)*vec2(abs(nib.x),nib.y)*(.42+.98*age);
        mvPosition.xy+=mix(fine,diffuse,haze);
        alpha=smoothstep(.015,.16,age)*(1.-smoothstep(.65,.99,age));
        tint=fract(nib.z*12.3);dropUv=uv;gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      varying float alpha,tint,haze; varying vec2 dropUv;
      ${paperNoise}
      #include <fog_pars_fragment>
      void main(){
        vec2 q=2.*dropUv-1.;
        float width=(1.-.51*q.y);
        float shape=1.-smoothstep(.54,1.,q.x*q.x/(width*width)+q.y*q.y);
        float cloud=(1.-smoothstep(.01,.99,dot(q,q)+.37*wash(dropUv*4.+tint*13.)))*.18;
        gl_FragColor=vec4(mix(vec3(.57,.70,.65),vec3(.96,.96,.86),tint),mix(shape*.83,cloud,haze)*alpha);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  mat.uniforms.clock=clock;
  return mat;
}
