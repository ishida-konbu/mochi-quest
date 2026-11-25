// A sewn envelope folds down at the foot of the cot, and opens over the
// sleeping actor. Top and underside meet at a hem with a visible thickness.
import * as T from './vendor/three.module.min.js';
import {BEDDING_NAMES} from './camp-bedding.js';

const NX=38,NZ=42,sheet=(NX+1)*(NZ+1),materials=[],folded=[];
const tau=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
function pigment(grade){
  if(materials[grade])return materials[grade];
  const n=384,bytes=new Uint8Array(n*n*4),dyes=[
    [[180,154,96],[154,125,80]],[[102,119,125],[169,145,113],[125,122,99],[151,112,97]],
    [[119,131,135],[170,159,141]],[[78,103,118],[151,159,143]]
  ][grade];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=x/n,v=y/n,i=(y*n+x)*4;
    const warp=Math.cos(tau*(u*96+.12*Math.sin(tau*v*3))),weft=Math.sin(tau*v*101);
    const h=(Math.imul(x+9,641)^Math.imul(y+37,227))&255;
    let dye=dyes[0],light=.976+.027*warp+.025*weft+.046*(h/255-.5);
    const edge=Math.min(u,1-u,v,1-v);
    if(!grade){
      const reed=u*60+.09*Math.sin(v*tau*2);
      light+=.095*Math.cos(reed*tau);
      if(v*14%1<.095 && reed%2<1)light*=.69;
      if(edge<.022)dye=dyes[1];
    }else if(grade===1){
      const row=v<.43?0:1,join=row?.65:.36,col=u<join?0:1;
      dye=dyes[2*row+col];
      if((Math.abs(u-join)<.007 && y%10<6)||(Math.abs(v-.43)<.005 && x%11<6))light*=1.44;
    }else{
      if(grade===2 && u*12%1<.13)dye=dyes[1];
      if(grade===3){
        // Slight variations of indigo survive the cloth's weave at a distance.
        // The running stitch follows the seams that compress the wadding.
        const along=u*3+v*2,back=u*3-v*2;
        const seam=Math.min(Math.abs(along-Math.round(along)),Math.abs(back-Math.round(back)));
        light+=.025*Math.sin(tau*(u+.43*v))+.012*Math.cos(tau*(3*u-2.6*v));
        if(seam<.039)light*=seam<.019 && (x+Math.floor(y/3))%9<6?1.54:.88;
      }
      if(edge<.033)dye=dyes[1];
    }
    for(let k=0;k<3;k++)bytes[i+k]=dye[k]*light;
    bytes[i+3]=255;
  }
  const map=new T.DataTexture(bytes,n,n,T.RGBAFormat);map.needsUpdate=true;map.colorSpace=T.SRGBColorSpace;
  map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.anisotropy=4;
  return materials[grade]=new T.MeshStandardMaterial({map,side:T.DoubleSide,roughness:.97});
}
function textile(){
  const indices=[],uv=[],id=(i,j)=>j*(NX+1)+i;
  const seam=(a,b)=>indices.push(a,b,b+sheet,a,b+sheet,a+sheet);
  for(let side=0;side<2;side++)for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++)uv.push(i/NX,j/NZ);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
    const a=id(i,j),b=a+1,c=a+NX+1,d=c+1;
    indices.push(a,b,c,b,d,c,a+sheet,c+sheet,b+sheet,b+sheet,c+sheet,d+sheet);
    if(i===0)seam(c,a);if(i===NX-1)seam(b,d);if(j===0)seam(a,b);if(j===NZ-1)seam(d,c);
  }
  const g=new T.BufferGeometry();g.setIndex(indices);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(sheet*2*3),3));
  return g;
}
export function drapeCover(g,grade,open,arch,bodyHeight){
  const a=g.attributes.position,thickness=[.016,.011,.037,.082][grade];
  for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){
    const u=i/NX,v=j/NZ,across=2*u-1,edge=Math.min(u,1-u,v,1-v);
    // The cover unrolls from the foot toward the chest. One side is
    // pulled slightly ahead of the other before the two selvages settle.
    const x=across*(.555+.065*open)+.004*Math.sin(2.4*Math.PI*v+1.2*across);
    const z=.952-v*(.34+.47*open)+.028*across*Math.sin(Math.PI*open)*v;
    const ridge=Math.sin(v*Math.PI*5.5+.24*Math.sin(u*tau))* (.021*(1-open)+.005);
    const tuck=grade===3 ? Math.abs(Math.sin(Math.PI*(3*u+2*v))*Math.sin(Math.PI*(3*u-2*v))) :
      Math.pow(Math.sin(u*Math.PI*4)*Math.sin(v*Math.PI*4),2);
    const loft=(grade>1?thickness*(.4+.45*tuck):.006)*clamp(edge*15);
    const rest=.153+thickness+.018*(1-open)+ridge+loft;
    const lift=arch*.18*Math.sin(Math.PI*v)*Math.cos(across*1.20);
    const edgeDrop=clamp((Math.abs(x)-.502)/.118)*open;
    const body=bodyHeight?.(x,z)??0;
    // The belly supports the lining. Keep wadding between that surface
    // and the upper cloth, even where the body stands above the flat mat.
    const supported=Math.max(rest,body+(grade>1?thickness*.48+loft:0));
    const y=supported+(rest-supported)*edgeDrop*edgeDrop*(3-2*edgeDrop)+lift+.004;
    const k=j*(NX+1)+i;a.setXYZ(k,x,y,z);a.setXYZ(k+sheet,x,y-thickness*(.55+.45*clamp(edge*12)),z);
  }
  a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();
}
export function campCover(grade=0,moving=false){
  const g=moving?textile():folded[grade]??=textile();
  if(!g.boundingSphere)drapeCover(g,grade,0,0);
  const mesh=new T.Mesh(g,pigment(grade));
  mesh.name=BEDDING_NAMES[grade];mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
