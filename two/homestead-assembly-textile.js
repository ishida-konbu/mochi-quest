// A rush mat keeps a thick roll as it runs out. Awning cloth is a thinner
// spiral. Arc length is conserved around the roll and the weave travels
// with the vertices, including the bound hem and the ridge seam.
export function makeAssemblyTextile(step) {
  const original=step.geometry, geometry=original.clone();
  const base=original.attributes.position, srcNormals=original.attributes.normal;
  const pos=geometry.attributes.position, normal=geometry.attributes.normal;
  const {axis,sign}=step.unfurl, along=axis==='x'?0:2;
  const span=step.bounds.max[along]-step.bounds.min[along];
  const anchor=sign>0?step.bounds.min[along]:step.bounds.max[along];
  const radius=step.id==='camp.mat'?.12:.085;
  let previous=-1;
  return {geometry,unroll(fraction) {
    const value=Math.max(0,Math.min(1,fraction));
    if(value===previous)return;
    previous=value;
    const line=span*value, r=radius*(.61+.39*Math.sqrt(1-value));
    for(let i=0;i<base.count;i++){
      const p=[base.getX(i),base.getY(i),base.getZ(i)];
      const depth=sign*(p[along]-anchor),u=Math.max(0,depth-line);
      const angle=u/r;
      if(u>0) {
        // A slight spiral separates the selvedges of consecutive turns.
        const rho=r*(1-.32*u/span);
        p[along]=anchor+sign*(line+rho*Math.sin(angle));
        p[1]+=rho*(1-Math.cos(angle));
      }
      pos.setXYZ(i,...p);
      const n=[srcNormals.getX(i),srcNormals.getY(i),srcNormals.getZ(i)];
      if(u>0){
        const c=Math.cos(angle),s=sign*Math.sin(angle),a=n[along],b=n[1];
        n[along]=a*c-b*s;n[1]=a*s+b*c;
      }
      normal.setXYZ(i,...n);
    }
    pos.needsUpdate=normal.needsUpdate=true;
    geometry.computeBoundingSphere();
  }};
}
