import * as T from './vendor/three.module.min.js';

// A moving, low-frequency contact wash seats the little forms in the actual
// bottom pigment. Its 16 cm texels dissolve smoothly into shell-grit and mud.
export function waterbedContacts() {
  const width=480,span=80,data=new Uint8Array(width*width);
  const map=new T.DataTexture(data,width,width,T.RedFormat);
  map.minFilter=map.magFilter=T.LinearFilter;map.needsUpdate=true;
  const origin=new T.Vector2();
  const feet={cobble:[.46,.32],slate:[.47,.33],chert:[.46,.33],twig:[.68,.20],
    scallop:[.20,.16],mussels:[.31,.24],urchin:[.18,.16],grass:[.44,.20],kelp:[.32,.28],pondweed:[.29,.26],sargassum:[.21,.24],leafDrift:[.38,.20]};
  return {origin,map,clear(x,z){origin.set(x,z);data.fill(0);},
    impress(site,x,z){
      const [u,v]=feet[site.kind],a=u*site.scale+.095,b=v*site.scale+.080;
      const ca=Math.cos(site.yaw),sa=Math.sin(site.yaw),pixel=span/width;
      const cx=(x+.077*site.scale-origin.x)/pixel,cz=(z+.04*site.scale-origin.y)/pixel;
      const r=Math.max(a,b)*1.50/pixel;
      const loX=Math.max(0,Math.floor(cx-r)),hiX=Math.min(width-1,Math.ceil(cx+r));
      const loZ=Math.max(0,Math.floor(cz-r)),hiZ=Math.min(width-1,Math.ceil(cz+r));
      for(let j=loZ;j<=hiZ;j++)for(let i=loX;i<=hiX;i++){
        const dx=(i+.5-cx)*pixel,dz=(j+.5-cz)*pixel;
        const across=(dx*ca-dz*sa)/a,along=(dx*sa+dz*ca)/b;
        const d=across*across+along*along;
        const edge=Math.max(0,1-d/2.25);
        const k=j*width+i;data[k]=Math.max(data[k],Math.round(178*edge*edge));
      }
    }};
}

// The same two refracted wave trains cross the sediment, stones and leaf tissue
// in world metres. Wider, fainter bands reach the bottom in deeper water.
export const waterbedLightGLSL = /* glsl */ `
  float bedLight(vec3 world, float depth, float time) {
    vec2 p = world.xz + vec2(.26, -.14)*depth;
    p += .34*vec2(sin(1.16*p.y + .45*cos(.71*p.x) + time*.53),
                  sin(.92*p.x + .34*cos(.63*p.y) - time*.45));
    float a = sin(2.62*p.x + 1.37*p.y + .85*sin(2.14*p.y - time*.71) + time*.53);
    float b = sin(2.29*p.y - 1.52*p.x + .72*sin(1.76*p.x + time*.63) - time*.61);
    float envelope=.46+.30*sin(.73*p.x+.65*p.y-time*.21)+.23*cos(1.11*p.y-.41*p.x+time*.33);
    float fold = abs(a + .74*b + .37*sin(2.05*p.x-1.88*p.y+.6*sin(1.95*p.x)+time*.44));
    float width = max(.036, min(.20, .68*fwidth(fold)))+.004*min(18.,depth);
    float light = (1.-smoothstep(.019, .019+width, fold))*.76
                + (1.-smoothstep(.035, .26+width, fold))*.24;
    return light*(.30+.55*b*b)*smoothstep(.02,.73,envelope)*exp(-max(0.,depth)*.14);
  }`;

export const waterbedPigmentGLSL = /* glsl */ `
  uniform sampler2D benthicPlate,bedContacts;
  uniform vec2 contactOrigin;
  uniform float bedTime;
  varying float streamDepth;
  ${waterbedLightGLSL}
  vec3 sediment(vec3 p,float depth,vec2 dx,vec2 dy) {
    vec2 field=p.xz;
    float lake=1.-smoothstep(.96,1.24,length((field-vec2(-78.,-290.))/vec2(81.,55.)));
    float coast=1.-smoothstep(-.01,1.,streamDepth);
    float river=18.+9.*sin(field.x/51.)+3.3*sin(field.x/25.);
    float sakura=(1.-smoothstep(14.,23.,abs(field.y-river)))*
      smoothstep(-256.,-220.,field.x)*(1.-smoothstep(345.,394.,field.x));
    float maple=(1.-smoothstep(6.,11.,abs(field.y+130.-3.3*sin((field.x-292.)/15.))))*
      smoothstep(272.,281.,field.x)*(1.-smoothstep(366.,398.,field.x));
    float fresh=max(max(sakura,maple),1.-coast)*(1.-lake);
    float wash=.66*groundWash(field*.195)+.34*groundWash(.38*field+22.7);
    // Each impression covers about two metres. Larger bars of gravel are
    // sorted by the current, opening pockets of sand between the stones.
    Impressions stamps=groundPrint(field*1.36);
    vec3 ink=readGround(benthicPlate,stamps,dx,dy,1.);
    float tidalPhase=field.y*3.72+field.x*.68+1.56*sin(field.x*.86+field.y*.20)
                   +.74*sin(field.x*1.55-field.y*.51)+4.3*wash;
    float dune=sin(tidalPhase);
    float rippled=smoothstep(.33,.68,wash+.16*sin(.64*field.x+.78*sin(.88*field.y)));
    float sandRidge=(1.-smoothstep(.05,.27+min(.32,fwidth(tidalPhase)),abs(dune+.37)))
                    *smoothstep(.18,.59,wash)*(1.-smoothstep(.27,1.4,fwidth(tidalPhase)));
    vec3 sand=mix(vec3(.330,.332,.255),vec3(.575,.536,.365),wash);
    sand*=.58+.73*ink.b+rippled*(.094*dune-.12*sandRidge);
    sand=mix(sand,vec3(.35,.36,.29)*(.55+.82*ink.r),smoothstep(.56,.81,wash)*.54);
    float bars=smoothstep(.22,.63,wash+.13*sin(field.y*2.49+sin(field.x*.65)));
    vec3 pebbles=mix(vec3(.164,.193,.171), vec3(.596,.596,.456),smoothstep(.18,.77,ink.r));
    pebbles*=.84+.28*wash;
    vec3 riverBed=mix(sand,pebbles,.32+.67*bars);
    vec3 pondMud=mix(vec3(.185,.211,.151),vec3(.389,.367,.244),wash)
                * (.62+.67*ink.g);
    vec3 lakeBed=mix(pondMud,pebbles,.45*(1.-smoothstep(.28,2.75,depth))+.09*bars);
    vec3 bed=mix(mix(sand,riverBed,fresh),lakeBed,lake);
    vec2 contactUv=mod(field-contactOrigin+1600.,3200.)-1600.;
    contactUv/=80.;
    if(all(greaterThanEqual(contactUv,vec2(0.))) && all(lessThanEqual(contactUv,vec2(1.)))){
      float occlusion=texture2D(bedContacts,contactUv).r;
      vec3 eye=cameraPosition-p;
      eye.xz=mod(eye.xz+1600.,3200.)-1600.;
      bed*=1.-.62*occlusion*(1.-smoothstep(17.,26.,length(eye)));
    }
    float light=bedLight(p,depth,bedTime);
    return bed*(1.+light*vec3(.67,.80,.63))+light*vec3(.045,.058,.040);
  }`;
