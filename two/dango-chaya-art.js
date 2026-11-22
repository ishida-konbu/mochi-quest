import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { paintedPanels, waysideMaterials, cedarPole, hippedThatch } from './wayside-hut-art.js';

const {sin,cos,PI}=Math, tau=2*PI;
const cedar=1, clay=2, reed=3;
const wood='#75624c', iron='#49443d', bamboo='#c2a171', porcelain='#e3d8bb';
const cache=new Map();
let fabric;

function paintedCloth(){
  if(!fabric){
    const map=new T.TextureLoader().load(new URL('./assets/world/dango-chaya-dyes.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    fabric=new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide});
  }
  return fabric;
}

function siding(s,a,b,base,top,tile,tint){
  s.panel(tile,tint,6,4,(u,v)=>[
    a[0]+(b[0]-a[0])*u,base+(top-base)*v,a[1]+(b[1]-a[1])*u+.018*sin(PI*u)*sin(PI*v),
  ]);
}
function tabletop(s,p,x0,x1,front,back,y){
  p.box(wood,(x0+x1)/2,y-.065,(front+back)/2,x1-x0,.117,front-back);
  for(let j=0;j<3;j++){
    const z=front-j*(front-back)/3;
    s.panel(cedar,j===1?'#e1cba4':'#f9e4bf',5,2,(u,v)=>[x0+(x1-x0)*u,y+.003*sin(PI*u),z-(front-back)*(v*.98)/3],[.02+j*.21,.08,.16,.84]);
  }
}
function forecourt(s,seed){
  // A low tamped-earth apron runs under the four legs and the fascia. The
  // tapered skirt sinks into the coarse triangles of the hillside terrain.
  function surface(u,v){
    const x=u*2-1,z=v*2-1,edge=Math.max(Math.abs(x),Math.abs(z));
    const gravel=.03*sin(x*9+z*3+seed)+.024*cos(x*6-z*8+seed);
    const verge=Math.max(0,(edge-.87)/.13);
    return [x*(3.31-.21*z**6+gravel),.046+.009*gravel-.19*verge*verge,
      .51+z*(2.95-.16*x**6+gravel)];
  }
  s.panel(clay,'#f5e8ca',20,20,(u,v)=>surface(u,1-v));
  const edges=[u=>[u,0],u=>[1,u],u=>[1-u,1],u=>[0,1-u]];
  for(const edge of edges)s.panel(clay,'#c8ba9e',18,3,(u,v)=>{
    const [x,y,z]=surface(...edge(u));
    return [x*(1+.051*v),y-.85*v,.51+(z-.51)*(1+.051*v)];
  });
}
function frame(s,p,seed){
  const left=-2.45,right=2.45,back=-1.85,front=1.85,beam=2.51;
  siding(s,[right,back],[left,back],.07,beam,clay,'#e6dbc6');
  siding(s,[left,back],[left,front],.07,beam,clay,'#efe3cb');
  siding(s,[right,front],[right,back],.07,beam,clay,'#f6ead5');
  s.panel(clay,'#d5bda0',5,5,(u,v)=>[left+(right-left)*u,.091,front-(front-back)*v]);
  for(const x of [left,right]){
    for(const z of [back,-.1,front]){
      cedarPole(s,[x,.045,z],[x+.025*sin(z+seed),beam+.03,z],.095,.079);
    }
    cedarPole(s,[x,beam-.03,back-.15],[x,beam,front+.12],.087,.083);
    cedarPole(s,[x,.21,back-.04],[x,.22,front+.02],.064,.059);
    // The lifted hipped roof exposes the diagonal braces over the shop front.
    cedarPole(s,[x,1.85,1.87],[x*.71,beam,1.87],.057,.049);
    cedarPole(s,[x,1.94,1.77],[x,beam,1.12],.061,.050);
  }
  for(const z of [back,front])cedarPole(s,[left-.13,beam,z],[right+.11,beam+.014,z],.114,.096);
  for(const x of [-.98,.68])cedarPole(s,[x,.07,back+.025],[x+.03,beam,back+.025],.069,.062);
  // Split-bamboo laths and earthen knee walls show a brighter edge around
  // the dark interior, with a clear centre passage through the front.
  for(const [a,b] of [[left,-2.12],[1.44,right]]){
    siding(s,[a,front],[b,front],.08,.93,reed,'#d8c5a0');
    cedarPole(s,[a,.93,front],[b,.94,front],.063,.060);
    for(const x of [a,b])cedarPole(s,[x,.08,front+.04],[x,.96,front+.04],.043,.04);
  }
  hippedThatch(s,p,seed,.48);
}
function noren(s,p,cloth,seed){
  cedarPole(s,[-2.52,2.32,2.48],[2.55,2.35,2.48],.047,.038,'#e7d7a3');
  for(const x of [-2.33,2.33]){
    cedarPole(s,[x,2.45,1.77],[x,2.31,2.55],.058,.037);
    p.stroke('#9d8761',[[x-.05,2.33,2.46],[x,2.38,2.51],[x+.055,2.31,2.53]],[.016,.019,.014],5);
  }
  // Each of the four curtain leaves is separately hemmed and lifts a little
  // at the split. The lettering stays registered across the tied upper rail.
  for(let j=0;j<4;j++){
    const left=-2.16+j*1.08,phase=.59*seed+j*.8;
    cloth.panel(0,'#fffaf0',16,7,(u,v)=>{
      const drape=(1-v),sag=sin(PI*u),fold=sin(5*PI*u+phase);
      return [left+.021+1.034*u+.025*drape*sin(phase+v*PI),2.31-(.74+.078*sag+.032*sin(phase))*drape,
        2.489+.044*fold+.045*drape*sag+.030*sin(phase+v*3)*drape];
    },[j*.25+.003,0,.244,1]);
    for(const t of [.16,.79]){
      const x=left+1.08*t;p.stroke('#676a62',[[x,2.26,2.47],[x,2.34,2.45],[x,2.37,2.486],[x,2.32,2.52]],[.024,.024,.024,.019],6);
    }
  }
  // Independent bamboo tea standard stands beyond the eaves and above the
  // bench, readable from the road even when the roofs overlap in the camera.
  const x=2.92,z=2.70;
  cedarPole(s,[x,0,z],[x-.055,3.96,z-.035],.057,.032,'#dac998');
  cedarPole(s,[x-.14,3.81,z],[x-.96,3.73,z+.14],.028,.021,'#e7d3a1');
  const flagAt=(u,v)=>[x-.12-.79*(1-u)+.048*sin(PI*(1-v))*(1-u),
    1.59+2.14*v+.075*u+.047*sin(PI*u)*(1-v),
    z+.075+.13*(1-u)+.083*sin(PI*(2*u+.85*v)+seed*.34)*(1.1-u)];
  cloth.panel(1,'#fff9ea',12,20,flagAt);
  for(const v of [.065,.48,.91])p.stroke('#c3b38d',[flagAt(1,v),[x+.02,1.665+2.14*v,z+.06],[x+.04,1.68+2.14*v,z-.005]],[.019,.019,.013],5);
  for(const u of [.12,.84]){
    const a=flagAt(u,1);p.stroke('#c3b38d',[a,[a[0],a[1]+.057,a[2]-.028],[a[0],a[1]+.045,a[2]-.068]],[.018,.019,.015],5);
  }
}

function bench(s,p,cloth){
  for(const x of [.74,2.53])for(const z of [2.42,2.84])cedarPole(s,[x,.03,z],[x,.43,z],.066,.060);
  cedarPole(s,[.68,.19,2.59],[2.63,.21,2.59],.055,.050);
  tabletop(s,p,.54,2.74,2.96,2.30,.462);
  // One continuous sweep goes up the back hem, across the seat and down the
  // front lip. Its soft edge and the cedar visible at both ends give it depth.
  const profile=[[2.275,.32],[2.286,.445],[2.31,.48],[2.42,.483],[2.79,.482],[2.943,.48],[2.972,.443],[2.978,.35],[2.99,.266]];
  cloth.panel(3,'#faeedf',24,profile.length-1,(u,v)=>{
    const [z,y]=profile[Math.round(v*(profile.length-1))];
    const hem=Math.max(0,(.46-y)/.2);
    return [.64+1.99*u,y+hem*.018*sin(u*11),z+hem*.013*sin(u*18)];
  });
}
function vessel(p,tint,x,y,z,profile,segments=20){
  const lathe=new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),segments);
  p.add(lathe,tint,x,y,z);
}
function chawan(p,x,y,z,scale=1){
  const profile=[[.001,0],[.064,0],[.064,.025],[.084,.033],[.132,.071],[.153,.137],[.152,.151],[.141,.155],[.132,.127],[.106,.085],[.052,.065],[.001,.064]]
    .map(([r,h])=>[r*scale,h*scale]);
  vessel(p,porcelain,x,y,z,profile);
  p.ball('#7b7847',x,y+.122*scale,z,.129*scale,.007*scale,.129*scale);
  // A smudged blue slip under the rim, interrupted where the brush lifts.
  const arc=Array.from({length:9},(_,i)=>[x+.146*scale*cos(i*.63),y+(.127+.006*sin(i))*scale,z+.146*scale*sin(i*.63)]);
  p.stroke('#747e77',arc,arc.map((_,i)=>(i===0||i===8?.002:.0065)*scale),11);
}
function kettle(p,x,y,z){
  vessel(p,'#a28466',x,y,z,[[.002,0],[.23,.01],[.26,.05],[.28,.24],[.31,.29],[.306,.34],[.26,.34],[.24,.26],[.043,.23]]);
  p.ball('#443a30',x,y+.27,z,.241,.035,.241);
  for(let i=0;i<4;i++)p.ball(i%2?'#825e47':'#a66c47',x+.14*cos(i*1.8),y+.306,z+.14*sin(i*1.8),.083,.036,.044,0,i*.72);
  y+=.34;
  vessel(p,iron,x,y,z,[[.001,0],[.15,.007],[.23,.047],[.286,.148],[.279,.24],[.239,.3],[.14,.341],[.122,.351],[.116,.328]]);
  vessel(p,'#574f42',x,y,z,[[.001,.326],[.152,.330],[.159,.346],[.129,.359],[.077,.378],[.001,.381]]);
  p.ball('#524c40',x,y+.407,z,.038,.039,.038);
  const handle=Array.from({length:11},(_,i)=>{const a=PI*i/10;return [x+.224*cos(a),y+.252+.376*sin(a),z-.023*cos(a)];});
  p.stroke(iron,handle,handle.map((_,i)=>i===0||i===10?.029:.022),14);
  for(const side of [-1,1])p.ball('#6b5e4d',x+.227*side,y+.259,z-.023*side,.043,.046,.043);
  // The raised tapered spout has an actual dark opening in its cut tip.
  const spout=new T.CatmullRomCurve3([new T.Vector3(x-.213,y+.142,z),new T.Vector3(x-.313,y+.187,z+.014),new T.Vector3(x-.376,y+.285,z+.035),new T.Vector3(x-.432,y+.319,z+.047)]);
  const rings=spout.getPoints(12),points=[],index=[];
  for(let i=0;i<rings.length;i++){
    const t=i/(rings.length-1), axis=spout.getTangent(t).normalize(),normal=new T.Vector3(0,0,1).cross(axis).normalize(),across=axis.clone().cross(normal);
    for(let j=0;j<=12;j++){
      const a=j*tau/12,r=.112-.062*t+.007*t*t*t*t;
      points.push(...rings[i].clone().addScaledVector(normal,r*cos(a)).addScaledVector(across,r*sin(a)).toArray());
      if(i<rings.length-1 && j<12){const k=i*13+j;index.push(k,k+1,k+13,k+13,k+1,k+14);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(index);g.computeVertexNormals();p.add(g,iron);
  const end=rings.at(-1);p.ball('#3b342f',end.x+.01,end.y-.008,end.z,.034,.025,.043);
}
const dumplings=new Map();
function grilledRice(glazed,variant){
  const key=variant+(glazed?3:0);
  if(dumplings.has(key))return dumplings.get(key);
  const g=new T.SphereGeometry(1,20,14),points=g.attributes.position,colors=[];
  const base=new T.Color(glazed?'#b68049':'#f2e4c4'),toast=new T.Color(glazed?'#71482e':'#ac7950'),shine=new T.Color(glazed?'#e3b36d':'#ebcc96');
  const shade=new T.Color();
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i),phase=variant*.81;
    const dents=.019*sin(x*5+y*4+phase)*cos(z*6-y);
    points.setXYZ(i,x*(1+dents),y*(.98+dents),z*(1+dents));
    const scorched=Math.min(1,Math.max(0,(y+.23*x+.10*z-.67)*3+.19*sin(x*13+z*8+phase)));
    const streak=Math.max(0,1-7*Math.abs(x+.29+.18*z)) * Math.max(0,(y-.4)*1.65);
    shade.copy(base).lerp(toast,scorched*(glazed?.92:.66)).lerp(shine,streak*(glazed?.83:.22));
    colors.push(shade.r,shade.g,shade.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();dumplings.set(key,g);return g;
}
function skewer(p,x,y,z,glazed,angle=0,dye='#ffffff'){
  const at=(d,h=0)=>[x+sin(angle)*d,y+h,z+cos(angle)*d];
  p.stroke(bamboo,[at(-.24),at(.03),at(.40)],[.013,.014,.01],5);
  for(let i=0;i<3;i++){
    const pos=at(.075-i*.130,.022+.005*cos(i*2));
    p.add(grilledRice(glazed,i),dye,...pos,.085,.079,.086,.07*i,angle+.08*i,.08*sin(i));
  }
}
function service(s,p,cloth){
  // A street-side grill shows the skewers and the glow through its cast
  // earthen lip. Bare bamboo handles project beyond the front of the coals.
  const left=-2.40,right=-.63;
  for(const x of [left+.10,right-.10])for(const z of [1.28,2.54])cedarPole(s,[x,.05,z],[x,.86,z],.066,.063);
  tabletop(s,p,left,right,2.62,1.21,.86);
  siding(s,[left+.06,2.55],[right-.06,2.55],.20,.8,cedar,'#d1b995');
  cloth.panel(2,'#f9ebce',16,5,(u,v)=>[left+.109+1.556*u,.232+.552*v+.014*sin(PI*u),2.565+.013*sin(PI*u)]);
  for(const x of [left+.17,right-.17])p.ball('#645343',x,.751,2.587,.021,.022,.012);
  const cx=-1.235,cz=2.23;
  p.box('#9c8770',cx,.93,cz,1.02,.139,.55);
  p.box('#4d4036',cx,1.004,cz,.91,.017,.43);
  for(const sign of [-1,1]){
    p.box('#8e7963',cx+.486*sign,1.061,cz,.053,.152,.55);
    p.box('#aa9374',cx,1.048,cz+.251*sign,.96,.124,.043);
  }
  for(let i=0;i<7;i++){
    const x=cx-.38+i*.122;
    p.ball(i%3?'#58463a':'#a36b44',x,1.048,cz+.04*sin(i*4),.077,.045,.13,.07,i*.46,.16*cos(i));
  }
  for(const sign of [-1,1])p.box(iron,cx,1.124,cz+.130*sign,1.03,.025,.024);
  for(let i=0;i<2;i++)skewer(p,cx-.342+i*.224,1.17,cz,true,.055*sin(i));
  s.panel(clay,'#a49a85',7,3,(u,v)=>[cx-.51+1.02*u,.865+.139*v,cz+.277]);
  for(const off of [-.30,0,.30]){
    p.box('#52483a',cx+off,.965,cz+.28,.122,.043,.011);
    p.box('#8c7c62',cx+off,.941,cz+.286,.136,.012,.018);
  }
  kettle(p,-2.12,.868,2.37);
  const boardY=.67;
  tabletop(s,p,-2.34,2.27,.59,-.39,boardY);
  for(const x of [-2.18,-.53,.87,2.08])cedarPole(s,[x,.06,.36],[x,boardY,.36],.06,.055);

  for(const [x,z] of [[1.36,.35],[1.63,.23],[-.10,.32]])chawan(p,x,boardY+.008,z,.79);
  // A cedar serving tray and a cup at the far end of the bench leave its
  // padded middle free for the seated visitor.
  p.box('#70513e',2.395,.505,2.58,.52,.047,.43);
  chawan(p,2.46,.531,2.53,.84);
  const sidePlate=[[.001,0],[.105,0],[.156,.016],[.166,.036],[.133,.03],[.056,.018],[.001,.018]];
  vessel(p,'#d6c8a8',.49,boardY+.005,.20,sidePlate);
  // Fired storage jars in the shade and the woven screen on the back wall
  // are visible through the waist-high opening from either side of the road.
  siding(s,[-.55,-1.80],[1.21,-1.80],.93,2.16,reed,'#d9cbac');
  for(const x of [-1.71,-1.14]){
    vessel(p,x<-1.4?'#8d7565':'#a09074',x,.11,-.79,[[.002,0],[.146,0],[.207,.11],[.254,.38],[.20,.56],[.13,.62],[.14,.66],[.108,.66],[.102,.61]]);
    p.ball('#5b5142',x,.735,-.79,.108,.015,.105);
  }
}

const localDumplings=new Map();
export function buildDangoChaya(variant=0,dye='#ffffff'){
  const seed=Math.abs(variant|0)%3;
  if(!cache.has(seed)){
    const s=paintedPanels(),p=sculpture(),cloth=paintedPanels();
    forecourt(s,seed);frame(s,p,seed);noren(s,p,cloth,seed);bench(s,p,cloth);service(s,p,cloth);
    cache.set(seed,[s.finish(),p.finish(),cloth.finish()]);
  }
  const root=new T.Group(),mats=[...waysideMaterials(),paintedCloth()];
  root.name='団子茶屋';
  if(!localDumplings.has(dye)){
    const tray=sculpture();
    for(let i=2;i<4;i++)skewer(tray,-1.235-.342+i*.224,1.17,2.23,false,.055*sin(i),dye);
    skewer(tray,.49,.753,.20,false,-.26,dye);
    localDumplings.set(dye,tray.finish());
  }
  const serving=new T.Mesh(localDumplings.get(dye),mats[1]);
  serving.name='土地の串団子';root.add(serving);
  const names=['茅葺きと木組み','火鉢と串団子','藍暖簾と茶幟'];
  for(const [i,geometry] of cache.get(seed).entries()){
    const mesh=new T.Mesh(geometry,mats[i]);mesh.name=names[i];
    mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  }
  return root;
}
