// The earth is painted in metres. Each point lies between three overlapping
// impressions. Neighbours share the same impression along their common edge.
export const groundPrintGLSL = /* glsl */ `
  vec2 groundHash(vec2 p) {
    vec3 q = fract(p.xyx * vec3(.1031,.1030,.0973));
    q += dot(q,q.yzx+33.33);
    return fract((q.xx+q.yz)*q.zy);
  }
  float groundWash(vec2 p) {
    vec2 cell=floor(p), f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(groundHash(cell).x,groundHash(cell+vec2(1,0)).x,f.x),
               mix(groundHash(cell+vec2(0,1)).x,groundHash(cell+1.).x,f.x),f.y);
  }
  vec2 turnPrint(vec2 axis,vec2 v) {
    return vec2(axis.x*v.x-axis.y*v.y,axis.y*v.x+axis.x*v.y);
  }
  struct Impressions { vec4 a; vec4 b; vec4 c; vec3 weight; };
  vec4 impressionAt(vec2 node,vec2 grid) {
    vec2 seed=groundHash(node);
    float angle=6.2831853*seed.x;
    vec2 axis=vec2(cos(angle),sin(angle))*(.26+.065*seed.y);
    vec2 local=grid-node;
    local=vec2(local.x+.5*local.y,.8660254*local.y);
    return vec4(.5+(seed-.5)*.30+turnPrint(axis,local),axis);
  }
  Impressions groundPrint(vec2 metres) {
    vec2 grid=vec2(metres.x-.5773503*metres.y,1.1547005*metres.y);
    vec2 node=floor(grid), f=fract(grid);
    float upper=step(1.,f.x+f.y);
    vec3 w=vec3(abs(1.-f.x-f.y),mix(f,1.-f.yx,upper));
    w*=w*w;
    return Impressions(impressionAt(node+upper,grid),
                       impressionAt(node+vec2(1,0),grid),
                       impressionAt(node+vec2(0,1),grid),w/dot(w,vec3(1)));
  }
  vec3 readImpression(sampler2D plate,vec4 stamp,vec2 dx,vec2 dy,float scale) {
    return textureGrad(plate,stamp.xy*scale,turnPrint(stamp.zw,dx),turnPrint(stamp.zw,dy)).rgb;
  }
  vec3 readGround(sampler2D plate,Impressions p,vec2 dx,vec2 dy,float scale) {
    dx*=scale; dy*=scale;
    return p.weight.x*readImpression(plate,p.a,dx,dy,scale)
         + p.weight.y*readImpression(plate,p.b,dx,dy,scale)
         + p.weight.z*readImpression(plate,p.c,dx,dy,scale);
  }
`;
