// Dry stone footing on the south bank of Kaede Shimizu. Local +Z faces
// along the bank towards the bridge; the source stones lie to its left.
export const KAEDE_DRAGON_SHRINE = {x:271.45, z:-123.85, yaw:1.53};
export const DRAGON_PLINTH = {width:1.52, depth:1.34, bottom:-.45, top:.35};
export const DRAGON_CHAMBER = {width:1.02, depth:.76, bottom:.35, top:1.42};
export const DRAGON_ROOF = {width:1.74, depth:1.50, z:-.03, eave:1.38, ridge:1.93};

export function dragonRoofHeight(t) {
  const {eave,ridge}=DRAGON_ROOF;
  return eave+(ridge-eave)*(1-t)**1.5;
}

export function kaedeDragonShrineSolids(put,groundAt) {
  const {x,z,yaw}=KAEDE_DRAGON_SHRINE, base=groundAt(x,z);
  for(const [part,kind] of [[DRAGON_PLINTH,'floor'],[DRAGON_CHAMBER,'wall']]){
    put(x,z,part.width/2,part.depth/2,yaw,base+part.top,kind,kind==='floor',0,base+part.bottom);
  }
  const {width,depth,z:ridgeZ}=DRAGON_ROOF;
  const c=Math.cos(yaw),s=Math.sin(yaw),slices=3;
  for (const side of [-1,1]) for(let i=0;i<slices;i++){
    const u=side*(i+.5)*width/(2*slices);
    const high=dragonRoofHeight(i/slices), low=dragonRoofHeight((i+1)/slices);
    // Let adjacent sheets overlap by a millimetre so rotated edge probes
    // on the ridge and the slope joints always find a supporting face.
    const roof=put(x+u*c+ridgeZ*s,z-u*s+ridgeZ*c,depth/2,width/(4*slices)+.0005,yaw+side*Math.PI/2,
      base+low,'roof',true,high-low,base+low-.10);
    roof.form='leanTo';
    roof.thickness=.10;
  }
}
