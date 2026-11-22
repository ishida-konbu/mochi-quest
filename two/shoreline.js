import { coastX } from './terrain.js';
import { SNOW_TOWN } from './snow-country.js';

export const WINTER_SKIFF = { x:SNOW_TOWN.x+32, z:SNOW_TOWN.z-157, yaw:1.27, length:6.3, width:1.65 };

export const BOATS = [
  { x: -11.9, z: 18.2, yaw: -.92, length: 4.55, width: 1.2 },
  { x: coastX(110)-8.9, z: 110, yaw: -.44, length: 5.4, width: 1.48, sail: true, mooring: 1 },
  { x: coastX(124)-5.3, z: 124, yaw: .76, length: 4.65, width: 1.18, mooring: -1 },
  WINTER_SKIFF,
];
export const HULL_HEIGHT = .76, HULL_DRAFT = .16;
export const halfBreadth = t => Math.max(.012,.5*(1-Math.abs(t)**2.45));
export const sheerHeight = t => .54+.43*Math.abs(t)**2.8+.045*t;

// This identical displacement also places contact strokes on moving water.
export function waterWave(x,z,t) {
  const smooth=(a,b,q)=>{
    const u=Math.min(1,Math.max(0,(q-a)/(b-a)));return u*u*(3-2*u);
  };
  const sea=Math.max(smooth(175,275,-x),smooth(312,383,x),smooth(350,410,Math.abs(z)));
  return (.014+.086*sea)*(Math.sin(x*.54+z*.31-t*1.23)+.29*Math.sin(z*.84-t*1.42));
}
export const waterWaveGLSL = `float waveHeight(vec2 q,float t){
  float sea=max(smoothstep(175.,275.,-q.x),max(smoothstep(312.,383.,q.x),smoothstep(350.,410.,abs(q.y))));
  return (.014+.086*sea)*(sin(q.x*.54+q.y*.31-t*1.23)+.29*sin(q.y*.84-t*1.42));
}`;

// Evaluate the section at the height of this particular wave. Cutting only
// inside the planking leaves the channel filled right up to the outside face.
export const hullWaterGLSL = `
  uniform vec4 hullPlacement[${BOATS.length}], hullSize[${BOATS.length}];
  float hullMargin(vec2 p, float height) {
    float nearest=9.;
    for(int i=0;i<${BOATS.length};i++){
      vec2 delta=p-hullPlacement[i].xy;
      if(max(abs(delta.x),abs(delta.y))>3.45)continue;
      vec2 cs=hullPlacement[i].zw;
      float x=abs(dot(delta,vec2(cs.x,-cs.y)));
      float t=abs(dot(delta,vec2(cs.y,cs.x)))*2./hullSize[i].x;
      if(t>1.)continue;
      float keel=.035+t*t*.15, chine=.285+t*.1;
      if(height<=keel)continue;
      float breadth=max(.012,.5*(1.-pow(t,2.45)))*hullSize[i].y;
      float ratio=mix(.47,.87,clamp((height-keel)/(chine-keel),0.,1.));
      nearest=min(nearest,x-breadth*ratio);
    }
    return nearest;
  }`;
