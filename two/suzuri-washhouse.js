// The dyer's former wet room now feeds four open coopered hand-buckets.
// All geometry is in the inkstone's frame; the pavement falls and the
// measuring lip of each basin share their levels with the physical survey.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface,rod,dab,turning } from './village-bath-figures.js';
import { RINSING_SEATS,RINSING_TUB,RINSING_FLOOR,rinseFloorHeight } from './kyo-bath-layout.js';
import { inscriptionMaterial } from './civic-art.js';

const {PI,sin,cos,abs}=Math,tau=2*PI;
const cedar='#a18863',hinoki='#d0b490',grain='#b79c74',heart='#907451',tar='#594f40',bronze='#847b60';
const indigo='#526a70';
const c=h=>new T.Color(h);
function line(s,col,fn,r,n=16){
  const pts=Array.from({length:n+1},(_,j)=>fn(j/n));s.stroke(col,pts,pts.map(()=>r),n);
}
function beam(s,col,a,b,w,d=w){
  const v=new T.Vector3(...b).sub(new T.Vector3(...a)),len=v.length();
  const e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()),'YXZ');
  s.box(col,(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5,w,len,d,e.x,e.y,e.z);
}
function lumber(s,x,y,z,w,h,d,color,bevel=.015){
  const pts=[[-w/2+bevel,-d/2],[w/2-bevel,-d/2],[w/2,-d/2+bevel],[w/2,d/2-bevel],[w/2-bevel,d/2],[-w/2+bevel,d/2],[-w/2,d/2-bevel],[-w/2,-d/2+bevel]];
  const tiers=[[.001,0],[.98,0],[1,bevel],[1,h-bevel],[.983,h],[.001,h]];
  s.add(surface(8,tiers.length-1,(u,v)=>{const [px,pz]=pts[Math.round(u*8)%8],[r,yy]=tiers[Math.round(v*(tiers.length-1))];return [x+r*px,y+yy,z+r*pz];}),color);
}
let wetFinish,timberFinish;
const woodGrain={value:null},quarryGrain={value:null};
function grainFinish(wood){
  // Position-mapped source cedar and quarry grain continue over bevels and
  // the returns in the stone. Narrow water tracks lower the real roughness.
  const m=new T.MeshPhysicalMaterial({vertexColors:true,roughness:wood ? .70 : .62,metalness:.015,
    clearcoat:wood ? .12 : .23,clearcoatRoughness:wood ? .54 : .26,side:T.DoubleSide});
  m.onBeforeCompile=shader=>{
    shader.uniforms.washGrain=wood?woodGrain:quarryGrain;
    shader.vertexShader='varying vec3 washPoint,washNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nwashPoint=position;washNormal=normal;');
    shader.fragmentShader='varying vec3 washPoint,washNormal;uniform sampler2D washGrain;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
      vec3 wp=washPoint,ax=pow(abs(washNormal),vec3(4.));
      ax/=max(.0001,dot(ax,vec3(1.)));
      float field=dot(ax,vec3(texture2D(washGrain,wp.zy*vec2(.53,.71)).r,
        texture2D(washGrain,wp.xz*vec2(.41,.53)).r,texture2D(washGrain,wp.xy*vec2(.49,.69)).r));
      ${wood?`float band=sin(wp.x*127.+wp.y*2.+sin(wp.z*4.1)+sin(wp.x*31.+wp.z*1.12)*2.8);
         diffuseColor.rgb*=.81+.55*field+.018*band;`:`
         float seatX=10.37+1.96*floor((wp.x-10.37)/1.96+.5);
         float splash=exp(-1.23*dot(wp.xz-vec2(seatX+.17,-2.52),wp.xz-vec2(seatX+.17,-2.52)));
         float gutter=exp(-2.1*abs(wp.z+2.62)),tip=exp(-5.*abs(wp.z+3.23));
         float damp=clamp((splash*.76+gutter*.38+tip*.49)*(.70+1.04*field),0.,1.);
         float grain=.62+.86*field;
         diffuseColor.rgb*=mix(vec3(.98,1.,.99),vec3(.49,.59,.58),damp)*grain;`}`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        ${wood?'roughnessFactor=clamp(.76-.19*field,.48,.76);':'roughnessFactor=clamp(.64-.38*damp+.12*(.5-field),.16,.71);'}`);
  };
  m.customProgramCacheKey=()=>wood?'kyoto-hinoki-wash-vein':'kyoto-quarry-rinsing-stone';return m;
}
export function suzuriWashTimber(){return timberFinish??=grainFinish(true);}
function wetStone(){return wetFinish??=grainFinish(false);}

// Open shell of a stave tub. The inner bevel, bottom, bent copper/yellow
// bamboo hoops, two tall carrying ears and their transverse handle are solid.
function oke(s,x,y,z,r,h,phase=0,carry=true){
  const staves=24,shade=[hinoki,'#c2a782','#d5bd99','#c8ac83','#bfa17c','#ccb08d'];
  const rings=[[.774,.025],[.791,0],[.824,.043],[.827,.11],[.983,.94],[1,.976],[.984,1],[.894,1],[.875,.972],[.722,.145],[.712,.107],[.03,.107]];
  for(let j=0;j<staves;j++){
    s.add(surface(4,rings.length-1,(u,v)=>{
      const a=-(j+.023+u*.954)*tau/staves+phase,[rr,hh]=rings[Math.round(v*(rings.length-1))];
      return [x+rr*r*cos(a),y+hh*h,z+rr*r*sin(a)];
    }),shade[j%shade.length]);
    // Curved split grain runs up each stave; a sparse pair of darker lines
    // follows any slight taper rather than sliding across the glued joins.
    if(j%2===0)for(let k=0;k<2;k++)line(s,j%3?grain:'#b19570',t=>{
      const a=-(j+.24+k*.38+.025*sin(PI*t*1.7+j))*tau/staves+phase,rad=r*(.83+.154*t)+.001;
      return [x+rad*cos(a),y+h*(.12+.80*t),z+rad*sin(a)];
    },.0018*r/.43,6);
  }
  // Two crossed plies of split bamboo tighten the lower body; the pegged
  // copper repair on one upper hoop remains visible on the visitors' side.
  for(const [ht,material] of [[.173,'#73755a'],[.747,'#8c8762']]){
    for(let layer=0;layer<2;layer++){
      const rr=r*(.808+.179*ht)+r*.021,yy=y+ht*h+.013*layer;
      line(s,material,t=>[x+rr*cos(t*tau),yy+.007*sin(tau*t*21+layer*PI),z+rr*sin(t*tau)],.010*r/.43,77);
    }
    const a=1.10+phase,rr=r*(.827+.18*ht);
    dab(s,bronze,x+rr*cos(a),y+h*ht+.007,z+rr*sin(a),.043,.018,.018,0,-a+.8);
  }
  if(carry){
    const gripZ=z-.193;
    for(const side of [-1,1]){
      const px=x+side*r*.890,top=y+h+.188;
      const ear=new T.Shape();
      ear.moveTo(-.112,0);ear.lineTo(-.094,.221);ear.quadraticCurveTo(-.092,.288,-.042,.299);
      ear.lineTo(.050,.299);ear.quadraticCurveTo(.110,.293,.108,.237);ear.lineTo(.120,0);ear.closePath();
      const hole=new T.Path();hole.absellipse(0,.216,.047,.039,0,tau,true,0);ear.holes.push(hole);
      const g=new T.ExtrudeGeometry(ear,{depth:.046,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:2,curveSegments:8});
      s.add(g,grain,px-.025,top-.296,gripZ,1,1,1,0,PI/2);
    }
    rod(s,hinoki,[x-r*.993,y+h+.110,gripZ],[x+r*.993,y+h+.110,gripZ],.032,.031);
    for(const side of [-1,1])dab(s,'#8f7656',x+side*(r*.997),y+h+.110,gripZ,.006,.028,.028);
  }
}
function seatStool(s,u,j){
  const base=rinseFloorHeight(u,-1.92);
  // Two flared cheeks are cut away at the foot. A wedged tenon binds them
  // to the stretcher and the dished seat has both eased ends and end grain.
  const cheek=new T.Shape();cheek.moveTo(-.228,0);cheek.lineTo(-.175,.252);cheek.lineTo(.175,.252);cheek.lineTo(.228,0);
  cheek.lineTo(.103,0);cheek.quadraticCurveTo(.053,.118,0,.119);cheek.quadraticCurveTo(-.052,.122,-.105,0);cheek.closePath();
  const g=new T.ExtrudeGeometry(cheek,{depth:.081,bevelEnabled:true,bevelSize:.009,bevelThickness:.007,bevelSegments:2,curveSegments:9});
  for(const side of [-1,1]){
    s.add(g,j%2?'#ac916c':'#b59b77',u+side*.235-.042,base-.007,-1.92,1,1,1,0,PI/2);
    dab(s,heart,u+side*.282,.293,-1.92,.013,.021,.047);
  }
  s.box(beamColor(j),u,base+.104,-1.92,.57,.060,.079);
  const dy=.49-base,plank=(u0,v)=>{
    const x=(u0-.5)*.703,z=(v-.5)*.475,w=1-.061*(abs(v-.50)*2)**5;
    return [u+x*w,.49+.011*(2*u0-1)**2-.008*sin(PI*v)*sin(PI*u0),-1.92+z];};
  s.add(surface(15,9,plank),hinoki);lumber(s,u,base+dy-.076,-1.92,.676,.068,.455,grain,.025);
  for(const off of [-.21,.21])for(const dz of [-.145,.145])dab(s,heart,u+off,.489,-1.92+dz,.011,.004,.011);
}
function beamColor(i){return i%2?'#9c825e':'#ab906c';}
function pavement(stone,wood,liquid,metal){
  const f=RINSING_FLOOR,shade=['#818a84','#8a9188','#79847f','#92968c','#848d85','#8b928b'];
  const mortar='#555f5b';
  function flag(x0,x1,z0,z1,k){
    const w=x1-x0,d=z1-z0,cx=(x1+x0)/2,cz=(z1+z0)/2,chip=.026+.009*(1+sin(k));
    const corners=[[x0+chip,z0],[x1-chip*1.3,z0+.006*sin(k)],[x1,z0+chip],[x1,z1-chip],
      [x1-chip,z1],[x0+chip*.86,z1],[x0,z1-chip*1.35],[x0,z0+chip*.78]];
    const dark=c(shade[Math.abs(k)%6]),pale=c('#a8aba0');
    const rows=[[.995,-.073],[1,-.017],[.985,-.001],[.974,.004],[.55,.007],[.0001,.009]];
    stone.add(surface(8,rows.length-1,(u,v)=>{
      const [scale,dy]=rows[Math.round(v*(rows.length-1))],[xx,zz]=corners[Math.round(u*8)%8];
      const x=cx+(xx-cx)*scale,z=cz+(zz-cz)*scale;return [x,rinseFloorHeight(x,z)+dy,z];
    },(u,v)=>dark.clone().lerp(pale,.058+.18*v+.045*sin(u*9+k))),'#fff');
    if(k%3===0){
      line(stone,'#939c91',t=>{
        const x=x0+w*(.16+.45*t),z=cz+.08*d*sin(t*PI*1.68+k);
        return [x,rinseFloorHeight(x,z)+.010,z];
      },.0029,7);
    }
  }
  // An open stone-lined drain separates the wash faces and the stool lane.
  // Each flag is cut to its edge. No slab closes the visible slots below.
  const left=f.left,right=f.end-f.slot;
  for(const [segment,z0,z1,rows] of [[0,f.back,f.drain-f.slot,3],[1,f.drain+f.slot,f.front,4]]){
    for(let j=0;j<rows;j++){
      const startZ=z0+(z1-z0)*j/rows,endZ=z0+(z1-z0)*(j+1)/rows;
      for(let i=-1;i<12;i++){
        const off=.81*(i+.46*((j+segment)%2)),start=Math.max(left,left+off),end=Math.min(right,left+off+.81);
        if(end-start<.082)continue;
        flag(start+.010,end-.010,startZ+.010,endZ-.010,((i+10)*59+j*19+segment*11));
      }
    }
    stone.add(surface(14,6,(u,v)=>{
      const x=left+(right-left)*u,z=z1+(z0-z1)*v;return [x,rinseFloorHeight(x,z)-.026,z];
    }),mortar);
  }
  function trench(a,b,w,count,vertical=false){
    const [x1,z1]=a,[x2,z2]=b,len=Math.hypot(x2-x1,z2-z1),nx=-(z2-z1)/len,nz=(x2-x1)/len;
    const pt=(t,side)=>[x1+(x2-x1)*t+side*nx,z1+(z2-z1)*t+side*nz];
    const grade=t=>vertical ? rinseFloorHeight(f.end,f.drain)-.057*t : rinseFloorHeight(x1+(x2-x1)*t,f.drain);
    for(const sign of [-1,1])stone.add(surface(count,3,(u,v)=>{
      const [x,z]=pt(u,sign*(w/2+.030*(1-v)));return [x,grade(u)-.099*(1-v),z];
    }),mortar);
    liquid.add(surface(count,2,(u,v)=>{const [x,z]=pt(u,(v-.5)*(w-.025));return [x,grade(u)-.054-.009*u,z];}),'#91a9a0');
    const bay=len/count;
    for(let i=0;i<count;i++){
      const t=(i+.5)/count,[x,z]=pt(t,0),y=grade(t)+.002;
      const open=(!vertical&&i===count-2)||(vertical&&i===count-1);
      if(open)continue;
      const yaw=vertical?PI/2:0;
      const bronzeGrate=i%9===0||vertical;
      for(let j=-1;j<=1;j++){
        const tt=t+j*.28/count,[xx,zz]=pt(tt,0);
        (bronzeGrate?metal:wood).box(bronzeGrate?'#68776b':'#8d8067',xx,y-.013,zz,.205*bay,.031,w+.057,0,yaw);
      }
      if(i%9===0)for(const side of [-1,1]){
        const [xx,zz]=pt(t,side*(w/2+.009));metal.box(bronze,xx,y,zz,bay-.014,.023,.021,0,yaw);
      }
    }
  }
  trench([left,-2.62],[f.end,-2.62],2*f.slot,29);
  trench([f.end,f.drain],[f.end,-3.80],2*f.slot,4,true);
  // The inspection box is open under its removable slotted bronze cover.
  const sx=f.end,sz=-3.89;
  for(const side of [-1,1]){
    lumber(stone,sx,.019,sz+.23*side,.57,.090,.071,'#747c72');
    lumber(stone,sx+.25*side,.019,sz,.069,.090,.41,'#747c72');
  }
  stone.box('#454e48',sx,.027,sz,.45,.018,.39);
  for(let m=0;m<6;m++)metal.box('#67776c',sx+(m-2.5)*.069,.112,sz,.034,.026,.41);
  for(const end of [-1,1])metal.box('#878b75',sx,.11,sz+end*.203,.45,.028,.036);
  // Each board in the raised dry gallery keeps its own sealed end and pegs.
  const porch=(x0,x1,z0,z1,top,n)=>{
    for(let j=0;j<n;j++){
      const w=(x1-x0)/n,x=x0+(j+.5)*w;
      lumber(wood,x,top-.094,(z0+z1)/2,w-.011,.094,z1-z0,['#a68e6b','#b59c76','#ac936e','#b39a77'][j%4],.009);
      for(const end of [-1,1])dab(wood,'#756952',x+w*.19,top+.003,(z0+z1)/2+end*((z1-z0)/2-.08),.010,.004,.010);
    }
  };
  porch(f.left,f.right,f.front,f.lip,.196,43);
  porch(f.end+.12,f.right,f.back,f.front-.01,.225,8);
  lumber(wood,(f.left+f.right)/2,.109,f.front+.01,f.right-f.left,.094,.118,heart);
  for(const side of [-1,1]){
    const z=side<0?f.front+.081:f.lip-.061;
    line(wood,'#85765c',t=>[f.left+.06+t*(f.right-f.left-.12),.196,z],.004,7);
  }
}
function supply(wood,flow,metal){
  const x=18.40,z=-3.43,bottom=.46,w=1.30,d=.95,h=1.18;
  // A lidded master tank, lined in copper and braced against the weight
  // of a full charge. Its feed and four individual stops sit above the tubs.
  for(const side of [-1,1]){
    wood.box(tar,x+side*.49,.33,z,.19,.31,.71);
    for(let j=0;j<10;j++)wood.box(j%3?cedar:grain,x+(j-4.5)*w/10,bottom+h/2,z+side*d/2,w/10-.004,h,.067);
    for(let j=0;j<7;j++)wood.box(j%3?cedar:grain,x+side*w/2,bottom+h/2,z+(j-3)*d/7,.065,h,d/7-.003);
  }
  for(const ht of [.13,.81])for(const side of [-1,1]){
    metal.box('#777861',x,bottom+ht,z+side*(d/2+.041),w+.12,.055,.030);
    metal.box('#777861',x+side*(w/2+.045),bottom+ht,z,.030,.055,d+.10);
    for(const ex of [-1,1])dab(metal,'#a5a083',x+ex*w*.37,bottom+ht,z+side*(d/2+.065),.017,.017,.012);
  }
  // The feed is exposed through a half-open inspection hatch. Its two
  // narrow covers rest on the dry rear half of the lid, clear of the inlet.
  for(let j=0;j<6;j++){
    const hatch=j===2 || j===3,xx=x+(j-2.5)*.216;
    lumber(wood,xx,bottom+h+.01,z-(hatch ? .265 : 0),.21,.06,hatch ? .51 : 1.04,beamColor(j));
    if(hatch)lumber(wood,xx,bottom+h+.074,z-.262,.21,.045,.51,beamColor(j+1));
  }
  for(const end of [-1,1]){
    wood.box(heart,x+end*.424,bottom+h+.083,z+.27,.421,.052,.072);
    wood.box(heart,x+end*.424,bottom+h+.083,z-.27,.421,.052,.072);
  }
  for(const side of [-1,1])metal.box('#708176',x+side*.603,bottom+h-.094,z,.020,.163,d-.10);
  flow.box('#9eb6a8',x,bottom+h-.092,z,w-.099,.012,d-.092);
  for(const sign of [-1,1])metal.stroke(bronze,[[x-.13,bottom+h+.11,z+sign*.19],[x-.09,bottom+h+.23,z+sign*.19],[x+.09,bottom+h+.23,z+sign*.19],[x+.13,bottom+h+.11,z+sign*.19]],[.012,.021,.021,.012],9);
  // A master stop sits on the dry side. Its feed enters through
  // the rear wall above the tank and falls into the inspection hatch.
  const back=-4.028;
  rod(metal,'#718477',[x,2.09,back],[x,2.09,z+.02],.079);
  metal.stroke('#889385',[[x,2.09,z-.06],[x,2.086,z+.058],[x,2.02,z+.141],[x,1.78,z+.142]],[.077,.079,.077,.074],13);
  stream(flow,[x,1.78,z+.142],[x+.009,bottom+h-.087,z+.158],.086);
  for(const zz of [back+.053,z-.09])turning(metal,'#9d9a80',x,2.09,zz,[[.091,0],[.095,.034],[.09,.044]],24,PI/2);
  // The header's free surface stands above the faucet bends. Water can
  // run by gravity from the tank outlet to all four pails, even at low head.
  const troughV=-3.796,left=9.36,right=x-.62;
  for(const side of [-1,1]){
    wood.box(heart,(left+right)/2,1.310,troughV+side*.126,right-left,.163,.044);
    metal.box('#7c897b',(left+right)/2,1.376,troughV+side*.125,right-left,.045,.046);
  }
  for(const end of [left,right])wood.box(heart,end,1.307,troughV,.053,.176,.28);
  metal.box('#6a786e',(left+right)/2,1.268,troughV,right-left,.044,.245);
  flow.box('#a1b5a9',(left+right)/2,1.33,troughV,right-left-.052,.012,.201);
  for(const u of [left+.09,11.36,13.31,15.28,17.24]){
    wood.box(heart,u,1.201,troughV,.09,.112,.41);
    beam(wood,cedar,[u,.905,back-.02],[u,1.181,troughV+.13],.069,.068);
  }
  const xx=x-.64,exit=[xx-.247,1.383,troughV];
  metal.stroke('#7c897b',[[xx,1.47,z-.05],[xx-.183,1.47,z-.05],[xx-.247,1.46,z-.17],exit],[.055,.058,.057,.049],12);
  stream(flow,exit,[exit[0],1.33,troughV+.012],.063);
  rod(metal,bronze,[xx-.129,1.47,z-.05],[xx-.129,1.61,z-.05],.029);
  rod(wood,grain,[xx-.225,1.61,z-.05],[xx-.023,1.61,z-.05],.027);
  wood.box('#6f6551',x,.938,z+d/2+.061,.83,.352,.03);
  metal.box('#a89d77',x,.945,z+d/2+.083,.77,.289,.016);
}
function stream(flow,a,b,width){
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=len?dz/len:1,nz=len?-dx/len:0;
  const at=(t,u)=>[a[0]+dx*t+(u-.5)*width*(1-.33*t)*nx,a[1]+(b[1]-a[1])*t*t+.012*sin(PI*t),
    a[2]+dz*t+(u-.5)*width*(1-.33*t)*nz];
  flow.add(surface(4,12,(u,v)=>at(v,u)),'#afc8bd');
  line(flow,'#d3dcd1',t=>at(t,.30),width*.09,9);
}
function station(s,wood,flow,metal,u,index){
  const tub=RINSING_TUB,x=u+tub.du,z=tub.v;
  // Cut from a single wide slab. The slight recess in its middle puts the
  // pail near the sitter, and the channels on the sill meet a copper run-off.
  const back=-3.91,front=-2.898;
  // The masonry apron returns to a recessed kick beneath the shelf. A
  // water-dark plinth and a narrow lime course run through all four bays.
  lumber(s,u,.148,-3.51,1.64,.089,.64,'#6c786e',.022);
  lumber(s,u,.228,-3.53,1.60,.166,.58,'#7f887b',.023);
  for(const side of [-1,1])lumber(s,u+side*.60,.153,-3.40,.24,.249,.73,'#788379',.029);
  const poly=[[-.825,back],[.835,back],[.85,front-.035],[.72,front+.042],[.35,front+.057],[.22,front-.039],[-.14,front-.053],[-.32,front+.030],[-.75,front+.049],[-.85,front-.025]];
  const outline=new T.Shape();poly.forEach(([xx,v],i)=>i?outline.lineTo(xx,-v):outline.moveTo(xx,-v));outline.closePath();
  s.add(new T.ExtrudeGeometry(outline,{depth:.153,bevelEnabled:true,bevelSize:.017,bevelThickness:.015,bevelSegments:3}),'#929c91',u,.40,0,1,1,1,-PI/2);
  for(const side of [-1,1])wood.box(heart,u+side*.56,.358,-3.39,.16,.10,.71);
  oke(wood,x,tub.base,z,tub.r,tub.height,.12*index,true);
  const level=tub.water;
  flow.add(surface(54,9,(u,t)=>{
    const a=-tau*u,r=.377*t;return [x+r*cos(a),level-.0035*t*t+.002*sin(a*7)*t,z+r*sin(a)];
  }),'#a2b6ab');
  // The cock penetrates the low front wall of the open copper-lined race.
  const stemX=u+.095,tip=[stemX,1.167,tub.spoutV];
  metal.stroke(index===2?'#82765d':'#748174',[[stemX,1.307,-3.76],[stemX,1.301,-3.652],[stemX,1.252,-3.612],
    [stemX,1.229,-3.57],[stemX,1.205,-3.49],tip],[.040,.048,.046,.045,.046,.041],19);
  turning(metal,bronze,stemX,1.301,-3.623,[[.059,0],[.066,.015],[.064,.027]],30,PI/2);
  rod(metal,bronze,[stemX,1.252,-3.592],[stemX,1.400,-3.592],.024,.027);
  rod(wood,grain,[stemX-.108,1.406,-3.592],[stemX+.108,1.406,-3.592],.025,.029);
  for(const dx of [-.085,.085])dab(metal,bronze,stemX+dx,1.406,-3.592,.019,.024,.022);
  stream(flow,tip,[stemX+.012,level+.004,-3.375],.032);
  // Each tub has a spill spout just below the brim. Its drop lands in a
  // shallow scalloped runnel and disappears under the grate at the foot.
  const out=[x+.30,.957,z+.227];
  metal.stroke('#7e897b',[[x+.245,.958,z+.174],[x+.297,.958,z+.219],[out[0]+.047,.948,out[2]+.045]],[.033,.035,.031],5);
  const receiver=[u+.48,.555,-2.936];
  stream(flow,[out[0]+.047,.948,out[2]+.045],receiver,.012);
  for(const side of [-1,1])line(s,'#6b7b73',t=>[receiver[0]+side*.042+.041*t,.551-.008*t,receiver[2]+.068*t],.009,7);
  metal.box('#7f8979',u+.506,.534,-2.856,.127,.038,.115);
  stream(flow,[u+.506,.541,-2.814],[u+.516,rinseFloorHeight(u,-2.62)-.023,-2.62],.023);
  const tx=u+.60;
  lumber(wood,tx,.547,-3.43,.31,.030,.311,'#947b58');
  for(let i=0;i<2;i++)lumber(wood,tx+.015*i,.581+i*.022,-3.43,.216,.024,.166,'#c4bea2',.006);
  seatStool(wood,u,index);
  for(const side of [-1,1])metal.box(bronze,u+side*.62,.44,-2.908,.071,.047,.012);
}
function partitions(s,metal){
  // Shoulder-height partitions taper away towards the visitor. Their horn-
  // shaped corners leave the entire painted screen visible across the hall.
  for(let i=0;i<5;i++){
    const x=RINSING_SEATS[0]+(i-.5)*1.96;
    const profile=[[-3.974,1.40],[-3.84,1.42],[-3.58,1.34],[-3.38,1.24],[-3.20,1.15],[-2.94,1.07],[-2.833,1.059]];
    const section=(t)=>{
      const a=t*(profile.length-1),j=Math.min(profile.length-2,Math.floor(a)),f=a-j;
      return profile[j].map((n,k)=>n+(profile[j+1][k]-n)*f);
    };
    for(let j=0;j<8;j++){
      const a=(j+.014)/8,b=(j+.986)/8,mid=section((a+b)/2),d=section(b)[0]-section(a)[0];
      for(const side of [-1,1])s.add(surface(3,4,(u,v)=>{
        const [z,h]=section(a+(b-a)*u);
        return [x+.048*side,.209+(h-.259)*v,z];
      }),j%2?'#9e8461':'#aa9070');
      s.box(heart,x,.84,mid[0],.102,.033,d);
    }
    const cap=profile.map(([z,h])=>[x,h,z]);
    s.stroke('#b59c74',cap,cap.map(()=>.054),18);
    for(const z of [-3.93,-2.865]){
      const top=z<-3?1.43:1.08;
      lumber(s,x,.18,z,.122,top-.18,.127,heart,.013);
      metal.box('#7d7b63',x,.246,z,.133,.092,.137);
      lumber(s,x,top-.015,z,.143,.037,.151,grain,.012);
    }
  }
}
function linen(s,ink,x,y,z,width,height,phase){
  const a=c(ink),b=c('#d5cfb6');
  const at=(u,v)=>{
    const fold=.032*cos(u*6*PI+phase+.42*v)+.020*sin(u*12*PI+.2*v);
    return [x+width*(u-.5)*(1-.049*v),y-height*v+.018*cos(u*5.7+phase)*v,
      z+fold*v+.044*sin(PI*v)+.019*(1-v)];};
  s.add(surface(30,14,at,(u,v)=>a.clone().lerp(b,.072+.09*cos(u*tau*3+phase)**2+.32*(v>.87&&v<.912))),'#fff');
  for(const v of [.884,.919])line(s,'#c4bca0',t=>at(t,v),.004,18);
}
function workroom(s,metal){
  // Shelves open towards the dry entrance. Each bay returns into the wall,
  // with a raised sill, a lipped shelf and real space behind its belongings.
  const x=19.15,z=-1.70,front=x-.245;
  for(const side of [-1,1])lumber(s,x,.222,z+side*.96,.53,1.57,.092,heart);
  for(let j=0;j<4;j++)lumber(s,x,.25+j*.468,z,.56,.062,1.94,cedar);
  for(let n=0;n<10;n++)s.box(n%3?'#8d775a':'#978165',x+.240,1.013,z+(n-4.5)*.19,.045,1.52,.184);
  for(let row=0;row<3;row++)for(const sign of [-1,1])
    s.box(heart,x,.482+row*.469,z+sign*.32,.504,.409,.047);
  for(let j=0;j<4;j++){
    const shelf=.315+(j%3)*.467,zz=z+(Math.floor(j/2)-.5)*1.22;
    for(let k=0;k<2;k++)lumber(s,front+.21,shelf+k*.064,zz,.32-.02*k,.056,.39,j%2&&k===0?'#758989':'#cbc5af',.011);
  }
  // Nested dye measures with hollow mouths and the blue darkened cloth
  // roll still occupy one cubby, alongside a fresh roll of undyed linen.
  for(let j=0;j<2;j++){
    const zz=z+.60-j*.20,yy=1.355;
    s.post(j?'#aab1a2':'#697e7d',front+.19,yy,zz,.095,.33,.09,0,0,PI/2);
    for(let k=0;k<3;k++)line(s,j?'#8d9485':'#515f62',t=>[front+.024,yy+(.068-.016*k)*cos(t*tau),zz+(.068-.016*k)*sin(t*tau)],.004,17);
  }
  oke(s,front+.20,.316,z-.057,.147,.19,.31,false);
  // The former dyer still wrings cloth on the narrow worktable. Its old
  // blue staining is confined to the edge and the feet of the rear legs.
  const bx=18.04,bz=-1.04;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const xx=bx+sx*.435,zz=bz+sz*.171;
    s.box(heart,xx,.408,zz,.081,.349,.085);
    s.box('#657572',xx,.258,zz,.083,.056,.086);
  }
  lumber(s,bx,.562,bz,1.06,.094,.50,cedar,.017);
  for(let j=0;j<5;j++)s.box(j%2?'#9e8d73':'#a49272',bx-.32+j*.155,.664,bz,.117,.023,.37);
  for(let j=0;j<3;j++)lumber(s,bx+.228,.681+j*.047,bz-.026,.35-.008*j,.043,.26,j%2?'#789391':'#d3c9a9',.010);
  const zz=-2.464,barY=1.51;
  for(const xx of [17.65,18.52]){
    s.box(heart,xx,.95,zz,.07,1.47,.074);
    s.box(heart,xx,.272,zz,.15,.095,.31);
  }
  rod(s,grain,[17.54,barY,zz],[18.65,barY,zz],.032);
  linen(s,'#9daaa0',17.92,barY-.012,zz,.35,.68,.24);
  linen(s,indigo,18.32,barY-.008,zz+.01,.264,.57,1.13);
  const brushX=18.36;
  rod(s,cedar,[brushX,.684,bz+.04],[brushX+.18,.697,bz+.16],.015);
  for(let j=0;j<8;j++)rod(s,'#a2946c',[brushX+.16+j*.010,.697,bz+.14],[brushX+.18+j*.013,.684,bz+.22],.008,.004);
  for(let j=0;j<3;j++){
    const x=18.64+j*.196;
    metal.stroke(bronze,[[x,2.43,-3.99],[x,2.38,-3.94],[x,2.35,-3.91],[x,2.41,-3.88]],[.014,.018,.016,.012],7);
  }
}
function windowLight(s){
  // A deep, rebated window returns daylight through open vertical bars.
  // Its side reveals and chamfered sill remain visible across the small
  // dressing room. The thick perimeter wall can be seen beyond the bars.
  const x=19.47,z=-.92,w=2.01,y=2.15,h=1.28;
  for(const side of [-1,1]){
    lumber(s,x-.020,y-h/2-.056,z+side*(w/2+.052),.188,h+.155,.105,heart);
    lumber(s,x-.034,y+side*(h/2+.024)-.041,z,.246,.091,w+.263,grain);
  }
  for(let j=0;j<13;j++){
    const zz=z+(j/12-.5)*w;
    const depth=j%3===0 ? .11 : .069;
    s.box(j%3?cedar:heart,x-.009,y,zz,depth,h,.036);
    s.box(grain,x-.008-depth/2,y,zz-.014,.015,h,.012);
  }
  for(const ht of [y-h*.33,y+h*.21])s.box(heart,x+.047,ht,z,.071,.043,w);
}
function vault(s,metal){
  // An exposed central lantern ceiling is set back above a lower coffer
  // band. Hanging rails return to the structural tie, never to the mural.
  const left=9.06,right=19.50,back=-4.13,front=1.21;
  for(let n=0;n<4;n++){
    const z=back+(n+.5)*(front-back)/4;
    for(let j=0;j<22;j++){
      const w=(right-left)/22,x=left+(j+.5)*w,y=3.175+.031*(n===1||n===2);
      lumber(s,x,y,z,w-.007,.061,(front-back)/4-.028,beamColor(j+n),.008);
    }
  }
  for(let j=0;j<5;j++){
    const u=9.36+j*1.96;
    s.box(heart,u,3.115,(front+back)/2,.118,.13,front-back+.14);
    for(const dz of [-3.51,-.90,.75])metal.box('#817c63',u,3.045,dz,.123,.037,.151);
  }
  for(const z of [back+.59,(back+front)/2,front-.46]){
    s.box(heart,(right+left)/2,3.083,z,right-left+.16,.12,.114);
    s.box(grain,(right+left)/2,3.044,z+.061,right-left+.17,.037,.025);
  }
  // Old dye beams have a dovetail-scarf and wooden draw pegs at the splice.
  for(const u of [11.18,15.57])for(const sign of [-1,1]){
    s.box('#65543f',u+sign*.091,3.088,front-.40,.017,.104,.014,0,0,-.45);
    dab(s,grain,u+sign*.16,3.097,front-.397,.018,.017,.010);
  }
}
function liquidMaterial(clock){
  const mat=new T.MeshPhysicalMaterial({side:T.DoubleSide,vertexColors:true,clearcoat:.69,clearcoatRoughness:.17,
    roughness:.28,transparent:true,opacity:.84,depthWrite:false});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.washClock=clock;
    shader.vertexShader='varying vec3 rinsePoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrinsePoint=position;');
    shader.fragmentShader='uniform float washClock;varying vec3 rinsePoint;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float headX=10.37+floor((rinsePoint.x-10.37)/1.96+.5)*1.96;
      vec2 ray=rinsePoint.xz-vec2(headX+.107,-3.375);
      float radius=length(ray);float impact=exp(-radius*6.)*pow(.5+.5*cos(radius*126.-washClock*8.),6.);
      float sheet=(.5+.5*sin(43.*rinsePoint.y+washClock*7.+sin(16.*rinsePoint.z)))*.041;
      diffuseColor.rgb+=vec3(.22,.246,.21)*impact+sheet;diffuseColor.a*=.90+.085*impact;`);
  };
  mat.customProgramCacheKey=()=> 'suzuri-wash-running-water';return mat;
}
export function suzuriWashGeometry(){
  const stone=sculpture(),wood=sculpture(),flow=sculpture(),metal=sculpture();
  pavement(stone,wood,flow,metal);partitions(wood,metal);workroom(wood,metal);
  supply(wood,flow,metal);vault(wood,metal);windowLight(wood);
  for(const [j,u] of RINSING_SEATS.entries())station(stone,wood,flow,metal,u,j);
  return {stone:stone.finish(),wood:wood.finish(),metal:metal.finish(),flow:flow.finish()};
}
export function dressSuzuriWashhouse(p,f){
  woodGrain.value=p.wood.map;quarryGrain.value=p.stone.map;
  const g=suzuriWashGeometry();
  const hardware=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,metalness:.30,roughness:.47});
  for(const [type,m] of [['wood',suzuriWashTimber()],['stone',wetStone()],['metal',hardware],['flow',liquidMaterial(p.sway)]]){
    const k='kyoto-wash-'+type;p.shapes[k]=g[type];
    f.put(k,0,0,0,1,1,1,'#fff',m);
  }
  f.put('plane',18.40,.947,-2.865,.74,.235,1,'#fff',inscriptionMaterial('湯　槽',{ground:'#827854',ink:'#eee0b4'}));
  f.put('box',18.40,2.04,-3.94,1.26,.293,.061,'#685441',p.wood);
  f.put('plane',18.40,2.04,-3.903,1.20,.243,1,'#fff',inscriptionMaterial('御湯支度',{ground:'#485955',ink:'#e4d6b2'}));
}
