import * as T from './vendor/three.module.min.js';
import { kaedeStairBed } from './kaede-water-steps.js';
import { SOURCE_STONES } from './mountain-streams.js';
import { terrainHeight, terrainMeshHeight } from './terrain.js';

const { sin, cos, PI } = Math;
const mix = (a,b,t) => a+(b-a)*t;
const smooth = T.MathUtils.smoothstep;

// These stones and the scarp share the waterfall's batched rock mesh. Its
// local origin is at the crest, but all footing and water surveys use metres.
export function carveKaedeRock(stream, vertex, indices, random) {
  const {lip,toe}=stream.fall;
  const run=Math.hypot(toe.x-lip.x,toe.z-lip.z);
  const fx=(toe.x-lip.x)/run, fz=(toe.z-lip.z)/run;
  const shale=new T.Color('#889087'), warm=new T.Color('#b2a48b');
  const saturated=new T.Color('#586a68'), lichen=new T.Color('#92946a');
  const tint=new T.Color();
  const quad=(a,b)=>indices.push(a,b,a+1,a+1,b,b+1);

  // Trace horizontal contours of the cliff. The 2.5 m world triangles
  // round off the crest, so include the actual bed under the overfall.
  // Carving in elevation keeps narrow shelves horizontal on the steep face.
  const cols=66, rows=60;
  for(let i=0;i<=cols;i++){
    const u=2*i/cols-1, across=8.3*u;
    const x0=lip.x+across*fz, z0=lip.z-across*fx;
    const head=-2.5+.31*sin(across*1.3), foot=run+1.75+.48*cos(across*.75);
    const shoulder=1-smooth(Math.abs(u),.63,1);
    function height(along){
      const x=x0+along*fx,z=z0+along*fz,coarse=terrainMeshHeight(x,z);
      return mix(coarse,Math.max(coarse,terrainHeight(x,z)),shoulder);
    }
    const samples=Array.from({length:65},(_,k)=>height(mix(head,foot,k/64)));
    const top=samples[0],bottom=samples[64];
    let section=0;
    for(let j=0;j<=rows;j++){
      const v=j/rows, y=mix(top,bottom,v);
      while(section<63 && samples[section+1]>y)section++;
      const step=T.MathUtils.clamp((samples[section]-y)/Math.max(.001,samples[section]-samples[section+1]),0,1);
      const edge=Math.abs(u)+.053*sin(y*.56+u*4.8)+.027*cos(y*1.3-u*3.7);
      const fade=(1-smooth(edge,.72,1))*smooth(v,0,.06)*(1-smooth(v,.90,1));
      const dip=y+.24*across+.28*sin(across*1.66+.27*y)+.11*cos(y*1.3-across*.43);
      const bed=.59*sin(dip*2.4)+.28*cos(dip*4.9+.7)+.13*sin(dip*10.3);
      const joint=.5+.5*cos(across*2.9+.19*y+.47*sin(across*3.5-y*.27));
      const shelf=.27+.23*bed+.26*joint+.15*sin(across*1.23+y*.51);
      const along=mix(head,foot,(section+step)/64)-.19+fade*(.33+shelf);
      const x=x0+along*fx,z=z0+along*fz;
      tint.copy(shale).lerp(warm,.32+.18*sin(dip*.75+across*.59));
      tint.lerp(saturated,(1-smooth(Math.abs(across),1.1,4.6))*.81);
      tint.lerp(lichen,smooth(bed,.44,.92)*smooth(Math.abs(across),2.0,4.3)*.52);
      // This shell protrudes from the soil at the cascade. Dress its
      // outer shoulder to the same stair cut as the bank beneath it.
      const rockTop=Math.min(y-.035,kaedeStairBed(x,z,y-.035));
      const a=vertex(x,rockTop,z,tint,.83+.16*bed+.09*joint,fade);
      if(i<cols && j<rows)quad(a,a+rows+1);
    }
  }

  // Fine gravel banks are visible through the headpool. Give the coarse
  // terrain its missing curved waterline, feathering back into the leaf litter.
  for(let i=0;i<stream.lipIndex;i++){
    const a=stream.stations[i],b=stream.stations[i+1];
    const rows=5,cols=34;
    for(let j=0;j<=rows;j++){
      const t=j/rows, along=i+t, width=mix(a.width,b.width,t);
      const cx=mix(a.x,b.x,t),cz=mix(a.z,b.z,t);
      for(let k=0;k<=cols;k++){
        const u=k/cols*2-1;
        const r=u*(width+2.55+.27*sin(along*1.2)), x=cx+r*mix(a.nx,b.nx,t),z=cz+r*mix(a.nz,b.nz,t);
        const fine=terrainHeight(x,z),coarse=terrainMeshHeight(x,z);
        const level=mix(a.y,b.y,t);
        const wetBank=1-smooth(fine-level,.10,.65);
        const fill=smooth(fine-coarse,.08,.61);
        const border=(1-smooth(Math.abs(u),.71,1))*smooth(along,0,1.5)*Math.max(wetBank,fill);
        const gravel=.52+.20*sin(x*4.3+z*3.1)+.17*cos(x*7.2-z*2.5);
        const y=Math.max(coarse,fine)+.011+gravel*.038;
        tint.copy(saturated).lerp(warm,smooth(fine,mix(a.y,b.y,t)-.54,mix(a.y,b.y,t)+.21));
        const v=vertex(x,y,z,tint,.80+.20*gravel,border);
        if(j<rows && k<cols)quad(v,v+cols+1);
      }
    }
  }

  // Exposed schist is split into overlapping, water-smoothed noses. The
  // broad crown and chipped outer rim follow the same ellipse as foot contact.
  function block(x,z,rx,rz,yaw,top,rise,stoneColor,moss){
    const cy=cos(yaw),sy=sin(yaw),sides=rx>.5?20:9;
    const rings=rx>.5?[1.02,.99,.95,.82,.59,.31,.07]:[1.02,.95,.71,.29];
    const bumps=Array.from({length:sides},()=>random());
    let first;
    for(const [j,r] of rings.entries()){
      for(let k=0;k<sides;k++){
        const a=2*PI*k/sides,b=bumps[k],radius=r*(.95+.06*b);
        const dx=rx*radius*cos(a),dz=rz*radius*sin(a);
        const px=x+cy*dx+sy*dz,pz=z-sy*dx+cy*dz;
        const crest=top-rise*(1-Math.sqrt(Math.max(0,1-Math.min(1,r*r))));
        const py=j===0?Math.min(terrainMeshHeight(px,pz)-.21,top-rise-.13):
          crest+rise*(b-.5)*(.10*r)+.045*dx;
        tint.copy(stoneColor).lerp(lichen,moss*smooth(1-r,0,.6)*(.41+.49*b));
        const v=vertex(px,py,pz,tint,j===1?.66:.90+.12*b);
        if(j===0 && !k)first=v;
        const next=first+j*sides+(k+1)%sides;
        if(j<rings.length-1)indices.push(v,v+sides,next,next,v+sides,next+sides);
        else if(k>0 && k<sides-1)indices.push(first+j*sides,v+1,v);
      }
    }
  }

  for(const stone of SOURCE_STONES){
    const {x,z,rx,rz,yaw,top,rise}=stone;
    block(x,z,rx,rz,yaw,top,rise,shale,.66);
  }
  for(let i=0;i<76;i++){
    const a=stream.stations[2+Math.floor(random()*(stream.lipIndex-3))];
    const across=(random()*2-1)*a.width*1.26,along=(random()-.5)*.98;
    const x=a.x+across*a.nx-along*a.nz,z=a.z+across*a.nz+along*a.nx;
    const size=.062+random()**2*.27;
    const base=Math.max(terrainHeight(x,z),terrainMeshHeight(x,z));
    const rise=size*(.34+.41*random());
    block(x,z,size,size*(.54+.34*random()),random()*PI,base+rise,rise,
      i%3?saturated:warm,.12);
  }
}
