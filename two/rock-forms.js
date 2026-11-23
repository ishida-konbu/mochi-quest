import * as THREE from './vendor/three.module.min.js';

export function roundedStone(seed = 0) {
  const g = new THREE.SphereGeometry(1, 14, 10);
  const stone = new THREE.Color('#9ba19a'), moss = new THREE.Color('#d8d7b6');
  const p = g.attributes.position,
    colors = [],
    c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const a = Math.atan2(z, x),
      jag = 0.075 * Math.sin(a * 3.0 + seed + 0.75 * y) + 0.045 * Math.cos(a * 7.0 - seed + y * 4.5);
    const r = 1 + (1 - y * y) * jag + 0.038 * Math.sin(8 * x + 4 * y - 3 * z + seed);
    const yy = Math.sign(y) * Math.pow(Math.abs(y), 0.77);
    p.setXYZ(i, x * r + 0.08 * y, yy * (1 + 0.06 * x) + 0.025 * Math.sin(a * 5) * (1 - y * y), z * r);
    const top = Math.max(0, Math.min(1, (y + 0.1) * 0.88));
    c.copy(stone)
      .lerp(moss, top)
      .multiplyScalar(0.89 + 0.12 * top);
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function rockForm(variant, winter=false) {
  const points=[],colors=[],uv=[],index=[], sideCount=15;
  const angle=variant*1.89, TAU=Math.PI*2;
  const wet=new THREE.Color('#4e5d66'), dry=new THREE.Color('#8c9897'), snow=new THREE.Color('#edf1e9');
  const layers=[
    [-.37,.71],[-.03,.94],[.16,1],[.31,.97],[.325,.921],
    [.349,.967],[.53,.89],[.547,.849],[.559,.884],
    [.69,.85],[.715,.826],[.732,.83],[.89,.68],[.96,.39],[1,.015],
  ];
  const dried=new THREE.Color('#dad4be'),shade=new THREE.Color('#9fa9a1'),
    seam=new THREE.Color('#ece0c5'),moss=new THREE.Color('#819273'),tint=new THREE.Color();
  for(const [j,[height,radius]] of layers.entries()) {
    for(let i=0;i<=sideCount;i++){
      const a=TAU*(i%sideCount)/sideCount;
      const theta=a+.068*Math.sin(3*a+angle)+.033*Math.cos(7*a);
      const joint=.93+.118*Math.sin(3*a+angle)+.065*Math.cos(6*a-angle);
      const skew=.16*height;
      const x=Math.cos(theta)*joint*radius+skew, z=Math.sin(theta)*joint*radius;
      const dip=.15*x-.072*z;
      const worn=.058*Math.cos(2*a+angle)*radius+.045*Math.sin(5*a-height)*radius;
      points.push(x,height+dip+worn,z);
      uv.push(i/sideCount*2.6,height+dip);
      const flank=.47+.16*Math.cos(a-angle)+.09*Math.sin(4*a+j*.26);
      tint.copy(shade).lerp(dried,flank+height*.23);
      if(j===3||j===7)tint.multiplyScalar(.70);
      if(j===10)tint.lerp(seam,.68);
      if(j>=12)tint.lerp(moss,.19+.36*(.5+.5*Math.cos(a-angle)));
      if(winter){
        // The saturated band faces the swell. Snow clings to the leeward
        // shoulders of the same fractured mesh, preserving the rock silhouette.
        tint.copy(wet).lerp(dry,.10+.56*flank+.12*height);
        if(j===3||j===7)tint.multiplyScalar(.67);
        if(j===10)tint.lerp(seam,.29);
        const drift=.87+.052*Math.sin(a-angle)+.031*Math.cos(4*a);
        tint.lerp(snow,THREE.MathUtils.smoothstep(height,drift,drift+.11));
      }
      colors.push(tint.r,tint.g,tint.b);
      if(i && j){
        const k=j*(sideCount+1)+i,lo=k-sideCount-1;
        index.push(lo-1,k-1,k, lo-1,k,lo);
      }
    }
  }
  // Close the narrow crown and the buried foot. The same triangles also
  // cover those ends on a cliff or when the traveller reaches them underwater.
  for(let i=1;i<sideCount-1;i++){
    const last=(layers.length-1)*(sideCount+1);
    index.push(0,i,i+1,last,last+i+1,last+i);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points,3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(index);geo.computeVertexNormals();
  return geo;
}


// A river landmark has a pale moss crown over its larger tilted stone.
// Reefs and the broken shoulders of mountain ridges are single beds.
export function rockParts(r, ground) {
  if (r.stratum !== undefined) return [{
    form:r.stratum, x:r.x, y:ground, z:r.z, sx:r.rx, sy:r.h, sz:r.rz, yaw:r.yaw || 0,
    tint:r.winterReef?'#fff':r.tint,
  }];
  return [
    {form:'round',x:r.x,y:ground+r.h*.37,z:r.z,sx:r.rx*1.12,sy:r.h*.74,sz:r.rz*1.16,yaw:.53,tint:'#8c9081'},
    {form:'round',x:r.x+.11,y:ground+r.h*.92,z:r.z,sx:r.rx*.86,sy:.13,sz:r.rz*.81,yaw:.33,tint:'#9eac79'},
  ];
}
