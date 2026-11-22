import * as T from './vendor/three.module.min.js';
import { KAEDE_SEEP } from './mountain-streams.js';

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
  if(stream.id==='kaede-spring')water.defines={KAEDE_SHIMIZU:1};
  water.forceSinglePass=true;
  water.onBeforeCompile=shader=>{
    shader.uniforms.streamClock=clock;
    shader.uniforms.submerged=submerged;
    shader.uniforms.brushPlate={value:plate};
    shader.uniforms.dropHeight={value:lip.y-toe.y};
    shader.uniforms.impact={value:new T.Vector4(toe.x-lip.x,toe.z-lip.z,toe.nx,toe.nz)};
    shader.uniforms.impactWidth={value:lip.width};
    if(water.defines?.KAEDE_SHIMIZU)shader.uniforms.seep={value:new T.Vector2(KAEDE_SEEP.landX-lip.x,KAEDE_SEEP.landZ-lip.z)};
    shader.vertexShader=`
      attribute vec4 current;
      varying vec4 inkFlow;
      varying vec3 waterPoint;
      uniform float streamClock;
      #ifdef KAEDE_SHIMIZU
      uniform vec4 impact;
      uniform float dropHeight;
      #endif
    `+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      inkFlow=current;
      float flutter=sin(current.y*2.2-current.z*3.+streamClock*2.9+.7*sin(current.x*12.));
      transformed.y+=.023*flutter*(1.-current.z);
      #ifdef KAEDE_SHIMIZU
        float down=clamp(-position.y/dropHeight,0.,1.);
        float loose=smoothstep(.01,.32,down)*current.z;
        float travel=sqrt(down+.006)*9.-streamClock*4.2;
        transformed.xz+=impact.zw*loose*(.041*sin(travel*2.4+current.x*13.)+.028*sin(travel*4.3+current.x*23.));
      #endif
      waterPoint=transformed;`);
    shader.fragmentShader=`
      varying vec4 inkFlow; varying vec3 waterPoint;
      uniform float streamClock,impactWidth,dropHeight,submerged; uniform sampler2D brushPlate; uniform vec4 impact;
      #ifdef KAEDE_SHIMIZU
      uniform vec2 seep;
      #endif
      ${paperNoise}
    `+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float u=inkFlow.x,s=inkFlow.y,fall=min(1.,inkFlow.z),fade=inkFlow.w,t=streamClock;
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
      #ifdef KAEDE_SHIMIZU
        // Time of flight is proportional to sqrt(drop). The same parcel
        // lengthens from a wrinkle at the crest into a broken white streak.
        float travel=sqrt(down+.006)*6.4-t*1.74;
        float tow=wash(vec2(braid*29.+.62*sin(travel*3.+braid*9.),travel*1.8));
        float strand=wash(vec2(braid*52.+1.4*tow,travel*2.7+.3*tow));
        float lace=smoothstep(.34,.86,.42*tow+.37*strand+.21*mark);
        vec3 clearWater=mix(vec3(.048,.17,.17),vec3(.24,.40,.38),tow);
        float air=smoothstep(.32,.84,.33*light+.49*lace+.13*scratch+.12*down);
        vec3 whiteWater=mix(clearWater,vec3(.83,.89,.83),air);
        col=mix(col,whiteWater,fall);
        veilAlpha=mix(.29,.90,air)*mix(1.,.66+.34*strand,down);
        float sprayBreak=smoothstep(.59,.99,down)*smoothstep(.21,.93,abs(u))*.33+
                         smoothstep(.86,1.,down)*.35;
        veilAlpha*=smoothstep(sprayBreak-.08,sprayBreak+.23,.59*tow+.41*strand);
        // Successive pulses on the headpool break on the gravel margins.
        vec2 well=p-seep;
        float radius=length(well*vec2(.85,1.03));
        float pool=1.-smoothstep(1.1,5.2,radius);
        float ring=stroke(radius*2.61-t*.94+.29*ripple+.08*sin(t*1.83+well.y*4.1),.035)
          *exp(-radius*1.26)*(.36+.64*broken);
        float eye=exp(-radius*radius*11.)*(.44+.29*sin(t*3.8));
        col=mix(col,vec3(.14,.32,.29),pool*.42*(1.-fall));
        col+=vec3(.29,.35,.33)*pool*(ring*.39+eye*.67)*(1.-fall);
        if(inkFlow.z>1.5){
          float rim=stroke(u+.022*sin(s*11.-t*4.1),.052);
          float glint=.63*rim+.36*pow(strand,4.);
          col=mix(vec3(.076,.22,.21),vec3(.83,.90,.81),glint);
          veilAlpha=.43+.43*glint;
        }
      #endif
      diffuseColor.rgb=col;
      diffuseColor.a=fade*mix(.79-.35*edge,veilAlpha,fall);
      #ifdef KAEDE_SHIMIZU
        diffuseColor.a*=1.-.44*pool*(1.-fall);
        if(diffuseColor.a<.055)discard;
      #endif
    `).replace('#include <opaque_fragment>',`
      // A little bounced skylight travels inside the spray and partly fills
      // the hard bands of shadow from the folds.
      outgoingLight+=diffuseColor.rgb*(.19*inkFlow.z);
      #include <opaque_fragment>`);
  };
  water.customProgramCacheKey=()=> 'mountain-stream-wash-1';
  return water;
}

// Project granite onto all three planes so mineral grains keep their scale
// on both the upright face and the horizontal gravel bed.
export function kaedeCragPigment(){
  const grain=new T.TextureLoader().load(new URL('./assets/world/granite.webp',import.meta.url).href);
  grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.colorSpace=T.SRGBColorSpace;grain.anisotropy=4;
  const mat=new T.MeshLambertMaterial({map:grain,side:T.DoubleSide,vertexColors:true,transparent:true,
    depthWrite:true,alphaTest:.055,forceSinglePass:true,polygonOffset:true,polygonOffsetFactor:-1});
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 rockMetres;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nrockMetres=position;');
    shader.fragmentShader='varying vec3 rockMetres;\n'+paperNoise+shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 p=rockMetres,n=abs(normalize(cross(dFdx(p),dFdy(p))+vec3(.0000001)));
      vec3 w=pow(n,vec3(4.));w/=max(.001,w.x+w.y+w.z);
      vec3 grain=texture2D(map,p.zy*.48).rgb*w.x+texture2D(map,p.xz*.48).rgb*w.y+
                 texture2D(map,p.xy*.48).rgb*w.z;
      float value=dot(grain,vec3(.25,.60,.15));
      vec2 face=vec2(.38*p.x+p.z,p.y);
      float mineral=wash(face*2.7)+.34*wash(face*6.3);
      float seam=face.y+.23*face.x+.36*sin(face.x*1.14)+.31*mineral;
      float split=stroke(seam*.56,.027)*smoothstep(.21,.72,mineral);
      float flake=stroke(seam*2.3+.5*mineral,.018)*smoothstep(.42,.91,mineral);
      diffuseColor.rgb*=mix(vec3(.31,.40,.41),vec3(1.52,1.45,1.24),smoothstep(.08,.57,value));
      diffuseColor.rgb*=1.-.36*split;
      diffuseColor.rgb+=vec3(.034,.040,.037)*flake;
    `);
  };
  mat.customProgramCacheKey=()=> 'kaede-schist';
  return mat;
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
