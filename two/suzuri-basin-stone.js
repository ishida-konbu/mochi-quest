import { sculpture } from './pilgrimage-pigment.js';
import { surface,stroke } from './pilgrim-roofcraft.js';
import { carveSuzuriStone } from './suzuri-stonecut.js';
import { rimPoint,rimSection } from './main-bath-rims.js';
import { ENTRY_TREADS,OKA,okaFront,okaHeight,suzuriBedElevation } from './suzuri-basin-plan.js';

const {PI,cos,sin,abs,max,min,exp}=Math,tau=2*PI;
const samples=(n,f)=>Array.from({length:n},(_,i)=>f(i/(n-1)));
const line=(s,c,f,w,n=26)=>stroke(s,c,samples(n,f),w,n-1,5);
const edgeAt=(site,a)=>{
  const r=rimSection(site,a),p=rimPoint(site,a-.007),q=rimPoint(site,a+.007),dx=q[0]-p[0],dz=q[1]-p[1],d=Math.hypot(dx,dz);
  return {...r,nx:dz/d,nz:-dx/d};};
const points=[[ -.26,-.82,'#4b5654'],[-.255,-.19,'#546261'],[-.245,.08,'#647470'],[-.235,.13,'#78837a'],
  [-.231,.19,'#5b6967'],[-.218,.52,'#596365'],[-.215,.73,'#646d6b'],[-.188,.825,'#66716d'],
  [-.16,.925,'#727c75'],[-.094,.981,'#7b857d'],[-.03,1.002,'#858b80'],[.055,1.00,'#717a73'],
  [.20,.994,'#66706e'],[.57,.999,'#61696b'],[.77,.991,'#68726d'],[.85,.965,'#788078'],
  [.91,.904,'#636e69'],[.937,.82,'#5d6563'],[.944,.51,'#596365'],[.946,.43,'#626b63'],
  [.955,.351,'#515c5d'],[.94,.195,'#555e61'],[.91,.135,'#4d5758'],[.848,.113,'#57615f'],
  [.817,.061,'#69736b'],[.817,-.048,'#535d5a'],[.75,-.16,'#535855'],[.76,-.42,'#4e5554']];
function inkstoneBody(s,site){
  const sections=240,n=points.length-1;
  const body=(u,v)=>{
    const a=u*tau,r=edgeAt(site,a),row=Math.round(v*n),[across,h]=points[row];
    const bedding=.009*sin(11*a+.19*row)+.007*sin(5*a-.27*row);
    const d=across*r.width+(row>16?bedding:0)*r.bank;
    const y=h<0?h:-.14+(r.top+.14)*h;
    return [r.u+r.nx*d,y+(row>16?.014*sin(5*a+.43*row)*r.bank:0),r.v+r.nz*d];
  };
  surface(s,'#fff',n,sections,body,(u,v)=>{
    const row=Math.round(v*n),a=u*tau,light=.92+.042*cos(5*a-.4)+.034*sin(11*a+v*13);
    return [points[row][2],light];});
  // Long seams dip obliquely through the outer flank. A forked fissure or
  // iron-oxide lens occasionally interrupts bedding, as on a cut stone.
  for(const [start,span,phase] of [[-.36,.22,3],[.02,.21,1],[.33,.30,6],[.66,.18,2],[.87,.12,5]]){
    const at=(t,h,raise=0)=>{
      const a=tau*(start+span*t),r=edgeAt(site,a),stride=.947*r.width+.019+raise;
      return [r.u+r.nx*stride,Math.min(r.top-.110,h)*r.bank,r.v+r.nz*stride];};
    for(let k=0;k<3;k++){
      const seam=t=>.142+.09*k+.023*sin(6*t+phase)+.010*sin(28*t+phase);
      line(s,k===1?'#79827a':'#566260',t=>at(t,seam(t)),k===1?.0085:.0105,34);
    }
    for(let j=0;j<3;j++){
      const t0=.24*j+.14;
      line(s,'#485354',v=>at(t0+.030*sin(PI*v)+.045*v,.285-.177*v+.034*cos(phase),.008),.009,9);
    }
  }
  // Dressing flats beneath the foot lift the rub-polished lip off the gravel.
  for(const a of [-2.80,-2.17,-1.19,-.43,.16,.63,2.36,2.90]){
    const r=edgeAt(site,a),d=.77*r.width;
    const u=r.u+r.nx*d,v=r.v+r.nz*d,h=.074;
    s.box('#776f60',u,h*.46,v,.77,h,.43,0,Math.atan2(r.nx,r.nz));
    s.box('#686a60',u,h*.84,v,.68,h*.48,.37,0,Math.atan2(r.nx,r.nz));
  }
  // A small maker's seal is engraved in the front right cheek. Its angular
  // cuts occupy a single block of smooth slate between two bedding planes.
  const r=edgeAt(site,.655),d=r.width*.947+.029;
  const mark=(u,v)=>[r.u+r.nx*d-r.nz*u,.252+v,r.v+r.nz*d+r.nx*u];
  const engrave=(p,w)=>{
    const knots=p.map(q=>mark(...q));
    stroke(s,'#495653',knots,p.map(()=>w),knots.length*3,4);
    stroke(s,'#899186',knots.map(([x,y,z])=>[x,y+.004,z]),p.map(()=>w*.32),knots.length*3,4);
  };
  engrave([[-.116,-.102],[-.116,.100],[.116,.100],[.116,-.102],[-.116,-.102]],.010);
  for(const side of [-1,1]){
    const f=side*.046;
    engrave([[f-.022,.064],[f+.022,.064],[f+.022,.018],[f-.022,.018],[f-.022,.064]],.006);
    engrave([[f,.015],[f,-.061],[f+side*.027,-.061]],.006);
  }
  carveSuzuriStone(s,a=>edgeAt(site,a));
}
function grindingLand(s){
  const width=OKA.right-OKA.left;
  // One continuous upper surface, sampled densely enough to trace the returning
  // walls of the channel. No extra strakes or metal dividers cross the surface.
  const at=(q,t)=>{
    const u=OKA.left+width*q,z=OKA.back+(okaFront(u)-OKA.back)*t;
    return [u,okaHeight(u,z),z];};
  surface(s,'#fff',74,190,(q,t)=>at(1-q,t),(q,t)=>{
    const [x,y,z]=at(1-q,t),a=Math.atan2(z+2.23,x+.86);
    const dust=((x+.86)/1.35)**2+((z+2.24)/.67)**2;
    const polish=exp(-dust),variation=.025*sin(x*4+z*2.2)+.020*cos(5*x-3*z)+.021*cos(a+polish*3);
    return [polish>.42?'#65716e':y<.18?'#5b6a69':'#606a68',.94+variation+.074*polish];});
  const edge=(q,t,offset=0)=>{
    const u=OKA.left+width*q,z=okaFront(u),y=okaHeight(u,z);
    return [u,-.59+(y+.59)*t,z+offset+.043*sin(PI*t)-.082*(1-t)**2];
  };
  surface(s,'#fff',13,116,(q,t)=>edge(q,t),(q,t)=>[t>.91?'#808a7e':t>.70?'#6c7772':'#535f61',.91+.070*cos(11*q+t*1.8)]);
  for(const q of [0,1])surface(s,'#56615e',9,5,(t,v)=>{
    const [x,y,z]=at(q,t);return [x,-.61+(y+.61)*v,z];});
  line(s,'#79857b',q=>edge(q,.985,.004),.017,98);
  // Thin interrupted watermarks follow the actual ogee of the stone, beside
  // the overfall. They do not repeat as a band around the rim.
  for(const [a,b] of [[.06,.34],[.62,.91]])for(let k=0;k<2;k++)
    line(s,k?'#63716c':'#879084',t=>edge(a+(b-a)*t,.79+.048*k+.029*sin(t*11),.006),k?.009:.007,28);
}
function tread(s,step,j){
  // A continuous flight is cut from one saddle of stone. Each vertical
  // return meets the tread below. A single shallow gripped cut dies away
  // before the two thumb-polished arrises of the nose.
  const {v,w,d,h}=step,drop=j===5?.148:h-ENTRY_TREADS[j+1].h;
  function top(q,t){
    const side=2*q-1;
    const bevel=.021*(max(0,.17-t)/.17)**2+.013*(max(0,t-.90)/.10)**2;
    const x=side*(w/2-bevel),z=v+d*(t-.5)+.015*(1-side*side);
    const scuff=.009*exp(-(((x-.07)/.39)**2+((t-.49)/.39)**2));
    const slot=.16+.031*sin(3.4*x+j*.48),edge=max(0,1-(abs(side)/.91)**8);
    const groove=.017*edge*exp(-((t-slot)**2)/.0026);
    const y=h+.004*cos(PI*q)*sin(PI*t)-scuff-groove;
    return [x,y,z];
  }
  surface(s,'#fff',28,25,(q,t)=>top(1-q,t),(q,t)=>{
    const [x,y]=top(1-q,t),rough=.034*sin(9*x+j*2)*cos(t*3);
    return [h-y>.012?'#5d6b65':t<.055?'#889285':'#747e74',.95+rough];});
  const riser=(q,t)=>{
    const [x,y,z]=top(q,0);
    return [x,y-drop-.045+(drop+.045)*t,z-.006+.019*(1-t)**3];
  };
  surface(s,'#fff',7,28,(q,t)=>riser(1-q,t),(q,t)=>[t>.77?'#818d81':t>.25?'#606e67':'#55605d',.93+.049*cos(q*17+j)]);
  for(const side of [0,1]){
    surface(s,'#626d66',5,16,(q,t)=>{
      const [x,y,z]=top(side,q);
      return [x+.008*(2*side-1)*sin(PI*t),y-.23+.23*t,z];
    });
    const crest=samples(15,t=>{
      const [x,y,z]=top(side,t);return [x,y+.018-.017*t,z];
    });
    stroke(s,'#828e80',crest,crest.map((_,i)=>.009+.015*sin(PI*i/14)),15,5);
  }
}
function wellFloor(s,site){
  const boundary=samples(211,t=>rimPoint(site,t*tau));
  const at=(q,t)=>{
    const i=q*210,k=Math.min(209,Math.floor(i)),f=i-k;
    const r=.005+.995*t,x=(boundary[k][0]*(1-f)+boundary[k+1][0]*f)*r;
    const z=(boundary[k][1]*(1-f)+boundary[k+1][1]*f)*r;
    return [x,suzuriBedElevation(x,z,r)+.003,z];
  };
  // Smooth slate runs continuously under the shallow left-hand cut and
  // around the deeper well. Its colour cools where a greater depth was cut.
  s.post('#63726b',0,suzuriBedElevation(0,0,0)-.005,0,.029,.014,.025);
  surface(s,'#fff',55,210,at,(q,t)=>{
    const [x,y,z]=at(q,t),vein=cos(3.14*(z*.89+x*.17)+.41*sin(x*.73));
    const hue=y<-.97?'#52625e':y>-.39?'#788579':'#63726b';
    return [hue,.93+.026*sin(1.8*x-z)+.050*(vein*.5+.5)**12+.030*cos(z*.91+x*.66)];});
}
export function hewnInkstone(site){
  const s=sculpture();wellFloor(s,site);inkstoneBody(s,site);grindingLand(s);
  ENTRY_TREADS.forEach((step,j)=>tread(s,step,j));
  return s.finish();
}

// Broad, hand-rubbed arcs change the sheen across the level grinding field.
// Their ends fade independently, and their scarps stay below a millimetre.
let polished;
export function polishedInkstone(base){
  if(polished)return polished;
  const m=base.clone();
  m.customProgramCacheKey=()=>base.customProgramCacheKey()+' ground-oka';
  m.onBeforeCompile=shader=>{
    base.onBeforeCompile(shader);
    const cut=`
      float rubArcs(vec2 point){
        float marks=0.;
        for(int k=0;k<7;k++){
          float i=float(k);
          vec2 p=point-vec2(.073*sin(i*2.7),.048*cos(i*2.9));
          p.y*=1.72;
          float rad=length(p);
          float ang=atan(p.y,p.x);
          float radius=.40+.10*i+.029*cos(ang*2.+i*.83)+.014*sin(ang*3.-i);
          float blur=max(.0045,fwidth(rad)*.85);
          float line=1.-smoothstep(blur*.45,blur*1.9,abs(rad-radius));
          float sector=smoothstep(-.08,.47,cos(ang-1.93*i)+.16*sin(3.*ang+.65*i));
          marks+=line*sector;
        }
        return min(marks,1.);
      }
    `;
    shader.fragmentShader=cut+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      vec2 rub=studyP.xz-vec2(-.77,-2.26);
      float face=smoothstep(.72,.97,studyN.y)*smoothstep(.14,.29,studyP.y)*(1.-smoothstep(-1.45,-1.02,studyP.z));
      float burnished=(1.-smoothstep(.16,1.15,length(rub*vec2(.80,1.63))))*face;
      float marks=rubArcs(rub)*burnished;
      roughnessFactor=mix(roughnessFactor,.29,burnished*.67);
      roughnessFactor=mix(roughnessFactor,.36,marks*.39);
      diffuseColor.rgb*=1.+.084*burnished-.095*marks;
    `);
  };
  polished=m;return m;
}
