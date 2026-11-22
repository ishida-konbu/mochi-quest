// Keep the existing island survey everywhere except in the small parcels that
// contain an authored bath. Near the waterline a half-metre triangle can follow
// a scallop, a crescent's notch and a narrow dry bank under an animal's feet.
export function springGroundSurvey(sites,bound,spacing,tileSize){
  const across=Math.round(2*bound/spacing);
  const cells=new Map(),tiles=new Set(),key=(x,z)=>z*across+x;
  for(const site of sites){
    // Enclose the full rim, shoulder sculpture and the slope back to the road.
    const radius=Math.max(site.rx,site.rz)*1.38+3.4;
    const rect={
      // The maple points and moon horns turn sharply between neighbouring rays.
      detail:site.shape==='mapleLeaf'||site.shape==='crescent'?8:5,
      left:Math.floor((site.x-radius+bound)/spacing),right:Math.ceil((site.x+radius+bound)/spacing),
      north:Math.floor((site.z-radius+bound)/spacing),south:Math.ceil((site.z+radius+bound)/spacing),
    };
    for(let z=rect.north;z<rect.south;z++)for(let x=rect.left;x<rect.right;x++){
      cells.set(key(x,z),rect);
      tiles.add(key(Math.floor(x/tileSize),Math.floor(z/tileSize)));
    }
  }
  function vertexY(rect,ix,iz,sample){
    const detail=rect.detail,fineStep=spacing/detail;
    const x=ix*fineStep-bound,z=iz*fineStep-bound,dx=ix%detail,dz=iz%detail;
    // Intermediate vertices along the outside must lie exactly on the edge of
    // the coarse neighbour. Do the same along tile seams where the distant
    // and skyline indices can be drawn beside a tile at full resolution.
    if(dz && (ix===rect.left*detail || ix===rect.right*detail || ix%(tileSize*detail)===0)){
      const north=z-dz*fineStep,t=dz/detail;
      return sample(x,north)*(1-t)+sample(x,north+spacing)*t;
    }
    if(dx && (iz===rect.north*detail || iz===rect.south*detail || iz%(tileSize*detail)===0)){
      const left=x-dx*fineStep,t=dx/detail;
      return sample(left,z)*(1-t)+sample(left+spacing,z)*t;
    }
    return sample(x,z);
  }

  function height(x,z,sample){
    const cx=Math.floor((x+bound)/spacing),cz=Math.floor((z+bound)/spacing),rect=cells.get(key(cx,cz));
    if(!rect){
      const left=cx*spacing-bound,north=cz*spacing-bound,u=(x-left)/spacing,v=(z-north)/spacing;
      const east=sample(left+spacing,north),south=sample(left,north+spacing);
      return u+v<=1 ? sample(left,north)*(1-u-v)+east*u+south*v :
        sample(left+spacing,north+spacing)*(u+v-1)+east*(1-v)+south*(1-u);
    }
    const fineStep=spacing/rect.detail;
    const gx=(x+bound)/fineStep,gz=(z+bound)/fineStep,ix=Math.floor(gx),iz=Math.floor(gz);
    const u=gx-ix,v=gz-iz,east=vertexY(rect,ix+1,iz,sample),south=vertexY(rect,ix,iz+1,sample);
    return u+v<=1 ? vertexY(rect,ix,iz,sample)*(1-u-v)+east*u+south*v :
      vertexY(rect,ix+1,iz+1,sample)*(u+v-1)+east*(1-v)+south*(1-u);
  }

  function refineTile(column,row,points,indices,attributes,sample){
    if(!tiles.has(key(column,row)))return;
    // Coarse vertices keep their indices so the existing distant and skyline
    // geometries still share all attributes with the close view.
    const byRect=new Map(),stride=tileSize+1;
    const baseX=column*tileSize,baseZ=row*tileSize;
    indices.length=0;
    for(let j=0;j<tileSize;j++)for(let i=0;i<tileSize;i++){
      const nw=j*stride+i,ne=nw+1,sw=nw+stride,se=sw+1;
      const rect=cells.get(key(baseX+i,baseZ+j));
      if(!rect){indices.push(nw,sw,ne,ne,sw,se);continue;}
      const detail=rect.detail,fineStep=spacing/detail,fineStride=tileSize*detail+1;
      if(!byRect.has(rect))byRect.set(rect,new Map());
      const extra=byRect.get(rect);
      function vertex(a,b){
        if((a===0 || a===detail) && (b===0 || b===detail))return nw+(a===detail?1:0)+(b===detail?stride:0);
        const localX=i*detail+a,localZ=j*detail+b,id=localZ*fineStride+localX;
        if(extra.has(id))return extra.get(id);
        const idx=points.length/3,x=baseX*detail+localX,z=baseZ*detail+localZ;
        extra.set(id,idx);
        points.push(x*fineStep-bound,vertexY(rect,x,z,sample),z*fineStep-bound);
        // Interpolate the pigments of the original triangle. Only the survey
        // elevation changes, so a refined tile retains its paper and canopy.
        const u=a/detail,v=b/detail,first=u+v<=1,corner=first?nw:se;
        const wt=first?1-u-v:u+v-1,we=first?u:1-v,ws=first?v:1-u;
        for(const [data,size] of attributes)for(let k=0;k<size;k++){
          data.push(data[corner*size+k]*wt+data[ne*size+k]*we+data[sw*size+k]*ws);
        }
        return idx;
      }
      for(let b=0;b<detail;b++)for(let a=0;a<detail;a++){
        const tl=vertex(a,b),tr=vertex(a+1,b),bl=vertex(a,b+1),br=vertex(a+1,b+1);
        indices.push(tl,bl,tr,tr,bl,br);
      }
    }
  }
  return {height,refineTile};
}
