// The two pent roofs terminate at the upper walls. The third carries a
// hipped skirt and a gable above it (irimoya), with a short horizontal ridge.
export function palaceRoofsFor(levels) {
  return levels.map((level,i)=>{
    const crown=i===levels.length-1, upper=levels[i+1];
    return {u:level.u,v:level.v,w:level.w+5.2,d:level.d+5.2,
      innerW:crown?level.w*.68:upper.w-.12, innerD:crown?level.d*.44:upper.d-.12,
      eave:level.h+level.height-.80, rise:crown?2.03:1.48, gable:crown?2.63:0};
  });
}

export function palaceRoofHeight(roof,u,v) {
  const x=Math.abs(u),z=Math.abs(v);
  if(x>roof.w/2+.00001 || z>roof.d/2+.00001)return -Infinity;
  const t=Math.max((2*x-roof.innerW)/(roof.w-roof.innerW),(2*z-roof.innerD)/(roof.d-roof.innerD));
  if(t<-.00001){
    if(!roof.gable)return -Infinity;
    return roof.eave+roof.rise+roof.gable*(1-2*z/roof.innerD)**1.4;
  }
  const corner=Math.min(2*x/roof.w,2*z/roof.d);
  return roof.eave+roof.rise*(1-Math.min(1,Math.max(0,t)))**1.45+.68*corner**5*Math.max(0,t)**2.1;
}
