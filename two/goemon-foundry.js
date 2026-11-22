// Outside the firebox the same casting was installed in very different ways.
// Local supplies determine the masonry, hearth furniture and wooden cover.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';

const {PI,cos,sin,abs,sqrt}=Math,turn=2*PI;
const kilns={
  'peach-hearth':   ['split','kiln','plum',7,'#8e7860','#75624e'],
  'snow-hearth':    ['ring','stack','snow',8,'#747b74','#515e58'],
  'capital-hearth': ['split','pot','wave',9,'#938374','#74675b'],
  'temple-hearth':  ['split','kiln','lotus',8,'#947967','#745d4b'],
  'north-pass-hearth':['ring','stack','pine',7,'#717566','#535d52'],
  'west-beach':     ['stave','pan','shell',9,'#938577','#756e62'],
  'morning-beach':  ['stave','pot','sun',8,'#a18d76','#7c7260'],
  'south-cove':     ['stave','pan','wave',7,'#8a8177','#6b736b'],
  'tsuruga-beach':  ['stave','stack','pine',9,'#969489','#6a7774'],
  'willow-weir':    ['weir','pot','willow',8,'#8a8771','#626f62'],
  'sweetfish-weir': ['weir','pan','fish',7,'#949181','#687570']
};
const soot='#4f5148',iron='#525957',edge='#828980',reed='#ab9468';
const plane=(pts,faces)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));g.setIndex(faces);g.computeVertexNormals();return g;};
function lattice(nx,ny,sample){
  const p=[],index=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    p.push(sample(i/nx,j/ny));const k=p.length-1;
    if(j<ny&&i<nx)index.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);
  }
  return plane(p,index);
}
function tube(s,color,pts,r,steps=pts.length-1){s.stroke(color,pts,pts.map(()=>r),steps);}
function turned(a){return new T.LatheGeometry(a.map(([r,y])=>new T.Vector2(r,y)),30);}
function band(s,color,r,y,depth,height,rough=0){
  const g=lattice(90,6,(u,v)=>{const a=turn*u,b=turn*v;
    const rr=r+depth*cos(b)+rough*(.48*sin(7*a)+.52*cos(19*a));
    return [rr*cos(a),y+height*sin(b),rr*sin(a)];});
  s.add(g,color);
}
function castSkin(p,form,mark,seed){
  const at=(a,y,r)=>[r*cos(a),y,r*sin(a)];
  // Casting flange with a folded underside. It arrests the kettle on the
  // masonry. Leave a notch on the service side for the visible split pin.
  const rings=[[1.004,.765],[1.063,.816],[1.156,.826],[1.197,.859],[1.185,.883],[1.059,.891],[1.021,.902]];
  p.add(lattice(88,6,(u,v)=>{const a=u*turn,[r,y]=rings[Math.round(v*6)];
    const rr=r+.005*cos(19*a+seed)+.008*cos(7*a);
    return at(a,y+.006*cos(6*a+.3*seed),rr);}),iron);
  band(p,edge,1.178,.870,.015,.008,.007);
  if(form==='stave'||form==='weir'){
    const count=form==='stave'?23:17;
    const dyes=form==='stave'?['#a49172','#9b8568','#b3a080','#a19377']:['#8c8e69','#818461','#a6a07b','#90906b'];
    for(let i=0;i<count;i++){
      const a=(i+.014)*turn/count,b=(i+.986)*turn/count;
      const crest=form==='weir'?.06+.035*cos(2*a):.076;
      const ht=1.12+crest*(1.2-.45*cos(a))+.009*sin(7*i+seed);
      const levels=[[1.037,.89],[1.09,.912],[1.108,ht-.027],[1.099,ht],[1.065,ht],[1.058,.944]];
      p.add(lattice(3,5,(u,v)=>{const theta=a+(b-a)*u,[r,y]=levels[Math.round(v*5)];return at(theta,y,r+.003*sin(PI*u));}),dyes[(i+seed)%4]);
      if(i%2===0)tube(p,'#80785c',[at(a+.024,.981,1.102),at(a+.032,1.047,1.106),at(a+.019,ht-.024,1.109)],.0035,3);
    }
    for(const y of [.946,1.082])band(p,form==='weir'?'#6e7257':'#626964',1.104,y,.012,.014);
  }else{
    for(const [r,y] of [[1.067,.969],[1.073,1.033]])band(p,'#7b8076',r,y,.009,.008,.003);
    // Two raised halves of the foundry's sand mould meet behind the ears.
    for(const side of [-1,1])tube(p,'#73776b',[[.856*side,.60,.05],[.971*side,.747,.063],[1.044*side,.897,.055],[1.069*side,1.07,.052]],.013,10);
  }
  // The foot of a riveted lug is shaped like a leaf. Both the pivot and the
  // aperture of the forged drop handle remain legible at eye height.
  for(const side of [-1,1]){
    const a=.43+(side<0?PI:0),rotate=-a;
    const pad=new T.Shape();pad.moveTo(-.081,0);pad.quadraticCurveTo(-.21,.08,-.161,.16);
    pad.quadraticCurveTo(-.10,.27,0,.323);pad.quadraticCurveTo(.116,.252,.16,.162);
    pad.quadraticCurveTo(.177,.076,.081,0);pad.closePath();
    const lug=new T.ExtrudeGeometry(pad,{depth:.046,bevelEnabled:true,bevelThickness:.008,bevelSize:.009,bevelSegments:1,curveSegments:5});
    const radius=form==='stave'||form==='weir'?1.108:1.068;
    p.add(lug,'#65685c',radius*cos(a),.903,radius*sin(a),1,.82,1,0,PI/2+rotate);
    const path=[[-.102,.17],[-.165,.10],[-.162,-.039],[-.091,-.134],[0,-.160],[.091,-.134],[.162,-.039],[.165,.10],[.102,.17]];
    const place=(w,h,extra)=>[(radius+extra)*cos(a)-w*sin(a),.922+h,(radius+extra)*sin(a)+w*cos(a)];
    tube(p,'#595e56',path.map(([w,h])=>place(w,h,.104)),.032,22);
    for(const w of [-.096,.096])p.ball('#8e8978',...place(w,.174,.061),.041,.033,.043);
  }
  // An iron badge, cast with the kettle. It is fixed at the front-left
  // where a bather approaching the stairs can see the local mould mark.
  const a=2.27,r=1.092,pivot=(u,y,out=0)=>[(r+out)*cos(a)-u*sin(a),.988+y,(r+out)*sin(a)+u*cos(a)];
  const badge=lattice(26,4,(u,v)=>{const theta=u*turn,rr=v;return pivot(.155*rr*cos(theta),.099*rr*sin(theta),.025+.019*(1-rr*rr));});
  p.add(badge,'#6b7069');
  const line=(arr,width=.008)=>tube(p,'#aea48b',arr.map(([u,y])=>pivot(u,y,.045)),width,Math.max(8,arr.length*3));
  if(['plum','lotus','sun','snow'].includes(mark)){
    for(let i=0,n=mark==='plum'?5:mark==='lotus'?7:6;i<n;i++){
      const a=turn*i/n;
      const pts=mark==='snow'?[[.017,0],[.065,0],[.047,.019],[.069,0]]:[[.010,0],[.055,-.020],[.077,0],[.055,.020],[.013,0]];
      line(pts.map(([x,y])=>[cos(a)*x-sin(a)*y,sin(a)*x+cos(a)*y]));
    }
  }else if(mark==='pine'||mark==='willow'){
    line([[-.067,-.057],[.004,-.012],[.037,.069]]);
    for(let i=0;i<5;i++){const y=i*.016-.025;line([[-.063+i*.01,y+.027],[i*.01-.017,y],[.079-i*.005,y+.019]],.007);}
  }else{
    const n=mark==='shell'?5:3;
    for(let i=0;i<n;i++)line(mark==='shell'?[[0,-.052],[(i-2)*.022,.032],[(i-2)*.039,.057]]:
      [[-.102,-.043+i*.040],[-.034,-.066+i*.04],[.023,-.020+i*.034],[.098,-.045+i*.034]]);
  }
}
function hearthStone(p,angle,span,lo,hi,radius,rough,tint,seed,form){
  // Chamfer all twelve arrises of each wedge independently. The bed joints
  // remain open to the dark firebrick behind rather than painted on flat.
  const n=9,verts=[],idx=[],rings=[[.035,.12],[.013,.24],[.009,.86],[.030,.97],[.12,1.005]];
  for(let line=0;line<rings.length;line++)for(let i=0;i<n;i++){
    const t=i/(n-1),[trim,ht]=rings[line],a=angle+span*(trim+(1-2*trim)*t);
    const bulge=sin(t*PI);
    // Charcoal kilns stand on a squared footing; river cairns bulge in the
    // cross-current. The salt houses dress their range to an eight-sided bed.
    const outline=form==='split'?.135*sin(2*a)**2:form==='weir'?.095*sin(a)**2+.027*cos(5*a):
      form==='stave'?.055*(1-cos(8*a))*.5:.029*cos(6*a);
    const r=radius+outline*(1-.45*lo)+(line===0?-.045:line===4?-.10:0)+rough*(.25*sin(23*a+seed)+.75*bulge);
    const y=lo+(hi-lo)*ht+.013*sin(3*a+seed)+.011*bulge*cos(6*seed);
    verts.push([-r*cos(a),y,r*sin(a)]);
    const k=line*n+i;if(line&&i)idx.push(k-n-1,k,k-1,k-n-1,k-n,k);
  }
  const g=plane(verts,idx);p.add(g,tint);
}
function firebox(p,form,base,dark,seed){
  const tint=new T.Color();
  for(let row=0;row<3;row++){
    const n=form==='weir'?15:form==='stave'?11:row===1?13:10;
    const cut=.57-(row===2?.26:0),angles=[];
    for(let j=0;j<=n;j++){const t=j/n;angles.push(cut+(turn-2*cut)*t+(j>0&&j<n?.032*sin(j*9+row+seed):0));}
    for(let i=0;i<n;i++){
      const a=angles[i],span=angles[i+1]-a;
      tint.set((i+row+seed)%4===0?dark:base).multiplyScalar(.81+.25*(.5+.5*cos(i*2.913+row*4+seed)));
      hearthStone(p,a,span,.021+row*.190,.04+(row+1)*.191,
        1.226-row*.035,form==='weir'?.073:.039,tint,seed+i+row*4,form);
    }
  }
  const ash=new T.Color('#908674');
  for(let j=0;j<9;j++){
    // Each voussoir is a wedge aligned to the vault of the actual stoke hole.
    const a=j*PI/9+.009,b=(j+1)*PI/9-.009;
    const stone=lattice(5,5,(u,v)=>{
      const theta=a+(b-a)*u,levels=[[.48,-1.068],[.48,-1.145],[.491,-1.197],[.625,-1.220],[.650,-1.198],[.653,-1.06]];
      const [r,x]=levels[Math.round(v*5)];return [x+.04*cos(theta)**2,.099+sin(theta)*r*.71,cos(theta)*r];});
    p.add(stone,ash.set(j===4?'#a2957e':base).multiplyScalar(.88+.14*cos(j*4+seed)));
  }
  // Split cordwood has a bark arc and a flat end grain, then a glowing
  // cracked face towards the back of the actual firebox.
  for(let j=0;j<4;j++){
    const z=(j-1.5)*.119,x=-1.22+.039*sin(j+seed),y=.092+.035*(j%2);
    const verts=[],ix=[];const prof=[[.07,0],[.101,.05],[.067,.093],[.02,.103],[-.053,.086],[-.076,.044],[-.063,.013],[0,0]];
    for(const end of [0,1])for(const [w,h] of prof)verts.push([x+.67*end,y+h+end*.028,z+w+.028*end]);
    for(let i=0;i<7;i++)ix.push(i,8+i,i+1,i+1,8+i,9+i);
    p.add(plane(verts,ix),'#534c43');
    const face=verts.slice(0,8);p.add(plane(face,[[0,1,2],[0,2,3],[0,3,4],[0,4,5],[0,5,6]].flat()),'#9d805c');
    tube(p,'#685942',[[x-.001,y+.008,z],[x-.001,y+.051,z-.011],[x-.001,y+.083,z+.009]],.005,3);
  }
}
function lid(p,form,count,seed){
  // The second leaf of the round cedar cover rests outside the bathing well.
  // Each plank is sawn to the circle, then pinned against two cross-battens.
  const r=.94,angle=form==='weir'?1.16:form==='stave'?.81:1.03;
  const at=(x,z,thick=0)=>[x,.97-z*sin(angle)+thick*cos(angle),-1.055+z*cos(angle)+thick*sin(angle)];
  const tints=['#ae926b','#bda17c','#a58d6a','#bea986','#998469'];
  for(let i=0;i<count;i++){
    const a=-r+i*2*r/count+.005,b=-r+(i+1)*2*r/count-.005;
    const surface=(u,v,t)=>{const x=a+(b-a)*u;return at(x,-sqrt(Math.max(0,r*r-x*x))*v,t);};
    p.add(lattice(6,3,(u,v)=>surface(u,v,.034)),tints[(i+seed)%5]);
    p.add(lattice(6,1,(u,v)=>surface(u,1,-.028+.062*v)),'#927b5b');
    for(const end of [0,1])p.add(lattice(1,2,(u,v)=>surface(end,v,-.026+.060*u)),'#88795e');
    for(let s=0;s<2;s++){
      const u=.32+.34*s+.06*sin(seed+i),x=a+(b-a)*u,len=sqrt(r*r-x*x);
      if(len<.25)continue;
      const pts=Array.from({length:7},(_,j)=>at(x+.010*sin(j*1.4+2*i+.8*s),-len*(.11+j*.123),.036));
      tube(p,i%3?'#8e7b5d':'#a9936c',pts,.0027,7);
    }
  }
  for(const z of [-.235,-.53]){
    const w=sqrt(r*r-z*z)-.027;
    const profile=[[-w,0],[-w+.042,.047],[w-.042,.047],[w,0]];
    p.add(lattice(3,1,(u,v)=>{const [x,ht]=profile[Math.round(u*3)];return at(x,z+(v-.5)*.073,.036+ht);}),reed);
    for(const x of [-w*.78,w*.78])p.ball(soot,...at(x,z,.085),.018,.012,.016);
  }
  const a=at(-.16,-.26,.07),b=at(.16,-.26,.07),m=at(0,-.26,.18);
  tube(p,form==='weir'?'#8a8c66':'#756b50',[a,[a[0],m[1],m[2]],m,[b[0],m[1],m[2]],b],.024,14);
}
function flueAndBoiler(p,form,tool,base,seed){
  // The offset range shares the firebed and vents to the rear. The small
  // pot/pan heats wash water; the high mountain sites instead have a flue.
  const x=-1.07,z=-1.09,height=tool==='stack'?.99:.66;
  const stone=turned([[.19,0],[.434,.025],[.428,.13],[.40,.18],[.382,.56],[.407,.58],[.401,.649],[.301,.656],[.262,.56]]);
  p.add(stone,base,x,0,z,1,height/.66,1);
  const trim=(r,y,w,h,shade)=>p.add(turned([[r-w,y-h],[r+w,y-h],[r+w,y+h],[r-w,y+h]]),shade,x,0,z);
  trim(.389,height*.78,.018,.015,'#7e7d6b');
  if(tool==='stack'||tool==='kiln'){
    p.add(turned([[.21,0],[.257,.012],[.264,.05],[.213,.084],[.199,.35],[.211,.42],[.247,.435],[.245,.479],[.191,.482],[.173,.439],[.168,.30]]),
      tool==='stack'?'#585e58':'#886f58',x,height-.049,z,1,tool==='stack'?1.0:.82,1);
    for(const off of [-1,1]){
      p.add(lattice(4,4,(u,v)=>[x+off*(.045+.245*v),height+.66-.118*v,z+(u-.5)*.55]),'#646c65');
      p.post(soot,x+off*.15,height+.456,z-.10,.014,.27,.014);
    }
  }else{
    const pot=tool==='pot',col=pot?'#747f75':'#9c8060',h=height-.061;
    p.add(turned(pot?[[.104,0],[.179,.015],[.248,.095],[.255,.22],[.222,.303],[.214,.319],[.183,.313]]:
      [[.117,0],[.189,.012],[.268,.071],[.341,.177],[.348,.19],[.321,.202],[.307,.182],[.174,.048],[.002,.043]]),
      col,x,h,z);
    if(pot){
      p.add(turned([[.002,.346],[.13,.343],[.209,.313],[.212,.297],[.178,.291]]),'#858b7e',x,h,z);
      p.ball('#595f56',x,h+.355,z,.051,.031,.047);
      p.add(lattice(20,9,(u,v)=>{const a=u*turn,r=.074-.034*v;return [x+.196+.220*v+sin(a)*r*.6,h+.135+.149*v+cos(a)*r,z+sin(a)*r];}),'#7a8478');
      tube(p,'#5b6358',Array.from({length:15},(_,j)=>{const a=j*PI/14;return [x+cos(a)*.213,h+.247+.255*sin(a),z-.017*sin(a)];}),.024,18);
    }else{
      const liquid=lattice(30,3,(u,v)=>[x+.304*v*cos(turn*u),h+.162+.004*sin(turn*u*4)*v,z+.304*v*sin(turn*u)]);
      p.add(liquid,'#98a39a');
      for(const side of [-1,1])tube(p,'#6c6f61',[[x+side*.297,h+.119,z-.063],[x+side*.373,h+.189,z-.050],[x+side*.398,h+.196,z+.034],[x+side*.312,h+.12,z+.069]],.016,8);
    }
  }
}
function fireTongues(p,seed){
  const chr=['#cd4a22','#e9692a','#c95728','#f09546'];
  for(let i=0;i<24;i++){
    const t=i/23,x=-1.112+.31*((i*7%23)/23),z=(t-.5)*.66+.016*cos(i),y=.12+.014*sin(i*5+seed);
    const r=.038+.031*(.5+.5*cos(i*3)),h=.08+.138*(.5+.5*sin(i*2.5+seed));
    p.add(lattice(6,5,(u,v)=>{
      const a=turn*u,rad=r*(1-v)**.67*(.87+.43*sin(PI*v));
      return [x+rad*cos(a)+v*v*(.027*cos(i)),y+h*v,z+rad*sin(a)*.74+v*v*.033*sin(i*3)];
    }),chr[i%4]);
  }
}
export function dressFoundry(art,flames,id,kind,bank,seed){
  const [form,tool,mark,boards,stone,shade]=kilns[id]??kilns[kind==='fisher'?(bank==='river'?'willow-weir':'west-beach'):'peach-hearth'];
  castSkin(art,form,mark,seed);firebox(art,form,stone,shade,seed);
  lid(art,form,boards,seed);flueAndBoiler(art,form,tool,stone,seed);fireTongues(flames,seed);
}
let fire;
export function foundryFire(){
  if(fire)return fire;
  const time={value:0};
  fire=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
  fire.onBeforeCompile=shader=>{
    shader.uniforms.fireSeconds=time;
    shader.vertexShader='uniform float fireSeconds; varying float coalGlow;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nfloat f=sin(5.7*fireSeconds+position.x*32.)*.55+cos(8.1*fireSeconds+position.z*38.)*.45; float h=max(0.,position.y-.13); transformed.y+=.22*f*h; transformed.z+=.06*h*sin(fireSeconds*7.+position.x*13.);coalGlow=.93+.15*f;');
    shader.fragmentShader='varying float coalGlow;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=coalGlow;');
  };
  fire.onBeforeRender=()=>{time.value=performance.now()/1000;};
  return fire;
}
