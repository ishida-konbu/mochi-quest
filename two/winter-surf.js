import { SNOW_TOWN } from './snow-country.js';
import { WINTER_REEFS } from './winter-reefs.js';

const gl = value => value.toFixed(4);

// Each rock parts the swell twice: a dark wet collar and a broken, outward
// travelling line. They use the same bearing as the solid rock on the seabed.
export const winterSurfGLSL = `
  float winterReefWash(vec2 q,float t,vec2 centre,vec2 radii,vec2 axes) {
    vec2 d=q-centre;
    vec2 local=vec2(dot(d,vec2(axes.x,-axes.y)),dot(d,axes.yx));
    float rim=(length(local/radii)-1.)*min(radii.x,radii.y);
    float winding=sin(local.x*1.08+local.y*.68+t*.6);
    float ripple=rim-.38-.57*sin(t*.91+centre.x*.18)-.17*winding;
    float stroke=1.-smoothstep(.09,.26+min(.42,fwidth(rim)),abs(ripple));
    return stroke*smoothstep(-.79,.57,winding+.31*sin(local.y*1.4-local.x*.7));
  }
  vec3 winterWater(vec3 color,vec2 p,float shore,float depth,float glint,float fresnel,float t){
    vec2 q=p-vec2(${gl(SNOW_TOWN.x)},${gl(SNOW_TOWN.z)});
    if(abs(q.x)>315. || abs(q.y)>315.)return color;
    float reach=(1.-smoothstep(.62,1.,length(q/vec2(302.,294.))))*(1.-smoothstep(.2,4.6,shore));
    if(reach<=0.)return color;
    // A wind row spans many short crests. Offsetting by the row ordinal
    // gives successive waves their own breaks instead of a repeated grid.
    float row=q.y*.155+.19*sin(q.x*.095+q.y*.047)+.08*sin(q.x*.27+q.y*.11)+t*.18;
    float number=floor(row),phase=fract(row);
    float breakUp=sin(q.x*.32+number*3.17+t*.34)+.76*sin(q.x*.15-number*1.43)+.36*sin(q.x*.58);
    float crest=(1.-smoothstep(.016,.035+min(.13,fwidth(row)),abs(phase-.69)))*
                smoothstep(.21,1.18,breakUp);
    float echo=(1.-smoothstep(.008,.030+min(.12,fwidth(row)),abs(phase-.82)))*
               smoothstep(.83,1.67,breakUp);
    float swell=.5+.5*cos(6.28318*(phase-.28));
    vec3 shoal=mix(vec3(.168,.305,.315),vec3(.095,.196,.235),swell);
    vec3 offshore=mix(vec3(.026,.073,.111),vec3(.050,.132,.184),swell);
    vec3 pigment=mix(shoal,offshore,depth);
    pigment=mix(pigment,vec3(.30,.425,.49),.47*fresnel);
    float surf=0.;
    ${WINTER_REEFS.map(r => `surf=max(surf,winterReefWash(q,t,vec2(${gl(r.x-SNOW_TOWN.x)},${gl(r.z-SNOW_TOWN.z)}),vec2(${gl(r.rx)},${gl(r.rz)}),vec2(${gl(Math.cos(r.yaw))},${gl(Math.sin(r.yaw))})));`).join('\n')}
    float runup=abs(shore+1.+.63*sin(q.x*.38+t*.91)+.19*sin(q.x*1.18-t*1.2));
    surf=max(surf,(1.-smoothstep(.18,.66+min(.5,fwidth(shore)),runup))*(.56+.23*swell));
    float detail=1.-smoothstep(.35,.93,fwidth(row));
    pigment=mix(pigment,vec3(.77,.83,.80),clamp(crest*.43*detail+echo*.31*detail+glint*.13+surf*.74,0.,.94));
    return mix(color,pigment,reach*.93);
  }`;
