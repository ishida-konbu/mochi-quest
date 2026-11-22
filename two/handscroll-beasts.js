// The torso, neck, jaw, shoulders and four legs are one continuous skinned surface.
// Each limb is stitched into an opening in the barrel of the body. The hock can
// swing without a round shoulder cutting through the flank.
import * as T from './vendor/three.module.min.js';
import { hoofPhase, poseKirinLeg, poseKirinTrunk } from './animal-motion.js';
import { inkVolume, brushContour } from './scroll-sculpt.js';
const tau = 2*Math.PI;
const ink = '#423d33', softInk = '#746c58', ivory = '#f0e4c8';

const plans = {
  deer: {
    profile: [
      [-.772,.99,.004,.017],[-.699,1.005,.139,.183],[-.574,1.005,.208,.245],
      [-.411,1.018,.227,.25],[-.248,1.027,.201,.222],[-.075,1.029,.184,.211],
      [.08,1.016,.185,.233],[.208,1.008,.21,.264],[.339,1.055,.226,.251],
      [.441,1.165,.179,.214],[.532,1.378,.147,.155],[.604,1.554,.126,.125],
      [.668,1.683,.138,.159],[.754,1.757,.154,.162],[.844,1.751,.14,.123],
      [.951,1.712,.108,.089],[1.064,1.687,.079,.059],[1.109,1.692,.056,.045],[1.131,1.697,.008,.012]
    ], head:[0,1.015,.31], hind:[2,4], fore:[7,9], legX:.147, skin:'deer', hoof:true,
  },
  boar: {
    profile:[
      [-.929,.638,.01,.05],[-.849,.659,.185,.234],[-.697,.698,.284,.316],
      [-.492,.739,.322,.343],[-.272,.768,.333,.332],[-.072,.780,.351,.349],
      [.115,.786,.357,.367],[.277,.776,.338,.358],[.431,.749,.289,.328],
      [.548,.723,.212,.277],[.645,.707,.195,.229],[.728,.680,.207,.197],
      [.841,.64,.178,.148],[.981,.593,.126,.11],[1.105,.563,.091,.081],
      [1.170,.563,.088,.071],[1.19,.575,.044,.051],[1.198,.579,.007,.014]
    ], head:[0,.737,.535], hind:[2,4], fore:[7,9], legX:.219, skin:'boar', hoof:true,
  },
  shishi: {
    profile:[
      [-1.075,.922,.009,.031],[-.963,.996,.205,.223],[-.790,1.036,.334,.334],
      [-.572,1.049,.353,.351],[-.341,1.055,.286,.247],[-.10,1.089,.260,.237],
      [.112,1.111,.30,.282],[.316,1.129,.356,.346],[.500,1.194,.374,.377],
      [.641,1.342,.303,.335],[.749,1.494,.242,.253],[.833,1.637,.258,.24],
      [.961,1.716,.29,.269],[1.119,1.732,.267,.235],[1.246,1.686,.241,.173],
      [1.357,1.671,.228,.131],[1.449,1.691,.18,.109],[1.492,1.696,.06,.06],[1.503,1.695,.01,.017]
    ], head:[0,1.495,.75], hind:[2,4], fore:[7,9], legX:.225, skin:'shishi', hoof:false,
  }
};
const jointOrder=['trunk','mask','leg-1,-1','leg-1,1','leg1,-1','leg1,1'];
const smooth = T.MathUtils.smoothstep;

function skin(body,plan,material,group,type) {
  const centers=new T.CatmullRomCurve3(plan.profile.map(([z,y])=>new T.Vector3(0,y,z)));
  const radii=new T.CatmullRomCurve3(plan.profile.map(([, , w,h])=>new T.Vector3(w,h,0)));
  let startLegs, endLegs;
  const faces=[], pos=[], uv=[], flank=[], joints=[], weights=[], regular=[], caps=[], soften=[], welds=[];
  const rows=(plan.profile.length-1)*4, sides=32;
  const joint=(x,y,z,u,v,bone=0,amount=0,fu=u,fv=v,flankWeight=0)=>{
    const i=pos.length/3;
    pos.push(x,y,z);uv.push(u,v);flank.push(fu,fv,flankWeight);
    joints.push(0,bone,0,0);weights.push(1-amount,amount,0,0);return i;
  };
  const point=i=>new T.Vector3().fromArray(pos,i*3);
  const patch=[];
  const head=group(body,'mask',...plan.head);
  const anchors={};
  for(const s of [-1,1]) for(const f of [-1,1]) {
    const [a,b]=f<0?plan.hind:plan.fore;
    const z=(plan.profile[a][0]+plan.profile[b][0])*.5, y=centers.getPoint((a+b)*2/rows).y;
    const bone=jointOrder.indexOf('leg'+s+','+f);
    const anchor=new T.Vector3(s*plan.legX,y-.035,z);
    group(body,jointOrder[bone],...anchor.toArray());anchors[bone]=anchor;
    patch.push({s,f,bone,j0:a*4,j1:b*4,k0:s<0?17:25,k1:s<0?23:31});
  }
  for(let j=0;j<=rows;j++){
    const t=j/rows,center=centers.getPoint(t), r=radii.getPoint(t),dir=centers.getTangent(t);
    for(let k=0;k<=sides;k++){
      const a=k*tau/sides;
      const spine=type==='boar' ? Math.max(0,Math.sin(a))**13 * .055*Math.sin(Math.PI*Math.min(1,t/.65)) : 0;
      // The pelvis and scapula run diagonally under the hide. Give them
      // separate ridges with a hollow behind each, including the opposite flank.
      const side=Math.abs(Math.cos(a)), level=Math.sin(a), section=j/4;
      const haunch=Math.exp(-((section-(plan.hind[0]+.95-.62*level))**2)/.94);
      const scapula=Math.exp(-((section-(plan.fore[0]+.83-.78*level))**2)/.48);
      const flankHollow=Math.exp(-((section-(plan.hind[1]+.46-.38*level))**2)/.66);
      const relief=side**2*(.15*haunch+.13*scapula-.115*flankHollow);
      const x=r.x*(1+relief)*Math.cos(a), y=center.y+r.y*dir.z*level+spine,z=center.z-r.y*dir.y*level;
      const weight=plan.shortNeck ? smooth(t,.70,.99) : smooth(t,type==='deer'?.40:type==='boar'?.51:.53,type==='deer'?.64:type==='boar'?.69:.72);
      const index=joint(x,y,z,plan.shortNeck?t:.774*t,1-k/sides,1,weight);
      regular.push(index);
      if(patch.some(p=>j>=p.j0-3&&j<=p.j1+3&&k>=p.k0-2&&k<=p.k1+2))soften[index]=1;
      if(j===rows || k===sides || patch.some(p=>j>=p.j0&&j<p.j1&&k>=p.k0&&k<p.k1))continue;
      const i=j*(sides+1)+k;
      faces.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);
    }
  }
  startLegs=faces.length;
  for(const {s,f,bone,j0,j1,k0,k1} of patch){
    const perimeter=[], idx=(j,k)=>regular[j*(sides+1)+k];
    for(let k=k0;k<k1;k++)perimeter.push(idx(j0,k));
    for(let j=j0;j<j1;j++)perimeter.push(idx(j,k1));
    for(let k=k1;k>k0;k--)perimeter.push(idx(j1,k));
    for(let j=j1;j>j0;j--)perimeter.push(idx(j,k0));
    const root=anchors[bone],lo=new T.Vector3(Infinity,0,Infinity),hi=new T.Vector3(-Infinity,0,-Infinity);
    const ring=perimeter.map(point);
    for(const p of ring){lo.min(p);hi.max(p);}
    const middle=lo.clone().lerp(hi,.5);
    const angles=ring.map(p=>Math.atan2((p.z-middle.z)/(hi.z-lo.z),(p.x-middle.x)/(hi.x-lo.x)));
    const shoulder=ring.reduce((a,p)=>a+p.y,0)/ring.length, heavy=type==='shishi'||type==='tiger', pig=type==='boar';
    const upper=plan.upper??(heavy?.161:pig?.122:.087), ankle=plan.ankle??(heavy?.072:pig?.046:.033);
    const hind=f<0, feline=type==='tiger'||type==='shishi';
    const hock=hind?-(type==='boar'?.106:heavy?.19:.15):-.027;
    const bend=hind?(feline?.17:pig?.104:.133):-(feline?.095:.056);
    const thigh=hind?(feline?1.28:1.15):.96;
    const sections=[
      [.90,.008,upper*1.08,upper*1.18,.19],[.76,bend*.28,upper*thigh,upper*1.35*thigh,.46],
      [.59,bend,upper*.77,upper*.94,.78],[.46,bend*.72,upper*.66,upper*.68,.96],
      [.31,hock*.80,ankle*1.21,ankle*1.53,1],[.23,hock,ankle*1.17,ankle*1.46,1],
      [.155,hock+.008,ankle*.89,ankle,1],[.098,hock+.034,ankle*1.17,ankle*1.55,1],
      [.067,hock+.052,ankle*(heavy?2.10:1.16),ankle*(heavy?2.17:1.44),1],
      [.036,hock+.077,ankle*(heavy?1.91:1.20),ankle*(heavy?2.34:1.65),1],
      [.017,hock+.069,ankle*(heavy?1.62:.91),ankle*(heavy?1.47:1.32),1]
    ];
    // Give both sides of the atlas seam a shared position, weight and normal.
    // Interpolating from torso UVs across the entire print to the leg strip
    // otherwise leaves a horizontal band across the moving shoulder.
    let last=perimeter.map((original,i)=>{
      const p=ring[i],dup=joint(p.x,p.y,p.z,plan.shortNeck?0:.803,.5+.475*Math.cos(angles[i]),joints[4*original+1],weights[4*original+1],uv[2*original],uv[2*original+1],1);
      welds.push([original,dup]);soften[dup]=1;return dup;
    });
    for(const [height,zOff,w,depth,weight] of sections){
      const next=[];
      for(let i=0;i<angles.length;i++){
        const a=angles[i],x=root.x+s*.014+w*Math.cos(a);
        const z=root.z+zOff+depth*Math.sin(a),y=height*shoulder;
        // The first two rings follow the axilla and the fold behind the stifle.
        const ease=Math.min(1,(1-height)*4.3);
        const xx=T.MathUtils.lerp(ring[i].x,x,ease),zz=T.MathUtils.lerp(ring[i].z,z,ease);
        const anchorUV=perimeter[i]*2;
        const shoulderU=uv[anchorUV],shoulderV=uv[anchorUV+1];
        const q=joint(xx,y+height**3*(ring[i].y-shoulder),zz,plan.shortNeck?1-height:.803+(1-height)*.193,.5+.475*Math.cos(a),bone,weight,
          shoulderU, T.MathUtils.lerp(shoulderV,.25,1-height), smooth(height,.48,.98));
        next.push(q);
        soften[q]=height>.65?1:height>.3?.42:.13;
      }
      for(let i=0;i<next.length;i++){const k=(i+1)%next.length;faces.push(last[i],last[k],next[i],last[k],next[k],next[i]);}
      last=next;
    }
    const sole=joint(root.x+s*.014,.012,root.z+hock+.069,.996,.5,bone,1);
    for(let i=0;i<last.length;i++)faces.push(last[i],last[(i+1)%last.length],sole);
    caps.push({side:s,front:f,bone,group:body.getObjectByName(jointOrder[bone]),x:s*.014,y:-root.y+.027,z:hock+.084,r:ankle});
  }
  endLegs=faces.length;
  // The two narrow poles close the muzzle and root of the tail.
  for(const j of [0,rows]){
    const c=centers.getPoint(j/rows),i=joint(0,c.y,c.z,.774*j/rows,.5,1,j?1:0);
    for(let k=0;k<sides;k++){const v=j*(sides+1)+k;faces.push(i,j?v:v+1,j?v+1:v);}
  }
  // Relax the shoulder/stifle across the shared edge, including two rings of
  // torso. A flat rectangular opening otherwise imprints its corners in profile.
  const neighbours=Array.from({length:pos.length/3},()=>new Set());
  for(let i=0;i<faces.length;i+=3){
    for(let k=0;k<3;k++){
      const a=faces[i+k],b=faces[i+(k+1)%3];neighbours[a].add(b);neighbours[b].add(a);
    }
  }
  for(let j=0;j<=rows;j++){const a=j*(sides+1);welds.push([a,a+sides]);}
  for(const [a,b] of welds) {
    const shared=new Set([...neighbours[a],...neighbours[b]]);
    neighbours[a]=neighbours[b]=shared;soften[a]=soften[b]=Math.max(soften[a]||0,soften[b]||0);
  }
  const targets=soften.flatMap((strength,i)=>strength?[i]:[]);
  const next=Float32Array.from(pos);
  for(let lap=0;lap<14;lap++){
    for(const i of targets){
      const near=neighbours[i];if(!near.size)continue;
      for(let k=0;k<3;k++){
        let sum=0;for(const a of near)sum+=pos[3*a+k];
        next[3*i+k]=T.MathUtils.lerp(pos[3*i+k],sum/near.size,.39*soften[i]);
      }
    }
    for(const i of targets){pos[i*3]=next[i*3];pos[i*3+1]=next[i*3+1];pos[i*3+2]=next[i*3+2];}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('flankInk',new T.Float32BufferAttribute(flank,3));
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));
  geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  geo.setIndex(faces);geo.computeVertexNormals();
  const normals=geo.getAttribute('normal'), v=new T.Vector3(),w=new T.Vector3();
  for(const [i,j] of welds) {
    v.fromBufferAttribute(normals,i).add(w.fromBufferAttribute(normals,j)).normalize();
    normals.setXYZ(i,v.x,v.y,v.z);normals.setXYZ(j,v.x,v.y,v.z);
  }
  if(Array.isArray(material)){
    geo.addGroup(0,startLegs,0);
    geo.addGroup(startLegs,endLegs-startLegs,1);
    geo.addGroup(endLegs,faces.length-endLegs,0);
  }
  const mesh=new T.SkinnedMesh(geo,material);
  mesh.name='絵巻の一枚皮';mesh.castShadow=mesh.receiveShadow=true;
  body.add(mesh);
  brushContour(mesh);
  return {head,caps};
}

export function bindScrollSkin(root) {
  const mesh=root.getObjectByName('絵巻の一枚皮');
  if(!mesh)return;
  // A cached Object3D clone carries its template's skeleton by default.
  // Every animal needs its own matrices when several deer walk together.
  root.updateMatrixWorld(true);
  const bones=jointOrder.map(name=>root.getObjectByName(name));
  const skeleton=new T.Skeleton(bones);
  mesh.bind(skeleton);
  mesh.getObjectByName('墨の輪郭')?.bind(skeleton,mesh.bindMatrix);
}

function dab(b,path,width,thickness,color,normal=[1,0,0]) {
  const line=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p)));
  const out=new T.Vector3(...normal).normalize(), s=new T.Vector3(),tangent=new T.Vector3(),v=new T.Vector3();
  const xyz=[],ix=[], around=6,rows=path.length>10?14:Math.max(9,path.length*2);
  for(let i=0;i<=rows;i++){
    const t=i/rows,p=line.getPoint(t), tip=.025+.975*Math.sin(Math.PI*t**.78)**.70;
    line.getTangent(t,tangent);
    s.crossVectors(tangent,out);
    if(s.lengthSq()<.001)s.crossVectors(tangent,new T.Vector3(0,1,0));
    s.normalize();v.crossVectors(s,tangent).normalize();
    for(let k=0;k<around;k++){
      const a=k*tau/around;
      xyz.push(...p.clone().addScaledVector(s,Math.cos(a)*width*tip).addScaledVector(v,Math.sin(a)*thickness*tip).toArray());
      if(i<rows){
        const x=i*around+k,y=i*around+(k+1)%around;
        ix.push(x,x+around,y,x+around,y+around,y);
      }
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  geo.setIndex(ix);geo.computeVertexNormals();b.add(geo,color);geo.dispose();
}
function twig(b,path,radius,col) {
  inkVolume(b,path.map((p,i)=>[...p,radius*(1-i/(path.length-1))**.55+.001,radius*.86*(1-i/(path.length-1))**.67+.001]),col,path.length*4);
}
function splitFoot(b,c,hoof){
  const {x,y,z,r}=c;
  for(const d of (hoof?[-1,1]:[-1.5,-.5,.5,1.5])){
    const xx=x+d*r*(hoof?.46:.71),width=r*(hoof?.64:.57),length=r*(hoof?2:1.72);
    inkVolume(b,[[xx,y+.029,z-length*.57,width*.61,.028],
      [xx,y+.009,z-length*.14,width,.023],[xx+d*.002,y-.002,z+length*.40,width*.87,.019],
      [xx+d*.003,y-.005,z+length*.70,width*.44,.011],[xx+d*.005,y-.003,z+length*.78,.002,.003]],
      hoof?'#635e50':'#c5b79b',12);
    if(!hoof)dab(b,[[xx-width*.43,y+.02,z],[xx-width*.34,y+.021,z+.015],
      [xx-width*.32,y+.014,z+.036]],.004,.003,softInk,[0,1,0]);
  }
}
function skullSurface(plan){
  const line=new T.CatmullRomCurve3(plan.profile.map(([z,y])=>new T.Vector3(0,y,z)));
  const radii=new T.CatmullRomCurve3(plan.profile.map(([, , w,h])=>new T.Vector3(w,h,0)));
  return (section,angle,off=.004)=>{
    const t=section/(plan.profile.length-1),p=line.getPoint(t),v=line.getTangent(t),r=radii.getPoint(t);
    return new T.Vector3((r.x+off)*Math.cos(angle),p.y+(r.y+off)*Math.sin(angle)*v.z,p.z-(r.y+off)*Math.sin(angle)*v.y);
  };
}
function eyes(b,surface,section,s,type){
  const a=s>0?.29:Math.PI-.29, p=surface(section,a,.012);
  const normal=surface(section,a+.015).sub(surface(section,a-.015))
    .cross(surface(section+.02,a).sub(surface(section-.02,a))).normalize();
  const forward=new T.Vector3(0,0,1).addScaledVector(normal,-normal.z).normalize();
  const lift=new T.Vector3().crossVectors(normal,forward).normalize();if(lift.y<0)lift.multiplyScalar(-1);
  const width=type==='shishi'?.105:type==='boar'?.045:.066;
  const height=width*(type==='shishi'?.52:type==='deer'?.47:.38);
  const basis=(x,y,d)=>p.clone().addScaledVector(forward,x*width).addScaledVector(lift,y*height).addScaledVector(normal,d).toArray();
  function almond(w,h,base,col){
    const xyz=[...basis(0,0,base+.010)],indices=[];
    for(let i=0;i<32;i++){
      const a=tau*i/32,x=Math.cos(a),y=Math.sin(a),tip=.78+.22*Math.abs(y);
      xyz.push(...basis(x*w,(y*tip-.18*x)*h,base-.009*x*x));indices.push(0,1+i,1+(i+1)%32);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(indices);
    geo.computeVertexNormals();b.add(geo,col);geo.dispose();
  }
  almond(1.14,1.12,.002,ink);almond(.91,.76,.01,type==='shishi'?'#d8c68d':'#e1d7b9');
  const pupil=basis(.20,.025,.024);b.ball(...pupil,width*.32,height*.73,width*.31,ink);
  const glint=basis(.30,.45,.042);b.ball(...glint,.0048,.006,.0048,ivory);
  dab(b,[basis(-1.32,.14,-.014),basis(-.53,1,.007),basis(.22,.99,.01),basis(1.16,-.19,-.007)],
    width*.096,.004,ink,normal.toArray());
  dab(b,[basis(-1.34,1.05,-.018),basis(-.73,1.68,-.002),basis(.27,1.59,.004),basis(1.06,.88,-.012)],
    type==='shishi'?.021:.008,.005,type==='shishi'?ink:softInk,normal.toArray());
}
function pinna(b,base,end,width,s,boar=false){
  const start=new T.Vector3(...base),tip=new T.Vector3(...end),nx=new T.Vector3(0,.12,1).normalize();
  const axis=tip.clone().sub(start),side=axis.clone().cross(nx).normalize();
  const vertex=(t,w,off)=>start.clone().addScaledVector(axis,t).addScaledVector(side,w).addScaledVector(nx,off).toArray();
  const xyz=[],faces=[],colors=['#a79a80','#bcb097',ink,'#c4af92',boar?'#a8937d':'#bbaa91'];
  const hoops=[[0,0,-.016],[1.0,-.5,-.017],[1.045,0,.003],[.92,.2,.020],[.70,.35,.022],[.006,.3,-.002]];
  const count=32;
  for(const [r,slant,depth] of hoops) for(let i=0;i<count;i++) {
    const a=tau*i/count, t=.5+.49*r*Math.sin(a),w=width*r*Math.cos(a)*(1.16-.67*t);
    xyz.push(...vertex(t,w,depth+.011*slant*Math.sin(a)+.014*Math.cos(a)**2));
  }
  for(let j=0;j<hoops.length-1;j++){
    faces.length=0;
    for(let i=0;i<count;i++) {
      const k=j*count+i,n=j*count+(i+1)%count;
      faces.push(k,n,k+count,n,n+count,k+count);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    g.setIndex(faces);g.computeVertexNormals();b.add(g,colors[j]);g.dispose();
  }
  dab(b,[vertex(.17,s*.005,.012),vertex(.34,-s*.013,.011),vertex(.53,-s*.006,.011),vertex(.76,s*.007,.013)],
    .005,.003,softInk,[0,0,1]);
}
function stagAntler(b,s) {
  const beam=[[s*.108,1.862,.666],[s*.14,1.994,.657],[s*.20,2.141,.583],
    [s*.283,2.315,.496],[s*.34,2.463,.323],[s*.385,2.582,.247]];
  twig(b,beam,.035,'#84725c');
  for(const [path,w] of [
    [[beam[1],[s*.144,2.081,.728],[s*.165,2.139,.811],[s*.184,2.195,.843]],.027],
    [[beam[2],[s*.252,2.233,.650],[s*.306,2.343,.668]],.024],
    [[beam[3],[s*.345,2.392,.518],[s*.414,2.461,.514],[s*.455,2.506,.526]],.025],
    [[beam[4],[s*.326,2.551,.355],[s*.33,2.616,.379]],.017]
  ])twig(b,path,w,'#96836c');
  for(let i=0;i<5;i++){
    const t=i/5,y=1.889+t*.12;
    dab(b,[[s*(.102+.020*t),y,.674],[s*(.119+.014*t),y+.010,.688],[s*(.135+.021*t),y+.016,.661]],
      .0028,.003,ink,[s,.1,.35]);
  }
}
function ungulate(body,head,plan,type,{group,batch},tail) {
  const deer=type==='deer',surface=skullSurface(plan);
  const details=group(head,'面相の筆',0,-plan.head[1],-plan.head[2]);
  for(const s of [-1,1]){
    const base=deer?[s*.091,1.799,.704]:[s*.128,.819,.646];
    const ear=group(details,'pinna'+s,...base),end=deer?[s*.281,.207,-.108]:[s*.128,.268,-.130];
    batch(ear,b=>pinna(b,[0,0,0],end,deer?.069:.093,s,!deer));
  }
  batch(details,b=>{
    for(const s of [-1,1]){
      eyes(b,surface,deer?13.30:11.25,s,type);
      if(deer){
        stagAntler(b,s);
      }else{
        const tusk=[[s*.093,.556,.988],[s*.134,.526,1.015],[s*.166,.536,1.049],
          [s*.191,.593,1.054],[s*.178,.647,1.047]];
        twig(b,tusk,.039,'#d2bd91');
        dab(b,[tusk[0],tusk[1],tusk[2],tusk[3]],.004,.002,'#aa9576',[s,.13,.48]);
      }
      const trace=(list,w,col,off=.009)=>dab(b,list.map(([q,a])=>surface(q,s>0?a:Math.PI-a,off).toArray()),w,.003,col,[s,0,.12]);
      trace(deer?[[15.0,-.23],[15.8,-.42],[16.5,-.47],[17.45,-.28]]:[[13.05,-.26],[14.10,-.47],[15.10,-.39],[15.85,-.20]],.007,ink);
      trace(deer?[[13.70,-.16],[14.0,-.29],[14.7,-.35]]:[[11.6,-.18],[12,-.31],[12.6,-.34]],.0045,softInk);
      if(!deer)for(let i=0;i<6;i++)trace([[10.8+i*.10,-.30],[11.75+i*.11,-.65],[12.60+i*.10,-.87]],.005,i%2?ink:softInk,.009);
    }
    const z=deer?1.105:1.176,y=deer?1.694:.565;
    inkVolume(b,[[0,y,z-.035,deer?.068:.085,.045],[0,y+.004,z-.008,deer?.065:.096,deer?.039:.069],
      [0,y+.005,z+.014,deer?.048:.086,deer?.032:.060],[0,y+.005,z+.022,.01,.014]],
      deer?'#50483b':'#9b7c68',12);
    for(const s of [-1,1]){
      const x=s*(deer?.039:.045), yy=y+.011;
      dab(b,[[x-s*.008,yy-.012,z+.016],[x-s*.005,yy+.005,z+.021],[x+s*.005,yy+.013,z+.016]],deer?.006:.009,.004,ink,[0,0,1]);
    }
  });
  batch(tail,b=>{
    if(deer){
      inkVolume(b,[[0,0,0,.071,.056],[0,-.055,-.064,.092,.067],[0,-.124,-.118,.076,.044],
        [0,-.201,-.132,.039,.027],[.008,-.238,-.114,.002,.003]],'#e3dbc3',16);
      for(const s of [-1,1])dab(b,[[s*.041,-.025,-.046],[s*.072,-.086,-.123],[s*.043,-.171,-.151],
        [s*.006,-.222,-.132]],.008,.004,ink,[s*.7,0,-1]);
    }else{
      twig(b,[[0,0,0],[.054,.027,-.114],[.09,-.031,-.163],[.067,-.083,-.132],
        [.052,-.072,-.1],[.069,-.04,-.111],[.118,-.074,-.184],[.119,-.165,-.233]],.023,softInk);
      dab(b,[[.118,-.114,-.207],[.119,-.163,-.234],[.088,-.238,-.261]],.022,.013,ink);
    }
  });
  if(!deer)batch(body,b=>{
    // Bristles follow the high muscular ridge of the boar, falling away over the rump.
    for(let i=0;i<33;i++){
      const q=2.33+i*.189,a=Math.PI*.5+.19*Math.sin(i*2.4);
      const p=surface(q,a,.038),h=.011+.019*Math.sin(i/33*Math.PI)+.005*Math.cos(i);
      dab(b,[[p.x,p.y-.004,p.z+.005],[p.x+.002,p.y+.010,p.z-.020],
        [p.x+.006,p.y+h,p.z-.079],[p.x+.009,p.y+h*.89,p.z-.113]],
        .0037,.002,i%4?'#837d69':'#655f51');
    }
  });
}

function curlyLock(b,path,w,out,i){
  // One brush-loaded lock, folded over its dark edge. Fine parallel lines travel
  // along the curl instead of cross-hatching it like a solid horn.
  const line=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p)));
  const front=new T.Vector3(...out).normalize(),side=new T.Vector3(),tan=new T.Vector3(),r=new T.Vector3();
  const fur=i%3?'#c6b89e':'#ae9f86';
  dab(b,path,w,w*.41,ink,out);
  function thread(fraction,surface) {
    const pts=[];
    for(let k=0;k<=12;k++){
      const t=.027+.95*k/12,p=line.getPoint(t),taper=.025+.975*Math.sin(Math.PI*t**.78)**.70;
      line.getTangent(t,tan);
      side.crossVectors(tan,front).normalize();r.crossVectors(side,tan).normalize();
      pts.push(p.addScaledVector(side,w*fraction*taper).addScaledVector(r,w*surface*taper+.0009).toArray());
    }
    return pts;
  }
  dab(b,thread(-.06,.30),w*.82,w*.20,fur,out);
  dab(b,thread(-.34,.49),w*.105,.0028,'#e1d4b6',out);
  dab(b,thread(.29,.48),w*.049,.0021,'#706955',out);
}
function maneMantle(head,mat) {
  const pos=[],uv=[],ix=[],rows=42,sides=76;
  for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){
    const t=j/rows,a=tau*k/sides,sn=Math.sin(a),cs=Math.cos(a);
    const sweep=Math.sin(t*Math.PI),wave=Math.sin(a*11+2.2*t+.64*Math.sin(t*6+a*2));
    const join=1.-.77*smooth(t,.80,1);
    const w=(.247+.126*sweep+.021*wave)*join;
    const h=(.262+.123*sweep+.077*t+.023*wave)*join;
    const hem=.075*Math.sin(a*9+1.1)+.032*Math.cos(a*5);
    const z=1.144-.60*t+hem*smooth(t,.59,.84)-.035*Math.cos(a*3)*sweep;
    const y=1.690-.255*t+sn*h+.025*Math.cos(a*3)*sweep;
    pos.push(cs*w,y,z);uv.push(t,1-k/sides);
    if(j<rows&&k<sides){const i=j*(sides+1)+k;ix.push(i,i+sides+1,i+1,i+1,i+sides+1,i+sides+2);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const m=new T.Mesh(geo,mat);m.name='波状のたてがみ';m.castShadow=m.receiveShadow=true;head.add(m);
}
function plume(parent,mat){
  const path=new T.CatmullRomCurve3([[.086,.574,-.323],[.085,.704,-.312],[.140,.809,-.380],
    [.172,.856,-.479],[.158,.837,-.571],[.106,.801,-.666],[.125,.832,-.773]].map(p=>new T.Vector3(...p)));
  const pos=[],uv=[],ix=[],sides=34,rows=30;
  for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){
    const t=j/rows,a=k*tau/sides,p=path.getPoint(t),d=path.getTangent(t);
    const r=Math.max(.003,Math.sin(Math.PI*t**.83)*(.147+.013*Math.cos(a*7+t*5)));
    const lateral=new T.Vector3(1,0,0).addScaledVector(d,-d.x).normalize();
    p.addScaledVector(lateral,r*Math.cos(a)).addScaledVector(d.clone().cross(lateral),r*.80*Math.sin(a));
    pos.push(...p.toArray());uv.push(t,1-k/sides);
    if(j<rows&&k<sides){const n=j*(sides+1)+k;ix.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;parent.add(m);
}
function shishi(body,head,plan,{group,batch},tail,variant,coat) {
  const surface=skullSurface(plan),details=group(head,'唐獅子の面',0,-plan.head[1],-plan.head[2]);
  maneMantle(details,coat('shishi','mane'));
  batch(details,b=>{
    for(const s of [-1,1]){
      eyes(b,surface,13.09,s,'shishi');
      pinna(b,[s*.176,1.867,.917],[s*.338,2.026,.845],.107,s);
      // Some locks break free from the broad painted mantle at the nape.
      for(let k=0;k<5;k++){
        const f=k/4, y=1.893-.502*f+.024*Math.sin(k*2),z=.827+.056*Math.sin(k*2),x=.232+.073*Math.sin(Math.PI*f);
        const path=[[s*x,y+.012,z+.077],[s*(x+.071),y+.034,z-.001],
          [s*(x+.11),y-.018,z-.114],[s*(x+.096),y-.071+.037*Math.cos(k),z-.210],
          [s*(x+.10),y+.022+.032*Math.sin(k),z-.299],
          [s*(x+.062),y+.074+.084*Math.sin(k*1.4),z-.357-.028*k]];
        curlyLock(b,path,.041+.009*Math.sin(f*Math.PI),[s,.13,-.08],k);
      }
      for(let tier=0;tier<3;tier++){
        const y=1.79-.102*tier,x=.207+.026*tier,z=.889+.019*tier;
        curlyLock(b,[[s*x,y+.037,z+.061],[s*(x+.064),y+.056,z+.025],
          [s*(x+.111),y+.003,z-.056],[s*(x+.126),y-.071,z-.114],
          [s*(x+.111),y-.119,z-.102],[s*(x+.083),y-.132,z-.037],
          [s*(x+.065),y-.085,z+.002]],.051-.004*tier,[s,.16,.33],tier+2);
      }
      for(let k=0;k<4;k++){
        const y=1.956-.103*k,z=1.077+.014*Math.cos(k);
        const path=[[s*.156,y+.050,z-.021],[s*.229,y+.068,z+.004],[s*.281,y+.031,z+.043],
          [s*.286,y-.041,z+.047],[s*.242,y-.073,z+.035],[s*.217,y-.044,z+.025],
          [s*.232,y-.017,z+.043]];
        curlyLock(b,path,.033,[s,.1,.33],k+1);
      }
      for(let k=0;k<3;k++){
        const x=s*(.082+.053*k),y=1.927+.020*k,z=1.184-.036*k;
        const path=[[x-s*.023,y-.026,z+.037],[x+s*.046,y+.043,z+.005],
          [x+s*.101,y+.052,z-.070],[x+s*.089,y+.017,z-.121],[x+s*.059,y+.005,z-.114]];
        curlyLock(b,path,.039,[s*.45,.94,.25],k);
      }
      const pos=(q,a,off)=>surface(q,s>0?a:Math.PI-a,off).toArray();
      dab(b,[pos(14.05,.13,.008),pos(14.83,.27,.010),pos(15.48,.35,.010),pos(16.42,.52,.008)],
        .016,.006,softInk,[s,0,.1]);
      for(let k=0;k<3;k++) {
        const y=1.633-.016*k;
        dab(b,[[s*.139,y,1.331],[s*.214,y-.010,1.305],[s*.287,y-.01+.007*k,1.253],
          [s*(.317+.011*k),y+.009,1.175]],.004-.0006*k,.002,ink,[s,-.1,.2]);
      }
    }
    for(let k=-2;k<=2;k++){
      const x=k*.044;
      curlyLock(b,[[x,1.908,1.035],[x+.018,2.026,1.005],[x+.04,2.067,.923],
        [x+.024,2.077,.825],[x-.007,2.12,.791]],.042,[k*.12,.87,.44],k+2);
    }
    const chin=variant?.011:-.084;
    // Lower lip and mandible have their own expressive silhouette in the paired lions.
    inkVolume(b,[[0,1.546,.983,.118,.082],[0,1.522,1.098,.197,.088],
      [0,1.512+chin*.29,1.211,.182,.065],[0,1.536+chin*.75,1.331,.159,.051],
      [0,1.561+chin,1.411,.137,.042],[0,1.576+chin,1.446,.060,.025]],'#d9cbb0',19);
    inkVolume(b,[[0,1.568,1.125,.170,.045],[0,1.557+chin*.45,1.237,.171,.041],
      [0,1.575+chin*.81,1.337,.147,.031],[0,1.588+chin,1.407,.092,.016]],'#695243',15);
    if(!variant)for(const s of [-1,1]){
      twig(b,[[s*.148,1.617,1.297],[s*.152,1.579,1.310],[s*.147,1.553,1.330]],.017,ivory);
      twig(b,[[s*.13,1.522,1.371],[s*.136,1.550,1.376],[s*.133,1.565,1.373]],.014,ivory);
    }
    inkVolume(b,[[0,1.694,1.408,.095,.048],[0,1.721,1.439,.141,.056],
      [0,1.724,1.481,.123,.053],[0,1.703,1.499,.065,.032],[0,1.682,1.501,.014,.010]],'#6a6150',14);
    for(const s of [-1,1]) {
      dab(b,[[s*.043,1.706,1.494],[s*.06,1.726,1.497],[s*.083,1.739,1.486],[s*.10,1.731,1.470]],
        .010,.005,ink,[s*.3,.05,1]);
      for(let k=0;k<4;k++){
        const x=s*(.04+k*.037),y=1.481+chin*.6,z=1.249-k*.013;
        curlyLock(b,[[x,y+.025,z],[x+s*.019,y-.066,z-.021],[x+s*.033,y-.132,z-.076],
          [x+s*.064,y-.14,z-.144]],.026,[s*.55,-.3,.63],k);
      }
    }
  });
  plume(tail,coat('shishi','mane'));
  batch(tail,b=>{
    inkVolume(b,[[0,0,0,.094,.083],[.021,.026,-.157,.063,.056],[.064,.103,-.325,.040,.042],
      [.114,.261,-.415,.033,.032],[.126,.434,-.416,.032,.03],[.095,.619,-.339,.036,.041],
      [.068,.716,-.262,.051,.045]],'#b3a48a',24);
    for(let k=0;k<15;k++){
      const a=tau*k/15,x=.058+.061*Math.cos(a),y=.626+.086*Math.sin(a);
      const r=.164+.094*(.5+.5*Math.cos(a));
      const path=[[.082,.551,-.325],[x,y+.044,-.326],[x+r*.6,y+.166,-.339],
        [x+r*.82,y+.195,-.432],[x+r*.44,y+.169,-.578],[x+r*.15,y+.121,-.662],
        [x+r*.32,y+.196+.033*Math.cos(k),-.739]];
      curlyLock(b,path,.033,[Math.cos(a),.36,Math.sin(a)],k);
    }
  });
}

// Both sides of a moving shoulder sample the *same* pigment at the stitch.
const legPaint = new WeakMap();
function legMaterials(type, coat) {
  const body = coat(type,'body');
  const leg = ['fox','tiger','kirin'].includes(type) ? coat(type,'leg') : body;
  if (!legPaint.has(body)) {
    const paint = leg.clone();
    paint.onBeforeCompile = (shader, renderer) => {
      leg.onBeforeCompile(shader, renderer);
      // Texture requests finish asynchronously and already-instantiated herds share the update.
      shader.uniforms.flankMap = { get value() { return body.map; } };
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 flankInk; varying vec3 vFlankInk;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFlankInk=flankInk;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D flankMap; varying vec3 vFlankInk;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          #ifdef USE_MAP
            diffuseColor.rgb=mix(diffuseColor.rgb, texture2D(flankMap,vFlankInk.xy).rgb,vFlankInk.z);
          #endif`);
    };
    paint.customProgramCacheKey = () => leg.customProgramCacheKey()+'-shoulder';
    // Preloads are optional. A clone made before a coat arrives must see the
    // texture and switch programs at the same time as the ordinary leg coat.
    paint.color=leg.color;
    if (!leg.map) leg.addEventListener('pigmentready',()=>{paint.map=leg.map;paint.needsUpdate=true;});
    legPaint.set(body,[body,paint]);
  }
  return legPaint.get(body);
}

export function buildScrollBeast(root,type,{group,batch},variant,coat){
  const plan=plans[type],body=group(root,'trunk');
  const {head,caps}=skin(body,plan,legMaterials(type,coat),group,type);
  for(const c of caps)batch(c.group,b=>splitFoot(b,c,plan.hoof));
  const p=plan.profile[1];
  const tail=group(body,'tail',0,p[1]+(type==='shishi'?.138:.055),p[0]);
  if(type==='shishi')shishi(body,head,plan,{group,batch},tail,variant,coat);
  else ungulate(body,head,plan,type,{group,batch},tail);
  bindScrollSkin(root);
}

// At each touchdown, the cloven shell and its underlying weighted sole are rigid
// relative to that leg. Sample their support patch once from the finished model.
export const kirinTouchdowns=[];
function measureKirinSole(c,hoof,skin) {
  const leg=new T.Object3D(),trunk=new T.Object3D(),matrix=new T.Matrix4();
  leg.position.copy(c.group.position);
  poseKirinLeg(leg,c.side,0);
  poseKirinTrunk(trunk,hoofPhase(c.side,c.front));
  leg.updateMatrix();trunk.updateMatrix();
  matrix.multiplyMatrices(trunk.matrix,leg.matrix);
  const samples=[], vertex=new T.Vector3();
  let bottom=Infinity;
  function sample() {
    vertex.applyMatrix4(matrix);
    samples.push(vertex.clone());bottom=Math.min(bottom,vertex.y);
  }
  const shell=hoof.geometry.attributes.position;
  for(let i=0;i<shell.count;i++){vertex.fromBufferAttribute(shell,i);sample();}
  const {position,skinIndex,skinWeight}=skin.geometry.attributes;
  for(let i=0;i<position.count;i++) {
    if(skinIndex.getY(i)!==c.bone || skinWeight.getY(i)<.9999)continue;
    vertex.fromBufferAttribute(position,i).sub(c.group.position);sample();
  }
  const bounds=new T.Box3();
  for(const v of samples)if(v.y<=bottom+.007)bounds.expandByPoint(v);
  const sole=bounds.getCenter(new T.Vector3());sole.y=bottom;
  const index=(c.side<0?0:2)+(c.front<0?0:1);
  kirinTouchdowns[index]=sole;
}

// Fox, tiger and kirin keep their individual masks, flame ruffs and brush tails.
// Their formerly overlapping leg, breast and neck meshes now share shoulder vertices.
export function buildQuadrupedTrunk(body,type,trunk,neckTop,length,wide,group,batch,coat) {
  const high=type==='kirin'?1.26:type==='tiger'?.87:.62;
  const profile=trunk.slice(0,7).map(([,y,z,w,h])=>[z,y,w,h]);
  profile.push([length*.63,high+.092,wide*.93,wide*1.04],
    [length*.76,high+.205,wide*.74,wide*.82],
    [length*.80,(high+neckTop)*.50+.09,wide*.66,wide*.75],
    [length*.86,neckTop,wide*.58,wide*.62],
    [length*.92,neckTop+.07,wide*.47,wide*.50]);
  const plan={profile,shortNeck:true,head:[0,neckTop,length*.86],
    hind:[1,3],fore:[5,7],legX:wide*.70,upper:type==='tiger'?.119:type==='kirin'?.104:.078,
    ankle:type==='tiger'?.059:type==='kirin'?.037:.035};
  const {head,caps}=skin(body,plan,legMaterials(type,coat),group,type);
  for(const c of caps) {
    const hoof=batch(c.group,b=>splitFoot(b,c,type==='kirin'));
    if(type==='kirin')measureKirinSole(c,hoof,body.getObjectByName('絵巻の一枚皮'));
  }
  return head;
}
